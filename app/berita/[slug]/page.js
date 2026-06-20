'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';

const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#1e3a5f" rx="12"/><text x="400" y="175" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-family="Arial,sans-serif" font-size="60">📷</text><text x="400" y="225" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Arial,sans-serif" font-size="16">Belum ada cover</text></svg>'
)}`;

const FALLBACK_SMALL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#f1f5f9" rx="6"/><text x="60" y="35" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="20">📷</text><text x="60" y="55" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="8">No Cover</text></svg>'
)}`;

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}${url}`;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-media/${url}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BeritaDetailPage({ params }) {
  const { slug } = use(params);
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
      incrementView();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('news_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'Publish')
        .single();

      if (error || !postData) {
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: relatedData } = await supabase
        .from('news_posts')
        .select('*')
        .eq('status', 'Publish')
        .eq('category', postData.category)
        .neq('id', postData.id)
        .order('published_at', { ascending: false })
        .limit(4);

      if (relatedData) setRelated(relatedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      const { data: current } = await supabase
        .from('news_posts')
        .select('views')
        .eq('slug', slug)
        .single();

      if (current) {
        await supabase
          .from('news_posts')
          .update({ views: (current.views || 0) + 1 })
          .eq('slug', slug);
      }
    } catch (err) {
      console.error('View counter error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-72 bg-gray-200 rounded-xl mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-600 mb-2">Berita Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-4">Berita yang Anda cari tidak tersedia atau telah dihapus.</p>
          <a href="/semua-berita" className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            ← Kembali ke Semua Berita
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <a
          href="/semua-berita"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Semua Berita
        </a>

        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full text-white mb-3 ${post.category === 'Siswa Berprestasi' ? 'bg-amber-500' : 'bg-blue-500'}`}>
          {post.category}
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views || 0} dilihat
          </span>
        </div>

        {post.cover_url && (
          <div className="rounded-2xl overflow-hidden mb-6 bg-gray-100">
            <img
              src={getImageUrl(post.cover_url) || FALLBACK_IMG}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = FALLBACK_IMG;
                e.target.onerror = null;
              }}
              alt={post.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          {post.excerpt && (
            <p className="text-gray-600 font-medium text-lg leading-relaxed mb-6 border-l-4 border-blue-500 pl-4 italic">
              {post.excerpt}
            </p>
          )}
          <div
            className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: post.content
                ? post.content.replace(/\n/g, '<br/>')
                : '<p class="text-gray-400">Konten belum tersedia.</p>',
            }}
          />
        </div>

        {related.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Berita Terkait</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((item) => (
                <a
                  key={item.id}
                  href={`/berita/${item.slug}`}
                  className="group flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(item.cover_url) || FALLBACK_SMALL}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.src = FALLBACK_SMALL;
                        e.target.onerror = null;
                      }}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-gray-400">{formatDate(item.published_at)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}