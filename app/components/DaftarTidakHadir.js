"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================
// DATA MOCKUP (Sesuai Referensi)
// ============================================
const kelasData = [
  {
    kelas: "XI TKRO 1",
    siswa: [
      { nama: "ANDIKA PRAMANA", lp: "L", status: "Alpha" },
      { nama: "RAFAEL SAPUTRA", lp: "L", status: "Sakit" },
      { nama: "SINTIA BELA", lp: "P", status: "Izin" },
      { nama: "BUDI SANTOSO", lp: "L", status: "Alpha" },
      { nama: "DEWI LESTARI", lp: "P", status: "Sakit" },
      { nama: "ERIK PRASETYO", lp: "L", status: "Alpha" },
      { nama: "FITRI HANDAYANI", lp: "P", status: "Izin" },
      { nama: "GILANG RAMADHAN", lp: "L", status: "Alpha" },
      { nama: "HANA PAHLEVI", lp: "P", status: "Sakit" },
    ]
  },
  {
    kelas: "XI TKRO 2",
    siswa: [
      { nama: "IRFAN HAKIM", lp: "L", status: "Alpha" },
      { nama: "JOKO WIDODO", lp: "L", status: "Izin" },
      { nama: "KARTIKA DEWI", lp: "P", status: "Sakit" },
      { nama: "LINA MULYANI", lp: "P", status: "Alpha" },
      { nama: "MAULANA MALIK", lp: "L", status: "Alpha" },
    ]
  },
  {
    kelas: "XI RPL 1",
    siswa: [
      { nama: "NISA ASTUTI", lp: "P", status: "Izin" },
      { nama: "OSCAR MAHARDIKA", lp: "L", status: "Alpha" },
      { nama: "PUTRI RAHAYU", lp: "P", status: "Sakit" },
      { nama: "QORI AKBAR", lp: "L", status: "Alpha" },
      { nama: "REZA ALFIAN", lp: "L", status: "Sakit" },
      { nama: "SARI INDRAH", lp: "P", status: "Izin" },
      { nama: "TAUFIK HIDAYAT", lp: "L", status: "Alpha" },
    ]
  },
  {
    kelas: "XI DKV 1",
    siswa: [
      { nama: "UMI KULSUM", lp: "P", status: "Sakit" },
      { nama: "VALENTINO ROSSI", lp: "L", status: "Izin" },
      { nama: "WATI SUSILOWATI", lp: "P", status: "Alpha" },
    ]
  },
  {
    kelas: "XI PH 1",
    siswa: [
      { nama: "XAVIER PUTRA", lp: "L", status: "Alpha" },
      { nama: "YULIA SARI", lp: "P", status: "Izin" },
      { nama: "ZAINAL ABIDIN", lp: "L", status: "Sakit" },
      { nama: "AGNES MONICA", lp: "P", status: "Alpha" },
      { nama: "BAYU PERMANA", lp: "L", status: "Izin" },
      { nama: "CITRA KIRANA", lp: "P", status: "Sakit" },
    ]
  }
];

// ============================================
// KONFIGURASI WARNA
// ============================================
const statusConfig = {
  Alpha: { color: '#EF4444', bg: '#FEE2E2', text: '#991B1B', ring: '#FECACA' },
  Sakit: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', ring: '#FDE68A' },
  Izin:  { color: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', ring: '#BFDBFE' },
};

export default function DaftarTidakHadir() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fade, setFade] = useState(true);

  // Data yang sedang ditampilkan (berdasarkan search atau auto-slide)
  const filteredKelas = searchTerm 
    ? kelasData.filter(k => k.kelas.toLowerCase().includes(searchTerm.toLowerCase()))
    : kelasData;

  const currentKelas = filteredKelas[currentIndex] || filteredKelas[0];

  // Hitung statistik untuk donut
  const totalTidakHadir = currentKelas?.siswa.length || 0;
  const alphaCount = currentKelas?.siswa.filter(s => s.status === 'Alpha').length || 0;
  const sakitCount = currentKelas?.siswa.filter(s => s.status === 'Sakit').length || 0;
  const izinCount = currentKelas?.siswa.filter(s => s.status === 'Izin').length || 0;

  // Derajat untuk conic-gradient
  const alphaDeg = totalTidakHadir > 0 ? (alphaCount / totalTidakHadir) * 360 : 0;
  const sakitDeg = totalTidakHadir > 0 ? (sakitCount / totalTidakHadir) * 360 : 0;

  // Auto Slide setiap 5 detik
  useEffect(() => {
    if (!isActive || searchTerm) return;
    const timer = setInterval(() => {
      handleTransition(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredKelas.length);
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [isActive, searchTerm, filteredKelas.length]);

  const handleTransition = (callback) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
    }, 300);
  };

  const handleNext = () => {
    handleTransition(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredKelas.length);
    });
    pauseAutoSlide();
  };

  const handlePrev = () => {
    handleTransition(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredKelas.length) % filteredKelas.length);
    });
    pauseAutoSlide();
  };

  const pauseAutoSlide = () => {
    setIsActive(false);
    setTimeout(() => setIsActive(true), 15000); // Lanjut auto setelah 15 detik
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentIndex(0);
  };

  return (
    <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Daftar Siswa Tidak Hadir</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Tombol Navigasi Kiri */}
      <button 
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Tombol Navigasi Kanan */}
      <button 
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110"
      >
        <ChevronRight size={24} />
      </button>

      {/* Konten Utama dengan Animasi Fade */}
      <div className={`transition-all duration-300 ease-in-out ${fade ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        <div className="flex flex-col md:flex-row gap-8 px-6">
          
          {/* ============================================
              BAGIAN KIRI - DIAGRAM KEHADIRAN
          ============================================ */}
          <div className="w-full md:w-2/5 flex flex-col items-center justify-center py-4">
            
            {/* Nama Kelas */}
            <h3 className="text-2xl font-bold text-gray-800 mb-6 tracking-wide">
              {currentKelas?.kelas || "KELAS"}
            </h3>

            {/* Wrapper Donut & Garis Luar */}
<div className="relative w-64 h-64 flex items-center justify-center mb-8">
  
  {/* Garis lengkung merah luar (Dekoratif) */}
  <div className="absolute inset-0 rounded-full" style={{
    background: `conic-gradient(#EF4444 0deg ${Math.max(alphaDeg * 0.8, 30)}deg, transparent ${Math.max(alphaDeg * 0.8, 30)}deg 360deg)`,
    mask: 'radial-gradient(transparent 65%, black 68%)',
    WebkitMask: 'radial-gradient(transparent 65%, black 68%)',
    transform: 'rotate(-90deg)',
    opacity: 0.6
  }}></div>

  {/* Donut Chart Utama - HANYA grafik, tanpa anak di dalam */}
  <div className="absolute inset-0 m-auto w-56 h-56 rounded-full shadow-lg" style={{
    background: totalTidakHadir > 0 ? `conic-gradient(
      #EF4444 0deg ${alphaDeg}deg,
      #F59E0B ${alphaDeg}deg ${alphaDeg + sakitDeg}deg,
      #3B82F6 ${alphaDeg + sakitDeg}deg 360deg
    )` : '#E5E7EB',
    transform: 'rotate(-90deg)',
    transition: 'background 1s ease-out'
  }}></div>

  {/* Lubang Tengah Donut - DI LUAR elemen rotate, teks pasti tegak */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-[#FFFBF5] rounded-full flex flex-col items-center justify-center shadow-inner z-10">
    <p className="text-5xl font-bold text-gray-800">{totalTidakHadir}</p>
    <p className="text-sm text-gray-500 font-semibold tracking-widest mt-1">SISWA</p>
  </div>
</div>

            {/* Keterangan Warna */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">{alphaCount} Alpha</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">{sakitCount} Sakit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">{izinCount} Izin</span>
              </div>
            </div>
          </div>

          {/* ============================================
              BAGIAN KANAN - TABEL SISWA TIDAK HADIR
          ============================================ */}
          <div className="w-full md:w-3/5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '450px' }}>
            
            {/* Kolom Pencarian */}
            <div className="p-4 border-b border-gray-100 relative">
              <input
                type="text"
                placeholder="Cari Kelas dan Jurusan"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
              <Search className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* Header Tabel */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-7">Nama Siswa</div>
              <div className="col-span-2 text-center">L/P</div>
              <div className="col-span-3 text-center">Status</div>
            </div>

            {/* Isi Tabel (Scrollable) */}
            <div className="overflow-y-auto flex-grow">
              {currentKelas?.siswa.map((siswa, index) => {
                const cfg = statusConfig[siswa.status];
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 items-center transition-colors">
                    
                    {/* Nama Siswa + Ikon */}
                    <div className="col-span-7 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                           style={{ borderColor: cfg.ring, borderWidth: '1.5px', backgroundColor: cfg.bg }}>
                        <GraduationCap size={16} style={{ color: cfg.color }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate">{siswa.nama}</span>
                    </div>

                    {/* L/P */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-600">{siswa.lp}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-3 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" 
                            style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                        {siswa.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {filteredKelas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Search size={24} className="mb-2 opacity-50" />
                  <p className="text-sm">Kelas tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}