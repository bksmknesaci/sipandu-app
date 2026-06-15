"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Users, UserCog, UserCheck, BookOpen, Star, Plus, Download, Upload, Printer,
  Search, Edit3, Trash2, X, CheckCircle, AlertTriangle, Save, ChevronLeft, ChevronRight,
  Shield, GraduationCap, ClipboardList, CalendarDays, Camera, FileText, AlertCircle, User
} from 'lucide-react'
import {
  fetchUsersAction, saveUserAction, deleteUserAction, deleteAllUsersAction,
  uploadUserPhotoAction, importUsersCSV, getAvailableKelas
} from '@/app/actions/userActions'
import * as XLSX from 'xlsx'

const roleList = ['Administrator', 'Wali Kelas', 'Sekretaris Kelas', 'OSIS']
const tingkatList = ['X', 'XI', 'XII']
const jurusanList = [
  'TKRO 1', 'TKRO 2', 'TKRO 3', 'TKRO 4',
  'DKV 1', 'DKV 2', 'DKV 3', 'DKV 4',
  'RPL 1', 'RPL 2', 'RPL 3', 'RPL 4',
  'PH 1', 'PH 2', 'PH 3', 'PH 4',
  'KL 1', 'KL 2', 'KL 3', 'KL 4',
  'LPKKK 1', 'LPKKK 2', 'LPKKK 3', 'LPKKK 4',
]

const roleConfig = {
  'Administrator': { icon: Shield, color: '#8B5CF6', bg: '#F5F3FF', gradient: 'from-purple-500 to-purple-600' },
  'Wali Kelas': { icon: UserCheck, color: '#10B981', bg: '#D1FAE5', gradient: 'from-emerald-500 to-emerald-600' },
  'Sekretaris Kelas': { icon: ClipboardList, color: '#F97316', bg: '#FFF7ED', gradient: 'from-amber-500 to-amber-600' },
  'OSIS': { icon: Star, color: '#3B82F6', bg: '#EFF6FF', gradient: 'from-blue-500 to-blue-600' },
}

const parseKelas = (kelas) => {
  if (!kelas) return { tingkat: '', jurusan: '', nomor: '' }
  const parts = kelas.split(' ')
  return { tingkat: parts[0] || '', jurusan: parts[1] || '', nomor: parts[2] || '' }
}

function CountUp({ end, duration = 1200 }) {
  const [count, setCount] = useState(0)
  const prevEnd = useRef(0)
  useEffect(() => {
    if (end === prevEnd.current && end !== 0) return
    const startVal = prevEnd.current; const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startVal + (end - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate); prevEnd.current = end
  }, [end, duration])
  return <span>{count}</span>
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const config = { success: { bg: 'bg-emerald-500', icon: CheckCircle }, error: { bg: 'bg-red-500', icon: AlertCircle }, info: { bg: 'bg-blue-500', icon: User } }
  const c = config[type] || config.info; const Icon = c.icon
  return (
    <div className={`fixed top-6 right-6 z-[9999] ${c.bg} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown`}>
      <Icon size={16} /> {message}
    </div>
  )
}

// ============================
// IMPORT MODAL (EXCEL SAJA)
// ============================
function ImportModal({ isOpen, onClose, onImport }) {
  const [parsedData, setParsedData] = useState([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  useEffect(() => { if (isOpen) { setParsedData([]); setFileName(''); setError('') } }, [isOpen])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
        setParsedData(jsonData)
      } catch (err) {
        console.error(err)
        setError('Gagal membaca file. Pastikan format file Excel (.xlsx/.xls) benar.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const downloadExcelTemplate = () => {
    const headers = ['nama', 'username', 'email', 'password', 'role', 'kelas', 'jurusan', 'whatsapp', 'status'];
    const exampleData = ['Ahmad Fauzi', 'ahmad.fauzi', 'ahmad@sipandu.id', 'password123', 'Siswa', 'X TKRO 1', 'TKRO 1', '081234567890', 'Aktif'];

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleData]);
    ws['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import User');
    XLSX.writeFile(wb, 'Template_Import_User_SIPANDU.xlsx');
  }

  // ============================
  // FIX: Sanitasi data sebelum dikirim ke Server Action
  // ============================
  const handleSubmit = async () => {
    if (parsedData.length === 0) { setError('Tidak ada data untuk diimpor'); return }
    setImporting(true); setError('')
    
    // Bersihkan data dari prototype/method tersembunyi dari library XLSX
    // agar menjadi Plain Object murni yang bisa diterima Next.js Server Actions
    const cleanData = JSON.parse(JSON.stringify(parsedData));
    
    await onImport(cleanData)
    setImporting(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Upload size={20}/> Import Data User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <button type="button" onClick={downloadExcelTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition font-semibold text-sm">
            <Download size={16}/> Unduh Format Excel
          </button>
          <p className="text-xs text-gray-500 text-center">
            Isi data sesuai template, lalu simpan. Upload file <span className="font-bold">.xlsx atau .xls</span> di bawah ini.
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <FileText size={40} className="mx-auto text-gray-300 mb-3"/>
            <p className="text-sm font-semibold text-gray-700">Klik untuk memilih file Excel</p>
          </div>
          {fileName && parsedData.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle size={14}/> File berhasil dimuat ({parsedData.length} baris data dari <span className="font-bold truncate max-w-[150px] inline-block align-bottom">{fileName}</span>)
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle size={14}/> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
            <button onClick={handleSubmit} disabled={importing || parsedData.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {importing ? '⏳ Mengimport...' : <><Upload size={14}/> Import Sekarang</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================
// DELETE CONFIRM MODAL
// ============================
function DeleteConfirmModal({ isOpen, onClose, onConfirm, target, isAll = false }) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  useEffect(() => { if (isOpen) { setConfirmText(''); setDeleting(false) } }, [isOpen])
  if (!isOpen) return null
  const expectedText = isAll ? 'HAPUS SEMUA' : 'HAPUS'
  const canConfirm = confirmText === expectedText
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-red-500"/></div>
          <h3 className="text-xl font-bold text-gray-800">{isAll ? 'Hapus Semua Pengguna?' : 'Hapus Pengguna?'}</h3>
          <p className="text-sm text-gray-500 mt-2">
            {isAll ? 'Semua data pengguna akan dihapus secara permanen.' : <>"<span className="font-semibold text-gray-700">{target?.nama}</span>" akan dihapus secara permanen.</>}
          </p>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ketik <span className="text-red-600 font-bold tracking-wider">{expectedText}</span> untuk konfirmasi</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={expectedText}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-800 text-sm text-center font-bold tracking-widest" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
            <button onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false) }} disabled={!canConfirm || deleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
              {deleting ? '⏳ Menghapus...' : <><Trash2 size={14}/> Hapus</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================
// MAIN COMPONENT
// ============================
export default function ManajemenUser() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    try { const stored = localStorage.getItem('userData'); if (stored) setUserData(JSON.parse(stored)) } catch {}
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [kelasOptions, setKelasOptions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nama: '', username: '', email: '', password: '', role: 'OSIS',
    tingkat: '', jurusan: '', nomor: '', kelas: '', whatsapp: '', status: 'Aktif', foto_url: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' })
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  const itemsPerPage = 10
  const fileInputRef = useRef(null)
  const searchRef = useRef(null)
  const blackText = { color: '#1f2937' }
  const inputClass = "w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try { const usersRes = await fetchUsersAction(); if (usersRes.data) setUsers(usersRes.data) } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [usersRes, kelasRes] = await Promise.all([fetchUsersAction(), getAvailableKelas()])
        if (usersRes.data) setUsers(usersRes.data)
        if (kelasRes.kelas) setKelasOptions(kelasRes.kelas)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    init()
  }, [])

  const showToast = (message, type = 'success') => setToast({ message, type, key: Date.now() })

  const stats = {
    total: users.length, admin: users.filter(u => u.role === 'Administrator').length,
    waliKelas: users.filter(u => u.role === 'Wali Kelas').length, sekretaris: users.filter(u => u.role === 'Sekretaris Kelas').length, osis: users.filter(u => u.role === 'OSIS').length,
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.whatsapp?.includes(searchTerm)
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus = !filterStatus || u.status === filterStatus
    const matchKelas = !filterKelas || u.kelas === filterKelas
    return matchSearch && matchRole && matchStatus && matchKelas
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortConfig.key] || ''; const bVal = b[sortConfig.key] || ''
    if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    const cmp = String(aVal).localeCompare(String(bVal))
    return sortConfig.direction === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const handleSort = (key) => { setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' })) }
  const sortIcon = (key) => { if (sortConfig.key !== key) return ' ↕'; return sortConfig.direction === 'asc' ? ' ↑' : ' ↓' }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (['tingkat', 'jurusan'].includes(name)) {
        const t = name === 'tingkat' ? value : prev.tingkat; const j = name === 'jurusan' ? value : prev.jurusan
        updated.kelas = t && j ? `${t} ${j}` : ''; updated.jurusan = j
      }
      if (name === 'role' && value === 'Administrator') { updated.kelas = ''; updated.tingkat = ''; updated.jurusan = '' }
      return updated
    })
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Ukuran foto maksimal 2MB', 'error'); return }
    setFotoFile(file); setFotoPreview(URL.createObjectURL(file))
  }

  const openAddModal = () => {
    setFormData({ nama: '', username: '', email: '', password: '', role: 'OSIS', tingkat: '', jurusan: '', nomor: '', kelas: '', whatsapp: '', status: 'Aktif', foto_url: '' })
    setFotoFile(null); setFotoPreview(null); setEditMode(false); setIsModalOpen(true)
  }

  const openEditModal = (u) => {
    const parsed = parseKelas(u.kelas || '')
    setFormData({ id: u.id, nama: u.nama || '', username: u.username || '', email: u.email || '', password: '', role: u.role || 'OSIS', tingkat: parsed.tingkat || '', jurusan: u.jurusan || parsed.jurusan || '', kelas: u.kelas || '', whatsapp: u.whatsapp || '', status: u.status || 'Aktif', foto_url: u.foto_url || '' })
    setFotoFile(null); setFotoPreview(u.foto_url || null); setEditMode(true); setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nama || !formData.username || !formData.email) { showToast('Nama, Username, dan Email wajib diisi!', 'error'); return }
    if (!editMode && !formData.password) { showToast('Password wajib diisi untuk user baru!', 'error'); return }
    if (formData.role !== 'Administrator' && !formData.kelas) { showToast(`Kelas wajib diisi untuk role ${formData.role}!`, 'error'); return }
    setSaving(true)
    try {
      let fotoUrl = formData.foto_url
      if (fotoFile) { const uploadRes = await uploadUserPhotoAction(fotoFile); if (uploadRes.error) { showToast(uploadRes.error, 'error'); setSaving(false); return }; fotoUrl = uploadRes.url }
      const dataToSave = { ...formData, foto_url: fotoUrl }; delete dataToSave.tingkat; delete dataToSave.nomor
      if (editMode && !dataToSave.password) delete dataToSave.password
      const result = await saveUserAction(dataToSave, editMode)
      if (result.error) { showToast(result.error, 'error'); setSaving(false); return }
      setIsModalOpen(false); showToast(editMode ? 'Pengguna berhasil diperbarui!' : 'Pengguna berhasil ditambahkan!'); await fetchUsers()
    } catch (e) { console.error(e); showToast('Terjadi kesalahan sistem', 'error') }
    setSaving(false)
  }

  const handleDeleteConfirm = async () => {
    try { if (deleteTarget) { const result = await deleteUserAction(deleteTarget.id); if (result.error) { showToast(result.error, 'error'); return }; showToast('Pengguna berhasil dihapus!') }; setDeleteTarget(null); setCurrentPage(1); await fetchUsers() } catch (e) { console.error(e) }
  }

  const handleDeleteAllConfirm = async () => {
    let currentUser = null;
    try {
      const stored = localStorage.getItem('userData');
      if (stored) currentUser = JSON.parse(stored);
    } catch {}
    if (!currentUser) currentUser = userData;
    if (!currentUser || (!currentUser.id && !currentUser.username)) {
      showToast('Gagal memverifikasi identitas admin. Silakan login ulang.', 'error');
      setIsDeleteAllOpen(false);
      return;
    }
    try {
      const result = await deleteAllUsersAction(currentUser.id || null, currentUser.username || null)
      if (result.error) { showToast(result.error, 'error'); return }
      showToast('Semua pengguna berhasil dihapus! Akun Anda tetap aman.')
      setIsDeleteAllOpen(false); setCurrentPage(1); fetchUsers()
    } catch (e) { console.error(e); showToast('Terjadi kesalahan sistem', 'error') }
  }

  const handleImport = async (usersData) => {
    if (!usersData || usersData.length === 0) { showToast('Tidak ada data untuk diimpor', 'error'); return }
    try {
      const result = await importUsersCSV(usersData)
      if (result.error) { showToast(result.error, 'error'); return }
      const skipMsg = result.skipped ? ` (${result.skipped} dilewati)` : '';
      setIsImportOpen(false); showToast(result.message || `${result.count} pengguna berhasil diimport!${skipMsg}`); await fetchUsers()
    } catch (e) { console.error(e); showToast('Gagal import data', 'error') }
  }

  const handleExportCSV = () => {
    if (sortedUsers.length === 0) { showToast('Tidak ada data untuk diexport', 'error'); return }
    const headers = ['No', 'Nama', 'Username', 'Email', 'Role', 'Kelas', 'Jurusan', 'WhatsApp', 'Status']
    const rows = sortedUsers.map((u, i) => [i + 1, u.nama || '', u.username || '', u.email || '', u.role || '', u.kelas || '', u.jurusan || '', u.whatsapp || '', u.status || ''])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Data_Users_${new Date().toISOString().split('T')[0]}.csv`; link.click()
    showToast(`${sortedUsers.length} data berhasil diexport!`)
  }

  const handleCetak = () => {
    const w = window.open('', '_blank')
    const rows = sortedUsers.map((u, i) => `<tr>
      <td style="border:1px solid #ccc;padding:6px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ccc;padding:6px">${u.nama || ''}</td>
      <td style="border:1px solid #ccc;padding:6px">${u.username || ''}</td>
      <td style="border:1px solid #ccc;padding:6px">${u.email || ''}</td>
      <td style="border:1px solid #ccc;padding:6px;text-align:center">${u.role || ''}</td>
      <td style="border:1px solid #ccc;padding:6px;text-align:center">${u.kelas || '-'}</td>
      <td style="border:1px solid #ccc;padding:6px;text-align:center">${u.jurusan || '-'}</td>
      <td style="border:1px solid #ccc;padding:6px">${u.whatsapp || '-'}</td>
      <td style="border:1px solid #ccc;padding:6px;text-align:center">${u.status || ''}</td>
    </tr>`).join('')
    w.document.write(`<html><head><title>Data Pengguna</title><style>body{font-family:Arial;padding:20px}h2{text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#e5e7eb;border:1px solid #ccc;padding:8px;font-weight:bold;text-align:center}</style></head><body>
      <h2>DATA PENGGUNA SIPANDU</h2>
      <p style="text-align:center;color:#666;font-size:12px">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <table>
        <thead><tr><th>No</th><th>Nama</th><th>Username</th><th>Email</th><th>Peran</th><th>Kelas</th><th>Jurusan</th><th>WhatsApp</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen User</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengguna dan hak akses sistem SIPANDU</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Pengguna', value: stats.total, icon: Users, gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
          { label: 'Administrator', value: stats.admin, icon: Shield, gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
          { label: 'Wali Kelas', value: stats.waliKelas, icon: UserCheck, gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
          { label: 'Sekretaris', value: stats.sekretaris, icon: ClipboardList, gradient: 'bg-gradient-to-br from-amber-500 to-amber-600' },
          { label: 'OSIS', value: stats.osis, icon: Star, gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.gradient} p-5 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-center justify-between mb-3"><div className="bg-white/20 p-2.5 rounded-xl"><stat.icon size={20}/></div></div>
            <p className="text-3xl font-extrabold tracking-tight"><CountUp end={stat.value} /></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={openAddModal} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all text-sm font-semibold shadow-lg shadow-blue-500/25"><Plus size={16}/> Tambah User</button>
        <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Upload size={16}/> Import Excel</button>
        <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Download size={16}/> Export Data</button>
        <button onClick={handleCetak} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Printer size={16}/> Cetak Data</button>
        <button onClick={() => searchRef.current?.focus()} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-semibold shadow-sm"><Search size={16}/> Cari Pengguna</button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input type="text" ref={searchRef} placeholder="Cari Nama / Username / Email..." style={blackText}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} />
          </div>
          <select style={blackText} className="border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1) }}>
            <option value="">Semua Peran</option>{roleList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select style={blackText} className="border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={filterKelas} onChange={(e) => { setFilterKelas(e.target.value); setCurrentPage(1) }}>
            <option value="">Semua Kelas</option>{kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select style={blackText} className="border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}>
            <option value="">Semua Status</option><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {[
                  { key: 'id', label: 'No', sortable: true }, { key: '', label: 'Foto', sortable: false },
                  { key: 'nama', label: 'Nama', sortable: true }, { key: 'username', label: 'Username', sortable: true },
                  { key: 'email', label: 'Email', sortable: true }, { key: 'role', label: 'Peran', sortable: true },
                  { key: 'kelas', label: 'Kelas', sortable: true }, { key: 'jurusan', label: 'Jurusan', sortable: true },
                  { key: 'whatsapp', label: 'WhatsApp', sortable: false }, { key: 'status', label: 'Status', sortable: true },
                  { key: '', label: 'Aksi', sortable: false },
                ].map((col, i) => (
                  <th key={i} className={`py-3 px-4 font-bold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-blue-600' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}>
                    {col.label}{col.sortable && <span className="text-gray-400 font-normal">{sortIcon(col.key)}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="animate-pulse">{Array.from({ length: 11 }).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded-lg"/></td>)}</tr>))
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-16"><Users size={48} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-500 font-semibold">Data pengguna tidak ditemukan</p></td></tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const rc = roleConfig[u.role] || roleConfig['OSIS']; const RoleIcon = rc.icon
                  return (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="py-3 px-4">
                        {u.foto_url ? (<img src={u.foto_url} alt={u.nama} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow" />) : (<div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">{u.nama?.charAt(0)?.toUpperCase() || '?'}</div>)}
                      </td>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap" style={blackText}>{u.nama}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs whitespace-nowrap">{u.username}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-[150px] truncate">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: rc.bg, color: rc.color }}><RoleIcon size={12}/>{u.role}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs whitespace-nowrap" style={blackText}>{u.kelas || '—'}</td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-600 whitespace-nowrap">{u.jurusan || '—'}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{u.whatsapp || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${u.status === 'Aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}/>{u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditModal(u)} title="Edit" className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"><Edit3 size={14}/></button>
                          <button onClick={() => setDeleteTarget(u)} title="Hapus" className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Halaman <span className="font-semibold text-gray-700">{currentPage}</span> dari <span className="font-semibold text-gray-700">{totalPages || 1}</span> <span className="text-gray-400 ml-1">({sortedUsers.length} data)</span></span>
            <button onClick={() => setIsDeleteAllOpen(true)} className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline transition ml-2">Hapus Semua</button>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-blue-600 hover:text-white disabled:opacity-40 transition-all shadow-sm"><ChevronLeft size={16}/></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { let p; if (totalPages <= 5) p = i + 1; else if (currentPage <= 3) p = i + 1; else if (currentPage >= totalPages - 2) p = totalPages - 4 + i; else p = currentPage - 2 + i; return (<button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all shadow-sm ${currentPage === p ? 'bg-blue-600 text-white shadow-blue-500/25' : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white'}`}>{p}</button>) })}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-blue-600 hover:text-white disabled:opacity-40 transition-all shadow-sm"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH/EDIT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-800">{editMode ? '✏️ Edit Pengguna' : '➕ Tambah Pengguna Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {fotoPreview ? (<img src={fotoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg" />) : (<div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">{formData.nama ? formData.nama.charAt(0).toUpperCase() : <Camera size={32}/>}</div>)}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><span className="text-white text-xs font-semibold flex items-center gap-1"><Camera size={12}/> Ganti</span></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFotoChange} className="hidden" />
                <p className="text-xs text-gray-400">JPG, PNG, WebP • Maks 2MB</p>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Nama Lengkap <span className="text-red-500">*</span></label><input type="text" name="nama" value={formData.nama} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Nama Lengkap"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Username <span className="text-red-500">*</span></label><input type="text" name="username" value={formData.username} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Username"/></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="Email"/></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Password {editMode ? <span className="text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span> : <span className="text-red-500">*</span>}</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} style={blackText} className={inputClass} placeholder={editMode ? '••••••••' : 'Password'}/></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Peran <span className="text-red-500">*</span></label><select name="role" value={formData.role} onChange={handleInputChange} style={blackText} className={inputClass}>{roleList.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              {formData.role !== 'Administrator' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Kelas <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="tingkat" value={formData.tingkat} onChange={handleInputChange} style={blackText} className={inputClass}><option value="">Tingkat</option>{tingkatList.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select name="jurusan" value={formData.jurusan} onChange={handleInputChange} style={blackText} className={inputClass}><option value="">Jurusan</option>{jurusanList.map(j => <option key={j} value={j}>{j}</option>)}</select>
                  </div>
                  {formData.kelas && (<p className="mt-2 text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg">Kelas: <span className="font-bold">{formData.kelas}</span></p>)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">No. WhatsApp</label><input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} style={blackText} className={inputClass} placeholder="08xxxxxxxxxx"/></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Status</label><select name="status" value={formData.status} onChange={handleInputChange} style={blackText} className={inputClass}><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Batal</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/25">{saving ? '⏳ Menyimpan...' : <><Save size={16}/> Simpan</>}</button>
            </div>
          </div>
        </div>
      )}

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImport} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} target={deleteTarget} isAll={false} />
      <DeleteConfirmModal isOpen={isDeleteAllOpen} onClose={() => setIsDeleteAllOpen(false)} onConfirm={handleDeleteAllConfirm} isAll={true} />

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  )
}