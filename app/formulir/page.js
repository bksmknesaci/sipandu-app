"use client";

import React, { useState } from 'react';
import { GraduationCap, Briefcase, University, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formulirData = [
  {
    id: 'tracer',
    title: 'Tracer Studi Lulusan',
    icon: GraduationCap,
    description: 'Pendataan alumni setelah lulus untuk mengetahui aktivitas lanjutan seperti bekerja, kuliah, berwirausaha, kursus, atau sedang mencari pekerjaan.',
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    path: '/formulir/tracer-studi'
  },
  {
    id: 'karir',
    title: 'Pemetaan Karir',
    icon: Briefcase,
    description: 'Pendataan minat karir dan rencana masa depan siswa sebagai dasar pemetaan layanan Bimbingan Karir sekolah.',
    color: 'from-green-500 to-emerald-600',
    bgLight: 'bg-green-50',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
    path: '/formulir/pemetaan-karir'
  },
  {
    id: 'snbp',
    title: 'Pendataan SNBP & SNBT',
    icon: University,
    description: 'Pendataan siswa yang mengikuti jalur masuk Perguruan Tinggi Negeri melalui SNBP maupun SNBT.',
    color: 'from-orange-500 to-amber-600',
    bgLight: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    path: '/formulir/snbp-snbt'
  }
];

export default function FormulirPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20">
          <GraduationCap size={48} />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">📝 Pusat Formulir SIPANDU</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base font-medium max-w-2xl">
            Silakan pilih formulir sesuai kebutuhan Anda. Data yang diisi akan tersimpan otomatis ke sistem SIPANDU.
          </p>
        </div>
      </div>

      {/* FORM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formulirData.map((form) => {
          const Icon = form.icon;
          const isHovered = hoveredCard === form.id;

          return (
            <div 
              key={form.id}
              className={`relative bg-white rounded-2xl shadow-sm border ${form.borderColor} p-6 flex flex-col transition-all duration-300 ${isHovered ? 'shadow-xl -translate-y-2 scale-[1.02]' : ''}`}
              onMouseEnter={() => setHoveredCard(form.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`${form.bgLight} w-14 h-14 rounded-xl flex items-center justify-center mb-5`}>
                <Icon size={28} className={form.iconColor} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{form.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-grow">{form.description}</p>
              
              <button 
                onClick={() => router.push(form.path)}
                className={`mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${form.color} text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg active:scale-95`}
              >
                Isi Formulir <ArrowRight size={16} className={`${isHovered ? 'translate-x-1' : ''} transition-transform`}/>
              </button>
            </div>
          )
        })}
      </div>

    </div>
  );
}