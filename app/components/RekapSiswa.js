"use client";

import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

// Data Mockup
const classData = [
  { id: 'x', name: 'KELAS X', count: 430, majors: [
    { name: 'DKV 1', total: 30, male: 21, female: 9 }, { name: 'DKV 2', total: 33, male: 19, female: 14 }
  ]},
  { id: 'xi', name: 'KELAS XI', count: 435, majors: [
    { name: 'RPL 1', total: 36, male: 20, female: 16 }, { name: 'TKR 1', total: 34, male: 30, female: 4 }
  ]},
  { id: 'xii', name: 'KELAS XII', count: 435, majors: [
    { name: 'PH 1', total: 32, male: 14, female: 18 }, { name: 'KL 1', total: 28, male: 10, female: 18 }
  ]}
];

const TOTAL = 1300;
const MALE = 800;
const FEMALE = 500;

const chartConfigs = [
  { 
    title: 'TOTAL SISWA', 
    percentage: 100, // Penuh 100%
    color: '#9CA3AF', // Abu-abu
    bgColor: '#E5E7EB',
    centerText: '1300' 
  },
  { 
    title: 'TOTAL LAKI-LAKI', 
    percentage: (MALE / TOTAL) * 100,
    color: '#3B82F6', // Biru
    bgColor: '#EFF6FF',
    centerText: '800' 
  },
  { 
    title: 'TOTAL PEREMPUAN', 
    percentage: (FEMALE / TOTAL) * 100,
    color: '#EC4899', // Pink
    bgColor: '#FDF2F8',
    centerText: '500' 
  }
];

const majorsList = [
  { code: 'TKR', students: 120, color: '#3B82F6', bg: '#EFF6FF' },
  { code: 'PH', students: 125, color: '#F97316', bg: '#FFF7ED' },
  { code: 'DKV', students: 117, color: '#EAB308', bg: '#FEFCE8' },
  { code: 'KL', students: 75, color: '#92400E', bg: '#FEF3C7' },
  { code: 'RPL', students: 114, color: '#22C55E', bg: '#F0FDF4' },
  { code: 'LPKKK', students: 95, color: '#06B6D4', bg: '#ECFEFF' }
];

export default function RekapSiswa({ settings }) {
  const [openClass, setOpenClass] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="bg-gray-50 p-6 md:p-10 rounded-2xl border border-gray-200 shadow-sm font-poppins">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Rekapitulasi Jumlah Siswa</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Class Cards */}
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

      {/* Donut Charts - Dibuat dengan CSS Murni (Tanpa Kartu Putih) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {chartConfigs.map((chart, idx) => (
          <div key={idx} className="flex flex-col items-center py-4">
            <h4 className="font-bold text-gray-700 mb-6 text-center">{chart.title}</h4>
            <div className="relative w-48 h-48 rounded-full" style={{
              background: mounted ? `conic-gradient(${chart.color} ${chart.percentage}%, ${chart.bgColor} ${chart.percentage}% 100%)` : `conic-gradient(${chart.bgColor} 0% 100%)`,
              transition: 'background 1.5s ease-out'
            }}>
              {/* Lubang di tengah donut */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gray-50 rounded-full flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-800">{chart.centerText}</p>
                <p className="text-xs text-gray-500 mt-1 font-semibold">SISWA</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Majors List */}
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
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{width: mounted ? `${(major.students / 130) * 100}%` : '0%', backgroundColor: major.color}}></div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-800">{major.code}</p>
              <p className="text-xs text-gray-500">{major.students} SISWA</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}