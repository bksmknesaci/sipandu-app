'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { BarChart3, Filter, Trash2, Eye, X, Loader2, CalendarDays, Users, CheckCircle, AlertTriangle, Printer, FileSpreadsheet, RotateCcw, Building2, Search, MapPin, Camera, Pencil, Save, LogIn, LogOut, Clock } from 'lucide-react'
import { getPklFilters, getPklStats, getPklRekapHarian, getPklRekapBulanan, getPklRekapSemester, getPklAttendanceDetail, updatePklAttendanceStatus, insertPklAttendanceRecord, resetAllPklData, cleanupOldPklSelfies, getCompletedPklStudentIds, deleteCompletedPklData, getPklAttendanceByStudentDate } from '@/app/actions/pklActions'
import { getOptimizedImageUrl } from '@/lib/storageOptimize'
import { getUserKelasInfo } from '@/app/actions/absensiActions'
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
const DAY_HDR = ['MIN','SEN','SEL','RAB','KAM','JUM','SAB']
const MONTHS = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function CountUp({ end, duration = 800 }) {
  const [count, setCount] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const s = prev.current, t0 = Date.now()
    const run = () => { const p = Math.min((Date.now()-t0)/duration,1); setCount(Math.round(s+(end-s)*(1-Math.pow(1-p,3)))); if(p<1) requestAnimationFrame(run) }
    requestAnimationFrame(run); prev.current = end
  }, [end, duration])
  return <span>{count}</span>
}

function DonutChart({ data, size = 120, stroke = 14 }) {
  const total = data.reduce((s,d) => s+d.value, 0)
  if (!total) return <div className="flex items-center justify-center" style={{width:size,height:size}}><span className="text-xs text-gray-400">Belum ada data</span></div>
  let off = 0
  const r = (size-stroke)/2, C = 2*Math.PI*r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d,i) => {
        const pct = d.value/total, dash = pct*C
        const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={-off} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
        off += dash; return el
      })}
      <text x={size/2} y={size/2-6} textAnchor="middle" className="text-sm font-extrabold" fill="#1f2937">{total}</text>
      <text x={size/2} y={size/2+10} textAnchor="middle" className="text-[9px]" fill="#9ca3af">Total</text>
    </svg>
  )
}

const SkelHarian = () => (
  <table className="w-full text-xs sm:text-sm">
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>{['w-8','w-20','min-w-[100px]','w-8 text-center','w-10','w-16','hidden lg:table-cell w-24','hidden lg:table-cell w-24','hidden md:table-cell w-28','text-center w-14','text-center w-14','text-center w-12','text-center hidden sm:table-cell w-10','w-16 sm:w-20'].map((c,i) => (
        <th key={i} className={`py-2.5 px-2 font-bold text-[10px] uppercase border-b border-gray-200 ${c}`}><div className="h-3 bg-gray-200 rounded animate-pulse mx-auto" style={{width:'55%'}}/></th>
      ))}</tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {Array.from({length:6}).map((_,i) => (
        <tr key={i}>{Array.from({length:14}).map((_,j) => (
          <td key={j} className="py-3 px-2"><div className="h-3 bg-gray-100 rounded animate-pulse" style={{width:j===2?'70%':'40%'}}/></td>
        ))}</tr>
      ))}
    </tbody>
  </table>
)

const SkelBulanan = ({days = 31}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse" style={{minWidth:days*26+460}}>
      <thead>
        <tr className="bg-gray-100 border-b border-gray-300">
          <th rowSpan={2} className="py-2 px-1.5 border-r border-b border-gray-300 w-8"><div className="h-3 bg-gray-200 rounded animate-pulse w-4 mx-auto"/></th>
          <th rowSpan={2} className="py-2 px-2 border-r border-b border-gray-300 min-w-[110px]"><div className="h-3 bg-gray-200 rounded animate-pulse w-20"/></th>
          <th rowSpan={2} className="py-2 px-1 border-r border-b border-gray-300 w-6"><div className="h-3 bg-gray-200 rounded animate-pulse w-3 mx-auto"/></th>
          <th colSpan={days} className="py-2 px-1 border-r border-b border-gray-300"><div className="h-3 bg-gray-200 rounded animate-pulse w-24 mx-auto"/></th>
          <th rowSpan={2} className="py-2 px-1 border-r border-b border-gray-300 w-9"><div className="h-3 bg-gray-200 rounded animate-pulse w-4 mx-auto"/></th>
          <th colSpan={5} className="py-2 px-1 border-b border-gray-300"><div className="h-3 bg-gray-200 rounded animate-pulse w-12 mx-auto"/></th>
          <th rowSpan={2} className="py-2 px-1 border-b border-gray-300 w-12"><div className="h-3 bg-gray-200 rounded animate-pulse w-6 mx-auto"/></th>
        </tr>
        <tr className="bg-gray-100 border-b border-gray-300">
          {Array.from({length:days}).map((_,i) => (
            <th key={i} className="py-1 px-0 border-r border-b border-gray-300"><div className="h-2 bg-gray-200 rounded animate-pulse w-3 mx-auto"/></th>
          ))}
          {Array.from({length:5}).map((_,i) => (
            <th key={i} className={`py-1 px-1 ${i<4?'border-r ':''}border-b border-gray-300`}><div className="h-2 bg-gray-200 rounded animate-pulse w-3 mx-auto"/></th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {Array.from({length:5}).map((_,i) => (
          <tr key={i}>
            <td className="py-1.5 px-1.5 border-r border-b border-gray-200"><div className="h-2.5 bg-gray-100 rounded animate-pulse w-5"/></td>
            <td className="py-1.5 px-2 border-r border-b border-gray-200"><div className="h-2.5 bg-gray-100 rounded animate-pulse w-24"/></td>
            <td className="py-1.5 px-1 border-r border-b border-gray-200"><div className="h-2.5 bg-gray-100 rounded animate-pulse w-3 mx-auto"/></td>
            {Array.from({length:days}).map((_,j) => (
              <td key={j} className="py-1 px-0 border-r border-b border-gray-200 text-center"><div className="h-2.5 w-2.5 bg-gray-100 rounded-full animate-pulse mx-auto"/></td>
            ))}
            <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center"><div className="h-2.5 bg-gray-100 rounded animate-pulse w-4 mx-auto"/></td>
            {Array.from({length:5}).map((_,k) => (
              <td key={k} className={`py-1.5 px-1 ${k<4?'border-r ':''}border-b border-gray-200 text-center`}><div className="h-2.5 bg-gray-100 rounded animate-pulse w-3 mx-auto"/></td>
            ))}
            <td className="py-1.5 px-1 border-b border-gray-200 text-center"><div className="h-2.5 bg-gray-100 rounded animate-pulse w-6 mx-auto"/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const SkelSemester = () => (
  <table className="w-full text-xs sm:text-sm">
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>{['w-8','w-20','min-w-[100px]','w-8 text-center','hidden md:table-cell w-10','hidden md:table-cell w-16','hidden lg:table-cell w-24','hidden lg:table-cell w-24','w-12 text-center','w-12 text-center','w-12 text-center','w-12 text-center','w-12 text-center','w-12 text-center','w-16 text-center','w-14 text-center'].map((c,i) => (
        <th key={i} className={`py-2.5 px-2 font-bold text-[10px] uppercase border-b border-gray-200 ${c}`}><div className="h-3 bg-gray-200 rounded animate-pulse mx-auto" style={{width:'55%'}}/></th>
      ))}</tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {Array.from({length:6}).map((_,i) => (
        <tr key={i}>{Array.from({length:16}).map((_,j) => (
          <td key={j} className="py-3 px-2"><div className="h-3 bg-gray-100 rounded animate-pulse" style={{width:j===2?'70%':'40%'}}/></td>
        ))}</tr>
      ))}
    </tbody>
  </table>
)

export default function RekapPKL() {
  const [filters, setFilters] = useState({ company:'', kelas:'', jurusan:'', status:'' })
  const [filterOpts, setFilterOpts] = useState({ companies:[], statuses:[], tingkat:[], jurusan:[], kelasJurusanList:[] })
  const [activeTab, setActiveTab] = useState('harian')
  const [stats, setStats] = useState({ total:0, hadir:0, sakit:0, izin:0, alpha:0, terlambat:0, libur:0, persentase:'0.0' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingErr, setLoadingErr] = useState(null)
  const [toast, setToast] = useState(null)
  const [selDate, setSelDate] = useState(new Date().toLocaleDateString('sv-SE'))
  const nowDate = new Date()
  const [selMonth, setSelMonth] = useState(nowDate.getMonth()+1)
  const [selYear, setSelYear] = useState(nowDate.getFullYear())
  const [semInfo, setSemInfo] = useState(null)
  const [dim, setDim] = useState(0)
  const [mName, setMName] = useState('')
  const [detailModal, setDetailModal] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selfieZoom, setSelfieZoom] = useState(null)
  const [userData, setUserData] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetText, setResetText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [wkNeedJur, setWkNeedJur] = useState(false)
  const [search, setSearch] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const [doneIds, setDoneIds] = useState([])
  const [showDelModal, setShowDelModal] = useState(false)
  const [delStep, setDelStep] = useState(1)
  const [delText, setDelText] = useState('')
  const [deling, setDeling] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [editSt, setEditSt] = useState('')
  const [editNote, setEditNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editDate, setEditDate] = useState('')
  const delRef = useRef(null)
  const rstRef = useRef(null)
  const fetchRef = useRef(false)

  useEffect(() => { try { const s = localStorage.getItem('userData'); if(s) setUserData(JSON.parse(s)) } catch{} }, [])
  const role = userData?.role || ''
  const isWK = role === 'Wali Kelas'
  const isAdm = role === 'Administrator'
  const udLoaded = !!userData

  useEffect(() => { if(toast) { const t = setTimeout(()=>setToast(null),3500); return ()=>clearTimeout(t) } }, [toast])

  useEffect(() => {
    if (!isWK || !userData?.id || filters.kelas) return
    const init = async () => {
      try {
        const d = await getUserKelasInfo(userData.id)
        if (d.kelas) {
          setFilters(f => ({ ...f, kelas: d.kelas, jurusan: d.jurusan || '' }))
          setWkNeedJur(!d.jurusan)
          return
        }
      } catch {}
      setFilters(f => ({ ...f, kelas: userData.kelas || '', jurusan: userData.jurusan || '' }))
      setWkNeedJur(!userData.jurusan)
    }
    init()
  }, [isWK, userData?.id])

  useEffect(() => { getPklFilters().then(r => { if(r) setFilterOpts(r) }).catch() }, [])
  useEffect(() => { const t = setTimeout(() => cleanupOldPklSelfies().catch(), 3000); return () => clearTimeout(t) }, [])

  useEffect(() => {
    let cancel = false
    const run = async () => { try { const r = await getCompletedPklStudentIds(filters); if(!cancel && !r.error) setDoneIds(r.ids||[]) } catch{} }
    run(); return () => { cancel = true }
  }, [filters.kelas, filters.jurusan, filters.company])

  useEffect(() => {
    if (!udLoaded) return
    if (isWK && !filters.kelas) return
    if (fetchRef.current) return
    let cancel = false
    fetchRef.current = true
    setLoading(true)
    setLoadingErr(null)
    const tabP = activeTab==='harian' ? getPklRekapHarian(selDate,filters) : activeTab==='bulanan' ? getPklRekapBulanan(selYear,selMonth,filters) : getPklRekapSemester(filters)
    Promise.all([getPklStats(filters), tabP]).then(([sR,tR]) => {
      if(cancel) return
      if(sR) setStats(sR)
      if(tR) {
        if(activeTab==='bulanan') { setDim(new Date(selYear,selMonth,0).getDate()); setMName(MONTHS[selMonth]) }
        if(activeTab==='semester') setSemInfo(tR.semesterInfo)
        setData(tR.students||[])
      }
    }).catch(e => { if(!cancel) { console.error(e); setLoadingErr('Gagal memuat data. Periksa koneksi internet.') } })
    .finally(() => { if(!cancel) { setLoading(false); fetchRef.current=false } })
    return () => { cancel=true; fetchRef.current=false }
  }, [udLoaded, isWK, filters.kelas, filters.jurusan, filters.company, filters.status, activeTab, selDate, selMonth, selYear])

  useEffect(() => { if(!isWK) { setActiveTab('harian'); setSelDate(new Date().toLocaleDateString('sv-SE')) } }, [isWK])

  const hFC = (k,v) => setFilters(f=>({...f,[k]:v}))
  const showToast = (m,t='success') => setToast({message:m,type:t,key:Date.now()})

  const openDetail = (student) => {
    if (!student) return
    setDetailData(student)
    setDetailLoading(false)
    setDetailModal(true)
  }

  const openEdit = (s) => {
    const cur = s.attendance?.status || s.computedStatus
    if (!cur || cur==='-' || cur==='Libur') return
    setEditData({ sid:s.student_id, nama:s.nama, nisn:s.nisn, kelas:s.kelas, jurusan:s.jurusan, cur })
    setEditSt(cur); setEditNote(''); setEditDate(selDate); setShowEditModal(true)
  }

  const saveEdit = async () => {
    if (!editSt || !editDate) return
    if (editSt === editData.cur && editDate === selDate) { setShowEditModal(false); return }
    if ((editSt==='Sakit'||editSt==='Izin') && !editNote.trim()) { showToast('Catatan wajib diisi untuk Sakit/Izin','error'); return }
    setSaving(true)
    try {
      const checkRes = await getPklAttendanceByStudentDate(editData.sid, editDate)
      if (checkRes.error) { showToast(checkRes.error,'error'); setSaving(false); return }
      let res
      if (checkRes.record) {
        if (checkRes.record.status === editSt) { showToast('Status sudah sama untuk tanggal tersebut','error'); setSaving(false); return }
        res = await updatePklAttendanceStatus({ attendanceId:checkRes.record.id, newStatus:editSt, note:editNote.trim()||null })
      } else {
        res = await insertPklAttendanceRecord({ studentId:editData.sid, attendanceDate:editDate, newStatus:editSt, note:editNote.trim()||null })
      }
      setSaving(false)
      if (res.error) { showToast(res.error,'error'); return }
      const dateLabel = new Date(editDate+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})
      showToast(`Status ${editData.nama} (${dateLabel}) diubah ke ${editSt}`)
      setShowEditModal(false)
      const tR = await getPklRekapHarian(selDate,filters); if(tR) setData(tR.students||[])
      const sR = await getPklStats(filters); if(sR) setStats(sR)
    } catch(e) { setSaving(false); showToast('Gagal mengubah status','error') }
  }

  const handleReset = async () => {
    if (resetStep===1) { setResetStep(2); setTimeout(()=>rstRef.current?.focus(),100); return }
    if (resetText!=='HAPUS SEMUA') return
    setResetting(true)
    try {
      const r = await resetAllPklData()
      setResetting(false)
      if(r.error) { showToast(r.error,'error'); return }
      showToast('Semua data PKL berhasil dihapus')
      setShowResetModal(false); setResetStep(1); setResetText('')
      setFilters({company:'',kelas:'',jurusan:'',status:''})
    } catch(e) { setResetting(false); showToast('Gagal menghapus','error') }
  }

  const handleDelDone = async () => {
    if (delStep===1) { setDelStep(2); setTimeout(()=>delRef.current?.focus(),100); return }
    if (delText!=='HAPUS SELESAI') return
    setDeling(true)
    try {
      const r = await deleteCompletedPklData(filters)
      setDeling(false)
      if(r.error) { showToast(r.error,'error'); return }
      showToast(`Berhasil hapus data PKL ${r.deleted} siswa Selesai`)
      setShowDelModal(false); setDelStep(1); setDelText(''); setHideDone(false); setDoneIds([])
    } catch(e) { setDeling(false); showToast('Gagal menghapus','error') }
  }

  const sBadge = (st, sz='n') => {
    const c = SC[st]
    if(!c) return <span className="text-xs text-gray-400">{st||'-'}</span>
    const cls = sz==='s' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs'
    return <span className={`inline-flex items-center justify-center ${cls} rounded-lg font-extrabold`} style={{backgroundColor:c.bg,color:c.color}}>{c.label}</span>
  }

  const exportCSV = () => {
    if (!data.length) { showToast('Tidak ada data','error'); return }
    let csv = ''
    if (activeTab==='harian') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan,Jam Masuk,Jam Pulang,Status,Terlambat\n'
      data.forEach((s,i) => { csv += `${i+1},"${s.nisn||''}","${s.nama||''}","${s.jenis_kelamin==='P'?'P':'L'}","${s.kelas||''}","${s.jurusan||''}","${s.company_name||''}","${s.attendance?.check_in_time||''}","${s.attendance?.check_out_time||''}","${s.computedStatus||''}","${s.attendance?.is_late?'Ya':'Tidak'}"\n` })
    } else if (activeTab==='bulanan') {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan,' + Array.from({length:dim},(_,i)=>`Tgl ${i+1}`).join(',') + ',Hari Efektif,H,S,I,A,T,% Hadir\n'
      data.forEach((s,i) => {
        const ct = {Hadir:0,Sakit:0,Izin:0,Alpha:0,Terlambat:0,Libur:0}
        let ed = s.effectiveDays
        if(ed==null) { ed=0; (s.days||[]).forEach(d=>{if(d.isWorkDay&&d.inRange&&d.isPastOrToday)ed++}) }
        (s.days||[]).forEach(d=>{ if(d.status) ct[d.status]=(ct[d.status]||0)+1 })
        const dv = (s.days||[]).map(d=>{ if(!d.status) return ''; return SC[d.status]?.label||d.status }).join(',')
        const ht = ct.Hadir+ct.Terlambat
        csv += `${i+1},"${s.nisn||''}","${s.nama||''}","${s.jenis_kelamin==='P'?'P':'L'}","${s.kelas||''}","${s.jurusan||''}","${s.company_name||''}",${dv},${ed},${ct.Hadir},${ct.Sakit},${ct.Izin},${ct.Alpha},${ct.Terlambat},"${ed>0?((ht/ed)*100).toFixed(1):'0.0'}%"\n`
      })
    } else {
      csv = 'No,NISN,Nama,L/P,Kelas,Jurusan,Perusahaan,H,S,I,A,T,Libur,Kerja,%\n'
      data.forEach((s,i) => { csv += `${i+1},"${s.nisn||''}","${s.nama||''}","${s.jenis_kelamin==='P'?'P':'L'}","${s.kelas||''}","${s.jurusan||''}","${s.company_name||''}",${s.Hadir||0},${s.Sakit||0},${s.Izin||0},${s.Alpha||0},${s.Terlambat||0},${s.Libur||0},${s.totalKerja||0},"${s.persentase||'0.0'}%"\n` })
    }
    const b = new Blob([csv],{type:'text/csv;charset=utf-8;'})
    const l = document.createElement('a')
    l.href = URL.createObjectURL(b)
    l.download = `rekap_pkl_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`
    l.click()
  }

  const exportPDF = async () => {
    if (!data.length) { showToast('Tidak ada data','error'); return }
    const w = window.open('','_blank')
    if(!w) { showToast('Popup diblokir','error'); return }
    try {
      const ks = await getKopSuratSettings()
      const kop = await generateKopSuratHTML(ks)
      let title = 'REKAP KEHADIRAN PKL', sub = ''
      if (activeTab==='harian') sub = `Harian (${new Date(selDate).toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})})`
      else if (activeTab==='bulanan') sub = `Bulanan (${mName} ${selYear})`
      else sub = semInfo?.label || 'Semester'
      const kl = filters.kelas&&filters.jurusan ? `Kelas: ${filters.kelas} ${filters.jurusan}` : (filters.kelas ? `Tingkat: ${filters.kelas}` : '')
      const co = filters.company ? `Perusahaan: ${filters.company}` : ''
      let th = '', css = ''
      if (activeTab==='harian') {
        th = '<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Perusahaan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Status</th></tr></thead><tbody>'
        data.forEach((s,i) => { th += `<tr><td>${i+1}</td><td>${s.nisn||''}</td><td>${s.nama||''}</td><td>${s.jenis_kelamin==='P'?'P':'L'}</td><td>${s.kelas||''}</td><td>${s.jurusan||''}</td><td>${s.company_name||''}</td><td>${s.attendance?.check_in_time||'-'}</td><td>${s.attendance?.check_out_time||'-'}</td><td>${s.computedStatus||'-'}</td></tr>` })
        th += '</tbody></table>'
      } else if (activeTab==='bulanan') {
        css = '@page{size:landscape}'
        let h1 = '<th rowspan="2">No</th><th rowspan="2">NISN</th><th rowspan="2">Nama</th><th rowspan="2">L/P</th><th rowspan="2">Kelas</th><th rowspan="2">Jurusan</th><th rowspan="2">Perusahaan</th>'
        h1 += `<th colspan="${dim}" style="text-align:center;font-size:10px">${mName} ${selYear}</th>`
        h1 += '<th rowspan="2" style="font-size:9px">Hari<br/>Efektif</th><th colspan="5" style="text-align:center;font-size:9px">Total</th><th rowspan="2" style="font-size:9px">% Hadir</th>'
        let h2 = ''
        for (let d=1; d<=dim; d++) {
          const dt = new Date(selYear,selMonth-1,d), di = dt.getDay(), we = di===0||di===6
          h2 += `<th style="font-size:7px;padding:1px;text-align:center;${we?'background:#fecaca;color:#dc2626':''}">${d}<br/>${DAY_HDR[di]}</th>`
        }
        h2 += '<th style="font-size:9px">H</th><th style="font-size:9px">S</th><th style="font-size:9px">I</th><th style="font-size:9px">A</th><th style="font-size:9px">T</th>'
        th = `<table border="1" cellpadding="2" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:8px"><thead><tr style="background:#f0f0f0">${h1}</tr><tr style="background:#f0f0f0">${h2}</tr></thead><tbody>`
        data.forEach((s,i) => {
          const ct = {Hadir:0,Sakit:0,Izin:0,Alpha:0,Terlambat:0,Libur:0}
          let ed = s.effectiveDays
          if(ed==null) { ed=0; (s.days||[]).forEach(d=>{if(d.isWorkDay&&d.inRange&&d.isPastOrToday)ed++}) }
          (s.days||[]).forEach(d=>{ if(d.status) ct[d.status]=(ct[d.status]||0)+1 })
          let row = `<td>${i+1}</td><td>${s.nisn||''}</td><td>${s.nama||''}</td><td>${s.jenis_kelamin==='P'?'P':'L'}</td><td>${s.kelas||''}</td><td>${s.jurusan||''}</td><td>${s.company_name||''}</td>`
          ;(s.days||[]).forEach(d => {
            if(!d.status) { row += '<td style="background:#f9fafb;text-align:center">-</td>'; return }
            const c = SC[d.status]
            const we = new Date(d.date+'T00:00:00').getDay()%6===0
            const bg = we ? '#991b1b' : (d.status==='Libur' ? '#ef4444' : (d.status==='Alpha' ? '#fee2e2' : (c?.bg||'#fff')))
            const cl = we ? '#fff' : (d.status==='Libur' ? '#fff' : (c?.color||'#333'))
            row += `<td style="background:${bg};color:${cl};text-align:center;font-weight:bold;font-size:7px">${c?.label||d.status}</td>`
          })
          const ht = ct.Hadir+ct.Terlambat
          const pct = ed>0 ? ((ht/ed)*100).toFixed(1) : '0.0'
          row += `<td style="text-align:center;font-weight:bold">${ed}</td><td style="text-align:center">${ct.Hadir}</td><td style="text-align:center">${ct.Sakit}</td><td style="text-align:center">${ct.Izin}</td><td style="text-align:center">${ct.Alpha}</td><td style="text-align:center">${ct.Terlambat}</td><td style="text-align:center;font-weight:bold">${pct}%</td>`
          th += `<tr>${row}</tr>`
        })
        th += '</tbody></table>'
      } else {
        th = '<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f0f0f0"><th>No</th><th>NISN</th><th>Nama</th><th>L/P</th><th>Kelas</th><th>Jurusan</th><th>Perusahaan</th><th>H</th><th>S</th><th>I</th><th>A</th><th>T</th><th>Libur</th><th>Kerja</th><th>%</th></tr></thead><tbody>'
        data.forEach((s,i) => { th += `<tr><td>${i+1}</td><td>${s.nisn||''}</td><td>${s.nama||''}</td><td>${s.jenis_kelamin==='P'?'P':'L'}</td><td>${s.kelas||''}</td><td>${s.jurusan||''}</td><td>${s.company_name||''}</td><td>${s.Hadir||0}</td><td>${s.Sakit||0}</td><td>${s.Izin||0}</td><td>${s.Alpha||0}</td><td>${s.Terlambat||0}</td><td>${s.Libur||0}</td><td>${s.totalKerja||0}</td><td>${s.persentase||'0.0'}%</td></tr>` })
        th += '</tbody></table>'
      }
      const printDate = new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
      w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${css}body{font-family:Arial,sans-serif;padding:20px}h3{text-align:center;margin:0;font-size:14px;text-transform:uppercase}p.sub{text-align:center;color:#666;font-size:12px;margin:2px 0 16px}@media print{body{margin:0}}</style></head><body>${kop}<div style="text-align:center"><h3>${title}</h3><p class="sub">${sub}</p>${kl?`<p class="sub">${kl}</p>`:''}${co?`<p class="sub">${co}</p>`:''}<p class="sub">Dicetak: ${printDate}</p></div>${th}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`)
      w.document.close()
    } catch(e) { console.error(e); showToast('Gagal membuat PDF','error') }
  }

  const fData = useMemo(() => {
    let r = data
    if (search) { const q = search.toLowerCase(); r = r.filter(s => s.nama?.toLowerCase().includes(q) || s.nisn?.toLowerCase().includes(q)) }
    if (hideDone && doneIds.length) r = r.filter(s => !doneIds.includes(s.student_id))
    return r
  }, [data, search, hideDone, doneIds])

  const fActive = filters.company || filters.kelas || filters.jurusan || filters.status
  const tOpts = [...new Set(filterOpts.kelasJurusanList.map(c => c.kelas))].sort()
  const jOpts = filters.kelas ? [...new Set(filterOpts.kelasJurusanList.filter(c => c.kelas===filters.kelas).map(c => c.jurusan))].sort() : [...new Set(filterOpts.kelasJurusanList.map(c => c.jurusan))].sort()

  const sCards = [
    {l:'Peserta PKL',v:stats.total,e:'👥',g:'from-slate-500 to-slate-600'},
    {l:'Hadir',v:stats.hadir,e:'✅',g:'from-emerald-500 to-emerald-600'},
    {l:'Sakit',v:stats.sakit,e:'🤒',g:'from-amber-500 to-amber-600'},
    {l:'Izin',v:stats.izin,e:'📝',g:'from-blue-500 to-blue-600'},
    {l:'Alpha',v:stats.alpha,e:'❌',g:'from-red-500 to-red-600'},
    {l:'Terlambat',v:stats.terlambat,e:'⏰',g:'from-orange-500 to-orange-600'},
    {l:'Kehadiran',v:stats.persentase,e:'📈',g:'from-purple-500 to-purple-600',t:true},
  ]
  const legItems = [
    {l:'Hadir',v:stats.hadir,c:'#10B981'}, {l:'Sakit',v:stats.sakit,c:'#F59E0B'}, {l:'Izin',v:stats.izin,c:'#3B82F6'},
    {l:'Alpha',v:stats.alpha,c:'#EF4444'}, {l:'Terlambat',v:stats.terlambat,c:'#F97316'}, {l:'Libur',v:stats.libur,c:'#6B7280'},
  ]

  // ─── Helper: render bulanan cell ───
  const bCell = (d, idx) => {
    const key = d?.date || `empty-${idx}`
    if (!d) return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center"><span className="text-gray-300 text-[9px]">-</span></td>
    const we = new Date(d.date+'T00:00:00').getDay()%6 === 0
    if (!d.inRange || (!d.status && !d.isPastOrToday)) {
      return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center"><span className="text-gray-300 text-[9px]">-</span></td>
    }
    if (we) {
      return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center" style={{background:'#fecaca'}}><span className="text-[9px] font-bold text-red-700">{d.status==='Libur'?'L':(d.status?(SC[d.status]?.label||'-'):'-')}</span></td>
    }
    if (d.status) {
      const c = SC[d.status]
      if (!c) return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center"><span className="text-[9px] text-gray-400">{d.status}</span></td>
      const bg = d.status==='Alpha' ? '#FEE2E2' : (d.status==='Libur' ? '#F3F4F6' : c.bg)
      const cl = d.status==='Libur' ? '#6B7280' : c.color
      return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center" style={{background:bg}}><span className="text-[9px] font-extrabold" style={{color:cl}}>{c.label}</span></td>
    }
    return <td key={key} className="py-1 px-0 border-r border-b border-gray-200 text-center"><span className="text-gray-300 text-[9px]">-</span></td>
  }

  // ─── BUILD TABLE CONTENT ───
  let tableContent = null

  if (loadingErr) {
    tableContent = (
      <div className="text-center py-12 px-4">
        <AlertTriangle size={40} className="mx-auto text-red-300 mb-3"/>
        <p className="text-red-600 font-semibold text-sm">{loadingErr}</p>
        <button onClick={() => { setLoadingErr(null); setLoading(true) }} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 mx-auto"><RotateCcw size={14}/>Coba Lagi</button>
      </div>
    )
  } else if (loading && data.length === 0) {
    if (activeTab === 'harian') tableContent = <SkelHarian/>
    else if (activeTab === 'bulanan') tableContent = <SkelBulanan days={dim||31}/>
    else tableContent = <SkelSemester/>
  } else if (fData.length === 0) {
    tableContent = (
      <div className="text-center py-12">
        <Users size={40} className="mx-auto text-gray-200 mb-3"/>
        <p className="text-gray-500 font-semibold text-sm">Tidak ada data siswa PKL</p>
        <p className="text-gray-400 text-[11px] sm:text-xs mt-1">{fActive||search||hideDone?'Coba ubah filter atau pencarian':'Pastikan ada siswa yang memiliki profil PKL'}</p>
      </div>
    )
  } else if (activeTab === 'harian') {
    tableContent = (
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase w-8">No</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">NISN</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">Nama</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center w-8">L/P</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">Kelas</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">Jurusan</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden lg:table-cell">Pemb.Industri</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden lg:table-cell">Guru Pemb.</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden md:table-cell">Perusahaan</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center">Masuk</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center">Pulang</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center">Status</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center hidden sm:table-cell">Terlambat</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center w-16 sm:w-20">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {fData.map((s,i) => (
            <tr key={s.student_id} className="hover:bg-blue-50/30">
              <td className="py-2.5 px-2 text-gray-500 text-[11px]">{i+1}</td>
              <td className="py-2.5 px-2 text-gray-600 font-mono text-[11px]">{s.nisn||'-'}</td>
              <td className="py-2.5 px-2 font-semibold text-gray-800 text-xs sm:text-sm">{s.nama}{s.isFlexible && <span className="ml-1 px-1 py-0 rounded text-[8px] font-bold bg-purple-100 text-purple-600">F</span>}</td>
              <td className="py-2.5 px-2 text-center text-[11px] text-gray-600">{s.jenis_kelamin==='P'?'P':'L'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600">{s.kelas||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600">{s.jurusan||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden lg:table-cell">{s.industry_supervisor||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden lg:table-cell">{s.guru_pembimbing||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden md:table-cell max-w-[120px] truncate">{s.company_name||'-'}</td>
              <td className="py-2.5 px-2 text-center text-[11px] text-gray-600">{s.attendance?.check_in_time||'-'}</td>
              <td className="py-2.5 px-2 text-center text-[11px] text-gray-600">{s.attendance?.check_out_time||'-'}</td>
              <td className="py-2.5 px-2 text-center">{sBadge(s.computedStatus)}</td>
              <td className="py-2.5 px-2 text-center hidden sm:table-cell"><span className={`text-[11px] font-semibold ${s.attendance?.is_late?'text-orange-600':'text-gray-400'}`}>{s.attendance?.is_late?'Ya':'Tidak'}</span></td>
              <td className="py-2.5 px-2">
                <div className="flex gap-1 justify-center">
                  <button onClick={() => openDetail(s)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Detail"><Eye size={13}/></button>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition" title="Edit"><Pencil size={13}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  } else if (activeTab === 'bulanan') {
    const dayCols = []
    for (let d = 1; d <= (dim||0); d++) {
      const dt = new Date(selYear, selMonth-1, d)
      const di = dt.getDay()
      const we = di === 0 || di === 6
      dayCols.push(
        <th key={d} className={`py-1 px-0 border-r border-b border-gray-300 text-center font-semibold ${we ? 'bg-red-100 text-red-600' : 'text-gray-600'}`} style={{minWidth:24}}>
          <div className="text-[9px] sm:text-[10px] leading-none">{d}</div>
          <div className={`text-[7px] sm:text-[8px] leading-none mt-0.5 ${we ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{DAY_HDR[di]}</div>
        </th>
      )
    }

    tableContent = (
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] sm:text-xs border-collapse" style={{minWidth:(dim||31)*28 + 520}}>
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th rowSpan={2} className="py-2 px-1.5 border-r border-b border-gray-300 font-bold text-gray-700 uppercase w-8 md:sticky left-0 bg-gray-100 z-10">No</th>
              <th rowSpan={2} className="py-2 px-2 border-r border-b border-gray-300 font-bold text-gray-700 uppercase min-w-[110px] md:sticky left-[32px] bg-gray-100 z-10 text-left">Nama Siswa</th>
              <th rowSpan={2} className="py-2 px-1 border-r border-b border-gray-300 font-bold text-gray-700 uppercase min-w-[24px] text-center">L/P</th>
              <th colSpan={dim||1} className="py-2 px-1 border-r border-b border-gray-300 font-bold text-gray-700 text-center text-[10px] sm:text-xs">{mName} {selYear}</th>
              <th rowSpan={2} className="py-2 px-1 border-r border-b border-gray-300 font-bold text-gray-700 uppercase text-center min-w-[34px]"><span className="text-[8px] sm:text-[9px] leading-tight block">Hari</span><span className="text-[8px] sm:text-[9px] leading-tight block">Efektif</span></th>
              <th colSpan={5} className="py-2 px-1 border-b border-gray-300 font-bold text-gray-700 text-center text-[10px] sm:text-xs">Total</th>
              <th rowSpan={2} className="py-2 px-1 border-b border-gray-300 font-bold text-gray-700 uppercase text-center min-w-[48px]"><span className="text-[8px] sm:text-[9px]">% Hadir</span></th>
            </tr>
            <tr className="bg-gray-100 border-b border-gray-300">
              {dayCols}
              <th className="py-1 px-1 border-r border-b border-gray-300 text-center font-semibold text-emerald-700">H</th>
              <th className="py-1 px-1 border-r border-b border-gray-300 text-center font-semibold text-amber-700">S</th>
              <th className="py-1 px-1 border-r border-b border-gray-300 text-center font-semibold text-blue-700">I</th>
              <th className="py-1 px-1 border-r border-b border-gray-300 text-center font-semibold text-red-700">A</th>
              <th className="py-1 px-1 border-b border-gray-300 text-center font-semibold text-orange-700">T</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fData.map((s,i) => {
              const ct = {Hadir:0, Sakit:0, Izin:0, Alpha:0, Terlambat:0, Libur:0}
              let ed = s.effectiveDays
              if (ed == null) { ed = 0; (s.days||[]).forEach(d => { if (d.isWorkDay && d.inRange && d.isPastOrToday) ed++ }) }
              // Hitung ct SEBELUM render, agar pct akurat
              ;(s.days||[]).forEach(d => { if (d.status) ct[d.status] = (ct[d.status]||0)+1 })
              const ht = ct.Hadir + ct.Terlambat
              const pct = ed > 0 ? ((ht/ed)*100).toFixed(1) : '0.0'
              return (
                <tr key={s.student_id} className="hover:bg-blue-50/20">
                  <td className="py-1.5 px-1.5 border-r border-b border-gray-200 text-gray-500 text-center md:sticky left-0 bg-white z-10">{i+1}</td>
                  <td className="py-1.5 px-2 border-r border-b border-gray-200 font-semibold text-gray-800 text-left max-w-[120px] truncate md:sticky left-[32px] bg-white z-10">{s.nama}{s.isFlexible && <span className="ml-0.5 text-[7px] font-bold text-purple-500">F</span>}</td>
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center text-gray-600">{s.jenis_kelamin==='P'?'P':'L'}</td>
                  {(s.days||[]).map((d, di) => bCell(d, di))}
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center font-bold text-gray-700">{ed}</td>
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center font-semibold text-emerald-700">{ct.Hadir}</td>
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center font-semibold text-amber-700">{ct.Sakit}</td>
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center font-semibold text-blue-700">{ct.Izin}</td>
                  <td className="py-1.5 px-1 border-r border-b border-gray-200 text-center font-semibold text-red-700">{ct.Alpha}</td>
                  <td className="py-1.5 px-1 border-b border-gray-200 text-center font-semibold text-orange-700">{ct.Terlambat}</td>
                  <td className="py-1.5 px-1 border-b border-gray-200 text-center font-bold text-gray-700">{pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  } else {
    tableContent = (
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase w-8">No</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">NISN</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase">Nama</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center w-8">L/P</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden md:table-cell">Kelas</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden md:table-cell">Jurusan</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden lg:table-cell">Perusahaan</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase hidden lg:table-cell">Pemb.Industri</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-emerald-700">H</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-amber-700">S</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-blue-700">I</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-red-700">A</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-orange-700">T</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center text-gray-500">Libur</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center">Kerja</th>
            <th className="py-2.5 px-2 font-bold text-gray-700 text-[10px] uppercase text-center w-14">% Hadir</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {fData.map((s,i) => (
            <tr key={s.student_id} className="hover:bg-blue-50/30">
              <td className="py-2.5 px-2 text-gray-500 text-[11px]">{i+1}</td>
              <td className="py-2.5 px-2 text-gray-600 font-mono text-[11px]">{s.nisn||'-'}</td>
              <td className="py-2.5 px-2 font-semibold text-gray-800 text-xs sm:text-sm">{s.nama}{s.isFlexible && <span className="ml-1 px-1 py-0 rounded text-[8px] font-bold bg-purple-100 text-purple-600">F</span>}</td>
              <td className="py-2.5 px-2 text-center text-[11px] text-gray-600">{s.jenis_kelamin==='P'?'P':'L'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden md:table-cell">{s.kelas||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden md:table-cell">{s.jurusan||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden lg:table-cell max-w-[120px] truncate">{s.company_name||'-'}</td>
              <td className="py-2.5 px-2 text-[11px] text-gray-600 hidden lg:table-cell max-w-[100px] truncate">{s.industry_supervisor||'-'}</td>
              <td className="py-2.5 px-2 text-center font-semibold text-emerald-700">{s.Hadir||0}</td>
              <td className="py-2.5 px-2 text-center font-semibold text-amber-700">{s.Sakit||0}</td>
              <td className="py-2.5 px-2 text-center font-semibold text-blue-700">{s.Izin||0}</td>
              <td className="py-2.5 px-2 text-center font-semibold text-red-700">{s.Alpha||0}</td>
              <td className="py-2.5 px-2 text-center font-semibold text-orange-700">{s.Terlambat||0}</td>
              <td className="py-2.5 px-2 text-center text-gray-500">{s.Libur||0}</td>
              <td className="py-2.5 px-2 text-center font-bold text-gray-700">{s.totalKerja||0}</td>
              <td className="py-2.5 px-2 text-center font-bold text-gray-800">{s.persentase||'0.0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 bg-gray-50/50 min-h-screen">

      {toast && (
        <div className={`fixed top-3 right-3 z-[9999] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 max-w-[calc(100vw-24px)] animate-slideDown ${toast.type==='success'?'bg-emerald-500 text-white':'bg-red-500 text-white'}`}>
          {toast.type==='success' ? <CheckCircle size={15}/> : <AlertTriangle size={15}/>}
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-lg sm:text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
          <BarChart3 size={22} className="text-blue-600"/><span>Rekap Kehadiran PKL</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monitoring kehadiran siswa Praktik Kerja Lapangan</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-3">
        {sCards.map((s,i) => (
          <div key={i} className={`bg-gradient-to-br ${s.g} p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg`}>
            <span className="text-sm sm:text-lg">{s.e}</span>
            <p className="text-base sm:text-xl md:text-2xl font-extrabold mt-0.5 leading-tight">{s.t ? `${s.v}%` : <CountUp end={s.v}/>}</p>
            <p className="text-[8px] sm:text-[10px] opacity-80 font-medium truncate">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <div className="transform scale-[0.72] sm:scale-100 origin-center shrink-0"><DonutChart data={legItems} size={130} stroke={16}/></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full">
            {legItems.map((d,i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm shrink-0" style={{backgroundColor:d.c}}/>
                <span className="text-gray-600 text-[11px] sm:text-sm">{d.l}</span>
                <span className="font-bold text-gray-800 ml-auto text-[11px] sm:text-sm">{d.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filters.kelas && filters.jurusan && <PJInfoCard kelas={filters.kelas} jurusan={filters.jurusan}/>}

      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border space-y-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-3 items-center">
          <div className="flex items-center gap-1 shrink-0"><Filter size={14} className="text-gray-500"/><span className="text-xs sm:text-sm font-semibold text-gray-700">Filter:</span></div>
          <select value={filters.company} onChange={e=>hFC('company',e.target.value)} className="flex-1 min-w-0 sm:min-w-[150px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"><option value="">Semua Perusahaan</option>{filterOpts.companies.map((c,i)=><option key={i} value={c}>{c}</option>)}</select>
          <select value={filters.kelas} onChange={e=>hFC('kelas',e.target.value)} disabled={isWK} className={`flex-1 min-w-0 sm:min-w-[100px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 ${isWK?'opacity-60 cursor-not-allowed':''}`}><option value="">Semua Tingkat</option>{tOpts.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <select value={filters.jurusan} onChange={e=>hFC('jurusan',e.target.value)} disabled={isWK&&!wkNeedJur} className={`flex-1 min-w-0 sm:min-w-[120px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 ${isWK&&!wkNeedJur?'opacity-60 cursor-not-allowed':''}`}><option value="">Semua Jurusan</option>{jOpts.map(j=><option key={j} value={j}>{j}</option>)}</select>
          <select value={filters.status} onChange={e=>hFC('status',e.target.value)} className="flex-1 min-w-0 sm:min-w-[130px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"><option value="">Semua Status</option>{filterOpts.statuses.map(s=><option key={s} value={s}>{s}</option>)}</select>
          {fActive && !isWK && <button onClick={()=>setFilters({company:'',kelas:'',jurusan:'',status:''})} className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"><RotateCcw size={11}/><span className="hidden sm:inline">Reset</span></button>}
        </div>
        {isWK && <span className={`inline-flex self-start px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-lg ${wkNeedJur&&!filters.jurusan?'text-amber-700 bg-amber-50':'text-purple-700 bg-purple-50'}`}>{wkNeedJur&&!filters.jurusan?`⚠️ Kelas Binaan: ${filters.kelas} — Pilih Jurusan ↓`:`📋 Kelas Binaan: ${filters.kelas} ${filters.jurusan||''}`}</span>}
        <div className="flex flex-col sm:flex-row gap-2">
          {isAdm && <div className="relative flex-1 min-w-0 order-2 sm:order-1"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama/NISN..." className="w-full pl-8 pr-7 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-0"/>{search && <button onClick={()=>setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition text-gray-400"><X size={13}/></button>}</div>}
          <div className="flex gap-1.5 sm:gap-2 shrink-0 order-1 sm:order-2 sm:ml-auto">
            <button onClick={exportCSV} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-emerald-100 transition flex items-center justify-center gap-1"><FileSpreadsheet size={13}/>CSV</button>
            <button onClick={exportPDF} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1"><Printer size={13}/>PDF</button>
            {isAdm && <button onClick={()=>{setShowResetModal(true);setResetStep(1);setResetText('')}} className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1"><Trash2 size={13}/><span className="hidden sm:inline">Reset Semua</span></button>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-100">
          {['harian','bulanan','semester'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition relative ${activeTab===t?'text-blue-600':'text-gray-500 hover:text-gray-700'}`}>
              {t==='harian'?'📅 Harian':t==='bulanan'?'📆 Bulanan':'📋 Semester'}
              {activeTab===t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t"/>}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-4 border-b border-gray-50">
          {activeTab==='harian' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-blue-500 shrink-0"/><input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"/></div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none"><input type="checkbox" checked={hideDone} onChange={e=>setHideDone(e.target.checked)} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="text-[11px] sm:text-xs text-gray-600 font-medium">Sembunyikan Selesai</span></label>
              {hideDone && doneIds.length>0 && <button onClick={()=>{setShowDelModal(true);setDelStep(1);setDelText('')}} className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1.5"><Trash2 size={11}/>Hapus Data Selesai ({doneIds.length})</button>}
            </div>
          )}
          {activeTab==='bulanan' && (
            <div className="flex flex-wrap items-center gap-2">
              <CalendarDays size={14} className="text-blue-500 shrink-0"/>
              <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">{MONTHS.slice(1).map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
              <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800">{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</select>
              <span className="text-xs sm:text-sm text-gray-600 font-semibold">{mName} {selYear}</span>
            </div>
          )}
          {activeTab==='semester' && semInfo && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600"><CalendarDays size={14} className="text-blue-500 shrink-0"/><span className="font-semibold">{semInfo.label}</span><span className="text-gray-400 hidden sm:inline">({semInfo.startDate} s.d. {semInfo.endDate})</span></div>
          )}
        </div>

        <div className="overflow-x-auto">
          {tableContent}
        </div>
      </div>

      {/* ═══ MODAL: DETAIL ABSENSI PKL ═══ */}
      {detailModal && detailData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => { setDetailModal(false); setDetailData(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-800 flex items-center gap-2"><Eye size={16} className="text-blue-600"/>Detail Absensi PKL</h3>
              <button onClick={() => { setDetailModal(false); setDetailData(null) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><X size={18}/></button>
            </div>
            <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
              {/* Header Profil Siswa */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-extrabold">{(detailData.nama||'?')[0]}</div>
                  <div>
                    <p className="font-bold text-base">{detailData.nama||'-'}</p>
                    <p className="text-blue-100 text-xs">NISN: {detailData.nisn||'-'}</p>
                    <p className="text-blue-100 text-xs">Kelas: {detailData.kelas||'-'}{detailData.jurusan ? ` ${detailData.jurusan}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1 flex items-center gap-1"><CalendarDays size={11}/>Tanggal</p>
                  <p className="text-gray-800 font-semibold text-[11px]">{detailData.attendance?.attendance_date ? new Date(detailData.attendance.attendance_date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : selDate}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1 flex items-center gap-1"><Clock size={11}/>Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sBadge(detailData.attendance?.status || detailData.computedStatus || '-')}
                    <span className="text-sm font-semibold text-gray-800">{detailData.attendance?.status || detailData.computedStatus || '-'}</span>
                    {detailData.attendance?.is_late && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">TERLAMBAT</span>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1 flex items-center gap-1"><LogIn size={11}/>Jam Masuk</p>
                  <p className="text-gray-800 font-semibold">{detailData.attendance?.check_in_time||'-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1 flex items-center gap-1"><LogOut size={11}/>Jam Pulang</p>
                  <p className="text-gray-800 font-semibold">{detailData.attendance?.check_out_time||'-'}</p>
                </div>
              </div>

              {/* Catatan */}
              {detailData.attendance?.note && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3"><p className="text-yellow-700 text-[10px] uppercase font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={11}/>Catatan</p><p className="text-yellow-800 text-xs">{detailData.attendance.note}</p></div>}

              {/* Foto Selfie */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-gray-500 text-[10px] uppercase font-semibold mb-1.5 flex items-center gap-1"><Camera size={11}/>Selfie Masuk</p>{detailData.attendance?.selfie_url ? <img
  src={getOptimizedImageUrl(detailData.selfie_url, 'medium')}
  alt="Selfie masuk"
  loading="lazy"
  decoding="async"
  referrerPolicy="no-referrer"
  className="..."
  onClick={() => setSelfieZoom(getOptimizedImageUrl(detailData.selfie_url, 'full'))}
/> : <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center gap-1"><Camera size={24} className="text-gray-300"/><span className="text-[10px] text-gray-400">Tidak ada foto</span></div>}</div>
                <div><p className="text-gray-500 text-[10px] uppercase font-semibold mb-1.5 flex items-center gap-1"><Camera size={11}/>Selfie Pulang</p>{detailData.attendance?.check_out_selfie_url ? <img
  src={getOptimizedImageUrl(detailData.check_out_selfie_url, 'medium')}
  alt="Selfie pulang"
  loading="lazy"
  decoding="async"
  referrerPolicy="no-referrer"
  className="..."
  onClick={() => setSelfieZoom(getOptimizedImageUrl(detailData.check_out_selfie_url, 'full'))}
/> : <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center gap-1"><Camera size={24} className="text-gray-300"/><span className="text-[10px] text-gray-400">{detailData.attendance?.check_out_time ? 'Tidak ada foto' : 'Belum absen pulang'}</span></div>}</div>
              </div>

              {/* Lokasi GPS */}
              {(detailData.attendance?.check_in_latitude || detailData.attendance?.check_in_longitude) && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><p className="text-blue-700 text-[10px] uppercase font-semibold mb-1.5 flex items-center gap-1"><MapPin size={11}/>Lokasi GPS Masuk</p><p className="text-blue-800 text-[11px]">Lat: {detailData.attendance.check_in_latitude}, Lng: {detailData.attendance.check_in_longitude}</p>{detailData.attendance.check_in_address && <p className="text-blue-600 text-[11px] mt-0.5">{detailData.attendance.check_in_address}</p>}<a href={`https://www.google.com/maps?q=${detailData.attendance.check_in_latitude},${detailData.attendance.check_in_longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-semibold hover:bg-blue-700 transition"><MapPin size={11}/>Buka Google Maps</a></div>}

              {/* Profil PKL */}
              {detailData.company_name && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 space-y-2">
                  <p className="text-blue-700 text-[10px] uppercase font-extrabold flex items-center gap-1"><Building2 size={12}/>Profil PKL</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-gray-500">Perusahaan:</span><p className="font-semibold text-gray-800">{detailData.company_name||'-'}</p></div>
                    <div><span className="text-gray-500">Status PKL:</span>
                      <p className="font-semibold flex items-center gap-1.5">
                        {detailData.status === 'Berjalan' ? (
                          <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"/></span><span className="text-emerald-600">Berjalan</span></>
                        ) : detailData.status === 'Selesai' ? (
                          <><span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"/><span className="text-gray-600">{detailData.status}</span></>
                        ) : (
                          <><span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"/><span className="text-amber-600">{detailData.status||'-'}</span></>
                        )}
                      </p>
                    </div>
                    <div className="col-span-2"><span className="text-gray-500">Alamat Perusahaan:</span><p className="font-semibold text-gray-800">{detailData.company_address||'-'}</p></div>
                    <div><span className="text-gray-500">Pembimbing:</span><p className="font-semibold text-gray-800">{detailData.industry_supervisor||'-'}</p></div>
                    <div><span className="text-gray-500">Guru Pemb:</span><p className="font-semibold text-gray-800">{detailData.guru_pembimbing||'-'}</p></div>
                    <div><span className="text-gray-500">Periode:</span><p className="font-semibold text-gray-800">{detailData.start_date||'-'} s.d. {detailData.end_date||'-'}</p></div>
                    <div><span className="text-gray-500">Jam Kerja:</span><p className="font-semibold text-gray-800">{detailData.work_start_time||'-'} - {detailData.work_end_time||'-'}</p></div>
                    <div className="col-span-2"><span className="text-gray-500">Hari Kerja:</span><p className="font-semibold text-gray-800">{Array.isArray(detailData.work_days) ? detailData.work_days.join(', ') : '-'}</p></div>
                    <div><span className="text-gray-500">Radius:</span><p className="font-semibold text-gray-800">{detailData.radius_meter||50} meter</p></div>
                    {detailData.latitude && detailData.longitude && <div><span className="text-gray-500">Lokasi:</span><a href={`https://www.google.com/maps?q=${detailData.latitude},${detailData.longitude}`} target="_blank" rel="noopener noreferrer" className="block font-semibold text-blue-600 hover:underline">{detailData.latitude}, {detailData.longitude}</a></div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: EDIT STATUS ═══ */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between"><h3 className="text-sm sm:text-base font-extrabold text-gray-800 flex items-center gap-2"><Pencil size={16} className="text-amber-600"/>Edit Status Absen</h3><button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><X size={18}/></button></div>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1"><p className="font-semibold text-gray-800">{editData.nama}</p><p className="text-gray-500">NISN: {editData.nisn||'-'} · {editData.kelas||''} {editData.jurusan||''}</p><p className="text-gray-500">Status saat ini: <span className="font-bold text-gray-700">{editData.cur}</span></p></div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={11}/>Tanggal Absensi</label>
                <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"/>
                <p className="text-[10px] text-gray-400 mt-1">Pilih tanggal untuk mengubah atau menambahkan status kehadiran</p>
              </div>
              <div><label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Ubah Status Menjadi</label><select value={editSt} onChange={e=>setEditSt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"><option value="">-- Pilih Status --</option><option value="Hadir">Hadir</option><option value="Terlambat">Terlambat</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Alpha">Alpha</option></select></div>
              {(editSt==='Sakit'||editSt==='Izin'||editSt==='Alpha') && <div><label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Catatan {(editSt==='Sakit'||editSt==='Izin')?'(Wajib)':'(Opsional)'}</label><textarea value={editNote} onChange={e=>setEditNote(e.target.value)} rows={2} placeholder="Alasan..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 resize-none"/></div>}
              <div className="flex gap-2 pt-2"><button onClick={() => setShowEditModal(false)} className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition">Batal</button><button onClick={saveEdit} disabled={!editSt||!editDate||saving} className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">{saving ? <><Loader2 size={13} className="animate-spin"/>Menyimpan...</> : <><Save size={13}/>Simpan</>}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: RESET SEMUA ═══ */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { setShowResetModal(false); setResetStep(1); setResetText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between"><h3 className="text-sm sm:text-base font-extrabold text-red-600 flex items-center gap-2"><Trash2 size={16}/>Reset Semua Data PKL</h3><button onClick={() => { setShowResetModal(false); setResetStep(1); setResetText('') }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><X size={18}/></button></div>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              {resetStep===1 ? (
                <><div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1"><p className="font-bold">⚠️ Peringatan!</p><p>Semua data PKL akan dihapus permanen:</p><ul className="list-disc pl-4 space-y-0.5 text-red-600"><li>Semua profil PKL siswa</li><li>Semua record absensi PKL</li><li>Semua foto selfie di storage</li></ul></div><button onClick={handleReset} className="w-full px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition">Lanjutkan</button></>
              ) : (
                <><p className="text-xs text-gray-600">Ketik <span className="font-bold text-red-600">HAPUS SEMUA</span> untuk konfirmasi:</p><input ref={rstRef} type="text" value={resetText} onChange={e=>setResetText(e.target.value)} placeholder="HAPUS SEMUA" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-800 font-mono"/><button onClick={handleReset} disabled={resetText!=='HAPUS SEMUA'||resetting} className="w-full px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">{resetting ? <><Loader2 size={13} className="animate-spin"/>Menghapus...</> : 'Hapus Permanen'}</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: HAPUS DATA SELESAI ═══ */}
      {showDelModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => { setShowDelModal(false); setDelStep(1); setDelText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between"><h3 className="text-sm sm:text-base font-extrabold text-red-600 flex items-center gap-2"><Trash2 size={16}/>Hapus Data Selesai</h3><button onClick={() => { setShowDelModal(false); setDelStep(1); setDelText('') }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"><X size={18}/></button></div>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              {delStep===1 ? (
                <><div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700"><p className="font-bold">Hapus {doneIds.length} siswa dengan status PKL Selesai</p><p className="mt-1">Data profil PKL dan seluruh riwayat absensi akan dihapus permanen.</p></div><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700"><p>💡 Saran: Download arsip CSV terlebih dahulu sebelum menghapus.</p></div><button onClick={handleDelDone} className="w-full px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition">Lanjutkan</button></>
              ) : (
                <><p className="text-xs text-gray-600">Ketik <span className="font-bold text-red-600">HAPUS SELESAI</span> untuk konfirmasi:</p><input ref={delRef} type="text" value={delText} onChange={e=>setDelText(e.target.value)} placeholder="HAPUS SELESAI" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-800 font-mono"/><button onClick={handleDelDone} disabled={delText!=='HAPUS SELESAI'||deling} className="w-full px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">{deling ? <><Loader2 size={13} className="animate-spin"/>Menghapus data...</> : 'Hapus Permanen'}</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: SELFIE ZOOM ═══ */}
      {selfieZoom && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4" onClick={() => setSelfieZoom(null)}>
          <img src={selfieZoom} alt="Selfie Zoom" referrerPolicy="no-referrer" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()}/>
          <button onClick={() => setSelfieZoom(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition"><X size={20}/></button>
        </div>
      )}
    </div>
  )
}