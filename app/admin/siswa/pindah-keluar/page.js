"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Package, Search, Download, Eye, FileText, Printer
} from 'lucide-react';
import {
  getPindahKeluarData, getPindahKeluarStats, getSiswaPenangananDetail, getPenangananFilters
} from '@/app/actions/penangananActions';

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

export default function RekapPindahKeluar() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ pindah: 0, keluar: 0, tahunIni: 0, semesterIni: 0 });
  const [filterOptions, setFilterOptions] = useState({ tingkat: [], jurusan: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ kelas: '', jurusan: '', status: 'Semua', search: '' });

  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    loadFilterOptions();
    fetchData();
  }, []);

  useEffect(() => { fetchData(); }, [filters]);

  const loadFilterOptions = async () => {
    const res = await getPenangananFilters();
    if (res.tingkat) setFilterOptions(prev => ({ ...prev, tingkat: res.tingkat }));
    if (res.jurusan) setFilterOptions(prev => ({ ...prev, jurusan: res.jurusan }));
  };

  const fetchData = async () => {
    setLoading(true);
    const [dataRes, statsRes] = await Promise.all([
      getPindahKeluarData(filters),
      getPindahKeluarStats()
    ]);
    if (dataRes.data) setData(dataRes.data);
    if (statsRes) setStats(statsRes);
    setLoading(false);
  };

  const openDetail = async (item) => {
    if (item.siswa_id) {
      const res = await getSiswaPenangananDetail(item.siswa_id);
      if (res.siswa) setDetailData({ profile: item, ...res });
    } else {
      setDetailData({ profile: item, siswa: null, pelanggaran: [], reward: [], absensi: [], penanganan: {}, history: [] });
    }
    setShowDetail(item.id);
  };

    const handleExportCSV = () => {
    const headers = ['No', 'NISN', 'Nama', 'Kelas', 'Jurusan', 'L/P', 'Status', 'Tanggal Keputusan', 'Alasan'];
    const rows = data.map((d, idx) => [idx + 1, d.nisn, d.nama, d.kelas, d.jurusan, d.jenis_kelamin, d.status, d.tanggal_keputusan, d.alasan].map(v => `"${v || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Rekap_Pindah_Keluar.csv';
    link.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    const rowsHtml = data.map((d, idx) => `
      <tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:6px">${d.nisn || ''}</td>
        <td style="border:1px solid #ccc;padding:6px;font-weight:bold">${d.nama || ''}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${d.kelas || ''} ${d.jurusan || ''}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${d.jenis_kelamin || ''}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center;font-weight:bold;color:${d.status === 'Pindah' ? '#7c3aed' : '#374151'}">${d.status}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${d.tanggal_keputusan || ''}</td>
        <td style="border:1px solid #ccc;padding:6px;font-size:10px">${d.alasan || '-'}</td>
      </tr>
    `).join('');

    w.document.write(`<html><head><title>Rekap Pindah & Keluar</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#e5e7eb;border:1px solid #ccc;padding:8px;font-weight:bold;text-align:center}</style>
    </head><body>
      <h2 style="text-align:center;margin-bottom:5px">REKAP PINDAH & KELUAR SISWA</h2>
      <p style="text-align:center;color:#666;margin-bottom:20px;font-size:12px">SIPANDU - Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <table><thead><tr><th>No</th><th>NISN</th><th>Nama</th><th>Kelas</th><th>L/P</th><th>Status</th><th>Tgl Keputusan</th><th>Alasan</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><Package size={48} /></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">📦 Rekap Pindah & Keluar</h1>
          <p className="text-gray-300 mt-2 text-sm md:text-base font-medium">Daftar siswa yang sudah tidak aktif karena pindah sekolah atau keluar sekolah.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pindah', value: stats.pindah, color: 'from-purple-500 to-purple-600' },
          { label: 'Total Keluar', value: stats.keluar, color: 'from-gray-600 to-gray-700' },
          { label: 'Total Tahun Ini', value: stats.tahunIni, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Semester Ini', value: stats.semesterIni, color: 'from-indigo-500 to-indigo-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
            <p className="text-3xl font-extrabold"><CountUp end={stat.value} /></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS & EXPORT */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-gray-500 focus:outline-none">
              <option value="Semua">Semua Status</option>
              <option value="Pindah">Pindah</option>
              <option value="Keluar">Keluar</option>
            </select>
            <select value={filters.kelas} onChange={e => setFilters({ ...filters, kelas: e.target.value })} className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-gray-500 focus:outline-none">
              <option value="">Semua Kelas</option>
              {filterOptions.tingkat.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.jurusan} onChange={e => setFilters({ ...filters, jurusan: e.target.value })} className="p-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-gray-500 focus:outline-none">
              <option value="">Semua Jurusan</option>
              {filterOptions.jurusan.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <div className="relative flex-1 md:flex-none md:min-w-[200px]">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input type="text" placeholder="Cari Nama/NISN..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-gray-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-sm"><Download size={16} /> CSV</button>
            <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition shadow-sm"><Printer size={16} /> Cetak</button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['No', 'NISN', 'Nama Siswa', 'Kelas', 'Jurusan', 'L/P', 'Status', 'Tgl Keputusan', 'Alasan Pindah/Keluar', 'Dokumen', 'Aksi'].map(h => (
                  <th key={h} className="py-3 px-4 font-bold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="11" className="text-center py-8 text-gray-400 animate-pulse">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-semibold">Belum ada data siswa pindah/keluar</p>
                    <p className="text-gray-400 text-xs mt-1">Data akan otomatis muncul saat siswa ditetapkan status Pindah/Keluar</p>
                  </td>
                </tr>
              ) : (
                data.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{d.nisn || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{d.nama}</td>
                    <td className="py-3 px-4 text-gray-600">{d.kelas}</td>
                    <td className="py-3 px-4 text-gray-600">{d.jurusan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${d.jenis_kelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {d.jenis_kelamin || 'L'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${d.status === 'Pindah' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{d.tanggal_keputusan}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs max-w-[200px] truncate" title={d.alasan}>{d.alasan || '-'}</td>
                    <td className="py-3 px-4">
                      {d.tb_pindah_keluar_dokumen?.length > 0 ? (
                        <span className="text-indigo-600 font-semibold text-xs flex items-center gap-1"><FileText size={12} /> {d.tb_pindah_keluar_dokumen.length} file</span>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => openDetail(d)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && data.length > 0 && (
          <div className="p-4 border-t bg-gray-50/50 text-sm text-gray-500">
            Menampilkan <span className="font-bold text-gray-700">{data.length}</span> data siswa pindah/keluar
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Detail Siswa {detailData.profile.status}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Nama:</span><br /><b className="text-gray-800">{detailData.profile.nama}</b></div>
                <div><span className="text-gray-500">NISN:</span><br /><b className="text-gray-800">{detailData.profile.nisn}</b></div>
                <div><span className="text-gray-500">Kelas Terakhir:</span><br /><b className="text-gray-800">{detailData.profile.kelas} {detailData.profile.jurusan}</b></div>
                <div><span className="text-gray-500">Tanggal Keputusan:</span><br /><b className="text-gray-800">{detailData.profile.tanggal_keputusan}</b></div>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 text-sm mt-4">Alasan / Catatan:</h4>
                <p className="bg-gray-50 p-3 rounded-xl text-gray-600 mt-1 border text-sm">{detailData.profile.alasan || '-'}</p>
              </div>

              {detailData.profile.tb_pindah_keluar_dokumen?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-700 text-sm mt-4">Dokumen Pendukung:</h4>
                  <div className="space-y-2 mt-1">
                    {detailData.profile.tb_pindah_keluar_dokumen.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                        <FileText size={14} /> {doc.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detailData.siswa && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div className="bg-red-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-red-500 font-semibold">Total Pelanggaran</p>
                    <p className="text-2xl font-extrabold text-red-700">{detailData.siswa.total_pelanggaran || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-green-500 font-semibold">Total Reward</p>
                    <p className="text-2xl font-extrabold text-green-700">{detailData.siswa.total_reward || 0}</p>
                  </div>
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