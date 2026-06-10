"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  CalendarDays, Filter, RefreshCw, Users, CheckCircle, AlertTriangle, Info, PhoneOff,
  Activity, Search, Download, FileText, FileSpreadsheet, ChevronDown, X, Camera, GraduationCap, Trash2
} from 'lucide-react'
import { getRekapKehadiran, resetSemesterAbsensi, resetAllAbsensi } from '@/app/actions/rekapActions'

const TINGKAT_OPTIONS = ['X', 'XI', 'XII']
const JURUSAN_OPTIONS = [
  'TKRO 1', 'TKRO 2', 'TKRO 3', 'TKRO 4', 'DKV 1', 'DKV 2', 'DKV 3', 'DKV 4',
  'RPL 1', 'RPL 2', 'RPL 3', 'RPL 4', 'PH 1', 'PH 2', 'PH 3', 'PH 4',
  'KL 1', 'KL 2', 'KL 3', 'KL 4', 'LPKKK 1', 'LPKKK 2', 'LPKKK 3', 'LPKKK 4',
]

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

  const blackText = { color: '#1f2937' }
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
  const filteredStudents = students.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis?.toLowerCase().includes(searchTerm.toLowerCase()))

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
    const headers = ['No', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Jurusan']
    semMonths.forEach(m => headers.push(`${m.name} (H)`, `${m.name} (S)`, `${m.name} (I)`, `${m.name} (A)`))
    headers.push('Total H', 'Total S', 'Total I', 'Total A', '%Hadir')

    const rows = filteredStudents.map((s, idx) => {
      const row = [idx + 1, s.nis, s.nama, s.jenis_kelamin, s.kelas, s.jurusan]
      let tH = 0, tS = 0, tI = 0, tA = 0
      semMonths.forEach(m => {
        const c = getCounts(getMonthAtt(s.id, m.m))
        row.push(c.h, c.s, c.i, c.a)
        tH += c.h; tS += c.s; tI += c.i; tA += c.a
      })
      const totalAll = tH + tS + tI + tA
      row.push(tH, tS, tI, tA, totalAll > 0 ? Math.round((tH / totalAll) * 100) + '%' : '0%')
      return row
    })

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Rekap_Semester_${semNum}_${tingkatFilter}_${jurusanFilter}_${dateFilter}.csv`
    link.click()
  }

  const handleExportPDF = () => {
    const w = window.open('', '_blank')
    
    // Logo URLs (Extracted from uploaded images)
    const logoDinas = "https://z-cdn-media.chatglm.cn/files/929820ad-a0a8-46c5-bc59-b82e9388cd84.png?auth_key=1881124029-cd40a19b190e4f11a5c8e1af584be597-0-5a7829ed925abcea2c21ae506f3cca45"
    const logoSekolah = "https://z-cdn-media.chatglm.cn/files/e24c09cd-036a-42c7-b5bf-b34dca222130.png?auth_key=1881124029-68d2651a9ec24567bc048bdc06bb2054-0-8bd000793410b91e087b3032e2d7892b"

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

      const totalAll = tH + tS + tI + tA
      return `<tr>
        <td style="border:1px solid #000;padding:6px;text-align:center">${idx + 1}</td>
        <td style="border:1px solid #000;padding:6px;font-size:10px">${s.nis}</td>
        <td style="border:1px solid #000;padding:6px;font-size:10px;font-weight:bold">${s.nama}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${s.jenis_kelamin}</td>
        ${monthCells}
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#047857">${tH}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#b45309">${tS}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#1d4ed8">${tI}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold;color:#b91c1c">${tA}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center;font-weight:bold">${totalAll > 0 ? Math.round((tH / totalAll) * 100) : 0}%</td>
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
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px;">
        <div style="width:80px; height:80px; flex-shrink:0;"><img src="${logoDinas}" style="width:100%; height:100%; object-fit:contain;"></div>
        <div style="text-align:center; flex:1; padding: 0 15px;">
          <p style="margin:0; font-size:12px;">PEMERINTAH DAERAH PROVINSI JAWA BARAT</p>
          <p style="margin:0; font-size:12px; font-weight:bold;">DINAS PENDIDIKAN</p>
          <p style="margin:0; font-size:13px; font-weight:bold;">CABANG DINAS PENDIDIKAN WILAYAH IX</p>
          <p style="margin:2px 0 0 0; font-size:15px; font-weight:bold;">SEKOLAH MENENGAH KEJURUAN NEGERI 1 CIKEDUNG</p>
          <p style="margin:2px 0 0 0; font-size:9px;">Jl. Raya Cikedung - Jatibarang Km 05 Kec. Cikedung Kab. Indramayu 45262</p>
          <p style="margin:0; font-size:9px;">Telp. (0234) 5500198 | Website: www.smnk1cikedung.sch.id | Email: smnk1cikedung@rocketmail.com</p>
        </div>
        <div style="width:80px; height:80px; flex-shrink:0;"><img src="${logoSekolah}" style="width:100%; height:100%; object-fit:contain;"></div>
      </div>
      
      <hr style="border:2px solid black; margin-top:5px; margin-bottom:15px;">
      
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
    setTimeout(() => w.print(), 500) // Delay print slightly to allow images to load
  }

  const isFilterEmpty = !tingkatFilter || !jurusanFilter;

  const LongTermView = ({ monthsToShow }) => (
    <div className="p-6 space-y-8">
      <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-xl">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 shadow-sm">
            <tr>
              <th className="py-3 px-4 font-bold text-xs text-gray-600 sticky left-0 bg-gray-50 z-30 w-[40px] border-r border-gray-200">No</th>
              <th className="py-3 px-4 font-bold text-xs text-gray-600 sticky left-[40px] bg-gray-50 z-30 min-w-[180px] border-r border-gray-200">Nama Siswa</th>
              <th className="py-3 px-4 font-bold text-xs text-gray-600 sticky left-[220px] bg-gray-50 z-30 w-[40px]">L/P</th>
              {monthsToShow.map(m => <th key={m.m} className="py-3 px-4 font-bold text-xs text-gray-600 text-center min-w-[80px] border-l border-gray-200">{m.name}</th>)}
              <th className="py-3 px-4 font-bold text-xs text-emerald-600 text-center w-[60px] border-l border-gray-200">Total H</th>
              <th className="py-3 px-4 font-bold text-xs text-amber-600 text-center w-[60px] border-l border-gray-200">Total S</th>
              <th className="py-3 px-4 font-bold text-xs text-blue-600 text-center w-[60px] border-l border-gray-200">Total I</th>
              <th className="py-3 px-4 font-bold text-xs text-red-600 text-center w-[60px] border-l border-gray-200">Total A</th>
              <th className="py-3 px-4 font-bold text-xs text-indigo-600 text-center w-[50px] border-l border-gray-200">%H</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((s, idx) => {
              let totalH = 0, totalS = 0, totalI = 0, totalA = 0, totalAll = 0;
              return (
                <tr key={s.id} className="hover:bg-blue-50/30 cursor-pointer group" onClick={() => setSelectedStudent(s)}>
                  <td className="py-3 px-4 text-gray-500 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 border-r border-gray-200">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800 sticky left-[40px] bg-white group-hover:bg-blue-50/30 z-10 border-r border-gray-200">{s.nama}</td>
                  <td className="py-3 px-4 text-gray-600 sticky left-[220px] bg-white group-hover:bg-blue-50/30 z-10">{s.jenis_kelamin}</td>
                  
                  {monthsToShow.map(m => {
                    const monthAtt = getMonthAtt(s.id, m.m)
                    const c = getCounts(monthAtt)
                    totalH += c.h; totalS += c.s; totalI += c.i; totalA += c.a; totalAll += monthAtt.length
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

                  <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-emerald-50/50 border-l border-gray-200">{totalH}</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600 bg-amber-50/50 border-l border-gray-200">{totalS}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 bg-blue-50/50 border-l border-gray-200">{totalI}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/50 border-l border-gray-200">{totalA}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50/50 border-l border-gray-200">{totalAll > 0 ? Math.round((totalH / totalAll) * 100) : 0}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
            <span>•</span><span>Semester {semNum} Tahun Ajaran {academicStartYear}/{academicStartYear+1}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Data Terintegrasi & Sinkron
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Tanggal</label><input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} /></div>
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Tingkat</label><select value={tingkatFilter} onChange={e => handleTingkatChange(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas'}><option value="">Pilih Tingkat</option>{TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-xs font-semibold text-gray-500 block mb-1.5">Jurusan & Kelas</label><select value={jurusanFilter} onChange={e => setJurusanFilter(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" style={blackText} disabled={user?.role === 'Wali Kelas'}><option value="">Pilih Jurusan</option>{JURUSAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
          <button onClick={fetchData} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-semibold shadow-sm"><Search size={16}/> Tampilkan</button>
          <button onClick={() => { setTingkatFilter(''); setJurusanFilter(''); setDateFilter(today) }} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-semibold"><RefreshCw size={16}/> Reset Filter</button>
        </div>
      </div>

      {isFilterEmpty && user?.role !== 'Wali Kelas' ? (
         <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100"><GraduationCap size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-gray-500 font-semibold text-lg">Pilih Tingkat & Jurusan Terlebih Dahulu</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{ label: 'Total Siswa', value: stats.total, gradient: 'from-slate-500 to-slate-600' },{ label: 'Hadir', value: stats.hadir, gradient: 'from-emerald-500 to-emerald-600' },{ label: 'Sakit', value: stats.sakit, gradient: 'from-amber-500 to-amber-600' },{ label: 'Izin', value: stats.izin, gradient: 'from-blue-500 to-blue-600' },{ label: 'Alpha', value: stats.alpha, gradient: 'from-red-500 to-red-600' },{ label: 'Persentase', value: stats.persentase, suffix: '%', gradient: 'from-indigo-500 to-indigo-600' }].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5`}><p className="text-xs opacity-90 font-medium">{stat.label}</p><p className="text-3xl font-extrabold tracking-tight mt-1"><CountUp end={stat.value} />{stat.suffix || ''}</p></div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-2 flex-wrap">{['harian', 'bulanan', 'semester', 'tahunan'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>))}</div>
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="Cari Nama/NISN..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-40" style={blackText} />
              <button onClick={handleExportExcel} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition border border-emerald-200"><FileSpreadsheet size={14}/> Excel</button>
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
                                <td className="py-3 px-4 font-mono text-xs text-black">{s.nis}</td>
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
                  <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-20 border-b border-gray-200 shadow-sm">
                        <tr>
                          <th className="py-3 px-4 font-bold text-xs text-gray-600 sticky left-0 bg-gray-50 z-30 min-w-[200px]">Nama Siswa</th>
                          <th className="py-3 px-2 font-bold text-xs text-gray-600 sticky left-[200px] bg-gray-50 z-30 w-10 border-r border-gray-200">L/P</th>
                          {Array.from({length: 31}, (_, i) => i+1).map(d => (<th key={d} className="py-3 px-2 font-bold text-xs text-gray-600 text-center w-10">{d}</th>))}
                          <th className="py-3 px-2 font-bold text-xs text-emerald-600 text-center w-10">H</th>
                          <th className="py-3 px-2 font-bold text-xs text-amber-600 text-center w-10">S</th>
                          <th className="py-3 px-2 font-bold text-xs text-blue-600 text-center w-10">I</th>
                          <th className="py-3 px-2 font-bold text-xs text-red-600 text-center w-10">A</th>
                          <th className="py-3 px-2 font-bold text-xs text-indigo-600 text-center w-16">%H</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredStudents.map(s => {
                          const monthStr = dateFilter.substring(0, 7)
                          let cH=0, cS=0, cI=0, cA=0;
                          return (
                            <tr key={s.id} className="hover:bg-blue-50/30 group cursor-pointer" onClick={() => setSelectedStudent(s)}>
                              <td className="py-2 px-4 font-semibold text-gray-800 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 border-r border-gray-200">{s.nama}</td>
                              <td className="py-2 px-2 text-gray-500 sticky left-[200px] bg-white group-hover:bg-blue-50/30 z-10 border-r border-gray-200">{s.jenis_kelamin}</td>
                              {Array.from({length: 31}, (_, i) => i+1).map(d => {
                                const dayStr = d < 10 ? `0${d}` : `${d}`
                                const dateStr = `${monthStr}-${dayStr}`
                                const att = attendance.find(a => a.siswa_id === s.id && a.tanggal === dateStr)
                                
                                let bgColor = 'bg-gray-50 text-gray-300'; let statusChar = '-'
                                if (dateStr <= today) { bgColor = 'bg-red-100 text-red-700 font-bold'; statusChar = 'A'; cA++ }
                                
                                if (att) {
                                  if (att.status === 'Hadir') { bgColor = 'bg-emerald-100 text-emerald-700 font-bold'; statusChar = 'H'; cH++; if(dateStr <= today) cA-- }
                                  else if (att.status === 'Sakit') { bgColor = 'bg-amber-100 text-amber-700 font-bold'; statusChar = 'S'; cS++; if(dateStr <= today) cA-- }
                                  else if (att.status === 'Izin') { bgColor = 'bg-blue-100 text-blue-700 font-bold'; statusChar = 'I'; cI++; if(dateStr <= today) cA-- }
                                  else if (att.status === 'Alpha') { bgColor = 'bg-red-100 text-red-700 font-bold'; statusChar = 'A' }
                                }
                                return <td key={d} className={`py-2 px-2 text-center text-xs ${bgColor} transition-colors`}>{statusChar}</td>
                              })}
                              <td className="py-2 px-2 text-center font-bold text-emerald-600 bg-emerald-50/50">{cH}</td>
                              <td className="py-2 px-2 text-center font-bold text-amber-600 bg-amber-50/50">{cS}</td>
                              <td className="py-2 px-2 text-center font-bold text-blue-600 bg-blue-50/50">{cI}</td>
                              <td className="py-2 px-2 text-center font-bold text-red-600 bg-red-50/50">{cA}</td>
                              <td className="py-2 px-2 text-center font-bold text-indigo-600 bg-indigo-50/50">{cH + cS + cI + cA > 0 ? Math.round((cH / (cH + cS + cI + cA)) * 100) : 0}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
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
                    <div><h4 className="text-xl font-bold text-gray-800">{selectedStudent.nama}</h4><p className="text-sm text-gray-500">NISN: {selectedStudent.nis} • {selectedStudent.kelas} {selectedStudent.jurusan}</p></div>
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
      `}</style>
    </div>
  )
}