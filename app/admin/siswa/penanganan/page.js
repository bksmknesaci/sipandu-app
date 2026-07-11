"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield, Search, Eye, Save, FileText, Award, AlertTriangle, Activity, RefreshCw, CalendarDays, Trash2, CheckCheck, X, ShieldAlert, Loader2
} from 'lucide-react';
import {
  getPenangananData, savePenangananAction, getSiswaPenangananDetail, getPenangananFilters, resetAllPenangananAction
} from '@/app/actions/penangananActions';
import PJInfoCard from '@/app/components/PJInfoCard';

const STATUS_OPTIONS = ['Semua', 'Belum Pembinaan', 'Dalam Pembinaan', 'SP1', 'SP2', 'SP3', 'Mutasi', 'Pindah', 'Keluar'];
const LAYANAN_BK_OPTIONS = ['Belum Pendampingan', 'Pendampingan 1', 'Pendampingan 2', 'Pendampingan 3', 'Pendampingan 4', 'Pendampingan Terakhir'];
const MONTH_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// Mapping Pendampingan BK → Tahap Penanganan
const BK_TO_TAHAP_MAP = {
  'Belum Pendampingan': 'Belum Pembinaan',
  'Pendampingan 1': 'Dalam Pembinaan',
  'Pendampingan 2': 'SP1',
  'Pendampingan 3': 'SP2',
  'Pendampingan 4': 'SP3',
  'Pendampingan Terakhir': 'Mutasi',
};

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
  if (statusAkhir === 'Pindah') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-700 border-green-300">Pindah</span>;
  }
  if (statusAkhir === 'Keluar') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-200 text-red-800 border-red-300">Keluar</span>;
  }
  if (tahap === 'Mutasi') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-700 border-purple-300">Mutasi</span>;
  }
  const config = {
    'Belum Pembinaan': 'bg-gray-100 text-gray-500 border-gray-200',
    'Dalam Pembinaan': 'bg-blue-100 text-blue-700 border-blue-200',
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
  const [filters, setFilters] = useState({ tingkat: '', jurusan: '', status: 'Semua', search: '' });
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [activeTab, setActiveTab] = useState('pelanggaran');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal Reset Semua Penanganan
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const resetInputRef = useRef(null);

  const isWaliKelas = user?.role === 'Wali Kelas';
  const isAdmin = user?.role === 'Administrator';
  const isChangingToExit = formData.status_akhir === 'Pindah' || formData.status_akhir === 'Keluar';
  const statusFormRef = useRef(null);

  // Fungsi syncTahap: update tahap + otomatis cek/uncek SP checkbox
  const syncTahap = (field, value) => {
    const tahapValue = value !== undefined ? value : formData.tahap;
    setFormData(prev => {
      const next = { ...prev, [field]: tahapValue };
      if (tahapValue === 'SP3') {
        next.sp1 = true; next.sp2 = true; next.sp3 = true;
      } else if (tahapValue === 'SP2') {
        next.sp1 = true; next.sp2 = true; next.sp3 = false;
      } else if (tahapValue === 'SP1') {
        next.sp1 = true; next.sp2 = false; next.sp3 = false;
      } else {
        next.sp1 = false; next.sp2 = false; next.sp3 = false;
      }
      return next;
    });
  };

  // Hitung statistik kehadiran semester dari data detail
  const semesterStats = useMemo(() => {
    const att = detailData?.semesterAttendance || [];
    return {
      H: att.filter(a => a.status === 'Hadir').length,
      S: att.filter(a => a.status === 'Sakit').length,
      I: att.filter(a => a.status === 'Izin').length,
      A: att.filter(a => a.status === 'Alpha').length,
    };
  }, [detailData?.semesterAttendance]);

  // Hitung kehadiran per bulan untuk tabel semester
  const semesterMonthly = useMemo(() => {
    const att = detailData?.semesterAttendance || [];
    const monthMap = {};
    att.forEach(a => {
      const m = new Date(a.tanggal + 'T00:00:00').getMonth();
      const month = MONTH_ORDER[m];
      if (!month) return;
      if (!monthMap[month]) monthMap[month] = { H: 0, S: 0, I: 0, A: 0 };
      if (a.status === 'Hadir') monthMap[month].H++;
      else if (a.status === 'Sakit') monthMap[month].S++;
      else if (a.status === 'Izin') monthMap[month].I++;
      else if (a.status === 'Alpha') monthMap[month].A++;
    });
    return MONTH_ORDER.filter(m => monthMap[m]).map(m => ({ month: m, ...monthMap[m] }));
  }, [detailData?.semesterAttendance]);

    // Hitung auto-tahap dari kategori pelanggaran
  const autoTahapInfo = useMemo(() => {
    const att = detailData?.pelanggaran || [];
    let ringanPoin = 0, sedangPoin = 0, beratPoin = 0;
    att.forEach(p => {
      const cat = (p.kategori || '').trim().toLowerCase();
      if (cat === 'ringan') ringanPoin += (p.poin || 0);
      else if (cat === 'sedang') sedangPoin += (p.poin || 0);
      else if (cat === 'berat') beratPoin += (p.poin || 0);
    });
    let newTahap = null, reason = '';
    if (beratPoin >= 1) {
      newTahap = 'Dalam Pembinaan';
      reason = `Pelanggaran Berat: ${beratPoin} poin (≥1 poin langsung naik ke Dalam Pembinaan)`;
    } else if (sedangPoin >= 1) {
      newTahap = 'Dalam Pembinaan';
      reason = `Pelanggaran Sedang: ${sedangPoin} poin (≥1 poin langsung naik ke Dalam Pembinaan)`;
    } else if (ringanPoin >= 10) {
      newTahap = 'Dalam Pembinaan';
      reason = `Pelanggaran Ringan: ${ringanPoin} poin (≥10 poin naik ke Dalam Pembinaan)`;
    }
    return { ringanPoin, sedangPoin, beratPoin, newTahap, reason, shouldUpdate: newTahap !== null };
  }, [detailData?.pelanggaran]);

  // Grup pelanggaran per kategori
  const pelanggaranGrouped = useMemo(() => {
    const groups = { 'Ringan': [], 'Sedang': [], 'Berat': [] };
    (detailData?.pelanggaran || []).forEach(p => {
      const cat = (p.kategori || '').trim();
      if (groups[cat]) groups[cat].push(p);
      else groups['Ringan'].push(p);
    });
    return groups;
  }, [detailData?.pelanggaran]);

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role === 'Wali Kelas') {
        const tingkat = (u.kelas || '').trim().split(/\s+/)[0] || '';
        const jurusan = (u.jurusan || '').trim() || (() => {
          const parts = (u.kelas || '').trim().split(/\s+/);
          return parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || '');
        })();
        setFilters(prev => ({ ...prev, tingkat, jurusan }));
      }
    }
  }, []);

  // Auto-focus input konfirmasi saat step 2
  useEffect(() => {
    if (showResetModal && resetStep === 2 && resetInputRef.current) {
      setTimeout(() => resetInputRef.current?.focus(), 100);
    }
  }, [showResetModal, resetStep]);

  useEffect(() => { loadFilterOptions(); }, []);
  useEffect(() => { if (user) fetchData(); }, [user, filters]);

  const loadFilterOptions = async () => {
    const res = await getPenangananFilters();
    if (res.tingkat) setFilterOptions(prev => ({ ...prev, tingkat: res.tingkat }));
    if (res.jurusan) setFilterOptions(prev => ({ ...prev, jurusan: res.jurusan }));
  };

  const fetchData = async () => {
    setLoading(true);
    const dataRes = await getPenangananData({ ...filters, userRole: user?.role, userKelas: user?.kelas, userJurusan: user?.jurusan });
    if (dataRes.data) setSiswaList(dataRes.data);
    setLoading(false);
  };

  const stats = useMemo(() => {
    let bkOnly = 0, sp1 = 0, sp2 = 0, sp3 = 0, pindah = 0, keluar = 0;
    siswaList.forEach(s => {
      const tahap = s.penanganan?.tahap;
      const statusAkhir = s.penanganan?.status_akhir || s.status;
      if (statusAkhir === 'Pindah') { pindah++; return; }
      if (statusAkhir === 'Keluar') { keluar++; return; }
      if (tahap === 'SP3') sp3++;
      else if (tahap === 'SP2') sp2++;
      else if (tahap === 'SP1') sp1++;
      else if (tahap === 'Dalam Pembinaan') bkOnly++;
    });
    return { bk: bkOnly + sp1 + sp2 + sp3, sp1, sp2, sp3, pindah, keluar };
  }, [siswaList]);

  // ── Modal Reset Semua: buka modal ──
  const openResetModal = () => {
    setResetStep(1)
    setResetConfirmText('')
    setResetResult(null)
    setShowResetModal(true)
  }

  // ── Modal Reset Semua: tutup modal ──
  const closeResetModal = () => {
    if (resetting) return
    setShowResetModal(false)
    setResetStep(1)
    setResetConfirmText('')
    setResetResult(null)
  }

  // ── Modal Reset Semua: eksekusi reset ──
  const executeResetAll = async () => {
    setResetting(true)
    setResetResult(null)
    try {
      const res = await resetAllPenangananAction()
      if (res.error) {
        setResetResult({ success: false, message: res.error })
      } else {
        setResetResult({ success: true, message: 'Semua riwayat penanganan berhasil dihapus. Semua siswa telah dikembalikan ke status "Aktif".' })
        fetchData()
      }
    } catch (err) {
      setResetResult({ success: false, message: 'Gagal mereset: ' + err.message })
    }
    setResetting(false)
  }

  const openDetail = async (siswa) => {
    const res = await getSiswaPenangananDetail(siswa.id);
    if (res.siswa) {
      setDetailData(res);
      const totalPoin = res.siswa.total_pelanggaran || 0;
      let autoTahap = 'Belum Pembinaan';
      if (totalPoin >= 150) autoTahap = 'SP3';
      else if (totalPoin >= 126) autoTahap = 'SP2';
      else if (totalPoin >= 100) autoTahap = 'SP1';
      else if (totalPoin > 0) autoTahap = 'Dalam Pembinaan';

      setFormData({
        siswa_id: siswa.id, nisn: siswa.nisn, nama: siswa.nama, kelas: siswa.kelas, jurusan: siswa.jurusan,
        jenis_kelamin: siswa.jenis_kelamin, total_poin: totalPoin, tahap: res.penanganan?.tahap || autoTahap,
        layanan_bk: res.penanganan?.layanan_bk || 'Belum Pendampingan',
        sp1: res.penanganan?.sp1 || false, tgl_sp1: res.penanganan?.tgl_sp1 || '',
        sp2: res.penanganan?.sp2 || false, tgl_sp2: res.penanganan?.tgl_sp2 || '',
        sp3: res.penanganan?.sp3 || false, tgl_sp3: res.penanganan?.tgl_sp3 || '',
        catatan_bk: res.penanganan?.catatan_bk || '',
        alasan_pindah_keluar: res.penanganan?.alasan_pindah_keluar || '',
        penggalian_masalah: res.penanganan?.penggalian_masalah || '',
        tindakan_korektip: res.penanganan?.tindakan_korektip || '',
        hasil_diharapkan: res.penanganan?.hasil_diharapkan || '',
        status_akhir: res.penanganan?.status_akhir || 'Aktif',
        tanggal_keputusan: res.penanganan?.tanggal_keputusan || new Date().toLocaleDateString('sv-SE'),
        user_id: user?.id
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
    const res = await savePenangananAction(formData);
    if (res.error) alert('Gagal menyimpan: ' + res.error);
    else {
      setShowDetail(null);
      await new Promise(r => setTimeout(r, 500));
      fetchData();
    }
    setSaving(false);
  };

  const handleAutoUpdateTahap = async () => {
    if (!autoTahapInfo.newTahap) return;
    setSaving(true);
    const res = await savePenangananAction({
      ...formData,
      tahap: autoTahapInfo.newTahap,
    });
    if (res.error) {
      alert('Gagal: ' + res.error);
    } else {
      setFormData(prev => ({ ...prev, tahap: autoTahapInfo.newTahap }));
      const detailRes = await getSiswaPenangananDetail(showDetail);
      if (detailRes.siswa) setDetailData(detailRes);
      await new Promise(r => setTimeout(r, 500));
      fetchData();
    }
    setSaving(false);
  };

  // Total data yang terpengaruh reset
  const totalAffected = stats.bk + stats.sp1 + stats.sp2 + stats.sp3 + stats.pindah + stats.keluar;

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
          {isAdmin && (
            <button onClick={openResetModal} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition text-sm font-semibold shadow-sm h-[42px]">
              <Trash2 size={16} /> Reset Semua Penanganan
            </button>
          )}
        </div>
      </div>

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
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Pendampingan BK</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Status Saat Ini</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-8 text-gray-400 animate-pulse">Memuat data...</td></tr>
              ) : siswaList.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-12">
                  <Shield size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-semibold">Tidak ada siswa ditemukan</p>
                </td></tr>
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
                        <span className="text-xs font-medium text-gray-600">{s.penanganan?.layanan_bk || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {showDetail && formData.siswa_id === s.id && (formData.status_akhir !== (s.penanganan?.status_akhir || s.status) || formData.tahap !== (s.penanganan?.tahap || 'Belum Pembinaan') || formData.layanan_bk !== (s.penanganan?.layanan_bk || 'Belum Pendampingan')) ? (
                          <div>
                            <TahapBadge tahap={formData.tahap} statusAkhir={formData.status_akhir} />
                            <span className="text-[9px] text-amber-600 font-medium block mt-0.5">belum disimpan</span>
                          </div>
                        ) : (
                          <TahapBadge tahap={s.penanganan?.tahap} statusAkhir={s.penanganan?.status_akhir || s.status} />
                        )}
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

      {/* MODAL DETAIL */}
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
              {/* Tab Navigation */}
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

              {/* TAB: Pelanggaran */}
              {activeTab === 'pelanggaran' && (
                <div className="space-y-4">
                  {autoTahapInfo.shouldUpdate && formData.tahap === 'Belum Pembinaan' && (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-800">Siswa memenuhi syarat Dalam Pembinaan</p>
                        <p className="text-xs text-amber-700 mt-0.5">{autoTahapInfo.reason}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {autoTahapInfo.beratPoin > 0 && <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Berat: {autoTahapInfo.beratPoin} poin</span>}
                          {autoTahapInfo.sedangPoin > 0 && <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Sedang: {autoTahapInfo.sedangPoin} poin</span>}
                          {autoTahapInfo.ringanPoin > 0 && <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Ringan: {autoTahapInfo.ringanPoin} poin</span>}
                        </div>
                      </div>
                      <button onClick={handleAutoUpdateTahap} disabled={saving} className="shrink-0 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition">
                        {saving ? 'Memproses...' : 'Perbarui Tahap'}
                      </button>
                    </div>
                  )}
                  {autoTahapInfo.shouldUpdate && formData.tahap !== 'Belum Pembinaan' && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-2">
                      <CheckCheck size={16} className="text-green-600" />
                      <p className="text-xs font-semibold text-green-700">Tahap sudah sesuai: <span className="font-extrabold">{formData.tahap}</span></p>
                    </div>
                  )}

                  {['Ringan', 'Sedang', 'Berat'].map(kategori => {
                    const items = pelanggaranGrouped[kategori] || [];
                    const poin = kategori === 'Ringan' ? autoTahapInfo.ringanPoin : kategori === 'Sedang' ? autoTahapInfo.sedangPoin : autoTahapInfo.beratPoin;
                    const config = {
                      Ringan: { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
                      Sedang: { color: 'bg-orange-50 border-orange-200 text-orange-800', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
                      Berat: { color: 'bg-red-50 border-red-200 text-red-800', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
                    };
                    if (items.length === 0) return null;
                    return (
                      <div key={kategori} className={`rounded-xl border ${config[kategori].color} overflow-hidden`}>
                        <div className={`px-4 py-2.5 flex items-center justify-between ${config[kategori].badge}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${config[kategori].dot}`}></span>
                            <span className="text-sm font-extrabold">{kategori}</span>
                          </div>
                          <span className="text-sm font-extrabold">{poin} poin</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto divide-y divide-white/50">
                          {items.map(p => (
                            <div key={p.id} className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-white/50 transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-800 truncate">{p.jenis_pelanggaran}</p>
                                <p className="text-[11px] text-gray-500">{p.tanggal} • {p.dicatat_oleh || '-'}</p>
                              </div>
                              <span className="font-bold text-gray-700 ml-3 whitespace-nowrap">+{p.poin}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {detailData.pelanggaran.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Ringan', value: autoTahapInfo.ringanPoin, count: pelanggaranGrouped.Ringan?.length || 0, color: 'bg-yellow-50 border-yellow-200 text-yellow-800', dot: 'bg-yellow-500' },
                        { label: 'Sedang', value: autoTahapInfo.sedangPoin, count: pelanggaranGrouped.Sedang?.length || 0, color: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-500' },
                        { label: 'Berat', value: autoTahapInfo.beratPoin, count: pelanggaranGrouped.Berat?.length || 0, color: 'bg-red-50 border-red-200 text-red-800', dot: 'bg-red-500' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl border ${s.color} p-3`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                              <span className="text-xs font-bold">{s.label}</span>
                            </div>
                            <span className="text-lg font-extrabold">{s.value}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">{s.count} kasus • {s.value} poin</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailData.pelanggaran.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5">
                        <FileText size={14} /> Keterangan Aturan Perubahan Tahap Otomatis
                      </h4>
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5 shrink-0"></span>
                          <span><b>Berat</b>: Poin <b>≥1</b> langsung naik ke <b>Dalam Pembinaan</b> (Mencuri, Bullying, Berjudi, dll)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mt-0.5 shrink-0"></span>
                          <span><b>Sedang</b>: Poin <b>≥1</b> langsung naik ke <b>Dalam Pembinaan</b> (Bolos Sekolah, Bolos Pelajaran, dll)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500 mt-0.5 shrink-0"></span>
                          <span><b>Ringan</b>: Poin <b>≥10</b> naik ke <b>Dalam Pembinaan</b> (Terlambat, Kelengkapan Atribut, dll)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Reward */}
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

              {/* TAB: Kehadiran (Semester) */}
              {activeTab === 'kehadiran' && (
                <div className="space-y-4">
                  {detailData.semesterInfo ? (
                    <>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                        <p className="text-sm font-bold text-indigo-700">
                          Semester {detailData.semesterInfo.semester} — {detailData.semesterInfo.school_year}
                        </p>
                        <p className="text-xs text-indigo-500 mt-0.5">
                          {new Date(detailData.semesterInfo.start_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' s.d. '}
                          {new Date(detailData.semesterInfo.end_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        {[
                          { label: 'Hadir', value: semesterStats.H, color: 'text-green-600 bg-green-50 border-green-200' },
                          { label: 'Sakit', value: semesterStats.S, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                          { label: 'Izin', value: semesterStats.I, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                          { label: 'Alpha', value: semesterStats.A, color: 'text-red-600 bg-red-50 border-red-200' },
                        ].map(s => (
                          <div key={s.label} className={`p-3 rounded-xl border ${s.color}`}>
                            <p className="text-xl font-extrabold">{s.value}</p>
                            <p className="text-[10px] font-semibold">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {semesterMonthly.length > 0 && (
                        <div className="overflow-x-auto border rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-left">Bulan</th>
                                <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-center">H</th>
                                <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-center">S</th>
                                <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-center">I</th>
                                <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-center">A</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {semesterMonthly.map(m => (
                                <tr key={m.month} className="hover:bg-gray-50">
                                  <td className="py-2 px-3 text-xs font-medium text-gray-800">{m.month}</td>
                                  <td className="py-2 px-3 text-center text-xs text-green-600 font-semibold">{m.H}</td>
                                  <td className="py-2 px-3 text-center text-xs text-yellow-600 font-semibold">{m.S}</td>
                                  <td className="py-2 px-3 text-center text-xs text-blue-600 font-semibold">{m.I}</td>
                                  <td className="py-2 px-3 text-center text-xs text-red-600 font-semibold">{m.A}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t font-bold">
                              <tr>
                                <td className="py-2.5 px-3 text-xs text-gray-700">Total</td>
                                <td className="py-2.5 px-3 text-center text-xs text-green-700">{semesterStats.H}</td>
                                <td className="py-2.5 px-3 text-center text-xs text-yellow-700">{semesterStats.S}</td>
                                <td className="py-2.5 px-3 text-center text-xs text-blue-700">{semesterStats.I}</td>
                                <td className="py-2.5 px-3 text-center text-xs text-red-700">{semesterStats.A}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays size={32} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">Kalender akademik belum diatur</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Penanganan */}
              {activeTab === 'penanganan' && (
                <div className="space-y-4">
                  {/* Baris 1: Pendampingan BK + Tahap */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Pendampingan BK</label>
                      <select value={formData.layanan_bk} onChange={e => {
                        const val = e.target.value;
                        const newTahap = BK_TO_TAHAP_MAP[val] || 'Belum Pembinaan';
                        setFormData(prev => {
                          const next = { ...prev, layanan_bk: val, tahap: newTahap };
                          if (newTahap === 'SP3') { next.sp1 = true; next.sp2 = true; next.sp3 = true; }
                          else if (newTahap === 'SP2') { next.sp1 = true; next.sp2 = true; next.sp3 = false; }
                          else if (newTahap === 'SP1') { next.sp1 = true; next.sp2 = false; next.sp3 = false; }
                          else { next.sp1 = false; next.sp2 = false; next.sp3 = false; }
                          return next;
                        });
                      }} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        {LAYANAN_BK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Tahap Penanganan</label>
                      <select value={formData.tahap} onChange={e => syncTahap('tahap', e.target.value)} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="Belum Pembinaan">Belum Pembinaan</option>
                        <option value="Dalam Pembinaan">Dalam Pembinaan</option>
                        <option value="SP1">SP1</option>
                        <option value="SP2">SP2</option>
                        <option value="SP3">SP3</option>
                        <option value="Mutasi">Mutasi</option>
                      </select>
                    </div>
                  </div>

                  {/* Baris 2: SP1, SP2, SP3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['sp1', 'sp2', 'sp3'].map(sp => (
                      <div key={sp} className="flex items-center gap-3 p-3 border rounded-xl bg-gray-50">
                        <input type="checkbox" checked={formData[sp] || false} onChange={e => setFormData({ ...formData, [sp]: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                        <label className="text-sm font-bold text-gray-700 uppercase">{sp}</label>
                        <input type="date" value={formData[`tgl_${sp}`] || ''} onChange={e => setFormData({ ...formData, [`tgl_${sp}`]: e.target.value })} className="ml-auto p-1.5 border rounded-lg text-xs text-gray-800" />
                      </div>
                    ))}
                  </div>

                  {/* Baris 3: Status Akhir + Tanggal Keputusan (Hanya Admin) */}
                  {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Status Akhir</label>
                        <select value={formData.status_akhir} onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const next = { ...prev, status_akhir: val };
                            if (val === 'Pindah' || val === 'Keluar') {
                              next.layanan_bk = 'Pendampingan Terakhir';
                              next.tahap = 'Mutasi';
                              next.sp1 = false; next.sp2 = false; next.sp3 = false;
                            } else if (prev.status_akhir === 'Pindah' || prev.status_akhir === 'Keluar') {
                              next.layanan_bk = 'Belum Pendampingan';
                              next.tahap = 'Belum Pembinaan';
                              next.sp1 = false; next.sp2 = false; next.sp3 = false;
                            }
                            return next;
                          });
                        }} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                          <option value="Aktif">Aktif</option>
                          <option value="Pindah">Pindah</option>
                          <option value="Keluar">Keluar</option>
                        </select>
                      </div>
                      {isChangingToExit && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Tanggal Keputusan <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input type="date" value={formData.tanggal_keputusan || ''} onChange={e => setFormData({ ...formData, tanggal_keputusan: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-red-300 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none bg-red-50" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hanya muncul saat Pindah/Keluar (Admin only) */}
                  {isChangingToExit && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Alasan Pindah/Keluar</label>
                      <textarea value={formData.alasan_pindah_keluar || ''} onChange={e => setFormData({ ...formData, alasan_pindah_keluar: e.target.value })} rows={2} className="w-full p-2.5 border border-red-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none bg-red-50 resize-none" placeholder="Jelaskan alasan siswa pindah atau keluar..."></textarea>
                    </div>
                  )}

                  {/* Form catatan (Admin & Wali Kelas) */}
                  {!isChangingToExit && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Catatan Permasalahan</label>
                        <textarea value={formData.catatan_bk || ''} onChange={e => setFormData({ ...formData, catatan_bk: e.target.value })} rows={2} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Catatan tambahan terkait permasalahan..."></textarea>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Penggalian Masalah</label>
                        <textarea value={formData.penggalian_masalah || ''} onChange={e => setFormData({ ...formData, penggalian_masalah: e.target.value })} rows={2} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Identifikasi akar permasalahan siswa..."></textarea>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Tindakan Korektip</label>
                        <textarea value={formData.tindakan_korektip || ''} onChange={e => setFormData({ ...formData, tindakan_korektip: e.target.value })} rows={2} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Tindakan yang telah dilakukan..."></textarea>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Hasil yang Diharapkan</label>
                        <textarea value={formData.hasil_diharapkan || ''} onChange={e => setFormData({ ...formData, hasil_diharapkan: e.target.value })} rows={2} className="w-full p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Hasil yang diharapkan dari tindakan..."></textarea>
                      </div>
                    </>
                  )}

                  {/* Riwayat Penanganan */}
                  {detailData.history && detailData.history.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Riwayat Penanganan</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {detailData.history.map((h, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-50 p-2.5 rounded-lg border text-xs">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-700">{h.action}</p>
                              <p className="text-gray-400 mt-0.5">{new Date(h.created_at).toLocaleString('id-ID')}</p>
                              {h.note && h.note !== '-' && <p className="text-indigo-600 mt-0.5 bg-indigo-50 px-2 py-1 rounded-lg inline-block">{h.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                    <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Penanganan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Reset Semua Penanganan (2 Langkah) ── */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={closeResetModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white text-center relative">
              <button
                onClick={closeResetModal}
                disabled={resetting}
                className="absolute top-3 right-3 text-white/70 hover:text-white disabled:opacity-30 transition"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 border border-white/30">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-lg font-extrabold">Reset Semua Penanganan</h3>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${resetStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
                <div className={`w-10 h-0.5 transition-colors ${resetStep >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${resetStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              </div>

              {/* Step 1: Peringatan */}
              {resetStep === 1 && !resetResult && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Perhatian!</p>
                    <p className="text-xs text-red-700 leading-relaxed">
                      Tindakan ini akan <strong>menghapus semua data</strong> dari tabel <code className="bg-red-100 px-1 py-0.5 rounded text-[10px]">tb_penanganan_siswa</code> dan <code className="bg-red-100 px-1 py-0.5 rounded text-[10px]">tb_penanganan_history</code>, termasuk:
                    </p>
                    <ul className="text-xs text-red-700 mt-2 space-y-1 ml-4 list-disc">
                      <li>Riwayat pendampingan BK</li>
                      <li>Data SP1, SP2, SP3 beserta tanggal</li>
                      <li>Catatan pembinaan, penggalian masalah, tindakan korektip</li>
                      <li>Status Pindah/Keluar akan dikembalikan ke <strong>"Aktif"</strong></li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-800">
                      📊 Data yang terpengaruh: <strong>{totalAffected} siswa</strong> — Dalam Pembinaan: <strong>{stats.bk}</strong>, SP1: <strong>{stats.sp1}</strong>, SP2: <strong>{stats.sp2}</strong>, SP3: <strong>{stats.sp3}</strong>, Pindah: <strong>{stats.pindah}</strong>, Keluar: <strong>{stats.keluar}</strong>
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 text-center">Tindakan ini tidak dapat dibatalkan.</p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={closeResetModal}
                      disabled={resetting}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => setResetStep(2)}
                      disabled={resetting}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 shadow-sm"
                    >
                      Lanjutkan
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Ketik Konfirmasi */}
              {resetStep === 2 && !resetResult && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-700 mb-3">Ketik <code className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-sm">HAPUS SEMUA</code> untuk konfirmasi:</p>
                    <input
                      ref={resetInputRef}
                      type="text"
                      value={resetConfirmText}
                      onChange={e => setResetConfirmText(e.target.value)}
                      placeholder="HAPUS SEMUA"
                      disabled={resetting}
                      className="w-full text-center py-3 px-4 border-2 border-gray-200 rounded-xl text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setResetStep(1)}
                      disabled={resetting}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      ← Kembali
                    </button>
                    <button
                      onClick={executeResetAll}
                      disabled={resetting || resetConfirmText !== 'HAPUS SEMUA'}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      {resetting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Mereset...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Reset Permanen
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Result: Sukses / Gagal */}
              {resetResult && (
                <div className="space-y-4">
                  {resetResult.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="text-sm text-green-800 font-semibold mb-1">Berhasil Direset</p>
                      <p className="text-xs text-green-700 leading-relaxed">{resetResult.message}</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">❌</span>
                      </div>
                      <p className="text-sm text-red-800 font-semibold mb-1">Gagal Mereset</p>
                      <p className="text-xs text-red-700 leading-relaxed">{resetResult.message}</p>
                    </div>
                  )}
                  <button
                    onClick={closeResetModal}
                    className="w-full py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition shadow-sm"
                  >
                    Tutup
                  </button>
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