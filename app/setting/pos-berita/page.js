'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" fill="%23f3f4f6"><rect width="80" height="60" rx="4"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="8">No Img</text></svg>'
)}`;

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}${url}`;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-media/${url}`;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}

function compressImage(file, targetSizeKB = 200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const maxWidth = 1400;
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        // Isi putih dulu agar PNG transparan tidak jadi hitam
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const targetBytes = targetSizeKB * 1024;

        // Cek apakah kualitas penuh sudah di bawah target
        const fullBlob = await canvasToBlob(canvas, 1.0);
        if (fullBlob.size <= targetBytes) {
          resolve(new File([fullBlob], file.name, { type: 'image/jpeg' }));
          return;
        }

        // Binary search kualitas untuk mendekati target ~200KB
        let low = 0.1;
        let high = 1.0;
        let resultBlob = null;

        for (let i = 0; i < 10; i++) {
          const mid = (low + high) / 2;
          const blob = await canvasToBlob(canvas, mid);
          if (blob.size <= targetBytes) {
            resultBlob = blob;
            low = mid;
          } else {
            high = mid;
          }
        }

        if (resultBlob) {
          resolve(new File([resultBlob], file.name, { type: 'image/jpeg' }));
          return;
        }

        // Jika kualitas terendah masih di atas target, perkecil dimensi 70%
        w = Math.floor(w * 0.7);
        h = Math.floor(h * 0.7);
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        low = 0.1;
        high = 1.0;
        resultBlob = null;
        for (let i = 0; i < 10; i++) {
          const mid = (low + high) / 2;
          const blob = await canvasToBlob(canvas, mid);
          if (blob.size <= targetBytes) {
            resultBlob = blob;
            low = mid;
          } else {
            high = mid;
          }
        }

        const finalBlob = resultBlob || await canvasToBlob(canvas, 0.3);
        resolve(new File([finalBlob], file.name, { type: 'image/jpeg' }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'Siswa Berprestasi', label: 'Siswa Berprestasi' },
  { key: 'Berita Sekolah', label: 'Berita Sekolah' },
  { key: 'Draft', label: 'Draft' },
];

export default function PosBeritaPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Berita Sekolah',
    status: 'Draft',
    featured: false,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, sekolah: 0, prestasi: 0, views: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('news_posts').select('category, views');
      if (data) {
        setStats({
          total: data.length,
          sekolah: data.filter((d) => d.category === 'Berita Sekolah').length,
          prestasi: data.filter((d) => d.category === 'Siswa Berprestasi').length,
          views: data.reduce((sum, d) => sum + (d.views || 0), 0),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const openAddModal = () => {
    setEditData(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', category: 'Berita Sekolah', status: 'Draft', featured: false });
    setCoverFile(null);
    setCoverPreview('');
    setShowModal(true);
  };

  const openEditModal = (post) => {
    setEditData(post);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Berita Sekolah',
      status: post.status || 'Draft',
      featured: post.featured || false,
    });
    setCoverFile(null);
    setCoverPreview(post.cover_url || '');
    setShowModal(true);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Judul wajib diisi!');
    if (!form.slug.trim()) return alert('Slug wajib diisi!');

    setSaving(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      let coverUrl = editData?.cover_url || '';

      if (coverFile) {
        const compressed = await compressImage(coverFile);
        const ext = compressed.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('news-media')
          .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('news-media').getPublicUrl(fileName);
          coverUrl = urlData.publicUrl;
        } else {
          console.error('Upload gagal:', uploadErr);
          alert('Gagal upload cover, data tetap disimpan tanpa cover.');
        }
      }

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category,
        status: form.status,
        featured: form.featured,
        cover_url: coverUrl,
        author_id: userData.id || null,
        published_at: form.status === 'Publish' && !editData?.published_at ? new Date().toISOString() : editData?.published_at || null,
      };

      if (editData) {
        const { error } = await supabase.from('news_posts').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news_posts').insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      fetchPosts();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm(`Hapus berita "${post.title}"?`)) return;
    try {
      if (post.cover_url) {
        const fileName = post.cover_url.split('/').pop();
        await supabase.storage.from('news-media').remove([fileName]);
      }
      const { error } = await supabase.from('news_posts').delete().eq('id', post.id);
      if (error) throw error;
      fetchPosts();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    const val1 = prompt('Ketik "HAPUS SEMUA" untuk konfirmasi:');
    if (val1 !== 'HAPUS SEMUA') return alert('Konfirmasi dibatalkan.');
    const val2 = prompt('Ketik sekali lagi "HAPUS SEMUA" untuk memastikan:');
    if (val2 !== 'HAPUS SEMUA') return alert('Konfirmasi dibatalkan.');

    try {
      const { data: allPosts } = await supabase.from('news_posts').select('cover_url');
      if (allPosts) {
        const files = allPosts.map((p) => p.cover_url?.split('/').pop()).filter(Boolean);
        if (files.length > 0) {
          await supabase.storage.from('news-media').remove(files);
        }
      }
      const { error } = await supabase.from('news_posts').delete().neq('id', 0);
      if (error) throw error;
      fetchPosts();
      fetchStats();
      alert('Semua berita berhasil dihapus.');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleToggleFeatured = async (post) => {
    try {
      const { error } = await supabase
        .from('news_posts')
        .update({ featured: !post.featured })
        .eq('id', post.id);
      if (error) throw error;
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = posts.filter((p) => {
    const matchTab =
      activeTab === 'semua' ||
      (activeTab === 'Draft' ? p.status === 'Draft' : p.category === activeTab);
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const statCards = [
    { label: 'Total Berita', value: stats.total, gradient: 'from-blue-500 to-blue-600', icon: '📰' },
    { label: 'Berita Sekolah', value: stats.sekolah, gradient: 'from-purple-500 to-purple-600', icon: '🏫' },
    { label: 'Siswa Berprestasi', value: stats.prestasi, gradient: 'from-amber-500 to-amber-600', icon: '🏆' },
    { label: 'Total Dilihat', value: stats.views, gradient: 'from-emerald-500 to-emerald-600', icon: '👁️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pos Berita</h1>
            <p className="text-sm text-gray-500">Kelola berita siswa berprestasi & seputar sekolah</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              🗑️ Hapus Semua
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              + Tambah Berita
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-white shadow-sm`}
            >
              <span className="text-xl">{card.icon}</span>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
              <p className="text-xs text-white/80">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari judul berita..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Tidak ada berita ditemukan</div>
            ) : (
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Cover</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Judul</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Featured</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Views</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={getImageUrl(post.cover_url) || FALLBACK_IMG}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.src = FALLBACK_IMG;
                              e.target.onerror = null;
                            }}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800 max-w-xs truncate">{post.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{post.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            post.category === 'Siswa Berprestasi' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        >
                          {post.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            post.status === 'Publish'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleFeatured(post)}
                          className={`text-lg transition-transform ${post.featured ? 'scale-110' : 'opacity-30 hover:opacity-60'}`}
                          title={post.featured ? 'Hapus featured' : 'Jadikan featured'}
                        >
                          {post.featured ? '⭐' : '☆'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{post.views || 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => openEditModal(post)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editData ? 'Edit Berita' : 'Tambah Berita Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cover Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Berita</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                >
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={
                          coverFile
                            ? coverPreview
                            : getImageUrl(coverPreview) || coverPreview
                        }
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.src = FALLBACK_IMG;
                          e.target.onerror = null;
                        }}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <p className="text-xs text-gray-400 mt-2">Klik untuk ganti cover</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-400">Klik untuk upload cover</p>
                      <p className="text-xs text-gray-300">Otomatis dikompres ~200 KB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Berita *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) });
                  }}
                  placeholder="Masukkan judul berita..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug URL *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="slug-url-berita"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Berita Sekolah">Berita Sekolah</option>
                    <option value="Siswa Berprestasi">Siswa Berprestasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Publish">Publish</option>
                  </select>
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Jadikan Berita Utama (Featured)
                </label>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ringkasan</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Tulis ringkasan singkat..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konten Lengkap</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Tulis konten berita lengkap..."
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg shadow-sm transition-colors"
              >
                {saving ? '⏳ Menyimpan...' : editData ? 'Update Berita' : 'Simpan Berita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}