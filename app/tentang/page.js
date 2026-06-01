"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { ArrowLeft, BookOpen, Eye, Target, Users } from 'lucide-react';

export default function TentangSIPANDU() {
  const [settings, setSettings] = useState({ nama_sekolah: '', tentang: '', visi: '', misi: '', tim: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95 active:bg-blue-800 px-4 py-2 rounded-lg mb-6 transition-all duration-200">
          <ArrowLeft size={20} /> Kembali ke Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><BookOpen size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Tentang SIPANDU</h1>
            <p className="text-gray-500 text-sm">{settings.nama_sekolah || 'SMK Negeri 1 Cikedung'}</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Bagian Tentang */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><BookOpen size={20} className="text-blue-600"/> Tentang Aplikasi</h3>
            <p className="text-gray-700 leading-relaxed">
              {settings.tentang || 'Belum ada informasi tentang aplikasi. Silakan diisi di halaman Profil SIPANDU.'}
            </p>
          </div>

          {/* Bagian Visi & Misi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Eye size={20} className="text-blue-600"/> Visi</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {settings.visi || 'Belum ada visi.'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Target size={20} className="text-blue-600"/> Misi</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {settings.misi || 'Belum ada misi.'}
              </p>
            </div>
          </div>

          {/* Bagian Tim Pengembang */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Tim Pengembang</h3>
            <p className="text-gray-700">
              {settings.tim || 'Belum ada informasi tim.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}