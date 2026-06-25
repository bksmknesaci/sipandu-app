"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  CalendarDays, Filter, RefreshCw, Users, CheckCircle, AlertTriangle, Info, PhoneOff,
  Activity, Search, Download, FileText, FileSpreadsheet, ChevronDown, X, Camera, GraduationCap, Trash2
} from 'lucide-react'
import { getRekapKehadiran, resetSemesterAbsensi, resetAllAbsensi } from '@/app/actions/rekapActions'
import { getKelasFilters } from '@/app/actions/absensiActions'
import { getKopSuratSettings } from '@/app/actions/siswaActions'
import { generateKopSuratHTML } from '@/lib/kopSuratHelper'
import PJInfoCard from '@/app/components/PJInfoCard'
import { getHolidays } from '@/app/actions/effectiveDaysActions'

const ALL_MONTHS = [
  { name: 'Juli', m: 7 }, { name: 'Agustus', m: 8 }, { name: 'September', m: 9 },
  { name: 'Oktober', m: 10 }, { name: 'November', m: 11 }, { name: 'Desember', m: 12 },
  { name: 'Januari', m: 1 }, { name: 'Februari', m: 2 }, { name: 'Maret', m: 3 },
  { name: 'April', m: 4 }, { name: 'Mei', m: 5 }, { name: 'Juni', m: 6 }
];

function parseKelasJurusan(kelas) {
  if (!kelas) return { tingkat: '', jurusan: '' }
  const parts = kelas.trim().split(/\s+/)
  return { tingkat: parts[0] || '', jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || '') }
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

const StatusBadge = ({ status }) => {
  const config = {
    'Hadir': { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'H' },
    'Sakit': { color: 'bg-amber-100 text-amber-700', icon: Activity, label: 'S' },
    'Izin': { color: 'bg-blue-100 text-blue-700', icon: Info, label: 'I' },
    'Alpha': { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'A' },
  }
  const c = config[status] || config['Alpha']; const Icon = c.icon
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${c.color}`}><Icon size={12}/> {c.label}</span>
}

const SumberBadge = ({ sumber }) => {
  const text = sumber || '-'; let style = 'bg-gray-100 text-gray-600'; let icon = '📝'
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

  const blackText = { color: '#1f2937' }
  const tingkatOptions = [...new Set(kelasJurusanList.map(c => c.kelas))].sort()
const jurusanOptions = tingkatFilter
  ? [...new Set(kelasJurusanList.filter(c => c.kelas === tingkatFilter).map(c => c.jurusan))].sort()
  : [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()
  const currentYear = parseInt(dateFilter.substring(0, 4))
  const currentMonth = parseInt(dateFilter.substring(5, 7))
  const academicStartYear = currentMonth >= 7 ? currentYear : currentYear - 1
  const semMonths = currentMonth >= 7 ? ALL_MONTHS.filter(m => m.m >= 7) : ALL_MONTHS.filter(m => m.m <= 6);
  const semNum = currentMonth >= 7 ? 1 : 2;

  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (stored) {
      const u = JSON.parse(stored); setUser(u)
      if (u.role === 'Wali Kelas' && u.kelas) {
        const parsed = parseKelasJurusan(u.kelas); setTingkatFilter(parsed.tingkat); setJurusanFilter(parsed.jurusan)
      }
    }
  }, [])

  useEffect(() => {
    const fetchHolidays = async () => {
      const h = await getHolidays()
      if (h) setHolidays(h)
    }
    fetchHolidays()
  }, [])

  useEffect(() => {
    const fetchFilters = async () => {
      const res = await getKelasFilters()
      if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList)
    }
    fetchFilters()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRekapKehadiran({ date: dateFilter, tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userKelas: user?.kelas })
      if (res.error) { setStudents([]); setAttendance([]) } 
      else { setStudents(res.students || []); setAttendance(res.attendance || []) }
    } catch (e) { setStudents([]); setAttendance([]) }
    setLoading(false)
  }, [dateFilter, tingkatFilter, jurusanFilter, user])

  useEffect(() => {
    if (user?.role === 'Wali Kelas' || (tingkatFilter && jurusanFilter)) fetchData()
  }, [fetchData, user, tingkatFilter, jurusanFilter])

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

  const getMonthAtt = (siswaId, monthIndex) => {
    const mStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
    const yStr = monthIndex >= 7 ? academicStartYear.toString() : (academicStartYear + 1).toString();
    return attendance.filter(a => a.siswa_id === siswaId && a.tanggal.startsWith(`${yStr}-${mStr}`));
  }

  const getCounts = (attList) => ({
    h: attList.filter(a => a.status === 'Hadir').length,
    s: attList.filter(a => a.status === 'Sakit').length,
    i: attList.filter(a => a.status === 'Izin').length,
    a: attList.filter(a => a.status === 'Alpha').length
  })

  const isHoliday = (dateStr) => {
    const day = new Date(dateStr + 'T00:00:00').getDay()
    if (day === 0 || day === 6) return true
    return holidays.some(h => h.date === dateStr)
  }

  const getEffectiveDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    let effectiveDays = 0
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${monthStr}-${i < 10 ? '0'+i : i}`
      if (!isHoliday(dayStr)) effectiveDays++
    }
    return effectiveDays
  }

  const getTotalEffectiveDays = (monthsToShow) => {
    let total = 0
    monthsToShow.forEach(m => {
      const yStr = m.m >= 7 ? academicStartYear.toString() : (academicStartYear + 1).toString();
      const mStr = m.m < 10 ? `0${m.m}` : `${m.m}`;
      total += getEffectiveDaysInMonth(`${yStr}-${mStr}`)
    })
    return total
  }

  const handleResetSemester = async () => {
    if (!confirm('PERHATIAN!\nSemua data absensi untuk SEMESTER ini akan dihapus permanen.\nData Tab Tahunan tidak terpengaruh. Lanjutkan?')) return
    setResetting(true)
    const res = await resetSemesterAbsensi({ date: dateFilter, tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userKelas: user?.kelas })
    if (res.error) showToast(res.error, 'error')
    else { showToast('Data absensi semester berhasil direset!'); fetchData() }
    setResetting(false)
  }

  const handleResetAll = async () => {
    if (!confirm('PERHATIAN!\nSemua data absensi untuk TAHUN AJARAN ini akan dihapus permanen secara TOTAL.\nLanjutkan?')) return
    setResettingAll(true)
    const res = await resetAllAbsensi({ tingkat: tingkatFilter, jurusan: jurusanFilter, userRole: user?.role, userKelas: user?.kelas })
    if (res.error) showToast(res.error, 'error')
    else { showToast('Semua data absensi berhasil direset ke nol!'); fetchData() }
    setResettingAll(false)
  }

  const handleExportExcel = () => {
    const monthStr = dateFilter.substring(0, 7)
    const effDays = getEffectiveDaysInMonth(monthStr)
    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P']
    for(let i=1; i<=31; i++) headers.push(`${i}`)
    headers.push('E (Efektif)', 'H', 'S', 'I', 'A', '%Hadir')

    const rows = filteredStudents.map((s, idx) => {
      const row = [idx + 1, s.nisn, s.nama, s.jenis_kelamin]
      let cH=0, cS=0, cI=0, cA=0
      for(let d=1; d<=31; d++) {
        const dayStr = d < 10 ? `0${d}` : `${d}`
        const dateStr = `${monthStr}-${dayStr}`
        const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
        if (isHoliday(dateStr)) {
          row.push('L')
        } else {
          if (dateStr <= today) { cA++ }
          if (att) {
            if (att.status === 'Hadir') { row.push('H'); cH++; if(dateStr <= today) cA-- }
            else if (att.status === 'Sakit') { row.push('S'); cS++; if(dateStr <= today) cA-- }
            else if (att.status === 'Izin') { row.push('I'); cI++; if(dateStr <= today) cA-- }
            else { row.push('A') }
          } else {
            row.push(dateStr <= today ? 'A' : '')
          }
        }
      }
      row.push(effDays, cH, cS, cI, cA, effDays > 0 ? Math.round((cH / effDays) * 100) + '%' : '0%')
      return row
    })

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Rekap_Bulanan_${tingkatFilter}_${jurusanFilter}_${monthStr}.csv`
    link.click()
  }

  const handleExportPDF = async () => {
    const kopSettings = await getKopSuratSettings()
    const kopHTML = await generateKopSuratHTML(kopSettings)
    const w = window.open('', '_blank')
    const totalEffDays = getTotalEffectiveDays(semMonths)
    
    const rowsHtml = filteredStudents.map((s, idx) => {
      let tH = 0, tS = 0, tI = 0, tA = 0
      const monthCells = semMonths.map(m => {
        const c = getCounts(getMonthAtt(s.id, m.m))
        tH += c.h; tS += c.s; tI += c.i; tA += c.a
        return `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:9px;">
          <div style="color:#047857">${c.h > 0 ? c.h+'H' : ''}</div>
          <div style="color:#b45309">${c.s > 0 ? c.s+'S' : ''}</div>
          <div style="color:#1d4ed8">${c.i > 0 ? c.i+'I' : ''}</div>
          <div style="color:#b91c1c">${c.a > 0 ? c.a+'A' : ''}</div>
        </td>`
      }).join('')

      return `<tr>
        <td style="border:1px solid #000;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #000;padding:6px;font-size:10px">${s.nisn || '—'}</td>
        <td style="border:1px solid #000;padding:6px;font-size:10px;font-weight:bold">${s.nama}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${s.jenis_kelamin}</td>
        ${monthCells}
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;">${totalEffDays}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#047857">${tH}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#b45309">${tS}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#1d4ed8">${tI}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#b91c1c">${tA}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold">${totalEffDays > 0 ? Math.round((tH / totalEffDays) * 100) : 0}%</td>
      </tr>`
    }).join('')

    const monthHeaders = semMonths.map(m => `<th style="border:1px solid #000;padding:6px;font-size:10px">${m.name}</th>`).join('')

    w.document.write(`<html><head><title>Rekap Kehadiran Semester</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 0; margin: 20px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #e5e7eb; border: 1px solid #000; padding: 6px; font-weight: bold; text-align: center; font-size: 10px; }
        @media print { body { margin: 0; } }
      </style>
    </head><body>
      ${kopHTML}
      <div style="text-align:center;">
        <h3 style="margin:0; font-size:14px; text-transform:uppercase;">REKAP KEHADIRAN SISWA</h3>
        <p style="margin:2px 0 0 0; font-size:12px; font-weight:bold;">Semester ${semNum} Tahun Ajaran ${academicStartYear}/${academicStartYear + 1}</p>
        <p style="margin:2px 0 0 0; font-size:12px;">Kelas: ${tingkatFilter} ${jurusanFilter}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:30px">No</th>
            <th>NISN</th>
            <th>Nama Siswa</th>
            <th style="width:30px">L/P</th>
            ${monthHeaders}
            <th style="background:#f3f4f6">Hari Efektif</th>
            <th style="color:#047857">Total H</th>
            <th style="color:#b45309">Total S</th>
            <th style="color:#1d4ed8">Total I</th>
            <th style="color:#b91c1c">Total A</th>
            <th style="width:40px">%H</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`)
    
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const isFilterEmpty = !tingkatFilter || !jurusanFilter;

  // ============================
  // SECTION: Siswa Alpha > 5x (Tab Bulanan)
  // ============================
  const AlphaWarningSection = () => {
    const monthStr = dateFilter.substring(0, 7)
    const effDays = getEffectiveDaysInMonth(monthStr)

    const alphaStudents = filteredStudents.map(s => {
      let alphaCount = 0
      for (let d = 1; d <= 31; d++) {
        const dayStr = d < 10 ? `0${d}` : `${d}`
        const dateStr = `${monthStr}-${dayStr}`
        if (isHoliday(dateStr) || dateStr > today) continue
        const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
        if (!att || att.status === 'Alpha') alphaCount++
      }
      return { ...s, alphaCount }
    }).filter(s => s.alphaCount > 5).sort((a, b) => b.alphaCount - a.alphaCount)

    if (alphaStudents.length === 0) return null

    const maxAlpha = Math.max(...alphaStudents.map(s => s.alphaCount))
    const avgAlpha = (alphaStudents.reduce((sum, s) => sum + s.alphaCount, 0) / alphaStudents.length).toFixed(1)
    const kritisBerat = alphaStudents.filter(s => s.alphaCount >= 15).length
    const kritisSedang = alphaStudents.filter(s => s.alphaCount >= 10 && s.alphaCount < 15).length
    const kritisRingan = alphaStudents.filter(s => s.alphaCount > 5 && s.alphaCount < 10).length
    const donutPct = Math.round((alphaStudents.length / filteredStudents.length) * 100)

    return (
      <div className="mt-6 space-y-5 animate-fadeIn">
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-600 to-rose-700 rounded-2xl p-5 text-white shadow-xl shadow-red-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm shrink-0 animate-pulse">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Siswa Kritis — Alpha &gt; 5 Kali</h3>
              <p className="text-red-100 text-sm mt-0.5">{alphaStudents.length} dari {filteredStudents.length} siswa membutuhkan penanganan atau pembinaan segera</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-red-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 mx-auto mb-2 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <p className="text-2xl font-extrabold text-red-600">{alphaStudents.length}</p>
            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Siswa Kritis</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 font-black text-lg">↑</span>
            </div>
            <p className="text-2xl font-extrabold text-orange-600">{maxAlpha}x</p>
            <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Alpha Tertinggi</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-amber-600 font-black text-sm">Ø</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-600">{avgAlpha}x</p>
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Rata-rata</p>
          </div>
          <div className="bg-white border border-rose-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 mx-auto mb-2 bg-rose-100 rounded-xl flex items-center justify-center">
              <span className="text-rose-600 font-black text-sm">!</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-600">{kritisBerat}</p>
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Sangat Kritis (≥15)</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
            <div className="relative w-16 h-16 rounded-full" style={{ background: `conic-gradient(#EF4444 ${donutPct}%, #F3F4F6 ${donutPct}% 100%)` }}>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-xs font-extrabold text-gray-700">{donutPct}%</span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-gray-400 mt-1.5 text-center">Rasio Kritis<br/>dari Total</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            Sangat Kritis (≥15x): {kritisBerat} siswa
          </div>
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Kritis (10-14x): {kritisSedang} siswa
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            Perlu Perhatian (6-9x): {kritisRingan} siswa
          </div>
        </div>

        <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
            <div className="w-1.5 h-5 bg-red-500 rounded-full"></div>
            Distribusi Alpha per Siswa (Top 10)
          </h4>
          <div className="space-y-2.5">
            {alphaStudents.slice(0, 10).map((s, idx) => {
              const barPct = (s.alphaCount / maxAlpha) * 100
              const gradient = s.alphaCount >= 15
                ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                : s.alphaCount >= 10
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #f87171, #ef4444)'
              return (
                <div key={s.id} className="flex items-center gap-3 group">
                  <div className="w-5 text-right">
                    <span className={`text-[10px] font-bold ${idx < 3 ? 'text-red-500' : 'text-gray-300'}`}>{idx + 1}</span>
                  </div>
                  <div className="w-28 md:w-36 truncate text-xs font-semibold text-gray-700 group-hover:text-red-600 transition-colors">{s.nama}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 min-w-[40px]"
                      style={{ width: `${Math.max(barPct, 12)}%`, background: gradient }}
                    >
                      <span className="text-[10px] font-extrabold text-white drop-shadow-sm">{s.alphaCount}x</span>
                    </div>
                  </div>
                  <div className="w-14 text-right text-[10px] font-bold text-gray-400">
                    {effDays > 0 ? Math.round((s.alphaCount / effDays) * 100) : 0}%
                  </div>
                </div>
              )
            })}
          </div>
          {alphaStudents.length > 10 && (
            <p className="text-xs text-gray-400 mt-3 text-center">...dan {alphaStudents.length - 10} siswa lainnya</p>
          )}
        </div>

        <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-5 py-3 border-b border-red-100 flex items-center justify-between">
            <h4 className="font-bold text-red-700 text-sm flex items-center gap-2">
              📋 Daftar Lengkap Siswa Kritis
            </h4>
            <span className="text-[10px] font-bold text-red-400 bg-red-100 px-2 py-0.5 rounded-full">{alphaStudents.length} siswa</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">No</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">NISN</th>
                  <th className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="py-2.5 px-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">L/P</th>
                  <th className="py-2.5 px-4 text-center text-[10px] font-bold text-red-500 uppercase tracking-wider">Total Alpha</th>
                  <th className="py-2.5 px-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">% Alpha</th>
                  <th className="py-2.5 px-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {alphaStudents.map((s, idx) => {
                  const pct = effDays > 0 ? Math.round((s.alphaCount / effDays) * 100) : 0
                  const severity = s.alphaCount >= 15
                    ? { label: 'Sangat Kritis', cls: 'bg-red-600 text-white' }
                    : s.alphaCount >= 10
                      ? { label: 'Kritis', cls: 'bg-red-100 text-red-700' }
                      : { label: 'Perlu Perhatian', cls: 'bg-amber-100 text-amber-700' }
                  const rowBg = s.alphaCount >= 15 ? 'bg-red-50/60' : s.alphaCount >= 10 ? 'bg-orange-50/40' : ''
                  return (
                    <tr key={s.id} className={`hover:bg-red-50/80 transition-colors ${rowBg}`}>
                      <td className="py-2.5 px-4 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-4 text-xs font-mono text-gray-500">{s.nisn || '—'}</td>
                      <td className="py-2.5 px-4 font-semibold text-gray-800">{s.nama}</td>
                      <td className="py-2.5 px-4 text-center text-gray-500">{s.jenis_kelamin}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-lg font-extrabold text-red-600">{s.alphaCount}</span>
                        <span className="text-xs text-red-400 ml-0.5">x</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-red-500">{pct}%</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${severity.cls}`}>{severity.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-5 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
            * Siswa dengan alpha ≥15x disarankan untuk segera dipanggil orang tua dan diberikan Surat Peringatan. Data berdasarkan hari efektif bulan ini ({effDays} hari).
          </div>
        </div>
      </div>
    )
  }

  // ============================
  // LongTermView (Semester & Tahunan)
  // ============================
  const LongTermView = ({ monthsToShow }) => {
    const totalEffDays = getTotalEffectiveDays(monthsToShow)
    return (
      <div className="p-6 space-y-8">
        <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-0 md:bg-gray-50 md:z-30 w-[40px] md:border-r md:border-gray-200">No</th>
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[40px] md:bg-gray-50 md:z-30 min-w-[180px] md:border-r md:border-gray-200">Nama Siswa</th>
                <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[220px] md:bg-gray-50 md:z-30 w-[40px]">L/P</th>
                {monthsToShow.map(m => <th key={m.m} className="py-3 px-4 font-bold text-xs text-gray-600 text-center min-w-[80px] border-l border-gray-200">{m.name}</th>)}
                <th className="py-3 px-4 font-bold text-xs text-gray-800 text-center w-[60px] border-l border-gray-200 bg-gray-100">Hari Efektif</th>
                <th className="py-3 px-4 font-bold text-xs text-emerald-600 text-center w-[60px] border-l border-gray-200">Total H</th>
                <th className="py-3 px-4 font-bold text-xs text-amber-600 text-center w-[60px] border-l border-gray-200">Total S</th>
                <th className="py-3 px-4 font-bold text-xs text-blue-600 text-center w-[60px] border-l border-gray-200">Total I</th>
                <th className="py-3 px-4 font-bold text-xs text-red-600 text-center w-[60px] border-l border-gray-200">Total A</th>
                <th className="py-3 px-4 font-bold text-xs text-indigo-600 text-center w-[50px] border-l border-gray-200">%H</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((s, idx) => {
                let totalH = 0, totalS = 0, totalI = 0, totalA = 0;
                return (
                  <tr key={s.id} className="hover:bg-blue-50/30 cursor-pointer group" onClick={() => setSelectedStudent(s)}>
                    <td className="py-3 px-4 text-gray-500 md:sticky md:left-0 md:bg-white md:group-hover:bg-blue-50 md:z-10 md:border-r md:border-gray-200">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800 md:sticky md:left-[40px] md:bg-white md:group-hover:bg-blue-50 md:z-10 md:border-r md:border-gray-200">{s.nama}</td>
                    <td className="py-3 px-4 text-gray-600 md:sticky md:left-[220px] md:bg-white md:group-hover:bg-blue-50 md:z-10">{s.jenis_kelamin}</td>
                    
                    {monthsToShow.map(m => {
                      const monthAtt = getMonthAtt(s.id, m.m)
                      const c = getCounts(monthAtt)
                      totalH += c.h; totalS += c.s; totalI += c.i; totalA += c.a;
                      return (
                        <td key={m.m} className="py-3 px-4 text-center border-l border-gray-100">
                          <div className="flex flex-col text-[11px] font-semibold leading-tight">
                            <span className="text-emerald-700">{c.h > 0 ? `${c.h} H` : ''}</span>
                            <span className="text-amber-700">{c.s > 0 ? `${c.s} S` : ''}</span>
                            <span className="text-blue-700">{c.i > 0 ? `${c.i} I` : ''}</span>
                            <span className="text-red-700">{c.a > 0 ? `${c.a} A` : ''}</span>
                          </div>
                        </td>
                      )
                    })}

                    <td className="py-3 px-4 text-center font-bold text-gray-800 bg-gray-50/50 border-l border-gray-200">{totalEffDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/50 border-l border-gray-200">{totalH}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 bg-amber-50/50 border-l border-gray-200">{totalS}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600 bg-blue-50/50 border-l border-gray-200">{totalI}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/50 border-l border-gray-200">{totalA}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50/50 border-l border-gray-200">{totalEffDays > 0 ? Math.round((totalH / totalEffDays) * 100) : 0}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-xs font-medium border border-blue-100">
          ℹ️ Kolom <b>Hari Efektif</b> dihitung otomatis berdasarkan Kalender Pendidikan dan Hari Libur yang aktif di menu Pengaturan. Persentase Kehadiran dihitung berdasarkan Hari Efektif.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Distribusi Kehadiran Hari Ini</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(#10B981 ${stats.persentase}%, #F59E0B ${stats.sakit/stats.total*100 || 0}% ${stats.persentase + stats.sakit/stats.total*100}%, #3B82F6 ${stats.izin/stats.total*100 || 0}% ${stats.persentase + stats.sakit/stats.total*100 + stats.izin/stats.total*100}%, #EF4444 ${stats.alpha/stats.total*100 || 0}% 100%)` }}>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col"><span className="text-2xl font-extrabold text-gray-800">{stats.persentase}%</span><span className="text-[10px] text-gray-500">Kehadiran</span></div>
              </div>
              <div className="space-y-2 text-xs font-semibold text-black">
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
              {[{ label: 'Hadir', value: stats.hadir, color: 'bg-emerald-500', total: stats.total }, { label: 'Sakit', value: stats.sakit, color: 'bg-amber-500', total: stats.total }, { label: 'Izin', value: stats.izin, color: 'bg-blue-500', total: stats.total }, { label: 'Alpha', value: stats.alpha, color: 'bg-red-500', total: stats.total }].map(item => (
                <div key={item.label}><div className="flex justify-between text-xs font-semibold text-gray-600 mb-1"><span>{item.label}</span><span>{item.value} Siswa</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${item.color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${(item.value / item.total) * 100 || 0}%` }}></div></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

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

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Tanggal</label><input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} /></div>
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Tingkat</label><select value={tingkatFilter} onChange={e => handleTingkatChange(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas'}><option value="">Pilih Tingkat</option>{tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Jurusan & Kelas</label><select value={jurusanFilter} onChange={e => setJurusanFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas'}><option value="">Pilih Jurusan</option>{jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
          <button onClick={fetchData} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm"><Search size={16}/> Tampilkan</button>
          <button onClick={() => { setTingkatFilter(''); setJurusanFilter(''); setDateFilter(today) }} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-semibold"><RefreshCw size={16}/> Reset Filter</button>
        </div>
      </div>

      {isFilterEmpty && user?.role !== 'Wali Kelas' ? (
         <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100"><GraduationCap size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-gray-500 font-semibold text-lg">Pilih Tingkat & Jurusan Terlebih Dahulu</p></div>
      ) : (
        <>
          <PJInfoCard kelas={tingkatFilter} jurusan={jurusanFilter} />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{ label: 'Total Siswa', value: stats.total, gradient: 'from-slate-500 to-slate-600' },{ label: 'Hadir', value: stats.hadir, gradient: 'from-emerald-500 to-emerald-600' },{ label: 'Sakit', value: stats.sakit, gradient: 'from-amber-500 to-amber-600' },{ label: 'Izin', value: stats.izin, gradient: 'from-blue-500 to-blue-600' },{ label: 'Alpha', value: stats.alpha, gradient: 'from-red-500 to-red-600' },{ label: 'Persentase', value: stats.persentase, suffix: '%', gradient: 'from-indigo-500 to-indigo-600' }].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5`}><p className="text-xs opacity-90 font-medium">{stat.label}</p><p className="text-3xl font-extrabold tracking-tight mt-1"><CountUp end={stat.value} />{stat.suffix || ''}</p></div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-2 flex-wrap">{['harian', 'bulanan', 'semester', 'tahunan'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))}</div>
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="Cari Nama/NISN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-40" style={blackText} />
              <button onClick={handleExportExcel} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition border border-emerald-200"><FileSpreadsheet size={14}/> CSV</button>
              <button onClick={handleExportPDF} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 transition border border-red-200"><FileText size={14}/> PDF</button>
              <button onClick={handleResetSemester} disabled={resetting} className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-900 transition shadow-sm disabled:opacity-50"><Trash2 size={14}/> {resetting ? '⏳' : 'Reset Semester'}</button>
              <button onClick={handleResetAll} disabled={resettingAll} className="flex items-center gap-1 bg-red-700 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-800 transition shadow-sm disabled:opacity-50"><AlertTriangle size={14}/> {resettingAll ? '⏳' : 'Reset Semua (Tahunan)'}</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400"><RefreshCw className="animate-spin mx-auto mb-3" size={32} /><p className="font-semibold">Memuat data kehadiran...</p></div>
            ) : (
              <>
                {activeTab === 'harian' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>{['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan', 'Status', 'Waktu', 'Sumber'].map(h => (<th key={h} className="py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider">{h}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.length === 0 ? (
                          <tr><td colSpan="9" className="text-center py-12 text-gray-400">Tidak ada data</td></tr>
                        ) : (
                          filteredStudents.map((s, idx) => {
                            const att = getStudentAttendance(s.id, dateFilter)
                            return (
                              <tr key={s.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                                <td className="py-3 px-4 text-gray-500">{idx+1}</td>
                                <td className="py-3 px-4 font-mono text-xs text-black">{s.nisn || '—'}</td>
                                <td className="py-3 px-4 font-semibold" style={blackText}>{s.nama}</td>
                                <td className="py-3 px-4 text-gray-600">{s.jenis_kelamin}</td>
                                <td className="py-3 px-4 text-gray-600 text-xs">{s.kelas}</td>
                                <td className="py-3 px-4 text-gray-600 text-xs">{s.jurusan}</td>
                                <td className="py-3 px-4"><StatusBadge status={att?.status || 'Alpha'} /></td>
                                <td className="py-3 px-4 text-gray-500 text-xs">{att?.created_at ? new Date(att.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                                <td className="py-3 px-4"><SumberBadge sumber={att?.input_by} /></td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'bulanan' && (
                  <>
                    <div className="overflow-auto max-h-[70vh]">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 shadow-sm">
                          <tr>
                            <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-0 md:bg-gray-50 md:z-30 w-[40px]">No</th>
                            <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[40px] md:bg-gray-50 md:z-30 min-w-[200px] md:border-r md:border-gray-200">Nama Siswa</th>
                            <th className="py-3 px-4 font-bold text-xs text-gray-600 md:sticky md:left-[240px] md:bg-gray-50 md:z-30 w-10">L/P</th>
                            {Array.from({length: 31}, (_, i) => i+1).map(d => (<th key={d} className="py-3 px-2 font-bold text-xs text-gray-600 text-center w-10">{d}</th>))}
                            <th className="py-3 px-2 font-bold text-xs text-gray-800 text-center w-10 bg-gray-100">E</th>
                            <th className="py-3 px-2 font-bold text-xs text-emerald-600 text-center w-10">H</th>
                            <th className="py-3 px-2 font-bold text-xs text-amber-600 text-center w-10">S</th>
                            <th className="py-3 px-2 font-bold text-xs text-blue-600 text-center w-10">I</th>
                            <th className="py-3 px-2 font-bold text-xs text-red-600 text-center w-10">A</th>
                            <th className="py-3 px-2 font-bold text-xs text-indigo-600 text-center w-16">%H</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredStudents.map((s, idx) => {
                            const monthStr = dateFilter.substring(0, 7)
                            const effDays = getEffectiveDaysInMonth(monthStr)
                            let cH=0, cS=0, cI=0, cA=0;
                            return (
                              <tr key={s.id} className="hover:bg-blue-50/30 group cursor-pointer" onClick={() => setSelectedStudent(s)}>
                                <td className="py-2 px-4 text-gray-500 md:sticky md:left-0 md:bg-white md:group-hover:bg-blue-50 md:z-10">{idx + 1}</td>
                                <td className="py-2 px-4 font-semibold text-gray-800 md:sticky md:left-[40px] md:bg-white md:group-hover:bg-blue-50 md:z-10 md:border-r md:border-gray-200">{s.nama}</td>
                                <td className="py-2 px-2 text-gray-500 md:sticky md:left-[240px] md:bg-white md:group-hover:bg-blue-50 md:z-10">{s.jenis_kelamin}</td>
                                {Array.from({length: 31}, (_, i) => i+1).map(d => {
                                  const dayStr = d < 10 ? `0${d}` : `${d}`
                                  const dateStr = `${monthStr}-${dayStr}`
                                  const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
                                  
                                  let bgColor = 'bg-gray-50 text-gray-300'; let statusChar = '-'
                                  
                                  if (isHoliday(dateStr)) {
                                    bgColor = 'bg-red-300 text-red-800'; statusChar = ''
                                  } else {
                                    if (dateStr <= today) { bgColor = 'bg-red-100 text-red-700 font-bold'; statusChar = 'A'; cA++ }
                                    if (att) {
                                      if (att.status === 'Hadir') { bgColor = 'bg-emerald-100 text-emerald-700 font-bold'; statusChar = 'H'; cH++; if(dateStr <= today) cA-- }
                                      else if (att.status === 'Sakit') { bgColor = 'bg-amber-100 text-amber-700 font-bold'; statusChar = 'S'; cS++; if(dateStr <= today) cA-- }
                                      else if (att.status === 'Izin') { bgColor = 'bg-blue-100 text-blue-700 font-bold'; statusChar = 'I'; cI++; if(dateStr <= today) cA-- }
                                      else if (att.status === 'Alpha') { bgColor = 'bg-red-100 text-red-700 font-bold'; statusChar = 'A' }
                                    }
                                  }
                                  return <td key={d} className={`py-2 px-2 text-center text-xs ${bgColor} transition-colors`}>{statusChar}</td>
                                })}
                                <td className="py-2 px-2 text-center font-bold text-gray-800 bg-gray-50/50">{effDays}</td>
                                <td className="py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50/50">{cH}</td>
                                <td className="py-2 px-2 text-center font-bold text-amber-600 bg-amber-50/50">{cS}</td>
                                <td className="py-2 px-2 text-center font-bold text-blue-600 bg-blue-50/50">{cI}</td>
                                <td className="py-2 px-2 text-center font-bold text-red-600 bg-red-50/50">{cA}</td>
                                <td className="py-2 px-2 text-center font-bold text-indigo-600 bg-indigo-50/50">{effDays > 0 ? Math.round((cH / effDays) * 100) : 0}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 pb-4">
                      <AlphaWarningSection />
                    </div>
                  </>
                )}

                {activeTab === 'semester' && <LongTermView monthsToShow={semMonths} />}
                {activeTab === 'tahunan' && <LongTermView monthsToShow={ALL_MONTHS} />}
              </>
            )}
          </div>

          {selectedStudent && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-bold text-gray-800">Detail Kehadiran Siswa</h3><button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button></div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">{selectedStudent.nama?.charAt(0)}</div>
                    <div><h4 className="text-xl font-bold text-gray-800">{selectedStudent.nama}</h4><p className="text-sm text-gray-500">NISN: {selectedStudent.nisn} • {selectedStudent.kelas} {selectedStudent.jurusan}</p></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[{ label: 'Hadir', value: attendance.filter(a => a.siswa_id === selectedStudent.id && a.status === 'Hadir').length, color: 'text-emerald-600 bg-emerald-50' }, { label: 'Sakit', value: attendance.filter(a => a.siswa_id === selectedStudent.id && a.status === 'Sakit').length, color: 'text-amber-600 bg-amber-50' }, { label: 'Izin', value: attendance.filter(a => a.siswa_id === selectedStudent.id && a.status === 'Izin').length, color: 'text-blue-600 bg-blue-50' }, { label: 'Alpha', value: attendance.filter(a => a.siswa_id === selectedStudent.id && a.status === 'Alpha').length, color: 'text-red-600 bg-red-50' }].map(s => (
                      <div key={s.label} className={`p-3 rounded-xl text-center ${s.color}`}><p className="text-2xl font-extrabold">{s.value}</p><p className="text-xs font-semibold">{s.label}</p></div>
                    ))}
                  </div>
                  <h5 className="font-bold text-gray-700 mb-2">Riwayat Kehadiran</h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {attendance.filter(a => a.siswa_id === selectedStudent.id).sort((a,b) => b.tanggal.localeCompare(a.tanggal)).map(a => (
                      <div key={a.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg text-sm">
                        <span className="font-medium text-gray-700">{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <div className="flex items-center gap-3"><SumberBadge sumber={a.input_by} /><StatusBadge status={a.status} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}