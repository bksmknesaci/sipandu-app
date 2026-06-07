"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import MajorLogoManager from '@/app/components/MajorLogoManager'; // ← TAMBAHAN
import { ArrowLeft, Save, Upload, School, BookOpen, Users, Trash2 } from 'lucide-react';

export default function ProfilSIPANDU() {
  const [loading, setLoading] = useState(true);
  const [namaSekolah, setNamaSekolah] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tentang, setTentang] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');
  const [tim, setTim] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [heroImages, setHeroImages] = useState([]);

  // Ambil data dari Supabase saat halaman dibuka
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    
    if (data) {
      setNamaSekolah(data.nama_sekolah || '');
      setAlamat(data.alamat || '');
      setTentang(data.tentang || '');
      setVisi(data.visi || '');
      setMisi(data.misi || '');
      setTim(data.tim || '');
      setFacebook(data.facebook || '');
      setInstagram(data.instagram || '');
      setYoutube(data.youtube || '');
      setTiktok(data.tiktok || '');
      setLogoUrl(data.logo_url || null);
      setHeroImages(data.hero_images || []);
    }
    setLoading(false);
  };

  // Persiapan upload logo baru (Hanya preview, upload asli saat Save)
  const handleLogoUpload = (e) => {
    if (e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Upload Hero Images ke Supabase Storage (Diperbaiki agar tidak tabrakan nama file)
const handleHeroUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (heroImages.length + files.length > 5) return alert('Maksimal 5 foto!');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Membuat nama file super unik: waktu + angka acak + index + ekstensi
    const fileExt = file.name.split('.').pop();
    const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(7)}_${i}.${fileExt}`;
    
    const { data, error } = await supabase.storage.from('assets').upload(fileName, file);
    
    if (error) {
      alert('Gagal upload foto ' + file.name + ': ' + error.message);
    } else {
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);
      if (urlData) {
        setHeroImages(prev => [...prev, urlData.publicUrl]);
      }
    }
  }
};

  // Hapus Hero Image dari daftar
  const handleDeleteImage = (indexToDelete) => {
    setHeroImages(heroImages.filter((_, index) => index !== indexToDelete));
  };

  // Simpan Semua Pengaturan ke Supabase Database
  const handleSave = async () => {
    let finalLogoUrl = logoUrl;

    // Jika ada logo baru yang dipilih, upload dulu ke Storage
    if (logoFile) {
      const fileName = `logo_${Date.now()}_${logoFile.name}`;
      const { data, error } = await supabase.storage.from('assets').upload(fileName, logoFile);
      if (data) {
        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(data.path);
        finalLogoUrl = urlData.publicUrl;
      } else {
        return alert('Gagal upload logo: ' + error.message);
      }
    }

    // Update tabel app_settings di Supabase
    const updates = {
      nama_sekolah: namaSekolah,
      alamat: alamat,
      tentang: tentang,
      visi: visi,
      misi: misi,
      tim: tim,
      facebook: facebook,
      instagram: instagram,
      youtube: youtube,
      tiktok: tiktok,
      logo_url: finalLogoUrl,
      hero_images: heroImages
    };

    const { error } = await supabase.from('app_settings').update(updates).eq('id', 1);
    
    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Pengaturan berhasil disimpan!');
      setLogoFile(null); // Reset file setelah sukses
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat pengaturan dari Supabase...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95 active:bg-blue-800 px-4 py-2 rounded-lg mb-6 transition-all duration-200">
  <ArrowLeft size={20} /> Kembali ke Dashboard
</Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><School size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Profil SIPANDU</h1>
            <p className="text-gray-500 text-sm">Kelola Manajemen Identitas Sekolah</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bagian Logo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border md:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={20}/> Upload Logo Aplikasi</h3>
            <div className="flex flex-col items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain rounded-lg border p-2" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed">No Logo</div>
              )}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
            </div>
          </div>

          {/* Bagian Informasi Sekolah */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><School size={20}/> Informasi Sekolah</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
              <input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekolah</label>
              <textarea rows="2" value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none" />
            </div>
          </div>

          {/* Bagian Media Sosial */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={20}/> URL Media Sosial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Youtube URL</label><input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label><input type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" /></div>
            </div>
          </div>

          {/* Bagian Tentang & Visi Misi */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 md:col-span-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BookOpen size={20}/> Tentang & Visi Misi</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tentang SIPANDU</label>
              <textarea rows="3" value={tentang} onChange={(e) => setTentang(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visi</label>
              <textarea rows="2" value={visi} onChange={(e) => setVisi(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Misi</label>
              <textarea rows="3" value={misi} onChange={(e) => setMisi(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tim Pengembang</label>
              <input type="text" value={tim} onChange={(e) => setTim(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
            </div>
          </div>

          {/* Bagian Hero Section Photos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 md:col-span-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Upload size={20}/> Foto Hero Dashboard (Maks. 5)</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {heroImages.map((img, index) => (
                <div key={index} className="relative group w-full h-24 rounded-lg overflow-hidden border shadow-sm">
                  <img src={img} alt={`Hero ${index}`} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeleteImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
              {heroImages.length < 5 && (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Tambah</span>
                  <input type="file" accept="image/*" multiple onChange={handleHeroUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <MajorLogoManager /> {/* ← TAMBAHAN: Komponen Manajemen Logo Jurusan */}

          {/* Tombol Simpan */}
          <button onClick={handleSave} className="w-full bg-blue-600 md:col-span-2 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2">
            <Save size={20}/> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}