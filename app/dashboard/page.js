'use client';

import { useEffect, useState } from 'react';
import AdminDashboard from '@/app/dashboard/AdminDashboard';
import WaliKelasDashboard from '@/app/dashboard/WaliKelasDashboard';
import SekretarisDashboard from '@/app/dashboard/SekretarisDashboard';
import OsisDashboard from '@/app/dashboard/OsisDashboard';

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [kelas, setKelas] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const ud = JSON.parse(raw);
        setRole(ud.role || null);
        setKelas(ud.kelas || null);
      }
    } catch (e) { /* ignore */ }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0 4.5 4.5 0 019.5 0h-1.5c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 01-2.25-2.25M12 9v3.75m9-1.5h-1.5m-7.5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0h-1.5c-.621 0-1.125-.504-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V10.5m9 3.75h-1.5a3.375 3.375 0 01-3-3h-1.5a1.125 1.125 0 01-1.125-1.125V6.375" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Anda Belum Login</h2>
          <p className="text-gray-400 text-sm mb-4">Silakan login terlebih dahulu untuk mengakses Dashboard</p>
          <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            ← Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  if (role === 'Administrator') return <AdminDashboard />;
  if (role === 'Wali Kelas') return <WaliKelasDashboard kelas={kelas} />;
  if (role === 'Sekretaris Kelas') return <SekretarisDashboard kelas={kelas} />;
  if (role === 'OSIS') return <OsisDashboard />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <p className="text-red-500">Role tidak dikenali</p>
    </div>
  );
}