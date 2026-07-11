'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateProfileData, resolveAdminUserId } from '@/app/actions/userActions';
import { getUserKelasInfo } from '@/app/actions/absensiActions';
import NotificationCenter from '@/app/components/NotificationCenter';
import { 
  Home, Info, Bell, LogIn, LogOut, Menu, X, User, Shield, Search, QrCode,
  HeartPulse, GraduationCap, BookOpen, ClipboardList, CalendarDays, AlertTriangle, Award, 
  Settings, ChevronDown, ChevronRight, Users, FileText, UserMinus, 
  MessageCircle, Camera, PlayCircle, Music2, ExternalLink,
  UserCheck, ArrowRightLeft, BarChart2, FileWarning, UserCog, Newspaper, CalendarCheck, Building2, ClipboardCheck,
  UserCircle, Mail, Phone, BookOpenCheck, ToggleLeft, Save, Edit3,
  LayoutGrid, MapPin, BarChart3
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [settings, setSettings] = useState({ logo_url: null, nama_sekolah: 'SIPANDU' });
  const [userData, setUserData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ nama: '', username: '', email: '', whatsapp: '', kelas: '', jurusan: '', status: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileToast, setProfileToast] = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
      try {
        const stored = localStorage.getItem('userData');
        if (stored) setUserData(JSON.parse(stored));
        else setUserData(null);
      } catch { setUserData(null); }
      if (loggedIn === 'true') {
        if ('Notification' in window) {
          Notification.requestPermission().then(p => {
            if (p !== 'granted') console.log('Notif permission denied');
          }).catch(() => {});
        }
      }
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
    const fixAdminId = async () => {
      if (!isLoggedIn || !userData) return;
      if (userData.role !== 'Administrator') return;
      if (userData.id && userData.id !== null) return;

      console.log('[AppShell] Admin ID null/missing, mencoba perbaiki...');
      try {
        const result = await resolveAdminUserId(userData.username);
        if (result.id) {
          const updated = { ...userData, id: result.id };
          localStorage.setItem('userData', JSON.stringify(updated));
          setUserData(updated);
          console.log('[AppShell] Admin ID diperbaiki: null -> ' + result.id);
        } else {
          console.error('[AppShell] Gagal memperbaiki Admin ID');
        }
      } catch (e) {
        console.error('[AppShell] Gagal resolve Admin ID:', e);
      }
    };
    fixAdminId();
  }, [isLoggedIn, userData?.id, userData?.role, userData?.username]);

  useEffect(() => {
    const fixJurusan = async () => {
      if (!isLoggedIn || !userData) return;
      if (userData.role === 'Administrator') return;
      if (userData.jurusan) return;
      try {
        const dbInfo = await getUserKelasInfo(userData.id);
        if (dbInfo.jurusan) {
          const updated = { ...userData, jurusan: dbInfo.jurusan };
          localStorage.setItem('userData', JSON.stringify(updated));
          setUserData(updated);
          console.log('[AppShell] Jurusan diperbaiki: "" -> "' + dbInfo.jurusan + '"');
        }
      } catch (e) {
        console.error('[AppShell] Gagal ambil jurusan dari DB:', e);
      }
    };
    fixJurusan();
  }, [isLoggedIn, userData?.id, userData?.jurusan]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (data) setSettings(data);
      } catch (err) { console.error('Settings fetch error:', err); }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (pathname === '/') setActiveMenu('beranda');
    else if (pathname === '/dashboard') setActiveMenu('dashboard');
    else if (pathname.includes('/absen-mandiri')) setActiveMenu('absen-mandiri');
    else if (pathname.includes('/osis/entri-reward')) { setActiveMenu('osis'); setOpenMenus(prev => ({ ...prev, osis: true })); }
    else if (pathname.includes('/wali-kelas/entri-reward')) { setActiveMenu('wali'); setOpenMenus(prev => ({ ...prev, wali: true })); }
    else if (pathname.includes('/wali-kelas/rekap-sakit-izin')) { setActiveMenu('wali'); setOpenMenus(prev => ({ ...prev, wali: true })); }
    else if (pathname.includes('/rekap-kehadiran')) { setActiveMenu('wali'); setOpenMenus(prev => ({ ...prev, wali: true })); }
    else if (pathname.includes('/absensi-pkl')) setActiveMenu('absensi-pkl');
    else if (pathname.includes('/wali-kelas/rekap-pkl')) { setActiveMenu('wali'); setOpenMenus(prev => ({ ...prev, wali: true })); }
    else if (pathname.includes('/wali-kelas/penanganan')) { setActiveMenu('wali'); setOpenMenus(prev => ({ ...prev, wali: true })); }
    else if (pathname.includes('/admin/users')) { setActiveMenu('setting'); setOpenMenus(prev => ({ ...prev, setting: true })); }
    else if (pathname.includes('/admin/siswa')) { setActiveMenu('admin'); setOpenMenus(prev => ({ ...prev, admin: true })); }
    else if (pathname.includes('/setting/profil')) { setActiveMenu('setting'); setOpenMenus(prev => ({ ...prev, setting: true })); }
    else if (pathname.includes('/tentang')) setActiveMenu('tentang');
  }, [pathname]);

  useEffect(() => {
    if (profileToast) {
      const t = setTimeout(() => setProfileToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [profileToast]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      const sidebar = document.getElementById('app-sidebar');
      if (window.innerWidth >= 640 && sidebar && !sidebar.contains(e.target)) {
        setSidebarExpanded(false);
        setOpenMenus({});
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [profileDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
    setProfileDropdown(false);
    router.push('/login');
  };

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const closeSidebarMobile = () => setIsSidebarOpen(false);
  const collapseSidebar = () => { setSidebarExpanded(false); setOpenMenus({}); };

  const userRole = userData?.role || '';
  const isAdmin = userRole === 'Administrator';
  const isWaliKelas = userRole === 'Wali Kelas';
  const isSekretaris = userRole === 'Sekretaris Kelas';
  const isOsis = userRole === 'OSIS';

  const getRoleLabel = () => {
    if (!userData) return '';
    const kelas = userData.kelas || '';
    const jurusan = userData.jurusan || '';
    const kelasFull = jurusan ? (kelas + ' ' + jurusan) : kelas;
    if (isAdmin) return 'Administrator Sistem';
    if (isWaliKelas) return kelasFull ? ('Wali Kelas ' + kelasFull) : 'Wali Kelas';
    if (isSekretaris) return kelasFull ? ('Sekretaris ' + kelasFull) : 'Sekretaris Kelas';
    if (isOsis) return kelasFull ? ('OSIS ' + kelasFull) : 'OSIS';
    return userRole;
  };

  const openProfileModal = () => {
    if (userData) {
      setProfileForm({
        nama: userData.nama || '', username: userData.username || '',
        email: userData.email || '', whatsapp: userData.whatsapp || '',
        kelas: userData.kelas || '', jurusan: userData.jurusan || '',
        status: userData.status || 'Aktif',
      });
    }
    setProfileEditMode(false);
    setProfileDropdown(false);
    setShowProfileModal(true);
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      if (!userData?.id) { setProfileToast({ type: 'error', message: 'ID user tidak ditemukan' }); setProfileSaving(false); return; }
      const result = await updateProfileData(userData.id, { nama: profileForm.nama, email: profileForm.email, whatsapp: profileForm.whatsapp });
      if (result.error) { setProfileToast({ type: 'error', message: result.error }); setProfileSaving(false); return; }
      const updatedUserData = { ...userData, nama: profileForm.nama, email: profileForm.email, whatsapp: profileForm.whatsapp };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setProfileEditMode(false);
      setProfileToast({ type: 'success', message: 'Profil berhasil disimpan!' });
    } catch (err) { console.error(err); setProfileToast({ type: 'error', message: 'Gagal menyimpan profil' }); }
    setProfileSaving(false);
  };

  const menuPad = sidebarExpanded ? 'px-4' : 'px-4 sm:px-[26px]';
  const txt = sidebarExpanded ? '' : 'sm:hidden';

  const handleNav = (id, href) => {
    setActiveMenu(id);
    closeSidebarMobile();
    collapseSidebar();
    router.push(href);
  };

  const NavLink = ({ icon: Icon, title, href = "/", menuId }) => {
    const id = menuId || href;
    return (
      <button onClick={() => handleNav(id, href)}
        className={'w-full flex items-center gap-3 py-2.5 ' + menuPad + ' rounded-xl text-slate-300 transition-all duration-150 whitespace-nowrap ' + (activeMenu === id ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'hover:bg-slate-700/60 hover:text-white active:scale-[0.97]')}>
        <div className="flex-shrink-0 w-5 flex items-center justify-center"><Icon size={20} /></div>
        <span className={'inline-block text-left ' + txt}>{title}</span>
      </button>
    );
  };

  const DropdownMenu = ({ title, icon: Icon, menuKey, children, menuId }) => (
    <div>
      <button onClick={() => { toggleMenu(menuKey); setActiveMenu(menuId); }}
        className={'w-full flex items-center justify-between py-2.5 ' + menuPad + ' rounded-xl text-slate-300 transition-all duration-150 whitespace-nowrap ' + (activeMenu === menuId ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'hover:bg-slate-700/60 hover:text-white active:scale-[0.97]')}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-5 flex items-center justify-center"><Icon size={20} /></div>
          <span className={'inline-block ' + txt}>{title}</span>
        </div>
        <div className={'inline-block ' + txt}>
          {openMenus[menuKey] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>
      {openMenus[menuKey] && <div className="mt-1 ml-5 space-y-0.5">{children}</div>}
    </div>
  );

  const SubLink = ({ icon: Icon, title, href = "/" }) => {
    const isActive = pathname === href;
    return (
      <button onClick={() => handleNav(href, href)}
        className={'w-full flex items-center gap-3 py-2 px-3 text-sm rounded-lg transition-all duration-150 whitespace-nowrap text-left ' + (isActive ? 'text-white bg-blue-600/30 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-700/60 active:scale-[0.97]')}>
        <div className="flex-shrink-0 w-4 flex items-center justify-center"><Icon size={16} /></div>
        <span className={'inline-block ' + txt}>{title}</span>
      </button>
    );
  };

  const bottomNavItems = [
    { key: 'siswa', icon: GraduationCap, label: 'Siswa', href: '/mobile/siswa', show: true },
    { key: 'sekretaris', icon: ClipboardCheck, label: 'Sekretaris', href: '/mobile/sekretaris', show: isLoggedIn && (isSekretaris || isAdmin) },
    { key: 'osis', icon: CalendarDays, label: 'Osis', href: '/mobile/osis', show: isLoggedIn && (isOsis || isAdmin) },
    { key: 'wali', icon: User, label: 'Wali Kelas', href: '/mobile/wali-kelas', show: isLoggedIn && (isWaliKelas || isAdmin) },
    { key: 'admin', icon: Shield, label: 'Admin', href: '/mobile/admin', show: isLoggedIn && isAdmin },
  ];

  if (pathname === '/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={closeSidebarMobile}></div>}

      <aside
        id="app-sidebar"
        className={'fixed z-50 h-full bg-slate-900 text-white flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden ' + (isSidebarOpen ? 'w-56 translate-x-0 z-[60]' : '-translate-x-full w-56') + ' sm:translate-x-0 sm:w-20 ' + (sidebarExpanded ? 'sm:w-56' : '')}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => collapseSidebar()}
        onClick={(e) => {
          if (window.innerWidth >= 640 && !sidebarExpanded) {
            e.stopPropagation();
            setSidebarExpanded(true);
          }
        }}
      >
        <div className="flex-shrink-0 p-4 border-b border-slate-700/60 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden shadow-md bg-slate-800">
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 font-extrabold text-xl shadow-md">S</div>
            )}
            <div className={'inline-block ' + txt + ' whitespace-nowrap'}>
              <h1 className="text-2xl font-extrabold text-blue-400 tracking-wider">SIPANDU</h1>
              <p className="text-[10px] text-slate-400 -mt-1">SMK Negeri 1 Cikedung</p>
            </div>
          </div>
          <button className="sm:hidden text-slate-400" onClick={(e) => { e.stopPropagation(); closeSidebarMobile(); }}><X size={24}/></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 text-sm scrollbar-thin scrollbar-thumb-slate-700">
          {isLoggedIn && (
            <>
              <p className={'px-5 pt-2 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>DASHBOARD</p>
              <NavLink icon={LayoutGrid} title="Dashboard" href="/dashboard" menuId="dashboard" />
            </>
          )}
          <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU UMUM</p>
          <NavLink icon={Users} title="Portal Orang Tua" href="/portal-ortu" />
          <NavLink icon={Award} title="Siswa Berprestasi" href="/siswa-berprestasi" />
          <NavLink icon={Newspaper} title="Seputar Sekolah" href="/berita-sekolah" />

          <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU SISWA</p>
          <NavLink icon={HeartPulse} title="Absen Sakit & Izin" href="/absen-sakit-izin" menuId="sakit" />
          <NavLink icon={Search} title="Cari Data Siswa" href="/cari-data-siswa" menuId="cari" />
          <NavLink icon={UserCheck} title="Absen Hadir Mandiri" href="/absen-mandiri" menuId="absen-mandiri" />
          <NavLink icon={MapPin} title="Absensi PKL" href="/absensi-pkl" menuId="absensi-pkl" />

          {isLoggedIn && (isSekretaris || isAdmin) && (
            <>
              <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU SEKRETARIS</p>
              <NavLink icon={ClipboardList} title="Absensi Kelas" href="/absensi" menuId="absensi" />
            </>
          )}
          {isLoggedIn && (isOsis || isAdmin) && (
            <>
              <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU OSIS</p>
              <DropdownMenu title="Piket OSIS" icon={CalendarDays} menuKey="osis" menuId="osis">
                <SubLink icon={Award} title="Entri Reward" href="/osis/entri-reward" />
                <SubLink icon={AlertTriangle} title="Entri Pelanggaran" href="/osis/entri-pelanggaran" />
              </DropdownMenu>
            </>
          )}
          {isLoggedIn && (isWaliKelas || isAdmin) && (
            <>
              <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU WALI KELAS</p>
              <DropdownMenu title="Wali Kelas" icon={User} menuKey="wali" menuId="wali">
                <SubLink icon={Award} title="Entri Reward" href="/wali-kelas/entri-reward" />
                <SubLink icon={AlertTriangle} title="Entri Pelanggaran" href="/wali-kelas/entri-pelanggaran" />
                <SubLink icon={FileWarning} title="Rekap Pelanggaran" href="/wali-kelas/rekap-pelanggaran" />
                <SubLink icon={HeartPulse} title="Rekap Sakit & Izin" href="/wali-kelas/rekap-sakit-izin" />
                <SubLink icon={CalendarDays} title="Rekap Kehadiran" href="/rekap-kehadiran" />
                <SubLink icon={BarChart3} title="Rekap Kehadiran PKL" href="/wali-kelas/rekap-pkl" />
                <SubLink icon={UserCog} title="Penanganan Siswa" href="/wali-kelas/penanganan" />
              </DropdownMenu>
            </>
          )}
          {isLoggedIn && isAdmin && (
            <>
              <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU ADMIN</p>
              <DropdownMenu title="Administrator" icon={Shield} menuKey="admin" menuId="admin">
                <SubLink icon={Users} title="Daftar Siswa" href="/admin/siswa" />
                <SubLink icon={UserCog} title="Penanganan Siswa" href="/admin/siswa/penanganan" />
                <SubLink icon={BarChart2} title="Rekap Reward" href="/admin/rekap-reward" />
                <SubLink icon={FileText} title="Rekap Formulir" href="/admin/rekap-formulir" />
                <SubLink icon={ArrowRightLeft} title="Rekap Pindah & Keluar" href="/admin/siswa/pindah-keluar" />
              </DropdownMenu>
            </>
          )}
          {isLoggedIn && isAdmin && (
            <>
              <p className={'px-5 pt-3 pb-1.5 text-[10px] text-slate-500 font-bold tracking-wider whitespace-nowrap inline-block ' + txt}>MENU SETTING</p>
              <DropdownMenu title="Pengaturan" icon={Settings} menuKey="setting" menuId="setting">
                <SubLink icon={Building2} title="Profil SIPANDU" href="/setting/profil" />
                <SubLink icon={UserCog} title="Managemen User" href="/admin/users" />
                <SubLink icon={UserCheck} title="Penanggung Jawab" href="/setting/penanggung-jawab" />
                <SubLink icon={CalendarCheck} title="Hari Efektif" href="/setting/hari-efektif" />
                <SubLink icon={QrCode} title="QR Absensi" href="/setting/qr-absensi" />
                <SubLink icon={MessageCircle} title="Konfigurasi WhatsApp" href="/setting/konfigurasi-whatsapp" />
                <SubLink icon={Newspaper} title="Pos Berita" href="/setting/pos-berita" />
              </DropdownMenu>
            </>
          )}
        </nav>
      </aside>

      <div className="sm:ml-20 flex flex-col min-h-screen pb-20 sm:pb-0 transition-[margin] duration-300 ease-in-out">
        <header className="relative bg-slate-900 shadow-sm border-b border-slate-700 p-4 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="sm:hidden text-gray-300 active:scale-90 active:text-blue-400 transition-all duration-100" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-cover md:hidden" />
            ) : (
              <div className="h-12 w-12 rounded-md bg-slate-800 flex items-center justify-center text-blue-400 font-extrabold text-lg md:hidden">S</div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-5 text-gray-300 font-medium text-sm">
            <Link href="/" className="flex items-center gap-1 hover:text-white active:scale-90 active:text-blue-400 active:bg-white/10 rounded-lg px-2 py-1.5 transition-all duration-100"><Home size={18}/> <span className="hidden md:inline-block">Home</span></Link>
            <Link href="/tentang" className="flex items-center gap-1 hover:text-white active:scale-90 active:text-blue-400 active:bg-white/10 rounded-lg px-2 py-1.5 transition-all duration-100"><Info size={18}/> <span className="hidden md:inline-block">Tentang</span></Link>
            <Link href="/formulir" className="flex items-center gap-1 hover:text-white active:scale-90 active:text-blue-400 active:bg-white/10 rounded-lg px-2 py-1.5 transition-all duration-100"><ClipboardList size={18}/> <span className="hidden md:inline-block">Formulir</span></Link>
            {isLoggedIn && <NotificationCenter userId={userData?.id} userRole={userData?.role} />}
            {isLoggedIn ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown); }}
                  className="relative flex-shrink-0 active:scale-95 transition-transform duration-100"
                >
                  {userData.foto_url ? (
                    <img src={userData.foto_url} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-blue-400/50 hover:border-blue-300 transition-colors" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">{userData.nama?.charAt(0)?.toUpperCase() || 'A'}</div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></span>
                </button>
                {profileDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 flex items-center gap-3 cursor-default">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <UserCircle size={16} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{userData.nama || 'User'}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate leading-tight">{getRoleLabel()}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => { setProfileDropdown(false); openProfileModal(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <UserCog size={15} className="text-blue-600" /> Profil Saya
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => { setProfileDropdown(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-90 active:bg-blue-800 transition-all duration-100">
                <LogIn size={16}/> <span className="hidden md:inline-block">Login</span>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-gray-200 flex justify-around items-center h-14 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {bottomNavItems.filter(b => b.show).map((item) => (
          <Link key={item.key} href={item.href} className="flex flex-col items-center justify-center py-1 px-3 text-gray-500 hover:text-blue-600 active:scale-90 transition-all duration-150">
            <item.icon size={20}/><span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </Link>
        ))}
        {!isLoggedIn && (
          <Link href="/login" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 active:scale-90 transition-all py-1 px-3">
            <LogIn size={20}/><span className="text-[10px] mt-0.5 font-medium">Login</span>
          </Link>
        )}
      </div>

      {showProfileModal && userData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-6 pb-12 relative">
              <button onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"><X size={14}/></button>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <div className="relative">
                  {userData.foto_url ? (
                    <img src={userData.foto_url} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-xl" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold border-3 border-white shadow-xl">{userData.nama?.charAt(0)?.toUpperCase() || 'A'}</div>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
              </div>
            </div>
            <div className="pt-12 pb-4 px-5">
              {profileToast && (
                <div className={'mb-3 px-3 py-2 rounded-lg text-xs font-semibold text-center ' + (profileToast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200')}>{profileToast.message}</div>
              )}
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-gray-800 leading-tight">{userData.nama || 'User'}</h2>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">{getRoleLabel()}</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: User, label: 'Username', key: 'username', val: userData.username },
                  { icon: Mail, label: 'Email', key: 'email', edit: true },
                  { icon: Phone, label: 'WhatsApp', key: 'whatsapp', edit: true },
                  { icon: BookOpenCheck, label: 'Kelas', key: 'kelas' },
                  { icon: GraduationCap, label: 'Jurusan', key: 'jurusan' },
                  { icon: ToggleLeft, label: 'Status', key: 'status', badge: true },
                ].map(f => (
                  <div key={f.key} className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0"><f.icon size={13} className="text-blue-600"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{f.label}</p>
                      {f.edit && profileEditMode ? (
                        <input name={f.key} value={profileForm[f.key]} onChange={handleProfileInputChange} className="w-full text-xs text-gray-800 bg-white px-2 py-0.5 rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none" />
                      ) : f.badge ? (
                        <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (userData.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          <span className={'w-1.5 h-1.5 rounded-full ' + (userData.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500')}/>{userData.status || 'Aktif'}
                        </span>
                      ) : (
                        <p className="text-xs text-gray-800 font-medium truncate">{userData[f.key] || '-'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setShowProfileModal(false); setProfileEditMode(false); }} className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Tutup</button>
                {!profileEditMode ? (
                  <button onClick={() => setProfileEditMode(true)} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1 shadow-lg shadow-blue-500/25"><Edit3 size={12}/> Edit</button>
                ) : (
                  <button onClick={handleProfileSave} disabled={profileSaving} className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-semibold hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 disabled:opacity-50">{profileSaving ? '...' : <><Save size={12}/> Simpan</>}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}