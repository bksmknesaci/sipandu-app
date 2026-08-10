'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, Camera, Search, CheckCircle, XCircle, Clock, Building2, User, GraduationCap, Loader2, AlertTriangle, LogOut, LogIn, RefreshCw, ArrowLeft, ShieldCheck, Calendar, Timer } from 'lucide-react'
import { getPklStudentData, savePklProfile, submitPklCheckIn, submitPklCheckOut, submitPlakSakitIzin, cleanupOldPklSelfies } from '@/app/actions/pklActions'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const DAY_NAMES_GETDAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const TINGKAT_OPTIONS = ['X', 'XI', 'XII']
const JK_OPTIONS = ['Laki-laki', 'Perempuan']

function compressImage(b64, maxW = 480, maxH = 640, q = 0.55) {
  return new Promise(resolve => {
    const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round((maxW / w) * h); w = maxW }
      if (h > maxH) { w = Math.round((maxH / h) * w); h = maxH }
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', q))
    }; img.src = b64
  })
}

function getGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation tidak didukung'))
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => reject(e), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
}

function timeToMin(t) {
  if (!t) return 0
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatMinToTime(totalMin) {
  const m = Math.max(0, Math.min(1439, Math.round(totalMin)))
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function statusColor(s) {
  const m = { 'Belum Mulai': 'bg-gray-100 text-gray-600', 'Berjalan': 'bg-emerald-100 text-emerald-700', 'Selesai': 'bg-blue-100 text-blue-700' }
  return m[s] || 'bg-gray-100 text-gray-600'
}

function getWIBNowMin() {
  const now = new Date()
  return ((now.getUTCHours() + 7) % 24) * 60 + now.getUTCMinutes()
}

function getWIBDateStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
}

export default function AbsensiPKL() {
  const [step, setStep] = useState('search')
  const [nisn, setNisn] = useState('')
  const [student, setStudent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [todayAtt, setTodayAtt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [attStep, setAttStep] = useState('choose')
  const [selectedType, setSelectedType] = useState('')
  const [note, setNote] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [gpsData, setGpsData] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('')
  const [gpsValid, setGpsValid] = useState(null)
  const [nowMin, setNowMin] = useState(getWIBNowMin)

  const [form, setForm] = useState({
    company_name: '', company_address: '', industry_supervisor: '', guru_pembimbing: '',
    start_date: '', end_date: '', work_start_time: '', work_end_time: '',
    work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    latitude: '', longitude: '', radius_meter: '50',
    student_nama: '', student_kelas: '', student_jurusan: '', student_jenis_kelamin: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const cameraRequestedRef = useRef(false)

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])
  useEffect(() => { return () => stopCamera() }, [])
  useEffect(() => { cleanupOldPklSelfies().catch(() => {}) }, [])
  useEffect(() => {
    const iv = setInterval(() => setNowMin(getWIBNowMin()), 30000)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    const dismissed = localStorage.getItem('pkl_guide_dismissed')
    if (dismissed !== 'true') setShowGuide(true)
  }, [])

  // FIX KAMERA: Mulai stream setelah <video> element ter-render
  useEffect(() => {
    if (cameraActive && cameraRequestedRef.current) {
      cameraRequestedRef.current = false
      let cancelled = false
      const startStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraStream(stream)
          } else {
            stream.getTracks().forEach(t => t.stop())
            setCameraActive(false)
          }
        } catch (e) {
          if (!cancelled) { showToast('Gagal mengakses kamera: ' + e.message, 'error'); setCameraActive(false) }
        }
      }
      startStream()
      return () => { cancelled = true }
    }
  }, [cameraActive])

  const stopCamera = () => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null) }
    setCameraActive(false)
    cameraRequestedRef.current = false
  }

  const startCamera = () => {
    stopCamera()
    cameraRequestedRef.current = true
    setCameraActive(true)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const c = canvasRef.current, v = videoRef.current
    // Langsung resize di canvas sekali saja — hindari kompresi ganda (toDataURL lalu compressImage lagi)
    let w = v.videoWidth, h = v.videoHeight
    const maxW = 480, maxH = 640
    if (w > maxW) { h = Math.round((maxW / w) * h); w = maxW }
    if (h > maxH) { w = Math.round((maxH / h) * w); h = maxH }
    c.width = w; c.height = h
    c.getContext('2d').drawImage(v, 0, 0, w, h)
    const compressed = c.toDataURL('image/jpeg', 0.55)
    setCapturedPhoto(compressed)
    stopCamera()
  }

  const todayDayName = DAY_NAMES_GETDAY[new Date().getDay()]
  const todayStr = getWIBDateStr()
  const isFlexibleSchedule = profile?.work_days?.includes('Fleksibel')
  const isWorkDay = isFlexibleSchedule ? true : profile?.work_days?.includes(todayDayName)
  const isFormFlexible = form.work_days.includes('Fleksibel')
  const isNewStudent = !student?.nama

  const masukOpen = profile?.work_start_time ? timeToMin(profile.work_start_time) - 60 : null
  const masukClose = profile?.work_start_time ? timeToMin(profile.work_start_time) + 180 : null
  const pulangOpen = profile?.work_end_time ? timeToMin(profile.work_end_time) - 60 : null
  const pulangClose = profile?.work_end_time ? timeToMin(profile.work_end_time) + 120 : null
  const lateThreshold = profile?.work_start_time ? timeToMin(profile.work_start_time) + 15 : null

  const isInMasukWindow = masukOpen !== null && masukClose !== null && nowMin >= masukOpen && nowMin <= masukClose
  const isInPulangWindow = pulangOpen !== null && pulangClose !== null && nowMin >= pulangOpen && nowMin <= pulangClose
  const willBeLate = lateThreshold !== null && masukClose !== null && nowMin > lateThreshold && nowMin <= masukClose

  const hasCheckedIn = !!todayAtt?.check_in_time
  const hasCheckedOut = !!todayAtt?.check_out_time
  const hasSakitIzin = todayAtt && (todayAtt.status === 'Sakit' || todayAtt.status === 'Izin')

  const masukDisabled = hasCheckedIn || hasSakitIzin || !isWorkDay || !isInMasukWindow || profile?.status !== 'Berjalan'
  const pulangDisabled = !hasCheckedIn || hasCheckedOut || hasSakitIzin || !isWorkDay || !isInPulangWindow || profile?.status !== 'Berjalan'
  const siDisabled = (hasCheckedIn || hasCheckedOut || hasSakitIzin) || profile?.status !== 'Berjalan'

  const isGpsMasuk = attStep === 'gps_masuk'
  const gpsFlowLabel = isGpsMasuk ? 'Masuk' : 'Pulang'
  const gpsNextStep = isGpsMasuk ? 'photo_masuk' : 'photo_pulang'
  const isPhotoMasuk = attStep === 'photo_masuk'
  const photoFlowLabel = isPhotoMasuk ? 'Masuk' : 'Pulang'
  const photoBackStep = isPhotoMasuk ? 'gps_masuk' : 'gps_pulang'

  const profileGpsReady = !!(form.latitude && form.longitude)

  function getMasukReason() {
    if (profile?.status !== 'Berjalan') return `PKL ${profile?.status || 'tidak aktif'}`
    if (!isWorkDay) return isFlexibleSchedule ? '' : `Hari ini (${todayDayName}) bukan hari kerja`
    if (hasCheckedIn) return 'Sudah absen masuk hari ini'
    if (hasSakitIzin) return 'Sudah mengajukan sakit/izin hari ini'
    if (masukOpen === null || masukClose === null) return 'Jam kerja belum diatur'
    if (!isInMasukWindow) return `Di luar jadwal (${formatMinToTime(masukOpen)} – ${formatMinToTime(masukClose)})`
    return ''
  }

  function getPulangReason() {
    if (profile?.status !== 'Berjalan') return `PKL ${profile?.status || 'tidak aktif'}`
    if (!isWorkDay) return isFlexibleSchedule ? '' : `Hari ini (${todayDayName}) bukan hari kerja`
    if (!hasCheckedIn) return 'Belum absen masuk'
    if (hasCheckedOut) return 'Sudah absen pulang hari ini'
    if (hasSakitIzin) return 'Sudah mengajukan sakit/izin hari ini'
    if (pulangOpen === null || pulangClose === null) return 'Jam pulang belum diatur'
    if (!isInPulangWindow) return `Di luar jadwal (${formatMinToTime(pulangOpen)} – ${formatMinToTime(pulangClose)})`
    return ''
  }

  const handleSearch = async () => {
    if (!nisn.trim()) { showToast('Masukkan NISN', 'error'); return }
    setLoading(true)
    const res = await getPklStudentData(nisn.trim())
    setLoading(false)
    if (res.error && res.error !== 'NO_PROFILE') { showToast(res.error, 'error'); return }
    setStudent(res.student)
    if (res.error === 'NO_PROFILE') {
      setForm(f => ({ ...f, start_date: '', end_date: '', work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], student_nama: res.student?.nama || '', student_kelas: res.student?.kelas || '', student_jurusan: res.student?.jurusan || '', student_jenis_kelamin: res.student?.jenis_kelamin || '' }))
      setStep('setup')
    } else {
      setProfile(res.profile); setTodayAtt(res.todayAttendance || null)
      if (res.profile.status === 'Berjalan') { setAttStep(res.todayAttendance?.check_out_time ? 'done' : 'choose') }
      else { setAttStep('inactive') }
      setStep('attendance')
    }
  }

  const handleSaveProfile = async () => {
    if (isNewStudent && !form.student_nama.trim()) { showToast('Nama lengkap wajib diisi', 'error'); return }
    if (isNewStudent && !form.student_kelas) { showToast('Tingkat kelas wajib dipilih', 'error'); return }
    if (isNewStudent && !form.student_jurusan.trim()) { showToast('Jurusan wajib diisi', 'error'); return }
    if (!form.company_name.trim()) { showToast('Nama perusahaan wajib diisi', 'error'); return }
    if (!form.start_date || !form.end_date) { showToast('Tanggal mulai dan selesai wajib diisi', 'error'); return }
    if (!form.work_start_time || !form.work_end_time) { showToast('Jam kerja wajib diisi', 'error'); return }
    if (form.work_days.length === 0) { showToast('Pilih minimal 1 hari kerja atau aktifkan Fleksibel', 'error'); return }
    setSavingProfile(true)
    const res = await savePklProfile({ ...form, student_id: student.id, student_nama: form.student_nama || undefined, student_kelas: form.student_kelas || undefined, student_jurusan: form.student_jurusan || undefined, student_jenis_kelamin: form.student_jenis_kelamin || undefined })
    setSavingProfile(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) { setStudent(fresh.student); setProfile(fresh.profile); setTodayAtt(fresh.todayAttendance || null) }
    else { setProfile(res.profile) }
    setStep('attendance'); setAttStep('choose'); showToast('Profil PKL berhasil disimpan!')
  }

  const handleGetLocation = async () => {
    setGpsStatus('getting'); setGpsValid(null)
    try {
      const loc = await getGPS()
      setGpsData({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy })
      setForm(f => ({ ...f, latitude: String(loc.lat), longitude: String(loc.lng) }))
      setGpsStatus('done')
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleValidateGPS = async () => {
    if (!profile) return
    setGpsStatus('validating'); setGpsValid(null)
    try {
      const loc = await getGPS()
      const newGps = { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy }
      setGpsData(newGps)
      if (profile.latitude && profile.longitude) {
        const dist = haversine(loc.lat, loc.lng, profile.latitude, profile.longitude)
        newGps.currentDist = dist; setGpsData({ ...newGps })
        if (dist <= 50) { setGpsValid(true); setGpsStatus('valid') }
        else { setGpsValid(false); setGpsStatus('invalid') }
      } else { setGpsValid(true); setGpsStatus('valid') }
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleCaptureGPSSakitIzin = async () => {
    setGpsStatus('getting')
    try {
      const loc = await getGPS()
      setGpsData({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy }); setGpsStatus('done')
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleCheckIn = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (gpsValid === false) { showToast('Anda berada di luar area PKL', 'error'); return }
    setSubmitting(true)
    const res = await submitPklCheckIn({ studentId: student.id, profile, photoBase64: capturedPhoto, latitude: gpsData?.lat, longitude: gpsData?.lng, address: `Lat: ${gpsData?.lat?.toFixed(6)}, Lng: ${gpsData?.lng?.toFixed(6)}` })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) setTodayAtt(fresh.todayAttendance)
    setAttStep('choose'); setCapturedPhoto(null); setGpsValid(null); setGpsStatus(''); setGpsData(null)
    showToast(`Absensi masuk berhasil! Status: ${res.status}${res.isLate ? ' (Terlambat)' : ''}`)
    cleanupOldPklSelfies().catch(() => {})
  }

  const handleCheckOut = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (gpsValid === false) { showToast('Anda berada di luar area PKL', 'error'); return }
    setSubmitting(true)
    const res = await submitPklCheckOut({ studentId: student.id, profile, photoBase64: capturedPhoto, latitude: gpsData?.lat, longitude: gpsData?.lng, address: `Lat: ${gpsData?.lat?.toFixed(6)}, Lng: ${gpsData?.lng?.toFixed(6)}` })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) setTodayAtt(fresh.todayAttendance)
    setAttStep('done'); setCapturedPhoto(null); setGpsValid(null); setGpsStatus(''); setGpsData(null)
    showToast('Absensi pulang berhasil!')
    cleanupOldPklSelfies().catch(() => {})
  }

  const handleSakitIzin = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (!note.trim()) { showToast('Alasan wajib diisi', 'error'); return }
    setSubmitting(true)
    const res = await submitPklSakitIzin({ studentId: student.id, type: selectedType, photoBase64: capturedPhoto, note: note.trim(), latitude: gpsData?.lat, longitude: gpsData?.lng })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) setTodayAtt(fresh.todayAttendance)
    setAttStep('done'); setCapturedPhoto(null); setGpsData(null); setGpsStatus('')
    showToast(`Absensi ${selectedType.toLowerCase()} berhasil dicatat!`)
    cleanupOldPklSelfies().catch(() => {})
  }

  const handleSakitIzinClick = (type) => {
    setSelectedType(type); setNote(''); setCapturedPhoto(null); setGpsData(null); setGpsValid(null); setGpsStatus('')
    setAttStep('gps_sakit')
  }

  const handleReset = () => {
    stopCamera(); setStudent(null); setProfile(null); setTodayAtt(null); setNisn('')
    setStep('search'); setAttStep('choose'); setCapturedPhoto(null); setGpsData(null); setGpsValid(null); setGpsStatus('')
  }

  const showToast = (message, type = 'success') => setToast({ message, type, key: Date.now() })

  const handleCloseGuide = () => {
    if (dontShowAgain) localStorage.setItem('pkl_guide_dismissed', 'true')
    setShowGuide(false)
  }

  const handleEditProfile = () => {
    if (!profile) return
    setForm({ company_name: profile.company_name || '', company_address: profile.company_address || '', industry_supervisor: profile.industry_supervisor || '', guru_pembimbing: profile.guru_pembimbing || '', start_date: profile.start_date || '', end_date: profile.end_date || '', work_start_time: profile.work_start_time || '', work_end_time: profile.work_end_time || '', work_days: profile.work_days || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], latitude: profile.latitude ? String(profile.latitude) : '', longitude: profile.longitude ? String(profile.longitude) : '', radius_meter: 50, student_nama: student?.nama || '', student_kelas: student?.kelas || '', student_jurusan: student?.jurusan || '', student_jenis_kelamin: student?.jenis_kelamin || '' })
    if (profile.latitude && profile.longitude) { setGpsData({ lat: profile.latitude, lng: profile.longitude, accuracy: 0 }); setGpsStatus('done') }
    else { setGpsData(null); setGpsStatus('') }
    setStep('setup')
  }

  const toggleWorkDay = (day) => {
    if (form.work_days.includes('Fleksibel')) return
    setForm(f => ({ ...f, work_days: f.work_days.includes(day) ? f.work_days.filter(d => d !== day) : [...f.work_days, day] }))
  }

  const toggleFlexible = () => {
    setForm(f => ({ ...f, work_days: f.work_days.includes('Fleksibel') ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] : ['Fleksibel'] }))
  }

  // ── Render ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><MapPin size={20} /></div>
            <div><h1 className="text-lg font-bold">Absensi PKL</h1><p className="text-xs text-blue-200">Praktik Kerja Lapangan</p></div>
          </div>
          {step !== 'search' && (
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition"><LogOut size={14} /> Ganti Siswa</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

      {/* ═══ POPUP PANDUAN (ASLI + tambah Fleksibel di poin 2) ═══ */}
      {showGuide && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseGuide() }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto animate-fadeIn">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 rounded-t-2xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📋</div>
                <div><h2 className="font-bold text-base">Tata Cara Absensi PKL</h2><p className="text-blue-200 text-xs">Baca dengan seksama sebelum memulai</p></div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Masukkan NISN</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ketik NISN Anda pada kolom pencarian, lalu klik "Cari". Jika NISN belum terdaftar, Anda akan diminta melengkapi data diri dan profil PKL terlebih dahulu.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Atur Profil PKL dengan Teliti</p>
                  <p className="text-xs text-gray-500 mt-0.5">Setelah NISN dikenali, Anda akan diminta mengisi profil PKL. <strong>Perhatikan dengan seksama:</strong></p>
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1.5 text-[11px] text-amber-800">
                    <div className="flex items-center gap-1.5"><Calendar size={11} className="text-amber-600 shrink-0" /><span><strong>Periode PKL</strong> — Sesuai surat penempatan dari sekolah</span></div>
                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-amber-600 shrink-0" /><span><strong>Jam Kerja</strong> — Sesuai ketentuan perusahaan tempat PKL</span></div>
                    <div className="flex items-center gap-1.5"><Calendar size={11} className="text-amber-600 shrink-0" /><span><strong>Hari Kerja</strong> — Pilih hari rutin, atau aktifkan <strong>"Fleksibel"</strong> jika jadwal PKL tidak menentu (kadang 2x, 4x, atau libur seminggu)</span></div>
                    <div className="flex items-center gap-1.5"><MapPin size={11} className="text-amber-600 shrink-0" /><span><strong>Koordinat Lokasi</strong> — Wajib ambil langsung di tempat PKL agar GPS akurat. Tombol Simpan dikunci sebelum GPS diambil.</span></div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 italic">Data ini menjadi acuan penentuan hari efektif & validasi absensi GPS. Profil PKL <strong>disarankan diatur di tempat PKL</strong> agar koordinat lokasi akurat.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Cek Jadwal Absensi</p>
                  <p className="text-xs text-gray-500 mt-0.5">Perhatikan tabel jadwal yang tampil. Pastikan Anda berada dalam <strong>waktu yang ditentukan</strong>. Dot hijau menandakan jendela absensi sedang aktif. Jika jadwal Fleksibel, Anda bisa absen di setiap hari.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Absen Masuk</p>
                  <p className="text-xs text-gray-500 mt-0.5">Klik tombol <strong>"Absen Masuk"</strong> (hijau) → Sistem memvalidasi lokasi GPS Anda (harus dalam radius 50m dari lokasi PKL) → Ambil foto selfie → Kirim.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Absen Pulang</p>
                  <p className="text-xs text-gray-500 mt-0.5">Setelah selesai bekerja, klik tombol <strong>"Absen Pulang"</strong> (biru) → Validasi GPS → Foto selfie → Kirim.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">6</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Sakit / Izin</p>
                  <p className="text-xs text-gray-500 mt-0.5">Jika tidak bisa masuk, gunakan tombol <strong>"Sakit"</strong> atau <strong>"Izin"</strong>. Wajib ambil lokasi GPS untuk akurasi data, lampirkan foto selfie, dan isi alasan.</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5"><AlertTriangle size={13} className="shrink-0" /> Penting:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Absensi <strong>wajib dilakukan di lokasi PKL</strong> agar GPS terdeteksi dalam radius 50 meter.</li>
                  <li>Foto selfie <strong>wajib dari kamera langsung</strong> (tidak boleh dari galeri).</li>
                  <li>Jika terlambat lebih dari <strong>15 menit</strong> dari jam masuk, status otomatis "Terlambat".</li>
                  <li>Setelah absen masuk berhasil, tombol akan berubah jadi <strong>"✅ Sudah Absen Masuk"</strong>.</li>
                  <li><strong>Atur profil PKL dengan teliti</strong> — Pastikan Periode PKL, Jam Kerja, Hari Kerja, dan Koordinat Lokasi sesuai keadaan sebenarnya di tempat PKL.</li>
                  <li>Jika jadwal PKL Anda <strong>tidak menentu</strong>, gunakan opsi <strong>"Fleksibel"</strong> pada Hari Kerja agar bisa absen di setiap hari.</li>
                </ul>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={() => setDontShowAgain(!dontShowAgain)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${dontShowAgain ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {dontShowAgain && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <span className="text-sm text-gray-600">Jangan tampilkan lagi</span>
              </label>
              <button onClick={handleCloseGuide} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg active:scale-[0.98]">Ya, Mengerti</button>
            </div>
          </div>
        </div>
      )}

        {/* ═══ STEP: SEARCH ═══ */}
        {step === 'search' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mt-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3"><MapPin size={32} className="text-blue-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Absensi PKL</h2>
              <p className="text-sm text-gray-500 mt-1">Masukkan NISN untuk memulai absensi</p>
            </div>
            <div className="flex gap-2">
              <input value={nisn} onChange={e => setNisn(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Masukkan NISN..." className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" />
              <button onClick={handleSearch} disabled={loading} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} <span className="sm:inline hidden">Cari</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP: SETUP PROFILE ═══ */}
        {step === 'setup' && student && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0] || '?'}</div>
                <div><p className="font-bold text-gray-800">{student.nama || 'Belum diisi'}</p><p className="text-xs text-gray-500">NISN: {student.nisn}{student.kelas ? ` · ${student.kelas} ${student.jurusan || ''}` : ''}</p></div>
              </div>
            </div>
            {isNewStudent && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800"><p className="font-semibold">👤 Data Siswa Belum Lengkap</p><p className="text-xs mt-1">NISN Anda baru terdaftar. Lengkapi data diri terlebih dahulu, lalu isi profil PKL di bawahnya.</p></div>}
            {!isNewStudent && <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800"><p className="font-semibold">⚙️ Atur Ulang Profil PKL</p><p className="text-xs mt-1">Disarankan lakukan di tempat PKL agar koordinat lokasi akurat.</p></div>}
            {isNewStudent && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-blue-600" /> Data Siswa</h3>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Nama Lengkap *</label><input value={form.student_nama} onChange={e => setForm(f => ({ ...f, student_nama: e.target.value }))} placeholder="Masukkan nama lengkap" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Tingkat *</label><select value={form.student_kelas} onChange={e => setForm(f => ({ ...f, student_kelas: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 bg-white"><option value="">Pilih</option>{TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Jurusan *</label><input value={form.student_jurusan} onChange={e => setForm(f => ({ ...f, student_jurusan: e.target.value }))} placeholder="RPL 2" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">L/P</label><select value={form.student_jenis_kelamin} onChange={e => setForm(f => ({ ...f, student_jenis_kelamin: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 bg-white"><option value="">Pilih</option>{JK_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /> Informasi Perusahaan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Nama Perusahaan *</label><input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Alamat PKL</label><input value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Pembimbing Industri</label><input value={form.industry_supervisor} onChange={e => setForm(f => ({ ...f, industry_supervisor: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Guru Pembimbing</label><input value={form.guru_pembimbing} onChange={e => setForm(f => ({ ...f, guru_pembimbing: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Mulai PKL *</label><input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                  <div><label className="text-xs font-semibold text-gray-500 block mb-1">Selesai PKL *</label><input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-blue-600" /> Jam Kerja</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Jam Masuk *</label><input type="time" value={form.work_start_time} onChange={e => setForm(f => ({ ...f, work_start_time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Jam Pulang *</label><input type="time" value={form.work_end_time} onChange={e => setForm(f => ({ ...f, work_end_time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><GraduationCap size={18} className="text-blue-600" /> Hari Kerja</h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5"><RefreshCw size={16} className={isFormFlexible ? 'text-purple-600' : 'text-gray-400'} /><div><p className="text-sm font-semibold text-gray-800">Mode Fleksibel</p><p className="text-[11px] text-gray-500">Jadwal tidak menentu / berubah-ubah</p></div></div>
                <button onClick={toggleFlexible} className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isFormFlexible ? 'bg-purple-600' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${isFormFlexible ? 'translate-x-5' : 'translate-x-0'}`} /></button>
              </div>
              {isFormFlexible && <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-2"><div className="flex items-center gap-2"><RefreshCw size={14} className="text-purple-600 shrink-0" /><p className="text-xs font-bold text-purple-800">Mode Fleksibel Aktif</p></div><ul className="text-[11px] text-purple-700 space-y-1 pl-6 list-disc"><li>Bisa absensi di <strong>setiap hari</strong> selama masa PKL berlangsung.</li><li>Cocok untuk jadwal PKL yang tidak menentu.</li></ul></div>}
              {!isFormFlexible && (<><div className="flex flex-wrap gap-2">{DAYS.map(d => (<button key={d} onClick={() => toggleWorkDay(d)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${form.work_days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>{form.work_days.includes(d) ? '✓ ' : ''}{d}</button>))}</div>{form.work_days.length === 0 && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> Pilih minimal 1 hari kerja</p>}</>)}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Lokasi PKL</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" /><p><strong>Wajib ambil di tempat PKL.</strong> Radius absensi otomatis 50 meter. Tombol Simpan dikunci sampai GPS diambil.</p></div>
              <button onClick={handleGetLocation} disabled={gpsStatus === 'getting'} className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2">
                {gpsStatus === 'getting' ? <><Loader2 size={16} className="animate-spin" /> Mendapatkan Lokasi...</> : <><MapPin size={16} /> Ambil Lokasi GPS Sekarang</>}
              </button>
              {gpsData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Latitude:</span> <span className="font-mono font-bold">{gpsData.lat?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Longitude:</span> <span className="font-mono font-bold">{gpsData.lng?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Akurasi:</span> <span className="font-bold">{Math.round(gpsData.accuracy)}m</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Radius:</span> <span className="font-bold text-blue-700">50 meter (otomatis)</span></div>
                </div>
              )}
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile || !profileGpsReady} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {savingProfile ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : !profileGpsReady ? '🔒 Ambil Lokasi GPS Terlebih Dahulu' : '💾 Simpan Profil PKL'}
            </button>
            {!profileGpsReady && <p className="text-center text-xs text-amber-600 font-medium -mt-2">Klik "Ambil Lokasi GPS Sekarang" di atas untuk mengaktifkan tombol Simpan</p>}
          </div>
        )}

        {/* ═══ STEP: ATTENDANCE ═══ */}
        {step === 'attendance' && student && profile && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0] || '?'}</div>
                <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 truncate">{student.nama || 'Belum diisi'}</p><p className="text-xs text-gray-500">{student.nisn}{student.kelas ? ` · ${student.kelas} ${student.jurusan || ''}` : ''}</p></div>
                <button onClick={handleEditProfile} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-600 transition shrink-0">✏️ Edit Profil PKL</button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 size={16} className="text-blue-600" /> Profil PKL</h3><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(profile.status)}`}>{profile.status}</span></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="col-span-2"><span className="text-gray-500">Perusahaan</span><p className="font-semibold text-gray-800 text-sm">{profile.company_name || '-'}</p></div>
                {profile.company_address && <div className="col-span-2"><span className="text-gray-500">Alamat</span><p className="font-semibold text-gray-700">{profile.company_address}</p></div>}
                <div><span className="text-gray-500">Pemb. Industri</span><p className="font-semibold text-gray-700">{profile.industry_supervisor || '-'}</p></div>
                <div><span className="text-gray-500">Guru Pemb.</span><p className="font-semibold text-gray-700">{profile.guru_pembimbing || '-'}</p></div>
                <div><span className="text-gray-500">Periode</span><p className="font-semibold text-gray-700">{profile.start_date} s/d {profile.end_date}</p></div>
                <div><span className="text-gray-500">Jam Kerja</span><p className="font-semibold text-gray-700">{profile.work_start_time} - {profile.work_end_time}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Hari Kerja</span>{isFlexibleSchedule ? <p className="font-semibold text-purple-700 flex items-center gap-1.5"><RefreshCw size={12} /> Fleksibel</p> : <p className="font-semibold text-gray-700">{profile.work_days?.join(', ')}</p>}</div>
                {profile.latitude && <div className="col-span-2 flex items-center gap-2"><MapPin size={12} className="text-blue-500 shrink-0" /><span className="font-mono text-[10px] text-gray-600">Lat: {Number(profile.latitude).toFixed(6)}, Lng: {Number(profile.longitude).toFixed(6)} · Radius: 50m</span></div>}
              </div>
            </div>

            {attStep === 'inactive' && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center"><div className="text-4xl mb-3">📋</div><p className="font-bold text-gray-700">PKL {profile.status}</p><p className="text-sm text-gray-500 mt-1">{profile.status === 'Belum Mulai' ? `Dimulai ${profile.start_date}` : `Berakhir ${profile.end_date}`}</p></div>
            )}

            {attStep === 'done' && todayAtt && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" /><p className="font-bold text-emerald-800 text-lg">Absensi Selesai</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Status</p><p className="font-bold text-gray-800">{todayAtt.status}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Jam Masuk</p><p className="font-bold text-gray-800">{todayAtt.check_in_time || '-'}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Jam Pulang</p><p className="font-bold text-gray-800">{todayAtt.check_out_time || '-'}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Terlambat</p><p className="font-bold text-gray-800">{todayAtt.is_late ? 'Ya' : 'Tidak'}</p></div>
                </div>
              </div>
            )}

            {/* ═══ CHOOSE: Jadwal + Tombol (ASLI — dengan icon, warna, dot indicator) ═══ */}
            {attStep === 'choose' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-indigo-600" />
                    Jadwal Absensi Hari Ini
                    <span className="ml-auto text-xs font-normal text-gray-400">{todayDayName}, {todayStr}</span>
                  </h3>

                  {/* Info Fleksibel aktif */}
                  {isFlexibleSchedule && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3 space-y-2">
                      <div className="flex items-center gap-2"><RefreshCw size={14} className="text-purple-600 shrink-0" /><p className="text-xs font-bold text-purple-800">Mode Fleksibel Aktif</p></div>
                      <p className="text-[11px] text-purple-700">Anda bisa melakukan absensi di <strong>setiap hari</strong> selama masa PKL berlangsung. Tidak ada pembatasan hari tertentu.</p>
                    </div>
                  )}

                  {/* Info jadwal hari ini — ASLI dengan icon */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-blue-600 shrink-0" />
                      <p className="text-xs font-bold text-blue-800">Info Jadwal Hari Ini</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5"><Clock size={11} className="text-gray-400 shrink-0" /><span className="text-gray-500">Jam Masuk</span></div>
                      <div className="font-bold text-gray-800 text-right">{profile.work_start_time || '-'}</div>
                      <div className="flex items-center gap-1.5"><Clock size={11} className="text-gray-400 shrink-0" /><span className="text-gray-500">Jam Pulang</span></div>
                      <div className="font-bold text-gray-800 text-right">{profile.work_end_time || '-'}</div>
                      <div className="flex items-center gap-1.5"><Timer size={11} className="text-gray-400 shrink-0" /><span className="text-gray-500">Toleransi Terlambat</span></div>
                      <div className="font-bold text-gray-800 text-right">15 menit</div>
                      <div className="flex items-center gap-1.5"><Calendar size={11} className="text-gray-400 shrink-0" /><span className="text-gray-500">Hari Kerja</span></div>
                      <div className="font-bold text-gray-700 text-right">{isFlexibleSchedule ? 'Fleksibel' : profile.work_days?.join(', ')}</div>
                      <div className="flex items-center gap-1.5"><Timer size={11} className="text-gray-400 shrink-0" /><span className="text-gray-500">Jam Sekarang</span></div>
                      <div className="font-bold text-blue-600 text-right">{formatMinToTime(nowMin)} WIB</div>
                    </div>
                  </div>

                  {/* Jendela waktu aktif — ASLI dengan dot indicator */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Jendela Waktu Absensi:</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isInMasukWindow ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">Masuk:</span>
                        <span className="ml-auto font-mono font-bold text-gray-800">{formatMinToTime(masukOpen)} – {formatMinToTime(masukClose)}</span>
                        {isInMasukWindow && <span className="text-emerald-600 font-semibold text-[10px]">● AKTIF</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isInPulangWindow ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-gray-600">Pulang:</span>
                        <span className="ml-auto font-mono font-bold text-gray-800">{formatMinToTime(pulangOpen)} – {formatMinToTime(pulangClose)}</span>
                        {isInPulangWindow && <span className="text-blue-600 font-semibold text-[10px]">● AKTIF</span>}
                      </div>
                      {willBeLate && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span className="text-[11px] font-semibold">Masuk sekarang = TERLAMBAT (lewat {formatMinToTime(lateThreshold)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Masuk & Pulang — ASLI */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setGpsData(null); setGpsValid(null); setGpsStatus(''); setCapturedPhoto(null); setAttStep('gps_masuk') }} disabled={masukDisabled}
                    className="rounded-2xl p-5 text-white font-bold text-sm shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                    style={{ background: masukDisabled ? '#9ca3af' : 'linear-gradient(135deg, #10B981, #059669)' }}>
                    <LogIn size={24} className="mx-auto mb-1.5" />
                    <div className="text-center">
                      {hasCheckedIn ? `✅ Sudah Masuk` : 'Absen Masuk'}
                      {hasCheckedIn && todayAtt?.check_in_time && <p className="text-[10px] opacity-80 font-normal mt-0.5">({todayAtt.check_in_time})</p>}
                    </div>
                  </button>
                  <button onClick={() => { setGpsData(null); setGpsValid(null); setGpsStatus(''); setCapturedPhoto(null); setAttStep('gps_pulang') }} disabled={pulangDisabled}
                    className="rounded-2xl p-5 text-white font-bold text-sm shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                    style={{ background: pulangDisabled ? '#9ca3af' : 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                    <LogOut size={24} className="mx-auto mb-1.5" />
                    <div className="text-center">
                      {hasCheckedOut ? `✅ Sudah Pulang` : 'Absen Pulang'}
                      {hasCheckedOut && todayAtt?.check_out_time && <p className="text-[10px] opacity-80 font-normal mt-0.5">({todayAtt.check_out_time})</p>}
                    </div>
                  </button>
                </div>

                {/* Tombol Sakit & Izin */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleSakitIzinClick('Sakit')} disabled={siDisabled}
                    className="rounded-2xl p-4 border-2 border-amber-200 bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-center">
                    🤒 Sakit
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Perlu foto & alasan</p>
                  </button>
                  <button onClick={() => handleSakitIzinClick('Izin')} disabled={siDisabled}
                    className="rounded-2xl p-4 border-2 border-blue-200 bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-center">
                    📝 Izin
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Perlu foto & alasan</p>
                  </button>
                </div>

                {/* Info disabled */}
                {(masukDisabled || pulangDisabled || siDisabled) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    {getMasukReason() && <p>• Masuk: {getMasukReason()}</p>}
                    {getPulangReason() && <p>• Pulang: {getPulangReason()}</p>}
                    {siDisabled && !hasCheckedIn && !hasCheckedOut && !hasSakitIzin && profile?.status === 'Berjalan' && <p>• Sakit/Izin: Tidak bisa jika sudah ada absensi hari ini</p>}
                  </div>
                )}
              </div>
            )}

            {/* ═══ GPS STEP: MASUK / PULANG ═══ */}
            {(attStep === 'gps_masuk' || attStep === 'gps_pulang') && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <button onClick={() => { stopCamera(); setAttStep('choose'); setGpsData(null); setGpsValid(null); setGpsStatus('') }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><ArrowLeft size={16} /></button>
                  <div><h3 className="font-bold text-gray-800">Validasi GPS — Absen {gpsFlowLabel}</h3><p className="text-xs text-gray-500">Pastikan Anda berada di lokasi PKL (radius 50m)</p></div>
                </div>
                {gpsStatus === '' && <button onClick={handleValidateGPS} className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"><MapPin size={18} /> Ambil Lokasi & Validasi GPS</button>}
                {gpsStatus === 'validating' && <div className="py-8 flex flex-col items-center gap-3"><Loader2 size={32} className="animate-spin text-blue-500" /><p className="text-sm text-gray-600 font-semibold">Mendapatkan lokasi GPS...</p></div>}
                {gpsStatus === 'valid' && gpsValid === true && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3"><ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" /><div><p className="font-bold text-emerald-800 text-sm">Lokasi Tervalidasi ✓</p><p className="text-xs text-emerald-700 mt-1">Jarak: {Math.round(gpsData.currentDist || 0)}m dari titik PKL · Akurasi: {Math.round(gpsData.accuracy)}m</p></div></div>
                    <button onClick={() => { setAttStep(gpsNextStep); setCapturedPhoto(null) }} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"><Camera size={16} /> Lanjut Ambil Foto Selfie</button>
                  </div>
                )}
                {gpsStatus === 'invalid' && gpsValid === false && (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"><XCircle size={20} className="text-red-500 shrink-0 mt-0.5" /><div><p className="font-bold text-red-800 text-sm">Di Luar Area PKL</p><p className="text-xs text-red-700 mt-1">Jarak Anda: {Math.round(gpsData.currentDist || 0)}m (batas: 50m). Pindah ke lokasi PKL lalu coba lagi.</p></div></div>
                    <button onClick={handleValidateGPS} className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition flex items-center justify-center gap-2"><RefreshCw size={14} /> Coba Lagi</button>
                  </div>
                )}
                {gpsStatus === 'error' && (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"><p className="font-semibold">Gagal mendapatkan lokasi GPS</p><p className="text-xs mt-1">Pastikan GPS aktif dan izin lokasi diaktifkan di browser.</p></div>
                    <button onClick={handleValidateGPS} className="w-full py-3 bg-blue-50 text-blue-600 border-2 border-blue-200 rounded-xl font-bold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"><RefreshCw size={14} /> Coba Lagi</button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ PHOTO STEP: MASUK / PULANG ═══ */}
            {(attStep === 'photo_masuk' || attStep === 'photo_pulang') && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <button onClick={() => { stopCamera(); setAttStep(photoBackStep); setCapturedPhoto(null) }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><ArrowLeft size={16} /></button>
                  <div><h3 className="font-bold text-gray-800">Foto Selfie — Absen {photoFlowLabel}</h3><p className="text-xs text-gray-500">Ambil foto selfie dari kamera</p></div>
                </div>
                {!cameraActive && !capturedPhoto && <button onClick={startCamera} className="w-full py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-100 hover:border-blue-300 transition flex flex-col items-center justify-center gap-2"><Camera size={36} className="text-gray-400" />Buka Kamera</button>}
                {cameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[400px] object-cover" />
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-90 transition border-4 border-gray-200"><div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300"></div></button>
                  </div>
                )}
                {capturedPhoto && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border border-gray-200"><img src={capturedPhoto} alt="Selfie" className="w-full max-h-[300px] object-cover" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setCapturedPhoto(null); startCamera() }} className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"><RefreshCw size={14} /> Ambil Ulang</button>
                      <button onClick={isPhotoMasuk ? handleCheckIn : handleCheckOut} disabled={submitting} className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <><Loader2 size={14} className="animate-spin" /> Mengirim...</> : <><CheckCircle size={14} /> Kirim Absen {photoFlowLabel}</>}</button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* ═══ GPS STEP: SAKIT / IZIN — WAJIB GPS, Warna Izin biru ═══ */}
            {attStep === 'gps_sakit' && (
              <div className={`rounded-2xl shadow-sm border p-5 space-y-4 animate-fadeIn ${selectedType === 'Izin' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => { stopCamera(); setAttStep('choose'); setGpsData(null); setGpsStatus(''); setCapturedPhoto(null) }} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${selectedType === 'Izin' ? 'bg-blue-200 hover:bg-blue-300 text-blue-700' : 'bg-amber-200 hover:bg-amber-300 text-amber-700'}`}><ArrowLeft size={16} /></button>
                  <div><h3 className={`font-bold ${selectedType === 'Izin' ? 'text-blue-800' : 'text-amber-800'}`}>Lokasi — Absen {selectedType}</h3><p className={`text-xs ${selectedType === 'Izin' ? 'text-blue-500' : 'text-amber-500'}`}>Wajib ambil lokasi GPS untuk akurasi data</p></div>
                </div>
                {gpsStatus === '' && <button onClick={handleCaptureGPSSakitIzin} className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition ${selectedType === 'Izin' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'}`}><MapPin size={18} /> Ambil Lokasi GPS</button>}
                {gpsStatus === 'getting' && <div className="py-8 flex flex-col items-center gap-3"><Loader2 size={32} className={`animate-spin ${selectedType === 'Izin' ? 'text-blue-500' : 'text-amber-500'}`} /><p className="text-sm text-gray-600 font-semibold">Mendapatkan lokasi GPS...</p></div>}
                {gpsStatus === 'done' && (
                  <div className={`rounded-xl p-4 border ${selectedType === 'Izin' ? 'bg-blue-100 border-blue-200' : 'bg-amber-100 border-amber-200'}`}>
                    <p className={`font-bold text-sm ${selectedType === 'Izin' ? 'text-blue-800' : 'text-amber-800'}`}>✓ Lokasi berhasil diambil</p>
                    <p className={`text-xs mt-1 ${selectedType === 'Izin' ? 'text-blue-600' : 'text-amber-600'}`}>Lat: {gpsData.lat?.toFixed(6)}, Lng: {gpsData.lng?.toFixed(6)} · Akurasi: {Math.round(gpsData.accuracy)}m</p>
                  </div>
                )}
                {gpsStatus === 'error' && (
                  <div className="space-y-3">
                    <div className={`rounded-xl p-4 border ${selectedType === 'Izin' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                      <p className="font-semibold text-sm">Gagal mendapatkan lokasi GPS</p>
                      <p className="text-xs mt-1">Pastikan GPS aktif dan izin lokasi diaktifkan di browser, lalu coba lagi.</p>
                    </div>
                    <button onClick={handleCaptureGPSSakitIzin} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${selectedType === 'Izin' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 hover:bg-blue-200' : 'bg-amber-100 text-amber-700 border-2 border-amber-200 hover:bg-amber-200'}`}><RefreshCw size={14} /> Coba Lagi</button>
                  </div>
                )}
                <button onClick={() => { setAttStep('photo_sakit'); setCapturedPhoto(null) }} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${selectedType === 'Izin' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'}`}><Camera size={16} /> Lanjut Ambil Foto Selfie</button>
              </div>
            )}

            {/* ═══ PHOTO STEP: SAKIT / IZIN ═══ */}
            {attStep === 'photo_sakit' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <button onClick={() => { stopCamera(); setAttStep('gps_sakit'); setCapturedPhoto(null) }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"><ArrowLeft size={16} /></button>
                  <div><h3 className="font-bold text-gray-800">Foto Selfie & Alasan — {selectedType}</h3><p className="text-xs text-gray-500">Ambil foto selfie dan isi alasan</p></div>
                </div>
                {!cameraActive && !capturedPhoto && <button onClick={startCamera} className="w-full py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-100 hover:border-blue-300 transition flex flex-col items-center justify-center gap-2"><Camera size={36} className="text-gray-400" />Buka Kamera</button>}
                {cameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[400px] object-cover" />
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-90 transition border-4 border-gray-200"><div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300"></div></button>
                  </div>
                )}
                {capturedPhoto && (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border border-gray-200"><img src={capturedPhoto} alt="Selfie" className="w-full max-h-[250px] object-cover" /></div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Alasan {selectedType} *</label>
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={`Tulis alasan ${selectedType.toLowerCase()} Anda...`} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setCapturedPhoto(null); startCamera() }} className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"><RefreshCw size={14} /> Ambil Ulang</button>
                      <button onClick={handleSakitIzin} disabled={submitting || !note.trim()} className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <><Loader2 size={14} className="animate-spin" /> Mengirim...</> : <><CheckCircle size={14} /> Kirim {selectedType}</>}</button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}