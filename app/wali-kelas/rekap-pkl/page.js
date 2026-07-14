'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BarChart3, Filter, Trash2, Eye, X, Loader2, CalendarDays, Users, CheckCircle, AlertTriangle, Printer, FileSpreadsheet, RotateCcw, Building2, Search } from 'lucide-react'
import { getPklFilters, getPklStats, getPklRekapHarian, getPklRekapBulanan, getPklRekapSemester, getPklAttendanceDetail, resetAllPklData, cleanupOldPklSelfies, getCompletedPklStudentIds, deleteCompletedPklData } from '@/app/actions/pklActions'
import { getWKKelasAssignment, getUserKelasInfo } from '@/app/actions/absensiActions'
import { getKopSuratSettings } from '@/app/actions/siswaActions'
import { generateKopSuratHTML } from '@/lib/kopSuratHelper'
import PJInfoCard from '@/app/components/PJInfoCard'

const SC = {
  Hadir: { label: 'H', color: '#10B981', bg: '#D1FAE5' },
  Sakit: { label: 'S', color: '#F59E0B', bg: '#FEF3C7' },
  Izin: { label: 'I', color: '#3B82F6', bg: '#DBEAFE' },
  Alpha: { label: 'A', color: '#EF4444', bg: '#FEE2E2' },
  Terlambat: { label: 'T', color: '#F97316', bg: '#FFF7ED' },
  Libur: { label: 'L', color: '#6B7280', bg: '#F3F4F6' },
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function CountUp({ end, duration = 800 }) {
  const [count, setCount] = useState(0)
  const prevRef = React.useRef(0)
  useEffect(() => {
    const start = prevRef.current, t0 = Date.now()
    const animate = () => {
      const p = Math.min((Date.now() - t0) / duration, 1)
      setCount(Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate); prevRef.current = end
  }, [end, duration])
  return <span>{count}</span>
}

function DonutChart({ data, size = 120, stroke = 14 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center" style={{ width: size, height: size }}><span className="text-xs text-gray-400">Belum ada data</span></div>
  let offset = 0
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total
        const dash = pct * circumference
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )
        offset += dash
        return el
      })}
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="text-sm font-extrabold" fill="#1f2937">{total}</text>
      <text x={size / 2} y={size / 2 + 10} textAnchor="middle" className="text-[9px]" fill="#9ca3af">Total</text>
    </svg>
  )
}

export default function RekapPKL() {
  const [filters, setFilters] = useState({ company: '', kelas: '', jurusan: '', status: '' })
  const [filterOptions, setFilterOptions] = useState({ companies: [], statuses: [], tingkat: [], jurusan: [], kelasJurusanList: [] })
  const [activeTab, setActiveTab] = useState('harian')
  const [stats, setStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, terlambat: 0, libur: 0, persentase: '0.0' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'))
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [semesterInfo, setSemesterInfo] = useState(null)
  const [daysInMonth, setDaysInMonth] = useState(0)
  const [monthName, setMonthName] = useState('')

  const [detailModal, setDetailModal] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [userData, setUserData] = useState(null)
  useEffect(() => { try { const s = localStorage.getItem('userData'); if (s) setUserData(JSON.parse(s)) } catch {} }, [])
  const userRole = userData?.role || ''
  const isWK = userRole === 'Wali Kelas'
  const isAdmin = userRole === 'Administrator'

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetText, setResetText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [wkNeedsJurusanSelection, setWkNeedsJurusanSelection] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hideSelesai, setHideSelesai] = useState(false)
  const [selesaiIds, setSelesaiIds] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingCompleted, setDeletingCompleted] = useState(false)
  const deleteInputRef = React.useRef(null)

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  useEffect(() => {
    if (isWK && userData?.id && !filters.kelas) {
      const initWKFilter = async () => {
        try {
          const assignment = await getWKKelasAssignment(userData.id)
          if (assignment && assignment.kelas) {
            setFilters(f => ({ ...f, kelas: assignment.kelas, jurusan: assignment.jurusan || '' }))
            setWkNeedsJurusanSelection(assignment.needsSelection || false)
            return
          }
        } catch (e) { console.error('[RekapPKL] Gagal ambil kelas assignment:', e) }
        try {
          const dbInfo = await getUserKelasInfo(userData.id)
          if (dbInfo.kelas) {
            setFilters(f => ({ ...f, kelas: dbInfo.kelas, jurusan: dbInfo.jurusan || '' }))
            setWkNeedsJurusanSelection(!dbInfo.jurusan)
            return
          }
        } catch (e2) { console.error('[RekapPKL] Gagal ambil kelas info dari DB:', e2) }
        setFilters(f => ({ ...f, kelas: userData.kelas || '', jurusan: userData.jurusan || '' }))
        setWkNeedsJurusanSelection(!userData.jurusan)
      }
      initWKFilter()
    }
  }, [isWK, userData?.id])

  useEffect(() => {
    const load = async () => {
      const res = await getPklFilters()
      if (res) setFilterOptions(res)
    }
    load()
  }, [])

  useEffect(() => { cleanupOldPklSelfies() }, [])

  useEffect(() => {
    const fetchSelesai = async () => {
      const res = await getCompletedPklStudentIds(filters)
      if (!res.error) setSelesaiIds(res.ids)
    }
    fetchSelesai()
  }, [filters])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const statsRes = await getPklStats(filters)
      if (statsRes) setStats(statsRes)
      if (activeTab === 'harian') {
        const res = await getPklRekapHarian(selectedDate, filters)
        setData(res.students || [])
      } else if (activeTab === 'bulanan') {
        const dim = new Date(selectedYear, selectedMonth, 0).getDate()
        setDaysInMonth(dim)
        setMonthName(MONTH_NAMES[selectedMonth])
        const res = await getPklRekapBulanan(selectedYear, selectedMonth, filters)
        setData(res.students || [])
      } else if (activeTab === 'semester') {
        const res = await getPklRekapSemester(filters)
        setData(res.students || [])
        setSemesterInfo(res.semesterInfo)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [activeTab, selectedDate, selectedMonth, selectedYear, filters])

  useEffect(() => {
    if (isWK && !filters.jurusan) return
    loadData()
  }, [loadData, isWK, filters.jurusan])

  useEffect(() => {
    if (!isWK) {
      setActiveTab('harian')
      setSelectedDate(new Date().toLocaleDateString('sv-SE'))
    }
  }, [filters, isWK])

  const handleFilterChange = (key, val) => { setFilters(f => ({ ...f, [key]: val })) }
  const showToast = (msg, type = 'success') => setToast({ message: msg, type, key: Date.now() })

  const openDetail = async (attId) => {
    setDetailModal(true); setDetailLoading(true); setDetailData(null)
    const res = await getPklAttendanceDetail(attId)
    setDetailLoading(false)
    if (res.detail) setDetailData(res.detail)
    else showToast(res.error || 'Gagal memuat detail', 'error')
  }

  const handleReset = async () => {
    if (resetStep === 1) { setResetStep(2); return }
    if (resetText !== 'HAPUS SEMUA') return
    setResetting(true)
    const res = await resetAllPklData()
    setResetting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Semua data PKL berhasil dihapus')
    setShowResetModal(false); setResetStep(1); setResetText('')
    loadData()
  }

  const statusBadge = (status) => {
    const c = SC[status]
    if (!c) return <span className="text-xs text-gray-400">{status || '-'}</span>
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold" style={{ backgroundColor: c.bg, color: c.color }}>
        {c.label}
      </span>
    )
  }

  const exportCSV = () => {
    if (data.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return }
    let csv = ''
    if (activeTab === 'harian') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan,Jam Masuk,Jam Pulang,Status,Keterlambatan\n'
      data.forEach((s, i) => {
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}","${s.attendance?.check_in_time || ''}","${s.attendance?.check_out_time || ''}","${s.computedStatus || ''}","${s.attendance?.is_late ? 'Ya' : 'Tidak'}"\n`
      })
    } else if (activeTab === 'bulanan') {
      const header = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan'
      const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Tgl ${i + 1}`).join(',')
      csv = header + ',' + dayHeaders + ',Hari Efektif,Total H,Total S,Total I,Total A,Total T,% Hadir\n'
      data.forEach((s, i) => {
        const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
        let effectiveDays = 0
        const dayVals = (s.days || []).map(d => {
          // FIX: Hari efektif hanya dihitung sampai hari ini (realtime)
          if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++
          if (!d.status) return ''
          counts[d.status] = (counts[d.status] || 0) + 1
          return SC[d.status]?.label || d.status
        }).join(',')
        const hadirTotal = counts.Hadir + counts.Terlambat
        const pct = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}",${dayVals},${effectiveDays},${counts.Hadir},${counts.Sakit},${counts.Izin},${counts.Alpha},${counts.Terlambat},"${pct}%"\n`
      })
    } else if (activeTab === 'semester') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan,Hadir,Sakit,Izin,Alpha,Terlambat,Libur,Total Kerja,Persentase\n'
      data.forEach((s, i) => {
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}",${s.Hadir || 0},${s.Sakit || 0},${s.Izin || 0},${s.Alpha || 0},${s.Terlambat || 0},${s.Libur || 0},${s.totalKerja || 0},"${s.persentase || '0.0'}%"\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
    link.download = `rekap_pkl_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const exportPDF = async () => {
    if (data.length === 0) { showToast('Tidak ada data', 'error'); return }
    const w = window.open('', '_blank')
    if (!w) { showToast('Popup diblokir', 'error'); return }
    const kopSettings = await getKopSuratSettings()
    const kopHTML = await generateKopSuratHTML(kopSettings)
    let title = 'REKAP KEHADIRAN PKL'
    let subtitle = ''
    if (activeTab === 'harian') {
      subtitle = `Harian (${new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`
    } else if (activeTab === 'bulanan') {
      subtitle = `Bulanan (${monthName} ${selectedYear})`
    } else {
      subtitle = semesterInfo?.label || 'Semester'
    }
    const kelasLabel = filters.kelas && filters.jurusan ? `Kelas: ${filters.kelas} ${filters.jurusan}` : (filters.kelas ? `Tingkat: ${filters.kelas}` : '')
    const companyLabel = filters.company ? `Perusahaan: ${filters.company}` : ''
    let tableHTML = ''
    let pageCss = ''
    if (activeTab === 'harian') {
      tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Pemb.Industri</th><th>Guru Pemb.</th><th>Perusahaan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th></tr></thead><tbody>`
      data.forEach((s, i) => {
        tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.industry_supervisor || ''}</td><td>${s.guru_pembimbing || ''}</td><td>${s.company_name || ''}</td><td>${s.attendance?.check_in_time || '-'}</td><td>${s.attendance?.check_out_time || '-'}</td><td>${s.computedStatus || '-'}</td></tr>`
      })
      tableHTML += '</tbody></table>'
    } else if (activeTab === 'bulanan') {
      pageCss = '@page{size:landscape}'
      let hdr = '<th rowspan="2">No</th><th rowspan="2">NISN</th><th rowspan="2">Nama</th><th rowspan="2">L/P</th><th rowspan="2">Kelas</th><th rowspan="2">Jurusan</th><th rowspan="2">Pemb.Industri</th><th rowspan="2">Guru Pemb.</th><th rowspan="2">Perusahaan</th>'
      hdr += `<th colspan="${daysInMonth}" style="text-align:center;font-size:10px">${monthName}</th>`
      hdr += '<th rowspan="2" style="font-size:9px">Hari<br/>Efektif</th><th colspan="5" style="text-align:center;font-size:9px">Total</th><th rowspan="2" style="font-size:9px">% Hadir</th>'
      let hdr2 = ''
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(selectedYear, selectedMonth - 1, d)
        const dayName = DAY_NAMES[dt.getDay()]
        const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
        hdr2 += `<th style="font-size:8px;padding:2px;text-align:center;${isWeekend ? 'background:#fecaca;color:#dc2626' : ''}">${d}<br/><span style="font-size:7px">${dayName}</span></th>`
      }
      hdr2 += '<th style="font-size:9px;text-align:center">H</th><th style="font-size:9px;text-align:center">S</th><th style="font-size:9px;text-align:center">I</th><th style="font-size:9px;text-align:center">A</th><th style="font-size:9px;text-align:center">T</th>'
      tableHTML = `<table border="1" cellpadding="3" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9px"><thead><tr style="background:#f0f0f0">${hdr}</tr><tr style="background:#f0f0f0">${hdr2}</tr></thead><tbody>`
      data.forEach((s, i) => {
        const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
        let effectiveDays = 0
        let row = `<td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td style="font-size:8px">${s.industry_supervisor || ''}</td><td style="font-size:8px">${s.guru_pembimbing || ''}</td><td style="font-size:8px">${s.company_name || ''}</td>`
        ;(s.days || []).forEach(d => {
          // FIX: Hari efektif hanya dihitung sampai hari ini (realtime)
          if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++
          if (!d.status) { row += '<td style="background:#f9fafb;text-align:center">-</td>'; return }
          counts[d.status] = (counts[d.status] || 0) + 1
          const c = SC[d.status]
          const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff'))
          const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333')
          row += `<td style="background:${bg};color:${clr};text-align:center;font-weight:bold;font-size:8px;padding:2px">${c?.label || d.status}</td>`
        })
        const hadirTotal = counts.Hadir + counts.Terlambat
        const pct = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
        row += `<td style="text-align:center;font-weight:bold">${effectiveDays}</td>`
        row += `<td style="text-align:center">${counts.Hadir}</td><td style="text-align:center">${counts.Sakit}</td><td style="text-align:center">${counts.Izin}</td><td style="text-align:center">${counts.Alpha}</td><td style="text-align:center">${counts.Terlambat}</td>`
        row += `<td style="text-align:center;font-weight:bold">${pct}%</td>`
        tableHTML += `<tr>${row}</tr>`
      })
      tableHTML += '</tbody></table>'
    } else {
      tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Pemb.Industri</th><th>Guru Pemb.</th><th>Perusahaan</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpha</th><th>Terlambat</th><th>Libur</th><th>Total Kerja</th><th>%</th></tr></thead><tbody>`
      data.forEach((s, i) => {
        tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.industry_supervisor || ''}</td><td>${s.guru_pembimbing || ''}</td><td>${s.company_name || ''}</td><td>${s.Hadir || 0}</td><td>${s.Sakit || 0}</td><td>${s.Izin || 0}</td><td>${s.Alpha || 0}</td><td>${s.Terlambat || 0}</td><td>${s.Libur || 0}</td><td>${s.totalKerja || 0}</td><td>${s.persentase || '0.0'}%</td></tr>`
      })
      tableHTML += '</tbody></table>'
    }
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${pageCss}body{font-family:Arial,sans-serif;padding:20px}h3{text-align:center;margin:0;font-size:14px;text-transform:uppercase}p.sub{text-align:center;color:#666;font-size:12px;margin:2px 0 16px}@media print{body{margin:0}}</style></head><body>${kopHTML}<div style="text-align:center"><h3>${title}</h3><p class="sub">${subtitle}</p>${kelasLabel ? `<p class="sub">${kelasLabel}</p>` : ''}${companyLabel ? `<p class="sub">${companyLabel}</p>` : ''}<p class="sub">Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>${tableHTML}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`)
    w.document.close()
  }

  const filteredData = React.useMemo(() => {
    let result = data
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(s => s.nama?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q))
    }
    if (hideSelesai && selesaiIds.length > 0) {
      result = result.filter(s => !selesaiIds.includes(s.student_id))
    }
    return result
  }, [data, searchTerm, hideSelesai, selesaiIds])

  const handleDeleteCompleted = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2)
      setTimeout(() => deleteInputRef.current?.focus(), 100)
      return
    }
    if (deleteConfirmText !== 'HAPUS SELESAI') return
    setDeletingCompleted(true)
    const res = await deleteCompletedPklData(filters)
    setDeletingCompleted(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast(`Berhasil menghapus data PKL ${res.deleted} siswa Selesai`)
    setShowDeleteModal(false)
    setDeleteStep(1)
    setDeleteConfirmText('')
    setHideSelesai(false)
    setSelesaiIds([])
    loadData()
  }

  const filterActive = filters.company || filters.kelas || filters.jurusan || filters.status
  const tingkatOptions = [...new Set(filterOptions.kelasJurusanList.map(c => c.kelas))].sort()
  const jurusanOptions = filters.kelas
    ? [...new Set(filterOptions.kelasJurusanList.filter(c => c.kelas === filters.kelas).map(c => c.jurusan))].sort()
    : [...new Set(filterOptions.kelasJurusanList.map(c => c.jurusan))].sort()

  return (
    <div className="p-4 md:p-6 space-y-5 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2"><BarChart3 size={28} className="text-blue-600" /> Rekap Kehadiran PKL</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoring kehadiran siswa Praktik Kerja Lapangan</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Peserta PKL', value: stats.total, emoji: '👥', gradient: 'from-slate-500 to-slate-600' },
          { label: 'Hadir', value: stats.hadir, emoji: '✅', gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'Sakit', value: stats.sakit, emoji: '🤒', gradient: 'from-amber-500 to-amber-600' },
          { label: 'Izin', value: stats.izin, emoji: '📝', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Alpha', value: stats.alpha, emoji: '❌', gradient: 'from-red-500 to-red-600' },
          { label: 'Terlambat', value: stats.terlambat, emoji: '⏰', gradient: 'from-orange-500 to-orange-600' },
          { label: 'Kehadiran', value: stats.persentase, emoji: '📈', gradient: 'from-purple-500 to-purple-600', isText: true },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} p-3 rounded-2xl text-white shadow-lg`}>
            <span className="text-lg">{s.emoji}</span>
            <p className="text-xl md:text-2xl font-extrabold mt-1">{s.isText ? `${s.value}%` : <CountUp end={s.value} />}</p>
            <p className="text-[10px] opacity-80 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <DonutChart data={[
            { label: 'Hadir', value: stats.hadir, color: '#10B981' },
            { label: 'Sakit', value: stats.sakit, color: '#F59E0B' },
            { label: 'Izin', value: stats.izin, color: '#3B82F6' },
            { label: 'Alpha', value: stats.alpha, color: '#EF4444' },
            { label: 'Terlambat', value: stats.terlambat, color: '#F97316' },
            { label: 'Libur', value: stats.libur, color: '#6B7280' },
          ]} size={130} stroke={16} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            {[
              { label: 'Hadir', value: stats.hadir, color: '#10B981' },
              { label: 'Sakit', value: stats.sakit, color: '#F59E0B' },
              { label: 'Izin', value: stats.izin, color: '#3B82F6' },
              { label: 'Alpha', value: stats.alpha, color: '#EF4444' },
              { label: 'Terlambat', value: stats.terlambat, color: '#F97316' },
              { label: 'Libur', value: stats.libur, color: '#6B7280' },
            ].map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600">{d.label}</span>
                <span className="font-bold text-gray-800 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filters.kelas && filters.jurusan && <PJInfoCard kelas={filters.kelas} jurusan={filters.jurusan} />}

      <div className="bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5"><Filter size={16} className="text-gray-500" /><span className="text-sm font-semibold text-gray-700">Filter:</span></div>
          <select value={filters.company} onChange={e => handleFilterChange('company', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]">
            <option value="">Semua Perusahaan</option>
            {filterOptions.companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
          <select value={filters.kelas} onChange={e => handleFilterChange('kelas', e.target.value)} disabled={isWK} className={`px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[100px] ${isWK ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <option value="">Semua Tingkat</option>
            {tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.jurusan} onChange={e => handleFilterChange('jurusan', e.target.value)} disabled={isWK && !wkNeedsJurusanSelection} className={`px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[120px] ${isWK && !wkNeedsJurusanSelection ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <option value="">Semua Jurusan</option>
            {jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[130px]">
            <option value="">Semua Status</option>
            {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {filterActive && !isWK && (
            <button onClick={() => setFilters({ company: '', kelas: '', jurusan: '', status: '' })} className="px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
          )}
          {isWK && (
            <span className={`px-3 py-2 text-xs font-semibold rounded-lg ${wkNeedsJurusanSelection && !filters.jurusan ? 'text-amber-700 bg-amber-50' : 'text-purple-700 bg-purple-50'}`}>
              {wkNeedsJurusanSelection && !filters.jurusan
                ? `⚠️ Kelas Binaan: ${filters.kelas} — Pilih Jurusan ↓`
                : `📋 Kelas Binaan: ${filters.kelas} ${filters.jurusan || ''}`}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"><FileSpreadsheet size={14} /> CSV</button>
            <button onClick={exportPDF} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1"><Printer size={14} /> PDF</button>
            {isAdmin && (
              <div className="flex items-center gap-2">
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari nama/NISN..." className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400" title="Hapus pencarian"><X size={14} /></button>
          )}
                <button onClick={() => { setShowResetModal(true); setResetStep(1); setResetText('') }} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1"><Trash2 size={14} /> Reset Semua</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['harian', 'bulanan', 'semester'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-semibold transition relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'harian' ? '📅 Harian' : tab === 'bulanan' ? '📆 Bulanan' : '📋 Semester'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-gray-50">
          {activeTab === 'harian' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-500" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={hideSelesai} onChange={e => setHideSelesai(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-gray-600 font-medium">Sembunyikan Selesai</span>
              </label>
              {hideSelesai && selesaiIds.length > 0 && (
                <button onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteConfirmText('') }} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5">
                  <Trash2 size={12} /> Hapus Data Selesai ({selesaiIds.length})
                </button>
              )}
            </div>
          )}
          {activeTab === 'bulanan' && (
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">
                {MONTH_NAMES.slice(1).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-sm text-gray-600 font-semibold ml-2">{monthName} {selectedYear}</span>
            </div>
          )}
          {activeTab === 'semester' && semesterInfo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={16} className="text-blue-500" />
              <span className="font-semibold">{semesterInfo.label}</span>
              <span className="text-gray-400">({semesterInfo.startDate} s.d. {semesterInfo.endDate})</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse flex gap-3"><div className="h-4 bg-gray-100 rounded w-8" /><div className="h-4 bg-gray-100 rounded w-24" /><div className="h-4 bg-gray-100 rounded flex-1" /><div className="h-4 bg-gray-100 rounded w-16" /></div>)}</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16"><Users size={48} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-500 font-semibold">Tidak ada data siswa PKL</p><p className="text-gray-400 text-xs mt-1">{filterActive || searchTerm ? 'Coba ubah filter atau pencarian' : 'Pastikan ada siswa yang memiliki profil PKL'}</p></div>
          ) : activeTab === 'harian' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase w-10">No</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">NISN</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Nama</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center w-10">L/P</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Kelas</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Jurusan</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Pembimbing Industri</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Guru Pembimbing</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Perusahaan</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Jam Masuk</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Jam Pulang</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Status</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Terlambat</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((s, i) => (
                  <tr key={s.student_id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="py-3 px-3 text-gray-600 font-mono text-xs">{s.nisn || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-gray-800">{s.nama}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-600">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">{s.kelas || '-'}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">{s.jurusan || '-'}</td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{s.industry_supervisor || '-'}</td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{s.guru_pembimbing || '-'}</td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{s.company_name || '-'}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700">{s.attendance?.check_in_time || '-'}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700">{s.attendance?.check_out_time || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      {selesaiIds.includes(s.student_id) ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-700">✓</span>
                      ) : statusBadge(s.computedStatus)}
                    </td>
                    <td className="py-3 px-3 text-center text-xs">{s.attendance?.is_late ? <span className="text-orange-600 font-bold">Ya</span> : <span className="text-gray-400">-</span>}</td>
                    <td className="py-3 px-3 text-center">
                      {s.attendance?.id && (
                        <button onClick={() => openDetail(s.attendance.id)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center mx-auto transition" title="Lihat Detail"><Eye size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'bulanan' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: daysInMonth * 28 + 480 }}>
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th rowSpan={2} className="py-2 px-1.5 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300 md:sticky left-0 bg-gray-100 z-20 w-8">No</th>
                    <th rowSpan={2} className="py-2 px-2 font-bold text-gray-700 text-[10px] uppercase border-r border-b border-gray-300 md:sticky left-[32px] bg-gray-100 z-20 min-w-[120px]">Nama Siswa</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300 md:sticky left-[152px] bg-gray-100 z-20 min-w-[30px]">L/P</th>
                    <th colSpan={daysInMonth} className="py-2 px-1 font-bold text-gray-700 text-[11px] uppercase text-center border-r border-b border-gray-300">{monthName}</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300 min-w-[36px]">Hari<br/>Efektif</th>
                    <th colSpan={5} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300">Total</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-b border-gray-300 min-w-[52px]">% Hadir</th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = new Date(selectedYear, selectedMonth - 1, i + 1)
                      const dayName = DAY_NAMES[d.getDay()]
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6
                      return (
                        <th key={i} className={`py-1 px-0.5 font-bold text-[9px] text-center border-r border-b border-gray-300 ${isWeekend ? 'bg-red-100 text-red-600' : 'text-gray-600'}`} style={{ minWidth: 26 }}>
                          {i + 1}<br/><span className="text-[7px] opacity-60">{dayName}</span>
                        </th>
                      )
                    })}
                    <th className="py-1 px-1 font-bold text-emerald-600 text-[9px] text-center border-r border-b border-gray-300">H</th>
                    <th className="py-1 px-1 font-bold text-amber-600 text-[9px] text-center border-r border-b border-gray-300">S</th>
                    <th className="py-1 px-1 font-bold text-blue-600 text-[9px] text-center border-r border-b border-gray-300">I</th>
                    <th className="py-1 px-1 font-bold text-red-600 text-[9px] text-center border-r border-b border-gray-300">A</th>
                    <th className="py-1 px-1 font-bold text-orange-600 text-[9px] text-center border-b border-gray-300">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((s, idx) => {
                    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
                    let effectiveDays = 0
                    // FIX: Hitung counts dan effectiveDays sekali di sini saja
                    ;(s.days || []).forEach(d => {
                      if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++
                      if (d.status) counts[d.status] = (counts[d.status] || 0) + 1
                    })
                    const hadirTotal = counts.Hadir + counts.Terlambat
                    const persentase = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
                    const pctColor = parseFloat(persentase) >= 80 ? 'text-emerald-600' : parseFloat(persentase) >= 60 ? 'text-amber-600' : 'text-red-600'
                    return (
                      <tr key={s.student_id} className="hover:bg-blue-50/20">
                        <td className="py-1.5 px-1.5 text-center text-[10px] text-gray-500 border-r border-b border-gray-200 md:sticky left-0 bg-white z-10">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-semibold text-gray-800 text-[11px] truncate max-w-[140px] border-r border-b border-gray-200 md:sticky left-[32px] bg-white z-10">{s.nama}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-600 border-r border-b border-gray-200 md:sticky left-[152px] bg-white z-10">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                        {(s.days || []).map((d, di) => {
                          if (!d.status) return <td key={di} className="py-1 px-0.5 text-center border-r border-b border-gray-200 bg-gray-50 text-gray-300" style={{ minWidth: 26 }}>-</td>
                          // FIX: HAPUS baris counts[d.status] yang menyebabkan double-counting
                          const c = SC[d.status]
                          const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff'))
                          const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333')
                          return <td key={di} className="py-1 px-0.5 text-center font-bold border-r border-b border-gray-200" style={{ backgroundColor: bg, color: clr, fontSize: 9, minWidth: 26 }}>{c?.label || d.status}</td>
                        })}
                        <td className="py-1.5 px-1 text-center font-bold text-gray-700 border-r border-b border-gray-200">{effectiveDays}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-emerald-700 border-r border-b border-gray-200">{counts.Hadir}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-amber-700 border-r border-b border-gray-200">{counts.Sakit}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-blue-700 border-r border-b border-gray-200">{counts.Izin}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-red-700 border-r border-b border-gray-200">{counts.Alpha}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-orange-700 border-b border-gray-200">{counts.Terlambat}</td>
                        <td className={`py-1.5 px-1 text-center font-extrabold border-b border-gray-200 ${pctColor}`}>{persentase}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase w-10">No</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">NISN</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Nama</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center w-10">L/P</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Kelas</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Jurusan</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Pembimbing Industri</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Guru Pembimbing</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Perusahaan</th>
                  <th className="py-3 px-3 font-bold text-emerald-600 text-xs uppercase text-center">H</th>
                  <th className="py-3 px-3 font-bold text-amber-600 text-xs uppercase text-center">S</th>
                  <th className="py-3 px-3 font-bold text-blue-600 text-xs uppercase text-center">I</th>
                  <th className="py-3 px-3 font-bold text-red-600 text-xs uppercase text-center">A</th>
                  <th className="py-3 px-3 font-bold text-orange-600 text-xs uppercase text-center">T</th>
                  <th className="py-3 px-3 font-bold text-gray-500 text-xs uppercase text-center">L</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Total Kerja</th>
                  <th className="py-3 px-3 font-bold text-purple-600 text-xs uppercase text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((s, i) => {
                  const pct = parseFloat(s.persentase) || 0
                  const pctColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'
                  return (
                    <tr key={s.student_id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-3 text-gray-500 text-xs">{i + 1}</td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-xs">{s.nisn || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-gray-800">{s.nama}</td>
                      <td className="py-3 px-3 text-center text-xs text-gray-600">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                      <td className="py-3 px-3 text-xs text-gray-600">{s.kelas || '-'}</td>
                      <td className="py-3 px-3 text-xs text-gray-600">{s.jurusan || '-'}</td>
                      <td className="py-3 px-3 text-xs text-gray-600">{s.industry_supervisor || '-'}</td>
                      <td className="py-3 px-3 text-xs text-gray-600">{s.guru_pembimbing || '-'}</td>
                      <td className="py-3 px-3 text-gray-600 text-xs">{s.company_name || '-'}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">{s.Hadir || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700">{s.Sakit || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">{s.Izin || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-red-700">{s.Alpha || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-orange-700">{s.Terlambat || 0}</td>
                      <td className="py-3 px-3 text-center text-gray-500">{s.Libur || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-800">{s.totalKerja || 0}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-lg"><span className={pctColor}>{s.persentase || '0.0'}%</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Hapus Data PKL Selesai</h3>
                  <p className="text-[11px] text-gray-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {deleteStep === 1 ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-800">Peringatan!</p>
                        <p className="text-xs text-red-600 mt-1">Data profil PKL dan seluruh riwayat absensi dari <strong>{selesaiIds.length} siswa</strong> dengan status <strong>Selesai</strong> akan dihapus permanen.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">📌 Saran Sebelum Menghapus</p>
                        <p className="text-xs text-amber-700 mt-1">Download terlebih dahulu <strong>Rekap Kehadiran PKL</strong> (CSV/PDF) sebagai arsip data sebelum menghapus. Data yang sudah dihapus <strong>tidak dapat dikembalikan</strong>.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                      Batal
                    </button>
                    <button onClick={handleDeleteCompleted} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 ml-3">
                      Lanjutkan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Konfirmasi Penghapusan</p>
                        <p className="text-xs text-amber-700 mt-1">Ketik <strong>HAPUS SELESAI</strong> untuk mengkonfirmasi penghapusan data PKL Selesai.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ketik konfirmasi:</label>
                    <input
                      ref={deleteInputRef}
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="HAPUS SELESAI"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition"
                    />
                  </div>
                  {deletingCompleted ? (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 size={18} className="animate-spin text-red-500" />
                      <span className="text-sm text-red-600 font-medium">Menghapus data...</span>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button onClick={() => { setDeleteStep(1); setDeleteConfirmText('') }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                        Kembali
                      </button>
                      <button
                        onClick={handleDeleteCompleted}
                        disabled={deleteConfirmText !== 'HAPUS SELESAI'}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 ml-3 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="font-bold">Detail Absensi PKL</h3>
              <button onClick={() => setDetailModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition"><X size={16} /></button>
            </div>
            {detailLoading ? (
              <div className="p-8 flex justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
            ) : detailData ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{detailData.siswa?.nama?.[0]}</div>
                  <div>
                    <p className="font-bold text-gray-800">{detailData.siswa?.nama}</p>
                    <p className="text-xs text-gray-500">{detailData.siswa?.nisn} · {detailData.siswa?.kelas} {detailData.siswa?.jurusan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Tanggal</p><p className="font-bold text-gray-800 text-sm">{detailData.attendance_date}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Status</p><div className="mt-0.5">{statusBadge(detailData.status)}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jam Masuk</p><p className="font-bold text-gray-800 text-sm">{detailData.check_in_time || '-'}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jam Pulang</p><p className="font-bold text-gray-800 text-sm">{detailData.check_out_time || '-'}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Terlambat</p><p className="font-bold text-sm">{detailData.is_late ? <span className="text-orange-600">Ya</span> : <span className="text-gray-400">Tidak</span>}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jenis</p><p className="font-bold text-gray-800 text-sm">{detailData.attendance_type || '-'}</p></div>
                </div>
                {detailData.selfie_url && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Foto Selfie Masuk</p>
                    <img src={detailData.selfie_url} alt="Selfie Masuk" className="w-full max-w-[200px] rounded-xl border" referrerPolicy="no-referrer" />
                  </div>
                )}
                {detailData.check_out_selfie_url && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Foto Selfie Pulang</p>
                    <img src={detailData.check_out_selfie_url} alt="Selfie Pulang" className="w-full max-w-[200px] rounded-xl border" referrerPolicy="no-referrer" />
                  </div>
                )}
                {/* Profil PKL Siswa */}
                {detailData.pklProfile && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1.5">
                      <Building2 size={13} className="text-blue-600" /> Profil PKL
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${detailData.pklProfile.status === 'Berjalan' ? 'bg-emerald-100 text-emerald-700' : detailData.pklProfile.status === 'Belum Mulai' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                        {detailData.pklProfile.status}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="col-span-2">
                        <span className="text-gray-500">Perusahaan</span>
                        <p className="font-semibold text-gray-800">{detailData.pklProfile.company_name || '-'}</p>
                      </div>
                      {detailData.pklProfile.company_address && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Alamat PKL</span>
                          <p className="font-semibold text-gray-700">{detailData.pklProfile.company_address}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Pembimbing Industri</span>
                        <p className="font-semibold text-gray-700">{detailData.pklProfile.industry_supervisor || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Guru Pembimbing</span>
                        <p className="font-semibold text-gray-700">{detailData.pklProfile.guru_pembimbing || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Periode PKL</span>
                        <p className="font-semibold text-gray-700">{detailData.pklProfile.start_date} s/d {detailData.pklProfile.end_date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Jam Kerja</span>
                        <p className="font-semibold text-gray-700">{detailData.pklProfile.work_start_time} - {detailData.pklProfile.work_end_time}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Hari Kerja</span>
                        <p className="font-semibold text-gray-700">{detailData.pklProfile.work_days?.join(', ')}</p>
                      </div>
                      {detailData.pklProfile.latitude && detailData.pklProfile.longitude && (
                        <div className="col-span-2 flex items-center gap-2">
                          <span className="text-gray-500">Lokasi PKL</span>
                          <a
                            href={`https://www.google.com/maps?q=${detailData.pklProfile.latitude},${detailData.pklProfile.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-mono text-[10px] hover:underline"
                          >
                            {Number(detailData.pklProfile.latitude).toFixed(6)}, {Number(detailData.pklProfile.longitude).toFixed(6)}
                          </a>
                          <span className="text-gray-400 text-[10px]">· Radius: {detailData.pklProfile.radius_meter || 50}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(detailData.check_in_latitude || detailData.check_in_address) && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-2">📍 Lokasi Masuk</p>
                    {detailData.check_in_latitude && (
                      <a href={`https://www.google.com/maps?q=${detailData.check_in_latitude},${detailData.check_in_longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-mono hover:text-blue-800 hover:underline block">
                        Lat: {detailData.check_in_latitude}, Lng: {detailData.check_in_longitude} — Klik untuk lihat di Google Maps ↗
                      </a>
                    )}
                    {detailData.check_in_address && <p className="text-xs text-blue-600 mt-1">{detailData.check_in_address}</p>}
                  </div>
                )}
                {(detailData.check_out_latitude || detailData.check_out_address) && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">📍 Lokasi Pulang</p>
                    {detailData.check_out_latitude && (
                      <a href={`https://www.google.com/maps?q=${detailData.check_out_latitude},${detailData.check_out_longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-mono hover:text-indigo-800 hover:underline block">
                        Lat: {detailData.check_out_latitude}, Lng: {detailData.check_out_longitude} — Klik untuk lihat di Google Maps ↗
                      </a>
                    )}
                    {detailData.check_out_address && <p className="text-xs text-indigo-600 mt-1">{detailData.check_out_address}</p>}
                  </div>
                )}
                {detailData.note && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">📝 Keterangan</p>
                    <p className="text-sm text-amber-800">{detailData.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">Data tidak ditemukan</div>
            )}
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !resetting && setShowResetModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            {resetStep === 1 ? (
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-3"><Trash2 size={28} className="text-red-600" /></div>
                  <h3 className="text-lg font-bold text-gray-800">Reset Semua Data PKL</h3>
                  <p className="text-sm text-gray-500 mt-2">Tindakan ini akan menghapus <span className="font-bold text-red-600">semua profil PKL</span> dan <span className="font-bold text-red-600">seluruh riwayat absensi PKL</span> termasuk foto selfie dari storage.</p>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                  <button onClick={handleReset} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Lanjutkan</button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-3"><AlertTriangle size={28} className="text-red-600" /></div>
                  <h3 className="text-lg font-bold text-red-800">Konfirmasi Akhir</h3>
                  <p className="text-sm text-gray-600 mt-2">Ketik <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">HAPUS SEMUA</span> untuk mengkonfirmasi penghapusan.</p>
                </div>
                <input value={resetText} onChange={e => setResetText(e.target.value)} placeholder="HAPUS SEMUA" className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-center font-mono font-bold text-gray-800" />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setResetStep(1); setResetText('') }} className="flex-1 py-3 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition" disabled={resetting}>Kembali</button>
                  <button onClick={handleReset} disabled={resetText !== 'HAPUS SEMUA' || resetting} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {resetting ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : 'Hapus Semua'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}