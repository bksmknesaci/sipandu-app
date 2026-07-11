'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Shield, BarChart2, FileText, ArrowRightLeft, UserCog, Building2,
  UserCheck, CalendarCheck, QrCode, Newspaper, MessageCircle, ArrowLeft
} from 'lucide-react';

const MENUS = [
  { title: 'Daftar Siswa', desc: 'Kelola data siswa & kelas', icon: Users, href: '/admin/siswa', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', shadow: 'rgba(59,130,246,0.4)' },
  { title: 'Penanganan Siswa', desc: 'Monitoring & tindak lanjut', icon: Shield, href: '/admin/siswa/penanganan', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', shadow: 'rgba(139,92,246,0.4)' },
  { title: 'Rekap Reward', desc: 'Rekapitulasi poin prestasi', icon: BarChart2, href: '/admin/rekap-reward', gradient: 'linear-gradient(135deg, #059669, #10b981)', shadow: 'rgba(16,185,129,0.4)' },
  { title: 'Rekap Formulir', desc: 'Data tracer, karir, SNBT', icon: FileText, href: '/admin/rekap-formulir', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', shadow: 'rgba(6,182,212,0.4)' },
  { title: 'Rekap Pindah & Keluar', desc: 'Data siswa mutasi sekolah', icon: ArrowRightLeft, href: '/admin/siswa/pindah-keluar', gradient: 'linear-gradient(135deg, #ea580c, #f97316)', shadow: 'rgba(249,115,22,0.4)' },
  { title: 'Manajemen User', desc: 'Kelola akun pengguna', icon: UserCog, href: '/admin/users', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)', shadow: 'rgba(99,102,241,0.4)' },
  { title: 'Profil SIPANDU', desc: 'Pengaturan profil & kop surat', icon: Building2, href: '/setting/profil', gradient: 'linear-gradient(135deg, #475569, #64748b)', shadow: 'rgba(100,116,139,0.4)' },
  { title: 'Penanggung Jawab', desc: 'Data wali kelas & sekretaris', icon: UserCheck, href: '/setting/penanggung-jawab', gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)', shadow: 'rgba(244,63,94,0.4)' },
  { title: 'Hari Efektif', desc: 'Kalender libur & hari efektif', icon: CalendarCheck, href: '/setting/hari-efektif', gradient: 'linear-gradient(135deg, #b45309, #f59e0b)', shadow: 'rgba(245,158,11,0.4)' },
  { title: 'QR Absensi', desc: 'Generate & atur QR kelas', icon: QrCode, href: '/setting/qr-absensi', gradient: 'linear-gradient(135deg, #a16207, #d97706)', shadow: 'rgba(217,119,6,0.4)' },
  { title: 'Konfigurasi WhatsApp', desc: 'Pengaturan API & pengiriman', icon: MessageCircle, href: '/setting/konfigurasi-whatsapp', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', shadow: 'rgba(34,197,94,0.4)' },
  { title: 'Pos Berita', desc: 'Kelola berita & prestasi', icon: Newspaper, href: '/setting/pos-berita', gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)', shadow: 'rgba(20,184,166,0.4)' },
];

export default function MobileAdmin() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-800 pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div className="absolute bottom-2 -left-6 w-28 h-28 rounded-full bg-white/5"></div>
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Administrator</h1>
            <p className="text-slate-300 text-xs font-medium mt-0.5">Menu pengelolaan sistem</p>
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