"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  RefreshCw, CheckCircle, AlertTriangle, Info,
  Activity, Search, FileText, FileSpreadsheet, X,
  GraduationCap, Trash2, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getRekapKehadiran, resetSemesterAbsensi, resetAllAbsensi } from '@/app/actions/rekapActions'
import { getKelasFilters, getWKKelasAssignment, getUserKelasInfo } from '@/app/actions/absensiActions'
import { getKopSuratSettings } from '@/app/actions/siswaActions'
import { generateKopSuratHTML } from '@/lib/kopSuratHelper'
import PJInfoCard from '@/app/components/PJInfoCard'
import { getHolidays } from '@/app/actions/effectiveDaysActions'

const ALL_MONTHS = [
  { name: 'Juli', m: 7 }, { name: 'Agustus', m: 8 }, { name: 'September', m: 9 },
  { name: 'Oktober', m: 10 }, { name: 'November', m: 11 }, { name: 'Desember', m: 12 },
  { name: 'Januari', m: 1 }, { name: 'Februari', m: 2 }, { name: 'Maret', m: 3 },
  { name: 'April', m: 4 }, { name: 'Mei', m: 5 }, { name: 'Juni', m: 6 }
]

const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
const BULAN_NAMES = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// ── Warna Header Hari Libur per Kategori (gelap, untuk header tabel bulanan) ──
const HOLIDAY_HEADER_BG = {
  'Nasional': 'bg-rose-500',
  'Sekolah': 'bg-amber-500',
  'Semester': 'bg-violet-500',
  'Ujian': 'bg-blue-500',
  'Kegiatan Sekolah': 'bg-teal-500',
  'Khusus': 'bg-gray-400',
}
const WEEKEND_HEADER_BG = 'bg-red-700'

// ── Warna Body Hari Libur per Kategori (terang, untuk sel data bulanan) ──
const HOLIDAY_BODY_BG = {
  'Nasional': 'bg-rose-100',
  'Sekolah': 'bg-amber-100',
  'Semester': 'bg-violet-100',
  'Ujian': 'bg-blue-100',
  'Kegiatan Sekolah': 'bg-teal-100',
  'Khusus': 'bg-gray-200',
}
const WEEKEND_BODY_BG = 'bg-red-700'

// ── Warna Teks Inisial Hari di Body per Kategori ──
const HOLIDAY_BODY_TEXT = {
  'Nasional': 'text-rose-300',
  'Sekolah': 'text-amber-400',
  'Semester': 'text-violet-300',
  'Ujian': 'text-blue-300',
  'Kegiatan Sekolah': 'text-teal-300',
  'Khusus': 'text-gray-400',
}
const WEEKEND_BODY_TEXT = 'text-red-200'

// ── Warna Hari Libur untuk Export PDF ──
const HOLIDAY_PDF_COLORS = {
  'Nasional':         { headerBg: '#f43f5e', headerText: '#ffffff', bodyBg: '#ffe4e6', bodyText: '#9f1239' },
  'Sekolah':          { headerBg: '#f59e0b', headerText: '#ffffff', bodyBg: '#fef3c7', bodyText: '#92400e' },
  'Semester':         { headerBg: '#8b5cf6', headerText: '#ffffff', bodyBg: '#ede9fe', bodyText: '#5b21b6' },
  'Ujian':            { headerBg: '#3b82f6', headerText: '#ffffff', bodyBg: '#dbeafe', bodyText: '#1e40af' },
  'Kegiatan Sekolah': { headerBg: '#14b8a6', headerText: '#ffffff', bodyBg: '#ccfbf1', bodyText: '#115e59' },
  'Khusus':           { headerBg: '#9ca3af', headerText: '#ffffff', bodyBg: '#f3f4f6', bodyText: '#374151' },
}
const WEEKEND_PDF_COLORS = { headerBg: '#b91c1c', headerText: '#ffffff', bodyBg: '#b91c1c', bodyText: '#fecaca' }

function CountUp({ end, duration = 1200 }) {
  const [count, setCount] = useState(0)
  const prevEnd = useRef(0)
  useEffect(() => {
    if (end === prevEnd.current && end !== 0) return
    const startVal = prevEnd.current
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startVal + (end - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevEnd.current = end
  }, [end, duration])
  return <span>{count}</span>
}

const StatusBadge = ({ status }) => {
  const config = {
    'Hadir': { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'H' },
    'Sakit': { color: 'bg-amber-100 text-amber-700', icon: Activity, label: 'S' },
    'Izin': { color: 'bg-blue-100 text-blue-700', icon: Info, label: 'I' },
    'Alpha': { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'A' },
  }
  const c = config[status] || config['Alpha']
  const Icon = c.icon
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${c.color}`}><Icon size={12}/> {c.label}</span>
}

const SumberBadge = ({ sumber }) => {
  const text = sumber || '-'
  let style = 'bg-gray-100 text-gray-600'
  let icon = '📝'
  if (text.includes('QR')) { style = 'bg-purple-100 text-purple-700'; icon = '📱' }
  else if (text.includes('Sistem')) { style = 'bg-red-100 text-red-700'; icon = '🤖' }
  else if (text.includes('Sekretaris')) { style = 'bg-indigo-100 text-indigo-700'; icon = '📋' }
  else if (text.includes('Administrator')) { style = 'bg-blue-100 text-blue-700'; icon = '🛡️' }
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${style}`}>{icon} {text}</span>
}

export default function RekapKehadiran() {
  const today = new Date().toISOString().split('T')[0]
  const [user, setUser] = useState(null)
  const [dateFilter, setDateFilter] = useState(today)
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [jurusanFilter, setJurusanFilter] = useState('')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('harian')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [resettingAll, setResettingAll] = useState(false)
  const [toast, setToast] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [kelasJurusanList, setKelasJurusanList] = useState([])
  const [wkNeedsJurusanSelection, setWkNeedsJurusanSelection] = useState(false)
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [excelTingkat, setExcelTingkat] = useState('')
  const [excelLoading, setExcelLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState(new Set(['harian']))
  const pathname = usePathname()

  const blackText = { color: '#1f2937' }
  const tingkatOptions = [...new Set(kelasJurusanList.map(c => c.kelas))].sort()
  const jurusanOptions = tingkatFilter
    ? [...new Set(kelasJurusanList.filter(c => c.kelas === tingkatFilter).map(c => c.jurusan))].sort()
    : [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()
  const currentYear = parseInt(dateFilter.substring(0, 4))
  const currentMonth = parseInt(dateFilter.substring(5, 7))
  const academicStartYear = currentMonth >= 7 ? currentYear : currentYear - 1
  const semMonths = currentMonth >= 7 ? ALL_MONTHS.filter(m => m.m >= 7) : ALL_MONTHS.filter(m => m.m <= 6)
  const semNum = currentMonth >= 7 ? 1 : 2
  const filterMonth = parseInt(dateFilter.substring(5, 7))
  const filterYear = parseInt(dateFilter.substring(0, 4))
  const bulanName = BULAN_NAMES[filterMonth] || ''
  const daysInMonth = new Date(filterYear, filterMonth, 0).getDate()

  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      if (u.role === 'Wali Kelas' && u.id) {
        const initWKFilter = async () => {
          let dbKelas = null, dbJurusan = null
          try { const dbInfo = await getUserKelasInfo(u.id); dbKelas = dbInfo.kelas; dbJurusan = dbInfo.jurusan } catch (e) { console.error(e) }
          const kelas = dbKelas || u.kelas || ''
          const jurusan = dbJurusan || u.jurusan || ''
          if (!kelas) return
          setTingkatFilter(kelas)
          if (jurusan) { setJurusanFilter(jurusan); setWkNeedsJurusanSelection(false) }
          else {
            try {
              const assignment = await getWKKelasAssignment(u.id)
              if (assignment && assignment.jurusan) { setJurusanFilter(assignment.jurusan); setWkNeedsJurusanSelection(false) }
              else if (assignment && assignment.needsSelection) { setWkNeedsJurusanSelection(true) }
              else { setWkNeedsJurusanSelection(false) }
            } catch (e) { setWkNeedsJurusanSelection(false) }
          }
        }
        initWKFilter()
      }
    }
  }, [])

  // ── Fetch holidays + auto-sync saat admin edit di Halaman Hari Efektif ──
  useEffect(() => {
    const fetchHolidays = async () => {
      const h = await getHolidays()
      if (h) setHolidays(h)
    }
    // Fetch langsung saat pertama kali / navigasi kembali
    fetchHolidays()
    // Polling setiap 15 detik — menangani cache server yang belum ter-invalidate
    // di lingkungan serverless (Vercel) dimana cold start bisa pakai instance berbeda
    const interval = setInterval(fetchHolidays, 15000)
    return () => clearInterval(interval)
  }, [pathname]) // Re-run saat user navigasi kembali ke halaman ini
  useEffect(() => { const f = async () => { const res = await getKelasFilters(); if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList) }; f() }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRekapKehadiran({ date: dateFilter, tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userId: user?.id })
      if (res.error) { setStudents([]); setAttendance([]) } else { setStudents(res.students || []); setAttendance(res.attendance || []) }
    } catch (e) { setStudents([]); setAttendance([]) }
    setLoading(false)
  }, [dateFilter, tingkatFilter, jurusanFilter, user])

  useEffect(() => {
    if (!tingkatFilter) return
    if (user?.role === 'Wali Kelas' && wkNeedsJurusanSelection && !jurusanFilter) return
    fetchData()
  }, [fetchData, tingkatFilter, jurusanFilter, wkNeedsJurusanSelection, user?.role])

  // ── OPTIMASI: Lazy load tab — load data saat tab pertama kali diklik ──
useEffect(() => {
  if (!loadedTabs.has(activeTab)) {
    // Tab yang belum pernah di-load akan trigger fetchData
    // Data attendance sudah lengkap dari fetchData pertama (harian),
    // tapi useMemo/kalkulasi per tab baru di-render saat tab aktif
    setLoadedTabs(prev => new Set([...prev, activeTab]))
  }
}, [activeTab])

// ── OPTIMASI: Reset loaded tabs saat filter berubah ──
useEffect(() => {
  // Saat filter berganti, reset supaya tab lain di-reload ulang
  setLoadedTabs(new Set(['harian']))
}, [dateFilter, tingkatFilter, jurusanFilter])

  const handleTingkatChange = (val) => { setTingkatFilter(val); setJurusanFilter('') }
  const showToast = (message, type = 'success') => { setToast({ message, type, key: Date.now() }); setTimeout(() => setToast(null), 3000) }

  const todayAttendance = attendance.filter(a => a.tanggal === dateFilter)
  const stats = {
    total: students.length,
    hadir: todayAttendance.filter(a => a.status === 'Hadir').length,
    sakit: todayAttendance.filter(a => a.status === 'Sakit').length,
    izin: todayAttendance.filter(a => a.status === 'Izin').length,
    alpha: todayAttendance.filter(a => a.status === 'Alpha').length,
    persentase: students.length > 0 ? Math.round((todayAttendance.filter(a => a.status === 'Hadir').length / students.length) * 100) : 0
  }

  const getStudentAttendance = (siswaId, date) => attendance.find(a => a.siswa_id === siswaId && a.tanggal === date)
  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn?.toLowerCase().includes(searchTerm.toLowerCase()))

  const getMonthAtt = (siswaId, monthIndex, attData = null) => {
    const mStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`
    const yStr = monthIndex >= 7 ? academicStartYear.toString() : (academicStartYear + 1).toString()
    const useAtt = attData || attendance
    return useAtt.filter(a => a.siswa_id === siswaId && a.tanggal.startsWith(`${yStr}-${mStr}`))
  }

  const getCounts = (attList) => ({
    h: attList.filter(a => a.status === 'Hadir').length,
    s: attList.filter(a => a.status === 'Sakit').length,
    i: attList.filter(a => a.status === 'Izin').length,
    a: attList.filter(a => a.status === 'Alpha').length
  })

  const getCountsWithAlpha = (siswaId, monthIndex, attData = null, holData = null) => {
    const mStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`
    const yStr = monthIndex >= 7 ? academicStartYear.toString() : (academicStartYear + 1).toString()
    const monthStr = `${yStr}-${mStr}`
    const useAtt = attData || attendance
    const monthAtt = useAtt.filter(a => a.siswa_id === siswaId && a.tanggal.startsWith(monthStr))
    let h = 0, s = 0, i = 0, explicitA = 0
    monthAtt.forEach(a => {
      if (a.status === 'Hadir') h++
      else if (a.status === 'Sakit') s++
      else if (a.status === 'Izin') i++
      else if (a.status === 'Alpha') explicitA++
    })
    const [year, month] = monthStr.split('-').map(Number)
    const dim = new Date(year, month, 0).getDate()
    let pastEff = 0
    for (let d = 1; d <= dim; d++) {
      const ds = `${monthStr}-${d < 10 ? '0' + d : d}`
      if (ds <= today && !isHoliday(ds, holData)) pastEff++
    }
    const implicitA = Math.max(0, pastEff - h - s - i - explicitA)
    return { h, s, i, a: explicitA + implicitA }
  }

  const isHoliday = (dateStr, holData = null) => {
    const useHol = holData || holidays
    const day = new Date(dateStr + 'T00:00:00').getDay()
    if (day === 0 || day === 6) return true
    return useHol.some(h => h.date === dateStr)
  }

    // ── Dapatkan info libur per tanggal: weekend atau kategori + nama ──
  const getHolidayInfo = (dateStr) => {
    const day = new Date(dateStr + 'T00:00:00').getDay()
    if (day === 0 || day === 6) return { type: 'weekend' }
    const holi = holidays.find(h => h.date === dateStr)
    if (holi) return { type: 'holiday', category: holi.category, holiday_name: holi.holiday_name }
    return null
  }

  const getEffectiveDaysInMonth = (monthStr, holData = null) => {
    const [year, month] = monthStr.split('-').map(Number)
    const dim = new Date(year, month, 0).getDate()
    let eff = 0
    for (let i = 1; i <= dim; i++) {
      const ds = `${monthStr}-${i < 10 ? '0' + i : i}`
      if (!isHoliday(ds, holData)) eff++
    }
    return eff
  }

  const getTotalEffectiveDays = (monthsToShow, holData = null) => {
    let total = 0
    monthsToShow.forEach(m => {
      const yStr = m.m >= 7 ? academicStartYear.toString() : (academicStartYear + 1).toString()
      const mStr = m.m < 10 ? `0${m.m}` : `${m.m}`
      total += getEffectiveDaysInMonth(`${yStr}-${mStr}`, holData)
    })
    return total
  }

  const handleResetSemester = async () => {
    if (!confirm('PERHATIAN!\nSemua data absensi SEMESTER ini akan dihapus permanen.\nLanjutkan?')) return
    setResetting(true)
    const res = await resetSemesterAbsensi({ date: dateFilter, tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userId: user?.id })
    if (res.error) { showToast(res.error, 'error') } else { showToast('Data absensi semester berhasil direset!'); fetchData() }
    setResetting(false)
  }

  const handleResetAll = async () => {
    if (!confirm('PERHATIAN!\nSemua data absensi TAHUN AJARAN ini akan dihapus permanen.\nLanjutkan?')) return
    setResettingAll(true)
    const res = await resetAllAbsensi({ tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userId: user?.id })
    if (res.error) { showToast(res.error, 'error') } else { showToast('Semua data absensi berhasil direset!'); fetchData() }
    setResettingAll(false)
  }

  // ================================================================
  // EXPORT CSV — Dinamis sesuai tab aktif
  // ================================================================
  const handleExportCSV = () => {
    const kelasLabel = `${tingkatFilter} ${jurusanFilter}`.trim()
    let headers = [], rows = [], filename = ''

    if (activeTab === 'harian') {
      headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'Status', 'Waktu', 'Sumber']
      rows = filteredStudents.map((s, idx) => {
        const att = getStudentAttendance(s.id, dateFilter)
        return [idx + 1, s.nisn || '', s.nama, s.jenis_kelamin, s.kelas, s.jurusan, att?.status || 'Alpha', att?.created_at ? new Date(att.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-', att?.input_by || '-']
      })
      filename = `Rekap_Harian_${kelasLabel}_${dateFilter}.csv`
    } else if (activeTab === 'bulanan') {
      const monthStr = dateFilter.substring(0, 7)
      const effDays = getEffectiveDaysInMonth(monthStr)
      headers = ['No', 'NISN', 'Nama Siswa', 'L/P']
      for (let i = 1; i <= daysInMonth; i++) headers.push(`${i}`)
      headers.push('Hari Efektif', 'H', 'S', 'I', 'A', '%Hadir')
      rows = filteredStudents.map((s, idx) => {
        const row = [idx + 1, s.nisn, s.nama, s.jenis_kelamin]
        let cH = 0, cS = 0, cI = 0, cA = 0
        for (let d = 1; d <= daysInMonth; d++) {
          const dayStr = d < 10 ? `0${d}` : `${d}`
          const dateStr = `${monthStr}-${dayStr}`
          const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
          if (isHoliday(dateStr)) { row.push('L') } else {
            if (dateStr <= today) cA++
            if (att) {
              if (att.status === 'Hadir') { row.push('H'); cH++; if (dateStr <= today) cA-- }
              else if (att.status === 'Sakit') { row.push('S'); cS++; if (dateStr <= today) cA-- }
              else if (att.status === 'Izin') { row.push('I'); cI++; if (dateStr <= today) cA-- }
              else { row.push('A') }
            } else { row.push(dateStr <= today ? 'A' : '') }
          }
        }
        row.push(effDays, cH, cS, cI, cA, effDays > 0 ? Math.round((cH / effDays) * 100) + '%' : '0%')
        return row
      })
      filename = `Rekap_Bulanan_${kelasLabel}_${monthStr}.csv`
    } else if (activeTab === 'semester') {
      const totalEff = getTotalEffectiveDays(semMonths)
      headers = ['No', 'NISN', 'Nama Siswa', 'L/P']
      semMonths.forEach(m => { headers.push(`${m.name} H`, `${m.name} S`, `${m.name} I`, `${m.name} A`) })
      headers.push('Hari Efektif', 'Total H', 'Total S', 'Total I', 'Total A', '%Hadir')
      rows = filteredStudents.map((s, idx) => {
        const row = [idx + 1, s.nisn || '', s.nama, s.jenis_kelamin]
        let tH = 0, tS = 0, tI = 0, tA = 0
        semMonths.forEach(m => {
          const c = getCountsWithAlpha(s.id, m.m)
          tH += c.h; tS += c.s; tI += c.i; tA += c.a
          row.push(c.h, c.s, c.i, c.a)
        })
        row.push(totalEff, tH, tS, tI, tA, totalEff > 0 ? Math.round((tH / totalEff) * 100) + '%' : '0%')
        return row
      })
      filename = `Rekap_Semester${semNum}_${kelasLabel}_${academicStartYear}-${academicStartYear + 1}.csv`
    } else if (activeTab === 'tahunan') {
      const totalEff = getTotalEffectiveDays(ALL_MONTHS)
      headers = ['No', 'NISN', 'Nama Siswa', 'L/P']
      ALL_MONTHS.forEach(m => { headers.push(`${m.name} H`, `${m.name} S`, `${m.name} I`, `${m.name} A`) })
      headers.push('Hari Efektif', 'Total H', 'Total S', 'Total I', 'Total A', '%Hadir')
      rows = filteredStudents.map((s, idx) => {
        const row = [idx + 1, s.nisn || '', s.nama, s.jenis_kelamin]
        let tH = 0, tS = 0, tI = 0, tA = 0
        ALL_MONTHS.forEach(m => {
          const c = getCountsWithAlpha(s.id, m.m)
          tH += c.h; tS += c.s; tI += c.i; tA += c.a
          row.push(c.h, c.s, c.i, c.a)
        })
        row.push(totalEff, tH, tS, tI, tA, totalEff > 0 ? Math.round((tH / totalEff) * 100) + '%' : '0%')
        return row
      })
      filename = `Rekap_Tahunan_${kelasLabel}_${academicStartYear}-${academicStartYear + 1}.csv`
    }

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    showToast(`CSV ${activeTab} berhasil diunduh!`)
  }

  // ================================================================
  // EXPORT PDF — Dinamis sesuai tab aktif
  // ================================================================
  const handleExportPDF = async () => {
    const kopSettings = await getKopSuratSettings()
    const kopHTML = await generateKopSuratHTML(kopSettings)
    const kelasLabel = `${tingkatFilter} ${jurusanFilter}`.trim()
    const w = window.open('', '_blank')
    let bodyContent = '', title = '', subtitle = '', pageCss = ''

    if (activeTab === 'harian') {
      title = 'REKAP KEHADIRAN HARIAN'
      subtitle = `Tanggal: ${new Date(dateFilter).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Kelas: ${kelasLabel}`
      const rowsHtml = filteredStudents.map((s, idx) => {
        const att = getStudentAttendance(s.id, dateFilter)
        const st = att?.status || 'Alpha'
        const stColor = st === 'Hadir' ? '#047857' : st === 'Sakit' ? '#b45309' : st === 'Izin' ? '#1d4ed8' : '#b91c1c'
        return `<tr><td style="border:1px solid #000;padding:5px;text-align:center">${idx + 1}</td><td style="border:1px solid #000;padding:5px;font-size:10px">${s.nisn || '—'}</td><td style="border:1px solid #000;padding:5px;font-size:10px;font-weight:bold">${s.nama}</td><td style="border:1px solid #000;padding:5px;text-align:center">${s.jenis_kelamin}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px">${s.kelas}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px">${s.jurusan}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;color:${stColor}">${st}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px">${att?.created_at ? new Date(att.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-size:10px">${att?.input_by || '-'}</td></tr>`
      }).join('')
      bodyContent = `<table><thead><tr><th style="border:1px solid #000;padding:6px;width:30px">No</th><th style="border:1px solid #000;padding:6px">NISN</th><th style="border:1px solid #000;padding:6px">Nama Siswa</th><th style="border:1px solid #000;padding:6px;width:30px">L/P</th><th style="border:1px solid #000;padding:6px;width:50px">Kelas</th><th style="border:1px solid #000;padding:6px">Jurusan</th><th style="border:1px solid #000;padding:6px;width:60px">Status</th><th style="border:1px solid #000;padding:6px;width:60px">Waktu</th><th style="border:1px solid #000;padding:6px">Sumber</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
    } else if (activeTab === 'bulanan') {
      title = 'REKAP KEHADIRAN BULANAN'
      subtitle = `${bulanName} ${filterYear} — Kelas: ${kelasLabel}`
      pageCss = '@page{size:landscape}'
      const effDays = getEffectiveDaysInMonth(dateFilter.substring(0, 7))
      // ── Header PDF: warna per kategori ──
      let dayHeaders = ''
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = d < 10 ? `0${d}` : `${d}`
        const dateStr = `${dateFilter.substring(0, 7)}-${dayStr}`
        const holiInfo = getHolidayInfo(dateStr)
        if (holiInfo) {
          const pc = holiInfo.type === 'weekend' ? WEEKEND_PDF_COLORS : (HOLIDAY_PDF_COLORS[holiInfo.category] || HOLIDAY_PDF_COLORS['Khusus'])
          dayHeaders += `<th style="border:1px solid #000;padding:2px;font-size:8px;width:22px;background:${pc.headerBg};color:${pc.headerText}">${d}<br/><span style="font-size:6px;opacity:0.8">${DAY_NAMES_SHORT[new Date(dateStr + 'T00:00:00').getDay()]}</span></th>`
        } else {
          dayHeaders += `<th style="border:1px solid #000;padding:2px;font-size:8px;width:22px">${d}<br/><span style="font-size:6px">${DAY_NAMES_SHORT[new Date(dateStr + 'T00:00:00').getDay()]}</span></th>`
        }
      }
      // ── Body PDF: warna per kategori ──
      const rowsHtml = filteredStudents.map((s, idx) => {
        let cH = 0, cS = 0, cI = 0, cA = 0, dayCells = ''
        for (let d = 1; d <= daysInMonth; d++) {
          const dayStr = d < 10 ? `0${d}` : `${d}`
          const dateStr = `${dateFilter.substring(0, 7)}-${dayStr}`
          const holiInfo = getHolidayInfo(dateStr)
          if (holiInfo) {
            const pc = holiInfo.type === 'weekend' ? WEEKEND_PDF_COLORS : (HOLIDAY_PDF_COLORS[holiInfo.category] || HOLIDAY_PDF_COLORS['Khusus'])
            dayCells += `<td style="border:1px solid #000;padding:1px;text-align:center;background:${pc.bodyBg};font-size:7px;color:${pc.bodyText}">${DAY_NAMES_SHORT[new Date(dateStr + 'T00:00:00').getDay()]}</td>`
          } else {
            const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
            let val = '', color = '#9ca3af'
            if (dateStr <= today) {
              if (att) {
                if (att.status === 'Hadir') { val = 'H'; color = '#047857'; cH++ }
                else if (att.status === 'Sakit') { val = 'S'; color = '#b45309'; cS++ }
                else if (att.status === 'Izin') { val = 'I'; color = '#1d4ed8'; cI++ }
                else { val = 'A'; color = '#b91c1c'; cA++ }
              } else {
                val = 'A'; color = '#b91c1c'; cA++
              }
            }
            dayCells += `<td style="border:1px solid #000;padding:1px;text-align:center;font-size:9px;font-weight:bold;color:${color}">${val}</td>`
          }
        }
        const pct = effDays > 0 ? Math.round((cH / effDays) * 100) : 0
        return `<tr><td style="border:1px solid #000;padding:3px;text-align:center;font-size:9px">${idx + 1}</td><td style="border:1px solid #000;padding:3px;font-size:9px;font-weight:bold">${s.nama}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-size:9px">${s.jenis_kelamin}</td>${dayCells}<td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold;background:#f3f4f6">${effDays}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold;color:#047857">${cH}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold;color:#b45309">${cS}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold;color:#1d4ed8">${cI}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold;color:#b91c1c">${cA}</td><td style="border:1px solid #000;padding:3px;text-align:center;font-weight:bold">${pct}%</td></tr>`
      }).join('')
      // ── Legenda Hari Libur PDF ──
      let legendHtml = ''
      if (monthHolidays.length > 0 || hasWeekendsInMonth) {
        legendHtml = '<div style="margin-top:14px;font-size:9px;line-height:2"><b>Keterangan Hari Libur:</b><br/>'
        monthHolidays.forEach(h => {
          const pc = HOLIDAY_PDF_COLORS[h.category] || HOLIDAY_PDF_COLORS['Khusus']
          const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          legendHtml += `<span style="display:inline-block;width:12px;height:12px;background:${pc.headerBg};border:1px solid #999;margin-right:4px;vertical-align:middle"></span><span style="margin-right:14px">${dateLabel} — ${h.holiday_name}</span>`
        })
        if (hasWeekendsInMonth) {
          legendHtml += `<span style="display:inline-block;width:12px;height:12px;background:${WEEKEND_PDF_COLORS.headerBg};border:1px solid #999;margin-right:4px;vertical-align:middle"></span><span>Sabtu & Minggu</span>`
        }
        legendHtml += '</div>'
      }
      bodyContent = `<table><thead><tr><th rowspan="2" style="border:1px solid #000;padding:4px;width:25px;font-size:9px">No</th><th rowspan="2" style="border:1px solid #000;padding:4px;font-size:9px;min-width:120px">Nama Siswa</th><th rowspan="2" style="border:1px solid #000;padding:4px;width:25px;font-size:9px">L/P</th><th colspan="${daysInMonth}" style="border:1px solid #000;padding:4px;font-size:10px;background:#eff6ff">${bulanName}</th><th rowspan="2" style="border:1px solid #000;padding:4px;width:30px;font-size:8px;background:#f3f4f6">Hari<br/>Efektif</th><th colspan="4" style="border:1px solid #000;padding:4px;font-size:9px">Total</th><th rowspan="2" style="border:1px solid #000;padding:4px;width:30px;font-size:9px">%H</th></tr><tr>${dayHeaders}<th style="border:1px solid #000;padding:3px;font-size:8px;color:#047857;width:28px">H</th><th style="border:1px solid #000;padding:3px;font-size:8px;color:#b45309;width:28px">S</th><th style="border:1px solid #000;padding:3px;font-size:8px;color:#1d4ed8;width:28px">I</th><th style="border:1px solid #000;padding:3px;font-size:8px;color:#b91c1c;width:28px">A</th></tr></thead><tbody>${rowsHtml}</tbody></table>${legendHtml}`
    } else if (activeTab === 'semester') {
      title = 'REKAP KEHADIRAN SISWA'
      subtitle = `Semester ${semNum} Tahun Ajaran ${academicStartYear}/${academicStartYear + 1} — Kelas: ${kelasLabel}`
      pageCss = '@page{size:landscape}'
      const totalEff = getTotalEffectiveDays(semMonths)
      const monthHeaders = semMonths.map(m => `<th style="border:1px solid #000;padding:6px;font-size:10px">${m.name}</th>`).join('')
      const rowsHtml = filteredStudents.map((s, idx) => {
        let tH = 0, tS = 0, tI = 0, tA = 0
        const monthCells = semMonths.map(m => {
          const c = getCountsWithAlpha(s.id, m.m)
          tH += c.h; tS += c.s; tI += c.i; tA += c.a
          return `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:9px"><div style="color:#047857">${c.h > 0 ? c.h + 'H' : ''}</div><div style="color:#b45309">${c.s > 0 ? c.s + 'S' : ''}</div><div style="color:#1d4ed8">${c.i > 0 ? c.i + 'I' : ''}</div><div style="color:#b91c1c">${c.a > 0 ? c.a + 'A' : ''}</div></td>`
        }).join('')
        return `<tr><td style="border:1px solid #000;padding:5px;text-align:center">${idx + 1}</td><td style="border:1px solid #000;padding:5px;font-size:10px">${s.nisn || '—'}</td><td style="border:1px solid #000;padding:5px;font-size:10px;font-weight:bold">${s.nama}</td><td style="border:1px solid #000;padding:5px;text-align:center">${s.jenis_kelamin}</td>${monthCells}<td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;background:#f3f4f6">${totalEff}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;color:#047857">${tH}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;color:#b45309">${tS}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;color:#1d4ed8">${tI}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold;color:#b91c1c">${tA}</td><td style="border:1px solid #000;padding:5px;text-align:center;font-weight:bold">${totalEff > 0 ? Math.round((tH / totalEff) * 100) : 0}%</td></tr>`
      }).join('')
      bodyContent = `<table><thead><tr><th style="width:30px;border:1px solid #000;padding:6px">No</th><th style="border:1px solid #000;padding:6px">NISN</th><th style="border:1px solid #000;padding:6px">Nama Siswa</th><th style="width:30px;border:1px solid #000;padding:6px">L/P</th>${monthHeaders}<th style="border:1px solid #000;padding:6px;background:#f3f4f6">Hari Efektif</th><th style="border:1px solid #000;padding:6px;color:#047857">Total H</th><th style="border:1px solid #000;padding:6px;color:#b45309">Total S</th><th style="border:1px solid #000;padding:6px;color:#1d4ed8">Total I</th><th style="border:1px solid #000;padding:6px;color:#b91c1c">Total A</th><th style="width:40px;border:1px solid #000;padding:6px">%H</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
    } else if (activeTab === 'tahunan') {
      title = 'REKAP KEHADIRAN SISWA'
      subtitle = `Tahunan Tahun Ajaran ${academicStartYear}/${academicStartYear + 1} — Kelas: ${kelasLabel}`
      pageCss = '@page{size:landscape}'
      const totalEff = getTotalEffectiveDays(ALL_MONTHS)
      const monthHeaders = ALL_MONTHS.map(m => `<th style="border:1px solid #000;padding:5px;font-size:9px">${m.name.substring(0, 3)}</th>`).join('')
      const rowsHtml = filteredStudents.map((s, idx) => {
        let tH = 0, tS = 0, tI = 0, tA = 0
        const monthCells = ALL_MONTHS.map(m => {
          const c = getCountsWithAlpha(s.id, m.m)
          tH += c.h; tS += c.s; tI += c.i; tA += c.a
          return `<td style="border:1px solid #000;padding:3px;text-align:center;font-size:8px"><div style="color:#047857">${c.h > 0 ? c.h + 'H' : ''}</div><div style="color:#b45309">${c.s > 0 ? c.s + 'S' : ''}</div><div style="color:#1d4ed8">${c.i > 0 ? c.i + 'I' : ''}</div><div style="color:#b91c1c">${c.a > 0 ? c.a + 'A' : ''}</div></td>`
        }).join('')
        return `<tr><td style="border:1px solid #000;padding:4px;text-align:center;font-size:9px">${idx + 1}</td><td style="border:1px solid #000;padding:4px;font-size:9px;font-weight:bold">${s.nama}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-size:9px">${s.jenis_kelamin}</td>${monthCells}<td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;background:#f3f4f6;font-size:9px">${totalEff}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;color:#047857;font-size:9px">${tH}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;color:#b45309;font-size:9px">${tS}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;color:#1d4ed8;font-size:9px">${tI}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;color:#b91c1c;font-size:9px">${tA}</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:9px">${totalEff > 0 ? Math.round((tH / totalEff) * 100) : 0}%</td></tr>`
      }).join('')
      bodyContent = `<table><thead><tr><th style="width:25px;border:1px solid #000;padding:4px;font-size:9px">No</th><th style="border:1px solid #000;padding:4px;font-size:9px">Nama Siswa</th><th style="width:25px;border:1px solid #000;padding:4px;font-size:9px">L/P</th>${monthHeaders}<th style="border:1px solid #000;padding:4px;background:#f3f4f6;font-size:9px">HE</th><th style="border:1px solid #000;padding:4px;color:#047857;font-size:9px">H</th><th style="border:1px solid #000;padding:4px;color:#b45309;font-size:9px">S</th><th style="border:1px solid #000;padding:4px;color:#1d4ed8;font-size:9px">I</th><th style="border:1px solid #000;padding:4px;color:#b91c1c;font-size:9px">A</th><th style="width:35px;border:1px solid #000;padding:4px;font-size:9px">%H</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
    }

    w.document.write(`<html><head><title>Rekap Kehadiran - ${activeTab}</title><style>${pageCss}body{font-family:Arial,sans-serif;padding:0;margin:20px;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#e5e7eb;border:1px solid #000;padding:6px;font-weight:bold;text-align:center;font-size:10px}@media print{body{margin:0}}</style></head><body>${kopHTML}<div style="text-align:center"><h3 style="margin:0;font-size:14px;text-transform:uppercase">${title}</h3><p style="margin:2px 0 0 0;font-size:12px;font-weight:bold">${subtitle}</p></div>${bodyContent}</body></html>`)
    w.document.close()
    setTimeout(() => { w.print() }, 500)
    showToast(`PDF ${activeTab} berhasil diunduh!`)
  }

  // ================================================================
  // EXPORT EXCEL — Admin only, multi-sheet per jurusan dengan kop surat
  // ================================================================
  const handleExportExcel = async () => {
    if (!excelTingkat) { showToast('Pilih tingkat terlebih dahulu', 'error'); return }
    setExcelLoading(true)
    try {
      const kopSettings = await getKopSuratSettings()
      const schoolName = kopSettings?.nama_sekolah || 'NAMA SEKOLAH'
      const schoolAddr = kopSettings?.alamat || 'ALAMAT SEKOLAH'
      const holData = await getHolidays()
      const useHolidays = holData || []
      const jurusanList = [...new Set(kelasJurusanList.filter(c => c.kelas === excelTingkat).map(c => c.jurusan))].sort()
      if (jurusanList.length === 0) { showToast('Tidak ada jurusan untuk tingkat ini', 'error'); setExcelLoading(false); return }

      const wb = XLSX.utils.book_new()

      for (const jur of jurusanList) {
        const res = await getRekapKehadiran({ date: dateFilter, tingkat: excelTingkat, jurusan: jur, userRole: 'Administrator', userId: user?.id })
        const stu = res.students || []
        const att = res.attendance || []
        const totalEff = getTotalEffectiveDays(semMonths, useHolidays)
        const kelasLabel = `${excelTingkat} ${jur}`
        const aoa = []

        // Baris kop surat
        aoa.push([schoolName, '', '', '', '', '', '', ''])
        aoa.push([schoolAddr, '', '', '', '', '', '', ''])
        aoa.push(['', '', '', '', '', '', '', ''])
        aoa.push(['REKAP KEHADIRAN SISWA', '', '', '', '', '', '', ''])
        aoa.push([`Semester ${semNum} Tahun Ajaran ${academicStartYear}/${academicStartYear + 1}`, '', '', '', '', '', '', ''])
        aoa.push([`Kelas: ${kelasLabel}`, '', '', '', '', '', '', ''])
        aoa.push(['', '', '', '', '', '', '', ''])

        // Header kolom
        const headerRow = ['No', 'NISN', 'Nama Siswa', 'L/P']
        semMonths.forEach(m => { headerRow.push(`${m.name} H`, `${m.name} S`, `${m.name} I`, `${m.name} A`) })
        headerRow.push('Hari Efektif', 'Total H', 'Total S', 'Total I', 'Total A', '% Hadir')
        aoa.push(headerRow)

        // Data siswa
        stu.forEach((s, idx) => {
          const row = [idx + 1, s.nisn || '', s.nama, s.jenis_kelamin]
          let tH = 0, tS = 0, tI = 0, tA = 0
          semMonths.forEach(m => {
            const c = getCountsWithAlpha(s.id, m.m, att, useHolidays)
            tH += c.h; tS += c.s; tI += c.i; tA += c.a
            row.push(c.h, c.s, c.i, c.a)
          })
          row.push(totalEff, tH, tS, tI, tA, totalEff > 0 ? Math.round((tH / totalEff) * 100) + '%' : '0%')
          aoa.push(row)
        })

        const ws = XLSX.utils.aoa_to_sheet(aoa)

        // Lebar kolom
        const colWidths = [{ wch: 5 }, { wch: 14 }, { wch: 25 }, { wch: 5 }]
        semMonths.forEach(() => { colWidths.push({ wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }) })
        colWidths.push({ wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 9 })
        ws['!cols'] = colWidths

        // Merge sel kop surat
        const mc = headerRow.length - 1
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: mc } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: mc } },
          { s: { r: 3, c: 0 }, e: { r: 3, c: mc } },
          { s: { r: 4, c: 0 }, e: { r: 4, c: mc } },
          { s: { r: 5, c: 0 }, e: { r: 5, c: mc } },
        ]

        // Style kop surat
        const kopStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } }
        const addrStyle = { font: { sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' } }
        const titleStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center', vertical: 'center' } }
        const headerStyle = { font: { bold: true, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, fill: { fgColor: { rgb: 'E5E7EB' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } }

        for (let c = 0; c <= mc; c++) {
          const a0 = XLSX.utils.encode_cell({ r: 0, c })
          const a1 = XLSX.utils.encode_cell({ r: 1, c })
          const a3 = XLSX.utils.encode_cell({ r: 3, c })
          const a4 = XLSX.utils.encode_cell({ r: 4, c })
          const a5 = XLSX.utils.encode_cell({ r: 5, c })
          if (ws[a0]) ws[a0].s = kopStyle
          if (ws[a1]) ws[a1].s = addrStyle
          if (ws[a3]) ws[a3].s = titleStyle
          if (ws[a4]) ws[a4].s = addrStyle
          if (ws[a5]) ws[a5].s = { ...addrStyle, font: { bold: true, sz: 11 } }
        }

        // Style header row (baris ke-7)
        for (let c = 0; c < headerRow.length; c++) {
          const a = XLSX.utils.encode_cell({ r: 7, c })
          if (ws[a]) ws[a].s = headerStyle
        }

        // Style data rows
        for (let r = 8; r < aoa.length; r++) {
          for (let c = 0; c < headerRow.length; c++) {
            const a = XLSX.utils.encode_cell({ r, c })
            if (ws[a]) {
              ws[a].s = { font: { sz: 9 }, alignment: { horizontal: c <= 3 ? 'left' : 'center', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } }
            }
          }
        }

        // Warna H/S/I/A
        for (let r = 8; r < aoa.length; r++) {
          let ci = 4
          semMonths.forEach(() => {
            const ha = XLSX.utils.encode_cell({ r, c: ci })
            const sa = XLSX.utils.encode_cell({ r, c: ci + 1 })
            const ia = XLSX.utils.encode_cell({ r, c: ci + 2 })
            const aa = XLSX.utils.encode_cell({ r, c: ci + 3 })
            if (ws[ha]) ws[ha].s.font = { sz: 9, color: { rgb: '047857' } }
            if (ws[sa]) ws[sa].s.font = { sz: 9, color: { rgb: 'B45309' } }
            if (ws[ia]) ws[ia].s.font = { sz: 9, color: { rgb: '1D4ED8' } }
            if (ws[aa]) ws[aa].s.font = { sz: 9, color: { rgb: 'B91C1C' } }
            ci += 4
          })
          const tha = XLSX.utils.encode_cell({ r, c: ci + 1 })
          const tsa = XLSX.utils.encode_cell({ r, c: ci + 2 })
          const tia = XLSX.utils.encode_cell({ r, c: ci + 3 })
          const taa = XLSX.utils.encode_cell({ r, c: ci + 4 })
          if (ws[tha]) ws[tha].s = { ...ws[tha].s, font: { sz: 9, bold: true, color: { rgb: '047857' } } }
          if (ws[tsa]) ws[tsa].s = { ...ws[tsa].s, font: { sz: 9, bold: true, color: { rgb: 'B45309' } } }
          if (ws[tia]) ws[tia].s = { ...ws[tia].s, font: { sz: 9, bold: true, color: { rgb: '1D4ED8' } } }
          if (ws[taa]) ws[taa].s = { ...ws[taa].s, font: { sz: 9, bold: true, color: { rgb: 'B91C1C' } } }
        }

        const sheetName = `${excelTingkat} ${jur}`.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31).trim()
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      XLSX.writeFile(wb, `Rekap_Kehadiran_Semester${semNum}_${excelTingkat}_${academicStartYear}-${academicStartYear + 1}.xlsx`)
      showToast(`Excel ${jurusanList.length} jurusan berhasil diunduh!`)
      setExcelModalOpen(false)
      setExcelTingkat('')
    } catch (e) {
      console.error(e)
      showToast('Gagal mengunduh Excel: ' + (e.message || 'Unknown error'), 'error')
    }
    setExcelLoading(false)
  }

  const isFilterEmpty = !tingkatFilter || !jurusanFilter
  const bulananEffDays = getEffectiveDaysInMonth(dateFilter.substring(0, 7))

    // ── Data hari libur bulan ini untuk legenda ──
  const monthHolidays = useMemo(() => {
    const monthStr = dateFilter.substring(0, 7)
    return holidays
      .filter(h => h.date.startsWith(monthStr))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [holidays, dateFilter])

  const hasWeekendsInMonth = useMemo(() => {
    const dim = new Date(filterYear, filterMonth, 0).getDate()
    for (let d = 1; d <= dim; d++) {
      const day = new Date(filterYear, filterMonth - 1, d).getDay()
      if (day === 0 || day === 6) return true
    }
    return false
  }, [filterYear, filterMonth])

  // ================================================================
  // DATA SISWA KRITIS — hitung SEMUA inline tanpa fungsi eksternal
  // ================================================================
  const kritisData = useMemo(() => {
    if (filteredStudents.length === 0) return null
    const monthStr = dateFilter.substring(0, 7)
    const [y, m] = monthStr.split('-').map(Number)
    const dim = new Date(y, m, 0).getDate()
    const holidaySet = new Set(holidays.map(h => h.date))
    let effDays = 0
    for (let d = 1; d <= dim; d++) {
      const ds = `${monthStr}-${d < 10 ? '0' + d : d}`
      const dayOfWeek = new Date(ds + 'T00:00:00').getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6 || holidaySet.has(ds)) continue
      effDays++
    }
    const list = []
    for (let si = 0; si < filteredStudents.length; si++) {
      const s = filteredStudents[si]
      let ac = 0
      for (let d = 1; d <= dim; d++) {
        const ds = d < 10 ? `0${d}` : `${d}`
        const dateStr = `${monthStr}-${ds}`
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6 || holidaySet.has(dateStr) || dateStr > today) continue
        const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
        if (!att || att.status === 'Alpha') ac++
      }
      if (ac > 3) list.push({ ...s, alphaCount: ac })
    }
    list.sort((a, b) => b.alphaCount - a.alphaCount)
    if (list.length === 0) return null
    const maxA = Math.max(...list.map(s => s.alphaCount))
    const avgA = (list.reduce((sm, s) => sm + s.alphaCount, 0) / list.length).toFixed(1)
    const berat = list.filter(s => s.alphaCount >= 10).length
    const sedang = list.filter(s => s.alphaCount >= 5 && s.alphaCount < 10).length
    const ringan = list.filter(s => s.alphaCount > 3 && s.alphaCount < 5).length
    const donut = filteredStudents.length > 0 ? Math.round((list.length / filteredStudents.length) * 100) : 0
    return { list, maxA, avgA, berat, sedang, ringan, donut, effDays }
  }, [filteredStudents, attendance, dateFilter, daysInMonth, today, holidays])

  // ================================================================
  // LONG TERM VIEW (Semester & Tahunan)
  // ================================================================
  const LongTermView = ({ monthsToShow }) => {
    const totalEffDays = getTotalEffectiveDays(monthsToShow)
    return (
      <div className="p-6 space-y-8">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-100">
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-0 md:bg-gray-100 md:z-30 w-[40px] border-b border-r border-gray-300">No</th>
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[40px] md:bg-gray-100 md:z-30 min-w-[180px] border-b border-r border-gray-300 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.08)]">Nama Siswa</th>
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[220px] md:bg-gray-100 md:z-30 w-[40px] border-b border-r border-gray-300 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.08)]">L/P</th>
                {monthsToShow.map(m => (
                  <th key={m.m} className="py-3 px-4 font-bold text-xs text-gray-600 text-center min-w-[80px] border-b border-r border-gray-300">{m.name}</th>
                ))}
                <th className="py-3 px-4 font-bold text-xs text-gray-800 text-center w-[60px] border-b border-r border-gray-300 bg-gray-200">Hari Efektif</th>
                <th className="py-3 px-4 font-bold text-emerald-600 text-center w-[60px] border-b border-r border-gray-300">Total H</th>
                <th className="py-3 px-4 font-bold text-amber-600 text-center w-[60px] border-b border-r border-gray-300">Total S</th>
                <th className="py-3 px-4 font-bold text-blue-600 text-center w-[60px] border-b border-r border-gray-300">Total I</th>
                <th className="py-3 px-4 font-bold text-red-600 text-center w-[60px] border-b border-r border-gray-300">Total A</th>
                <th className="py-3 px-4 font-bold text-indigo-600 text-center w-[50px] border-b border-gray-300">%H</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => {
                let totalH = 0, totalS = 0, totalI = 0, totalA = 0
                return (
                  <tr key={s.id} className="hover:bg-blue-50/30 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                    <td className="py-3 px-4 text-gray-500 md:sticky md:left-0 md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800 md:sticky md:left-[40px] md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.06)]">{s.nama}</td>
                    <td className="py-3 px-4 text-gray-600 md:sticky md:left-[220px] md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.06)]">{s.jenis_kelamin}</td>
                    {monthsToShow.map(m => {
                      const c = getCountsWithAlpha(s.id, m.m)
                      totalH += c.h; totalS += c.s; totalI += c.i; totalA += c.a
                      return (
                        <td key={m.m} className="py-3 px-4 text-center border-b border-r border-gray-200">
                          <div className="flex flex-col text-[11px] font-semibold leading-tight">
                            <span className="text-emerald-700">{c.h > 0 ? `${c.h} H` : ''}</span>
                            <span className="text-amber-700">{c.s > 0 ? `${c.s} S` : ''}</span>
                            <span className="text-blue-700">{c.i > 0 ? `${c.i} I` : ''}</span>
                            <span className="text-red-700">{c.a > 0 ? `${c.a} A` : ''}</span>
                          </div>
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-center font-bold text-gray-800 bg-gray-50/50 border-b border-r border-gray-200">{totalEffDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/50 border-b border-r border-gray-200">{totalH}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 bg-amber-50/50 border-b border-r border-gray-200">{totalS}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600 bg-blue-50/50 border-b border-r border-gray-200">{totalI}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/50 border-b border-r border-gray-200">{totalA}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50/50 border-b border-gray-200">{totalEffDays > 0 ? Math.round((totalH / totalEffDays) * 100) : 0}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-xs font-medium border border-blue-100">
          ℹ️ Kolom <b>Hari Efektif</b> dihitung otomatis berdasarkan Kalender Pendidikan dan Hari Libur. Persentase Kehadiran dihitung berdasarkan Hari Efektif.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Distribusi Kehadiran Hari Ini</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(#10B981 ${stats.persentase}%, #F59E0B ${stats.total > 0 ? stats.sakit / stats.total * 100 : 0}% ${stats.persentase + (stats.total > 0 ? stats.sakit / stats.total * 100 : 0)}%, #3B82F6 ${stats.total > 0 ? stats.izin / stats.total * 100 : 0}% ${stats.persentase + (stats.total > 0 ? (stats.sakit + stats.izin) / stats.total * 100 : 0)}%, #EF4444 ${stats.total > 0 ? stats.alpha / stats.total * 100 : 0}% 100%)` }}>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                  <span className="text-2xl font-extrabold text-gray-800">{stats.persentase}%</span>
                  <span className="text-[10px] text-gray-500">Kehadiran</span>
                </div>
              </div>
              <div className="space-y-2 text-xs font-semibold" style={{ color: '#1f2937' }}>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Hadir: {stats.hadir}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Sakit: {stats.sakit}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Izin: {stats.izin}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Alpha: {stats.alpha}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Perbandingan Status (Hari Ini)</h3>
            <div className="space-y-3">
              {[{ label: 'Hadir', value: stats.hadir, color: 'bg-emerald-500' }, { label: 'Sakit', value: stats.sakit, color: 'bg-amber-500' }, { label: 'Izin', value: stats.izin, color: 'bg-blue-500' }, { label: 'Alpha', value: stats.alpha, color: 'bg-red-500' }].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1"><span>{item.label}</span><span>{item.value} Siswa</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${item.color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ================================================================
  // RENDER UTAMA
  // ================================================================
  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">

      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {toast.message}
        </div>
      )}

      {/* ========== MODAL DETAIL SISWA ========== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Detail Siswa</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">{selectedStudent.nama?.charAt(0) || '?'}</div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{selectedStudent.nama}</p>
                  <p className="text-sm text-gray-500">NISN: {selectedStudent.nisn || '—'} • {selectedStudent.jenis_kelamin}</p>
                  <p className="text-sm text-gray-500">Kelas: {selectedStudent.kelas} {selectedStudent.jurusan}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-emerald-600 uppercase">Hadir</p><p className="text-xl font-extrabold text-emerald-700">{stats.hadir}</p></div>
                <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-amber-600 uppercase">Sakit</p><p className="text-xl font-extrabold text-amber-700">{stats.sakit}</p></div>
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-blue-600 uppercase">Izin</p><p className="text-xl font-extrabold text-blue-700">{stats.izin}</p></div>
                <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-red-600 uppercase">Alpha</p><p className="text-xl font-extrabold text-red-700">{stats.alpha}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Status Hari Ini</p>
                {(() => {
                  const att = getStudentAttendance(selectedStudent.id, dateFilter)
                  if (att) return (<div className="flex items-center gap-3"><StatusBadge status={att.status} /><span className="text-xs text-gray-500">via {att.input_by || '-'}</span></div>)
                  return <p className="text-sm text-gray-400">Belum ada record</p>
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL EXCEL ADMIN ========== */}
      {excelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !excelLoading && setExcelModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Download size={20} className="text-emerald-600" /></div>
                <div>
                  <h3 className="font-bold text-gray-800">Unduh Excel Rekap Kehadiran</h3>
                  <p className="text-xs text-gray-500">Multi-sheet per jurusan dengan kop surat</p>
                </div>
              </div>
              <button onClick={() => setExcelModalOpen(false)} disabled={excelLoading} className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Pilih Tingkat Kelas</label>
                <select value={excelTingkat} onChange={e => setExcelTingkat(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" style={blackText}>
                  <option value="">-- Pilih Tingkat --</option>
                  {tingkatOptions.map(t => <option key={t} value={t}>Kelas {t}</option>)}
                </select>
              </div>
              {excelTingkat && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 space-y-1">
                  <p className="font-semibold">📋 Informasi:</p>
                  <p>Semester {semNum} Tahun Ajaran {academicStartYear}/{academicStartYear + 1}</p>
                  <p>Jurusan: <b>{[...new Set(kelasJurusanList.filter(c => c.kelas === excelTingkat).map(c => c.jurusan))].sort().join(', ') || '-'}</b></p>
                  <p className="text-emerald-600">Setiap jurusan menjadi sheet terpisah dengan kop surat.</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setExcelModalOpen(false)} disabled={excelLoading} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">Batal</button>
                <button onClick={handleExportExcel} disabled={excelLoading || !excelTingkat} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {excelLoading ? <><RefreshCw size={14} className="animate-spin" /> Mengunduh...</> : <><Download size={14} /> Unduh Excel</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== HEADER ========== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">📅 Rekap Kehadiran Siswa</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{new Date(dateFilter).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>•</span>
            <span>{`Semester ${semNum} Tahun Ajaran ${academicStartYear}/${academicStartYear + 1}`}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Data Terintegrasi & Sinkron
        </div>
      </div>

      {/* ========== FILTER ========== */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Tanggal</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Tingkat</label>
            <select value={tingkatFilter} onChange={e => handleTingkatChange(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas'}>
              <option value="">Pilih Tingkat</option>
              {tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Jurusan & Kelas</label>
            <select value={jurusanFilter} onChange={e => setJurusanFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas' && !wkNeedsJurusanSelection}>
              <option value="">Pilih Jurusan</option>
              {jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <button onClick={fetchData} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm"><Search size={16} /> Tampilkan</button>
          {user?.role !== 'Wali Kelas' && (
            <button onClick={() => { setTingkatFilter(''); setJurusanFilter(''); setDateFilter(today) }} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-semibold"><RefreshCw size={16} /> Reset Filter</button>
          )}
        </div>
      </div>

      {/* ========== EMPTY STATE ========== */}
      {isFilterEmpty && user?.role !== 'Wali Kelas' ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <GraduationCap size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Pilih Tingkat & Jurusan Terlebih Dahulu</p>
        </div>
      ) : (
        <>
          {user?.role === 'Wali Kelas' && wkNeedsJurusanSelection && !jurusanFilter && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">⚠️</div>
              <div>
                <p className="text-sm font-bold text-amber-800">Jurusan kelas binaan Anda belum terdeteksi otomatis</p>
                <p className="text-xs text-amber-600 mt-0.5">Silakan pilih jurusan pada filter di atas.</p>
              </div>
            </div>
          )}

          <PJInfoCard kelas={tingkatFilter} jurusan={jurusanFilter} />

          {/* ========== STAT CARDS ========== */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Siswa', value: stats.total, gradient: 'from-slate-500 to-slate-600' },
              { label: 'Hadir', value: stats.hadir, gradient: 'from-emerald-500 to-emerald-600' },
              { label: 'Sakit', value: stats.sakit, gradient: 'from-amber-500 to-amber-600' },
              { label: 'Izin', value: stats.izin, gradient: 'from-blue-500 to-blue-600' },
              { label: 'Alpha', value: stats.alpha, gradient: 'from-red-500 to-red-600' },
              { label: 'Persentase', value: stats.persentase, suffix: '%', gradient: 'from-indigo-500 to-indigo-600' }
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                <p className="text-xs opacity-90 font-medium">{stat.label}</p>
                <p className="text-3xl font-extrabold tracking-tight mt-1"><CountUp end={stat.value} />{stat.suffix || ''}</p>
              </div>
            ))}
          </div>

          {/* ========== TAB + EXPORT BUTTONS ========== */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-2 flex-wrap">
              {['harian', 'bulanan', 'semester', 'tahunan'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="Cari Nama/NISN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-40" style={blackText} />
              <button onClick={handleExportCSV} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition border border-emerald-200" title={`Unduh CSV tab ${activeTab}`}><FileSpreadsheet size={14} /> CSV</button>
              <button onClick={handleExportPDF} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 transition border border-red-200" title={`Unduh PDF tab ${activeTab}`}><FileText size={14} /> PDF</button>
              {user?.role === 'Administrator' && (
                <>
                  <button onClick={() => setExcelModalOpen(true)} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-100 transition border border-blue-200" title="Unduh Excel multi-sheet per jurusan"><Download size={14} /> Excel</button>
                  <button onClick={handleResetSemester} disabled={resetting} className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-900 transition shadow-sm disabled:opacity-50"><Trash2 size={14} /> {resetting ? '⏳' : 'Reset Semester'}</button>
                  <button onClick={handleResetAll} disabled={resettingAll} className="flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-800 transition shadow-sm disabled:opacity-50"><AlertTriangle size={14} /> {resettingAll ? '⏳' : 'Reset Semua (Tahunan)'}</button>
                </>
              )}
            </div>
          </div>

          {/* ========== TABLE CONTAINER ========== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
                <p className="font-semibold">Memuat data kehadiran...</p>
              </div>
            ) : (
              <>
                {/* ===== TAB HARIAN ===== */}
                {activeTab === 'harian' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-left">No</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-left">NISN</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-left">Nama Siswa</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-center">L/P</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-center">Kelas</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-center">Jurusan</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-center">Status</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-r border-gray-300 text-center">Waktu</th>
                          <th className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider border-b border-gray-300 text-center">Sumber</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0 ? (
                          <tr><td colSpan={9} className="text-center py-12 text-gray-400 border-b border-gray-200">Tidak ada data</td></tr>
                        ) : filteredStudents.map((s, idx) => {
                          const att = getStudentAttendance(s.id, dateFilter)
                          return (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                              <td className="py-3 px-4 text-gray-500 border-b border-r border-gray-200 text-left">{idx + 1}</td>
                              <td className="py-3 px-4 font-mono text-xs border-b border-r border-gray-200 text-left" style={blackText}>{s.nisn || '—'}</td>
                              <td className="py-3 px-4 font-semibold border-b border-r border-gray-200 text-left" style={blackText}>{s.nama}</td>
                              <td className="py-3 px-4 text-gray-600 border-b border-r border-gray-200 text-center">{s.jenis_kelamin}</td>
                              <td className="py-3 px-4 text-gray-600 text-xs border-b border-r border-gray-200 text-center">{s.kelas}</td>
                              <td className="py-3 px-4 text-gray-600 text-xs border-b border-r border-gray-200 text-center">{s.jurusan}</td>
                              <td className="py-3 px-4 border-b border-r border-gray-200 text-center"><StatusBadge status={att?.status || 'Alpha'} /></td>
                              <td className="py-3 px-4 text-gray-500 text-xs border-b border-r border-gray-200 text-center">{att?.created_at ? new Date(att.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                              <td className="py-3 px-4 border-b border-gray-200 text-center"><SumberBadge sumber={att?.input_by} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ===== TAB BULANAN ===== */}
                {activeTab === 'bulanan' && (
                  <div className="space-y-4">
                    <div className="overflow-auto max-h-[70vh]">
                      <table className="w-full text-sm text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-gray-100">
                            <th rowSpan={2} className="py-2 px-2 font-bold text-[10px] text-gray-600 text-center md:sticky md:left-0 md:bg-gray-100 md:z-30 w-[36px] border-b border-r border-gray-300">No</th>
                            <th rowSpan={2} className="py-2 px-3 font-bold text-[10px] text-gray-600 md:sticky md:left-[36px] md:bg-gray-100 md:z-30 min-w-[160px] border-b border-r border-gray-300 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.08)] text-left">Nama Siswa</th>
                            <th rowSpan={2} className="py-2 px-1 font-bold text-[10px] text-gray-600 text-center md:sticky md:left-[196px] md:bg-gray-100 md:z-30 w-[32px] border-b border-r border-gray-300 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.08)]">L/P</th>
                            <th colSpan={daysInMonth} className="py-2 px-2 font-bold text-xs text-center text-gray-800 border-b border-r border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">{bulanName}</th>
                            <th rowSpan={2} className="py-2 px-2 font-bold text-[9px] text-center text-gray-800 bg-gray-200 w-[52px] border-b border-r border-gray-300 leading-tight">Hari<br/>Efektif</th>
                            <th colSpan={4} className="py-1.5 px-2 font-bold text-[10px] text-center text-gray-700 border-b border-r border-gray-300">Total</th>
                            <th rowSpan={2} className="py-2 px-2 font-bold text-[10px] text-center text-indigo-600 w-[46px] border-b border-gray-300">% Hadir</th>
                          </tr>
                          <tr className="bg-gray-100">
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const d = i + 1
                              const dayStr = d < 10 ? `0${d}` : `${d}`
                              const dateStr = `${dateFilter.substring(0, 7)}-${dayStr}`
                              const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
                              const dayName = DAY_NAMES_SHORT[dayOfWeek]
                              const holiInfo = getHolidayInfo(dateStr)
                              const isHoli = !!holiInfo
                              const headerBg = holiInfo
                                ? (holiInfo.type === 'weekend' ? WEEKEND_HEADER_BG : (HOLIDAY_HEADER_BG[holiInfo.category] || HOLIDAY_HEADER_BG['Khusus']))
                                : ''
                              const numColor = isHoli ? 'text-white' : 'text-gray-600'
                              const nameColor = holiInfo
                                ? (holiInfo.type === 'weekend' ? 'text-red-200' : 'text-white/70')
                                : 'text-gray-400'
                              return (
                                <th key={d} className={`py-0.5 px-0 text-center w-[30px] border-b border-r border-gray-300 ${headerBg}`}>
                                  <div className={`text-[10px] font-bold leading-tight ${numColor}`}>{d}</div>
                                  <div className={`text-[7px] font-semibold leading-tight ${nameColor}`}>{dayName}</div>
                                </th>
                              )
                            })}
                            <th className="py-1.5 px-2 font-bold text-[9px] text-emerald-600 text-center w-[38px] border-b border-r border-gray-300">Total H</th>
                            <th className="py-1.5 px-2 font-bold text-[9px] text-amber-600 text-center w-[38px] border-b border-r border-gray-300">Total S</th>
                            <th className="py-1.5 px-2 font-bold text-[9px] text-blue-600 text-center w-[38px] border-b border-r border-gray-300">Total I</th>
                            <th className="py-1.5 px-2 font-bold text-[9px] text-red-600 text-center w-[38px] border-b border-r border-gray-300">Total A</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr><td colSpan={3 + daysInMonth + 6} className="text-center py-12 text-gray-400 border-b border-gray-200">Tidak ada data</td></tr>
                          ) : filteredStudents.map((s, idx) => {
                            let cH = 0, cS = 0, cI = 0, cA = 0
                            const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
                              const d = i + 1
                              const dayStr = d < 10 ? `0${d}` : `${d}`
                              const dateStr = `${dateFilter.substring(0, 7)}-${dayStr}`
                              const holiInfo = getHolidayInfo(dateStr)
                              const isFuture = dateStr > today
                              let cellContent = null
                              let cellBg = ''
                              if (holiInfo) {
                                cellBg = holiInfo.type === 'weekend'
                                  ? WEEKEND_BODY_BG
                                  : (HOLIDAY_BODY_BG[holiInfo.category] || HOLIDAY_BODY_BG['Khusus'])
                                const textColor = holiInfo.type === 'weekend'
                                  ? WEEKEND_BODY_TEXT
                                  : (HOLIDAY_BODY_TEXT[holiInfo.category] || HOLIDAY_BODY_TEXT['Khusus'])
                                cellContent = <span className={`${textColor} text-[8px] font-bold leading-tight`}>{DAY_NAMES_SHORT[new Date(dateStr + 'T00:00:00').getDay()]}</span>
                              } else if (!isFuture) {
                                const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
                                if (att) {
                                  if (att.status === 'Hadir') { cellContent = <span className="text-emerald-700 font-bold text-[11px]">H</span>; cH++ }
                                  else if (att.status === 'Sakit') { cellContent = <span className="text-amber-700 font-bold text-[11px]">S</span>; cS++ }
                                  else if (att.status === 'Izin') { cellContent = <span className="text-blue-700 font-bold text-[11px]">I</span>; cI++ }
                                  else { cellContent = <span className="text-red-700 font-bold text-[11px]">A</span>; cA++ }
                                } else {
                                  cellContent = <span className="text-red-700 font-bold text-[11px]">A</span>
                                  cA++
                                }
                              }
                              return (
                                <td key={d} className={`py-0.5 px-0 text-center w-[30px] border-b border-r border-gray-200 ${cellBg}`}>
                                  {cellContent}
                                </td>
                              )
                            })
                            const pctHadir = bulananEffDays > 0 ? Math.round((cH / bulananEffDays) * 100) : 0
                            return (
                              <tr key={s.id} className="hover:bg-blue-50/30 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                                <td className="py-2 px-2 text-gray-500 text-[10px] md:sticky md:left-0 md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200 text-center">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-gray-800 text-[11px] md:sticky md:left-[36px] md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.06)]">{s.nama}</td>
                                <td className="py-2 px-1 text-gray-600 text-[10px] md:sticky md:left-[196px] md:bg-white md:hover:bg-blue-50/30 md:z-10 border-b border-r border-gray-200 md:shadow-[3px_0_5px_-3px_rgba(0,0,0,0.06)] text-center">{s.jenis_kelamin}</td>
                                {dayCells}
                                <td className="py-2 px-2 text-center font-bold text-gray-800 bg-gray-50/50 border-b border-r border-gray-200 text-[10px]">{bulananEffDays}</td>
                                <td className="py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50/50 border-b border-r border-gray-200 text-[10px]">{cH}</td>
                                <td className="py-2 px-2 text-center font-bold text-amber-600 bg-amber-50/50 border-b border-r border-gray-200 text-[10px]">{cS}</td>
                                <td className="py-2 px-2 text-center font-bold text-blue-600 bg-blue-50/50 border-b border-r border-gray-200 text-[10px]">{cI}</td>
                                <td className="py-2 px-2 text-center font-bold text-red-600 bg-red-50/50 border-b border-r border-gray-200 text-[10px]">{cA}</td>
                                <td className="py-2 px-2 text-center font-bold text-indigo-600 bg-indigo-50/50 border-b border-gray-200 text-[10px]">{pctHadir}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Legenda Hari Libur Bulanan ── */}
                    {(monthHolidays.length > 0 || hasWeekendsInMonth) && (
                      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-600 mb-2.5 flex items-center gap-1.5">
                          <span>📅</span> Keterangan Hari Libur {bulanName} {filterYear}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {monthHolidays.map((h, idx) => {
                            const bgBlock = HOLIDAY_HEADER_BG[h.category] || HOLIDAY_HEADER_BG['Khusus']
                            const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                <div className={`w-3.5 h-3.5 rounded-sm ${bgBlock} flex-shrink-0`}></div>
                                <span className="text-[11px] text-gray-600">
                                  <span className="font-medium">{dateLabel}</span> — {h.holiday_name}
                                </span>
                              </div>
                            )
                          })}
                          {hasWeekendsInMonth && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-sm bg-red-700 flex-shrink-0"></div>
                              <span className="text-[11px] text-gray-600">Sabtu & Minggu</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== TAB SEMESTER ===== */}
                {activeTab === 'semester' && <LongTermView monthsToShow={semMonths} />}

                {/* ===== TAB TAHUNAN ===== */}
                {activeTab === 'tahunan' && <LongTermView monthsToShow={ALL_MONTHS} />}
              </>
            )}
          </div>

          {/* ========== SISWA KRITIS (hanya tab bulanan) ========== */}
          {activeTab === 'bulanan' && (
            <div className="space-y-6">
              {!kritisData ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-bold text-emerald-700 text-lg">Tidak Ada Siswa Kritis Bulan Ini</p>
                  <p className="text-emerald-600 text-sm mt-1">Semua siswa memiliki kehadiran baik (Alpha ≤ 3 kali)</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-200"></span></span>
                      <h3 className="font-extrabold text-lg">⚠️ Siswa Kritis — Alpha &gt; 3 Kali</h3>
                    </div>
                    <p className="text-red-100 text-sm">Perlu perhatian khusus dari Wali Kelas dan BK</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { label: 'Siswa Kritis', value: kritisData.list.length, icon: '🔴', bg: 'bg-red-50 border-red-200 text-red-700' },
                      { label: 'Alpha Tertinggi', value: kritisData.maxA + 'x', icon: '📈', bg: 'bg-orange-50 border-orange-200 text-orange-700' },
                      { label: 'Rata-rata Alpha', value: kritisData.avgA + 'x', icon: '📊', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
                      { label: 'Sangat Kritis (≥10)', value: kritisData.berat, icon: '🚨', bg: 'bg-red-100 border-red-300 text-red-800' },
                      { label: 'Rasio Kritis', value: kritisData.donut + '%', icon: '🎯', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' }
                    ].map((card, i) => (
                      <div key={i} className={`${card.bg} border rounded-xl p-3 text-center`}>
                        <div className="text-lg">{card.icon}</div>
                        <div className="text-xl font-extrabold mt-1">{card.value}</div>
                        <div className="text-[10px] font-semibold opacity-80">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-700"></div> Sangat Kritis (≥10): {kritisData.berat} siswa</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400"></div> Kritis (5-9): {kritisData.sedang} siswa</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-300"></div> Perlu Perhatian (4-3): {kritisData.ringan} siswa</div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h4 className="font-bold text-gray-700 mb-4 text-sm">📊 Top 10 Siswa Alpha Tertinggi</h4>
                    <div className="space-y-2">
                      {kritisData.list.slice(0, 10).map((s, idx) => {
                        const pct = kritisData.maxA > 0 ? (s.alphaCount / kritisData.maxA) * 100 : 0
                        const barColor = s.alphaCount >= 10 ? 'from-red-700 to-red-600' : s.alphaCount >= 5 ? 'from-red-500 to-red-400' : 'from-orange-400 to-orange-300'
                        return (
                          <div key={s.id} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 w-5 text-right">{idx + 1}</span>
                            <span className="text-xs font-semibold text-gray-700 w-36 truncate">{s.nama}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div className={`bg-gradient-to-r ${barColor} h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-700`} style={{ width: `${Math.max(pct, 8)}%` }}>
                                <span className="text-[9px] font-bold text-white">{s.alphaCount}x</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 w-16 text-right">{s.kelas} {s.jurusan}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100"><h4 className="font-bold text-gray-700 text-sm">📋 Detail Siswa Kritis ({kritisData.list.length} siswa)</h4></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-3 text-left font-semibold text-gray-500 border-b">No</th>
                            <th className="py-2 px-3 text-left font-semibold text-gray-500 border-b">Nama</th>
                            <th className="py-2 px-3 text-center font-semibold text-gray-500 border-b">L/P</th>
                            <th className="py-2 px-3 text-left font-semibold text-gray-500 border-b">Kelas</th>
                            <th className="py-2 px-3 text-center font-semibold text-gray-500 border-b">Jumlah Alpha</th>
                            <th className="py-2 px-3 text-center font-semibold text-gray-500 border-b">Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kritisData.list.map((s, idx) => {
                            const severity = s.alphaCount >= 10 ? { label: 'Sangat Kritis', cls: 'bg-red-700 text-white' } : s.alphaCount >= 5 ? { label: 'Kritis', cls: 'bg-red-400 text-white' } : { label: 'Perlu Perhatian', cls: 'bg-orange-300 text-orange-900' }
                            return (
                              <tr key={s.id} className={s.alphaCount >= 10 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                <td className="py-2 px-3 border-b text-gray-500">{idx + 1}</td>
                                <td className="py-2 px-3 border-b font-semibold text-gray-800">{s.nama}</td>
                                <td className="py-2 px-3 border-b text-center text-gray-600">{s.jenis_kelamin}</td>
                                <td className="py-2 px-3 border-b text-gray-600">{s.kelas} {s.jurusan}</td>
                                <td className="py-2 px-3 border-b text-center font-bold text-red-600">{s.alphaCount}x</td>
                                <td className="py-2 px-3 border-b text-center"><span className={`px-2 py-0.5 rounded-full font-semibold ${severity.cls}`}>{severity.label}</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}