"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase'; // IMPORT SUPABASE DITAMBAHKAN DI SINI
import { 
  Home, Info, Bell, LogIn, LogOut, Menu, X, User, Shield, Search, 
  HeartPulse, GraduationCap, BookOpen, ClipboardList, CalendarDays, AlertTriangle, Award, 
  Settings, ChevronDown, ChevronRight, Users, FileText, UserMinus, 
  MessageCircle, Camera, PlayCircle, Music2, ExternalLink,
  UserCheck, ArrowRightLeft, BarChart2, FileWarning, UserCog, Newspaper, CalendarCheck, Building2, ClipboardCheck
} from 'lucide-react';

const allRewardData = [
  [{ name: 'X RPL', reward: 85 }, { name: 'XI TKJ', reward: 72 }, { name: 'XII MM', reward: 90 }],
  [{ name: 'XI DKV', reward: 95 }, { name: 'XII RPL', reward: 68 }, { name: 'X TKRO', reward: 78 }],
];

const allPelanggaranData = [
  [{ name: 'XI PH 2', pelanggaran: 145 }, { name: 'XI TKRO 1', pelanggaran: 85 }, { name: 'XII DKV 2', pelanggaran: 75 }],
  [{ name: 'X DKV 1', pelanggaran: 110 }, { name: 'XII RPL 3', pelanggaran: 90 }, { name: 'XI MM 1', pelanggaran: 65 }],
];

const newsData = [
  { title: "Paskibra SMKN 1 Cikedung Bersinar di LKBB Open", date: "20 Mei 2026", desc: "Tim paskibra berhasil meraih juara 2 dalam lomba tingkat provinsi." },
  { title: "SMKN 1 Cikedung Ukir Prestasi Pencak Silat", date: "15 Mei 2026", desc: "Siswa kami meraih medali emas di kejuaraan pencak silat daerah." },
  { title: "Workshop Industri oleh Alumni SMKN 1 Cikedung", date: "10 Mei 2026", desc: "Alumni berbagi pengalaman tentang dunia kerja IT saat ini." },
];

export default function SIPANDU() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [currentImg, setCurrentImg] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [chartCycle, setChartCycle] = useState(0);
  
  // State tunggal untuk pengaturan dari Supabase
  const [settings, setSettings] = useState({ 
    logo_url: null, 
    hero_images: [], 
    nama_sekolah: 'SIPANDU' 
  });

  // 1. Cek Status Login
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') setIsLoggedIn(true);
  }, []);

  // 2. Ambil Data Pengaturan dari Supabase (Menggantikan localStorage)
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // 3. Efek Mengetik
  useEffect(() => {
    let i = 0;
    const fullText = "SISTEM INFORMASI DAN PENANGANAN SISWA TERPADU";
    const timer = setInterval(() => {
      if (i < fullText.length) { setTypedText(fullText.substring(0, i + 1)); i++; } 
      else { i = 0; setTypedText(""); }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 4. Efek Grafik Berganti
  useEffect(() => {
    const timer = setInterval(() => setChartCycle((prev) => (prev + 1) % 2), 4000);
    return () => clearInterval(timer);
  }, []);

    // 5. Efek Hero Image Berganti (3 detik)
  useEffect(() => {
    const images = settings.hero_images || [];
    if (images.length <= 1) {
      setCurrentImg(0); // Reset jika cuma 1 atau 0 foto
      return;
    }
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [settings.hero_images]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const closeSidebarMobile = () => setSidebarOpen(false);

  const NavLink = ({ icon: Icon, title, href="/", menuId }) => (
    <Link href={href} onClick={() => { setActiveMenu(menuId); closeSidebarMobile(); }} className={`flex items-center gap-3 py-3 pl-6 pr-3 rounded-lg mx-2 text-slate-300 transition-colors duration-150 whitespace-nowrap ${activeMenu === menuId ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-slate-700 hover:shadow-md active:scale-95 active:bg-slate-600'}`}>
      <div className="flex-shrink-0 w-5 inline-flex justify-center"><Icon size={20} /></div>
      <span className="inline-block md:hidden md:group-hover:inline-block">{title}</span>
    </Link>
  );

  const DropdownMenu = ({ title, icon: Icon, menuKey, children, menuId }) => (
    <div className="mx-2">
      <button onClick={() => { toggleMenu(menuKey); setActiveMenu(menuId); }} className={`w-full flex items-center justify-between py-3 pl-6 pr-3 rounded-lg text-slate-300 transition-colors duration-150 whitespace-nowrap ${activeMenu === menuId ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-slate-700 hover:shadow-md active:scale-95 active:bg-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-5 inline-flex justify-center"><Icon size={20} /></div>
          <span className="inline-block md:hidden md:group-hover:inline-block">{title}</span>
        </div>
        <div className="inline-block md:hidden md:group-hover:inline-block">
          {openMenus[menuKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      {openMenus[menuKey] && <div className="mt-1 space-y-1 pl-6">{children}</div>}
    </div>
  );

  const SubLink = ({ icon: Icon, title, href="/" }) => (
    <Link href={href} onClick={closeSidebarMobile} className="flex items-center gap-3 py-2 pl-10 pr-3 text-sm text-slate-400 hover:text-white hover:bg-slate-700 hover:shadow-sm active:scale-95 active:bg-slate-600 rounded-md transition-colors duration-150 whitespace-nowrap">
      <div className="flex-shrink-0 w-4 inline-flex justify-center"><Icon size={16} /></div>
      <span className="inline-block md:hidden md:group-hover:inline-block">{title}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      
      {/* Overlay Gelap untuk Mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebarMobile}></div>}

                  {/* --- SIDEBAR --- */}
      <aside className={`group fixed z-50 h-full bg-slate-900 text-white flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full w-72'} 
        md:translate-x-0 md:w-20 md:hover:w-72`}>
        
        {/* Header Sidebar */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden shadow-md bg-slate-800">
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 font-extrabold text-xl shadow-md">S</div>
            )}
            <div className="inline-block md:hidden md:group-hover:inline-block whitespace-nowrap">
              <h1 className="text-2xl font-extrabold text-blue-400 tracking-wider">SIPANDU</h1>
              <p className="text-[10px] text-slate-400 -mt-1">SMK Negeri 1 Cikedung</p>
            </div>
          </div>
          <button className="md:hidden text-slate-400" onClick={closeSidebarMobile}><X size={24}/></button>
        </div>
        
        {/* Profil Admin */}
        {isLoggedIn && (
          <div className="flex-shrink-0 p-4 border-b border-slate-700 flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-full flex-shrink-0 w-[36px] h-[36px] flex justify-center items-center"><User size={20}/></div>
              <div className="inline-block md:hidden md:group-hover:inline-block whitespace-nowrap">
                <p className="font-semibold text-sm">Admin</p>
                <p className="text-xs text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span> Online</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 inline-block md:hidden md:group-hover:inline-block"><LogOut size={18}/></button>
          </div>
        )}

        {/* Navigasi */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-sm scrollbar-thin scrollbar-thumb-slate-700">
          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-2 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU UMUM</p>
          <NavLink icon={Users} title="Portal Orang Tua" menuId="portal" />
          <NavLink icon={Award} title="Siswa Berprestasi" menuId="prestasi" />
          <NavLink icon={GraduationCap} title="Tracer Studi Lulusan" menuId="tracer" />

          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SISWA</p>
          <NavLink icon={HeartPulse} title="Absen Sakit & Izin" menuId="sakit" />
          <NavLink icon={Search} title="Cari Data Siswa" menuId="cari" />

          {isLoggedIn && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SEKRETARIS</p>
              <NavLink icon={ClipboardList} title="Absensi Kehadiran" menuId="absensi" />

              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU OSIS</p>
              <DropdownMenu title="Piket OSIS" icon={CalendarDays} menuKey="osis" menuId="osis">
                <SubLink icon={Award} title="Entri Reward" />
                <SubLink icon={AlertTriangle} title="Entri Pelanggaran" />
              </DropdownMenu>

              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU WALI KELAS</p>
              <DropdownMenu title="Wali Kelas" icon={User} menuKey="wali" menuId="wali">
                <SubLink icon={Award} title="Entri Reward" />
                <SubLink icon={AlertTriangle} title="Entri Pelanggaran" />
                <SubLink icon={FileWarning} title="Rekap Pelanggaran" />
                <SubLink icon={HeartPulse} title="Rekap Sakit & Izin" />
                <SubLink icon={ClipboardCheck} title="Rekap Kehadiran" />
              </DropdownMenu>

              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU ADMIN</p>
              <DropdownMenu title="Administrator" icon={Shield} menuKey="admin" menuId="admin">
                <SubLink icon={Users} title="Daftar Siswa" href="/admin/siswa" />
                <SubLink icon={UserCog} title="Penanganan Siswa" />
                <SubLink icon={BarChart2} title="Rekap Reward" />
                <SubLink icon={FileText} title="Rekap Formulir" />
                <SubLink icon={ArrowRightLeft} title="Rekap Pindah & Keluar" />
              </DropdownMenu>

              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SETTING</p>
              <DropdownMenu title="Pengaturan" icon={Settings} menuKey="setting" menuId="setting">
                <SubLink icon={Building2} title="Profil SIPANDU" href="/setting/profil" />
                <SubLink icon={UserCog} title="Managemen User" />
                <SubLink icon={UserCheck} title="Penanggung Jawab" />
                <SubLink icon={CalendarCheck} title="Hari Efektif" />
                <SubLink icon={Newspaper} title="Pos Berita" />
              </DropdownMenu>
            </>
          )}
        </nav>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <div className="md:ml-20 md:group-hover:ml-72 flex flex-col min-h-screen pb-20 md:pb-0 transition-[margin] duration-300 ease-in-out">
        
        {/* Header (Icon saja di HP, Logo ditambahkan) */}
        <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
            
            {/* Logo SIPANDU pada tampilan HP */}
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-cover md:hidden" />
            ) : (
              <div className="h-12 w-12 rounded-md bg-slate-900 flex items-center justify-center text-blue-400 font-extrabold text-lg md:hidden">S</div>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6 text-gray-600 font-medium text-sm">
            {/* Ikon berjejer, teks hanya muncul di Desktop */}
            <Link href="/" className="flex items-center gap-1 hover:text-blue-600"><Home size={18}/> <span className="hidden md:inline-block">Home</span></Link>
            <Link href="/tentang" className="flex items-center gap-1 hover:text-blue-600"><Info size={18}/> <span className="hidden md:inline-block">Tentang</span></Link>
            <Link href="/" className="flex items-center gap-1 hover:text-blue-600"><Bell size={18}/> <span className="hidden md:inline-block">Informasi</span></Link>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                <LogOut size={16}/> <span className="hidden md:inline-block">Logout</span>
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <LogIn size={16}/> <span className="hidden md:inline-block">Login</span>
              </Link>
            )}
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative py-20 md:py-32 flex items-center justify-center text-white overflow-hidden min-h-[500px]">
          
          {/* Lapisan 1: Gambar dari Supabase dengan Teknik Crossfade (Dijamin Berganti) */}
          {settings.hero_images && settings.hero_images.length > 0 ? (
            settings.hero_images.map((img, index) => (
              <div 
                key={index}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentImg ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundImage: `url(${img})` }}
              ></div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-900"></div>
          )}

          {/* Lapisan 2: Gradien Gelap (Overlay agar teks terbaca) */}
          <div className={`absolute inset-0 ${settings.hero_images && settings.hero_images.length > 0 ? 'bg-black/60' : 'bg-transparent'}`}></div>
          
          {/* Lapisan 3: Konten Teks */}
          <div className="relative z-10 text-center px-4 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 drop-shadow-lg text-sky-400">Selamat Datang di SIPANDU</h2>
            <p className="mb-6 text-sm md:text-lg drop-shadow-md text-blue-100">SIPANDU adalah platform digital yang dirancang untuk mempermudah manajemen siswa di Sekolah. Dengan sistem ini, guru, siswa dan orang tua dapat lebih mudah memantau kegiatan, absensi, serta informasi penting lainnya.</p>
            <div className="border-2 border-sky-400 p-2 md:p-3 inline-block rounded-lg bg-sky-500/20 backdrop-blur-sm mb-8">
              <p className="text-sm md:text-lg font-bold tracking-widest text-sky-300">{typedText}<span className="animate-pulse">|</span></p>
            </div>
            <div className="w-full max-w-xl mx-auto relative">
              <input type="text" placeholder="Cari Data Siswa... Nama/NISN" className="w-full py-3 px-5 pr-14 rounded-full text-gray-800 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors"><Search size={20} /></button>
            </div>
          </div>
        </section>

        <main className="p-4 md:p-8 flex-1">
          {/* GRAFIK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><Award className="text-blue-500" size={20} /> Rekap Reward Terbaik</h3>
              <div className="h-52 md:h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={allRewardData[chartCycle]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="reward" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
              <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500" size={20} /> Rekap Pelanggaran Tertinggi</h3>
              <div className="h-52 md:h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={allPelanggaranData[chartCycle]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="pelanggaran" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
          </div>

          {/* REKAPITULASI SISWA */}
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">REKAPITULASI JUMLAH SISWA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex items-center gap-4 md:gap-6"><div className="bg-blue-100 p-3 md:p-4 rounded-full text-blue-600"><Users size={24}/></div><div><p className="text-xs md:text-sm text-gray-500 font-medium">KELAS X</p><p className="text-2xl md:text-3xl font-bold text-gray-800">432</p><button className="text-xs md:text-sm text-blue-600 font-semibold hover:underline mt-1">Lihat Jumlah →</button></div></div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex items-center gap-4 md:gap-6"><div className="bg-green-100 p-3 md:p-4 rounded-full text-green-600"><Users size={24}/></div><div><p className="text-xs md:text-sm text-gray-500 font-medium">KELAS XI</p><p className="text-2xl md:text-3xl font-bold text-gray-800">435</p><button className="text-xs md:text-sm text-green-600 font-semibold hover:underline mt-1">Lihat Jumlah →</button></div></div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex items-center gap-4 md:gap-6"><div className="bg-purple-100 p-3 md:p-4 rounded-full text-purple-600"><Users size={24}/></div><div><p className="text-xs md:text-sm text-gray-500 font-medium">KELAS XII</p><p className="text-2xl md:text-3xl font-bold text-gray-800">394</p><button className="text-xs md:text-sm text-purple-600 font-semibold hover:underline mt-1">Lihat Jumlah →</button></div></div>
          </div>

          {/* BERITA & AKSES CEPAT */}
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Siswa Berprestasi & Berita</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {newsData.map((news, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 md:h-40 bg-gray-200"></div>
                <div className="p-4 md:p-5">
                  <p className="text-[10px] md:text-xs text-gray-400 mb-2">{news.date}</p>
                  <h4 className="font-bold text-sm md:text-base text-gray-800 mb-2">{news.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-4">{news.desc}</p>
                  <a href="#" className="text-blue-600 text-xs md:text-sm font-semibold hover:underline">Baca Selengkapnya →</a>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mb-10"><button className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm">LIHAT SEMUA BERITA</button></div>

          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Akses Cepat Informasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex flex-col items-center text-center"><div className="bg-blue-50 p-3 md:p-4 rounded-full text-blue-600 mb-4"><FileText size={24}/></div><h4 className="font-bold text-sm md:text-base text-gray-800 mb-4">Formulir Tracker Studi & SNPMB</h4><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors">Isi Formulir <ExternalLink size={14}/></button></div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex flex-col items-center text-center"><div className="bg-blue-50 p-3 md:p-4 rounded-full text-blue-600 mb-4"><Users size={24}/></div><h4 className="font-bold text-sm md:text-base text-gray-800 mb-4">Portal Orang Tua</h4><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors">Akses Data <ExternalLink size={14}/></button></div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border flex flex-col items-center text-center"><div className="bg-blue-50 p-3 md:p-4 rounded-full text-blue-600 mb-4"><BookOpen size={24}/></div><h4 className="font-bold text-sm md:text-base text-gray-800 mb-4">Seputar Sekolah</h4><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors">Lihat Berita <ExternalLink size={14}/></button></div>
          </div>

          {/* FOOTER */}
          <footer className="bg-slate-900 text-slate-300 p-6 md:p-8 rounded-t-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
              <div>
                <h4 className="text-white font-bold mb-3 text-sm md:text-base">Alamat</h4>
                <p className="text-xs md:text-sm">{settings.alamat || 'Jl. Raya Cikedung, Indramayu, Jawa Barat'}</p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-3 text-sm md:text-base">Informasi</h4>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">SNBP</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">SNBT</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Tracer Studi</a></li>
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
              Copyright © 2026 | SIPANDU {settings.nama_sekolah || 'SMK Negeri 1 Cikedung'} | Created By: {settings.tim || 'Rifki Aripin, S.Pd'}
            </div>
          </footer>
        </main>
      </div>

      {/* --- BOTTOM NAVIGATION MOBILE --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2">
          <HeartPulse size={20} />
          <span className="text-[10px] mt-1 font-medium">Izin</span>
        </Link>
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2">
          <ClipboardList size={20} />
          <span className="text-[10px] mt-1 font-medium">Absensi</span>
        </Link>
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2">
          <CalendarDays size={20} />
          <span className="text-[10px] mt-1 font-medium">Osis</span>
        </Link>
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2">
          <User size={20} />
          <span className="text-[10px] mt-1 font-medium">Wali Kelas</span>
        </Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-red-500 hover:text-red-600 transition-colors py-1 px-2">
            <Shield size={20} />
            <span className="text-[10px] mt-1 font-medium">Admin</span>
          </button>
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2">
            <LogIn size={20} />
            <span className="text-[10px] mt-1 font-medium">Login</span>
          </Link>
        )}
      </div>

    </div>
  );
}