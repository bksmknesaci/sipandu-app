'use client';

import { useState, useEffect } from 'react';
import { getSekretarisDashboardFull } from '@/app/actions/dashboardActions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

function CountUp({ target, duration = 1000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let rafId;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return <span>{val}</span>;
}

function SkeletonCard() {
  return <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div><div className="h-8 bg-gray-100 rounded w-1/2"></div></div>;
}

export default function SekretarisDashboard({ kelas }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (kelas) {
      getSekretarisDashboardFull(kelas).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [kelas]);

  if (loading) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><SkeletonCard key={i} />)}</div>;
  if (!data) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto"><p className="text-red-500">Gagal memuat data. Pastikan kelas sudah diatur di profil Anda.</p></div>;

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">📋</div>
            <div>
              <h1 className="text-xl font-bold">Dashboard Sekretaris Kelas</h1>
              <p className="text-violet-200 text-sm">Kelas: <span className="font-semibold text-white">{kelas}</span></p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center shrink-0 sm:self-center">
            <p className="text-xl md:text-2xl font-bold font-mono tracking-wider">{clock}</p>
            <p className="text-violet-200 text-[10px]">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Jumlah Siswa', value: data.totalSiswa || 0, icon: '👨‍🎓', bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
          { label: 'Sudah Absen', value: data.sudahAbsen || 0, icon: '✅', bg: 'from-green-500 to-emerald-600', shadow: 'shadow-green-200' },
          { label: 'Belum Absen', value: data.belumAbsen || 0, icon: '❌', bg: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
          { label: 'Perlu Diinput', value: data.belumAbsen || 0, icon: '📝', bg: 'from-amber-400 to-yellow-500', shadow: 'shadow-yellow-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Progress Ring */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📊 Status Absensi Hari Ini</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 shrink-0">
              <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
                <circle cx="64" cy="64" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="64" cy="64" r="52" fill="none"
                  stroke="#16A34A"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${((data.persentase || 0) / 100) * 326.73} 326.73`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{data.persentase || 0}%</span>
                <span className="text-[10px] text-gray-400">Terisi</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-green-700"><CountUp target={data.hadir || 0} /></p><p className="text-xs text-green-600">Hadir</p></div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-yellow-700"><CountUp target={data.sakit || 0} /></p><p className="text-xs text-yellow-600">Sakit</p></div>
              <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-blue-700"><CountUp target={data.izin || 0} /></p><p className="text-xs text-blue-600">Izin</p></div>
              <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-red-700"><CountUp target={data.alpha || 0} /></p><p className="text-xs text-red-600">Alpha</p></div>
            </div>
          </div>
        </div>

        {/* Pengajuan Izin Masuk */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">🤒 Pengajuan Izin Masuk</h3>
            {(data.izinPending || []).length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">{data.izinPending.length}</span>
            )}
          </div>
          {(data.izinPending || []).length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(data.izinPending || []).map((item) => (
                <div key={item.id} className="p-3 bg-yellow-50/60 rounded-lg border border-yellow-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.jenis_absensi === 'Sakit' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700'}`}>{item.jenis_absensi}</span>
                    <span className="text-[10px] text-gray-400">{item.jam}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{item.nama_siswa}</p>
                  <p className="text-xs text-gray-500 truncate">{item.alasan || '—'}</p>
                </div>
              ))}
            </div>
          ) : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Tidak ada pengajuan</div>}
        </div>
      </div>

      {/* Chart 7 Hari */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">📈 Rekap Kehadiran 7 Hari Terakhir</h3>
        {(data.weekChartData || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.weekChartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="hadir" fill="#16A34A" radius={[4, 4, 0, 0]} name="Hadir" />
              <Bar dataKey="sakit" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Sakit" />
              <Bar dataKey="izin" fill="#1E40AF" radius={[4, 4, 0, 0]} name="Izin" />
              <Bar dataKey="alpha" fill="#DC2626" radius={[4, 4, 0, 0]} name="Alpha" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Data 7 hari belum tersedia</div>}
      </div>

      {/* Siswa Belum Absen */}
      {(data.belumAbsenList || []).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">❌ Daftar Siswa Belum Absen</h3>
            <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold">{data.belumAbsenList.length} siswa</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(data.belumAbsenList || []).map((s) => (
              <div key={s.id} className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-gray-800 truncate">{s.nama}</p>
                <p className="text-[11px] text-gray-400">{s.nisn || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <a href="/absensi" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 text-center shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <span className="text-2xl block mb-1">📋</span>
          <span className="text-sm font-semibold">Input Absensi</span>
        </a>
        <a href="/absen-mandiri" className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 text-center shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <span className="text-2xl block mb-1">📱</span>
          <span className="text-sm font-semibold">Scan QR</span>
        </a>
        <button onClick={() => window.location.reload()} className="bg-gray-600 hover:bg-gray-700 text-white rounded-2xl p-5 text-center shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <span className="text-2xl block mb-1">🔄</span>
          <span className="text-sm font-semibold">Refresh Data</span>
        </button>
      </div>
    </div>
  );
}