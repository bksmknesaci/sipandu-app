"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, ExternalLink, Award, AlertTriangle, MessageCircle, Camera, PlayCircle, Music2, ChevronRight, FileText, Users, BookOpen, ClipboardList, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import RekapReward from '@/app/components/RekapReward';
import RekapPelanggaran from '@/app/components/RekapPelanggaran';
import TopReward from '@/app/components/TopReward';
import DaftarTidakHadir from '@/app/components/DaftarTidakHadir';
import RekapSiswa from './components/RekapSiswa';
import SiswaBerprestasiBerita from '@/app/components/SiswaBerprestasiBerita';
import CariDataSiswaWidget from '@/app/components/CariDataSiswaWidget';
import AksesCepatInformasi from '@/app/components/AksesCepatInformasi';
import { getFormulirStats } from '@/app/actions/formulirActions';

const allRewardData = [
  [{ name: 'X RPL', reward: 85 }, { name: 'XI TKJ', reward: 72 }, { name: 'XII MM', reward: 90 }],
  [{ name: 'XI DKV', reward: 95 }, { name: 'XII RPL', reward: 68 }, { name: 'X TKRO', reward: 78 }],
];

const allPelanggaranData = [
  [{ name: 'XI PH 2', pelanggaran: 145 }, { name: 'XI TKRO 1', pelanggaran: 85 }, { name: 'XII DKV 2', pelanggaran: 75 }],
  [{ name: 'X DKV 1', pelanggaran: 110 }, { name: 'XII RPL 3', pelanggaran: 90 }, { name: 'XI MM 1', pelanggaran: 65 }],
];

export default function SIPANDU() {
  const [currentImg, setCurrentImg] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [chartCycle, setChartCycle] = useState(0);
  
  const [settings, setSettings] = useState({ 
    logo_url: null, hero_images: [], nama_sekolah: 'SIPANDU', 
    alamat: '', tentang: '', facebook: '', instagram: '', youtube: '', tiktok: '', tim: '' 
  });

  // State untuk Statistik Formulir
  const [formStats, setFormStats] = useState({ totalTracer: 0, totalKarir: 0, totalSnbp: 0, totalAll: 0 });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // Fetch Statistik Formulir
  useEffect(() => {
    const loadFormStats = async () => {
      const res = await getFormulirStats();
      if (res) setFormStats(res);
    };
    loadFormStats();
  }, []);

  useEffect(() => {
    let i = 0;
    const fullText = "SISTEM INFORMASI DAN PENANGANAN SISWA TERPADU";
    const timer = setInterval(() => {
      if (i < fullText.length) { setTypedText(fullText.substring(0, i + 1)); i++; } 
      else { i = 0; setTypedText(""); }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setChartCycle((prev) => (prev + 1) % 2), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const images = settings.hero_images || [];
    if (images.length <= 1) { setCurrentImg(0); return; }
    const timer = setInterval(() => { setCurrentImg((prev) => (prev + 1) % images.length); }, 3000);
    return () => clearInterval(timer);
  }, [settings.hero_images]);

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative py-20 md:py-32 flex items-center justify-center text-white overflow-hidden min-h-[500px]">
        {settings.hero_images && settings.hero_images.length > 0 ? (
          settings.hero_images.map((img, index) => (
            <div key={index} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentImg ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${img})` }}></div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-900"></div>
        )}
        <div className={`absolute inset-0 ${settings.hero_images && settings.hero_images.length > 0 ? 'bg-black/60' : 'bg-transparent'}`}></div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg text-sky-400">Selamat Datang di SIPANDU</h2>
          <p className="mb-6 text-sm md:text-lg drop-shadow-md text-blue-100">SIPANDU adalah platform digital yang dirancang untuk mempermudah manajemen siswa di Sekolah.</p>
          <div className="border-2 border-sky-400 p-2 md:p-3 inline-block rounded-lg bg-sky-500/20 backdrop-blur-sm mb-8">
            <p className="text-sm md:text-lg font-bold tracking-widest text-sky-300">{typedText}<span className="animate-pulse">|</span></p>
          </div>
          <CariDataSiswaWidget />
        </div>
      </section>

      <div className="p-4 md:p-8">
        <AksesCepatInformasi />

        {/* SISWA BERPRESTASI & BERITA */}
        <SiswaBerprestasiBerita />

        {/* GRAFIK REWARD & PELANGGARAN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
          <RekapReward data={allRewardData[chartCycle]} />
          <RekapPelanggaran data={allPelanggaranData[chartCycle]} />
        </div>

        <div className="space-y-8">
          <TopReward />
          <DaftarTidakHadir />
          <RekapSiswa settings={settings} />
        </div>

        <div className="h-8"></div>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-slate-300 p-6 md:p-8 rounded-t-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-3 text-sm md:text-base">Alamat</h4>
              <p className="text-xs md:text-sm">{settings.alamat || 'Jl. Raya Cikedung, Indramayu, Jawa Barat'}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm md:text-base">Formulir</h4>
              <ul className="space-y-2 text-xs md:text-sm">
                <li><a href="/formulir/tracer-studi" className="flex items-center gap-2 hover:text-white transition-colors active:scale-95 active:text-sky-400"><ChevronRight size={14} className="text-sky-400" />Tracer Studi</a></li>
                <li><a href="/formulir/snbp-snbt" className="flex items-center gap-2 hover:text-white transition-colors active:scale-95 active:text-sky-400"><ChevronRight size={14} className="text-sky-400" />SNBP / SNBT</a></li>
                <li><a href="/formulir/pemetaan-karir" className="flex items-center gap-2 hover:text-white transition-colors active:scale-95 active:text-sky-400"><ChevronRight size={14} className="text-sky-400" />Pemetaan Karir</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm md:text-base">Tentang</h4>
              <p className="text-xs md:text-sm">{settings.tentang || 'Sistem informasi terpadu untuk manajemen data dan kedisiplinan siswa.'}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm md:text-base">Follow Kami</h4>
              <div className="flex gap-4 text-slate-400">
                <a href={settings.facebook || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><MessageCircle size={20}/></a>
                <a href={settings.instagram || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Camera size={20}/></a>
                <a href={settings.youtube || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><PlayCircle size={20}/></a>
                <a href={settings.tiktok || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Music2 size={20}/></a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center text-xs md:text-sm text-slate-500">
            Copyright © 2026 | SIPANDU {settings.nama_sekolah || 'SMK Negeri 1 Cikedung'} | Developed By: {settings.tim || 'Rifki Aripin, S.Pd'}
          </div>
        </footer>
      </div>
    </>
  );
}