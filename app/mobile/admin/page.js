'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, UserCog, BarChart2, FileText, ArrowRightLeft, Shield,
  Building2, UserCheck, CalendarCheck, Newspaper, MessageCircle
} from 'lucide-react';

const menus = [
  { icon: Users, title: 'Daftar Siswa', href: '/admin/siswa', color: 'blue', desc: 'Kelola data siswa' },
  { icon: UserCog, title: 'Penanganan Siswa', href: '/admin/siswa/penanganan', color: 'red', desc: 'BK & surat peringatan' },
  { icon: BarChart2, title: 'Rekap Reward', href: '/admin/rekap-reward', color: 'green', desc: 'Statistik & data reward' },
  { icon: FileText, title: 'Rekap Formulir', href: '/admin/rekap-formulir', color: 'violet', desc: 'Tracer, karir, SNBP' },
  { icon: ArrowRightLeft, title: 'Rekap Pindah & Keluar', href: '/admin/siswa/pindah-keluar', color: 'orange', desc: 'Siswa pindah/keluar' },
  { icon: UserCog, title: 'Manajemen User', href: '/admin/users', color: 'indigo', desc: 'Kelola akun pengguna' },
  { icon: Building2, title: 'Profil SIPANDU', href: '/setting/profil', color: 'slate', desc: 'Pengaturan aplikasi' },
  { icon: UserCheck, title: 'Penanggung Jawab', href: '/setting/penanggung-jawab', color: 'teal', desc: 'Wali kelas & sekretaris' },
  { icon: CalendarCheck, title: 'Hari Efektif', href: '/setting/hari-efektif', color: 'cyan', desc: 'Kalender & libur' },
  { icon: MessageCircle, title: 'Konfigurasi WhatsApp', href: '/setting/konfigurasi-whatsapp', color: 'emerald', desc: 'Fonnte API & notif WA' },
  { icon: Newspaper, title: 'Pos Berita', href: '/setting/pos-berita', color: 'pink', desc: 'Kelola berita sekolah' },
];

const C = {
  blue:    { border: 'border-l-blue-500',    bg: 'bg-blue-50',    icon: 'text-blue-600' },
  red:     { border: 'border-l-red-500',     bg: 'bg-red-50',     icon: 'text-red-600' },
  green:   { border: 'border-l-green-500',   bg: 'bg-green-50',   icon: 'text-green-600' },
  violet:  { border: 'border-l-violet-500',  bg: 'bg-violet-50',  icon: 'text-violet-600' },
  orange:  { border: 'border-l-orange-500',  bg: 'bg-orange-50',  icon: 'text-orange-600' },
  indigo:  { border: 'border-l-indigo-500',  bg: 'bg-indigo-50',  icon: 'text-indigo-600' },
  slate:   { border: 'border-l-slate-500',   bg: 'bg-slate-100',  icon: 'text-slate-600' },
  teal:    { border: 'border-l-teal-500',    bg: 'bg-teal-50',    icon: 'text-teal-600' },
  cyan:    { border: 'border-l-cyan-500',    bg: 'bg-cyan-50',    icon: 'text-cyan-600' },
  emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  pink:    { border: 'border-l-pink-500',    bg: 'bg-pink-50',    icon: 'text-pink-600' },
};

export default function MobileAdminPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  useEffect(() => { try { const s = localStorage.getItem('userData'); if (s) setUserData(JSON.parse(s)); } catch {} }, []);

  const role = userData?.role;
  if (role !== 'Administrator') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 mb-4">Halaman ini hanya untuk Administrator</p>
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
            <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30" style={{width:52,height:52}}><Shield size={24} /></div>
            <div>
              <h1 className="text-lg font-bold text-white">Menu Admin</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{userData?.nama || 'Administrator'}</p>
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