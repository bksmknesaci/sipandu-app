'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchSiswaAction, saveSiswaAction, deleteSiswaAction, deleteAllSiswaAction, importSiswaAction, promoteStudentsAction, graduateAndDeleteAction } from '@/app/actions/siswaActions';
import {
  Users, School, Award, UserCheck, UserX, Plus, Download, Upload, Printer,
  Search, Filter, Edit3, Trash2, X, CheckCircle, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, GraduationCap, ArrowUpCircle, Save,
  ShieldAlert, Loader2
} from 'lucide-react';

// [WA] Helper validasi nomor HP Indonesia
function normalizePhone(phone) {
  if (!phone) return ''
  let p = String(phone).trim().replace(/[^\d+]/g, '')
  if (p.startsWith('+')) p = p.substring(1)
  if (p.startsWith('08')) p = '62' + p.substring(1)
  return p
}

function isValidPhone(phone) {
  const p = normalizePhone(phone)
  return p.startsWith('62') && p.length >= 10 && p.length <= 15
}

export default function ManajemenSiswa() {
  const [activeTab, setActiveTab] = useState('data-siswa');
  
  // ===== DATA SISWA STATE =====
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // [WA] Tambah parent_whatsapp ke formData
  const [formData, setFormData] = useState({ nis: '', nama: '', kelas: '', jurusan: '', status: 'Aktif', jenis_kelamin: 'L', parent_whatsapp: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [importMsg, setImportMsg] = useState(null);
  
  // ===== KENAIKAN KELAS & KELULUSAN STATE =====
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteStep, setPromoteStep] = useState(1);
  const [promoteAction, setPromoteAction] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);
  const printRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => { fetchSiswa(); }, []);
  const fetchSiswa = async () => { setLoading(true); const result = await fetchSiswaAction(); if (result.data) setSiswa(result.data); if (result.error) console.error('Fetch error:', result.error); setLoading(false); };
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) } }, [toast])

  const stats = { total: siswa.length, kelas: [...new Set(siswa.map(s => s.kelas))].length, jurusan: [...new Set(siswa.map(s => s.jurusan))].length, aktif: siswa.filter(s => s.status === 'Aktif').length, nonAktif: siswa.filter(s => s.status !== 'Aktif').length };

  const filteredSiswa = siswa.filter(s => {
    const matchSearch = s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn?.includes(searchTerm) || (s.parent_whatsapp || '').includes(searchTerm);
    const matchTingkat = !filterKelas || s.kelas === filterKelas || (s.kelas && s.kelas.startsWith(filterKelas + ' '));
    const kelasParts = (s.kelas || '').trim().split(/\s+/);
    const studentKelasGroup = kelasParts.length > 1 ? kelasParts.slice(1).join(' ') : (s.jurusan || '');
    const matchKelasGroup = !filterJurusan || studentKelasGroup === filterJurusan;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchTingkat && matchKelasGroup && matchStatus;
  });

  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);
  const paginatedSiswa = filteredSiswa.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tingkatList = [...new Set(siswa.map(s => { const kelas = (s.kelas || '').trim(); const firstWord = kelas.split(/\s+/)[0]; if (['X', 'XI', 'XII'].includes(firstWord)) return firstWord; return firstWord; }))].filter(Boolean).sort();
  const kelasGroupList = [...new Set(siswa.map(s => { const kelas = (s.kelas || '').trim(); const parts = kelas.split(/\s+/); if (parts.length > 1) return parts.slice(1).join(' '); return s.jurusan || ''; }))].filter(Boolean).sort();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // [WA] Tambah parent_whatsapp di openAddModal
  const openAddModal = () => { setFormData({ nis: '', nama: '', kelas: '', jurusan: '', status: 'Aktif', jenis_kelamin: 'L', parent_whatsapp: '' }); setEditMode(false); setIsModalOpen(true); };
  // [WA] Tambah parent_whatsapp di openEditModal
  const openEditModal = (s) => { setFormData({ ...s, nis: s.nisn || s.nis || '', parent_whatsapp: s.parent_whatsapp || '' }); setEditMode(true); setIsModalOpen(true); };

  const handleSave = async () => {
    if (!formData.nis || !formData.nama || !formData.kelas || !formData.jurusan) { alert('Semua field wajib diisi!'); return }
    // [WA] Validasi nomor WA jika diisi
    if (formData.parent_whatsapp && !isValidPhone(formData.parent_whatsapp)) {
      alert('Format No. WA Orang Tua tidak valid. Gunakan format: 08xxx atau 628xxx (10-15 digit).');
      return;
    }
    try {
      // [WA] Normalize phone sebelum simpan
      const dataToSave = { ...formData, parent_whatsapp: formData.parent_whatsapp ? normalizePhone(formData.parent_whatsapp) : null };
      const result = await saveSiswaAction(dataToSave, editMode);
      if (result.error) { alert('Gagal simpan: ' + result.error); return; }
      setIsModalOpen(false); fetchSiswa();
    } catch (error) { console.error('Save error:', error); alert('Terjadi kesalahan saat menyimpan data. Coba lagi.'); }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setDeleting(true);
    try {
      const result = await deleteSiswaAction(showDeleteModal.id);
      if (result.error) { alert('Gagal hapus: ' + result.error); return; }
      setShowDeleteModal(null);
      setDeleteConfirmText('');
      setCurrentPage(1);
      fetchSiswa();
    } catch (error) { console.error('Delete error:', error); alert('Terjadi kesalahan saat menghapus data.'); }
    setDeleting(false);
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    const result = await deleteAllSiswaAction();
    if (result.error) { alert('Gagal menghapus semua data: ' + result.error); }
    else { fetchSiswa(); setShowDeleteAllModal(false); setDeleteConfirmText(''); }
    setDeletingAll(false);
  };

  const getTargetStudents = () => { if (promoteAction === 'naik-xi') return siswa.filter(s => s.kelas?.startsWith('X ') || s.kelas === 'X'); if (promoteAction === 'naik-xii') return siswa.filter(s => s.kelas?.startsWith('XI ') || s.kelas === 'XI'); if (promoteAction === 'lulus') return siswa.filter(s => s.kelas?.startsWith('XII ') || s.kelas === 'XII'); return []; };
  const getNewKelas = (oldKelas, action) => { if (!oldKelas) return oldKelas; const parts = oldKelas.split(' '); if (action === 'naik-xi') parts[0] = 'XI'; if (action === 'naik-xii') parts[0] = 'XII'; return parts.join(' '); };
  const openPromoteModal = (action) => { setPromoteAction(action); setPromoteStep(1); setAcademicYear(''); setSelectedIds([]); setIsPromoteModalOpen(true); };
  const handlePromoteNext = () => { if (promoteStep === 1 && !academicYear) { alert('Masukkan tahun ajaran terlebih dahulu!'); return; } if (promoteStep === 1) { const targets = getTargetStudents(); setSelectedIds(targets.map(s => s.id)); setPromoteStep(2); } else if (promoteStep === 2) { setPromoteStep(3); } };
  const toggleStudentSelection = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDownloadArchive = () => {
    const archiveStudents = siswa.filter(s => selectedIds.includes(s.id));
    // [WA] Tambah kolom parent_whatsapp di arsip
    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'No WA Ortu', 'Status'];
    const rows = archiveStudents.map((s, idx) => [idx + 1, s.nisn || '', s.nama || '', s.jenis_kelamin || '', s.kelas || '', s.jurusan || '', s.parent_whatsapp || '', s.status || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `Arsip_Lulusan_${academicYear.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const handleProcessPromote = async () => {
    setPromoteLoading(true);
    try { if (promoteAction === 'lulus') { const result = await graduateAndDeleteAction(selectedIds); if (result.error) { alert('Gagal: ' + result.error); return; } } else { const updates = siswa.filter(s => selectedIds.includes(s.id)).map(s => ({ id: s.id, kelas: getNewKelas(s.kelas, promoteAction) })); const result = await promoteStudentsAction(updates); if (result.error) { alert('Gagal: ' + result.error); return; } } setIsPromoteModalOpen(false); fetchSiswa(); } finally { setPromoteLoading(false); }
  };

  // [WA] Tambah kolom parent_whatsapp di export CSV
  const handleExportCSV = () => {
    if (filteredSiswa.length === 0) { alert('Tidak ada data untuk diexport.'); return; }
    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'No WA Ortu', 'Status'];
    const rows = filteredSiswa.map((s, idx) => [idx + 1, s.nisn || '', s.nama || '', s.jenis_kelamin || '', s.kelas || '', s.jurusan || '', s.parent_whatsapp || '', s.status || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `Data_Siswa_SIPANDU_${new Date().toISOString().split('T')[0]}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  // [WA] Update import CSV untuk kolom parent_whatsapp (index 6)
  const handleImportCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.name.endsWith('.csv')) { alert('File harus berformat CSV.'); return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result; const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) { alert('File CSV kosong atau tidak valid.'); return; }
      const dataRows = lines.slice(1); const importedData = [];
      for (const line of dataRows) {
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!columns || columns.length < 4) continue;
        const cleanValue = (val) => String(val).replace(/^"|"$/g, '').trim();
        importedData.push({
          nis: cleanValue(columns[1] || ''),
          nama: cleanValue(columns[2] || ''),
          jenis_kelamin: cleanValue(columns[3] || 'L'),
          kelas: cleanValue(columns[4] || ''),
          jurusan: cleanValue(columns[5] || ''),
          parent_whatsapp: normalizePhone(cleanValue(columns[6] || '')), // [WA] Kolom baru di index 6
          status: cleanValue(columns[7] || 'Aktif'), // [WA] Status geser ke index 7
        });
      }
      if (importedData.length === 0) { alert('Tidak ada data valid dalam file CSV.'); return; }
      const result = await importSiswaAction(importedData);
      if (result.error) { setImportMsg({ type: 'error', text: `Import gagal: ${result.error}` }); }
      else { setImportMsg({ type: 'success', text: `Berhasil import ${importedData.length} data siswa!` }); fetchSiswa(); }
      setTimeout(() => setImportMsg(null), 5000);
    };
    reader.readAsText(file); e.target.value = '';
  };

  // [WA] Tambah kolom parent_whatsapp di cetak
  const handleCetak = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = filteredSiswa.map((s, idx) => `<tr><td style="border:1px solid #ccc;padding:6px;text-align:center;">${idx+1}</td><td style="border:1px solid #ccc;padding:6px;">${s.nisn||''}</td><td style="border:1px solid #ccc;padding:6px;">${s.nama||''}</td><td style="border:1px solid #ccc;padding:6px;text-align:center;">${s.jenis_kelamin||''}</td><td style="border:1px solid #ccc;padding:6px;text-align:center;">${s.kelas||''}</td><td style="border:1px solid #ccc;padding:6px;text-align:center;">${s.jurusan||''}</td><td style="border:1px solid #ccc;padding:6px;text-align:center;">${s.parent_whatsapp||'-'}</td><td style="border:1px solid #ccc;padding:6px;text-align:center;">${s.status||''}</td></tr>`).join('');
    printWindow.document.write(`<html><head><title>Cetak Data Siswa - SIPANDU</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{text-align:center;margin-bottom:5px}p.subtitle{text-align:center;color:#666;margin-bottom:20px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px}th{background-color:#e5e7eb;border:1px solid #ccc;padding:8px;font-weight:bold;text-align:center}@media print{body{padding:0}}</style></head><body><h2>DATA SISWA</h2><p class="subtitle">SIPANDU - Dicetak pada ${new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p><table><thead><tr><th>No</th><th>NISN</th><th>Nama Siswa</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>No WA Ortu</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table><p style="margin-top:20px;font-size:11px;color:#999">Total: ${filteredSiswa.length} siswa</p></body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
  };

  const blackText = { color: '#1f2937' };
  const inputClass = "w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen font-poppins">
      {toast && (<div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}</div>)}
      {importMsg && (<div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${importMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{importMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>} {importMsg.text}</div>)}

      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border w-fit">
        <button onClick={() => setActiveTab('data-siswa')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'data-siswa' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={16} className="inline mr-2" />Data Siswa</button>
      </div>

      {activeTab === 'data-siswa' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[{ label: 'Total Siswa', value: stats.total, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },{ label: 'Total Kelas', value: stats.kelas, icon: School, color: 'bg-indigo-500', bg: 'bg-indigo-50' },{ label: 'Total Jurusan', value: stats.jurusan, icon: Award, color: 'bg-purple-500', bg: 'bg-purple-50' },{ label: 'Siswa Aktif', value: stats.aktif, icon: UserCheck, color: 'bg-green-500', bg: 'bg-green-50' },{ label: 'Non Aktif', value: stats.nonAktif, icon: UserX, color: 'bg-red-500', bg: 'bg-red-50' }].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}><div className="flex items-center justify-between mb-3"><div className={`${stat.color} p-2 rounded-lg text-white`}><stat.icon size={20}/></div></div><p className="text-3xl font-bold text-gray-800">{stat.value}</p><p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p></div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Plus size={16}/> Tambah Siswa</button>
            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Upload size={16}/> Import CSV</button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-600 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Download size={16}/> Export CSV</button>
            <button onClick={handleCetak} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Printer size={16}/> Cetak Data</button>
            <button onClick={() => { setShowDeleteAllModal(true); setDeleteConfirmText('') }} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Trash2 size={16}/> Hapus Semua Data</button>
            <div className="w-px h-8 bg-gray-300 mx-1 hidden md:block"></div>
            <button onClick={() => openPromoteModal('naik-xi')} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><ArrowUpCircle size={16}/> X → XI</button>
            <button onClick={() => openPromoteModal('naik-xii')} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg hover:bg-cyan-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><ArrowUpCircle size={16}/> XI → XII</button>
            <button onClick={() => openPromoteModal('lulus')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><GraduationCap size={16}/> Kelulusan XII</button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" placeholder="Cari Nama / NISN / No WA..." style={blackText} className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}><option value="">Semua Kelas</option>{tingkatList.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}><option value="">Semua Jurusan</option>{kelasGroupList.map(k => <option key={k} value={k}>{k}</option>)}</select>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="">Semua Status</option><option value="Aktif">Aktif</option><option value="Non Aktif">Non Aktif</option><option value="Lulus">Lulus</option><option value="Pindah">Pindah</option></select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-300 border-b border-gray-400">
                  <tr>
                    <th className="py-3 px-4 font-bold text-gray-800">No</th>
                    <th className="py-3 px-4 font-bold text-gray-800">NISN</th>
                    <th className="py-3 px-4 font-bold text-gray-800">Nama Siswa</th>
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">L/P</th>
                    <th className="py-3 px-4 font-bold text-gray-800">Kelas</th>
                    <th className="py-3 px-4 font-bold text-gray-800">Jurusan</th>
                    {/* [WA] Kolom baru No WA Ortu */}
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">No WA Ortu</th>
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSiswa.map((s, idx) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="py-3 px-4 font-medium font-mono text-xs" style={blackText}>{s.nisn || '—'}</td>
                      <td className="py-3 px-4 font-medium" style={blackText}>{s.nama}</td>
                      <td className="py-3 px-4 text-center"><span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${s.jenis_kelamin === 'P' ? 'bg-pink-100' : 'bg-blue-100'}`} style={blackText}>{s.jenis_kelamin || 'L'}</span></td>
                      <td className="py-3 px-4 font-semibold" style={blackText}>{s.kelas}</td>
                      <td className="py-3 px-4 font-semibold" style={blackText}>{s.jurusan}</td>
                      {/* [WA] Kolom baru No WA Ortu */}
                      <td className="py-3 px-4 text-center">
                        {s.parent_whatsapp ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-200">
                            📱 {s.parent_whatsapp}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                      <td className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openEditModal(s)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"><Edit3 size={15}/></button><button onClick={() => { setShowDeleteModal({ id: s.id, nama: s.nama, nisn: s.nisn }); setDeleteConfirmText('') }} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={15}/></button></div></td>
                    </tr>
                  ))}
                  {paginatedSiswa.length === 0 && (<tr><td colSpan="9" className="text-center py-10 text-gray-400">Data siswa tidak ditemukan</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages || 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronRight size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT SISWA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center p-5 border-b"><h3 className="text-lg font-bold text-gray-800">{editMode ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button></div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">NISN</label><input type="text" name="nis" value={formData.nis} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Nomor Induk Siswa Nasional"/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Nama Lengkap</label><input type="text" name="nama" value={formData.nama} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Nama Lengkap Siswa"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Jenis Kelamin</label><select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} style={blackText} className={inputClass}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Status</label><select name="status" value={formData.status} onChange={handleInputChange} style={blackText} className={inputClass}><option value="Aktif">Aktif</option><option value="Non Aktif">Non Aktif</option><option value="Lulus">Lulus</option><option value="Pindah">Pindah</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Kelas</label><select name="kelas" value={formData.kelas?.split(' ')[0] || ''} onChange={(e) => { const tingkat = e.target.value; const jurusan = formData.jurusan || ''; setFormData({ ...formData, kelas: jurusan ? `${tingkat} ${jurusan}` : tingkat }); }} style={blackText} className={inputClass}><option value="">Pilih Kelas</option>{tingkatList.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Jurusan</label><select name="jurusan" value={formData.jurusan} onChange={(e) => { const jurusan = e.target.value; const tingkat = formData.kelas?.split(' ')[0] || ''; setFormData({ ...formData, jurusan: jurusan, kelas: tingkat && jurusan ? `${tingkat} ${jurusan}` : tingkat }); }} style={blackText} className={inputClass}><option value="">Pilih Jurusan</option>{kelasGroupList.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
              </div>
              {/* [WA] Field baru No WA Orang Tua */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">No. WA Orang Tua <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input type="text" name="parent_whatsapp" value={formData.parent_whatsapp} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx" />
                <p className="text-[10px] text-gray-400 mt-1">Format: 08xxx atau 628xxx (10-15 digit). Digunakan untuk notifikasi WhatsApp otomatis.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"><Save size={16}/> Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KENAIKAN KELAS & KELULUSAN (tetap sama, tidak berubah) */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn">
            <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {promoteAction === 'lulus' ? <GraduationCap className="text-purple-600"/> : <ArrowUpCircle className="text-teal-600"/>}
                  {promoteAction === 'naik-xi' ? 'Kenaikan Kelas X → XI' : promoteAction === 'naik-xii' ? 'Kenaikan Kelas XI → XII' : 'Kelulusan Kelas XII'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Tahun Ajaran: {academicYear || '-'}</p>
              </div>
              <button onClick={() => setIsPromoteModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            {promoteStep === 1 && (
              <div className="p-6 space-y-4 animate-fadeIn">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-700"><p className="font-bold mb-1">ℹ️ Informasi:</p><p>Pastikan proses ini dilakukan di <strong>akhir tahun ajaran</strong>. Semua siswa pada kelas terkait akan terpengaruh.</p></div>
                <div><label className="text-sm font-semibold text-gray-600 block mb-2">Tahun Ajaran Baru</label><input type="text" placeholder="Contoh: 2026/2027" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{color:'#1f2937'}} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
              </div>
            )}
            {promoteStep === 2 && (
              <div className="flex-1 overflow-hidden flex flex-col animate-fadeIn">
                <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between flex-shrink-0">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">{selectedIds.length}</span> dari {getTargetStudents().length} siswa dipilih</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIds(getTargetStudents().map(s => s.id))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-blue-100">Pilih Semua</button>
                    <button onClick={() => setSelectedIds([])} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-md font-semibold hover:bg-red-100">Batal Pilih</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {getTargetStudents().map(s => {
                      const isSelected = selectedIds.includes(s.id); const newKelas = promoteAction !== 'lulus' ? getNewKelas(s.kelas, promoteAction) : 'LULUS';
                      return (
                        <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleStudentSelection(s.id)} className="w-4 h-4 rounded text-blue-600"/>
                          <div className="flex-1 min-w-0"><p className="font-medium text-sm text-gray-800 truncate">{s.nama}</p><p className="text-xs text-gray-400">{s.nisn || '—'} • {s.kelas}</p></div>
                          <div className="text-xs font-semibold text-right flex-shrink-0"><span className="text-gray-400">{s.kelas}</span><span className="mx-1.5 text-gray-300">→</span><span className={promoteAction === 'lulus' ? 'text-purple-600' : 'text-teal-600'}>{newKelas}</span></div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {promoteStep === 3 && (
              <div className="p-6 space-y-4 animate-fadeIn">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700"><p className="font-bold mb-1">⚠️ Peringatan!</p><p>Tindakan ini <strong>TIDAK dapat dibatalkan</strong>. Pastikan data siswa yang dipilih sudah benar.</p></div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Aksi:</span></div><div className="font-bold text-right">{promoteAction === 'naik-xi' ? 'X → XI' : promoteAction === 'naik-xii' ? 'XI → XII' : 'Kelulusan XII'}</div>
                    <div><span className="text-gray-500">Tahun Ajaran:</span></div><div className="font-bold text-right">{academicYear}</div>
                    <div><span className="text-gray-500">Jumlah Siswa:</span></div><div className="font-bold text-right">{selectedIds.length} siswa</div>
                  </div>
                </div>
                {promoteAction === 'lulus' && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <p className="text-sm text-purple-700 mb-3 font-semibold">📥 Data siswa lulusan akan dihapus dari sistem. Download arsip terlebih dahulu!</p>
                    <button onClick={handleDownloadArchive} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all"><Download size={16}/> Download Arsip CSV</button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between p-5 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-2">{promoteStep > 1 && <button onClick={() => setPromoteStep(promoteStep - 1)} className="px-5 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">← Kembali</button>}</div>
              {promoteStep < 3 ? (
                <button onClick={handlePromoteNext} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">Lanjut →</button>
              ) : (
                <button onClick={handleProcessPromote} disabled={promoteLoading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">{promoteLoading ? '⏳ Memproses...' : <><AlertTriangle size={16}/> Proses Sekarang</>}</button>
              )}
            </div>
          </div>
        </div>
      )}

            {/* ═══ MODAL HAPUS SATU SISWA ═══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => { setShowDeleteModal(null); setDeleteConfirmText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shrink-0"><Trash2 size={24} className="text-red-500" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Hapus Data Siswa</h3>
                  <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                <p className="text-sm font-bold text-gray-800">{showDeleteModal.nama}</p>
                <p className="text-xs text-gray-500 mt-0.5">NISN: {showDeleteModal.nisn || '—'}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ketik <span className="text-red-600 font-bold">HAPUS</span> untuk konfirmasi</label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="HAPUS"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-800 text-sm text-center font-bold tracking-widest" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(null); setDeleteConfirmText('') }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleDelete} disabled={deleteConfirmText !== 'HAPUS' || deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleting ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16}/> Hapus</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL HAPUS SEMUA DATA ═══ */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => { setShowDeleteAllModal(false); setDeleteConfirmText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shrink-0"><ShieldAlert size={24} className="text-red-500" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Hapus Semua Data Siswa</h3>
                  <p className="text-sm text-gray-500">Menghapus {siswa.length} data siswa secara permanen</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4 space-y-2">
                <p className="text-sm text-red-700 font-semibold">⚠️ Data yang akan dihapus:</p>
                <ul className="text-xs text-red-600 list-disc pl-4 space-y-0.5">
                  <li>Semua data siswa ({siswa.length} data)</li>
                  <li>Data absensi terkait siswa</li>
                  <li>Data pelanggaran dan reward siswa</li>
                  <li>Data formulir yang terhubung</li>
                  <li>Tindakan ini <strong>TIDAK dapat dibatalkan</strong></li>
                </ul>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ketik <span className="text-red-600 font-bold tracking-wider">HAPUS SEMUA</span> untuk konfirmasi</label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="HAPUS SEMUA"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-800 text-sm text-center font-bold tracking-widest" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteAllModal(false); setDeleteConfirmText('') }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleDeleteAll} disabled={deleteConfirmText !== 'HAPUS SEMUA' || deletingAll}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {deletingAll ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16}/> Hapus Semua</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.3s ease-out; } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scaleIn { animation: scaleIn 0.2s ease-out; }`}</style>
    </div>
  )
}