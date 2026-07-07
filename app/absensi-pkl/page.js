'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, Camera, Search, CheckCircle, XCircle, Clock, Building2, User, GraduationCap, Loader2, ChevronRight, AlertTriangle, LogOut } from 'lucide-react'
import { searchStudentForPkl, getPklProfile, savePklProfile, getTodayPklAttendance, submitPklCheckIn, submitPklCheckOut, submitPklSakitIzin } from '@/app/actions/pklActions'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

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

const typeOptions = [
  { type: 'Hadir', emoji: '✅', desc: 'Absen masuk dan pulang dengan validasi GPS & selfie', bg: '#D1FAE5', border: '#6EE7B7', textColor: '#065F46' },
  { type: 'Sakit', emoji: '🤒', desc: 'Wajib lampirkan foto selfie & alasan', bg: '#FEF3C7', border: '#FDE68A', textColor: '#92400E' },
  { type: 'Izin', emoji: '📝', desc: 'Wajib lampirkan foto selfie & alasan', bg: '#DBEAFE', border: '#93C5FD', textColor: '#1E40AF' },
]

export default function AbsensiPKL() {
  const [step, setStep] = useState('search')
  const [nisn, setNisn] = useState('')
  const [student, setStudent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [todayAtt, setTodayAtt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [attStep, setAttStep] = useState('choose')
  const [selectedType, setSelectedType] = useState('')
  const [note, setNote] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [gpsData, setGpsData] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('')
  const [gpsValid, setGpsValid] = useState(null)

  const [form, setForm] = useState({ company_name: '', company_address: '', industry_supervisor: '', guru_pembimbing: '', start_date: '', end_date: '', work_start_time: '', work_end_time: '', work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], latitude: '', longitude: '', radius_meter: '50' })
  const [savingProfile, setSavingProfile] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])
  useEffect(() => { return () => stopCamera() }, [])

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

  const handleSearch = async () => {
    if (!nisn.trim()) { showToast('Masukkan NISN', 'error'); return }
    setLoading(true)
    const res = await searchStudentForPkl(nisn.trim())
    setLoading(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setStudent(res.student); setProfile(res.profile)
    if (res.profile) {
      const attRes = await getTodayPklAttendance(res.student.id)
      setTodayAtt(attRes.attendance)
      if (res.profile.status === 'Berjalan') {
        if (attRes.attendance) {
          setAttStep(attRes.attendance.check_out_time ? 'done' : 'checkout')
        } else { setAttStep('choose') }
      } else { setAttStep('inactive') }
      setStep('attendance')
    } else {
      setForm(f => ({ ...f, start_date: '', end_date: '', work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] }))
      setStep('setup')
    }
  }

  const handleSaveProfile = async () => {
    if (!form.company_name.trim()) { showToast('Nama perusahaan wajib diisi', 'error'); return }
    if (!form.start_date || !form.end_date) { showToast('Tanggal mulai dan selesai wajib diisi', 'error'); return }
    if (!form.work_start_time || !form.work_end_time) { showToast('Jam kerja wajib diisi', 'error'); return }
    setSavingProfile(true)
    const res = await savePklProfile({ ...form, student_id: student.id })
    setSavingProfile(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setProfile(res.profile); setStep('attendance'); setAttStep('choose')
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

  // ═══════════ FIX: Hapus guard clause yang salah ═══════════
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

  // ═══════════ NEW: Ambil GPS untuk Sakit/Izin (tanpa validasi radius) ═══════════
  const handleCaptureGPSSakitIzin = async () => {
    setGpsStatus('getting')
    try {
      const loc = await getGPS()
      setGpsData({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy })
      setGpsStatus('done')
      showToast('Lokasi berhasil diambil', 'success')
    } catch (e) { setGpsStatus('error'); showToast('Gagal mendapatkan lokasi GPS', 'error') }
  }

  const handleChooseType = (type) => {
    setSelectedType(type); setNote(''); setCapturedPhoto(null); setGpsData(null); setGpsValid(null); setGpsStatus('')
    if (type === 'Hadir') {
      setAttStep('gps')
    } else {
      setAttStep('gps_sakit')
    }
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
    setTodayAtt(res.data); setAttStep('checkout')
    showToast(`Absensi masuk berhasil! Status: ${res.status}${res.isLate ? ' (Terlambat)' : ''}`)
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
    setTodayAtt(res.data); setAttStep('done')
    showToast('Absensi pulang berhasil!')
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
    setTodayAtt(res.data); setAttStep('done')
    showToast(`Absensi ${selectedType.toLowerCase()} berhasil dicatat!`)
  }

  const handleReset = () => {
    stopCamera(); setStudent(null); setProfile(null); setTodayAtt(null); setNisn('')
    setStep('search'); setAttStep('choose'); setCapturedPhoto(null); setGpsData(null); setGpsValid(null); setGpsStatus('')
  }

  const showToast = (message, type = 'success') => setToast({ message, type, key: Date.now() })

  const handleEditProfile = () => {
    if (!profile) return
    setForm({
      company_name: profile.company_name || '',
      company_address: profile.company_address || '',
      industry_supervisor: profile.industry_supervisor || '',
      guru_pembimbing: profile.guru_pembimbing || '',
      start_date: profile.start_date || '',
      end_date: profile.end_date || '',
      work_start_time: profile.work_start_time || '',
      work_end_time: profile.work_end_time || '',
      work_days: profile.work_days || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      latitude: profile.latitude ? String(profile.latitude) : '',
      longitude: profile.longitude ? String(profile.longitude) : '',
      radius_meter: 50,
    })
    if (profile.latitude && profile.longitude) {
      setGpsData({ lat: profile.latitude, lng: profile.longitude, accuracy: 0 })
      setGpsStatus('done')
    } else {
      setGpsData(null); setGpsStatus('')
    }
    setStep('setup')
  }

  const toggleWorkDay = (day) => {
    setForm(f => ({ ...f, work_days: f.work_days.includes(day) ? f.work_days.filter(d => d !== day) : [...f.work_days, day] }))
  }

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
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0]}</div>
                <div><p className="font-bold text-gray-800">{student.nama}</p><p className="text-xs text-gray-500">{student.nisn} · {student.kelas} {student.jurusan}</p></div>
              </div>
            </div>
            {!profile ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                <p className="font-semibold">📝 Profil PKL Belum Ada</p>
                <p className="text-xs mt-1">Lengkapi data di bawah ini untuk mengaktifkan absensi PKL, dan lakukan pengisian di tempat PKL.</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
                <p className="font-semibold">⚙️ Atur Ulang Profil PKL</p>
                <p className="text-xs mt-1">Perbaiki data di bawah ini. Setelah disimpan, Anda akan kembali ke halaman absensi.</p>
              </div>
            )}
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
              <button onClick={handleGetLocation} disabled={gpsStatus === 'getting'} className="w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2">
                {gpsStatus === 'getting' ? <><Loader2 size={16} className="animate-spin" /> Mendapatkan Lokasi...</> : <><MapPin size={16} /> Ambil Lokasi GPS Sekarang</>}
              </button>
              {gpsData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Latitude:</span> <span className="font-mono font-bold">{gpsData.lat?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Longitude:</span> <span className="font-mono font-bold">{gpsData.lng?.toFixed(7)}</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Akurasi:</span> <span className="font-bold">{Math.round(gpsData.accuracy)}m</span></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Radius Absensi:</span> <span className="font-bold text-blue-700">50 meter (tetap)</span></div>
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
            {/* Student Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{student.nama?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{student.nama}</p>
                  <p className="text-xs text-gray-500">{student.nisn} · {student.kelas} {student.jurusan}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(profile.status)}`}>{profile.status}</span>
              </div>
              {profile.company_name && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Perusahaan:</span> <span className="font-semibold text-gray-700">{profile.company_name}</span></div>
                  <div><span className="text-gray-400">Jam:</span> <span className="font-semibold text-gray-700">{profile.work_start_time} - {profile.work_end_time}</span></div>
                </div>
              )}
            </div>

            {/* Tombol Atur Ulang — HANYA muncul jika profil sudah ada */}
            {profile && attStep === 'choose' && (
              <button onClick={handleEditProfile} className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 hover:shadow-md hover:border-blue-300 transition group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition text-lg">
                  ⚙️
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-700 transition">Atur Ulang Profil PKL</p>
                  <p className="text-[10px] text-gray-500">Perbaiki data perusahaan, jam kerja, hari kerja, atau lokasi</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-blue-500 transition"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}

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

            {/* Choose Type — FIXED: inline style agar text hitam */}
            {attStep === 'choose' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Pilih Jenis Absensi:</p>
                {typeOptions.map(item => (
                  <button key={item.type} onClick={() => handleChooseType(item.type)}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition text-left border-2"
                    style={{ backgroundColor: item.bg, borderColor: item.border, color: item.textColor }}>
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1"><p className="font-bold text-base">{item.type}</p><p className="text-xs opacity-80">{item.desc}</p></div>
                    <ChevronRight size={20} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            )}

            {/* ═══════════ GPS VALIDATION (Hadir) — FIXED ═══════════ */}
            {attStep === 'gps' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Validasi Lokasi GPS</h3>
                <p className="text-xs text-gray-500">Pastikan Anda berada di lokasi PKL ({profile.company_name}) — Radius: 50m</p>

                {/* Info Waktu Absensi */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5"><Clock size={13} /> Jadwal Absensi Hari Ini</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                      <p className="text-blue-500 font-semibold text-[10px] uppercase">Jam Masuk</p>
                      <p className="font-bold text-gray-800 text-base">{profile.work_start_time || '-'}</p>
                      <p className="text-[10px] text-gray-400">Buka {formatMinToTime(timeToMin(profile.work_start_time) - 60)} s.d. {formatMinToTime(timeToMin(profile.work_start_time) + 180)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-blue-100">
                      <p className="text-blue-500 font-semibold text-[10px] uppercase">Jam Pulang</p>
                      <p className="font-bold text-gray-800 text-base">{profile.work_end_time || '-'}</p>
                      <p className="text-[10px] text-gray-400">Buka {formatMinToTime(timeToMin(profile.work_end_time) - 60)} s.d. {formatMinToTime(timeToMin(profile.work_end_time) + 120)}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                    <span className="text-amber-600 text-sm">⏰</span>
                    <div className="text-xs">
                      <p className="font-semibold text-amber-800">Toleransi Terlambat: 15 menit</p>
                      <p className="text-amber-600">Jika absen setelah <span className="font-bold">{formatMinToTime(timeToMin(profile.work_start_time) + 15)}</span>, status otomatis <span className="font-bold text-orange-600">Terlambat</span></p>
                    </div>
                  </div>
                </div>

                {gpsStatus === '' && (
                  <button onClick={handleValidateGPS} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md">
                    <MapPin size={16} /> Ambil & Validasi Lokasi
                  </button>
                )}

                {gpsStatus === 'validating' && (
                  <div className="text-center py-8"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" /><p className="text-sm text-gray-600 font-medium">Memvalidasi lokasi...</p></div>
                )}

                {gpsStatus === 'valid' && gpsValid && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-emerald-800">✅ Lokasi Terverifikasi</p>
                    <p className="text-xs text-emerald-600 mt-1">Jarak: {Math.round(gpsData.currentDist)}m (batas: 50m)</p>
                    <p className="text-[10px] text-emerald-500 mt-1 font-mono">Lat: {gpsData.lat?.toFixed(6)}, Lng: {gpsData.lng?.toFixed(6)}</p>
                  </div>
                )}

                {gpsStatus === 'invalid' && gpsValid === false && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <XCircle size={32} className="mx-auto text-red-500 mb-2" />
                    <p className="font-bold text-red-800">❌ Di Luar Area PKL</p>
                    <p className="text-xs text-red-600 mt-1">Jarak Anda: {Math.round(gpsData.currentDist)}m (batas: 50m)</p>
                    <button onClick={handleValidateGPS} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button>
                  </div>
                )}

                {gpsStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
                    <p className="font-bold text-red-800">Gagal Mendapatkan Lokasi</p>
                    <p className="text-xs text-red-600 mt-1">Pastikan GPS aktif dan izin lokasi diizinkan</p>
                    <button onClick={handleValidateGPS} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button>
                  </div>
                )}

                {gpsValid && (
                  <button onClick={() => setAttStep('photo_hadir')} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2">
                    <Camera size={16} /> Lanjut Ambil Foto Selfie →
                  </button>
                )}
                <button onClick={() => { setAttStep('choose'); setGpsValid(null); setGpsStatus(''); setGpsData(null) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ GPS CAPTURE (Sakit/Izin) — NEW ═══════════ */}
            {attStep === 'gps_sakit' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Ambil Lokasi Anda</h3>
                <p className="text-xs text-gray-500">Sistem akan merekam titik koordinat tempat Anda saat ini (tanpa validasi radius)</p>

                {gpsStatus === '' && (
                  <button onClick={handleCaptureGPSSakitIzin} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md">
                    <MapPin size={16} /> Ambil Lokasi GPS
                  </button>
                )}

                {gpsStatus === 'getting' && (
                  <div className="text-center py-8"><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" /><p className="text-sm text-gray-600 font-medium">Mengambil lokasi...</p></div>
                )}

                {gpsStatus === 'done' && gpsData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <CheckCircle size={32} className="mx-auto text-blue-500 mb-2" />
                    <p className="font-bold text-blue-800">✅ Lokasi Berhasil Diambil</p>
                    <p className="text-xs text-blue-600 mt-1 font-mono">Lat: {gpsData.lat?.toFixed(6)}, Lng: {gpsData.lng?.toFixed(6)}</p>
                    <p className="text-[10px] text-blue-500 mt-1">Akurasi: {Math.round(gpsData.accuracy)}m</p>
                  </div>
                )}

                {gpsStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
                    <p className="font-bold text-red-800">Gagal Mendapatkan Lokasi</p>
                    <button onClick={handleCaptureGPSSakitIzin} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition">Coba Lagi</button>
                  </div>
                )}

                {gpsStatus === 'done' && (
                  <button onClick={() => setAttStep('photo_sakit')} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2">
                    <Camera size={16} /> Lanjut Ambil Foto Selfie →
                  </button>
                )}
                <button onClick={() => { setAttStep('choose'); setGpsStatus(''); setGpsData(null) }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ PHOTO: HADIR (Check-in / Check-out) ═══════════ */}
            {(attStep === 'photo_hadir') && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} className="text-blue-600" /> Foto Selfie — Absen {todayAtt?.check_in_time ? 'Pulang' : 'Masuk'}</h3>
                {!cameraActive && !capturedPhoto && (
                  <button onClick={startCamera} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2">
                    <Camera size={20} /> Buka Kamera
                  </button>
                )}
                <div className={`relative rounded-xl overflow-hidden bg-black ${cameraActive ? '' : 'hidden'}`}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                  {cameraActive && (
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition active:scale-95">
                      <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white" />
                    </button>
                  )}
                </div>
                {capturedPhoto && (
                  <div className="space-y-3">
                    <img src={capturedPhoto} alt="Selfie" className="w-full rounded-xl border" />
                    <button onClick={() => { setCapturedPhoto(null) }} className="w-full py-2 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition">📷 Ambil Ulang</button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
                {capturedPhoto && (
                  <button onClick={todayAtt?.check_in_time ? handleCheckOut : handleCheckIn} disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : `✅ Kirim Absensi ${todayAtt?.check_in_time ? 'Pulang' : 'Masuk'}`}
                  </button>
                )}
                <button onClick={() => { stopCamera(); setCapturedPhoto(null); setAttStep('gps') }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* ═══════════ PHOTO: SAKIT/IZIN ═══════════ */}
            {attStep === 'photo_sakit' && (
              <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} className="text-blue-600" /> Foto Selfie — {selectedType}</h3>
                {gpsData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-[10px] text-blue-600 font-mono">
                    📍 Lokasi: Lat {gpsData.lat?.toFixed(6)}, Lng {gpsData.lng?.toFixed(6)} (Akurasi: {Math.round(gpsData.accuracy)}m)
                  </div>
                )}
                {!cameraActive && !capturedPhoto && (
                  <button onClick={startCamera} className="w-full py-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2">
                    <Camera size={20} /> Buka Kamera
                  </button>
                )}
                <div className={`relative rounded-xl overflow-hidden bg-black ${cameraActive ? '' : 'hidden'}`}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                  {cameraActive && (
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition active:scale-95">
                      <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white" />
                    </button>
                  )}
                </div>
                {capturedPhoto && (
                  <div className="space-y-3">
                    <img src={capturedPhoto} alt="Selfie" className="w-full rounded-xl border" />
                    <button onClick={() => setCapturedPhoto(null)} className="w-full py-2 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-lg transition">📷 Ambil Ulang</button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
                {capturedPhoto && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Alasan {selectedType} *</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Contoh: Sedang demam tinggi..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 resize-none" />
                  </div>
                )}
                {capturedPhoto && (
                  <button onClick={handleSakitIzin} disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : `📋 Kirim Absensi ${selectedType}`}
                  </button>
                )}
                <button onClick={() => { stopCamera(); setCapturedPhoto(null); setAttStep('gps_sakit') }} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition">← Kembali</button>
              </div>
            )}

            {/* Checkout prompt */}
            {attStep === 'checkout' && todayAtt && !todayAtt.check_out_time && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><CheckCircle size={20} className="text-blue-600" /></div>
                  <div>
                    <p className="font-bold text-blue-800">Sudah Absen Masuk</p>
                    <p className="text-xs text-blue-600">Jam: {todayAtt.check_in_time} · Status: {todayAtt.status}</p>
                  </div>
                </div>
                <button onClick={() => { setCapturedPhoto(null); setGpsValid(null); setGpsStatus(''); setGpsData(null); setAttStep('gps') }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md">
                  <MapPin size={16} /> Absen Pulang
                </button>
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