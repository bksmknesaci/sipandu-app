'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BarChart3, Filter, Download, Trash2, Eye, X, Loader2, CalendarDays, Users, CheckCircle, HeartPulse, AlertTriangle, Clock, Printer, FileSpreadsheet, RotateCcw } from 'lucide-react'
import { getPklFilters, getPklStats, getPklRekapHarian, getPklRekapBulanan, getPklRekapSemester, getPklAttendanceDetail, resetAllPklData, cleanupOldPklSelfies } from '@/app/actions/pklActions'

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

  // Harian
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv-SE'))

  // Bulanan
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // Semester
  const [semesterInfo, setSemesterInfo] = useState(null)

  // Bulanan extra
  const [daysInMonth, setDaysInMonth] = useState(0)
  const [monthName, setMonthName] = useState('')

  // Detail modal
  const [detailModal, setDetailModal] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Reset
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetText, setResetText] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  // Load filters
  useEffect(() => {
    const load = async () => {
      const res = await getPklFilters()
      if (res) setFilterOptions(res)
    }
    load()
  }, [])

  // Auto cleanup old selfies
  useEffect(() => { cleanupOldPklSelfies() }, [])

  // Load data based on tab
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

  useEffect(() => { loadData() }, [loadData])

  // Reset on filter change
  useEffect(() => {
    setActiveTab('harian')
    setSelectedDate(new Date().toLocaleDateString('sv-SE'))
  }, [filters])

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
  }

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
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan,Jam Masuk,Jam Pulang,Status,Keterlambatan\n'
      data.forEach((s, i) => {
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.company_name || ''}",${s.Hadir || 0},${s.Sakit || 0},${s.Izin || 0},${s.Alpha || 0},${s.Terlambat || 0},${s.Libur || 0},${s.totalKerja || 0},"${s.persentase || '0.0'}%"\n`
      })
    } else if (activeTab === 'bulanan') {
      const header = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan'
      const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Tgl ${i + 1}`).join(',')
      csv = header + ',' + dayHeaders + ',Total H,Total S,Total I,Total A,Total T,Total L\n'
      data.forEach((s, i) => {
        const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
        const dayVals = s.days.map(d => {
          if (!d.status) return ''
          counts[d.status] = (counts[d.status] || 0) + 1
          return SC[d.status]?.label || d.status
        }).join(',')
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.kelas || ''}","${s.jurusan || ''}","${s.company_name || ''}",${dayVals},${counts.Hadir},${counts.Sakit},${counts.Izin},${counts.Alpha},${counts.Terlambat},${counts.Libur}\n`
      })
    } else if (activeTab === 'semester') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan,Hadir,Sakit,Izin,Alpha,Terlambat,Libur,Total Kerja,Persentase\n'
      data.forEach((s, i) => {
        csv += `${i + 1},"${s.nisn || ''}","${s.nama || ''}","${s.jenis_kelamin === 'P' ? 'P' : 'L'}","${s.kelas || ''}","${s.jurusan || ''}","${s.company_name || ''}",${s.Hadir || 0},${s.Sakit || 0},${s.Izin || 0},${s.Alpha || 0},${s.Terlambat || 0},${s.Libur || 0},${s.totalKerja || 0},"${s.persentase || '0.0'}%"\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
    link.download = `rekap_pkl_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const exportPDF = () => {
    if (data.length === 0) { showToast('Tidak ada data', 'error'); return }
    const w = window.open('', '_blank')
    if (!w) { showToast('Popup diblokir', 'error'); return }
    let title = 'Rekap Kehadiran PKL'
    if (activeTab === 'harian') title += ` — Harian (${selectedDate})`
    else if (activeTab === 'bulanan') title += ` — Bulanan (${monthName} ${selectedYear})`
    else title += ` — ${semesterInfo?.label || 'Semester'}`
    let tableHTML = ''
    if (activeTab === 'harian') {
      tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Perusahaan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th></tr></thead><tbody>`
      data.forEach((s, i) => {
        tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.company_name || ''}</td><td>${s.attendance?.check_in_time || '-'}</td><td>${s.attendance?.check_out_time || '-'}</td><td>${s.computedStatus || '-'}</td></tr>`
      })
      tableHTML += '</tbody></table>'
    } else if (activeTab === 'bulanan') {
      let hdr = '<th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Perusahaan</th>'
      for (let d = 1; d <= daysInMonth; d++) hdr += `<th style="font-size:9px;padding:3px">${d}</th>`
      hdr += '<th>H</th><th>S</th><th>I</th><th>A</th><th>T</th><th>L</th>'
      tableHTML = `<table border="1" cellpadding="4" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr style="background:#f0f0f0">${hdr}</tr></thead><tbody>`
      data.forEach((s, i) => {
        const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
        let row = `<td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td style="font-size:9px">${s.company_name || ''}</td>`
        s.days.forEach(d => {
          if (!d.status) { row += '<td style="background:#f9fafb">-</td>'; return }
          counts[d.status] = (counts[d.status] || 0) + 1
          const c = SC[d.status]
          const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff'))
          const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333')
          row += `<td style="background:${bg};color:${clr};text-align:center;font-weight:bold;font-size:9px;padding:2px">${c?.label || d.status}</td>`
        })
        row += `<td>${counts.Hadir}</td><td>${counts.Sakit}</td><td>${counts.Izin}</td><td>${counts.Alpha}</td><td>${counts.Terlambat}</td><td>${counts.Libur}</td>`
        tableHTML += `<tr>${row}</tr>`
      })
      tableHTML += '</tbody></table>'
    } else {
      tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Perusahaan</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpha</th><th>Terlambat</th><th>Libur</th><th>Total Kerja</th><th>%</th></tr></thead><tbody>`
      data.forEach((s, i) => {
        tableHTML += `<tr><td>${i + 1}</td><td>${s.nisn || ''}</td><td>${s.nama || ''}</td><td>${s.jenis_kelamin === 'P' ? 'P' : 'L'}</td><td>${s.kelas || ''}</td><td>${s.jurusan || ''}</td><td>${s.company_name || ''}</td><td>${s.Hadir || 0}</td><td>${s.Sakit || 0}</td><td>${s.Izin || 0}</td><td>${s.Alpha || 0}</td><td>${s.Terlambat || 0}</td><td>${s.Libur || 0}</td><td>${s.totalKerja || 0}</td><td>${s.persentase || '0.0'}%</td></tr>`
      })
      tableHTML += '</tbody></table>'
    }
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{text-align:center;margin-bottom:4px}p.sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}@media print{body{padding:0}}</style></head><body><h2>${title}</h2><p class="sub">Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>${tableHTML}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`)
    w.document.close()
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2"><BarChart3 size={28} className="text-blue-600" /> Rekap Kehadiran PKL</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoring kehadiran siswa Praktik Kerja Lapangan</p>
      </div>

      {/* Stats Cards */}
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

      {/* Donut + Legend */}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5"><Filter size={16} className="text-gray-500" /><span className="text-sm font-semibold text-gray-700">Filter:</span></div>
          <select value={filters.company} onChange={e => handleFilterChange('company', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]">
            <option value="">Semua Perusahaan</option>
            {filterOptions.companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
          <select value={filters.kelas} onChange={e => handleFilterChange('kelas', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[100px]">
            <option value="">Semua Tingkat</option>
            {tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.jurusan} onChange={e => handleFilterChange('jurusan', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[120px]">
            <option value="">Semua Jurusan</option>
            {jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[130px]">
            <option value="">Semua Status</option>
            {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {filterActive && (
            <button onClick={() => setFilters({ company: '', kelas: '', jurusan: '', status: '' })} className="px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"><FileSpreadsheet size={14} /> CSV</button>
            <button onClick={exportPDF} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1"><Printer size={14} /> PDF</button>
            <button onClick={() => { setShowResetModal(true); setResetStep(1); setResetText('') }} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1"><Trash2 size={14} /> Reset Semua</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['harian', 'bulanan', 'semester'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-semibold transition relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'harian' ? '📅 Harian' : tab === 'bulanan' ? '📆 Bulanan' : '📋 Semester'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
            </button>
          ))}
        </div>

        {/* Tab-specific controls */}
        <div className="p-4 border-b border-gray-50">
          {activeTab === 'harian' && (
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800" />
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

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse flex gap-3"><div className="h-4 bg-gray-100 rounded w-8" /><div className="h-4 bg-gray-100 rounded w-24" /><div className="h-4 bg-gray-100 rounded flex-1" /><div className="h-4 bg-gray-100 rounded w-16" /></div>)}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-16"><Users size={48} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-500 font-semibold">Tidak ada data siswa PKL</p><p className="text-gray-400 text-xs mt-1">{filterActive ? 'Coba ubah filter' : 'Pastikan ada siswa yang memiliki profil PKL'}</p></div>
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
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Perusahaan</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Jam Masuk</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Jam Pulang</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Status</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center">Terlambat</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((s, i) => (
                  <tr key={s.student_id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="py-3 px-3 text-gray-600 font-mono text-xs">{s.nisn || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-gray-800">{s.nama}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-600">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">{s.kelas || '-'}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">{s.jurusan || '-'}</td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{s.company_name || '-'}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700">{s.attendance?.check_in_time || '-'}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700">{s.attendance?.check_out_time || '-'}</td>
                    <td className="py-3 px-3 text-center">{statusBadge(s.computedStatus)}</td>
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
              <table className="w-full text-xs" style={{ minWidth: daysInMonth * 28 + 300 }}>
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-2 font-bold text-gray-700 text-[10px] uppercase sticky left-0 bg-gray-100 z-10 min-w-[120px]">Nama</th>
                    <th className="py-2 px-1 font-bold text-gray-700 text-[10px] uppercase text-center sticky left-[120px] bg-gray-100 z-10 min-w-[30px]">L/P</th>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = new Date(selectedYear, selectedMonth - 1, i + 1)
                      const dayName = DAY_NAMES[d.getDay()]
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6
                      return <th key={i} className={`py-2 px-0.5 font-bold text-[9px] uppercase text-center ${isWeekend ? 'bg-red-100 text-red-600' : 'text-gray-600'}`} style={{ minWidth: 26 }}>{i + 1}<br/><span className="text-[8px] opacity-60">{dayName}</span></th>
                    })}
                    <th className="py-2 px-1 font-bold text-emerald-600 text-[10px] text-center">H</th>
                    <th className="py-2 px-1 font-bold text-amber-600 text-[10px] text-center">S</th>
                    <th className="py-2 px-1 font-bold text-blue-600 text-[10px] text-center">I</th>
                    <th className="py-2 px-1 font-bold text-red-600 text-[10px] text-center">A</th>
                    <th className="py-2 px-1 font-bold text-orange-600 text-[10px] text-center">T</th>
                    <th className="py-2 px-1 font-bold text-gray-500 text-[10px] text-center">L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((s, idx) => {
                    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
                    return (
                      <tr key={s.student_id} className="hover:bg-blue-50/20">
                        <td className="py-1.5 px-2 font-semibold text-gray-800 truncate max-w-[140px] sticky left-0 bg-white z-10">{s.nama}</td>
                        <td className="py-1.5 px-1 text-center text-[10px] text-gray-600 sticky left-[120px] bg-white z-10">{s.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                        {(s.days || []).map((d, di) => {
                          if (!d.status) { counts.Libur++; return <td key={di} className="py-1 px-0.5 text-center bg-gray-50 text-gray-300">-</td> }
                          counts[d.status] = (counts[d.status] || 0) + 1
                          const c = SC[d.status]
                          const bg = d.status === 'Libur' ? '#ef4444' : (d.status === 'Alpha' ? '#fee2e2' : (c?.bg || '#fff'))
                          const clr = d.status === 'Libur' ? '#fff' : (c?.color || '#333')
                          return <td key={di} className="py-1 px-0.5 text-center font-bold" style={{ backgroundColor: bg, color: clr, fontSize: 9 }}>{c?.label || d.status}</td>
                        })}
                        <td className="py-1 px-1 text-center font-bold text-emerald-700">{counts.Hadir}</td>
                        <td className="py-1 px-1 text-center font-bold text-amber-700">{counts.Sakit}</td>
                        <td className="py-1 px-1 text-center font-bold text-blue-700">{counts.Izin}</td>
                        <td className="py-1 px-1 text-center font-bold text-red-700">{counts.Alpha}</td>
                        <td className="py-1 px-1 text-center font-bold text-orange-700">{counts.Terlambat}</td>
                        <td className="py-1 px-1 text-center font-bold text-gray-500">{counts.Libur}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Semester */
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase w-10">No</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">NISN</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Nama</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase text-center w-10">L/P</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Kelas</th>
                  <th className="py-3 px-3 font-bold text-gray-700 text-xs uppercase">Jurusan</th>
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
                {data.map((s, i) => {
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

      {/* Detail Modal */}
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
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{detailData.siswa?.nama?.[0]}</div>
                  <div>
                    <p className="font-bold text-gray-800">{detailData.siswa?.nama}</p>
                    <p className="text-xs text-gray-500">{detailData.siswa?.nisn} · {detailData.siswa?.kelas} {detailData.siswa?.jurusan}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Tanggal</p><p className="font-bold text-gray-800 text-sm">{detailData.attendance_date}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Status</p><div className="mt-0.5">{statusBadge(detailData.status)}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jam Masuk</p><p className="font-bold text-gray-800 text-sm">{detailData.check_in_time || '-'}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jam Pulang</p><p className="font-bold text-gray-800 text-sm">{detailData.check_out_time || '-'}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Terlambat</p><p className="font-bold text-sm">{detailData.is_late ? <span className="text-orange-600">Ya</span> : <span className="text-gray-400">Tidak</span>}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-semibold">Jenis</p><p className="font-bold text-gray-800 text-sm">{detailData.attendance_type || '-'}</p></div>
                </div>

                {/* Photos */}
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

                {/* Location */}
                {(detailData.check_in_latitude || detailData.check_in_address) && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-2">📍 Lokasi Masuk</p>
                    {detailData.check_in_latitude && <p className="text-xs text-blue-600 font-mono">Lat: {detailData.check_in_latitude}, Lng: {detailData.check_in_longitude}</p>}
                    {detailData.check_in_address && <p className="text-xs text-blue-600 mt-1">{detailData.check_in_address}</p>}
                  </div>
                )}
                {(detailData.check_out_latitude || detailData.check_out_address) && (
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">📍 Lokasi Pulang</p>
                    {detailData.check_out_latitude && <p className="text-xs text-indigo-600 font-mono">Lat: {detailData.check_out_latitude}, Lng: {detailData.check_out_longitude}</p>}
                    {detailData.check_out_address && <p className="text-xs text-indigo-600 mt-1">{detailData.check_out_address}</p>}
                  </div>
                )}

                {/* Note */}
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

      {/* Reset Modal */}
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
                <input value={resetText} onChange={e => setResetText(e.target.value)} placeholder='HAPUS SEMUA' className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-center font-mono font-bold text-gray-800" />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setResetStep(1); setResetText('') }} className="flex-1 py-3 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition" disabled={resetting}>Kembali</button>
                  <button onClick={handleReset} disabled={resetText !== 'HAPUS SEMUA' || resetting} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {resetting ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : '🗑 Hapus Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}