'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CalendarDays, Users, UserCheck, HeartPulse, Shield, AlertTriangle,
  Clock, CheckCircle, Save, Lock, GraduationCap, Filter,
  Send, X, XCircle, MessageCircle, Loader2
} from 'lucide-react'
import {
  getAllKelas, getKelasFilters, getAbsensiByDate, batchUpsertAbsensi, getAbsensiStats,
  submitAbsensi, isAbsensiSubmitted, createEditRequest, checkPendingRequest, getUserKelasInfo
} from '@/app/actions/absensiActions'
// [WA] Import fungsi WhatsApp
import { getAlphaStudentsForWA, executeSendWA } from '@/app/actions/whatsappActions'

function CountUp({ end, duration = 1000 }) {
  const [count, setCount] = useState(0)
  const prevEnd = React.useRef(0)
  useEffect(() => {
    const startVal = prevEnd.current; const startTime = Date.now()
    const animate = () => { const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1); const eased = 1 - Math.pow(1 - progress, 3); setCount(Math.round(startVal + (end - startVal) * eased)); if (progress < 1) requestAnimationFrame(animate) }
    requestAnimationFrame(animate); prevEnd.current = end
  }, [end, duration])
  return <span>{count}</span>
}

function getWIBHourMinutes() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' })
  const parts = formatter.formatToParts(now)
  return { hour: parseInt(parts.find(p => p.type === 'hour').value), minute: parseInt(parts.find(p => p.type === 'minute').value) }
}

function formatWIBTime() { return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }) }

function parseKelasJurusan(kelas) {
  if (!kelas) return { tingkat: '', jurusan: '' }
  const parts = kelas.trim().split(/\s+/)
  return { tingkat: parts[0] || '', jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || '') }
}

const badgeConfig = {
  Hadir: { label: 'H', fullLabel: 'Hadir', color: '#10B981', bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', emoji: '🟢' },
  Sakit: { label: 'S', fullLabel: 'Sakit', color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', emoji: '🟡' },
  Izin:  { label: 'I', fullLabel: 'Izin', color: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', emoji: '🔵' },
  Alpha: { label: 'A', fullLabel: 'Alpha', color: '#EF4444', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', emoji: '🔴' },
}

export default function AbsensiKehadiran() {
  const [userData, setUserData] = useState(null)
  const [kelasList, setKelasList] = useState([])
  const [kelasJurusanList, setKelasJurusanList] = useState([])
  const [selectedTingkat, setSelectedTingkat] = useState('')
  const [selectedJurusan, setSelectedJurusan] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')
  const [kelasNotFound, setKelasNotFound] = useState(false)
  const [siswaList, setSiswaList] = useState([])
  const [stats, setStats] = useState({ total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, belum: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [currentTime, setCurrentTime] = useState(formatWIBTime())
  const [withinTime, setWithinTime] = useState(true)
  const [timeStatus, setTimeStatus] = useState('within')
  const today = new Date().toLocaleDateString('sv-SE')
  const todayDisplay = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Filter tanggal khusus Administrator
  const [selectedDate, setSelectedDate] = useState(today)
  const isAdmin = userData?.role === 'Administrator'
  const isSekretaris = userData?.role === 'Sekretaris Kelas'
  const fetchDate = isAdmin ? selectedDate : today
  const activeDateDisplay = isAdmin
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : todayDisplay

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editRequestReason, setEditRequestReason] = useState('')
  const [showEditRequestModal, setShowEditRequestModal] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [hasApprovedRequest, setHasApprovedRequest] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [sekretarisFullKelas, setSekretarisFullKelas] = useState('')

  // [WA] State untuk Finalisasi & Kirim WhatsApp
  const [waModal, setWaModal] = useState(null) // null | 'confirm' | 'sending' | 'result'
  const [waAlphaStudents, setWaAlphaStudents] = useState([])
  const [waResult, setWaResult] = useState(null)

  useEffect(() => {
    if (userData?.role !== 'Sekretaris Kelas') return
    const updateTimer = () => {
      const now = new Date()
      const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' })
      const parts = fmt.formatToParts(now)
      const h = parseInt(parts.find(p => p.type === 'hour').value)
      const m = parseInt(parts.find(p => p.type === 'minute').value)
      const s = parseInt(parts.find(p => p.type === 'second').value)
      const currentSec = h * 3600 + m * 60 + s
      const diff = (14 * 3600 + 40 * 60) - currentSec
      if (diff <= 0) { setTimeRemaining(''); return }
      setTimeRemaining(`${String(Math.floor(diff / 3600)).padStart(2, '0')}:${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`)
    }
    updateTimer(); const interval = setInterval(updateTimer, 1000); return () => clearInterval(interval)
  }, [userData])

  useEffect(() => { try { const stored = localStorage.getItem('userData'); if (stored) setUserData(JSON.parse(stored)) } catch {} }, [])
  useEffect(() => { const init = async () => { setLoading(true); const kelasRes = await getAllKelas(); if (kelasRes.kelas) setKelasList(kelasRes.kelas); setLoading(false) }; init() }, [])
  useEffect(() => { const fetchFilters = async () => { const res = await getKelasFilters(); if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList) }; fetchFilters() }, [])
  useEffect(() => {
    if (userData && userData.role === 'Sekretaris Kelas' && userData.id) {
      const initSekretarisKelas = async () => {
        try {
          const dbInfo = await getUserKelasInfo(userData.id)
          if (dbInfo.kelas) {
            setSelectedTingkat(dbInfo.kelas.trim())
            setSelectedJurusan(dbInfo.jurusan ? dbInfo.jurusan.trim() : '')
            const full = dbInfo.jurusan ? `${dbInfo.kelas.trim()} ${dbInfo.jurusan.trim()}` : dbInfo.kelas.trim()
            setSelectedKelas(full)
            setSekretarisFullKelas(full)
            setKelasNotFound(false)
          } else {
            const parsed = parseKelasJurusan(userData.kelas)
            setSelectedTingkat(parsed.tingkat)
            setSelectedJurusan(parsed.jurusan)
            setSelectedKelas(userData.kelas)
            setSekretarisFullKelas(userData.kelas)
            setKelasNotFound(false)
          }
        } catch (e) {
          console.error('Gagal ambil kelas sekretaris dari DB:', e)
          const parsed = parseKelasJurusan(userData.kelas)
          setSelectedTingkat(parsed.tingkat)
          setSelectedJurusan(parsed.jurusan)
          setSelectedKelas(userData.kelas)
          setSekretarisFullKelas(userData.kelas)
          setKelasNotFound(false)
        }
      }
      initSekretarisKelas()
    }
  }, [userData])
  useEffect(() => { if (userData?.role !== 'Administrator') return; if (selectedTingkat && selectedJurusan) { setSelectedKelas(`${selectedTingkat} ${selectedJurusan}`); setKelasNotFound(false) } else { setSelectedKelas(''); setKelasNotFound(false) } }, [selectedTingkat, selectedJurusan, userData])

  const handleTingkatChange = (val) => { setSelectedTingkat(val); setSelectedJurusan(''); setSelectedKelas(''); setKelasNotFound(false) }
  const handleJurusanChange = (val) => { setSelectedJurusan(val) }
  const tingkatOptions = [...new Set(kelasJurusanList.map(c => c.kelas))].sort()
  const jurusanOptions = selectedTingkat
    ? [...new Set(kelasJurusanList.filter(c => c.kelas === selectedTingkat).map(c => c.jurusan))].sort()
    : [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()

  useEffect(() => {
    const checkTime = () => {
      setCurrentTime(formatWIBTime())
      if (userData && userData.role === 'Sekretaris Kelas') {
        const { hour, minute } = getWIBHourMinutes(); const totalMin = hour * 60 + minute
        if (totalMin < 9 * 60 + 5) { setWithinTime(false); setTimeStatus('before') }
        else if (totalMin > 14 * 60 + 40) { setWithinTime(false); setTimeStatus('after') }
        else { setWithinTime(true); setTimeStatus('within') }
      } else { setWithinTime(true); setTimeStatus('within') }
    }
    checkTime(); const interval = setInterval(checkTime, 1000); return () => clearInterval(interval)
  }, [userData])

  const fetchData = useCallback(async () => {
    if (!selectedKelas) return; setLoading(true)
    try {
      const [absensiRes, statsRes] = await Promise.all([getAbsensiByDate(fetchDate, selectedTingkat, selectedJurusan), getAbsensiStats(fetchDate, selectedTingkat, selectedJurusan)])
      if (absensiRes.data) setSiswaList(absensiRes.data); if (statsRes) setStats(statsRes)
      if (absensiRes.data && absensiRes.data.length === 0) setKelasNotFound(true); else setKelasNotFound(false)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [selectedKelas, selectedTingkat, selectedJurusan, fetchDate])

  useEffect(() => { if (selectedKelas) fetchData() }, [selectedKelas, fetchData])
  const showToast = (message, type = 'success') => setToast({ message, type, key: Date.now() })
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  const checkSubmitted = useCallback(async () => {
    if (!selectedKelas) return
    try {
      const res = await isAbsensiSubmitted(fetchDate, selectedTingkat, selectedJurusan); setIsSubmitted(res.submitted || false)
      if (userData?.role === 'Sekretaris Kelas' && userData?.id) { const reqRes = await checkPendingRequest(userData.id, fetchDate); setHasPendingRequest(reqRes.hasPending); setHasApprovedRequest(reqRes.hasApproved) }
    } catch (e) { console.error(e) }
  }, [selectedKelas, selectedTingkat, selectedJurusan, fetchDate, userData])

  useEffect(() => { if (selectedKelas) checkSubmitted() }, [selectedKelas, checkSubmitted])

  const canEdit = isAdmin || (isSekretaris && withinTime && selectedKelas === sekretarisFullKelas && sekretarisFullKelas && (!isSubmitted || hasApprovedRequest))

  const handleBadgeClick = async (siswa, newStatus) => {
    if (!canEdit) return
    if (isSekretaris && siswa.locked) return
    if (isSekretaris && !['Hadir', 'Alpha'].includes(newStatus)) return
    setSiswaList(prev => prev.map(s => s.id === siswa.id ? { ...s, status: newStatus, input_by: isSekretaris ? 'Sekretaris Kelas' : 'Administrator' } : s))
    setStats(prev => {
      const oldStatus = siswa.status; const newStats = { ...prev }
      if (oldStatus && oldStatus !== newStatus) {
        if (oldStatus === 'Hadir') newStats.hadir--; else if (oldStatus === 'Sakit') newStats.sakit--; else if (oldStatus === 'Izin') newStats.izin--; else if (oldStatus === 'Alpha') newStats.alpha--
        if (oldStatus !== null) newStats.belum++
      }
      if (newStatus === 'Hadir') { newStats.hadir++; newStats.belum-- } else if (newStatus === 'Sakit') { newStats.sakit++; newStats.belum-- } else if (newStatus === 'Izin') { newStats.izin++; newStats.belum-- } else if (newStatus === 'Alpha') { newStats.alpha++; newStats.belum-- }
      return newStats
    })
  }

  const handleSaveAll = async () => {
    const records = siswaList.filter(s => s.status && s.status !== null).map(s => ({
      siswa_id: s.id, tanggal: fetchDate, status: s.status,
      input_by: (s.input_by === 'QR Mandiri' || s.input_by === 'Sakit/Izin Online') ? s.input_by : (isSekretaris ? 'Sekretaris Kelas' : 'Administrator'),
      locked: false
    }))
    if (records.length === 0) { showToast('Belum ada data absensi untuk disimpan', 'error'); return }
    setSaving(true)
    const result = await batchUpsertAbsensi(records)
    if (result.error) { showToast(result.error, 'error'); setSaving(false); return }
    if (isSekretaris && hasApprovedRequest) {
      const lockResult = await submitAbsensi(fetchDate, selectedTingkat, selectedJurusan)
      if (lockResult.error) { showToast('Gagal mengunci: ' + lockResult.error, 'error') }
      else { setIsSubmitted(true); setHasApprovedRequest(false); showToast(`${result.count} data absensi berhasil direvisi dan dikunci kembali!`) }
    } else { showToast(`${result.count} data absensi berhasil disimpan!`) }
    setSaving(false); fetchData()
  }

  const handleMarkAllHadir = async () => {
    if (!canEdit) return; const belum = siswaList.filter(s => !s.status)
    if (belum.length === 0) { showToast('Semua siswa sudah memiliki status', 'info'); return }
    setSaving(true)
    const records = belum.map(s => ({ siswa_id: s.id, tanggal: fetchDate, status: 'Hadir', input_by: isSekretaris ? 'Sekretaris Kelas' : 'Administrator', locked: false }))
    const result = await batchUpsertAbsensi(records)
    if (result.error) { showToast(result.error, 'error') } else { showToast(`${result.count} siswa ditandai Hadir!`) }
    setSaving(false); fetchData()
  }

  const handleSubmitAbsensi = async () => {
    if (!canEdit) return; const belum = siswaList.filter(s => !s.status)
    if (belum.length > 0) { showToast(`${belum.length} siswa belum diabsen. Lengkapi semua terlebih dahulu!`, 'error'); return }
    setIsSubmitting(true)
    const records = siswaList.filter(s => s.status).map(s => ({
      siswa_id: s.id, tanggal: fetchDate, status: s.status,
      input_by: (s.input_by === 'QR Mandiri' || s.input_by === 'Sakit/Izin Online') ? s.input_by : 'Sekretaris Kelas',
      locked: false
    }))
    const saveResult = await batchUpsertAbsensi(records)
    if (saveResult.error) { showToast(saveResult.error, 'error'); setIsSubmitting(false); return }
    const lockResult = await submitAbsensi(fetchDate, selectedTingkat, selectedJurusan)
    if (lockResult.error) showToast(lockResult.error, 'error')
    else { setIsSubmitted(true); showToast('Absensi berhasil dikirim dan terkunci!') }
    setIsSubmitting(false)
  }

  const handleRequestEdit = async () => {
    if (!editRequestReason.trim()) { showToast('Isi alasan permintaan edit', 'error'); return }
    try {
      const result = await createEditRequest(userData.id, selectedTingkat, selectedJurusan, fetchDate, editRequestReason)
      if (result.error) showToast(result.error, 'error'); else { setHasPendingRequest(true); setShowEditRequestModal(false); setEditRequestReason(''); showToast('Permintaan edit berhasil dikirim ke Admin', 'success') }
    } catch (e) { showToast('Gagal mengirim permintaan', 'error') }
  }

  // Admin: reset isSubmitted saat ganti tanggal
  useEffect(() => { if (isAdmin) { setIsSubmitted(false); setHasPendingRequest(false); setHasApprovedRequest(false) } }, [selectedDate, isAdmin])

  // ═══════════════════════════════════════════════════════════
  // [WA] FINALISASI & KIRIM WHATSAPP
  // ═══════════════════════════════════════════════════════════
  const handleOpenWAModal = async () => {
    // 1. Cari siswa Alpha yang punya parent_whatsapp
    const res = await getAlphaStudentsForWA(fetchDate, selectedTingkat, selectedJurusan)
    if (res.error) { showToast(res.error, 'error'); return }
    setWaAlphaStudents(res.students || [])
    setWaModal('confirm')
  }

  const handleExecuteSendWA = async () => {
    setWaModal('sending')
    const res = await executeSendWA(waAlphaStudents, fetchDate, userData?.id)
    if (res.error) {
      showToast(res.error, 'error')
      setWaModal(null)
      return
    }
    setWaResult(res.results)
    setWaModal('result')
    // Refresh data absensi
    fetchData()
    checkSubmitted()
  }

  const handleCloseWAModal = () => {
    setWaModal(null)
    setWaAlphaStudents([])
    setWaResult(null)
  }

  // ═══════════════════════════════════════════════════════════

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>} {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2"><CalendarDays size={28} className="text-blue-600"/> Absensi Kelas Harian</h1>
        <p className="text-sm text-gray-500 mt-1">{activeDateDisplay}</p>
      </div>

      {isSekretaris && withinTime && timeRemaining && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg flex items-center justify-between text-white">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Clock size={20} className="animate-pulse"/></div><div><p className="text-xs opacity-80 font-medium">Waktu Absensi Sekretaris</p><p className="text-sm font-bold">Tutup pada pukul 14:40 WIB</p></div></div>
          <div className="text-right"><p className="text-xs opacity-80 font-medium">Sisa Waktu</p><p className="text-2xl font-extrabold font-mono tracking-wider">{timeRemaining}</p></div>
        </div>
      )}

      {isSekretaris && !withinTime && (
        <div className={`p-5 rounded-2xl border-2 ${timeStatus === 'before' ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-start gap-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${timeStatus === 'before' ? 'bg-amber-100' : 'bg-red-100'}`}>⏰</div><div><h3 className={`font-bold text-lg ${timeStatus === 'before' ? 'text-amber-800' : 'text-red-800'}`}>{timeStatus === 'before' ? 'Absensi Kelas Belum Dibuka' : 'Waktu Absensi Telah Berakhir'}</h3><p className={`text-sm mt-1 ${timeStatus === 'before' ? 'text-amber-700' : 'text-red-700'}`}>{timeStatus === 'before' ? 'Absensi sekretaris dapat dilakukan mulai pukul 09:05 WIB' : 'Absensi sekretaris ditutup pukul 14:40 WIB'}</p><p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Clock size={12}/> Waktu saat ini: {currentTime} WIB</p></div></div>
        </div>
      )}

      {isAdmin && selectedDate !== today && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">📅</div>
          <div>
            <p className="text-sm font-bold text-amber-800">Mode Edit Absensi Hari Lampau</p>
            <p className="text-xs text-amber-700">Anda sedang mengedit absensi tanggal <span className="font-bold">{activeDateDisplay}</span>. Data akan disimpan ke tanggal tersebut.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[{ label: 'Tanggal', value: isAdmin ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : todayDisplay, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },{ label: 'Kelas', value: selectedKelas || '—', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },{ label: userData?.role === 'Administrator' ? 'Admin' : 'Sekretaris', value: userData?.nama || '—', icon: Shield, color: 'text-emerald-600 bg-emerald-50' },{ label: 'Jumlah Siswa', value: stats.total, icon: Users, color: 'text-gray-600 bg-gray-50' },{ label: 'Sudah Absen', value: stats.total - stats.belum, icon: CheckCircle, color: 'text-green-600 bg-green-50' },{ label: 'Belum Absen', value: stats.belum, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' }].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}><item.icon size={18}/></div><div><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{item.label}</p><p className="text-sm font-bold text-gray-800 truncate max-w-[140px]">{item.value}</p></div></div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2"><Filter size={18} className="text-gray-500"/><span className="text-sm font-semibold text-gray-700">Filter:</span></div>
          {isAdmin ? (
            <>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-blue-500" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800" />
                {selectedDate !== today && (
                  <button onClick={() => setSelectedDate(today)} className="px-2.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="Kembali ke hari ini">Hari Ini</button>
                )}
              </div>
              <select value={selectedTingkat} onChange={e => handleTingkatChange(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[120px]"><option value="">Tingkat</option>{tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select value={selectedJurusan} onChange={e => handleJurusanChange(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]"><option value="">Jurusan</option>{jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}</select>
              {selectedKelas && <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">✅ {selectedKelas}</span>}
              {kelasNotFound && selectedKelas && <span className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg">❌ Tidak ada siswa di kelas ini</span>}
            </>
          ) : <span className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">{selectedKelas || '—'}</span>}
          {selectedKelas && canEdit && <button onClick={handleMarkAllHadir} disabled={saving} className="ml-auto px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"><CheckCircle size={16}/> Semua Hadir</button>}
        </div>
      </div>

      {selectedKelas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: 'Hadir Hari Ini', value: stats.hadir, emoji: '🟢', gradient: 'from-emerald-500 to-emerald-600' },{ label: 'Sakit Hari Ini', value: stats.sakit, emoji: '🟡', gradient: 'from-amber-500 to-amber-600' },{ label: 'Izin Hari Ini', value: stats.izin, emoji: '🔵', gradient: 'from-blue-500 to-blue-600' },{ label: 'Alpha Hari Ini', value: stats.alpha, emoji: '🔴', gradient: 'from-red-500 to-red-600' }].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl text-white shadow-lg`}><div className="flex items-center justify-between mb-2"><span className="text-2xl">{stat.emoji}</span></div><p className="text-3xl font-extrabold"><CountUp end={stat.value}/></p><p className="text-xs opacity-90 font-medium mt-0.5">{stat.label}</p></div>
          ))}
        </div>
      )}

      {selectedKelas && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="animate-pulse flex gap-4"><div className="h-4 bg-gray-100 rounded w-8"/><div className="h-4 bg-gray-100 rounded w-20"/><div className="h-4 bg-gray-100 rounded flex-1"/><div className="h-4 bg-gray-100 rounded w-8"/><div className="h-4 bg-gray-100 rounded w-48"/><div className="h-4 bg-gray-100 rounded w-24"/></div>))}</div>
          ) : siswaList.length === 0 ? (
            <div className="text-center py-16"><Users size={48} className="mx-auto text-gray-200 mb-3"/><p className="text-gray-500 font-semibold">Tidak ada siswa di kelas ini</p><p className="text-gray-400 text-xs mt-1">Pastikan data siswa untuk kelas <span className="font-bold">"{selectedKelas}"</span> sudah diinput</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase w-12">No</th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase">NISN</th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase">Nama Siswa</th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase w-12 text-center">L/P</th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase text-center">Status Kehadiran</th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-xs uppercase text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {siswaList.map((siswa, idx) => {
                    const currentStatus = siswa.status
                    const isAutoSubmitted = siswa.input_by === 'Sakit/Izin Online' || siswa.input_by === 'QR Mandiri'
                    const isLockedBySystem = isSekretaris && (siswa.input_by === 'Sakit/Izin Online' || siswa.input_by === 'QR Mandiri' || siswa.input_by === 'Sistem Otomatis' || siswa.input_by === 'Administrator')
                    return (
                      <tr key={siswa.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-3 px-4 text-gray-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{siswa.nisn || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{siswa.nama}</td>
                        <td className="py-3 px-4 text-center text-gray-600 text-xs">{siswa.jenis_kelamin === 'P' ? 'P' : 'L'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {Object.entries(badgeConfig).map(([key, cfg]) => {
                              const isActive = currentStatus === key
                              const isDisabledForSekretaris = isSekretaris && !['Hadir', 'Alpha'].includes(key)
                              const isDisabled = !canEdit || isDisabledForSekretaris || isLockedBySystem
                              return (
                                <button key={key} onClick={() => !isDisabled && handleBadgeClick(siswa, key)} disabled={isDisabled}
                                  title={isLockedBySystem ? `Dikunci: Input via ${siswa.input_by}` : cfg.fullLabel}
                                  className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold transition-all duration-200 border-2 ${isActive ? 'shadow-lg scale-110 border-transparent text-white' : isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' : 'bg-white border-gray-200 hover:scale-110 hover:shadow-md cursor-pointer'}`}
                                  style={isActive ? { backgroundColor: cfg.color, color: '#fff', boxShadow: `0 4px 14px ${cfg.color}40` } : {}}>
                                  {isActive ? cfg.label : <span style={{ color: cfg.color }}>{cfg.label}</span>}
                                  {(isDisabledForSekretaris || isLockedBySystem) && <Lock size={8} className="absolute -bottom-0.5 -right-0.5 text-gray-400 bg-white rounded-full p-0.5"/>}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {currentStatus ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border" style={{ backgroundColor: badgeConfig[currentStatus]?.bg, color: badgeConfig[currentStatus]?.text, borderColor: badgeConfig[currentStatus]?.border }}>
                              <span>{badgeConfig[currentStatus]?.emoji}</span>{badgeConfig[currentStatus]?.fullLabel}
                              {isAutoSubmitted && (
                                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold border border-purple-200">
                                  {siswa.input_by === 'QR Mandiri' ? 'SCAN QR' : 'ONLINE'}
                                </span>
                              )}
                            </span>
                          ) : <span className="text-xs text-gray-400 italic">Belum absen</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {siswaList.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{stats.belum > 0 ? <span className="text-orange-600 font-semibold">{stats.belum} siswa belum diabsen</span> : <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle size={14}/> Semua siswa sudah diabsen</span>}</p>
                {isSubmitted && isSekretaris && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><Lock size={12}/> Absensi Terkirim</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {isSekretaris && canEdit && !isSubmitted && <button onClick={handleSubmitAbsensi} disabled={isSubmitting || stats.belum > 0} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/25">{isSubmitting ? '⏳ Mengirim...' : '🔒 Kirim & Kunci Absensi'}</button>}
                {isSekretaris && isSubmitted && !hasApprovedRequest && (
                  <>{hasPendingRequest ? <span className="px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold border border-amber-200">⏳ Permintaan edit sedang menunggu persetujuan Admin</span> : <button onClick={() => setShowEditRequestModal(true)} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition flex items-center gap-2 shadow-sm">✏️ Minta Persetujuan Edit</button>}</>
                )}
                {isSekretaris && isSubmitted && hasApprovedRequest && (
                  <><span className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-200">✅ Admin menyetujui edit (1x saja)</span><button onClick={handleSaveAll} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/25">{saving ? '⏳ Menyimpan...' : <><Save size={16}/> Simpan Perubahan</>}</button></>
                )}
                {isAdmin && <button onClick={handleSaveAll} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/25">{saving ? '⏳ Menyimpan...' : <><Save size={16}/> Simpan Semua</>}</button>}
                {/* [WA] Tombol Finalisasi & Kirim WhatsApp — hanya untuk Admin */}
                {isAdmin && stats.alpha > 0 && (
                  <button onClick={handleOpenWAModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition flex items-center gap-2 shadow-lg shadow-green-500/25">
                    <MessageCircle size={16}/> Finalisasi & Kirim WA
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedKelas && !loading && (<div className="text-center py-20"><GraduationCap size={64} className="mx-auto text-gray-200 mb-4"/><p className="text-gray-500 font-semibold text-lg">Pilih Kelas Terlebih Dahulu</p><p className="text-gray-400 text-sm mt-1">{isAdmin ? 'Gunakan filter di atas: Tanggal → Tingkat → Jurusan' : 'Kelas Anda belum ditetapkan'}</p></div>)}

      {/* Modal Minta Persetujuan Edit */}
      {showEditRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditRequestModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">✏️ Minta Persetujuan Edit</h3>
              <p className="text-sm text-gray-500 mb-4">Absensi untuk kelas <span className="font-bold">{selectedKelas}</span> sudah terkirim. Jika ada kesalahan, Anda dapat meminta persetujuan edit dari Admin. <span className="text-amber-600 font-semibold">Edit hanya bisa dilakukan 1 kali.</span></p>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Alasan Permintaan Edit <span className="text-red-500">*</span></label><textarea value={editRequestReason} onChange={e => setEditRequestReason(e.target.value)} rows={3} placeholder="Jelaskan alasan Anda meminta edit absensi..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 text-sm resize-none" /></div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowEditRequestModal(false); setEditRequestReason('') }} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleRequestEdit} disabled={!editRequestReason.trim()} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2">📨 Kirim Permintaan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          [WA] MODAL WHATSAPP — KONFIRMASI / SENDING / RESULT
      ═══════════════════════════════════════════════════════════ */}
      {waModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={handleCloseWAModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>

            {/* ── STEP 1: KONFIRMASI ── */}
            {waModal === 'confirm' && (
              <>
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg"><MessageCircle size={20} /></div><div><h3 className="font-bold text-sm">Finalisasi & Kirim WhatsApp</h3><p className="text-xs text-green-100">Konfirmasi pengiriman notifikasi</p></div></div>
                    <button onClick={handleCloseWAModal} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition shrink-0"><X size={16} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 font-semibold mb-1">📋 Ringkasan Pengiriman</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-gray-500">Kelas</div><div className="font-bold text-gray-800">{selectedKelas}</div>
                      <div className="text-gray-500">Tanggal</div><div className="font-bold text-gray-800">{activeDateDisplay}</div>
                      <div className="text-gray-500">Siswa Alpha</div><div className="font-bold text-gray-800">{waAlphaStudents.length} siswa</div>
                      <div className="text-gray-500">Punya No. WA</div><div className="font-bold text-green-700">{waAlphaStudents.filter(s => s.phoneValid).length} siswa</div>
                    </div>
                  </div>

                  {waAlphaStudents.some(s => !s.phoneValid) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700 font-semibold mb-2">⚠️ {waAlphaStudents.filter(s => !s.phoneValid).length} siswa tidak akan menerima WA:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {waAlphaStudents.filter(s => !s.phoneValid).map((s, i) => (
                          <p key={i} className="text-xs text-red-600">• {s.nama} — <span className="font-mono">{s.phone || 'Tidak ada nomor'}</span></p>
                        ))}
                      </div>
                    </div>
                  )}

                  {waAlphaStudents.filter(s => s.phoneValid).length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700 font-semibold mb-2">✅ Akan mengirim ke {waAlphaStudents.filter(s => s.phoneValid).length} orang tua:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {waAlphaStudents.filter(s => s.phoneValid).map((s, i) => (
                          <p key={i} className="text-xs text-green-700">• {s.nama} ({s.kelas} {s.jurusan}) — <span className="font-mono">{s.phone}</span></p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t bg-gray-50 shrink-0 flex gap-3">
                  <button onClick={handleCloseWAModal} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Batal</button>
                  <button onClick={handleExecuteSendWA} disabled={waAlphaStudents.filter(s => s.phoneValid).length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-emerald-700 transition shadow-lg shadow-green-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send size={16} /> Kirim Sekarang
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: SENDING ── */}
            {waModal === 'sending' && (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                <p className="text-lg font-bold text-gray-800">Sedang Mengirim WhatsApp...</p>
                <p className="text-sm text-gray-500 mt-1">Mohon tunggu, jangan tutup halaman ini</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" /> Mengirim ke {waAlphaStudents.filter(s => s.phoneValid).length} orang tua
                </div>
              </div>
            )}

            {/* ── STEP 3: RESULT ── */}
            {waModal === 'result' && waResult && (
              <>
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">📊</div><div><h3 className="font-bold text-sm">Hasil Pengiriman</h3><p className="text-xs text-green-100">Ringkasan notifikasi WhatsApp</p></div></div>
                    <button onClick={handleCloseWAModal} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition shrink-0"><X size={16} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-green-700">{waResult.filter(r => r.status === 'success').length}</p>
                      <p className="text-[10px] text-green-600 font-bold">✅ Berhasil</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-red-700">{waResult.filter(r => r.status === 'failed').length}</p>
                      <p className="text-[10px] text-red-600 font-bold">❌ Gagal</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-2xl font-extrabold text-gray-700">{waResult.length}</p>
                      <p className="text-[10px] text-gray-600 font-bold">📊 Total</p>
                    </div>
                  </div>

                  {/* Detail list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {waResult.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${r.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <span className="text-lg">{r.status === 'success' ? '✅' : '❌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{r.nama}</p>
                          <p className="text-[10px] text-gray-500">{r.kelas} {r.jurusan} • {r.phone}</p>
                          {r.error && <p className="text-[10px] text-red-600 mt-0.5">Alasan: {r.error}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status === 'success' ? 'Berhasil' : 'Gagal'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t bg-gray-50 shrink-0">
                  <button onClick={handleCloseWAModal} className="w-full py-3 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">Tutup</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } } .animate-slideDown { animation: slideDown 0.3s ease-out; } @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } .animate-scaleIn { animation: scaleIn 0.2s ease-out; }`}</style>
    </div>
  )
}