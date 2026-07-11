'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Award, AlertTriangle, ArrowLeft } from 'lucide-react';

const MENUS = [
  { title: 'Entri Reward', desc: 'Input poin penghargaan siswa', icon: Award, href: '/osis/entri-reward', gradient: 'linear-gradient(135deg, #059669, #10b981)', shadow: 'rgba(16,185,129,0.4)' },
  { title: 'Entri Pelanggaran', desc: 'Input poin pelanggaran siswa', icon: AlertTriangle, href: '/osis/entri-pelanggaran', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', shadow: 'rgba(239,68,68,0.4)' },
];

export default function MobileOsis() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-600 pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div className="absolute bottom-2 -left-6 w-28 h-28 rounded-full bg-white/5"></div>
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-2xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">OSIS</h1>
            <p className="text-emerald-200 text-xs font-medium mt-0.5">Menu piket & penilaian siswa</p>
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