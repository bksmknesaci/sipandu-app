"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSiswaAction } from '@/app/actions/siswaActions';

// ============================================
// KOMPONEN: AnimatedNumber
// Hook dipanggil di top-level komponen ini, BUKAN di .map()
// ============================================
function AnimatedNumber({ target, shouldStart, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;

    let startTime = null;
    let rafId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [shouldStart, target, duration]);

  return <>{count}</>;
}

// Color palette untuk jurusan
const majorColors = [
  { color: '#3B82F6', bg: '#EFF6FF' },
  { color: '#F97316', bg: '#FFF7ED' },
  { color: '#EAB308', bg: '#FEFCE8' },
  { color: '#92400E', bg: '#FEF3C7' },
  { color: '#22C55E', bg: '#F0FDF4' },
  { color: '#06B6D4', bg: '#ECFEFF' },
  { color: '#8B5CF6', bg: '#F5F3FF' },
  { color: '#EC4899', bg: '#FDF2F8' },
  { color: '#EF4444', bg: '#FEF2F2' },
  { color: '#14B8A6', bg: '#F0FDFA' },
];

// Warna icon per tingkat kelas
const classColors = [
  { icon: '#3B82F6', bg: '#DBEAFE', ring: '#93C5FD' },   // X  → Biru
  { icon: '#10B981', bg: '#D1FAE5', ring: '#6EE7B7' },   // XI → Hijau
  { icon: '#8B5CF6', bg: '#EDE9FE', ring: '#C4B5FD' },   // XII → Ungu
];

export default function RekapSiswa({ settings }) {
  const [openClass, setOpenClass] = useState(null);
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animateStart, setAnimateStart] = useState(false);
  const sectionRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    loadSiswaData();
  }, []);

  // ============================================
  // INTERSECTION OBSERVER + FALLBACK
  // ============================================
  useEffect(() => {
    if (hasAnimatedRef.current) return;

    const element = sectionRef.current;
    let observer;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;
      setAnimateStart(true);
    };

    if (element && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(element);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(element);
    }

    // Fallback: mulai animasi setelah 3 detik
    const fallbackTimer = setTimeout(() => {
      if (!hasAnimatedRef.current) {
        startAnimation();
      }
    }, 3000);

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [loading]);

  const loadSiswaData = async () => {
    try {
      const result = await fetchSiswaAction();
      if (result.data) setSiswaData(result.data);
    } catch (error) {
      console.error('Error fetching siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HITUNG STATISTIK
  // ============================================
  const totalSiswa = siswaData.length;
  const maleCount = siswaData.filter(s => s.jenis_kelamin === 'L').length;
  const femaleCount = siswaData.filter(s => s.jenis_kelamin === 'P').length;

  const tingkatGroups = {};
  siswaData.forEach(s => {
    const kelas = (s.kelas || '').trim();
    let tingkat = kelas.split(/\s+/)[0];
    if (!['X', 'XI', 'XII'].includes(tingkat)) tingkat = 'Lainnya';
    if (!tingkatGroups[tingkat]) tingkatGroups[tingkat] = [];
    tingkatGroups[tingkat].push(s);
  });

  const classData = ['X', 'XI', 'XII']
    .filter(t => tingkatGroups[t])
    .map((tingkat, idx) => {
      const students = tingkatGroups[tingkat];
      const majorGroups = {};
      students.forEach(s => {
        const kelas = (s.kelas || '').trim();
        const parts = kelas.split(/\s+/);
        let majorName = tingkat + ' ' + (s.jurusan || parts.slice(1).join(' ') || 'Lainnya');
        if (!majorGroups[majorName]) majorGroups[majorName] = { total: 0, male: 0, female: 0 };
        majorGroups[majorName].total++;
        if (s.jenis_kelamin === 'L') majorGroups[majorName].male++;
        if (s.jenis_kelamin === 'P') majorGroups[majorName].female++;
      });

      return {
        id: tingkat.toLowerCase(),
        name: `KELAS ${tingkat}`,
        count: students.length,
        color: classColors[idx],
        majors: Object.entries(majorGroups)
          .map(([name, counts]) => ({ name, ...counts }))
          .sort((a, b) => a.name.localeCompare(b.name))
      };
    });

  const chartConfigs = [
    { title: 'TOTAL SISWA', percentage: 100, color: '#9CA3AF', bgColor: '#E5E7EB', value: totalSiswa },
    { title: 'TOTAL LAKI-LAKI', percentage: totalSiswa > 0 ? (maleCount / totalSiswa) * 100 : 0, color: '#3B82F6', bgColor: '#EFF6FF', value: maleCount },
    { title: 'TOTAL PEREMPUAN', percentage: totalSiswa > 0 ? (femaleCount / totalSiswa) * 100 : 0, color: '#EC4899', bgColor: '#FDF2F8', value: femaleCount }
  ];

  const fixedMajors = [
    { code: 'TKRO', color: '#3B82F6', bg: '#EFF6FF' },
    { code: 'DKV',  color: '#F97316', bg: '#FFF7ED' },
    { code: 'RPL',  color: '#22C55E', bg: '#F0FDF4' },
    { code: 'PH',   color: '#EAB308', bg: '#FEFCE8' },
    { code: 'KL',   color: '#92400E', bg: '#FEF3C7' },
    { code: 'LPKKK', color: '#06B6D4', bg: '#ECFEFF' },
  ];

  const majorsList = fixedMajors.map(major => {
    const count = siswaData.filter(s => {
      const j = (s.jurusan || '').trim().toUpperCase();
      const k = (s.kelas || '').trim().toUpperCase();
      return j.startsWith(major.code) || k.includes(major.code);
    }).length;
    return { code: major.code, students: count, color: major.color, bg: major.bg };
  });

  const maxStudents = Math.max(...majorsList.map(m => m.students), 1);

  // ============================================
  // LOADING SKELETON
  // ============================================
  if (loading) {
    return (
      <div className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 bg-gray-200 rounded w-72"></div>
          <div className="flex-grow h-1 bg-gray-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-6 h-52"></div>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-full mx-auto w-40 md:w-48"></div>)}
        </div>
      </div>
    );
  }

  if (totalSiswa === 0) {
    return (
      <div className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 whitespace-nowrap">Rekapitulasi Jumlah Siswa</h2>
          <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
        </div>
        <div className="text-center py-16">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-400 text-lg">Belum ada data siswa</p>
          <p className="text-gray-300 text-sm mt-1">Import data siswa melalui menu Admin → Daftar Siswa</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 whitespace-nowrap">Rekapitulasi Jumlah Siswa</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* ============================================
          CLASS CARDS — 2 kolom HP, 3 kolom desktop
      ============================================ */}
      {classData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {classData.map((cls, idx) => (
            <div key={cls.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${idx === 2 ? 'col-span-2 md:col-span-1 max-w-[300px] mx-auto md:max-w-none w-full' : ''}`}>
              <div className="p-4 md:p-6 text-center">
                <div className="mx-auto w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3" style={{ backgroundColor: cls.color.bg }}>
                  <Users size={20} className="md:hidden" style={{ color: cls.color.icon }}/>
                  <Users size={24} className="hidden md:block" style={{ color: cls.color.icon }}/>
                </div>
                <h3 className="text-sm md:text-lg font-bold mb-1" style={{ color: cls.color.icon }}>{cls.name}</h3>
                <p className="text-3xl md:text-5xl font-bold text-gray-800 mb-1">
                  <AnimatedNumber target={cls.count} shouldStart={animateStart} duration={1800} />
                </p>
                <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">SISWA</p>
                <button
                  onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
                  className="hover:opacity-90 active:scale-95 transition-all text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold inline-flex items-center gap-2"
                  style={{ backgroundColor: cls.color.icon }}
                >
                  {openClass === cls.id ? <ChevronUp size={14} className="md:w-4 md:h-4"/> : <ChevronDown size={14} className="md:w-4 md:h-4"/>} <span className="hidden sm:inline">Lihat</span> Jurusan
                </button>
              </div>

              {openClass === cls.id && (
                <div className="bg-gray-50 border-t p-3 md:p-4 text-left text-xs md:text-sm">
                  {cls.majors.map((major, midx) => (
                    <div key={midx} className="mb-2 md:mb-3 bg-white p-2.5 md:p-3 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-800 text-xs md:text-sm">{major.name}</p>
                      <div className="flex justify-between text-gray-600 mt-1 text-[11px] md:text-sm">
                        <span>Total: {major.total}</span>
                        <span>L: {major.male} | P: {major.female}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============================================
          DONUT CHARTS — 2 kolom HP, 3 kolom desktop
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        {chartConfigs.map((chart, idx) => (
          <div key={idx} className={`flex flex-col items-center py-4 ${idx === 2 ? 'col-span-2 md:col-span-1 max-w-[260px] mx-auto md:max-w-none w-full' : ''}`}>
            <h4 className="font-bold text-gray-700 mb-4 md:mb-6 text-center text-xs md:text-sm">{chart.title}</h4>
            <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full" style={{
              background: animateStart ? `conic-gradient(${chart.color} ${chart.percentage}%, ${chart.bgColor} ${chart.percentage}% 100%)` : `conic-gradient(${chart.bgColor} 0% 100%)`,
              transition: 'background 1.5s ease-out'
            }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-full flex flex-col items-center justify-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  <AnimatedNumber target={chart.value} shouldStart={animateStart} duration={1800} />
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-semibold">SISWA</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================
          MAJORS LIST
      ============================================ */}
      {majorsList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {majorsList.map((major) => (
            <div key={major.code} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-30" style={{borderColor: major.color, animation: 'spin 10s linear infinite'}}></div>
                <div className="absolute inset-1 rounded-full border border-dashed opacity-60" style={{borderColor: major.color, animation: 'spin 15s linear infinite reverse'}}></div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 overflow-hidden bg-white" style={{backgroundColor: major.bg, color: major.color}}>
                  {settings?.major_logos?.[major.code] ? (
                    <img src={settings.major_logos[major.code]} alt={major.code} className="w-full h-full object-cover"/>
                  ) : (
                    major.code.substring(0,2)
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{width: animateStart ? `${(major.students / maxStudents) * 100}%` : '0%', backgroundColor: major.color}}></div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-800">{major.code}</p>
                <p className="text-xs text-gray-500">
                  <AnimatedNumber target={major.students} shouldStart={animateStart} duration={1400} /> SISWA
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}