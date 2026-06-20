'use client';

import { useState, useEffect } from 'react';
import { getWaliKelasDashboardFull } from '@/app/actions/dashboardActions';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const COLORS = { hadir: '#16A34A', sakit: '#F59E0B', izin: '#1E40AF', alpha: '#DC2626' };

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

function resolveNama(item) {
  if (item.nama && /[a-zA-Z]/.test(item.nama)) return item.nama;
  if (item.nama_siswa && /[a-zA-Z]/.test(item.nama_siswa)) return item.nama_siswa;
  return item.nisn || item.nama || '—';
}

export default function WaliKelasDashboard({ kelas }) {
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
      getWaliKelasDashboardFull(kelas).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [kelas]);

  if (loading) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><SkeletonCard key={i} />)}</div>;
  if (!data) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto"><p className="text-red-500">Gagal memuat data. Pastikan kelas sudah diatur di profil Anda.</p></div>;

  const donutData = [
    { name: 'Hadir', value: data.hadirHariIni || 0, color: COLORS.hadir },
    { name: 'Sakit', value: data.sakitHariIni || 0, color: COLORS.sakit },
    { name: 'Izin', value: data.izinHariIni || 0, color: COLORS.izin },
    { name: 'Alpha', value: data.alphaHariIni || 0, color: COLORS.alpha },
  ].filter(d => d.value > 0);

  const totalHadir = (data.hadirHariIni || 0) + (data.sakitHariIni || 0) + (data.izinHariIni || 0) + (data.alphaHariIni || 0);

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">👩‍🏫</div>
            <div>
              <h1 className="text-xl font-bold">Dashboard Wali Kelas</h1>
              <p className="text-blue-200 text-sm">Kelas Binaan: <span className="font-semibold text-white">{kelas}</span></p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center shrink-0 sm:self-center">
            <p className="text-xl md:text-2xl font-bold font-mono tracking-wider">{clock}</p>
            <p className="text-blue-200 text-[10px]">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Jumlah Siswa', value: data.totalSiswa || 0, icon: '👨‍🎓', bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
          { label: 'Hadir Hari Ini', value: data.hadirHariIni || 0, icon: '✅', bg: 'from-green-500 to-emerald-600', shadow: 'shadow-green-200' },
          { label: 'Total Reward', value: data.totalReward || 0, icon: '🏆', bg: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-200' },
          { label: 'Total Pelanggaran', value: data.totalPelanggaran || 0, icon: '⚠️', bg: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Donut Kehadiran */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📊 Kehadiran Kelas Hari Ini</h3>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    {d.name}: <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
              {totalHadir > 0 && (
                <p className="text-center text-xs text-gray-400 mt-2">Kehadiran: <span className="font-bold text-green-600">{((data.hadirHariIni / totalHadir) * 100).toFixed(1)}%</span></p>
              )}
            </>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>}
        </div>

        {/* Siswa Belum Absen */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">❌ Siswa Belum Absen</h3>
            <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold">{(data.belumAbsen || []).length} siswa</span>
          </div>
          {(data.belumAbsen || []).length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(data.belumAbsen || []).map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 bg-red-50/60 rounded-lg border border-red-100">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                    {s.nama?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.nama}</p>
                    <p className="text-[11px] text-gray-400">NISN: {s.nisn || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="h-56 flex items-center justify-center text-green-500 text-sm font-medium">✅ Semua siswa sudah absen!</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Pengajuan Izin & Sakit */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">🤒 Pengajuan Izin & Sakit</h3>
            {(data.izinPending || []).length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">{data.izinPending.length} menunggu</span>
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
          ) : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Tidak ada pengajuan menunggu</div>}
        </div>

        {/* Penanganan Aktif */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">📋 Penanganan Siswa</h3>
            {(data.penangananAktif || 0) > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-bold">{data.penangananAktif} kasus</span>
            )}
          </div>
          {(data.penangananAktif || 0) > 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-bold text-orange-700 mt-1">{data.penangananAktif} siswa dalam penanganan</p>
              <p className="text-xs text-orange-500 mt-1">Periksa menu Penanganan Siswa untuk detail</p>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-green-500">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-medium mt-1">Tidak ada kasus penanganan aktif</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Top 5 Reward */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">🏆 Top 5 Reward Kelas</h3>
          {(data.topReward || []).length > 0 ? (
            <div className="space-y-2">
              {(data.topReward || []).map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : i === 1 ? 'bg-gray-50 border border-gray-200' : i === 2 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="text-lg w-8 text-center shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{resolveNama(s)}</p>
                    <p className="text-xs text-gray-400">{s.total} poin</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data reward</p>}
        </div>

        {/* Top 5 Pelanggaran */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">⚠️ Top 5 Pelanggaran Kelas</h3>
          {(data.topPelanggaran || []).length > 0 ? (
            <div className="space-y-2">
              {(data.topPelanggaran || []).map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50/40 rounded-xl border border-red-100">
                  <span className="text-sm font-bold text-red-400 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{resolveNama(s)}</p>
                    <p className="text-xs text-red-500">{s.total} poin pelanggaran</p>
                  </div>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">{s.total}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data pelanggaran</p>}
        </div>
      </div>

      {/* Pesan Orang Tua */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">💬 Pesan Orang Tua Terbaru</h3>
        {(data.messages || []).length > 0 ? (
          <div className="space-y-3">
            {(data.messages || []).map((m, i) => {
              const isParent = m.sender_type === 'Orang Tua';
              return (
                <div key={i} className={`flex gap-3 ${isParent ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isParent ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {isParent ? 'O' : 'W'}
                  </div>
                  <div className={`flex-1 p-3 rounded-xl text-sm ${isParent ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100 ml-10'}`}>
                    <p className="text-gray-700">{m.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada pesan</p>}
      </div>
    </div>
  );
}