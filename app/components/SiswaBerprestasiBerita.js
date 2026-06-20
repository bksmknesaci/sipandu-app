"use client";

import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { getPublishedNews } from '@/app/actions/newsActions';

const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#1e3a5f" rx="0"/><text x="400" y="270" text-anchor="middle" fill="rgba(255,255,255,0.25)" font-family="Arial,sans-serif" font-size="60">📷</text><text x="400" y="330" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Arial,sans-serif" font-size="16">Belum ada cover</text></svg>'
)}`;

const FALLBACK_SMALL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#e2e8f0" rx="12"/><text x="75" y="65" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="28">📷</text><text x="75" y="95" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="9">No Cover</text></svg>'
)}`;

function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}${url}`;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-media/${url}`;
}

export default function SiswaBerprestasiBerita() {
  const [dataItems, setDataItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedNews(5).then(data => {
      setDataItems(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-[#f5f5f5] py-8 px-4 md:px-8">
        <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 h-96 animate-pulse"></div>
      </div>
    );
  }

  if (dataItems.length === 0) {
    return (
      <div className="bg-[#f5f5f5] py-8 px-4 md:px-8">
        <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 text-center text-gray-400">
          Belum ada berita atau prestasi terbaru.
        </div>
      </div>
    );
  }

  const featured = dataItems[0];
  const listItems = dataItems.slice(1);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#f5f5f5] py-8 px-4 md:px-8 font-poppins">
      <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1976D2] uppercase tracking-wide">
            Siswa Berprestasi & Berita
          </h2>
          <Link href="/semua-berita" className="flex items-center gap-2 border-2 border-[#1976D2] text-[#1976D2] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1976D2] hover:text-white active:scale-95 transition-all duration-300 shadow-sm">
            LIHAT SEMUA BERITA
            <ExternalLink size={16} />
          </Link>
        </div>

        {/* CONTENT LAYOUT (2 Kolom) */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* KOLOM KIRI - FEATURED CONTENT */}
          <Link href={`/berita/${featured.slug}`} className="w-full lg:w-[65%] relative rounded-[20px] overflow-hidden h-[400px] lg:h-[480px] group cursor-pointer shadow-lg block">
            <img 
              src={getImageUrl(featured.cover_url) || FALLBACK_IMG} 
              alt={featured.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = FALLBACK_IMG;
                e.target.onerror = null;
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-200 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{formatDate(featured.published_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{formatTime(featured.published_at)}</span>
                </div>
                <span className="bg-[#1976D2] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {featured.category === 'Siswa Berprestasi' && <Award size={12} />}
                  {featured.category}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight mb-3 drop-shadow-md">
                {featured.title}
              </h3>

              <p className="text-gray-200 text-sm md:text-base mb-6 line-clamp-2 leading-relaxed">
                {featured.excerpt}
              </p>

              <div className="inline-block border-2 border-white text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white hover:text-gray-900 active:scale-95 transition-all duration-300 backdrop-blur-sm bg-white/10">
                BACA SELENGKAPNYA
              </div>
            </div>
          </Link>

          {/* KOLOM KANAN - DAFTAR BERITA */}
          <div className="w-full lg:w-[35%] flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
            
            {listItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/berita/${item.slug}`}
                className="flex gap-4 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer group/card"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img 
                    src={getImageUrl(item.cover_url) || FALLBACK_SMALL} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = FALLBACK_SMALL;
                      e.target.onerror = null;
                    }}
                  />
                </div>

                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1976D2] mb-1 flex items-center gap-1">
                    {item.category === 'Siswa Berprestasi' && <Award size={10} />}
                    {item.category}
                  </span>
                  <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatDate(item.published_at)}</span>
                    <span>•</span>
                    <span>{formatTime(item.published_at)}</span>
                  </div>
                </div>
              </Link>
            ))}

          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}