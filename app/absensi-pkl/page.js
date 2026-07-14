'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Camera, Search, CheckCircle, XCircle, Clock, Building2, User, GraduationCap, Loader2, ChevronRight, AlertTriangle, LogOut, LogIn, FileText, Calendar, Timer } from 'lucide-react'
import { getPklStudentData, savePklProfile, submitPklCheckIn, submitPklCheckOut, submitPklSakitIzin, cleanupOldPklSelfies } from '@/app/actions/pklActions'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const DAY_NAMES_GETDAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const TINGKAT_OPTIONS = ['X', 'XI', 'XII']
const JK_OPTIONS = ['Laki-laki', 'Perempuan']

function compressImage(b64, maxW = 800, q = 0.7) {
  return new Promise(resolve => {
    const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > maxW) { h = (maxW / w) * h; w = maxW }
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

  // ── Timers & Cleanup ──────────────────────────────────────────
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])
  useEffect(() => { return () => stopCamera() }, [])
  useEffect(() => { cleanupOldPklSelfies().catch(() => {}) }, [])
  useEffect(() => {
    const iv = setInterval(() => setNowMin(getWIBNowMin()), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setNowMin(getWIBNowMin()), 30000)
    return () => clearInterval(iv)
  }, [])

  // Cek apakah panduan sudah pernah di-dismiss
  useEffect(() => {
    const dismissed = localStorage.getItem('pkl_guide_dismissed')
    if (dismissed !== 'true') {
      setShowGuide(true)
    }
  }, [])

  const stopCamera = () => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); setCameraActive(false) }
  }

  const startCamera = async () => {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraStream(stream); setCameraActive(true) }
    } catch (e) { showToast('Gagal mengakses kamera: ' + e.message, 'error') }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const c = canvasRef.current, v = videoRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    const raw = c.toDataURL('image/jpeg', 0.85)
    const compressed = await compressImage(raw)
    setCapturedPhoto(compressed)
    stopCamera()
  }

  // ── Computed: Jadwal & Disabled Logic ─────────────────────────
  const todayDayName = DAY_NAMES_GETDAY[new Date().getDay()]
  const todayStr = getWIBDateStr()
  const isWorkDay = profile?.work_days?.includes(todayDayName)
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

  function getMasukReason() {
    if (profile?.status !== 'Berjalan') return `PKL ${profile?.status || 'tidak aktif'}`
    if (!isWorkDay) return `Hari ini (${todayDayName}) bukan hari kerja`
    if (hasCheckedIn) return 'Sudah absen masuk hari ini'
    if (hasSakitIzin) return 'Sudah mengajukan sakit/izin hari ini'
    if (masukOpen === null || masukClose === null) return 'Jam kerja belum diatur'
    if (!isInMasukWindow) return `Di luar jadwal (${formatMinToTime(masukOpen)} – ${formatMinToTime(masukClose)})`
    return ''
  }

  function getPulangReason() {
    if (profile?.status !== 'Berjalan') return `PKL ${profile?.status || 'tidak aktif'}`
    if (!isWorkDay) return `Hari ini (${todayDayName}) bukan hari kerja`
    if (!hasCheckedIn) return 'Belum absen masuk'
    if (hasCheckedOut) return 'Sudah absen pulang hari ini'
    if (hasSakitIzin) return 'Sudah mengajukan sakit/izin hari ini'
    if (pulangOpen === null || pulangClose === null) return 'Jam pulang belum diatur'
    if (!isInPulangWindow) return `Di luar jadwal (${formatMinToTime(pulangOpen)} – ${formatMinToTime(pulangClose)})`
    return ''
  }

  // ── Handlers ──────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!nisn.trim()) { showToast('Masukkan NISN', 'error'); return }
    setLoading(true)
    const res = await getPklStudentData(nisn.trim())
    setLoading(false)
    if (res.error && res.error !== 'NO_PROFILE') { showToast(res.error, 'error'); return }
    setStudent(res.student)
    if (res.error === 'NO_PROFILE') {
      // Siswa ada/telah dibuat tapi belum punya profil PKL → ke setup
      setForm(f => ({ ...f, start_date: '', end_date: '', work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], student_nama: res.student?.nama || '', student_kelas: res.student?.kelas || '', student_jurusan: res.student?.jurusan || '', student_jenis_kelamin: res.student?.jenis_kelamin || '' }))
      setStep('setup')
    } else {
      setProfile(res.profile)
      setTodayAtt(res.todayAttendance || null)
      if (res.profile.status === 'Berjalan') {
        setAttStep(res.todayAttendance?.check_out_time ? 'done' : 'choose')
      } else { setAttStep('inactive') }
      setStep('attendance')
    }
  }

  const handleSaveProfile = async () => {
    // Validasi data siswa jika baru
    if (isNewStudent && !form.student_nama.trim()) { showToast('Nama lengkap wajib diisi', 'error'); return }
    if (isNewStudent && !form.student_kelas) { showToast('Tingkat kelas wajib dipilih', 'error'); return }
    if (isNewStudent && !form.student_jurusan.trim()) { showToast('Jurusan wajib diisi', 'error'); return }
    if (!form.company_name.trim()) { showToast('Nama perusahaan wajib diisi', 'error'); return }
    if (!form.start_date || !form.end_date) { showToast('Tanggal mulai dan selesai wajib diisi', 'error'); return }
    if (!form.work_start_time || !form.work_end_time) { showToast('Jam kerja wajib diisi', 'error'); return }
    setSavingProfile(true)
    const res = await savePklProfile({
      ...form,
      student_id: student.id,
      student_nama: form.student_nama || undefined,
      student_kelas: form.student_kelas || undefined,
      student_jurusan: form.student_jurusan || undefined,
      student_jenis_kelamin: form.student_jenis_kelamin || undefined,
    })
    setSavingProfile(false)
    if (res.error) { showToast(res.error, 'error'); return }
    // Refresh data untuk dapat info siswa yang baru diupdate
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) {
      setStudent(fresh.student)
      setProfile(fresh.profile)
      setTodayAtt(fresh.todayAttendance || null)
    } else {
      setProfile(res.profile)
    }
    setStep('attendance'); setAttStep('choose')
    showToast('Profil PKL berhasil disimpan!')
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
        newGps.currentDist = dist
        setGpsData({ ...newGps })
        if (dist <= profile.radius_meter) { setGpsValid(true); setGpsStatus('valid') }
        else { setGpsValid(false); setGpsStatus('invalid') }
      } else {
        setGpsValid(true); setGpsStatus('valid')
      }
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleCaptureGPSSakitIzin = async () => {
    setGpsStatus('getting')
    try {
      const loc = await getGPS()
      setGpsData({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy })
      setGpsStatus('done')
      showToast('Lokasi berhasil diambil', 'success')
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleCheckIn = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (gpsValid === false) { showToast('Anda berada di luar area PKL', 'error'); return }
    setSubmitting(true)
    const res = await submitPklCheckIn({
      studentId: student.id, profile, photoBase64: capturedPhoto,
      latitude: gpsData?.lat, longitude: gpsData?.lng, address: `Lat: ${gpsData?.lat?.toFixed(6)}, Lng: ${gpsData?.lng?.toFixed(6)}`
    })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) { setTodayAtt(fresh.todayAttendance) }
    setAttStep('choose')
    setCapturedPhoto(null); setGpsValid(null); setGpsStatus(''); setGpsData(null)
    showToast(`Absensi masuk berhasil! Status: ${res.status}${res.isLate ? ' (Terlambat)' : ''}`)
    cleanupOldPklSelfies().catch(() => {})
  }

  const handleCheckOut = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (gpsValid === false) { showToast('Anda berada di luar area PKL', 'error'); return }
    setSubmitting(true)
    const res = await submitPklCheckOut({
      studentId: student.id, profile, photoBase64: capturedPhoto,
      latitude: gpsData?.lat, longitude: gpsData?.lng, address: `Lat: ${gpsData?.lat?.toFixed(6)}, Lng: ${gpsData?.lng?.toFixed(6)}`
    })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) { setTodayAtt(fresh.todayAttendance) }
    setAttStep('done')
    setCapturedPhoto(null); setGpsValid(null); setGpsStatus(''); setGpsData(null)
    showToast('Absensi pulang berhasil!')
    cleanupOldPklSelfies().catch(() => {})
  }

  const handleSakitIzin = async () => {
    if (!capturedPhoto) { showToast('Ambil foto selfie terlebih dahulu', 'error'); return }
    if (!note.trim()) { showToast('Alasan wajib diisi', 'error'); return }
    setSubmitting(true)
    const res = await submitPklSakitIzin({
      studentId: student.id, type: selectedType, photoBase64: capturedPhoto, note: note.trim(),
      latitude: gpsData?.lat, longitude: gpsData?.lng
    })
    setSubmitting(false)
    if (res.error) { showToast(res.error, 'error'); return }
    const fresh = await getPklStudentData(nisn.trim())
    if (!fresh.error) { setTodayAtt(fresh.todayAttendance) }
    setAttStep('done')
    setCapturedPhoto(null); setGpsData(null); setGpsStatus('')
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
    if (dontShowAgain) {
      localStorage.setItem('pkl_guide_dismissed', 'true')
    }
    setShowGuide(false)
  }

  const handleEditProfile = () => {
    if (!profile) return
    setForm({
      company_name: profile.company_name || '', company_address: profile.company_address || '',
      industry_supervisor: profile.industry_supervisor || '', guru_pembimbing: profile.guru_pembimbing || '',
      start_date: profile.start_date || '', end_date: profile.end_date || '',
      work_start_time: profile.work_start_time || '', work_end_time: profile.work_end_time || '',
      work_days: profile.work_days || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      latitude: profile.latitude ? String(profile.latitude) : '', longitude: profile.longitude ? String(profile.longitude) : '',
      radius_meter: 50,
      student_nama: student?.nama || '', student_kelas: student?.kelas || '',
      student_jurusan: student?.jurusan || '', student_jenis_kelamin: student?.jenis_kelamin || '',
    })
    if (profile.latitude && profile.longitude) { setGpsData({ lat: profile.latitude, lng: profile.longitude, accuracy: 0 }); setGpsStatus('done') }
    else { setGpsData(null); setGpsStatus('') }
    setStep('setup')
  }

  const toggleWorkDay = (day) => {
    setForm(f => ({ ...f, work_days: f.work_days.includes(day) ? f.work_days.filter(d => d !== day) : [...f.work_days, day] }))
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><MapPin size={20} /></div>
            <div><h1 className="text-lg font-bold">Absensi PKL</h1><p className="text-xs text-blue-200">Praktik Kerja Lapangan</p></div>
          </div>
          {step !== 'search' && (
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition">
              <LogOut size={14} /> Ganti Siswa
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

      {/* ═══════════ POPUP PANDUAN ABSENSI PKL ═══════════ */}
      {showGuide && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) handleCloseGuide() }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 rounded-t-2xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📋</div>
                <div>
                  <h2 className="font-bold text-base">Tata Cara Absensi PKL</h2>
                  <p className="text-blue-200 text-xs">Baca dengan seksama sebelum memulai</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Masukkan NISN</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ketik NISN Anda pada kolom pencarian, lalu klik "Cari". Jika NISN belum terdaftar, Anda akan diminta melengkapi data diri dan profil PKL terlebih dahulu.</p>
                </div>
              </div>

              {/* Step 2 — BARU */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Atur Profil PKL dengan Teliti</p>
                  <p className="text-xs text-gray-500 mt-0.5">Setelah NISN dikenali, Anda akan diminta mengisi profil PKL. <strong>Perhatikan dengan seksama:</strong></p>
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1.5 text-[11px] text-amber-800">
                    <div className="flex items-center gap-1.5"><Calendar size={11} className="text-amber-600 shrink-0" /><span><strong>Periode PKL</strong> — Sesuai surat penempatan dari sekolah</span></div>
                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-amber-600 shrink-0" /><span><strong>Jam Kerja</strong> — Sesuai ketentuan perusahaan tempat PKL</span></div>
                    <div className="flex items-center gap-1.5"><Calendar size={11} className="text-amber-600 shrink-0" /><span><strong>Hari Kerja</strong> — Sesuai jadwal yang disepakati dengan perusahaan</span></div>
                    <div className="flex items-center gap-1.5"><MapPin size={11} className="text-amber-600 shrink-0" /><span><strong>Koordinat Lokasi</strong> — Ambil langsung di tempat PKL agar GPS akurat</span></div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 italic">Data ini menjadi acuan penentuan hari efektif & validasi absensi GPS. Profil PKL <strong>disarankan diatur di tempat PKL</strong> agar koordinat lokasi akurat.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Cek Jadwal Absensi</p>
                  <p className="text-xs text-gray-500 mt-0.5">Perhatikan tabel jadwal yang tampil. Pastikan Anda berada di <strong>hari kerja</strong> dan dalam <strong>waktu yang ditentukan</strong>. Dot hijau menandakan jendela absensi sedang aktif.</p>
                </div>
              </div>

              {/* Step 4 — sebelumnya Step 3 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Absen Masuk</p>
                  <p className="text-xs text-gray-500 mt-0.5">Klik tombol <strong>"Absen Masuk"</strong> (hijau) → Sistem memvalidasi lokasi GPS Anda (harus dalam radius 50m dari lokasi PKL) → Ambil foto selfie → Kirim.</p>
                </div>
              </div>

              {/* Step 5 — sebelumnya Step 4 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Absen Pulang</p>
                  <p className="text-xs text-gray-500 mt-0.5">Setelah selesai bekerja, klik tombol <strong>"Absen Pulang"</strong> (biru) → Validasi GPS → Foto selfie → Kirim.</p>
                </div>
              </div>

              {/* Step 6 — sebelumnya Step 5 */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">6</div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Sakit / Izin</p>
                  <p className="text-xs text-gray-500 mt-0.5">Jika tidak bisa masuk, gunakan tombol <strong>"Sakit"</strong> atau <strong>"Izin"</strong>. Wajib lampirkan foto selfie dan isi alasan. Lokasi GPS opsional.</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5"><AlertTriangle size={13} className="shrink-0" /> Penting:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Absensi <strong>wajib dilakukan di lokasi PKL</strong> agar GPS terdeteksi dalam radius 50 meter.</li>
                  <li>Foto selfie <strong>wajib dari kamera langsung</strong> (tidak boleh dari galeri).</li>
                  <li>Jika terlambat lebih dari <strong>15 menit</strong> dari jam masuk, status otomatis "Terlambat".</li>
                  <li>Setelah absen masuk berhasil, tombol akan berubah jadi <strong>"✅ Sudah Absen Masuk"</strong>.</li>
                  <li><strong>Atur profil PKL dengan teliti</strong> — Pastikan Periode PKL, Jam Kerja, Hari Kerja, dan Koordinat Lokasi sesuai keadaan sebenarnya di tempat PKL.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-3">
              {/* Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={() => setDontShowAgain(!dontShowAgain)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  dontShowAgain ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {dontShowAgain && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </div>
                <span className="text-sm text-gray-600">Jangan tampilkan lagi</span>
              </label>

              {/* Button */}
              <button
                onClick={handleCloseGuide}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg active:scale-[0.98]"
              >
                Ya, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

        {/* ═══════════ STEP: SEARCH ═══════════ */}
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

        {/* ═══════════ STEP: SETUP PROFILE ═══════════ */}
        {step === 'setup' && student && (
          <div className="space-y-4 animate-fadeIn">
            {/* Student Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0] || '?'}</div>
                <div>
                  <p className="font-bold text-gray-800">{student.nama || 'Belum diisi'}</p>
                  <p className="text-xs text-gray-500">NISN: {student.nisn}{student.kelas ? ` · ${student.kelas} ${student.jurusan || ''}` : ''}</p>
                </div>
              </div>
            </div>

            {/* Banner: Data Siswa Belum Lengkap */}
            {isNewStudent && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <p className="font-semibold">👤 Data Siswa Belum Lengkap</p>
                <p className="text-xs mt-1">NISN Anda baru terdaftar. Lengkapi data diri terlebih dahulu, lalu isi profil PKL di bawahnya.</p>
              </div>
            )}

            {/* Banner: Atur Ulang / Baru */}
            {!isNewStudent && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                <p className="font-semibold">⚙️ Atur Ulang Profil PKL</p>
                <p className="text-xs mt-1">Perbaiki data di bawah ini. Disarankan lakukan pengisian di tempat PKL agar koordinat lokasi akurat.</p>
              </div>
            )}

            {/* ── Form Data Siswa (hanya jika baru) ── */}
            {isNewStudent && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-blue-600" /> Data Siswa</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nama Lengkap *</label>
                  <input value={form.student_nama} onChange={e => setForm(f => ({ ...f, student_nama: e.target.value }))} placeholder="Masukkan nama lengkap" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tingkat *</label>
                    <select value={form.student_kelas} onChange={e => setForm(f => ({ ...f, student_kelas: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 bg-white">
                      <option value="">Pilih</option>
                      {TINGKAT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Jurusan *</label>
                    <input value={form.student_jurusan} onChange={e => setForm(f => ({ ...f, student_jurusan: e.target.value }))} placeholder="Contoh: RPL 2" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">L/P</label>
                    <select value={form.student_jenis_kelamin} onChange={e => setForm(f => ({ ...f, student_jenis_kelamin: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 bg-white">
                      <option value="">Pilih</option>
                      {JK_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Form Profil PKL ── */}
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /> Informasi Perusahaan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Nama Perusahaan (DU/DI) *</label><input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800" /></div>
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
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleWorkDay(d)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${form.work_days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                    {form.work_days.includes(d) ? '✓ ' : ''}{d}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Lokasi PKL</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p><strong>Disarankan isi di tempat PKL</strong> agar koordinat lokasi akurat. Radius absensi otomatis <strong>50 meter</strong> dari titik ini.</p>
              </div>
              <button onClick={handleGetLocation} disabled={gpsStatus === 'getting'} className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2">
                {gpsStatus === 'getting' ? <><Loader2 size={16} className="animate-spin" /> Mendapatkan Lokasi...</> : <><MapPin size={16} /> Ambil Lokasi GPS Sekarang</>}
              </button>
              {gpsData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Latitude:</span> <span className="font-mono font-bold">{gpsData.lat?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Longitude:</span> <span className="font-mono font-bold">{gpsData.lng?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Akurasi:</span> <span className="font-bold">{Math.round(gpsData.accuracy)}m</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Radius Absensi:</span> <span className="font-bold text-blue-700">50 meter (otomatis)</span></div>
                </div>
              )}
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {savingProfile ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : '💾 Simpan Profil PKL'}
            </button>
          </div>
        )}

        {/* ═══════════ STEP: ATTENDANCE ═══════════ */}
        {step === 'attendance' && student && profile && (
          <div className="space-y-4 animate-fadeIn">

            {/* Student Card (kompak) */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0] || '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{student.nama || 'Belum diisi'}</p>
                  <p className="text-xs text-gray-500">{student.nisn}{student.kelas ? ` · ${student.kelas} ${student.jurusan || ''}` : ''}</p>
                </div>
              </div>
            </div>

            {/* ── PKL Profile Card (tampil didepan) ── */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" /> Profil PKL
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(profile.status)}`}>{profile.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="col-span-2">
                  <span className="text-gray-500">Perusahaan</span>
                  <p className="font-semibold text-gray-800 text-sm">{profile.company_name || '-'}</p>
                </div>
                {profile.company_address && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Alamat PKL</span>
                    <p className="font-semibold text-gray-700">{profile.company_address}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Pembimbing Industri</span>
                  <p className="font-semibold text-gray-700">{profile.industry_supervisor || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Guru Pembimbing</span>
                  <p className="font-semibold text-gray-700">{profile.guru_pembimbing || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Periode PKL</span>
                  <p className="font-semibold text-gray-700">{profile.start_date} s/d {profile.end_date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Jam Kerja</span>
                  <p className="font-semibold text-gray-700">{profile.work_start_time} - {profile.work_end_time}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Hari Kerja</span>
                  <p className="font-semibold text-gray-700">{profile.work_days?.join(', ')}</p>
                </div>
                {profile.latitude && profile.longitude && (
                  <div className="col-span-2 flex items-center gap-2">
                    <MapPin size={12} className="text-blue-500 shrink-0" />
                    <span className="font-mono text-[10px] text-gray-600">Lat: {Number(profile.latitude).toFixed(6)}, Lng: {Number(profile.longitude).toFixed(6)} · Radius: 50m</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inactive */}
            {attStep === 'inactive' && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-bold text-gray-700">PKL {profile.status}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {profile.status === 'Belum Mulai' ? `Masa PKL dimulai tanggal ${profile.start_date}` : `Masa PKL berakhir tanggal ${profile.end_date}`}
                </p>
              </div>
            )}

            {/* Done */}
            {attStep === 'done' && todayAtt && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
                <p className="font-bold text-emerald-800 text-lg">Absensi Selesai</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Status</p><p className="font-bold text-gray-800">{todayAtt.status}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Jam Masuk</p><p className="font-bold text-gray-800">{todayAtt.check_in_time || '-'}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Jam Pulang</p><p className="font-bold text-gray-800">{todayAtt.check_out_time || '-'}</p></div>
                  <div className="bg-white rounded-xl p-3"><p className="text-xs text-gray-500">Keterlambatan</p><p className="font-bold text-gray-800">{todayAtt.is_late ? 'Ya' : 'Tidak'}</p></div>
                </div>
              </div>
            )}

            {/* ═══════════ CHOOSE: Jadwal + 2 Tombol + Sakit/Izin ═══════════ */}
            {attStep === 'choose' && (
              <div className="space-y-3">
                {/* Jadwal Absensi Hari Ini */}
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-indigo-600" />
                    Jadwal Absensi Hari Ini
                    <span className="ml-auto text-xs font-normal text-gray-400">{todayDayName}, {todayStr}</span>
                  </h3>
                  {!isWorkDay && (
                    <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      Hari ini ({todayDayName}) bukan hari kerja PKL Anda.
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-500 font-medium flex items-center gap-1.5"><LogIn size={14} className="text-emerald-500" /> Jam Masuk</td>
                          <td className="py-2 text-gray-800 font-bold text-right">{profile.work_start_time || '-'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-1.5 pl-5 text-gray-400 text-xs">Buka Absen Masuk</td>
                          <td className="py-1.5 text-gray-600 text-right text-xs">
                            {masukOpen !== null ? formatMinToTime(masukOpen) : '-'} — {masukClose !== null ? formatMinToTime(masukClose) : '-'}
                            <span className={`ml-1.5 inline-block w-2 h-2 rounded-full ${isInMasukWindow ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-500 font-medium flex items-center gap-1.5"><LogOut size={14} className="text-blue-500" /> Jam Pulang</td>
                          <td className="py-2 text-gray-800 font-bold text-right">{profile.work_end_time || '-'}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-1.5 pl-5 text-gray-400 text-xs">Buka Absen Pulang</td>
                          <td className="py-1.5 text-gray-600 text-right text-xs">
                            {pulangOpen !== null ? formatMinToTime(pulangOpen) : '-'} — {pulangClose !== null ? formatMinToTime(pulangClose) : '-'}
                            <span className={`ml-1.5 inline-block w-2 h-2 rounded-full ${isInPulangWindow ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-500 font-medium flex items-center gap-1.5"><Timer size={14} className="text-orange-500" /> Toleransi Terlambat</td>
                          <td className="py-2 text-orange-600 font-bold text-right">15 menit</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-500 font-medium">Hari Kerja</td>
                          <td className="py-2 text-gray-700 text-right text-xs font-medium">{profile.work_days?.join(', ')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Jam saat ini</span>
                    <span className="font-mono font-bold text-gray-700 text-sm">{formatMinToTime(nowMin)} WIB</span>
                  </div>
                </div>

                {/* Status Hari Ini */}
                {todayAtt && (
                  <div className={`rounded-2xl p-4 border ${todayAtt.status === 'Hadir' || todayAtt.status === 'Terlambat' ? 'bg-emerald-50 border-emerald-200' : todayAtt.status === 'Sakit' || todayAtt.status === 'Izin' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1.5"><CheckCircle size={15} className="text-emerald-600" /><span className="font-semibold text-gray-800 text-sm">Status Hari Ini</span></div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${todayAtt.status === 'Hadir' ? 'bg-emerald-200 text-emerald-800' : todayAtt.status === 'Terlambat' ? 'bg-orange-200 text-orange-800' : todayAtt.status === 'Sakit' ? 'bg-yellow-200 text-yellow-800' : todayAtt.status === 'Izin' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{todayAtt.status}</span>
                      {todayAtt.check_in_time && <span className="text-gray-500 text-xs">Masuk: {todayAtt.check_in_time}</span>}
                      {todayAtt.check_out_time && <span className="text-gray-500 text-xs">Pulang: {todayAtt.check_out_time}</span>}
                    </div>
                  </div>
                )}

                {/* Tombol Absen Masuk */}
                <button onClick={() => { setGpsValid(null); setGpsStatus(''); setGpsData(null); setAttStep('gps_masuk') }} disabled={masukDisabled} className="w-full">
                  <div className={`w-full py-4 px-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 ${hasCheckedIn ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 cursor-default' : masukDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-[0.98] border-2 border-transparent'}`}>
                    {hasCheckedIn ? (<><CheckCircle size={22} /> Sudah Absen Masuk <span className="text-xs font-normal opacity-75 ml-0.5">({todayAtt.check_in_time})</span></>) : (<><LogIn size={22} /> Absen Masuk {willBeLate && (<span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full ml-0.5">Terlambat</span>)}</>)}
                  </div>
                  {!hasCheckedIn && masukDisabled && getMasukReason() && (<p className="text-xs text-gray-400 text-center mt-1.5 px-2">{getMasukReason()}</p>)}
                </button>

                {/* Tombol Absen Pulang */}
                <button onClick={() => { setGpsValid(null); setGpsStatus(''); setGpsData(null); setAttStep('gps_pulang') }} disabled={pulangDisabled} className="w-full">
                  <div className={`w-full py-4 px-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 ${hasCheckedOut ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 cursor-default' : pulangDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98] border-2 border-transparent'}`}>
                    {hasCheckedOut ? (<><CheckCircle size={22} /> Sudah Absen Pulang <span className="text-xs font-normal opacity-75 ml-0.5">({todayAtt.check_out_time})</span></>) : (<><LogOut size={22} /> Absen Pulang</>)}
                  </div>
                  {!hasCheckedOut && pulangDisabled && getPulangReason() && (<p className="text-xs text-gray-400 text-center mt-1.5 px-2">{getPulangReason()}</p>)}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-medium">atau</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Sakit / Izin */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSakitIzinClick('Sakit')} disabled={siDisabled} className="p-3.5 rounded-2xl flex items-center gap-3 hover:shadow-lg transition text-left border-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: siDisabled ? '#f3f4f6' : '#FEF3C7', borderColor: siDisabled ? '#e5e7eb' : '#FDE68A', color: siDisabled ? '#9ca3af' : '#92400E' }}>
                    <span className="text-2xl">🤒</span>
                    <div><p className="font-bold text-sm">Sakit</p><p className="text-[10px] opacity-80">Foto & alasan wajib</p></div>
                  </button>
                  <button onClick={() => handleSakitIzinClick('Izin')} disabled={siDisabled} className="p-3.5 rounded-2xl flex items-center gap-3 hover:shadow-lg transition text-left border-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: siDisabled ? '#f3f4f6' : '#DBEAFE', borderColor: siDisabled ? '#e5e7eb' : '#93C5FD', color: siDisabled ? '#9ca3af' : '#1E40AF' }}>
                    <span className="text-2xl">📝</span>
                    <div><p className="font-bold text-sm">Izin</p><p className="text-[10px] opacity-80">Foto & alasan wajib</p></div>
                  </button>
                </div>

                {/* Atur Ulang Profil */}
                <button onClick={handleEditProfile} className="bg-white rounded-2xl shadow-sm border p-3.5 flex items-center gap-3 hover:shadow-md hover:border-blue-300 transition group">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition text-base">⚙️</div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-700 transition">Atur Ulang Profil PKL</p>
                    <p className="text-[10px] text-gray-500">Perbaiki data perusahaan, jam kerja, hari kerja, atau lokasi</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-blue-500 transition"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            )}

            {/* ═══════════ GPS VALIDATION (Masuk / Pulang) ═══════════ */}
            {(attStep === 'gps_masuk' || attStep === 'gps_pulang') && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Validasi Lokasi GPS — Absen {gpsFlowLabel}</h3>
                <p className="text-xs text-gray-500">Pastikan Anda berada di lokasi PKL ({profile.company_name}) — Radius: 50m</p>
                {gpsStatus === '' && (<button onClick={handleValidateGPS} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md"><MapPin size={16} /> Ambil & Validasi Lokasi</button>)}
                {gpsStatus === 'validating' && (<div className="text-center py-8"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" /><p className="text-sm text-gray-600 font-medium">Memvalidasi lokasi...</p></div>)}
                {gpsStatus === 'valid' && gpsValid && (<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"><CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" /><p className="font-bold text-emerald-800">✅ Lokasi Terverifikasi</p><p className="text-xs text-emerald-600 mt-1">Jarak: {Math.round(gpsData.currentDist)}m (batas: 50m)</p><p className="text-[10px] text-emerald-500 mt-1 font-mono">Lat: {gpsData.lat?.toFixed(6)}, Lng: {gpsData.lng?.toFixed(6)}</p></div>)}
                {gpsStatus === 'invalid' && gpsValid === false && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><XCircle size={32} className="mx-auto text-red-500 mb-2" /><p className="font-bold text-red-800">❌ Di Luar Area PKL</p><p className="text-xs text-red-600 mt-1">Jarak Anda: {Math.round(gpsData.currentDist)}m (batas: 50m)</p><button onClick={handleValidateGPS} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button></div>)}
                {gpsStatus === 'error' && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><AlertTriangle size={32} className="mx-auto text-red-500 mb-2" /><p className="font-bold text-red-800">Gagal Mendapatkan Lokasi</p><p className="text-xs text-red-600 mt-1">Pastikan GPS aktif dan izin lokasi diizinkan</p><button onClick={handleValidateGPS} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button></div>)}
                {gpsValid && (<button onClick={() => { setCapturedPhoto(null); setCameraActive(false); setAttStep(gpsNextStep) }} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2"><Camera size={16} /> Lanjut Ambil Foto Selfie →</button>)}
                <button onClick={() => { setAttStep('choose'); setGpsValid(null); setGpsStatus(''); setGpsData(null) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ PHOTO: MASUK / PULANG ═══════════ */}
            {(attStep === 'photo_masuk' || attStep === 'photo_pulang') && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} className="text-blue-600" /> Foto Selfie — Absen {photoFlowLabel}</h3>
                {!cameraActive && !capturedPhoto && (<button onClick={startCamera} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"><Camera size={20} /> Buka Kamera</button>)}
                <div className={`relative rounded-xl overflow-hidden bg-black ${cameraActive ? '' : 'hidden'}`}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                  {cameraActive && (<button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition active:scale-95"><div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white" /></button>)}
                </div>
                {capturedPhoto && (<div className="space-y-3"><img src={capturedPhoto} alt="Selfie" className="w-full rounded-xl border" /><button onClick={() => setCapturedPhoto(null)} className="w-full py-2 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition">📷 Ambil Ulang</button></div>)}
                <canvas ref={canvasRef} className="hidden" />
                {capturedPhoto && (<button onClick={isPhotoMasuk ? handleCheckIn : handleCheckOut} disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : `✅ Kirim Absen ${photoFlowLabel}`}</button>)}
                <button onClick={() => { stopCamera(); setCapturedPhoto(null); setAttStep(photoBackStep) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ GPS CAPTURE (Sakit/Izin) ═══════════ */}
            {attStep === 'gps_sakit' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Ambil Lokasi Anda</h3>
                <p className="text-xs text-gray-500">Sistem akan merekam titik koordinat tempat Anda saat ini (tanpa validasi radius)</p>
                {gpsStatus === '' && (<button onClick={handleCaptureGPSSakitIzin} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md"><MapPin size={16} /> Ambil Lokasi GPS</button>)}
                {gpsStatus === 'getting' && (<div className="text-center py-8"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" /><p className="text-sm text-gray-600 font-medium">Mengambil lokasi...</p></div>)}
                {gpsStatus === 'done' && gpsData && (<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"><CheckCircle size={32} className="mx-auto text-blue-500 mb-2" /><p className="font-bold text-blue-800">✅ Lokasi Berhasil Diambil</p><p className="text-xs text-blue-600 mt-1 font-mono">Lat: {gpsData.lat?.toFixed(6)}, Lng: {gpsData.lng?.toFixed(6)}</p><p className="text-[10px] text-blue-500 mt-1">Akurasi: {Math.round(gpsData.accuracy)}m</p></div>)}
                {gpsStatus === 'error' && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><AlertTriangle size={32} className="mx-auto text-red-500 mb-2" /><p className="font-bold text-red-800">Gagal Mendapatkan Lokasi</p><button onClick={handleCaptureGPSSakitIzin} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button></div>)}
                {gpsStatus === 'done' && (<button onClick={() => { setCapturedPhoto(null); setCameraActive(false); setAttStep('photo_sakit') }} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2"><Camera size={16} /> Lanjut Ambil Foto Selfie →</button>)}
                <button onClick={() => { setAttStep('choose'); setGpsStatus(''); setGpsData(null) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ PHOTO: SAKIT/IZIN ═══════════ */}
            {attStep === 'photo_sakit' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} className="text-blue-600" /> Foto Selfie — {selectedType}</h3>
                {gpsData && (<div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-[10px] text-blue-600 font-mono">📍 Lokasi: Lat {gpsData.lat?.toFixed(6)}, Lng {gpsData.lng?.toFixed(6)} (Akurasi: {Math.round(gpsData.accuracy)}m)</div>)}
                {!cameraActive && !capturedPhoto && (<button onClick={startCamera} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"><Camera size={20} /> Buka Kamera</button>)}
                <div className={`relative rounded-xl overflow-hidden bg-black ${cameraActive ? '' : 'hidden'}`}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                  {cameraActive && (<button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition active:scale-95"><div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white" /></button>)}
                </div>
                {capturedPhoto && (<div className="space-y-3"><img src={capturedPhoto} alt="Selfie" className="w-full rounded-xl border" /><button onClick={() => setCapturedPhoto(null)} className="w-full py-2 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition">📷 Ambil Ulang</button></div>)}
                <canvas ref={canvasRef} className="hidden" />
                {capturedPhoto && (<div><label className="text-xs font-semibold text-gray-500 block mb-1">Alasan {selectedType} *</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Contoh: Sedang demam tinggi..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 resize-none" /></div>)}
                {capturedPhoto && (<button onClick={handleSakitIzin} disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : `📋 Kirim Absensi ${selectedType}`}</button>)}
                <button onClick={() => { stopCamera(); setCapturedPhoto(null); setAttStep('gps_sakit') }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  )
}