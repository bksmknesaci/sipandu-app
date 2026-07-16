'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { BarChart3, Filter, Trash2, Eye, X, Loader2, CalendarDays, Users, CheckCircle, AlertTriangle, Printer, FileSpreadsheet, RotateCcw, Building2, Search, MapPin, Clock, Camera, LogIn, LogOut } from 'lucide-react'
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
  const [loadingError, setLoadingError] = useState(null)
  const [toast, setToast] = useState(null)

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'))
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [semesterInfo, setSemesterInfo] = useState(null)
  const [daysInMonth, setDaysInMonth] = useState(0)
  const [monthName, setMonthName] = useState('')

  const [detailModal, setDetailModal] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selfieZoom, setSelfieZoom] = useState(null)

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
  const resetInputRef = React.useRef(null)
  const loadIdRef = useRef(0)

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
      try {
        const res = await getPklFilters()
        if (res) setFilterOptions(res)
      } catch (e) { console.error('[RekapPKL] Gagal load filter options:', e) }
    }
    load()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { cleanupOldPklSelfies().catch(() => {}) }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchSelesai = async () => {
      try {
        const res = await getCompletedPklStudentIds(filters)
        if (!cancelled && !res.error) setSelesaiIds(res.ids || [])
      } catch (e) { if (!cancelled) console.error('[RekapPKL] Gagal fetch selesai IDs:', e) }
    }
    fetchSelesai()
    return () => { cancelled = true }
  }, [filters.kelas, filters.jurusan, filters.company])

  const loadData = useCallback(async () => {
    const loadId = ++loadIdRef.current
    setLoading(true); setLoadingError(null)
    try {
      const statsRes = await getPklStats(filters)
      if (loadId !== loadIdRef.current) return
      if (statsRes) setStats(statsRes)
      if (activeTab === 'harian') {
        const res = await getPklRekapHarian(selectedDate, filters)
        if (loadId !== loadIdRef.current) return
        setData(res.students || [])
      } else if (activeTab === 'bulanan') {
        const dim = new Date(selectedYear, selectedMonth, 0).getDate()
        setDaysInMonth(dim); setMonthName(MONTH_NAMES[selectedMonth])
        const res = await getPklRekapBulanan(selectedYear, selectedMonth, filters)
        if (loadId !== loadIdRef.current) return
        setData(res.students || [])
      } else if (activeTab === 'semester') {
        const res = await getPklRekapSemester(filters)
        if (loadId !== loadIdRef.current) return
        setData(res.students || [])
        setSemesterInfo(res.semesterInfo)
      }
    } catch (e) {
      if (loadId !== loadIdRef.current) return
      console.error('[RekapPKL] Gagal loadData:', e)
      setLoadingError('Gagal memuat data. Periksa koneksi internet Anda.')
    }
    if (loadId === loadIdRef.current) setLoading(false)
  }, [activeTab, selectedDate, selectedMonth, selectedYear, filters])

  useEffect(() => { if (isWK && !filters.jurusan) return; loadData() }, [loadData, isWK, filters.jurusan])
  useEffect(() => { if (!isWK) { setActiveTab('harian'); setSelectedDate(new Date().toLocaleDateString('sv-SE')) } }, [filters, isWK])

  const handleFilterChange = (key, val) => { setFilters(f => ({ ...f, [key]: val })) }
  const showToast = (msg, type = 'success') => setToast({ message: msg, type, key: Date.now() })

  const openDetail = async (attId) => {
    setDetailModal(true); setDetailLoading(true); setDetailData(null)
    try {
      const res = await getPklAttendanceDetail(attId)
      setDetailLoading(false)
      if (res.detail) setDetailData(res.detail)
      else showToast(res.error || 'Gagal memuat detail', 'error')
    } catch (e) { setDetailLoading(false); showToast('Gagal memuat detail', 'error') }
  }

  const handleReset = async () => {
    if (resetStep === 1) { setResetStep(2); setTimeout(() => resetInputRef.current?.focus(), 100); return }
    if (resetText !== 'HAPUS SEMUA') return
    setResetting(true)
    try {
      const res = await resetAllPklData(); setResetting(false)
      if (res.error) { showToast(res.error, 'error'); return }
      showToast('Semua data PKL berhasil dihapus')
      setShowResetModal(false); setResetStep(1); setResetText(''); loadData()
    } catch (e) { setResetting(false); showToast('Gagal menghapus data', 'error') }
  }

  const statusBadge = (status) => {
    const c = SC[status]
    if (!c) return <span className="text-xs text-gray-400">{status || '-'}</span>
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold" style={{ backgroundColor: c.bg, color: c.color }}>{c.label}</span>
  }

  const exportCSV = () => {
    if (data.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return }
    let csv = ''
    if (activeTab === 'harian') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan,Jam Masuk,Jam Pulang,Status,Keterlambatan\n'
      data.forEach((s, i) => { csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}","${s.attendance?.check_in_time || ''}","${s.attendance?.check_out_time || ''}","${s.computedStatus || ''}","${s.attendance?.is_late ? 'Ya' : 'Tidak'}"\n` })
    } else if (activeTab === 'bulanan') {
      const header = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan'
      const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Tgl ${i + 1}`).join(',')
      csv = header + ',' + dayHeaders + ',Hari Efektif,Total H,Total S,Total I,Total A,Total T,% Hadir\n'
      data.forEach((s, i) => {
        const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
        let effectiveDays = s.effectiveDays
        if (effectiveDays == null) { effectiveDays = 0; (s.days || []).forEach(d => { if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++ }) }
        const dayVals = (s.days || []).map(d => { if (!d.status) return ''; counts[d.status] = (counts[d.status] || 0) + 1; return SC[d.status]?.label || d.status }).join(',')
        const hadirTotal = counts.Hadir + counts.Terlambat
        const pct = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}",${dayVals},${effectiveDays},${counts.Hadir},${counts.Sakit},${counts.Izin},${counts.Alpha},${counts.Terlambat},"${pct}%"\n`
      })
    } else {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Pembimbing Industri,Guru Pembimbing,Perusahaan,Hadir,Sakit,Izin,Alpha,Terlambat,Libur,Total Kerja,Persentase\n'
      data.forEach((s, i) => { csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.industry_supervisor || ''}","${s.guru_pembimbing || ''}","${s.company_name || ''}",${s.Hadir || 0},${s.Sakit || 0},${s.Izin || 0},${s.Alpha || 0},${s.Terlambat || 0},${s.Libur || 0},${s.totalKerja || 0},"${s.persentase || '0.0'}%"\n` })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
    link.download = `rekap_pkl_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`; link.click()
  }

  const exportPDF = async () => {
    if (data.length === 0) { showToast('Tidak ada data', 'error'); return }
    const w = window.open('', '_blank')
    if (!w) { showToast('Popup diblokir', 'error'); return }
    try {
      const kopSettings = await getKopSuratSettings()
      const kopHTML = await generateKopSuratHTML(kopSettings)
      let title = 'REKAP KEHADIRAN PKL', subtitle = ''
      if (activeTab === 'harian') subtitle = `Harian (${new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`
      else if (activeTab === 'bulanan') subtitle = `Bulanan (${monthName} ${selectedYear})`
      else subtitle = semesterInfo?.label || 'Semester'
      const kelasLabel = filters.kelas && filters.jurusan ? `Kelas: ${filters.kelas} ${filters.jurusan}` : (filters.kelas ? `Tingkat: ${filters.kelas}` : '')
      const companyLabel = filters.company ? `Perusahaan: ${filters.company}` : ''
      let tableHTML = '', pageCss = ''
      if (activeTab === 'harian') {
        tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Pemb.Industri</th><th>Guru Pemb.</th><th>Perusahaan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th></tr></thead><tbody>`
        data.forEach((s, i) => { tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.industry_supervisor || ''}</td><td>${s.guru_pembimbing || ''}</td><td>${s.company_name || ''}</td><td>${s.attendance?.check_in_time || '-'}</td><td>${s.attendance?.check_out_time || '-'}</td><td>${s.computedStatus || '-'}</td></tr>` })
        tableHTML += '</tbody></table>'
      } else if (activeTab === 'bulanan') {
        pageCss = '@page{size:landscape}'
        let hdr = '<th rowspan="2">No</th><th rowspan="2">NISN</th><th rowspan="2">Nama</th><th rowspan="2">L/P</th><th rowspan="2">Kelas</th><th rowspan="2">Jurusan</th><th rowspan="2">Pemb.Industri</th><th rowspan="2">Guru Pemb.</th><th rowspan="2">Perusahaan</th>'
        hdr += `<th colspan="${daysInMonth}" style="text-align:center;font-size:10px">${monthName}</th>`
        hdr += '<th rowspan="2" style="font-size:9px">Hari<br/>Efektif</th><th colspan="5" style="text-align:center;font-size:9px">Total</th><th rowspan="2" style="font-size:9px">% Hadir</th>'
        let hdr2 = ''
        for (let d = 1; d <= daysInMonth; d++) { const dt = new Date(selectedYear, selectedMonth - 1, d); const dayName = DAY_NAMES[dt.getDay()]; const isWeekend = dt.getDay() === 0 || dt.getDay() === 6; hdr2 += `<th style="font-size:8px;padding:2px;text-align:center;${isWeekend ? 'background:#fecaca;color:#dc2626' : ''}">${d}<br/><span style="font-size:7px">${dayName}</span></th>` }
        hdr2 += '<th style="font-size:9px;text-align:center">H</th><th style="font-size:9px;text-align:center">S</th><th style="font-size:9px;text-align:center">I</th><th style="font-size:9px;text-align:center">A</th><th style="font-size:9px;text-align:center">T</th>'
        tableHTML = `<table border="1" cellpadding="3" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9px"><thead><tr style="background:#f0f0f0">${hdr}</tr><tr style="background:#f0f0f0">${hdr2}</tr></thead><tbody>`
        data.forEach((s, i) => {
          const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
          let effectiveDays = s.effectiveDays
          if (effectiveDays == null) { effectiveDays = 0; (s.days || []).forEach(d => { if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++ }) }
          let row = `<td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.industry_supervisor || ''}</td><td>${s.guru_pembimbing || ''}</td><td>${s.company_name || ''}</td>`
          ;(s.days || []).forEach(d => { if (!d.status) { row += '<td style="background:#f9fafb;text-align:center">-</td>'; return }; counts[d.status] = (counts[d.status] || 0) + 1; const c = SC[d.status]; const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff')); const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333'); row += `<td style="background:${bg};color:${clr};text-align:center;font-weight:bold;font-size:8px;padding:2px">${c?.label || d.status}</td>` })
          const hadirTotal = counts.Hadir + counts.Terlambat; const pct = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
          row += `<td style="text-align:center;font-weight:bold">${effectiveDays}</td><td style="text-align:center">${counts.Hadir}</td><td style="text-align:center">${counts.Sakit}</td><td style="text-align:center">${counts.Izin}</td><td style="text-align:center">${counts.Alpha}</td><td style="text-align:center">${counts.Terlambat}</td><td style="text-align:center;font-weight:bold">${pct}%</td>`
          tableHTML += `<tr>${row}</tr>`
        })
        tableHTML += '</tbody></table>'
      } else {
        tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Pemb.Industri</th><th>Guru Pemb.</th><th>Perusahaan</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpha</th><th>Terlambat</th><th>Libur</th><th>Total Kerja</th><th>%</th></tr></thead><tbody>`
        data.forEach((s, i) => { tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.industry_supervisor || ''}</td><td>${s.guru_pembimbing || ''}</td><td>${s.company_name || ''}</td><td>${s.Hadir || 0}</td><td>${s.Sakit || 0}</td><td>${s.Izin || 0}</td><td>${s.Alpha || 0}</td><td>${s.Terlambat || 0}</td><td>${s.Libur || 0}</td><td>${s.totalKerja || 0}</td><td>${s.persentase || '0.0'}%</td></tr>` })
        tableHTML += '</tbody></table>'
      }
      w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${pageCss}body{font-family:Arial,sans-serif;padding:20px}h3{text-align:center;margin:0;font-size:14px;text-transform:uppercase}p.sub{text-align:center;color:#666;font-size:12px;margin:2px 0 16px}@media print{body{margin:0}}</style></head><body>${kopHTML}<div style="text-align:center"><h3>${title}</h3><p class="sub">${subtitle}</p>${kelasLabel ? `<p class="sub">${kelasLabel}</p>` : ''}${companyLabel ? `<p class="sub">${companyLabel}</p>` : ''}<p class="sub">Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>${tableHTML}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`)
      w.document.close()
    } catch (e) { console.error('[RekapPKL] Gagal export PDF:', e); showToast('Gagal membuat PDF', 'error') }
  }

  const filteredData = useMemo(() => {
    let result = data
    if (searchTerm) { const q = searchTerm.toLowerCase(); result = result.filter(s => s.nama?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q)) }
    if (hideSelesai && selesaiIds.length > 0) result = result.filter(s => !selesaiIds.includes(s.student_id))
    return result
  }, [data, searchTerm, hideSelesai, selesaiIds])

  const handleDeleteCompleted = async () => {
    if (deleteStep === 1) { setDeleteStep(2); setTimeout(() => deleteInputRef.current?.focus(), 100); return }
    if (deleteConfirmText !== 'HAPUS SELESAI') return
    setDeletingCompleted(true)
    try {
      const res = await deleteCompletedPklData(filters); setDeletingCompleted(false)
      if (res.error) { showToast(res.error, 'error'); return }
      showToast(`Berhasil menghapus data PKL ${res.deleted} siswa Selesai`)
      setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText(''); setHideSelesai(false); setSelesaiIds([]); loadData()
    } catch (e) { setDeletingCompleted(false); showToast('Gagal menghapus data', 'error') }
  }

  const filterActive = filters.company || filters.kelas || filters.jurusan || filters.status
  const tingkatOptions = [...new Set(filterOptions.kelasJurusanList.map(c => c.kelas))].sort()
  const jurusanOptions = filters.kelas ? [...new Set(filterOptions.kelasJurusanList.filter(c => c.kelas === filters.kelas).map(c => c.jurusan))].sort() : [...new Set(filterOptions.kelasJurusanList.map(c => c.jurusan))].sort()

  const statsCards = [
    { label: 'Peserta PKL', value: stats.total, emoji: '👥', gradient: 'from-slate-500 to-slate-600' },
    { label: 'Hadir', value: stats.hadir, emoji: '✅', gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Sakit', value: stats.sakit, emoji: '🤒', gradient: 'from-amber-500 to-amber-600' },
    { label: 'Izin', value: stats.izin, emoji: '📝', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Alpha', value: stats.alpha, emoji: '❌', gradient: 'from-red-500 to-red-600' },
    { label: 'Terlambat', value: stats.terlambat, emoji: '⏰', gradient: 'from-orange-500 to-orange-600' },
    { label: 'Kehadiran', value: stats.persentase, emoji: '📈', gradient: 'from-purple-500 to-purple-600', isText: true },
  ]

  const legendItems = [
    { label: 'Hadir', value: stats.hadir, color: '#10B981' },
    { label: 'Sakit', value: stats.sakit, color: '#F59E0B' },
    { label: 'Izin', value: stats.izin, color: '#3B82F6' },
    { label: 'Alpha', value: stats.alpha, color: '#EF4444' },
    { label: 'Terlambat', value: stats.terlambat, color: '#F97316' },
    { label: 'Libur', value: stats.libur, color: '#6B7280' },
  ]

  const pkl = detailData?.pklProfile

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 max-w-[calc(100vw-24px)] sm:max-w-none animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />} <span className="truncate">{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-lg sm:text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
          <BarChart3 size={22} className="text-blue-600 shrink-0" /><span>Rekap Kehadiran PKL</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monitoring kehadiran siswa Praktik Kerja Lapangan</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-3">
        {statsCards.map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.gradient} p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg`}>
            <span className="text-sm sm:text-lg">{s.emoji}</span>
            <p className="text-base sm:text-xl md:text-2xl font-extrabold mt-0.5 leading-tight">{s.isText ? `${s.value}%` : <CountUp end={s.value} />}</p>
            <p className="text-[8px] sm:text-[10px] opacity-80 font-medium truncate">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <div className="transform scale-[0.72] sm:scale-100 origin-center shrink-0 my-1 sm:my-0">
            <DonutChart data={legendItems} size={130} stroke={16} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full">
            {legendItems.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600 text-[11px] sm:text-sm">{d.label}</span>
                <span className="font-bold text-gray-800 ml-auto text-[11px] sm:text-sm">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filters.kelas && filters.jurusan && <PJInfoCard kelas={filters.kelas} jurusan={filters.jurusan} />}

      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border space-y-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-3 items-center">
          <div className="flex items-center gap-1 shrink-0"><Filter size={14} className="text-gray-500" /><span className="text-xs sm:text-sm font-semibold text-gray-700">Filter:</span></div>
          <select value={filters.company} onChange={e => handleFilterChange('company', e.target.value)} className="flex-1 min-w-0 sm:min-w-[150px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"><option value="">Semua Perusahaan</option>{filterOptions.companies.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
          <select value={filters.kelas} onChange={e => handleFilterChange('kelas', e.target.value)} disabled={isWK} className={`flex-1 min-w-0 sm:min-w-[100px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 ${isWK ? 'opacity-60 cursor-not-allowed' : ''}`}><option value="">Semua Tingkat</option>{tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <select value={filters.jurusan} onChange={e => handleFilterChange('jurusan', e.target.value)} disabled={isWK && !wkNeedsJurusanSelection} className={`flex-1 min-w-0 sm:min-w-[120px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 ${isWK && !wkNeedsJurusanSelection ? 'opacity-60 cursor-not-allowed' : ''}`}><option value="">Semua Jurusan</option>{jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}</select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="flex-1 min-w-0 sm:min-w-[130px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"><option value="">Semua Status</option>{filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {filterActive && !isWK && (<button onClick={() => setFilters({ company: '', kelas: '', jurusan: '', status: '' })} className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"><RotateCcw size={11} /> <span className="hidden sm:inline">Reset</span></button>)}
        </div>
        {isWK && (<span className={`inline-flex self-start px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-lg ${wkNeedsJurusanSelection && !filters.jurusan ? 'text-amber-700 bg-amber-50' : 'text-purple-700 bg-purple-50'}`}>{wkNeedsJurusanSelection && !filters.jurusan ? `⚠️ Kelas Binaan: ${filters.kelas} — Pilih Jurusan ↓` : `📋 Kelas Binaan: ${filters.kelas} ${filters.jurusan || ''}`}</span>)}
        <div className="flex flex-col sm:flex-row gap-2">
          {isAdmin && (<div className="relative flex-1 min-w-0 order-2 sm:order-1"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari nama/NISN..." className="w-full pl-8 pr-7 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-0" />{searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition text-gray-400"><X size={13} /></button>)}</div>)}
          <div className="flex gap-1.5 sm:gap-2 shrink-0 order-1 sm:order-2 sm:ml-auto">
            <button onClick={exportCSV} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-emerald-100 transition flex items-center justify-center gap-1"><FileSpreadsheet size={13} /> CSV</button>
            <button onClick={exportPDF} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1"><Printer size={13} /> PDF</button>
            {isAdmin && (<button onClick={() => { setShowResetModal(true); setResetStep(1); setResetText('') }} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1"><Trash2 size={13} /> <span className="hidden sm:inline">Reset Semua</span></button>)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['harian', 'bulanan', 'semester'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'harian' ? '📅 Harian' : tab === 'bulanan' ? '📆 Bulanan' : '📋 Semester'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-4 border-b border-gray-50">
          {activeTab === 'harian' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-blue-500 shrink-0" /><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800" /></div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none"><input type="checkbox" checked={hideSelesai} onChange={e => setHideSelesai(e.target.checked)} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-[11px] sm:text-xs text-gray-600 font-medium">Sembunyikan Selesai</span></label>
              {hideSelesai && selesaiIds.length > 0 && (<button onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteConfirmText('') }} className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5"><Trash2 size={11} /> Hapus Data Selesai ({selesaiIds.length})</button>)}
            </div>
          )}
          {activeTab === 'bulanan' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
              <CalendarDays size={14} className="text-blue-500 shrink-0" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">{MONTH_NAMES.slice(1).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
              <span className="text-xs sm:text-sm text-gray-600 font-semibold">{monthName} {selectedYear}</span>
            </div>
          )}
          {activeTab === 'semester' && semesterInfo && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600"><CalendarDays size={14} className="text-blue-500 shrink-0" /><span className="font-semibold">{semesterInfo.label}</span><span className="text-gray-400 hidden sm:inline">({semesterInfo.startDate} s.d. {semesterInfo.endDate})</span></div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loadingError ? (
            <div className="text-center py-12 sm:py-16 px-4"><AlertTriangle size={40} className="mx-auto text-red-300 mb-3" /><p className="text-red-600 font-semibold text-sm">{loadingError}</p><button onClick={loadData} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 mx-auto"><RotateCcw size={14} /> Coba Lagi</button></div>
          ) : loading ? (
            <div className="p-6 sm:p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse flex gap-3"><div className="h-3 bg-gray-100 rounded w-8" /><div className="h-3 bg-gray-100 rounded w-24" /><div className="h-3 bg-gray-100 rounded flex-1" /><div className="h-3 bg-gray-100 rounded w-16" /></div>)}</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 sm:py-16"><Users size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-500 font-semibold text-sm">Tidak ada data siswa PKL</p><p className="text-gray-400 text-[11px] sm:text-xs mt-1">{filterActive || searchTerm || hideSelesai ? 'Coba ubah filter atau pencarian' : 'Pastikan ada siswa yang memiliki profil PKL'}</p></div>
          ) : activeTab === 'harian' ? (
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase w-8 sm:w-10">No</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">NISN</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">Nama</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center w-8">L/P</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">Kelas</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">Jurusan</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden lg:table-cell">Pemb.Industri</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden lg:table-cell">Guru Pemb.</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden md:table-cell">Perusahaan</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center">Masuk</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center">Pulang</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center">Status</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center hidden sm:table-cell">Terlambat</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center w-10 sm:w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((s, i) => (
                  <tr key={s.student_id} className="hover:bg-blue-50/30 transition">
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-500 text-[11px] sm:text-xs">{i + 1}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 font-mono text-[11px] sm:text-xs">{s.nisn || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 font-semibold text-gray-800 text-xs sm:text-sm">{s.nama}{s.isFlexible && <span className="ml-1 inline-block px-1 py-0 rounded text-[8px] font-bold bg-purple-100 text-purple-600 leading-tight">F</span>}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-600">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-[11px] sm:text-xs text-gray-600">{s.kelas || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-[11px] sm:text-xs text-gray-600">{s.jurusan || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 text-[11px] sm:text-xs hidden lg:table-cell">{s.industry_supervisor || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 text-[11px] sm:text-xs hidden lg:table-cell">{s.guru_pembimbing || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 text-[11px] sm:text-xs hidden md:table-cell">{s.company_name || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-700">{s.attendance?.check_in_time || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-700">{s.attendance?.check_out_time || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">{selesaiIds.includes(s.student_id) ? (<span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[11px] sm:text-xs font-extrabold bg-blue-100 text-blue-700">✓</span>) : statusBadge(s.computedStatus)}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs hidden sm:table-cell">{s.attendance?.is_late ? <span className="text-orange-600 font-bold">Ya</span> : <span className="text-gray-400">-</span>}</td>
                    <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">{s.attendance?.id && (<button onClick={() => openDetail(s.attendance.id)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center mx-auto transition" title="Lihat Detail"><Eye size={13} /></button>)}</td>
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
                    <th rowSpan={2} className="py-2 px-2 font-bold text-gray-700 text-[10px] uppercase border-r border-b border-gray-300 md:sticky left-[32px] bg-gray-100 z-20 min-w-[100px] sm:min-w-[120px]">Nama Siswa</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300 md:sticky left-[132px] sm:left-[152px] bg-gray-100 z-20 min-w-[26px] sm:min-w-[30px]">L/P</th>
                    <th colSpan={daysInMonth} className="py-2 px-1 font-bold text-gray-700 text-[11px] uppercase text-center border-r border-b border-gray-300">{monthName}</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300 min-w-[32px] sm:min-w-[36px]">Hari<br/>Efektif</th>
                    <th colSpan={5} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-r border-b border-gray-300">Total</th>
                    <th rowSpan={2} className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center border-b border-gray-300 min-w-[44px] sm:min-w-[52px]">% Hadir</th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = new Date(selectedYear, selectedMonth - 1, i + 1)
                      const dayName = DAY_NAMES[d.getDay()]
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6
                      return (
                        <th key={i} className={`py-1 px-0.5 font-bold text-[9px] text-center border-r border-b border-gray-300 ${isWeekend ? 'bg-red-100 text-red-600' : 'text-gray-600'}`} style={{ minWidth: 24 }}>
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
                    let effectiveDays = s.effectiveDays
                    if (effectiveDays == null) { effectiveDays = 0; (s.days || []).forEach(d => { if (d.isWorkDay && d.inRange && d.isPastOrToday) effectiveDays++ }) }
                    ;(s.days || []).forEach(d => { if (d.status) counts[d.status] = (counts[d.status] || 0) + 1 })
                    const hadirTotal = counts.Hadir + counts.Terlambat
                    const persentase = effectiveDays > 0 ? ((hadirTotal / effectiveDays) * 100).toFixed(1) : '0.0'
                    const pctColor = parseFloat(persentase) >= 80 ? 'text-emerald-600' : parseFloat(persentase) >= 60 ? 'text-amber-600' : 'text-red-600'
                    return (
                      <tr key={s.student_id} className="hover:bg-blue-50/20">
                        <td className="py-1.5 px-1.5 text-center text-[10px] text-gray-500 border-r border-b border-gray-200 md:sticky left-0 bg-white z-10">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-semibold text-gray-800 text-[11px] truncate max-w-[100px] sm:max-w-[140px] border-r border-b border-gray-200 md:sticky left-[32px] bg-white z-10">{s.nama}{s.isFlexible && <span className="ml-1 inline-block px-1 py-0 rounded text-[8px] font-bold bg-purple-100 text-purple-600 leading-tight">F</span>}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-600 border-r border-b border-gray-200 md:sticky left-[132px] sm:left-[152px] bg-white z-10">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                        {(s.days || []).map((d, di) => {
                          if (!d.status) return <td key={di} className="py-1 px-0.5 text-center border-r border-b border-gray-200 bg-gray-50 text-gray-300" style={{ minWidth: 24 }}>-</td>
                          const c = SC[d.status]
                          const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff'))
                          const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333')
                          return <td key={di} className="py-1 px-0.5 text-center border-r border-b border-gray-200 font-bold text-[9px]" style={{ backgroundColor: bg, color: clr, minWidth: 24 }}>{c?.label || d.status}</td>
                        })}
                        <td className="py-1.5 px-1 text-center font-bold text-[10px] text-gray-800 border-r border-b border-gray-200">{effectiveDays}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-700 border-r border-b border-gray-200">{counts.Hadir}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-700 border-r border-b border-gray-200">{counts.Sakit}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-700 border-r border-b border-gray-200">{counts.Izin}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-700 border-r border-b border-gray-200">{counts.Alpha}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-700 border-b border-gray-200">{counts.Terlambat}</td>
                        <td className="py-1.5 px-1 text-center font-bold text-[10px] border-b border-gray-200">{<span className={pctColor}>{persentase}%</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase w-8 sm:w-10">No</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">NISN</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase">Nama</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center w-8">L/P</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden md:table-cell">Kelas</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden md:table-cell">Jurusan</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden lg:table-cell">Pemb.Industri</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase hidden lg:table-cell">Guru Pemb.</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-emerald-600 text-[10px] sm:text-xs uppercase text-center">H</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-amber-600 text-[10px] sm:text-xs uppercase text-center">S</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-blue-600 text-[10px] sm:text-xs uppercase text-center">I</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-red-600 text-[10px] sm:text-xs uppercase text-center">A</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-orange-600 text-[10px] sm:text-xs uppercase text-center">T</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-500 text-[10px] sm:text-xs uppercase text-center">L</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center">Kerja</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-3 font-bold text-gray-700 text-[10px] sm:text-xs uppercase text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((s, i) => {
                  const pctColor = parseFloat(s.persentase || '0') >= 80 ? 'text-emerald-600' : parseFloat(s.persentase || '0') >= 60 ? 'text-amber-600' : 'text-red-600'
                  return (
                    <tr key={s.student_id} className="hover:bg-blue-50/30 transition">
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-500 text-[11px] sm:text-xs">{i + 1}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 font-mono text-[11px] sm:text-xs">{s.nisn || '-'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 font-semibold text-gray-800 text-xs sm:text-sm">{s.nama}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-600">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-[11px] sm:text-xs text-gray-600 hidden md:table-cell">{s.kelas || '-'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-[11px] sm:text-xs text-gray-600 hidden md:table-cell">{s.jurusan || '-'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 text-[11px] sm:text-xs hidden lg:table-cell">{s.industry_supervisor || '-'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-gray-600 text-[11px] sm:text-xs hidden lg:table-cell">{s.guru_pembimbing || '-'}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-emerald-700 font-semibold">{s.Hadir || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-amber-700">{s.Sakit || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-blue-700">{s.Izin || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-red-700 font-semibold">{s.Alpha || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-orange-700">{s.Terlambat || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-500">{s.Libur || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs text-gray-800 font-semibold">{s.totalKerja || 0}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-[11px] sm:text-xs font-bold"><span className={pctColor}>{s.persentase || '0.0'}%</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========== MODAL DETAIL ABSENSI ========== */}
      {detailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { setDetailModal(false); setDetailData(null) }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-3.5 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-white font-bold text-sm sm:text-base">Detail Absensi PKL</h2>
              <button onClick={() => { setDetailModal(false); setDetailData(null) }} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"><X size={18} /></button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
                <span className="text-gray-500 text-sm">Memuat detail...</span>
              </div>
            ) : detailData ? (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Info Siswa */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold shrink-0">
                    {(detailData.siswa?.nama || '?')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{detailData.siswa?.nama || '-'}</p>
                    <p className="text-gray-500 text-xs">{detailData.siswa?.nisn || '-'} · {detailData.siswa?.kelas || '-'} {detailData.siswa?.jurusan || ''}</p>
                  </div>
                </div>

                {/* Status & Tanggal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Tanggal</p>
                    <p className="text-gray-800 text-sm font-bold">{detailData.attendance_date ? new Date(detailData.attendance_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                      {statusBadge(detailData.status)}
                      <span className="text-gray-800 text-sm font-semibold">{detailData.status || '-'}</span>
                      {detailData.is_late && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">Terlambat</span>}
                    </div>
                  </div>
                </div>

                {/* Jam Masuk & Pulang */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LogIn size={12} className="text-emerald-600" />
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase">Jam Masuk</p>
                    </div>
                    <p className="text-gray-800 text-lg font-extrabold">{detailData.check_in_time || '-'}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LogOut size={12} className="text-indigo-600" />
                      <p className="text-[10px] text-indigo-700 font-semibold uppercase">Jam Pulang</p>
                    </div>
                    <p className="text-gray-800 text-lg font-extrabold">{detailData.check_out_time || '-'}</p>
                  </div>
                </div>

                {/* Foto Selfie */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Camera size={12} className="text-teal-600" />
                      <p className="text-[10px] text-gray-600 font-semibold uppercase">Selfie Masuk</p>
                    </div>
                    {detailData.selfie_url ? (
                      <img
                        src={detailData.selfie_url}
                        alt="Selfie Masuk"
                        className="w-full h-28 sm:h-32 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                        onClick={() => setSelfieZoom(detailData.selfie_url)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-28 sm:h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1">
                        <Camera size={20} className="text-gray-300" />
                        <span className="text-gray-400 text-[10px]">Foto sudah dihapus</span>
                        <span className="text-gray-400 text-[9px]">(otomatis &gt; 1 hari)</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Camera size={12} className="text-violet-600" />
                      <p className="text-[10px] text-gray-600 font-semibold uppercase">Selfie Pulang</p>
                    </div>
                    {detailData.check_out_selfie_url ? (
                      <img
                        src={detailData.check_out_selfie_url}
                        alt="Selfie Pulang"
                        className="w-full h-28 sm:h-32 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-violet-400 transition"
                        onClick={() => setSelfieZoom(detailData.check_out_selfie_url)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-28 sm:h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1">
                        <Camera size={20} className="text-gray-300" />
                        <span className="text-gray-400 text-[10px]">{detailData.check_out_time ? 'Foto sudah dihapus' : 'Belum absen pulang'}</span>
                        <span className="text-gray-400 text-[9px]">(otomatis &gt; 1 hari)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lokasi GPS */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-red-500" />
                    <p className="text-[10px] text-gray-600 font-semibold uppercase">Lokasi GPS</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <p className="text-[10px] text-gray-400">Lat Masuk</p>
                      <p className="text-gray-800 text-xs font-mono">{detailData.check_in_latitude || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Long Masuk</p>
                      <p className="text-gray-800 text-xs font-mono">{detailData.check_in_longitude || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Lat Pulang</p>
                      <p className="text-gray-800 text-xs font-mono">{detailData.check_out_latitude || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Long Pulang</p>
                      <p className="text-gray-800 text-xs font-mono">{detailData.check_out_longitude || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {detailData.check_in_address && <p className="text-gray-600 text-[11px]">📍 Masuk: {detailData.check_in_address}</p>}
                    {detailData.check_out_address && <p className="text-gray-600 text-[11px]">📍 Pulang: {detailData.check_out_address}</p>}
                  </div>
                  {(detailData.check_in_latitude && detailData.check_in_longitude) && (
                    <a href={`https://www.google.com/maps?q=${detailData.check_in_latitude},${detailData.check_in_longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-800 transition">
                      <MapPin size={11} /> Buka Lokasi Masuk di Maps
                    </a>
                  )}
                  {(detailData.check_out_latitude && detailData.check_out_longitude) && (
                    <a href={`https://www.google.com/maps?q=${detailData.check_out_latitude},${detailData.check_out_longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-800 transition ml-3">
                      <MapPin size={11} /> Buka Lokasi Pulang di Maps
                    </a>
                  )}
                </div>

                {/* Catatan */}
                {detailData.note && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-[10px] text-amber-700 font-semibold uppercase mb-1">Catatan</p>
                    <p className="text-gray-800 text-sm">{detailData.note}</p>
                  </div>
                )}

                {/* Profil PKL */}
                {pkl && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3 border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-blue-600" />
                      <p className="text-blue-800 font-bold text-sm">Profil PKL</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div><p className="text-gray-500 text-[10px]">Perusahaan</p><p className="text-gray-800 font-semibold">{pkl.company_name || '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Status PKL</p><p className="font-semibold"><span className={`px-2 py-0.5 rounded-full text-[10px] ${pkl.status === 'Berjalan' ? 'bg-emerald-100 text-emerald-700' : pkl.status === 'Selesai' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{pkl.status || '-'}</span></p></div>
                      <div className="col-span-2"><p className="text-gray-500 text-[10px]">Alamat PKL</p><p className="text-gray-800 font-semibold">{pkl.company_address || '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Pembimbing Industri</p><p className="text-gray-800 font-semibold">{pkl.industry_supervisor || '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Guru Pembimbing</p><p className="text-gray-800 font-semibold">{pkl.guru_pembimbing || '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Periode</p><p className="text-gray-800 font-semibold">{pkl.start_date && pkl.end_date ? `${new Date(pkl.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} — ${new Date(pkl.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Jam Kerja</p><p className="text-gray-800 font-semibold">{pkl.work_start_time && pkl.work_end_time ? `${pkl.work_start_time} — ${pkl.work_end_time}` : '-'}</p></div>
                      <div className="col-span-2"><p className="text-gray-500 text-[10px]">Hari Kerja</p><p className="text-gray-800 font-semibold">{Array.isArray(pkl.work_days) ? pkl.work_days.join(', ') : '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Koordinat Lokasi</p><p className="text-gray-800 font-mono text-[11px]">{pkl.latitude && pkl.longitude ? `${pkl.latitude}, ${pkl.longitude}` : '-'}</p></div>
                      <div><p className="text-gray-500 text-[10px]">Radius Absensi</p><p className="text-gray-800 font-semibold">{pkl.radius_meter ? `${pkl.radius_meter} meter` : '-'}</p></div>
                    </div>
                    {pkl.latitude && pkl.longitude && (
                      <a href={`https://www.google.com/maps?q=${pkl.latitude},${pkl.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-800 transition">
                        <MapPin size={11} /> Buka Lokasi PKL di Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertTriangle size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Data tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL ZOOM SELFIE ========== */}
      {selfieZoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4" onClick={() => setSelfieZoom(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-md w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelfieZoom(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition"><X size={16} /></button>
            <img src={selfieZoom} alt="Selfie Zoom" className="w-full rounded-2xl shadow-2xl" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

      {/* ========== MODAL RESET SEMUA ========== */}
      {showResetModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { setShowResetModal(false); setResetStep(1); setResetText('') }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {resetStep === 1 ? (
              <>
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2"><AlertTriangle size={18} /> Reset Semua Data PKL</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-800 text-sm font-semibold">⚠️ Peringatan!</p>
                    <ul className="mt-2 space-y-1 text-red-700 text-xs list-disc list-inside">
                      <li>Semua data absensi PKL akan dihapus permanen</li>
                      <li>Semua profil PKL siswa akan dihapus permanen</li>
                      <li>Tindakan ini <strong>tidak dapat dibatalkan</strong></li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowResetModal(false); setResetStep(1); setResetText('') }} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Batal</button>
                    <button onClick={handleReset} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition">Lanjutkan</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4">
                  <h3 className="text-white font-bold text-base">Konfirmasi Penghapusan</h3>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-gray-700 text-sm">Ketik <strong className="text-red-600">HAPUS SEMUA</strong> untuk mengkonfirmasi:</p>
                  <input ref={resetInputRef} type="text" value={resetText} onChange={e => setResetText(e.target.value)} placeholder="HAPUS SEMUA" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-red-500 focus:outline-none text-gray-800" />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowResetModal(false); setResetStep(1); setResetText('') }} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition" disabled={resetting}>Batal</button>
                    <button onClick={handleReset} disabled={resetText !== 'HAPUS SEMUA' || resetting} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {resetting ? <><Loader2 size={14} className="animate-spin" /> Menghapus...</> : 'Hapus Permanen'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL HAPUS DATA SELESAI ========== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {deleteStep === 1 ? (
              <>
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2"><AlertTriangle size={18} /> Hapus Data PKL Selesai</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-800 text-sm font-semibold">⚠️ Perhatian</p>
                    <p className="mt-1 text-red-700 text-xs">Akan menghapus data <strong>{selesaiIds.length} siswa</strong> dengan status PKL <strong>Selesai</strong> (profil + seluruh riwayat absensi).</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-amber-800 text-sm font-semibold">💡 Saran</p>
                    <p className="mt-1 text-amber-700 text-xs">Sebaiknya unduh arsip data terlebih dahulu melalui tombol CSV/PDF sebelum menghapus.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Batal</button>
                    <button onClick={handleDeleteCompleted} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition">Lanjutkan</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4">
                  <h3 className="text-white font-bold text-base">Konfirmasi Penghapusan</h3>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-gray-700 text-sm">Ketik <strong className="text-red-600">HAPUS SELESAI</strong> untuk mengkonfirmasi:</p>
                  <input ref={deleteInputRef} type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="HAPUS SELESAI" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono focus:border-red-500 focus:outline-none text-gray-800" />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); setDeleteConfirmText('') }} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition" disabled={deletingCompleted}>Batal</button>
                    <button onClick={handleDeleteCompleted} disabled={deleteConfirmText !== 'HAPUS SELESAI' || deletingCompleted} className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {deletingCompleted ? <><Loader2 size={14} className="animate-spin" /> Menghapus data...</> : 'Hapus Permanen'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}