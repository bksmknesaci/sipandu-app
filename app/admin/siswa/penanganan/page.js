"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield, Search, Eye, Save, FileText, Award, AlertTriangle, Activity, RefreshCw, CalendarDays, Trash2
} from 'lucide-react';
import {
  getPenangananData, savePenangananAction, getSiswaPenangananDetail, getPenangananFilters, resetAllPenangananAction
} from '@/app/actions/penangananActions';
import PJInfoCard from '@/app/components/PJInfoCard';

const STATUS_OPTIONS = ['Semua', 'Belum Pembinaan', 'Pembinaan BK', 'SP1', 'SP2', 'SP3', 'Pindah', 'Keluar'];

function CountUp({ end, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    const startVal = prevEnd.current; const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate); prevEnd.current = end;
  }, [end, duration]);
  return <span>{count}</span>;
}

const TahapBadge = ({ tahap, statusAkhir }) => {
  // Prioritas tampilan Pindah/Keluar di badge
  if (statusAkhir === 'Pindah' || tahap === 'Pindah') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-700 border-green-300">Pindah</span>;
  }
  if (statusAkhir === 'Keluar' || tahap === 'Keluar') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-200 text-red-800 border-red-300">Keluar</span>;
  }

  const config = {
    'Belum Pembinaan': 'bg-gray-100 text-gray-500 border-gray-200',
    'Pembinaan BK': 'bg-blue-100 text-blue-700 border-blue-200',
    'SP1': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'SP2': 'bg-orange-100 text-orange-700 border-orange-200',
    'SP3': 'bg-red-100 text-red-700 border-red-200',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config[tahap] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>{tahap || 'Belum Pembinaan'}</span>;
};

export default function PenangananSiswa() {
  const [user, setUser] = useState(null);
  const [siswaList, setSiswaList] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ tingkat: [], jurusan: [] });
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [filters, setFilters] = useState({ tingkat: '', jurusan: '', status: 'Semua', search: '' });
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [activeTab, setActiveTab] = useState('pelanggaran');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [initialStatus, setInitialStatus] = useState('Aktif');

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role === 'Wali Kelas' && u.kelas) {
        const parts = (u.kelas || '').trim().split(/\s+/);
        setFilters(prev => ({ ...prev, tingkat: parts[0] || '', jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || '') }));
      }
    }
  }, []);

  useEffect(() => { loadFilterOptions(); }, []);
  useEffect(() => { if (user) fetchData(); }, [user, filters]);

  const loadFilterOptions = async () => {
    const res = await getPenangananFilters();
    if (res.tingkat) setFilterOptions(prev => ({ ...prev, tingkat: res.tingkat }));
    if (res.jurusan) setFilterOptions(prev => ({ ...prev, jurusan: res.jurusan }));
  };

  const fetchData = async () => {
    setLoading(true);
    const dataRes = await getPenangananData({ ...filters, userRole: user?.role, userKelas: user?.kelas });
    if (dataRes.data) setSiswaList(dataRes.data);
    setLoading(false);
  };

  // Hitung statistik langsung dari tabel agar 100% sinkron
  const stats = useMemo(() => {
    let bkOnly = 0, sp1 = 0, sp2 = 0, sp3 = 0, pindah = 0, keluar = 0;
    siswaList.forEach(s => {
      const tahap = s.penanganan?.tahap;
      const statusAkhir = s.penanganan?.status_akhir || s.status;
      
      if (statusAkhir === 'Pindah') { pindah++; return; }
      if (statusAkhir === 'Keluar') { keluar++; return; }

      // Siswa yang masih aktif
      if (tahap === 'SP3') sp3++;
      else if (tahap === 'SP2') sp2++;
      else if (tahap === 'SP1') sp1++;
      else if (tahap === 'Pembinaan BK') bkOnly++;
    });

    // Dalam Pembinaan = Total semua siswa aktif yang sedang dibina (BK + SP1 + SP2 + SP3)
    const dalamPembinaan = bkOnly + sp1 + sp2 + sp3;

    return { bk: dalamPembinaan, sp1, sp2, sp3, pindah, keluar };
  }, [siswaList]);

  const handleResetAll = async () => {
    if (!confirm('⚠️ PERINGATAN!\n\nSemua riwayat penanganan, SP, dan status Pindah/Keluar akan dihapus permanen.\nSemua siswa akan dikembalikan menjadi "Aktif".\n\nLanjutkan?')) return;
    setResetting(true);
    const res = await resetAllPenangananAction();
    if (res.error) alert('Gagal: ' + res.error);
    else fetchData();
    setResetting(false);
  };

  const openDetail = async (siswa) => {
    const res = await getSiswaPenangananDetail(siswa.id);
    if (res.siswa) {
      setDetailData(res);
      const totalPoin = res.siswa.total_pelanggaran || 0;
      let autoTahap = 'Belum Pembinaan';
      if (totalPoin >= 150) autoTahap = 'SP3';
      else if (totalPoin >= 126) autoTahap = 'SP2';
      else if (totalPoin >= 100) autoTahap = 'SP1';
      else if (totalPoin > 0) autoTahap = 'Pembinaan BK';

      const currentStatus = res.penanganan?.status_akhir || 'Aktif';
      setInitialStatus(currentStatus);

      setFormData({
        siswa_id: siswa.id, nisn: siswa.nisn, nama: siswa.nama, kelas: siswa.kelas, jurusan: siswa.jurusan,
        jenis_kelamin: siswa.jenis_kelamin, total_poin: totalPoin, tahap: res.penanganan?.tahap || autoTahap,
        layanan_bk: res.penanganan?.layanan_bk || 'Belum', sp1: res.penanganan?.sp1 || false, tgl_sp1: res.penanganan?.tgl_sp1 || '',
        sp2: res.penanganan?.sp2 || false, tgl_sp2: res.penanganan?.tgl_sp2 || '', sp3: res.penanganan?.sp3 || false,
        tgl_sp3: res.penanganan?.tgl_sp3 || '', catatan_bk: res.penanganan?.catatan_bk || '', status_akhir: currentStatus,
        tanggal_keputusan: res.penanganan?.tanggal_keputusan || new Date().toLocaleDateString('sv-SE'), user_id: user?.id
      });
      setShowDetail(siswa.id);
      setActiveTab('penanganan');
    }
  };

  const handleSave = async () => {
    if ((formData.status_akhir === 'Pindah' || formData.status_akhir === 'Keluar') && !formData.tanggal_keputusan) {
      alert('Harap isi Tanggal Keputusan sebelum menyimpan!'); return;
    }
    setSaving(true);
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [];
    const res = await savePenangananAction(formData, files);
    if (res.error) alert('Gagal menyimpan: ' + res.error);
    else { setShowDetail(null); fetchData(); }
    setSaving(false);
  };

  const isLockedByDB = initialStatus === 'Pindah' || initialStatus === 'Keluar';
  const isChangingToExit = formData.status_akhir === 'Pindah' || formData.status_akhir === 'Keluar';
  const isWaliKelas = user?.role === 'Wali Kelas';

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><Shield size={48} /></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">🛡️ Penanganan Siswa</h1>
          <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium">Monitoring dan tindak lanjut siswa berdasarkan akumulasi pelanggaran serta hasil pembinaan sekolah.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Dalam Pembinaan', value: stats.bk, color: 'from-blue-500 to-blue-600' },
          { label: 'SP1 Aktif', value: stats.sp1, color: 'from-yellow-500 to-yellow-600' },
          { label: 'SP2 Aktif', value: stats.sp2, color: 'from-orange-500 to-orange-600' },
          { label: 'SP3 Aktif', value: stats.sp3, color: 'from-red-500 to-red-600' },
          { label: 'Pindah Sekolah', value: stats.pindah, color: 'from-green-500 to-green-600' },
          { label: 'Keluar Sekolah', value: stats.keluar, color: 'from-gray-600 to-gray-700' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
            <p className="text-3xl font-extrabold"><CountUp end={stat.value} /></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Tingkat</label>
            <select value={filters.tingkat} onChange={e => setFilters({ ...filters, tingkat: e.target.value })} disabled={isWaliKelas} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100">
              <option value="">Semua Tingkat</option>
              {filterOptions.tingkat.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Jurusan & Kelas</label>
            <select value={filters.jurusan} onChange={e => setFilters({ ...filters, jurusan: e.target.value })} disabled={isWaliKelas} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100">
              <option value="">Semua Jurusan</option>
              {filterOptions.jurusan.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Status Penanganan</label>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Pencarian</label>
            <Search className="absolute left-3 bottom-3 text-gray-400" size={16} />
            <input type="text" placeholder="Cari Nama/NISN..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <button onClick={handleResetAll} disabled={resetting} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition text-sm font-semibold shadow-sm h-[42px] disabled:opacity-50">
            <Trash2 size={16} /> {resetting ? 'Mereset...' : 'Reset Semua Penanganan'}
          </button>
        </div>
      </div>

      {/* KARTU INFO PENANGGUNG JAWAB KELAS */}
      <PJInfoCard kelas={filters.tingkat} jurusan={filters.jurusan} />

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase">No</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase">NISN</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase">Nama Siswa</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase">Kelas</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase">Jurusan</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">L/P</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Total Poin</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Status Saat Ini</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-400 animate-pulse">Memuat data...</td></tr>
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <Shield size={48} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-semibold">Tidak ada siswa ditemukan</p>
                  </td>
                </tr>
              ) : (
                siswaList.map((s, idx) => {
                  const isExited = s.status === 'Pindah' || s.status === 'Keluar' || s.penanganan?.status_akhir === 'Pindah' || s.penanganan?.status_akhir === 'Keluar';
                  return (
                    <tr key={s.id || idx} className={`transition-colors ${isExited ? 'bg-red-50' : 'hover:bg-indigo-50/30'}`}>
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{s.nisn || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.nama}</td>
                      <td className="py-3 px-4 text-gray-600">{s.kelas}</td>
                      <td className="py-3 px-4 text-gray-600">{s.jurusan}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${s.jenis_kelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {s.jenis_kelamin || 'L'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-600">{s.total_pelanggaran || 0}</td>
                      <td className="py-3 px-4 text-center">
                        <TahapBadge tahap={s.penanganan?.tahap} statusAkhir={s.penanganan?.status_akhir || s.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => openDetail(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition" title="Detail & Penanganan">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && siswaList.length > 0 && (
          <div className="p-4 border-t bg-gray-50/50 text-sm text-gray-500 flex justify-between">
            <span>Menampilkan <span className="font-bold text-gray-700">{siswaList.length}</span> siswa</span>
            <span>Sisa Aktif: <span className="font-bold text-green-700">{siswaList.filter(s => s.status === 'Aktif').length}</span></span>
          </div>
        )}
      </div>

      {/* MODAL DETAIL & FORM PENANGANAN */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-scaleIn mb-10" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{detailData.siswa.nama}</h3>
                <p className="text-sm opacity-90">{detailData.siswa.nisn} • {detailData.siswa.kelas} {detailData.siswa.jurusan} • Total Poin: <span className="font-extrabold">{detailData.siswa.total_pelanggaran}</span></p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-1 border-b pb-2 overflow-x-auto">
                {[
                  { id: 'pelanggaran', label: 'Pelanggaran', icon: AlertTriangle },
                  { id: 'reward', label: 'Reward', icon: Award },
                  { id: 'kehadiran', label: 'Kehadiran', icon: Activity },
                  { id: 'penanganan', label: 'Penanganan', icon: Shield },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <tab.icon size={16} /> {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'pelanggaran' && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {detailData.pelanggaran.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Tidak ada riwayat</p> : detailData.pelanggaran.map(p => (
                    <div key={p.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border text-sm">
                      <div><p className="font-semibold text-gray-800">{p.jenis_pelanggaran}</p><p className="text-xs text-gray-500 mt-0.5">{p.tanggal} • oleh {p.dicatat_oleh || '-'}</p></div>
                      <span className="text-red-600 font-bold whitespace-nowrap ml-3">+{p.poin} poin</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reward' && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {detailData.reward.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Tidak ada riwayat</p> : detailData.reward.map(r => (
                    <div key={r.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border text-sm">
                      <div><p className="font-semibold text-gray-800">{r.reward_nama}</p><p className="text-xs text-gray-500 mt-0.5">{r.tanggal} • oleh {r.diberikan_oleh || '-'}</p></div>
                      <span className="text-green-600 font-bold whitespace-nowrap ml-3">+{r.reward_poin} poin</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'kehadiran' && (
                <div className="grid grid-cols-4 gap-4 text-center">
                  {[
                    { label: 'Hadir', value: detailData.absensi.filter(a => a.status === 'Hadir').length, color: 'text-green-600 bg-green-50 border-green-200' },
                    { label: 'Sakit', value: detailData.absensi.filter(a => a.status === 'Sakit').length, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                    { label: 'Izin', value: detailData.absensi.filter(a => a.status === 'Izin').length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                    { label: 'Alpha', value: detailData.absensi.filter(a => a.status === 'Alpha').length, color: 'text-red-600 bg-red-50 border-red-200' },
                  ].map(s => (
                    <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
                      <p className="text-2xl font-extrabold">{s.value}</p>
                      <p className="text-xs font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'penanganan' && (
                <div className="space-y-4">
                  {isLockedByDB && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm font-semibold text-center flex items-center justify-center gap-2">
                      <AlertTriangle size={16} /> Data terkunci. Siswa berstatus <b>{initialStatus}</b>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Layanan BK</label>
                      <select value={formData.layanan_bk} onChange={e => setFormData({ ...formData, layanan_bk: e.target.value })} disabled={isLockedByDB} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100">
                        <option value="Belum">Belum</option><option value="Dalam Proses">Dalam Proses</option><option value="Sudah">Sudah</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Tahap Penanganan</label>
                      <select value={formData.tahap} onChange={e => setFormData({ ...formData, tahap: e.target.value })} disabled={isLockedByDB} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100">
                        <option value="Pembinaan BK">Pembinaan BK</option><option value="SP1">SP1</option><option value="SP2">SP2</option><option value="SP3">SP3</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['sp1', 'sp2', 'sp3'].map(sp => (
                      <div key={sp} className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                        <input type="checkbox" checked={formData[sp] || false} onChange={e => setFormData({ ...formData, [sp]: e.target.checked })} disabled={isLockedByDB} className="w-4 h-4 text-indigo-600 rounded" />
                        <label className="text-sm font-bold text-gray-700 uppercase">{sp}</label>
                        <input type="date" value={formData[`tgl_${sp}`] || ''} onChange={e => setFormData({ ...formData, [`tgl_${sp}`]: e.target.value })} disabled={isLockedByDB} className="ml-auto p-1.5 border rounded-lg text-xs text-gray-800 disabled:bg-gray-100" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Status Akhir</label>
                      <select value={formData.status_akhir} onChange={e => setFormData({ ...formData, status_akhir: e.target.value })} disabled={isWaliKelas || isLockedByDB} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100">
                        <option value="Aktif">Aktif</option><option value="Pindah">Pindah</option><option value="Keluar">Keluar</option>
                      </select>
                    </div>
                    {isChangingToExit && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Tanggal Keputusan <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16}/>
                          <input type="date" value={formData.tanggal_keputusan || ''} onChange={e => setFormData({ ...formData, tanggal_keputusan: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-red-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none bg-red-50" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Catatan BK / Alasan</label>
                    <textarea value={formData.catatan_bk || ''} onChange={e => setFormData({ ...formData, catatan_bk: e.target.value })} disabled={isLockedByDB} rows={3} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 resize-none" placeholder="Masukkan catatan atau alasan..."></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Upload Dokumen (Maks 2MB)</label>
                    <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.png" multiple disabled={isLockedByDB} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>

                  {/* Riwayat Penanganan */}
                  {detailData.history && detailData.history.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Riwayat Penanganan</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {detailData.history.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-50 p-2.5 rounded-lg border text-xs">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>
                            <div>
                              <p className="font-semibold text-gray-700">{h.action}</p>
                              <p className="text-gray-400">{new Date(h.created_at).toLocaleString('id-ID')} {h.note && `• ${h.note}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isLockedByDB && !isWaliKelas && (
                    <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                      <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Penanganan'}
                    </button>
                  )}
                </div>
              )}
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