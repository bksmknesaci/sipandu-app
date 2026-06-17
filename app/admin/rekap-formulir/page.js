"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GraduationCap, Briefcase, University, BarChart3, Search, Eye, Download, Printer, X, FileText, Trash2 } from 'lucide-react';
import { getFormulirStats, getRekapFormulir, resetAllFormulirAction } from '@/app/actions/formulirActions';

function CountUp({ end, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    const startVal = prevEnd.current; const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(startVal + (end - startVal) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate); prevEnd.current = end;
  }, [end, duration]);
  return <span>{count}</span>;
}

export default function RekapFormulirPage() {
  const [stats, setStats] = useState({ totalTracer: 0, totalKarir: 0, totalSnbp: 0, totalAll: 0 });
  const [activeTab, setActiveTab] = useState('tracer');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const res = await getFormulirStats();
    if (res) setStats(res);
  };

  useEffect(() => { fetchData(); }, [activeTab, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    const res = await getRekapFormulir(activeTab, { search: searchTerm });
    if (res.data) setData(res.data);
    setLoading(false);
  };

  const handleResetAll = async () => {
    if (!confirm('⚠️ PERINGATAN!\n\nSemua data formulir (Tracer Studi, Pemetaan Karir, SNBP/SNBT) akan dihapus permanen.\n\nLanjutkan?')) return;
    setResetting(true);
    const res = await resetAllFormulirAction();
    if (res.error) {
      alert('Gagal menghapus: ' + res.error);
    } else {
      loadStats();
      fetchData();
    }
    setResetting(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(d => 
      d.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.nisn?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]).filter(k => k !== 'id');
    const rows = filteredData.map((d, idx) => headers.map(h => `"${d[h] || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Rekap_Formulir_${activeTab}.csv`; link.click();
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    const headers = activeTab === 'tracer' ? ['No', 'NISN', 'Nama', 'Tahun Lulus', 'Status Saat Ini'] : activeTab === 'karir' ? ['No', 'NISN', 'Nama', 'Kelas', 'Rencana Lulus'] : ['No', 'NISN', 'Nama', 'Kelas', 'Jalur', 'PT Tujuan', 'Status'];
    const rows = filteredData.map((d, idx) => {
      if (activeTab === 'tracer') return `<tr><td>${idx+1}</td><td>${d.nisn}</td><td>${d.nama}</td><td>${d.tahun_lulus}</td><td>${d.status_saat_ini}</td></tr>`;
      if (activeTab === 'karir') return `<tr><td>${idx+1}</td><td>${d.nisn}</td><td>${d.nama}</td><td>${d.kelas}</td><td>${d.rencana_setelah_lulus}</td></tr>`;
      return `<tr><td>${idx+1}</td><td>${d.nisn}</td><td>${d.nama}</td><td>${d.kelas}</td><td>${d.jalur_pendaftaran}</td><td>${d.pt_tujuan}</td><td>${d.status_hasil}</td></tr>`;
    }).join('');
    w.document.write(`<html><head><title>Rekap Formulir</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6;font-weight:bold}</style></head><body><h2>Rekap Formulir ${activeTab.toUpperCase()}</h2><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  const tableConfig = {
    tracer: {
      title: 'Tracer Studi Lulusan', icon: GraduationCap, color: 'text-blue-600',
      columns: ['No', 'NISN', 'Nama', 'Tahun Lulus', 'Jurusan', 'Status Saat Ini', 'Testimoni', 'Aksi']
    },
    karir: {
      title: 'Pemetaan Karir', icon: Briefcase, color: 'text-green-600',
      columns: ['No', 'NISN', 'Nama', 'Kelas', 'Jurusan', 'Rencana Lulus', 'PT Impian', 'Aksi']
    },
    snbp: {
      title: 'SNBP & SNBT', icon: University, color: 'text-orange-600',
      columns: ['No', 'NISN', 'Nama', 'Kelas', 'Jurusan', 'Jalur', 'PT Tujuan', 'Status', 'Aksi']
    }
  };

  const currentConfig = tableConfig[activeTab];

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><BarChart3 size={48}/></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">📊 Rekap Formulir SIPANDU</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base font-medium">Monitoring dan rekapitulasi seluruh formulir yang telah diisi oleh siswa maupun alumni.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracer Studi', value: stats.totalTracer, icon: GraduationCap, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Pemetaan Karir', value: stats.totalKarir, icon: Briefcase, color: 'from-green-500 to-emerald-600' },
          { label: 'Total SNBP/SNBT', value: stats.totalSnbp, icon: University, color: 'from-orange-500 to-amber-600' },
          { label: 'Total Formulir Masuk', value: stats.totalAll, icon: BarChart3, color: 'from-purple-500 to-indigo-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
            <stat.icon size={24} className="opacity-80 mb-2"/>
            <p className="text-3xl font-extrabold"><CountUp end={stat.value}/></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* TABS & ACTIONS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {Object.keys(tableConfig).map(key => (
            <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === key ? 'bg-slate-800 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {React.createElement(tableConfig[key].icon, { size: 16 })} {tableConfig[key].title}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-3 text-gray-400" size={16}/>
            <input type="text" placeholder="Cari Nama/NISN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-slate-500 focus:outline-none"/>
          </div>
          <button onClick={handleExportCSV} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 border border-green-200" title="Export CSV"><Download size={16}/></button>
          <button onClick={handlePrint} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 border border-gray-200" title="Cetak"><Printer size={16}/></button>
          <button onClick={handleResetAll} disabled={resetting} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-700 transition border border-red-600 shadow-sm disabled:opacity-50">
            <Trash2 size={14}/> {resetting ? '⏳' : 'Reset Semua'}
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                {currentConfig.columns.map(h => (
                  <th key={h} className="py-3 px-4 font-bold text-gray-600 text-xs uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400 animate-pulse">Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Tidak ada data formulir ditemukan</td></tr>
              ) : (
                filteredData.map((d, idx) => (
                  <tr key={d.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{d.nisn || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{d.nama}</td>
                    {activeTab === 'tracer' && (
                      <>
                        <td className="py-3 px-4 text-gray-600">{d.tahun_lulus}</td>
                        <td className="py-3 px-4 text-gray-600">{d.jurusan}</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{d.status_saat_ini}</span></td>
                        <td className="py-3 px-4 text-gray-500 text-xs max-w-[150px] truncate">{d.testimoni || '-'}</td>
                      </>
                    )}
                    {activeTab === 'karir' && (
                      <>
                        <td className="py-3 px-4 text-gray-600">{d.kelas}</td>
                        <td className="py-3 px-4 text-gray-600">{d.jurusan}</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{d.rencana_setelah_lulus}</span></td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{d.pt_impian || '-'}</td>
                      </>
                    )}
                    {activeTab === 'snbp' && (
                      <>
                        <td className="py-3 px-4 text-gray-600">{d.kelas}</td>
                        <td className="py-3 px-4 text-gray-600">{d.jurusan}</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{d.jalur_pendaftaran}</span></td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{d.pt_tujuan || '-'}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${d.status_hasil === 'Lulus' ? 'bg-green-100 text-green-700' : d.status_hasil === 'Tidak Lulus' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{d.status_hasil}</span></td>
                      </>
                    )}
                    <td className="py-3 px-4">
                      <button onClick={() => setShowDetail(d)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"><Eye size={16}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {React.createElement(currentConfig.icon, { size: 20, className: currentConfig.color })}
                Detail Formulir {currentConfig.title}
              </h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {Object.entries(showDetail).map(([key, value]) => {
                if (key === 'id' || key.includes('_url')) return null;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let displayVal = value || '-';
                if (key === 'minat_karir') {
                  try { displayVal = JSON.parse(value).join(', '); } catch { displayVal = value; }
                }
                if (key === 'created_at') displayVal = new Date(value).toLocaleString('id-ID');
                return (
                  <div key={key} className={key === 'testimoni' || key === 'catatan' || key === 'keterangan_tambahan' ? 'col-span-2' : ''}>
                    <span className="text-gray-500 font-medium block mb-1">{label}</span>
                    <p className="text-gray-800 font-semibold bg-gray-50 p-2 rounded-lg border border-gray-100 break-words">{displayVal}</p>
                  </div>
                );
              })}
              {showDetail.foto_aktivitas_url && (
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium block mb-1">Foto Aktivitas</span>
                  <img src={showDetail.foto_aktivitas_url} alt="Bukti" className="max-h-48 rounded-lg border"/>
                </div>
              )}
              {showDetail.bukti_file_url && (
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium block mb-1">Bukti File</span>
                  <a href={showDetail.bukti_file_url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1"><FileText size={14}/> Lihat Bukti</a>
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