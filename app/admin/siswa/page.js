"use client";

import React, { useState, useEffect, useRef } from 'react';
import { fetchSiswaAction, saveSiswaAction, deleteSiswaAction, deleteAllSiswaAction, importSiswaAction, promoteStudentsAction, graduateAndDeleteAction } from '@/app/actions/siswaActions';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Users, School, Award, UserCheck, UserX, Plus, Download, Upload, Printer,
  QrCode, Search, Filter, Edit3, Trash2, X, CheckCircle, AlertTriangle,
  MapPin, Clock, Shield, RefreshCw, Eye, EyeOff, Settings, Save, ChevronLeft, ChevronRight,
  GraduationCap, ArrowUpCircle
} from 'lucide-react';

// ============================================
// DATA MOCKUP
// ============================================
const kelasList = [
  'X TKRO 1', 'X TKRO 2', 'X RPL 1', 'X RPL 2', 'X DKV 1', 'X PH 1',
  'XI TKRO 1', 'XI TKRO 2', 'XI RPL 1', 'XI DKV 1', 'XI PH 1',
  'XII TKRO 1', 'XII RPL 1', 'XII DKV 1', 'XII PH 1'
];

const jurusanList = ['TKRO', 'RPL', 'DKV', 'PH'];

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
  const [formData, setFormData] = useState({ nis: '', nama: '', kelas: '', jurusan: '', status: 'Aktif', jenis_kelamin: 'L' });
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

  // ===== QR ABSENSI STATE =====
    const [qrSettings, setQrSettings] = useState({ lat: '-6.3717', lng: '108.2591', radius: '100', jamMasuk: '06:00', jamTerlambat: '07:15', jamTutup: '08:00' });
  const [activeQR, setActiveQR] = useState({});
  const [absensiStats, setAbsensiStats] = useState({ hadir: 0, terlambat: 0, belumHadir: 0, totalScan: 0 });

  // ============================================
  // FETCH DATA SISWA
  // ============================================
  useEffect(() => {
    fetchSiswa();
  }, []);

    const fetchSiswa = async () => {
    setLoading(true);
    const result = await fetchSiswaAction();
    if (result.data) setSiswa(result.data);
    if (result.error) console.error('Fetch error:', result.error);
    setLoading(false);
  };

  // ============================================
  // STATISTIK
  // ============================================
  const stats = {
    total: siswa.length,
    kelas: [...new Set(siswa.map(s => s.kelas))].length,
    jurusan: [...new Set(siswa.map(s => s.jurusan))].length,
    aktif: siswa.filter(s => s.status === 'Aktif').length,
    nonAktif: siswa.filter(s => s.status !== 'Aktif').length,
  };

  // ============================================
  // FILTER & PENCARIAN
  // ============================================
    const filteredSiswa = siswa.filter(s => {
    const matchSearch = s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis?.includes(searchTerm);
    
    // Filter Tingkat (X, XI, XII)
    const matchTingkat = !filterKelas || 
      s.kelas === filterKelas || 
      (s.kelas && s.kelas.startsWith(filterKelas + ' '));
    
    // Filter Jurusan — Gunakan logika ekstraksi yang SAMA PERSIS dengan dropdown
    // Ini menjamin nilai yang dibandingkan selalu konsisten
    const kelasParts = (s.kelas || '').trim().split(/\s+/);
    const studentKelasGroup = kelasParts.length > 1 
      ? kelasParts.slice(1).join(' ')   // "X RPL 1" → "RPL 1"
      : (s.jurusan || '');               // "X" → fallback ke jurusan
    
    const matchKelasGroup = !filterJurusan || studentKelasGroup === filterJurusan;
    
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchTingkat && matchKelasGroup && matchStatus;
  });

    const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);
  const paginatedSiswa = filteredSiswa.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Dropdown dinamis: Tingkat (X, XI, XII) dan Kelas Group (TKRO 1, RPL 1, dst)
    const tingkatList = [...new Set(siswa.map(s => {
    const kelas = (s.kelas || '').trim();
    const firstWord = kelas.split(/\s+/)[0];
    if (['X', 'XI', 'XII'].includes(firstWord)) return firstWord;
    return firstWord;
  }))].filter(Boolean).sort();

  const kelasGroupList = [...new Set(siswa.map(s => {
    const kelas = (s.kelas || '').trim();
    const parts = kelas.split(/\s+/);
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return s.jurusan || '';
  }))].filter(Boolean).sort();

    // Daftar kelas dinamis dari data siswa yang sudah diimport
  // Gabungkan kelas + jurusan jika kelas hanya berisi "X", "XI", "XII"
  const dynamicKelasList = [...new Set(siswa.map(s => {
    const k = (s.kelas || '').trim();
    const j = (s.jurusan || '').trim();
    
    // Jika kelas sudah lengkap (misal "X TKRO 1"), langsung pakai
    if (!['X', 'XI', 'XII'].includes(k)) {
      return k;
    }
    
    // Jika kelas hanya "X" dan ada jurusan, gabungkan
    if (j) {
      return `${k} ${j}`;
    }
    
    // Fallback jika tidak ada jurusan
    return k;
  }).filter(Boolean))].sort((a, b) => {
    // Urutkan: X dulu, lalu XI, lalu XII
    const order = { 'X': 1, 'XI': 2, 'XII': 3 };
    const aTingkat = order[a.split(' ')[0]] || 99;
    const bTingkat = order[b.split(' ')[0]] || 99;
    if (aTingkat !== bTingkat) return aTingkat - bTingkat;
    return a.localeCompare(b);
  });

  // Hitung statistik absensi dinamis
  useEffect(() => {
    const totalSiswaAktif = siswa.filter(s => s.status === 'Aktif').length;
    const qrAktifCount = dynamicKelasList.filter(k => activeQR[k]?.active).length;
    
    setAbsensiStats({
      hadir: 0,
      terlambat: 0,
      belumHadir: totalSiswaAktif,
      totalScan: 0,
      qrAktif: qrAktifCount,
    });
  }, [siswa, activeQR, dynamicKelasList.length]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setFormData({ nis: '', nama: '', kelas: '', jurusan: '', status: 'Aktif', jenis_kelamin: 'L' });
    setEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setFormData(s);
    setEditMode(true);
    setIsModalOpen(true);
  };

    const handleSave = async () => {
    if (!formData.nis || !formData.nama || !formData.kelas || !formData.jurusan) {
      alert('Semua field wajib diisi!');
      return;
    }

    try {
      const result = await saveSiswaAction(formData, editMode);
      if (result.error) {
        alert('Gagal simpan: ' + result.error);
        return;
      }
      setIsModalOpen(false);
      fetchSiswa();
    } catch (error) {
      console.error('Save error:', error);
      alert('Terjadi kesalahan saat menyimpan data. Coba lagi.');
    }
  };

      const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus siswa ini?')) {
      try {
        const result = await deleteSiswaAction(id);
        if (result.error) {
          alert('Gagal hapus: ' + result.error);
          return;
        }
        setCurrentPage(1);
        fetchSiswa();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Terjadi kesalahan saat menghapus data.');
      }
    }
  };

    const handleDeleteAll = async () => {
    if (confirm('⚠️ PERINGATAN!\n\nSemua data siswa akan dihapus secara permanen.\nTindakan ini TIDAK dapat dibatalkan!\n\nYakin ingin melanjutkan?')) {
      if (confirm('KONFIRMASI TERAKHIR\n\nAnda benar-benar yakin ingin menghapus SEMUA data siswa?')) {
        const result = await deleteAllSiswaAction();
        if (result.error) {
          alert('Gagal menghapus semua data: ' + result.error);
        } else {
          fetchSiswa();
        }
      }
    }
  };

    // ============================================
  // KENAIKAN KELAS & KELULUSAN
  // ============================================
  const getTargetStudents = () => {
    if (promoteAction === 'naik-xi') return siswa.filter(s => s.kelas?.startsWith('X ') || s.kelas === 'X');
    if (promoteAction === 'naik-xii') return siswa.filter(s => s.kelas?.startsWith('XI ') || s.kelas === 'XI');
    if (promoteAction === 'lulus') return siswa.filter(s => s.kelas?.startsWith('XII ') || s.kelas === 'XII');
    return [];
  };

  const getNewKelas = (oldKelas, action) => {
    if (!oldKelas) return oldKelas;
    const parts = oldKelas.split(' ');
    if (action === 'naik-xi') parts[0] = 'XI';
    if (action === 'naik-xii') parts[0] = 'XII';
    return parts.join(' ');
  };

  const openPromoteModal = (action) => {
    setPromoteAction(action);
    setPromoteStep(1);
    setAcademicYear('');
    setSelectedIds([]);
    setIsPromoteModalOpen(true);
  };

  const handlePromoteNext = () => {
    if (promoteStep === 1 && !academicYear) {
      alert('Masukkan tahun ajaran terlebih dahulu!');
      return;
    }
    if (promoteStep === 1) {
      // Auto-select all target students
      const targets = getTargetStudents();
      setSelectedIds(targets.map(s => s.id));
      setPromoteStep(2);
    } else if (promoteStep === 2) {
      setPromoteStep(3);
    }
  };

  const toggleStudentSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadArchive = () => {
    const archiveStudents = siswa.filter(s => selectedIds.includes(s.id));
    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'Status'];
    const rows = archiveStudents.map((s, idx) => [
      idx + 1, s.nis || '', s.nama || '', s.jenis_kelamin || '', s.kelas || '', s.jurusan || '', s.status || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Arsip_Lulusan_${academicYear.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessPromote = async () => {
    setPromoteLoading(true);
    try {
      if (promoteAction === 'lulus') {
        const result = await graduateAndDeleteAction(selectedIds);
        if (result.error) { alert('Gagal: ' + result.error); return; }
      } else {
        const updates = siswa
          .filter(s => selectedIds.includes(s.id))
          .map(s => ({ id: s.id, kelas: getNewKelas(s.kelas, promoteAction) }));
        const result = await promoteStudentsAction(updates);
        if (result.error) { alert('Gagal: ' + result.error); return; }
      }
      setIsPromoteModalOpen(false);
      fetchSiswa();
    } finally {
      setPromoteLoading(false);
    }
  };

  // ============================================
  // EXPORT CSV
  // ============================================
  const handleExportCSV = () => {
    if (filteredSiswa.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'Status'];
    const rows = filteredSiswa.map((s, idx) => [
      idx + 1,
      s.nis || '',
      s.nama || '',
      s.jenis_kelamin || '',
      s.kelas || '',
      s.jurusan || '',
      s.status || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Siswa_SIPANDU_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // IMPORT CSV
  // ============================================
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('File harus berformat CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');

      if (lines.length < 2) {
        alert('File CSV kosong atau tidak valid.');
        return;
      }

      // Skip header (baris pertama)
      const dataRows = lines.slice(1);
      const importedData = [];

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
          status: cleanValue(columns[6] || 'Aktif'),
        });
      }

      if (importedData.length === 0) {
        alert('Tidak ada data valid dalam file CSV.');
        return;
      }

            const result = await importSiswaAction(importedData);

      if (result.error) {
        setImportMsg({ type: 'error', text: `Import gagal: ${result.error}` });
      } else {
        setImportMsg({ type: 'success', text: `Berhasil import ${importedData.length} data siswa!` });
        fetchSiswa();
      }

      setTimeout(() => setImportMsg(null), 5000);
    };

    reader.readAsText(file);
    // Reset input agar bisa pilih file yang sama lagi
    e.target.value = '';
  };

  // ============================================
  // CETAK DATA
  // ============================================
  const handleCetak = () => {
    const printWindow = window.open('', '_blank');
    
    const tableRows = filteredSiswa.map((s, idx) => `
      <tr>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #ccc; padding:6px;">${s.nis || ''}</td>
        <td style="border:1px solid #ccc; padding:6px;">${s.nama || ''}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${s.jenis_kelamin || ''}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${s.kelas || ''}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${s.jurusan || ''}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">${s.status || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Data Siswa - SIPANDU</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 5px; }
            p.subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #e5e7eb; border: 1px solid #ccc; padding: 8px; font-weight: bold; text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>DATA SISWA</h2>
          <p class="subtitle">SIPANDU - Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>L/P</th>
                <th>Kelas</th>
                <th>Jurusan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p style="margin-top:20px; font-size:11px; color:#999;">Total: ${filteredSiswa.length} siswa</p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ============================================
  // QR CODE FUNCTIONS
  // ============================================
  const generateQRData = (kelas) => {
    const payload = {
      kelas_id: kelas.replace(/\s+/g, '-'),
      token: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      signature: btoa(`SIPANDU-${kelas}-${Date.now()}`)
    };
    return JSON.stringify(payload);
  };

  const handleGenerateQR = (kelas) => {
    setActiveQR(prev => ({ ...prev, [kelas]: { data: generateQRData(kelas), active: true } }));
  };

  const handleToggleQR = (kelas) => {
    setActiveQR(prev => ({ ...prev, [kelas]: { ...prev[kelas], active: !prev[kelas].active } }));
  };

  const downloadQR = (kelas, format) => {
    const canvas = document.getElementById(`qr-canvas-${kelas}`);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QR-${kelas}.png`;
    link.href = dataUrl;
    link.click();
  };

  // ============================================
  // STYLE HELPER (Teks hitam pasti)
  // ============================================
  const blackText = { color: '#1f2937' };
  const inputClass = "w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen font-poppins">
      
      {/* Import Message */}
      {importMsg && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${importMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {importMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          {importMsg.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border w-fit">
        <button onClick={() => setActiveTab('data-siswa')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'data-siswa' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Users size={16} className="inline mr-2" />Data Siswa
        </button>
        <button onClick={() => setActiveTab('qr-absensi')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'qr-absensi' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
          <QrCode size={16} className="inline mr-2" />QR Absensi
        </button>
      </div>

      {/* ============================================
          TAB 1: MANAJEMEN DATA SISWA
      ============================================ */}
      {activeTab === 'data-siswa' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Statistik Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Siswa', value: stats.total, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
              { label: 'Total Kelas', value: stats.kelas, icon: School, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Total Jurusan', value: stats.jurusan, icon: Award, color: 'bg-purple-500', bg: 'bg-purple-50' },
              { label: 'Siswa Aktif', value: stats.aktif, icon: UserCheck, color: 'bg-green-500', bg: 'bg-green-50' },
              { label: 'Non Aktif', value: stats.nonAktif, icon: UserX, color: 'bg-red-500', bg: 'bg-red-50' },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.color} p-2 rounded-lg text-white`}><stat.icon size={20}/></div>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Aksi Cepat */}
          <div className="flex flex-wrap gap-3">
            <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Plus size={16}/> Tambah Siswa</button>
            
            {/* Hidden File Input untuk Import */}
            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Upload size={16}/> Import CSV</button>
            
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-600 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Download size={16}/> Export CSV</button>
                        <button onClick={handleCetak} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Printer size={16}/> Cetak Data</button>
            <button onClick={handleDeleteAll} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Trash2 size={16}/> Hapus Semua Data</button>
            <button onClick={() => setActiveTab('qr-absensi')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><QrCode size={16}/> Kelola QR Absensi</button>
            <div className="w-px h-8 bg-gray-300 mx-1 hidden md:block"></div>
            <button onClick={() => openPromoteModal('naik-xi')} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><ArrowUpCircle size={16}/> X → XI</button>
            <button onClick={() => openPromoteModal('naik-xii')} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2.5 rounded-lg hover:bg-cyan-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><ArrowUpCircle size={16}/> XI → XII</button>
            <button onClick={() => openPromoteModal('lulus')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 active:scale-95 transition-all text-sm font-semibold shadow-sm"><GraduationCap size={16}/> Kelulusan XII</button>
          </div>

          {/* Filter & Pencarian */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input type="text" placeholder="Cari Nama / NISN..." style={blackText} className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {tingkatList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}>
                <option value="">Semua Jurusan</option>
                {kelasGroupList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select style={blackText} className="border rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non Aktif">Non Aktif</option>
                <option value="Lulus">Lulus</option>
                <option value="Pindah">Pindah</option>
              </select>
            </div>
          </div>

          {/* Tabel Data Siswa */}
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
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-gray-800 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSiswa.map((s, idx) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="py-3 px-4 font-medium" style={blackText}>{s.nis}</td>
                      <td className="py-3 px-4 font-medium" style={blackText}>{s.nama}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${s.jenis_kelamin === 'P' ? 'bg-pink-100' : 'bg-blue-100'}`} style={blackText}>
                          {s.jenis_kelamin || 'L'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold" style={blackText}>{s.kelas}</td>
                      <td className="py-3 px-4 font-semibold" style={blackText}>{s.jurusan}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(s)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"><Edit3 size={15}/></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedSiswa.length === 0 && (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-400">Data siswa tidak ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
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

      {/* ============================================
          TAB 2: QR ABSENSI DASHBOARD
      ============================================ */}
      {activeTab === 'qr-absensi' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Stats Absensi */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Hadir Hari Ini', value: absensiStats.hadir, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Terlambat', value: absensiStats.terlambat, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Belum Hadir', value: absensiStats.belumHadir, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'QR Aktif', value: absensiStats.qrAktif || 0, icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Scan', value: absensiStats.totalScan, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} p-5 rounded-xl border border-gray-100 shadow-sm`}>
                <stat.icon className={`${stat.color} mb-2`} size={24}/>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Pengaturan Validasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="text-red-500" size={20}/> Validasi GPS Sekolah</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-gray-500">Latitude</label><input type="text" value={qrSettings.lat} onChange={(e) => setQrSettings({...qrSettings, lat: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-semibold text-gray-500">Longitude</label><input type="text" value={qrSettings.lng} onChange={(e) => setQrSettings({...qrSettings, lng: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500">Radius Maksimal (Meter)</label><input type="number" value={qrSettings.radius} onChange={(e) => setQrSettings({...qrSettings, radius: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="text-blue-500" size={20}/> Validasi Waktu</h3>
              <div className="space-y-4">
                <div><label className="text-xs font-semibold text-gray-500">Jam Masuk</label><input type="time" value={qrSettings.jamMasuk} onChange={(e) => setQrSettings({...qrSettings, jamMasuk: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
                <div><label className="text-xs font-semibold text-gray-500">Batas Terlambat</label><input type="time" value={qrSettings.jamTerlambat} onChange={(e) => setQrSettings({...qrSettings, jamTerlambat: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
                <div><label className="text-xs font-semibold text-gray-500">Jam Tutup Absensi</label><input type="time" value={qrSettings.jamTutup} onChange={(e) => setQrSettings({...qrSettings, jamTutup: e.target.value})} style={blackText} className="w-full mt-1 p-2 border rounded-lg text-sm"/></div>
              </div>
            </div>
          </div>

          {/* Daftar QR Code */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Daftar QR Code Kelas <span className="text-sm font-normal text-gray-400">({dynamicKelasList.length} kelas)</span></h3>
              {dynamicKelasList.length > 0 && (
                <button onClick={() => dynamicKelasList.forEach(k => handleGenerateQR(k))} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"><RefreshCw size={16}/> Generate Semua</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dynamicKelasList.length > 0 ? dynamicKelasList.map(kelas => (
                <div key={kelas} className="border rounded-xl p-4 bg-gray-50 hover:shadow-md transition-shadow flex flex-col items-center">
                  <h4 className="font-bold text-gray-800 mb-3">{kelas}</h4>
                  {activeQR[kelas]?.data ? (
                    <div className="bg-white p-2 rounded-lg shadow-inner mb-3 relative">
                      <QRCodeCanvas id={`qr-canvas-${kelas}`} value={activeQR[kelas].data} size={120} level="H" />
                      {!activeQR[kelas].active && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center rounded-lg"><span className="text-white font-bold text-xs">NONAKTIF</span></div>}
                    </div>
                  ) : (
                    <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg mb-3 flex items-center justify-center border-2 border-dashed border-gray-300"><QrCode size={40} className="text-gray-300"/></div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mt-auto">
                    {!activeQR[kelas]?.data ? (
                      <button onClick={() => handleGenerateQR(kelas)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700"><Plus size={12}/> Generate</button>
                    ) : (
                      <>
                        <button onClick={() => downloadQR(kelas, 'png')} className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100" title="Download PNG"><Download size={14}/></button>
                        <button onClick={() => handleToggleQR(kelas)} className={`p-1.5 rounded-md ${activeQR[kelas].active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={activeQR[kelas].active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {activeQR[kelas].active ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                        <button onClick={() => handleGenerateQR(kelas)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100" title="Regenerate"><RefreshCw size={14}/></button>
                      </>
                    )}
                  </div>
                </div>
                            )) : (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <QrCode size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Belum ada data kelas. Import data siswa terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL TAMBAH/EDIT SISWA
      ============================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">{editMode ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">NISN</label>
                <input type="text" name="nis" value={formData.nis} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Nomor Induk Siswa Nasional"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nama Lengkap</label>
                <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Nama Lengkap Siswa"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} style={blackText} className={inputClass}>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={blackText} className={inputClass}>
                    <option value="Aktif">Aktif</option>
                    <option value="Non Aktif">Non Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Pindah">Pindah</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Kelas</label>
                    <select name="kelas" value={formData.kelas?.split(' ')[0] || ''} onChange={(e) => {
                    const tingkat = e.target.value;
                    const jurusan = formData.jurusan || '';
                    setFormData({ ...formData, kelas: jurusan ? `${tingkat} ${jurusan}` : tingkat });
                  }} style={blackText} className={inputClass}>
                    <option value="">Pilih Kelas</option>
                    {tingkatList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Jurusan</label>
                    <select name="jurusan" value={formData.jurusan} onChange={(e) => {
                    const jurusan = e.target.value;
                    const tingkat = formData.kelas?.split(' ')[0] || '';
                    setFormData({ ...formData, jurusan: jurusan, kelas: tingkat && jurusan ? `${tingkat} ${jurusan}` : tingkat });
                  }} style={blackText} className={inputClass}>
                    <option value="">Pilih Jurusan</option>
                    {kelasGroupList.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"><Save size={16}/> Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL KENAIKAN KELAS & KELULUSAN
      ============================================ */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn">
            
            {/* Header */}
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

            {/* Step 1: Tahun Ajaran */}
            {promoteStep === 1 && (
              <div className="p-6 space-y-4 animate-fadeIn">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-700">
                  <p className="font-bold mb-1">ℹ️ Informasi:</p>
                  <p>Pastikan proses ini dilakukan di <strong>akhir tahun ajaran</strong>. Semua siswa pada kelas terkait akan terpengaruh.</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-2">Tahun Ajaran Baru</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 2026/2027" 
                    value={academicYear} 
                    onChange={(e) => setAcademicYear(e.target.value)}
                    style={{color: '#1f2937'}}
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Pilih Siswa (Checklist) */}
            {promoteStep === 2 && (
              <div className="flex-1 overflow-hidden flex flex-col animate-fadeIn">
                <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between flex-shrink-0">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800">{selectedIds.length}</span> dari {getTargetStudents().length} siswa dipilih
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIds(getTargetStudents().map(s => s.id))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-blue-100">Pilih Semua</button>
                    <button onClick={() => setSelectedIds([])} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-md font-semibold hover:bg-red-100">Batal Pilih</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {getTargetStudents().map(s => {
                      const isSelected = selectedIds.includes(s.id);
                      const newKelas = promoteAction !== 'lulus' ? getNewKelas(s.kelas, promoteAction) : 'LULUS';
                      return (
                        <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleStudentSelection(s.id)} className="w-4 h-4 rounded text-blue-600"/>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">{s.nama}</p>
                            <p className="text-xs text-gray-400">{s.nis} • {s.kelas}</p>
                          </div>
                          <div className="text-xs font-semibold text-right flex-shrink-0">
                            <span className="text-gray-400">{s.kelas}</span>
                            <span className="mx-1.5 text-gray-300">→</span>
                            <span className={promoteAction === 'lulus' ? 'text-purple-600' : 'text-teal-600'}>{newKelas}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Konfirmasi */}
            {promoteStep === 3 && (
              <div className="p-6 space-y-4 animate-fadeIn">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
                  <p className="font-bold mb-1">⚠️ Peringatan!</p>
                  <p>Tindakan ini <strong>TIDAK dapat dibatalkan</strong>. Pastikan data siswa yang dipilih sudah benar.</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Aksi:</span></div>
                    <div className="font-bold text-right">
                      {promoteAction === 'naik-xi' ? 'X → XI' : promoteAction === 'naik-xii' ? 'XI → XII' : 'Kelulusan XII'}
                    </div>
                    <div><span className="text-gray-500">Tahun Ajaran:</span></div>
                    <div className="font-bold text-right">{academicYear}</div>
                    <div><span className="text-gray-500">Jumlah Siswa:</span></div>
                    <div className="font-bold text-right">{selectedIds.length} siswa</div>
                  </div>
                </div>

                {/* Opsi Download Arsip untuk Kelulusan */}
                {promoteAction === 'lulus' && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <p className="text-sm text-purple-700 mb-3 font-semibold">📥 Data siswa lulusan akan dihapus dari sistem. Download arsip terlebih dahulu!</p>
                    <button onClick={handleDownloadArchive} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 active:scale-95 transition-all">
                      <Download size={16}/> Download Arsip Lulusan (CSV)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-between items-center p-5 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-2">
                {promoteStep > 1 && (
                  <button onClick={() => setPromoteStep(promoteStep - 1)} className="px-5 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Kembali</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsPromoteModalOpen(false)} className="px-5 py-2.5 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Batal</button>
                {promoteStep < 3 ? (
                  <button onClick={handlePromoteNext} disabled={promoteStep === 1 && !academicYear} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                    Lanjut <ChevronRight size={16}/>
                  </button>
                ) : (
                    <button onClick={handleProcessPromote} disabled={promoteLoading || selectedIds.length === 0} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                    {promoteLoading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Memproses...</>
                    ) : (
                      <>
                        {promoteAction === 'lulus' ? <GraduationCap size={16}/> : <ArrowUpCircle size={16}/>}
                        Ya, Proses {selectedIds.length} Siswa
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}