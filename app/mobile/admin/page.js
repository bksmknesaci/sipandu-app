'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, UserCog, BarChart2, FileText, ArrowRightLeft, Shield,
  Building2, UserCheck, CalendarCheck, Newspaper, MessageCircle, QrCode
} from 'lucide-react';

const menus = [
  { icon: Users, title: 'Daftar Siswa', href: '/admin/siswa', color: 'blue', desc: 'Kelola data siswa' },
  { icon: UserCog, title: 'Penanganan Siswa', href: '/admin/siswa/penanganan', color: 'red', desc: 'Pembinaan & surat pernyataan' },
  { icon: BarChart2, title: 'Rekap Reward', href: '/admin/rekap-reward', color: 'green', desc: 'Statistik & data reward' },
  { icon: FileText, title: 'Rekap Formulir', href: '/admin/rekap-formulir', color: 'violet', desc: 'Tracer, karir, SNBP' },
  { icon: ArrowRightLeft, title: 'Rekap Pindah & Keluar', href: '/admin/siswa/pindah-keluar', color: 'orange', desc: 'Siswa pindah/keluar' },
  { icon: UserCog, title: 'Manajemen User', href: '/admin/users', color: 'indigo', desc: 'Kelola akun pengguna' },
  { icon: QrCode, title: 'QR Absensi', href: '/setting/qr-absensi', color: 'amber', desc: 'Generate & pengaturan QR' },
  { icon: Building2, title: 'Profil SIPANDU', href: '/setting/profil', color: 'slate', desc: 'Pengaturan aplikasi' },
  { icon: UserCheck, title: 'Penanggung Jawab', href: '/setting/penanggung-jawab', color: 'teal', desc: 'Wali kelas & sekretaris' },
  { icon: CalendarCheck, title: 'Hari Efektif', href: '/setting/hari-efektif', color: 'cyan', desc: 'Kalender & libur' },
  { icon: MessageCircle, title: 'Konfigurasi WhatsApp', href: '/setting/konfigurasi-whatsapp', color: 'emerald', desc: 'Fonnte API & notif WA' },
  { icon: Newspaper, title: 'Pos Berita', href: '/setting/pos-berita', color: 'pink', desc: 'Kelola berita sekolah' },
];

const C = {
  blue:    { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)',    shadow: '0 10px 15px -3px rgba(59,130,246,0.3)' },
  red:     { bg: 'linear-gradient(135deg,#ef4444,#dc2626)',     shadow: '0 10px 15px -3px rgba(239,68,68,0.3)' },
  green:   { bg: 'linear-gradient(135deg,#22c55e,#16a34a)',   shadow: '0 10px 15px -3px rgba(34,197,94,0.3)' },
  violet:  { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',  shadow: '0 10px 15px -3px rgba(139,92,246,0.3)' },
  orange:  { bg: 'linear-gradient(135deg,#f97316,#ea580c)',  shadow: '0 10px 15px -3px rgba(249,115,22,0.3)' },
  indigo:  { bg: 'linear-gradient(135deg,#6366f1,#4f46e5)',  shadow: '0 10px 15px -3px rgba(99,102,241,0.3)' },
  amber:   { bg: 'linear-gradient(135deg,#f59e0b,#d97706)',   shadow: '0 10px 15px -3px rgba(245,158,11,0.3)' },
  slate:   { bg: 'linear-gradient(135deg,#64748b,#475569)',   shadow: '0 10px 15px -3px rgba(100,116,139,0.3)' },
  teal:    { bg: 'linear-gradient(135deg,#14b8a6,#0d9488)',    shadow: '0 10px 15px -3px rgba(20,184,166,0.3)' },
  cyan:    { bg: 'linear-gradient(135deg,#06b6d4,#0891b2)',    shadow: '0 10px 15px -3px rgba(6,182,212,0.3)' },
  emerald: { bg: 'linear-gradient(135deg,#10b981,#059669)', shadow: '0 10px 15px -3px rgba(16,185,129,0.3)' },
  pink:    { bg: 'linear-gradient(135deg,#ec4899,#db2777)',    shadow: '0 10px 15px -3px rgba(236,72,153,0.3)' },
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