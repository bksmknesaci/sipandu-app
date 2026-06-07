"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Home, Info, Bell, LogIn, LogOut, Menu, X, User, Shield, Search, 
  HeartPulse, GraduationCap, BookOpen, ClipboardList, CalendarDays, AlertTriangle, Award, 
  Settings, ChevronDown, ChevronRight, Users, FileText, UserMinus, 
  MessageCircle, Camera, PlayCircle, Music2, ExternalLink,
  UserCheck, ArrowRightLeft, BarChart2, FileWarning, UserCog, Newspaper, CalendarCheck, Building2, ClipboardCheck
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [settings, setSettings] = useState({ logo_url: null, nama_sekolah: 'SIPANDU' });

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // Sinkronkan active menu dengan URL saat ini
  useEffect(() => {
    if (pathname === '/') setActiveMenu('beranda');
    else if (pathname.includes('/absen-mandiri')) setActiveMenu('absen-mandiri');
    else if (pathname.includes('/admin/siswa')) setActiveMenu('admin');
    else if (pathname.includes('/setting/profil')) setActiveMenu('setting');
    else if (pathname.includes('/tentang')) setActiveMenu('tentang');
  }, [pathname]);

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
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebarMobile}></div>}

      {/* --- SIDEBAR --- */}
      <aside className={`group fixed z-50 h-full bg-slate-900 text-white flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full w-72'} 
        md:translate-x-0 md:w-20 md:hover:w-72`}>
        
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

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-sm scrollbar-thin scrollbar-thumb-slate-700">
          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-2 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU UMUM</p>
          <NavLink icon={Users} title="Portal Orang Tua" menuId="portal" />
          <NavLink icon={Award} title="Siswa Berprestasi" menuId="prestasi" />
          <NavLink icon={GraduationCap} title="Tracer Studi Lulusan" menuId="tracer" />

          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SISWA</p>
          <NavLink icon={HeartPulse} title="Absen Sakit & Izin" menuId="sakit" />
          <NavLink icon={Search} title="Cari Data Siswa" menuId="cari" />
          <NavLink icon={UserCheck} title="Absen Hadir Mandiri" href="/absen-mandiri" menuId="absen-mandiri" />

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
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-cover md:hidden" />
            ) : (
              <div className="h-12 w-12 rounded-md bg-slate-900 flex items-center justify-center text-blue-400 font-extrabold text-lg md:hidden">S</div>
            )}
          </div>

          <div className="flex items-center gap-4 md:gap-6 text-gray-600 font-medium text-sm">
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

        {/* Halaman Konten Dinamis (children) */}
        <main className="flex-1">
          {children}
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