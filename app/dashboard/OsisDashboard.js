'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOsisDashboardFull } from '@/app/actions/dashboardActions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
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

export default function OsisDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('berita');
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
    getOsisDashboardFull().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><SkeletonCard key={i} />)}</div>;
  if (!data) return <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto"><p className="text-red-500">Gagal memuat data.</p></div>;

  const chartData = data.chartData || [];
  const recentReward = data.recentReward || [];
  const recentPelanggaran = data.recentPelanggaran || [];
  const newsBerita = data.newsBerita || [];
  const newsPrestasi = data.newsPrestasi || [];

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">📢</div>
            <div>
              <h1 className="text-xl font-bold">Dashboard OSIS</h1>
              <p className="text-orange-100 text-sm">Aktivitas dan informasi siswa hari ini</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center shrink-0 sm:self-center">
            <p className="text-xl md:text-2xl font-bold font-mono tracking-wider">{clock}</p>
            <p className="text-orange-100 text-[10px]">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Siswa', value: data.totalSiswa || 0, icon: '👨‍🎓', bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
          { label: 'Reward Hari Ini', value: data.rewardHariIni || 0, icon: '🏆', bg: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-200' },
          { label: 'Pelanggaran Hari Ini', value: data.pelanggaranHariIni || 0, icon: '⚠️', bg: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
          { label: 'Total Berita', value: data.totalBerita || 0, icon: '📰', bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-blue-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart 30 Hari */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">📊 Reward vs Pelanggaran 30 Hari Terakhir</h3>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="reward" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Reward" />
                <Bar dataKey="pelanggaran" fill="#DC2626" radius={[4, 4, 0, 0]} name="Pelanggaran" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-3 bg-yellow-500 rounded"></span>Reward</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-3 bg-red-500 rounded"></span>Pelanggaran</div>
            </div>
          </>
        ) : <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Data 30 hari belum tersedia</div>}
      </div>

      {/* Timeline Reward & Pelanggaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

        {/* Timeline Reward */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">🏆 Reward Terbaru</h3>
          {recentReward.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentReward.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm shrink-0">🏆</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.nama || '—'}</p>
                    <p className="text-xs text-gray-500">{r.reward_nama || '—'} • <span className="text-yellow-600 font-bold">+{r.reward_poin || 0} poin</span></p>
                    <p className="text-[10px] text-gray-400">{r.tanggal} • {r.kelas}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data reward</p>}
        </div>

        {/* Timeline Pelanggaran */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">⚠️ Pelanggaran Terbaru</h3>
          {recentPelanggaran.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentPelanggaran.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm shrink-0">⚠️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.nama || '—'}</p>
                    <p className="text-xs text-gray-500">{p.jenis_pelanggaran || '—'} • <span className="text-red-600 font-bold">-{p.poin || 0} poin</span></p>
                    <p className="text-[10px] text-gray-400">{p.tanggal} • {p.kelas}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data pelanggaran</p>}
        </div>
      </div>

      {/* Tab Berita & Prestasi */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('berita')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'berita' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >📰 Berita Sekolah</button>
          <button
            onClick={() => setActiveTab('prestasi')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'prestasi' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >🏆 Siswa Berprestasi</button>
        </div>

        {activeTab === 'berita' && (
          newsBerita.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {newsBerita.map((n) => (
                <Link key={n.id} href={`/berita/${n.slug}`} className="block p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-2">{n.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{n.category} • {n.views || 0} views</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada berita sekolah</p>
        )}

        {activeTab === 'prestasi' && (
          newsPrestasi.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {newsPrestasi.map((n) => (
                <Link key={n.id} href={`/berita/${n.slug}`} className="block p-3 rounded-xl border border-yellow-100 hover:border-yellow-300 hover:shadow-md transition-all group">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-yellow-600 line-clamp-2">{n.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{n.category} • {n.views || 0} views</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada berita prestasi</p>
        )}
      </div>
    </div>
  );
}