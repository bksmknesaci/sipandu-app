"use client";

import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSiswaAction } from '@/app/actions/siswaActions';

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

export default function RekapSiswa({ settings }) {
  const [openClass, setOpenClass] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadSiswaData();
  }, []);

  const loadSiswaData = async () => {
    try {
      const result = await fetchSiswaAction();
      if (result.data) {
        setSiswaData(result.data);
      }
    } catch (error) {
      console.error('Error fetching siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HITUNG STATISTIK DINAMIS
  // ============================================
  const totalSiswa = siswaData.length;
  const maleCount = siswaData.filter(s => s.jenis_kelamin === 'L').length;
  const femaleCount = siswaData.filter(s => s.jenis_kelamin === 'P').length;

  // ============================================
  // KELOMPOKKAN PER TINGKAT (X, XI, XII)
  // ============================================
  const tingkatGroups = {};
  siswaData.forEach(s => {
    const kelas = (s.kelas || '').trim();
    let tingkat = kelas.split(/\s+/)[0];
    if (!['X', 'XI', 'XII'].includes(tingkat)) tingkat = 'Lainnya';
    if (!tingkatGroups[tingkat]) tingkatGroups[tingkat] = [];
    tingkatGroups[tingkat].push(s);
  });

  // Build classData
  const classData = ['X', 'XI', 'XII']
    .filter(t => tingkatGroups[t])
    .map(tingkat => {
      const students = tingkatGroups[tingkat];

      // Kelompokkan per jurusan/kelas group
      const majorGroups = {};
      students.forEach(s => {
        const kelas = (s.kelas || '').trim();
        const parts = kelas.split(/\s+/);
        let majorName;
        if (parts.length > 1) {
          majorName = parts.slice(1).join(' ');
        } else {
          majorName = s.jurusan || 'Lainnya';
        }
        if (!majorGroups[majorName]) majorGroups[majorName] = { total: 0, male: 0, female: 0 };
        majorGroups[majorName].total++;
        if (s.jenis_kelamin === 'L') majorGroups[majorName].male++;
        if (s.jenis_kelamin === 'P') majorGroups[majorName].female++;
      });

      return {
        id: tingkat.toLowerCase(),
        name: `KELAS ${tingkat}`,
        count: students.length,
        majors: Object.entries(majorGroups)
          .map(([name, counts]) => ({ name, ...counts }))
          .sort((a, b) => a.name.localeCompare(b.name))
      };
    });

  // ============================================
  // CHART CONFIGS (Donut Chart)
  // ============================================
  const chartConfigs = [
    {
      title: 'TOTAL SISWA',
      percentage: 100,
      color: '#9CA3AF',
      bgColor: '#E5E7EB',
      centerText: String(totalSiswa)
    },
    {
      title: 'TOTAL LAKI-LAKI',
      percentage: totalSiswa > 0 ? (maleCount / totalSiswa) * 100 : 0,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      centerText: String(maleCount)
    },
    {
      title: 'TOTAL PEREMPUAN',
      percentage: totalSiswa > 0 ? (femaleCount / totalSiswa) * 100 : 0,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      centerText: String(femaleCount)
    }
  ];

    // ============================================
  // MAJORS LIST (6 Jurusan Tetap)
  // ============================================
  const fixedMajors = [
    { code: 'TKRO', color: '#3B82F6', bg: '#EFF6FF' },
    { code: 'DKV',  color: '#F97316', bg: '#FFF7ED' },
    { code: 'RPL',  color: '#22C55E', bg: '#F0FDF4' },
    { code: 'PH',   color: '#EAB308', bg: '#FEFCE8' },
    { code: 'KL',   color: '#92400E', bg: '#FEF3C7' },
    { code: 'LPKKK', color: '#06B6D4', bg: '#ECFEFF' },
  ];

  const majorsList = fixedMajors.map(major => {
    // Hitung siswa yang jurusan/kelasnya mengandung kode jurusan ini
    const count = siswaData.filter(s => {
      const j = (s.jurusan || '').trim().toUpperCase();
      const k = (s.kelas || '').trim().toUpperCase();
      return j.startsWith(major.code) || k.includes(major.code);
    }).length;

    return {
      code: major.code,
      students: count,
      color: major.color,
      bg: major.bg,
    };
  });

  // Max students untuk progress bar
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 h-52"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-full mx-auto w-48"></div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (totalSiswa === 0) {
    return (
      <div className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Rekapitulasi Jumlah Siswa</h2>
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
    <div className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Rekapitulasi Jumlah Siswa</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Class Cards */}
      {classData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {classData.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Users className="text-blue-600" size={24}/>
                </div>
                <h3 className="text-lg font-bold text-blue-600 mb-1">{cls.name}</h3>
                <p className="text-5xl font-bold text-gray-800 mb-1">{cls.count}</p>
                <p className="text-gray-500 text-sm mb-4">SISWA</p>
                <button
                  onClick={() => setOpenClass(openClass === cls.id ? null : cls.id)}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
                >
                  {openClass === cls.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Lihat Jurusan
                </button>
              </div>

              {openClass === cls.id && (
                <div className="bg-gray-50 border-t p-4 text-left text-sm">
                  {cls.majors.map((major, idx) => (
                    <div key={idx} className="mb-3 bg-white p-3 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-800">{major.name}</p>
                      <div className="flex justify-between text-gray-600 mt-1">
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

      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {chartConfigs.map((chart, idx) => (
          <div key={idx} className="flex flex-col items-center py-4">
            <h4 className="font-bold text-gray-700 mb-6 text-center">{chart.title}</h4>
            <div className="relative w-48 h-48 rounded-full" style={{
              background: mounted ? `conic-gradient(${chart.color} ${chart.percentage}%, ${chart.bgColor} ${chart.percentage}% 100%)` : `conic-gradient(${chart.bgColor} 0% 100%)`,
              transition: 'background 1.5s ease-out'
            }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gray-50 rounded-full flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-800">{chart.centerText}</p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">SISWA</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Majors List */}
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
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{width: mounted ? `${(major.students / maxStudents) * 100}%` : '0%', backgroundColor: major.color}}></div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-800">{major.code}</p>
                <p className="text-xs text-gray-500">{major.students} SISWA</p>
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