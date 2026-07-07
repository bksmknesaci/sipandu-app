'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, AlertTriangle, FileWarning, HeartPulse, CalendarDays, Shield, BarChart3 } from 'lucide-react';

const menus = [
  { icon: Award, title: 'Entri Reward', href: '/wali-kelas/entri-reward', color: 'green', desc: 'Input poin reward siswa' },
  { icon: AlertTriangle, title: 'Entri Pelanggaran', href: '/wali-kelas/entri-pelanggaran', color: 'red', desc: 'Catat pelanggaran siswa' },
  { icon: FileWarning, title: 'Rekap Pelanggaran', href: '/wali-kelas/rekap-pelanggaran', color: 'orange', desc: 'Ringkasan pelanggaran' },
  { icon: HeartPulse, title: 'Rekap Sakit & Izin', href: '/wali-kelas/rekap-sakit-izin', color: 'blue', desc: 'Verifikasi sakit/izin' },
  { icon: CalendarDays, title: 'Rekap Kehadiran', href: '/wali-kelas/rekap-kehadiran', color: 'teal', desc: 'Rekap absensi lengkap' },
  { icon: BarChart3, title: 'Rekap Kehadiran PKL', href: '/wali-kelas/rekap-pkl', color: 'purple', desc: 'Monitoring kehadiran siswa PKL' },
];

const C = {
  green:  { bg: 'linear-gradient(135deg,#22c55e,#16a34a)',  shadow: '0 10px 15px -3px rgba(34,197,94,0.3)' },
  red:    { bg: 'linear-gradient(135deg,#ef4444,#dc2626)',    shadow: '0 10px 15px -3px rgba(239,68,68,0.3)' },
  orange: { bg: 'linear-gradient(135deg,#f97316,#ea580c)',  shadow: '0 10px 15px -3px rgba(249,115,22,0.3)' },
  blue:   { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)',   shadow: '0 10px 15px -3px rgba(59,130,246,0.3)' },
  teal:   { bg: 'linear-gradient(135deg,#14b8a6,#0d9488)',   shadow: '0 10px 15px -3px rgba(20,184,166,0.3)' },
  purple: { bg: 'linear-gradient(135deg,#a855f7,#9333ea)',  shadow: '0 10px 15px -3px rgba(168,85,247,0.3)' },
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
                className="mc rounded-2xl p-4 active:scale-95 transition-all duration-200 text-left relative overflow-hidden"
                style={{ animationDelay: `${i * 80}ms`, background: c.bg, boxShadow: c.shadow }}>
                <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-white/10" />
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3 mc-bounce" style={{ animationDelay: `${i * 150}ms` }}>
                  <menu.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-white text-[13px] leading-tight relative z-10">{menu.title}</h3>
                <p className="text-[10px] text-white/70 mt-1 leading-snug relative z-10">{menu.desc}</p>
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