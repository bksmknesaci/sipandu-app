"use client";

import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';

// ============================================
// DATA MOCKUP (Sesuai Referensi)
// ============================================
const topSiswa = [
  {
    rank: 1,
    nama: "AVINDA SEPTIYANI",
    kelas: "X RPL 2",
    poin: 85,
    maxPoin: 100,
    penghargaan: "Anugerah Waluya Utama",
    theme: {
      color: '#D4AF37',      // Emas
      bg: '#FFF9E5',         // Krem emas
      ring: '#F7E7A0',       // Cincin tipis
    }
  },
  {
    rank: 2,
    nama: "NUHA ENJELA",
    kelas: "XII RPL 1",
    poin: 60,
    maxPoin: 100,
    penghargaan: "Anugerah Waluya Madya",
    theme: {
      color: '#A2A2A2',      // Perak
      bg: '#F5F5F5',         // Abu muda
      ring: '#D1D5DB',       // Cincin tipis
    }
  },
  {
    rank: 3,
    nama: "HANIFA MAULIDA PUTRI",
    kelas: "X LPKKK 2",
    poin: 35,
    maxPoin: 100,
    penghargaan: "Anugerah Waluya Muda",
    theme: {
      color: '#CD7F32',      // Perunggu
      bg: '#FFF0E5',         // Krem perunggu
      ring: '#E8C8A8',       // Cincin tipis
    }
  }
];

export default function TopReward() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Tiga Besar Peraih Poin Reward Tertinggi</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Kartu Peringkat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topSiswa.map((siswa) => {
          const percentage = (siswa.poin / siswa.maxPoin) * 100;
          const deg = mounted ? (percentage / 100) * 360 : 0;

          return (
            <div 
              key={siswa.rank} 
              className="group bg-white border-2 rounded-xl p-6 flex flex-col items-center relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
              style={{ borderColor: siswa.theme.color }}
            >
              {/* Nomor Peringkat */}
              <div 
                className="absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-10"
                style={{ backgroundColor: siswa.theme.color }}
              >
                {siswa.rank}
              </div>

              {/* Icon Siswa (Animasi Melayang) */}
              <div className="animate-float mb-4 mt-2">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: siswa.theme.ring, backgroundColor: siswa.theme.bg }}
                >
                  <GraduationCap size={32} style={{ color: siswa.theme.color }} />
                </div>
              </div>

              {/* Nama & Kelas */}
              <h4 className="font-bold text-gray-800 text-center text-sm leading-tight">{siswa.nama}</h4>
              <p className="text-xs text-gray-500 mb-5">{siswa.kelas}</p>

              {/* Diagram Lingkaran Poin (Donut Chart) */}
              <div className="relative w-28 h-28 mb-5 group-hover:scale-105 transition-transform duration-300">
                
                {/* Wrapper yang berputar */}
                <div className="absolute inset-0 rounded-full animate-spin-slow">
                  <div className="w-full h-full rounded-full shadow-sm" style={{
                    background: `conic-gradient(${siswa.theme.color} ${deg}deg, #E5E7EB ${deg}deg 360deg)`,
                    transition: 'background 1.5s ease-out'
                  }}></div>
                </div>

                {/* Tengah Donut (Diam/Tidak Berputar) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                  <p className="text-xl font-bold text-gray-800">{siswa.poin}</p>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider">POIN</p>
                </div>
              </div>

              {/* Badge Penghargaan */}
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full text-center">
                {siswa.penghargaan}
              </span>

            </div>
          );
        })}
      </div>

      {/* Animasi CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
}