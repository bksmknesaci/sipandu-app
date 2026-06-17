"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateProfileData } from '@/app/actions/userActions';
import { 
  Home, Info, Bell, LogIn, LogOut, Menu, X, User, Shield, Search, 
  HeartPulse, GraduationCap, BookOpen, ClipboardList, CalendarDays, AlertTriangle, Award, 
  Settings, ChevronDown, ChevronRight, Users, FileText, UserMinus, 
  MessageCircle, Camera, PlayCircle, Music2, ExternalLink,
  UserCheck, ArrowRightLeft, BarChart2, FileWarning, UserCog, Newspaper, CalendarCheck, Building2, ClipboardCheck,
  UserCircle, Mail, Phone, BookOpenCheck, ToggleLeft, Save, Edit3
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [settings, setSettings] = useState({ logo_url: null, nama_sekolah: 'SIPANDU' });
  const [userData, setUserData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ nama: '', username: '', email: '', whatsapp: '', kelas: '', jurusan: '', status: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState(null);

  // ============================
  // CEK LOGIN & USER DATA
  // ============================
  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
      try {
        const stored = localStorage.getItem('userData');
        if (stored) setUserData(JSON.parse(stored));
        else setUserData(null);
      } catch { setUserData(null); }
    };
    checkLogin();
    window.addEventListener('loginSuccess', checkLogin);
    window.addEventListener('storage', checkLogin);
    return () => {
      window.removeEventListener('loginSuccess', checkLogin);
      window.removeEventListener('storage', checkLogin);
    };
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loggedIn === 'true');
    try {
      const stored = localStorage.getItem('userData');
      if (stored) setUserData(JSON.parse(stored));
      else setUserData(null);
    } catch { setUserData(null); }
  }, [pathname]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  // Sinkronkan active menu + auto-open dropdown
  useEffect(() => {
    if (pathname === '/') setActiveMenu('beranda');
    else if (pathname.includes('/absen-mandiri')) setActiveMenu('absen-mandiri');
    else if (pathname.includes('/osis/entri-reward')) {
      setActiveMenu('osis');
      setOpenMenus(prev => ({ ...prev, osis: true }));
    } else if (pathname.includes('/wali-kelas/entri-reward')) {
      setActiveMenu('wali');
      setOpenMenus(prev => ({ ...prev, wali: true }));
    } else if (pathname.includes('/wali-kelas/rekap-sakit-izin')) {
      setActiveMenu('wali');
      setOpenMenus(prev => ({ ...prev, wali: true }));
    } else if (pathname.includes('/rekap-kehadiran')) {
      setActiveMenu('wali');
      setOpenMenus(prev => ({ ...prev, wali: true }));
    } else if (pathname.includes('/admin/users')) {
      setActiveMenu('setting');
      setOpenMenus(prev => ({ ...prev, setting: true }));
    } else if (pathname.includes('/admin/siswa')) {
      setActiveMenu('admin');
      setOpenMenus(prev => ({ ...prev, admin: true }));
    } else if (pathname.includes('/setting/profil')) {
      setActiveMenu('setting');
      setOpenMenus(prev => ({ ...prev, setting: true }));
    } else if (pathname.includes('/tentang')) setActiveMenu('tentang');
  }, [pathname]);

  // Toast auto-hide
  useEffect(() => {
    if (profileToast) {
      const t = setTimeout(() => setProfileToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [profileToast]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
    router.push('/login');
  };

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const closeSidebarMobile = () => setSidebarOpen(false);

  // ============================
  // ROLE LOGIC
  // ============================
  const userRole = userData?.role || '';
  const isAdmin = userRole === 'Administrator';
  const isWaliKelas = userRole === 'Wali Kelas';
  const isSekretaris = userRole === 'Sekretaris Kelas';
  const isOsis = userRole === 'OSIS';

  // ============================
  // FIX: Label peran + kelas lengkap
  // ============================
  const getRoleLabel = () => {
    if (!userData) return '';
    const kelas = userData.kelas || '';
    if (isAdmin) return 'Administrator Sistem';
    if (isWaliKelas) return kelas ? `Wali Kelas ${kelas}` : 'Wali Kelas';
    if (isSekretaris) return kelas ? `Sekretaris ${kelas}` : 'Sekretaris Kelas';
    if (isOsis) return kelas ? `OSIS ${kelas}` : 'OSIS';
    return userRole;
  };

  // ============================
  // PROFIL MODAL HANDLERS
  // ============================
  const openProfileModal = () => {
    if (userData) {
      setProfileForm({
        nama: userData.nama || '',
        username: userData.username || '',
        email: userData.email || '',
        whatsapp: userData.whatsapp || '',
        kelas: userData.kelas || '',
        jurusan: userData.jurusan || '',
        status: userData.status || 'Aktif',
      });
    }
    setProfileEditMode(false);
    setShowProfileModal(true);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      if (!userData?.id) {
        setProfileToast({ type: 'error', message: 'ID user tidak ditemukan' });
        setProfileSaving(false);
        return;
      }

      const result = await updateProfileData(userData.id, {
        nama: profileForm.nama,
        email: profileForm.email,
        whatsapp: profileForm.whatsapp,
      });

      if (result.error) {
        setProfileToast({ type: 'error', message: result.error });
        setProfileSaving(false);
        return;
      }

      // Update localStorage
      const updatedUserData = {
        ...userData,
        nama: profileForm.nama,
        email: profileForm.email,
        whatsapp: profileForm.whatsapp,
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setProfileEditMode(false);
      setProfileToast({ type: 'success', message: 'Profil berhasil disimpan!' });
    } catch (err) {
      console.error(err);
      setProfileToast({ type: 'error', message: 'Gagal menyimpan profil' });
    }
    setProfileSaving(false);
  };

  // ============================
  // NAV COMPONENTS
  // ============================
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

  const SubLink = ({ icon: Icon, title, href="/" }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} onClick={closeSidebarMobile} className={`flex items-center gap-3 py-2 pl-10 pr-3 text-sm rounded-md transition-colors duration-150 whitespace-nowrap ${isActive ? 'text-white bg-blue-600/30 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-700 hover:shadow-sm active:scale-95 active:bg-slate-600'}`}>
        <div className="flex-shrink-0 w-4 inline-flex justify-center"><Icon size={16} /></div>
        <span className="inline-block md:hidden md:group-hover:inline-block">{title}</span>
      </Link>
    );
  };

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebarMobile}></div>}

      {/* --- SIDEBAR --- */}
      <aside className={`group fixed z-50 h-full bg-slate-900 text-white flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full w-72'} 
        md:translate-x-0 md:w-20 md:hover:w-72`}>
        
        {/* Logo */}
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

        {/* ============================ */}
        {/* PROFIL PENGGUNA              */}
        {/* ============================ */}
        {isLoggedIn && userData && (
          <div className="flex-shrink-0 border-b border-slate-700 p-4">
            {/* Info Profil */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0">
                {userData.foto_url ? (
                  <img src={userData.foto_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/50 shadow" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                    {userData.nama?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></span>
              </div>
              <div className="flex-1 min-w-0 inline-block md:hidden md:group-hover:inline-block">
                <p className="font-semibold text-sm truncate text-white">{userData.nama || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{getRoleLabel()}</p>
              </div>
            </div>
            {/* Tombol Profil Saya (kiri) & Logout (kanan) */}
            <div className="flex gap-2 inline-block md:hidden md:group-hover:inline-block">
              <button onClick={openProfileModal}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 text-xs font-semibold transition">
                <UserCircle size={14}/> Profil Saya
              </button>
              <button onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-xs font-semibold transition">
                <LogOut size={14}/> Logout
              </button>
            </div>
          </div>
        )}

        {/* ============================ */}
        {/* NAVIGASI BERDASARKAN ROLE    */}
        {/* ============================ */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-sm scrollbar-thin scrollbar-thumb-slate-700">

          {/* MENU UMUM */}
          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-2 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU UMUM</p>
          <NavLink icon={Users} title="Portal Orang Tua" menuId="portal" />
          <NavLink icon={Award} title="Siswa Berprestasi" menuId="prestasi" />
          <NavLink icon={GraduationCap} title="Tracer Studi Lulusan" menuId="tracer" />

          {/* MENU SISWA */}
          <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SISWA</p>
          <NavLink icon={HeartPulse} title="Absen Sakit & Izin" href="/absen-sakit-izin" menuId="sakit" />
          <NavLink icon={Search} title="Cari Data Siswa" menuId="cari" />
          <NavLink icon={UserCheck} title="Absen Hadir Mandiri" href="/absen-mandiri" menuId="absen-mandiri" />

          {/* MENU SEKRETARIS */}
          {isLoggedIn && (isSekretaris || isAdmin) && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SEKRETARIS</p>
              <NavLink icon={ClipboardList} title="Absensi Kehadiran" href="/absensi" menuId="absensi" />
            </>
          )}

          {/* MENU OSIS */}
          {isLoggedIn && (isOsis || isAdmin) && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU OSIS</p>
              <DropdownMenu title="Piket OSIS" icon={CalendarDays} menuKey="osis" menuId="osis">
  <SubLink icon={Award} title="Entri Reward" href="/osis/entri-reward" />
  <SubLink icon={AlertTriangle} title="Entri Pelanggaran" href="/osis/entri-pelanggaran" />
</DropdownMenu>
            </>
          )}

          {/* MENU WALI KELAS */}
          {isLoggedIn && (isWaliKelas || isAdmin) && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU WALI KELAS</p>
              <DropdownMenu title="Wali Kelas" icon={User} menuKey="wali" menuId="wali">
  <SubLink icon={Award} title="Entri Reward" href="/wali-kelas/entri-reward" />
  <SubLink icon={AlertTriangle} title="Entri Pelanggaran" href="/wali-kelas/entri-pelanggaran" />
  <SubLink icon={FileWarning} title="Rekap Pelanggaran" href="/wali-kelas/rekap-pelanggaran" />
  <SubLink icon={HeartPulse} title="Rekap Sakit & Izin" href="/wali-kelas/rekap-sakit-izin" />
  <SubLink icon={CalendarDays} title="Rekap Kehadiran" href="/rekap-kehadiran" />
</DropdownMenu>
            </>
          )}

          {/* MENU ADMIN */}
          {isLoggedIn && isAdmin && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU ADMIN</p>
              <DropdownMenu title="Administrator" icon={Shield} menuKey="admin" menuId="admin">
                <SubLink icon={Users} title="Daftar Siswa" href="/admin/siswa" />
                <SubLink icon={UserCog} title="Penanganan Siswa" href="/admin/siswa/penanganan" />
                <SubLink icon={BarChart2} title="Rekap Reward" href="/admin/rekap-reward" />
                <SubLink icon={FileText} title="Rekap Formulir" href="/admin/rekap-formulir" />
                <SubLink icon={ArrowRightLeft} title="Rekap Pindah & Keluar" href="/admin/siswa/pindah-keluar" />
              </DropdownMenu>
            </>
          )}

          {/* MENU SETTING */}
          {isLoggedIn && isAdmin && (
            <>
              <p className="px-6 text-[10px] text-slate-500 font-bold mb-2 mt-4 whitespace-nowrap inline-block md:hidden md:group-hover:inline-block">MENU SETTING</p>
              <DropdownMenu title="Pengaturan" icon={Settings} menuKey="setting" menuId="setting">
                <SubLink icon={Building2} title="Profil SIPANDU" href="/setting/profil" />
                <SubLink icon={UserCog} title="Managemen User" href="/admin/users" />
                <SubLink icon={UserCheck} title="Penanggung Jawab" href="/setting/penanggung-jawab" />
                <SubLink icon={CalendarCheck} title="Hari Efektif" href="/setting/hari-efektif" />
                <SubLink icon={Newspaper} title="Pos Berita" href="/setting/pos-berita" />
              </DropdownMenu>
            </>
          )}
        </nav>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <div className="md:ml-20 md:group-hover:ml-72 flex flex-col min-h-screen pb-20 md:pb-0 transition-[margin] duration-300 ease-in-out">
        <header className="bg-slate-900 shadow-sm border-b border-slate-700 p-4 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-300" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-cover md:hidden" />
            ) : (
              <div className="h-12 w-12 rounded-md bg-slate-800 flex items-center justify-center text-blue-400 font-extrabold text-lg md:hidden">S</div>
            )}
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-gray-300 font-medium text-sm">
            <Link href="/" className="flex items-center gap-1 hover:text-white"><Home size={18}/> <span className="hidden md:inline-block">Home</span></Link>
            <Link href="/tentang" className="flex items-center gap-1 hover:text-white"><Info size={18}/> <span className="hidden md:inline-block">Tentang</span></Link>
            <Link href="/formulir" className="flex items-center gap-1 hover:text-white"><ClipboardList size={18}/> <span className="hidden md:inline-block">Formulir</span></Link>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                <LogOut size={16}/> <span className="hidden md:inline-block">Logout</span>
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <LogIn size={16}/> <span className="hidden md:inline-block">Login</span></Link>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>

      {/* --- BOTTOM NAVIGATION MOBILE --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2"><HeartPulse size={20}/><span className="text-[10px] mt-1 font-medium">Izin</span></Link>
        <Link href="/formulir" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2"><ClipboardList size={20}/><span className="text-[10px] mt-1 font-medium">Formulir</span></Link>
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2"><CalendarDays size={20}/><span className="text-[10px] mt-1 font-medium">Osis</span></Link>
        <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2"><User size={20}/><span className="text-[10px] mt-1 font-medium">Wali Kelas</span></Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="flex flex-col items-center justify-center text-red-500 hover:text-red-600 transition-colors py-1 px-2"><Shield size={20}/><span className="text-[10px] mt-1 font-medium">Admin</span></button>
        ) : (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors py-1 px-2"><LogIn size={20}/><span className="text-[10px] mt-1 font-medium">Login</span></Link>
        )}
      </div>

      {/* ============================ */}
      {/* MODAL PROFIL SAYA            */}
      {/* ============================ */}
      {showProfileModal && userData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Header Biru */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-6 pb-12 relative">
              <button onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <X size={14}/>
              </button>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <div className="relative">
                  {userData.foto_url ? (
                    <img src={userData.foto_url} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-xl" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold border-3 border-white shadow-xl">
                      {userData.nama?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
              </div>
            </div>

            {/* Info Detail */}
            <div className="pt-12 pb-4 px-5">
              {/* Toast */}
              {profileToast && (
                <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-semibold text-center ${profileToast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {profileToast.message}
                </div>
              )}

              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-gray-800 leading-tight">{userData.nama || 'User'}</h2>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">{getRoleLabel()}</p>
              </div>

              <div className="space-y-2">
                {/* Username */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><User size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Username</p>
                    {profileEditMode ? (
                      <input name="username" value={profileForm.username} onChange={handleProfileInputChange} readOnly
                        className="w-full text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 outline-none" />
                    ) : (
                      <p className="text-xs text-gray-800 font-medium truncate">{userData.username || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><Mail size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                    {profileEditMode ? (
                      <input name="email" value={profileForm.email} onChange={handleProfileInputChange}
                        className="w-full text-xs text-gray-800 bg-white px-2 py-0.5 rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none" />
                    ) : (
                      <p className="text-xs text-gray-800 font-medium truncate">{userData.email || '-'}</p>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><Phone size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">WhatsApp</p>
                    {profileEditMode ? (
                      <input name="whatsapp" value={profileForm.whatsapp} onChange={handleProfileInputChange}
                        className="w-full text-xs text-gray-800 bg-white px-2 py-0.5 rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none" />
                    ) : (
                      <p className="text-xs text-gray-800 font-medium truncate">{userData.whatsapp || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Kelas */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><BookOpenCheck size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Kelas</p>
                    <p className="text-xs text-gray-800 font-medium truncate">{userData.kelas || '-'}</p>
                  </div>
                </div>

                {/* Jurusan */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><GraduationCap size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Jurusan</p>
                    <p className="text-xs text-gray-800 font-medium truncate">{userData.jurusan || '-'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><ToggleLeft size={13} className="text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${userData.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${userData.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}/>
                      {userData.status || 'Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }}
                  className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Tutup
                </button>
                {!profileEditMode ? (
                  <button onClick={() => setProfileEditMode(true)}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1 shadow-lg shadow-blue-500/25">
                    <Edit3 size={12}/> Edit
                  </button>
                ) : (
                  <button onClick={handleProfileSave} disabled={profileSaving}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                    {profileSaving ? '⏳' : <><Save size={12}/> Simpan</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}