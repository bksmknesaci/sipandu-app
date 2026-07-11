'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, HeartPulse, Search, UserCheck, Award, Newspaper, MapPin, ArrowLeft
} from 'lucide-react';

const MENUS = [
  { title: 'Portal Orang Tua', desc: 'Cek data & kehadiran anak', icon: Users, href: '/portal-ortu', gradient: 'linear-gradient(135deg, #059669, #10b981)', shadow: 'rgba(16,185,129,0.4)' },
  { title: 'Absen Sakit & Izin', desc: 'Ajukan ketidakhadiran online', icon: HeartPulse, href: '/absen-sakit-izin', gradient: 'linear-gradient(135deg, #db2777, #ec4899)', shadow: 'rgba(236,72,153,0.4)' },
  { title: 'Cari Data Siswa', desc: 'Temukan profil & data siswa', icon: Search, href: '/cari-data-siswa', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', shadow: 'rgba(59,130,246,0.4)' },
  { title: 'Absen Hadir Mandiri', desc: 'Scan QR untuk absensi hadir', icon: UserCheck, href: '/absen-mandiri', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)', shadow: 'rgba(99,102,241,0.4)' },
  { title: 'Absensi PKL', desc: 'Absensi hadir saat PKL', icon: MapPin, href: '/absensi-pkl', gradient: 'linear-gradient(135deg, #ea580c, #f97316)', shadow: 'rgba(249,115,22,0.4)' },
  { title: 'Siswa Berprestasi', desc: 'Berita prestasi siswa sekolah', icon: Award, href: '/siswa-berprestasi', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', shadow: 'rgba(245,158,11,0.4)' },
  { title: 'Seputar Sekolah', desc: 'Informasi & berita sekolah', icon: Newspaper, href: '/berita-sekolah', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', shadow: 'rgba(6,182,212,0.4)' },
];

export default function MobileSiswa() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div className="absolute bottom-2 -left-6 w-28 h-28 rounded-full bg-white/5"></div>
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-2xl">🎓</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Siswa</h1>
            <p className="text-blue-200 text-xs font-medium mt-0.5">Menu akses layanan siswa</p>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 -mt-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {MENUS.map((menu, idx) => {
            const Icon = menu.icon;
            const delay = idx * 100;
            return (
              <button
                key={menu.href}
                onClick={() => router.push(menu.href)}
                className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 ease-out active:scale-95 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  background: menu.gradient,
                  boxShadow: `0 4px 15px ${menu.shadow}`,
                }}
              >
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 transition-transform duration-500 ease-out group-hover:scale-[1.8] group-hover:-bottom-6 group-hover:-right-6"></div>
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white/5 transition-transform duration-500 ease-out group-hover:scale-[1.5]"></div>
                <div className="relative z-10">
                  <div
                    className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3"
                    style={{ animation: `bounceSlow 2s ease-in-out ${delay}ms infinite` }}
                  >
                    <Icon size={22} className="text-white drop-shadow-sm" />
                  </div>
                  <h3 className="text-white font-bold text-[13px] leading-tight drop-shadow-sm">{menu.title}</h3>
                  <p className="text-white/65 text-[10px] mt-1 leading-snug drop-shadow-sm">{menu.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}