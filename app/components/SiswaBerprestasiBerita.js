"use client";

import React, { useState } from 'react';
import { ExternalLink, Calendar, Clock, Award } from 'lucide-react';

// ============================================
// DATA MOCKUP (Siswa Berprestasi & Berita)
// ============================================
const dataItems = [
  {
    id: 1,
    type: 'prestasi',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800&q=80',
    title: 'Avinda Septiyani Raih Juara 1 Olimpiade Sains Nasional',
    summary: 'Siswa kelas X RPL 2 ini berhasil meraih medali emas di ajang Olimpiade Sains Nasional yang diselenggarakan di Jakarta. Prestasi ini membawa nama haruan sekolah ke tingkat nasional.',
    date: '07 Juni 2026',
    time: '09:30',
    category: 'Siswa Berprestasi',
    level: 'Nasional'
  },
  {
    id: 2,
    type: 'berita',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    title: 'Workshop Digital Marketing untuk Siswa SMK',
    summary: 'Sekolah mengadakan workshop digital marketing bekerja sama dengan praktisi industri.',
    date: '06 Juni 2026',
    time: '14:00',
    category: 'Berita'
  },
  {
    id: 3,
    type: 'prestasi',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80',
    title: 'Tim Debat Sekolah Menang di Tingkat Provinsi',
    summary: 'Tim debat berhasil mengalahkan 30 sekolah lainnya.',
    date: '05 Juni 2026',
    time: '16:30',
    category: 'Siswa Berprestasi',
    level: 'Provinsi'
  },
  {
    id: 4,
    type: 'berita',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80',
    title: 'Peringatan Hari Pendidikan Nasional 2026',
    summary: 'Upacara peringatan Hardiknas dilaksanakan dengan khidmat di lapangan sekolah.',
    date: '02 Mei 2026',
    time: '07:00',
    category: 'Berita'
  },
  {
    id: 5,
    type: 'prestasi',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
    title: 'Nadia Fitri Juara 2 Lomba Cerdas Cermat Kabupaten',
    summary: 'Perwakilan sekolah meraih runner-up di lomba cerdas cermat antar SMK se-Kabupaten.',
    date: '28 April 2026',
    time: '11:00',
    category: 'Siswa Berprestasi',
    level: 'Kabupaten'
  }
];

export default function SiswaBerprestasiBerita() {
  const featured = dataItems[0];
  const listItems = dataItems.slice(1);

  return (
    <div className="bg-[#f5f5f5] py-8 px-4 md:px-8 font-poppins">
      <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
        
        {/* ============================================
            HEADER SECTION
        ============================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1976D2] uppercase tracking-wide">
            Siswa Berprestasi & Berita
          </h2>
          <button className="flex items-center gap-2 border-2 border-[#1976D2] text-[#1976D2] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1976D2] hover:text-white active:scale-95 transition-all duration-300 shadow-sm">
            LIHAT SEMUA BERITA
            <ExternalLink size={16} />
          </button>
        </div>

        {/* ============================================
            CONTENT LAYOUT (2 Kolom)
        ============================================ */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* ============================================
              KOLOM KIRI - FEATURED CONTENT (65-70%)
          ============================================ */}
          <div className="w-full lg:w-[65%] relative rounded-[20px] overflow-hidden h-[400px] lg:h-[480px] group cursor-pointer shadow-lg">
            {/* Background Gambar */}
            <img 
              src={featured.image} 
              alt={featured.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            
            {/* Overlay Gelap Transparan */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            {/* Konten di atas Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-200 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{featured.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{featured.time}</span>
                </div>
                <span className="bg-[#1976D2] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {featured.type === 'prestasi' && <Award size={12} />}
                  {featured.category}
                </span>
                {featured.level && (
                  <span className="bg-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {featured.level}
                  </span>
                )}
              </div>

              {/* Judul */}
              <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight mb-3 drop-shadow-md">
                {featured.title}
              </h3>

              {/* Ringkasan */}
              <p className="text-gray-200 text-sm md:text-base mb-6 line-clamp-2 leading-relaxed">
                {featured.summary}
              </p>

              {/* Tombol */}
              <button className="border-2 border-white text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white hover:text-gray-900 active:scale-95 transition-all duration-300 backdrop-blur-sm bg-white/10">
                BACA SELENGKAPNYA
              </button>
            </div>
          </div>

          {/* ============================================
              KOLOM KANAN - DAFTAR BERITA (30-35%)
          ============================================ */}
          <div className="w-full lg:w-[35%] flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
            
            {listItems.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-4 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer group/card"
              >
                {/* Thumbnail Kecil */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                </div>

                {/* Judul & Metadata */}
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1976D2] mb-1 flex items-center gap-1">
                    {item.type === 'prestasi' && <Award size={10} />}
                    {item.category}
                  </span>
                  <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Custom Scrollbar Style */}
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