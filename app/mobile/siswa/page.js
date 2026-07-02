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
  blue:    { border: 'border-l-blue-500',    bg: 'bg-blue-50',    icon: 'text-blue-600' },
  amber:   { border: 'border-l-amber-500',   bg: 'bg-amber-50',   icon: 'text-amber-600' },
  indigo:  { border: 'border-l-indigo-500',  bg: 'bg-indigo-50',  icon: 'text-indigo-600' },
  emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  green:   { border: 'border-l-green-500',   bg: 'bg-green-50',   icon: 'text-green-600' },
  violet: { border: 'border-l-violet-500',  bg: 'bg-violet-50',  icon: 'text-violet-600' },
  sky:    { border: 'border-l-sky-500',     bg: 'bg-sky-50',     icon: 'text-sky-600' },
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
                className="mc bg-white rounded-2xl border-t-gray-100 border-r-gray-100 border-b-gray-100 border-l-4 shadow-sm p-4 active:scale-95 transition-all duration-200 hover:shadow-md text-left"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <menu.icon size={24} className={c.icon} />
                </div>
                <h3 className="font-semibold text-gray-800 text-[13px] leading-tight">{menu.title}</h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-snug line-clamp-2">{menu.desc}</p>
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
      `}</style>
    </div>
  );
}