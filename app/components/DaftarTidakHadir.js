"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAbsentStudentsForDashboard } from '@/app/actions/absensiActions';
import { supabase } from '@/lib/supabase'; // Import supabase client untuk realtime

// ============================================
// KONFIGURASI WARNA
// ============================================
const statusConfig = {
  Alpha: { color: '#EF4444', bg: '#FEE2E2', text: '#991B1B', ring: '#FECACA' },
  Sakit: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', ring: '#FDE68A' },
  Izin:  { color: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', ring: '#BFDBFE' },
};

export default function DaftarTidakHadir() {
  const [kelasData, setKelasData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH REAL DATA
  // ============================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE');
      const result = await getAbsentStudentsForDashboard(today);
      if (result.data) {
        setKelasData(result.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // PERBAIKAN: Tambahkan Realtime Supabase Subscription
    // Dashboard akan langsung update ketika Sekretaris/Admin menekan tombol Absensi
    const channel = supabase
      .channel('absensi-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absensi' }, () => {
        fetchData();
      })
      .subscribe();

    // Fallback polling tetap berjaga jika ada koneksi yang terputus
    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Data yang sedang ditampilkan
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
    if (!isActive || searchTerm || filteredKelas.length <= 1) return;
    const timer = setInterval(() => {
      handleTransition(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredKelas.length);
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [isActive, searchTerm, filteredKelas.length]);

  const handleTransition = (callback) => {
    setFade(false);
    setTimeout(() => { callback(); setFade(true); }, 300);
  };

  const handleNext = () => {
    handleTransition(() => { setCurrentIndex((prev) => (prev + 1) % filteredKelas.length); });
    pauseAutoSlide();
  };

  const handlePrev = () => {
    handleTransition(() => { setCurrentIndex((prev) => (prev - 1 + filteredKelas.length) % filteredKelas.length); });
    pauseAutoSlide();
  };

  const pauseAutoSlide = () => {
    setIsActive(false);
    setTimeout(() => setIsActive(true), 15000);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentIndex(0);
  };

  // ============================
  // LOADING STATE
  // ============================
  if (loading) {
    return (
      <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Daftar Siswa Tidak Hadir</h2>
          <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
        </div>
        <div className="animate-pulse flex flex-col md:flex-row gap-8 px-6">
          <div className="w-full md:w-2/5 flex flex-col items-center py-4">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="w-56 h-56 bg-gray-200 rounded-full mb-8"></div>
            <div className="flex gap-6">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="w-full md:w-3/5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // NO DATA
  // ============================
  if (kelasData.length === 0) {
    return (
      <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Daftar Siswa Tidak Hadir</h2>
          <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
        </div>
        <div className="text-center py-12">
          <GraduationCap size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-semibold">Semua siswa hadir hari ini!</p>
          <p className="text-gray-400 text-sm mt-1">Tidak ada siswa yang Alpha, Sakit, atau Izin</p>
        </div>
      </div>
    );
  }

  // ============================
  // MAIN RENDER
  // ============================
  return (
    <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Daftar Siswa Tidak Hadir</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Navigation Buttons */}
      {filteredKelas.length > 1 && (
        <>
          <button onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110">
            <ChevronLeft size={24} />
          </button>
          <button onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content with Fade */}
      <div className={`transition-all duration-300 ease-in-out ${fade ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex flex-col md:flex-row gap-8 px-6">
          
          {/* LEFT - DIAGRAM */}
          <div className="w-full md:w-2/5 flex flex-col items-center justify-center py-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 tracking-wide">
              {currentKelas?.kelas || "KELAS"}
            </h3>

            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(#EF4444 0deg ${Math.max(alphaDeg * 0.8, 30)}deg, transparent ${Math.max(alphaDeg * 0.8, 30)}deg 360deg)`,
                mask: 'radial-gradient(transparent 65%, black 68%)',
                WebkitMask: 'radial-gradient(transparent 65%, black 68%)',
                transform: 'rotate(-90deg)',
                opacity: 0.6
              }}></div>

              <div className="absolute inset-0 m-auto w-56 h-56 rounded-full shadow-lg" style={{
                background: totalTidakHadir > 0 ? `conic-gradient(
                  #EF4444 0deg ${alphaDeg}deg,
                  #F59E0B ${alphaDeg}deg ${alphaDeg + sakitDeg}deg,
                  #3B82F6 ${alphaDeg + sakitDeg}deg 360deg
                )` : '#E5E7EB',
                transform: 'rotate(-90deg)',
                transition: 'background 1s ease-out'
              }}></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-[#FFFBF5] rounded-full flex flex-col items-center justify-center shadow-inner z-10">
                <p className="text-5xl font-bold text-gray-800">{totalTidakHadir}</p>
                <p className="text-sm text-gray-500 font-semibold tracking-widest mt-1">SISWA</p>
              </div>
            </div>

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

          {/* RIGHT - TABLE */}
          <div className="w-full md:w-3/5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '450px' }}>
            <div className="p-4 border-b border-gray-100 relative">
              <input type="text" placeholder="Cari Kelas dan Jurusan" value={searchTerm} onChange={handleSearch}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all" />
              <Search className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>

            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-7">Nama Siswa</div>
              <div className="col-span-2 text-center">L/P</div>
              <div className="col-span-3 text-center">Status</div>
            </div>

            <div className="overflow-y-auto flex-grow">
              {currentKelas?.siswa.map((siswa, index) => {
                const cfg = statusConfig[siswa.status];
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 items-center transition-colors">
                    <div className="col-span-7 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ borderColor: cfg?.ring, borderWidth: '1.5px', backgroundColor: cfg?.bg }}>
                        <GraduationCap size={16} style={{ color: cfg?.color }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate">{siswa.nama}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-600">{siswa.lp}</span>
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: cfg?.bg, color: cfg?.text }}>
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