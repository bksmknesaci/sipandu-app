'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, HeartPulse, Search, UserCheck, Award, Newspaper, MapPin } from 'lucide-react';

const menus = [
  { icon: Users, title: 'Portal Orang Tua', href: '/portal-ortu', color: 'blue', desc: 'Monitoring siswa oleh orang tua' },
  { icon: HeartPulse, title: 'Absen Sakit & Izin', href: '/absen-sakit-izin', color: 'amber', desc: 'Pengajuan ketidakhadiran' },
  { icon: Search, title: 'Cari Data Siswa', href: '/cari-data-siswa', color: 'indigo', desc: 'Pencarian data lengkap siswa' },
  { icon: UserCheck, title: 'Absen Hadir Mandiri', href: '/absen-mandiri', color: 'emerald', desc: 'Scan QR untuk hadir' },
  { icon: MapPin, title: 'Absensi PKL', href: '/absensi-pkl', color: 'sky', desc: 'Absensi Praktik Kerja Lapangan' },
  { icon: Award, title: 'Siswa Berprestasi', href: '/siswa-berprestasi', color: 'green', desc: 'Daftar siswa berprestasi' },
  { icon: Newspaper, title: 'Seputar Sekolah', href: '/berita-sekolah', color: 'violet', desc: 'Berita dan informasi sekolah' },
];

const C = {
  blue:    { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: '0 10px 15px -3px rgba(59,130,246,0.3)' },
  amber:   { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: '0 10px 15px -3px rgba(245,158,11,0.3)' },
  indigo:  { bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', shadow: '0 10px 15px -3px rgba(99,102,241,0.3)' },
  emerald: { bg: 'linear-gradient(135deg,#10b981,#059669)', shadow: '0 10px 15px -3px rgba(16,185,129,0.3)' },
  green:   { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', shadow: '0 10px 15px -3px rgba(34,197,94,0.3)' },
  violet:  { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', shadow: '0 10px 15px -3px rgba(139,92,246,0.3)' },
  sky:     { bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)', shadow: '0 10px 15px -3px rgba(14,165,233,0.3)' },
};

export default function MobileSiswaPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  useEffect(() => { try { const s = localStorage.getItem('userData'); if (s) setUserData(JSON.parse(s)); } catch {} }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 px-5 pt-12 pb-7">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 transition-colors active:scale-95">
            <ArrowLeft size={20} /><span className="text-sm font-medium">Kembali</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30" style={{width:52,height:52}}>S</div>
            <div>
              <h1 className="text-lg font-bold text-white">Menu Siswa</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{userData?.nama || 'Pengguna'}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 h-5 rounded-t-3xl -mt-1" />
      </div>

      <div className="px-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {menus.map((menu, i) => {
            const c = C[menu.color] || C.blue;
            return (
              <button key={menu.href} onClick={() => router.push(menu.href)}
                className="mc rounded-2xl p-4 active:scale-95 transition-all duration-200 text-left relative overflow-hidden"
                style={{ animationDelay: `${i * 80}ms`, background: c.bg, boxShadow: c.shadow }}>
                <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-white/10" />
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3 mc-bounce" style={{ animationDelay: `${i * 150}ms` }}>
                  <menu.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-white text-[13px] leading-tight relative z-10">{menu.title}</h3>
                <p className="text-[10px] text-white/70 mt-1 leading-snug line-clamp-2 relative z-10">{menu.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes mcSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mc { opacity: 0; animation: mcSlideUp 0.4s ease-out forwards; }
        @keyframes mcBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .mc-bounce { animation: mcBounce 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}