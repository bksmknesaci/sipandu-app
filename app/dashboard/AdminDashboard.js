'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdminDashboardData } from '@/app/actions/dashboardActions';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

// ─── Warna ──────────────────────────────────────────────────────
const COLORS = { hadir: '#16A34A', sakit: '#F59E0B', izin: '#1E40AF', alpha: '#DC2626' };
const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B'];

// ─── CountUp (requestAnimationFrame, presisi tinggi untuk angka besar) ───
function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
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
  return <span ref={ref}>{val}</span>;
}

// ─── Skeleton ────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div><div className="h-8 bg-gray-100 rounded w-1/2"></div></div>;
}

// ─── Helper: resolve nama siswa (defense layer) ─────────────────
function resolveNama(item) {
  if (item.nama_siswa && /[a-zA-Z]/.test(item.nama_siswa)) return item.nama_siswa;
  if (item.nama && /[a-zA-Z]/.test(item.nama)) return item.nama;
  if (item.nama_siswa) return item.nama_siswa;
  return item.nisn || item.nama || '—';
}

// ─── Helper: badge peringkat ────────────────────────────────────
function RankBadge({ index }) {
  if (index === 0) return <span className="text-xl leading-none">🥇</span>;
  if (index === 1) return <span className="text-xl leading-none">🥈</span>;
  if (index === 2) return <span className="text-xl leading-none">🥉</span>;
  return (
    <span className="w-7 h-7 rounded-full bg-gray-200/80 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
      {index + 1}
    </span>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function AdminDashboard() {
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
    getAdminDashboardData().then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8,9,10,11,12].map(i=><SkeletonCard key={i} />)}</div>;
  if (!data) return <p className="text-red-500">Gagal memuat data dashboard.</p>;

  // Data untuk chart
  const donutData = [
    { name: 'Hadir', value: data.hadirHariIni || 0, color: COLORS.hadir },
    { name: 'Sakit', value: data.sakitHariIni || 0, color: COLORS.sakit },
    { name: 'Izin', value: data.izinHariIni || 0, color: COLORS.izin },
    { name: 'Alpha', value: data.alphaHariIni || 0, color: COLORS.alpha },
  ].filter(d => d.value > 0);

  const distribusi = data.distribusi || { x: 0, xi: 0, xii: 0 };
  const pieData = [
    { name: 'Kelas X', value: distribusi.x || 0 },
    { name: 'Kelas XI', value: distribusi.xi || 0 },
    { name: 'Kelas XII', value: distribusi.xii || 0 },
  ];

  // Line chart: pakai data real dari server
  const lineData = data.lineChartData || [];
  const hasLineData = lineData.some(d => d.hadir > 0 || d.alpha > 0);

  const totalHariIni = (data.hadirHariIni || 0) + (data.sakitHariIni || 0) + (data.izinHariIni || 0) + (data.alphaHariIni || 0);

  const topReward = data.topReward || [];
  const topPelanggaran = data.topPelanggaran || [];
  const kelasAbsensi = data.kelasAbsensi || [];
  const latestNews = data.latestNews || [];
  const activities = data.activities || [];

  return (
    <div className="px-4 md:px-8 py-6 space-y-8 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">👋 Selamat Datang, <span className="text-blue-200">Administrator</span></h1>
            <p className="text-blue-200 text-sm mt-1">{dateStr}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center shrink-0">
            <p className="text-xl md:text-2xl font-bold font-mono tracking-wider">{clock}</p>
            <p className="text-blue-200 text-[10px]">WIB</p>
          </div>
        </div>
      </div>

      {/* ── Baris 1: Sumber Daya ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Siswa', value: data.totalSiswa || 0, icon: '👨‍🎓', bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
          { label: 'Total Wali Kelas', value: data.totalWaliKelas || 0, icon: '👨‍🏫', bg: 'from-emerald-500 to-green-600', shadow: 'shadow-green-200' },
          { label: 'Total Sekretaris', value: data.totalSekretaris || 0, icon: '👥', bg: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-200' },
          { label: 'Total Kelas', value: data.totalKelas || 0, icon: '🏫', bg: 'from-amber-500 to-orange-500', shadow: 'shadow-orange-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Baris 2: Kehadiran Hari Ini ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Hadir', value: data.hadirHariIni || 0, icon: '✅', bg: 'from-green-500 to-emerald-600', shadow: 'shadow-green-200' },
          { label: 'Sakit', value: data.sakitHariIni || 0, icon: '🤒', bg: 'from-amber-400 to-yellow-500', shadow: 'shadow-yellow-200' },
          { label: 'Izin', value: data.izinHariIni || 0, icon: '📄', bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
          { label: 'Alpha', value: data.alphaHariIni || 0, icon: '❌', bg: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Baris 3: Operasional ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Reward', value: data.totalReward || 0, icon: '🏆', bg: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-200' },
          { label: 'Total Pelanggaran', value: data.totalPelanggaran || 0, icon: '⚠️', bg: 'from-red-500 to-rose-600', shadow: 'shadow-red-200' },
          { label: 'Penanganan Aktif', value: data.penangananAktif || 0, icon: '📋', bg: 'from-orange-500 to-red-500', shadow: 'shadow-orange-200' },
          { label: 'Total Berita', value: data.totalBerita || 0, icon: '📰', bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-blue-200' },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} ${c.shadow} rounded-2xl p-3.5 md:p-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200`}>
            <span className="text-xl">{c.icon}</span>
            <p className="text-xl md:text-2xl font-bold text-white mt-1"><CountUp target={c.value} /></p>
            <p className="text-white/70 text-[11px] font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Donut Absensi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📊 Absensi Hari Ini</h3>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
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
              {totalHariIni > 0 && (
                <p className="text-center text-xs text-gray-400 mt-2">Persentase: <span className="font-bold text-green-600">{((data.hadirHariIni / totalHariIni) * 100).toFixed(1)}%</span></p>
              )}
            </>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>}
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📈 Kehadiran 30 Hari Terakhir</h3>
          {hasLineData ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="hadir" stroke="#16A34A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="alpha" stroke="#DC2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-0.5 bg-green-600 rounded"></span>Hadir</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-3 h-0.5 bg-red-600 rounded"></span>Alpha</div>
              </div>
            </>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Data 30 hari belum tersedia</div>}
        </div>

        {/* Pie Distribusi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">🏫 Distribusi Siswa per Tingkat</h3>
          {pieData.some(d => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.filter(d => d.value > 0).map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></span>
                    {d.name}: <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>}
        </div>
      </div>

      {/* ── Top 10 Siswa Berprestasi ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-4">🏆 Top 10 Siswa Berprestasi</h3>
        {topReward.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topReward.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-gray-100 border-gray-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="w-8 flex items-center justify-center shrink-0">
                  <RankBadge index={i} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{resolveNama(s)}</p>
                  <p className="text-xs text-gray-400">{s.total} poin</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data reward</p>}
      </div>

      {/* ── Top 10 Pelanggaran ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-4">⚠️ Top 10 Pelanggaran Tertinggi</h3>
        {topPelanggaran.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Peringkat</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                  <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Total Poin</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Kasus Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {topPelanggaran.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-red-50/30">
                    <td className="py-2.5 px-4 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-800 whitespace-nowrap">{resolveNama(s)}</td>
                    <td className="py-2.5 px-4 text-center"><span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">{s.total}</span></td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs truncate max-w-[200px]">{(s.items && s.items[0]) ? s.items[0].jenis_pelanggaran : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data pelanggaran</p>}
      </div>

      {/* ── Monitoring Kehadiran Per Kelas ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-4">📋 Monitoring Kehadiran Hari Ini per Kelas</h3>
        {kelasAbsensi.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-green-600 uppercase">H</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-yellow-600 uppercase">S</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-blue-600 uppercase">I</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-red-600 uppercase">A</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {kelasAbsensi.map((k, i) => {
                  const pct = k.total > 0 ? ((k.hadir / k.total) * 100).toFixed(0) : '0';
                  const pctNum = parseFloat(pct);
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-4 font-medium text-gray-800 whitespace-nowrap">{k.kelas}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{k.total}</td>
                      <td className="py-2.5 px-3 text-center text-green-600 font-medium">{k.hadir}</td>
                      <td className="py-2.5 px-3 text-center text-yellow-600">{k.sakit}</td>
                      <td className="py-2.5 px-3 text-center text-blue-600">{k.izin}</td>
                      <td className="py-2.5 px-3 text-center text-red-600 font-medium">{k.alpha}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${pctNum >= 80 ? 'bg-green-100 text-green-700' : pctNum >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada data kehadiran</p>}
      </div>

      {/* ── Berita + Aktivitas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="font-bold text-gray-800 text-sm mb-4">📰 Berita Terbaru</h3>
          {latestNews.length > 0 ? (
            <div className="space-y-3">
              {latestNews.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-400">{n.category} • {n.views || 0} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada berita</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="font-bold text-gray-800 text-sm mb-4">⏱️ Aktivitas Sistem Hari Ini</h3>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">{a.jam}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700"><span className="font-medium">{a.input_by}</span> — {a.nama}</p>
                    <p className="text-[11px] text-gray-400">Status: {a.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-6">Belum ada aktivitas hari ini</p>}
        </div>
      </div>
    </div>
  );
}