"use client";

import React from 'react';
import { FileText, Users, BookOpen, ExternalLink } from 'lucide-react';

const aksesData = [
  {
    icon: FileText,
    title: "Formulir Tracker Studi & SNPMB",
    button: "Isi Formulir",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    icon: Users,
    title: "Portal Orang Tua",
    button: "Akses Data",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    icon: BookOpen,
    title: "Seputar Sekolah",
    button: "Lihat Berita",
    color: "#10B981",
    bg: "#ECFDF5",
  },
];

export default function AksesCepatInformasi() {
  return (
    <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm font-poppins">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Akses Cepat Informasi</h2>
        <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
      </div>

      {/* Kartu Akses Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aksesData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Icon */}
              <div 
                className="p-4 rounded-full mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                <Icon size={28} />
              </div>

              {/* Judul */}
              <h4 className="font-bold text-sm md:text-base text-gray-800 mb-5 leading-tight min-h-[2.5rem] flex items-center">
                {item.title}
              </h4>

              {/* Tombol */}
              <button 
                className="text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all duration-150 hover:opacity-90"
                style={{ backgroundColor: item.color }}
              >
                {item.button}
                <ExternalLink size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}