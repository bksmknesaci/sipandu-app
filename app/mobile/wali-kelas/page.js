'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, AlertTriangle, FileWarning, HeartPulse, CalendarDays, Shield } from 'lucide-react';

const menus = [
  { icon: Award, title: 'Entri Reward', href: '/wali-kelas/entri-reward', color: 'green', desc: 'Input poin reward siswa' },
  { icon: AlertTriangle, title: 'Entri Pelanggaran', href: '/wali-kelas/entri-pelanggaran', color: 'red', desc: 'Catat pelanggaran siswa' },
  { icon: FileWarning, title: 'Rekap Pelanggaran', href: '/wali-kelas/rekap-pelanggaran', color: 'orange', desc: 'Ringkasan pelanggaran' },
  { icon: HeartPulse, title: 'Rekap Sakit & Izin', href: '/wali-kelas/rekap-sakit-izin', color: 'blue', desc: 'Verifikasi sakit/izin' },
  { icon: CalendarDays, title: 'Rekap Kehadiran', href: '/rekap-kehadiran', color: 'teal', desc: 'Rekap absensi lengkap' },
];

const C = {
  green:  { border: 'border-l-green-500',  bg: 'bg-green-50',  icon: 'text-green-600' },
  red:    { border: 'border-l-red-500',    bg: 'bg-red-50',    icon: 'text-red-600' },
  orange: { border: 'border-l-orange-500',  bg: 'bg-orange-50',  icon: 'text-orange-600' },
  blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50',   icon: 'text-blue-600' },
  teal:   { border: 'border-l-teal-500',   bg: 'bg-teal-50',   icon: 'text-teal-600' },
};

export default function MobileWaliKelasPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  useEffect(() => { try { const s = localStorage.getItem('userData'); if (s) setUserData(JSON.parse(s)); } catch {} }, []);

  const role = userData?.role;
  if (role !== 'Wali Kelas' && role !== 'Administrator') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 mb-4">Halaman ini hanya untuk Wali Kelas</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all">← Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 px-5 pt-12 pb-7">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 transition-colors active:scale-95">
            <ArrowLeft size={20} /><span className="text-sm font-medium">Kembali</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30" style={{width:52,height:52}}><CalendarDays size={24} /></div>
            <div>
              <h1 className="text-lg font-bold text-white">Menu Wali Kelas</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{userData?.nama || 'Wali Kelas'}</p>
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