"use client"

import React, { useState, useEffect, useRef } from 'react'
import { UserCheck, Search, Camera, CheckCircle, XCircle, Loader2, ShieldCheck, QrCode, X, Clock, AlertTriangle, MapPin, RefreshCw } from 'lucide-react'
import { getSiswaByNISN, submitAbsenMandiri, checkQRScanToday } from '@/app/actions/absensiActions'

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function AbsenHadirMandiri() {
  const [user, setUser] = useState(null)
  const [nisnInput, setNisnInput] = useState('')
  const [siswa, setSiswa] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [toast, setToast] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [gpsFailed, setGpsFailed] = useState(null)

  // Waktu
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isWithinTime, setIsWithinTime] = useState(false)
  const [timeMessage, setTimeMessage] = useState('')
  const [countdown, setCountdown] = useState('')

  // Kamera
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [scannedResult, setScannedResult] = useState('')
  const html5QrCodeRef = useRef(null)

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayStr = new Date().toLocaleDateString('sv-SE')
  const isAdmin = user?.role === 'Administrator'

  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      if (isAdmin) { setIsWithinTime(true); setTimeMessage('Mode Admin (Bebas Waktu)'); return }
      const wibTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
      const hours = wibTime.getHours(); const minutes = wibTime.getMinutes(); const totalMinutes = hours * 60 + minutes
      if (totalMinutes >= 360 && totalMinutes <= 544) { setIsWithinTime(true); setTimeMessage('Absensi Dibuka') }
      else if (totalMinutes < 360) { setIsWithinTime(false); setTimeMessage('Belum Dibuka'); const diff = (360 - totalMinutes) * 60 * 1000; const hrs = Math.floor(diff / 3600000); const mins = Math.floor((diff % 3600000) / 60000); const secs = Math.floor((diff % 60000) / 1000); setCountdown(`${hrs}j ${mins}m ${secs}d`) }
      else { setIsWithinTime(false); setTimeMessage('Sudah Ditutup'); setCountdown('') }
    }, 1000)
    return () => clearInterval(timer)
  }, [isAdmin])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }
  }, [toast])

  const handleVerifyNISN = async (e) => {
    e.preventDefault()
    if (!nisnInput) return
    setLoading(true)
    setSiswa(null)
    setIsSubmitted(false)
    setGpsFailed(null)
    setScannedResult('')

    const res = await getSiswaByNISN(nisnInput)
    if (res.data) {
      setSiswa(res.data)
    } else {
      setToast({ type: 'error', message: res.error || 'NISN tidak ditemukan!' })
    }
    setLoading(false)
  }

  const startCamera = async () => {
    setScannedResult('')
    setGpsFailed(null)
    setIsCameraOpen(true)

    const { Html5Qrcode } = await import('html5-qrcode')
    const html5QrCode = new Html5Qrcode("qr-reader")
    html5QrCodeRef.current = html5QrCode

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScannedResult(decodedText)
          stopCamera()
          validateAndSubmit(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setToast({ type: 'error', message: 'Gagal membuka kamera. Pastikan izin kamera diaktifkan.' })
      setIsCameraOpen(false)
    }
  }

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop() } catch (e) {}
      html5QrCodeRef.current = null
    }
    setIsCameraOpen(false)
  }

  const handleCobaLagi = () => {
    setGpsFailed(null)
    setScannedResult('')
  }

  const validateAndSubmit = async (qrText) => {
    if (!siswa) return

    // ── CEK 1: Duplikat scan QR hari ini ──
    const scanCheck = await checkQRScanToday(nisnInput)
    if (scanCheck.alreadyScanned) {
      setToast({ type: 'error', message: '❌ Anda sudah scan QR hari ini. Scan QR hanya bisa dilakukan 1x per hari.' })
      return
    }

    // ── CEK 2: QR harus sesuai kelas siswa ──
    const fullKelasSiswa = `${siswa.kelas.trim()} ${siswa.jurusan.trim()}`
    let kelasFromQR = ""
    try {
      const qrData = JSON.parse(qrText)
      if (qrData.kelas_id) kelasFromQR = qrData.kelas_id.replace(/-/g, ' ')
    } catch (e) {
      kelasFromQR = qrText
    }

    if (kelasFromQR !== fullKelasSiswa) {
      setToast({ type: 'error', message: `Gagal! QR ini untuk kelas ${kelasFromQR}, sedangkan Anda siswa kelas ${fullKelasSiswa}.` })
      return
    }

    // ── CEK 3: Validasi GPS Radius — WAJIB jika sudah diatur, TIDAK ADA silent skip ──
    if (!isAdmin) {
      setIsValidating(true)

      // 3a. Ambil pengaturan GPS dari database
      let gpsLat, gpsLng, gpsRadius, gpsConfigured = false
      try {
        const { getQRSettings } = await import('@/app/actions/qrAbsensiActions')
        const settingsResult = await getQRSettings()
        // Handle berbagai kemungkinan format return
        const qrSet = settingsResult?.settings || settingsResult?.data || settingsResult
        gpsLat = parseFloat(qrSet?.gps_latitude)
        gpsLng = parseFloat(qrSet?.gps_longitude)
        gpsRadius = parseFloat(qrSet?.gps_radius)
        gpsConfigured = !isNaN(gpsLat) && !isNaN(gpsLng) && !isNaN(gpsRadius) && gpsRadius > 0
        console.log('[GPS] Settings loaded:', { gpsLat, gpsLng, gpsRadius, gpsConfigured })
      } catch (err) {
        console.error('[GPS] Gagal memuat pengaturan GPS:', err)
      }

      // 3b. Jika GPS sudah diatur → validasi WAJIB, tidak bisa dilewati
      if (gpsConfigured) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            })
          })

          const dist = haversineDistance(gpsLat, gpsLng, position.coords.latitude, position.coords.longitude)
          console.log('[GPS] Jarak:', dist, 'meter | Radius:', gpsRadius, 'meter')

          if (dist > gpsRadius) {
            // ❌ DI LUAR RADIUS → TOLAK ABSENSI
            setIsValidating(false)
            setGpsFailed({
              distance: dist,
              radius: Math.round(gpsRadius),
              gpsError: false
            })
            return
          }
          // ✅ Dalam radius → lanjut ke submit

        } catch (gpsErr) {
          // ❌ GPS TIDAK BISA DIAKSES → TOLAK (karena pengaturan GPS sudah diatur)
          console.error('[GPS] Gagal mendapatkan posisi:', gpsErr.message)
          setIsValidating(false)
          setGpsFailed({
            distance: null,
            radius: Math.round(gpsRadius),
            gpsError: true
          })
          return
        }
      }

      setIsValidating(false)
    }

    // ── SUBMIT: Lolos semua validasi ──
    setLoading(true)
    const res = await submitAbsenMandiri(nisnInput, todayStr, fullKelasSiswa)
    if (res.success) {
      setIsSubmitted(true)
      setToast({ type: 'success', message: 'Absensi Hadir berhasil dicatat!' })
    } else {
      setToast({ type: 'error', message: res.error || 'Gagal mencatat absensi' })
    }
    setLoading(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2"><UserCheck size={28}/> ABSEN HADIR MANDIRI</h1>
            <p className="text-emerald-100 mt-1 text-sm">{today}</p>
            <p className="text-emerald-100 mt-2 text-sm">Masukkan NISN, lalu scan QR Code yang tertempel di ruang kelas Anda.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold"><Clock size={14}/> {currentTime.toLocaleTimeString('id-ID')}</div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
          {isWithinTime ? <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span> : <span className="w-3 h-3 rounded-full bg-red-400"></span>}
          <span className="font-semibold text-sm">{timeMessage} {countdown && `(${countdown})`}</span>
        </div>
      </div>

      {/* ===== WAKTU DITUTUP / BELUM DIBUKA ===== */}
      {!isWithinTime && !isAdmin ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3"/>
          <h2 className="text-xl font-bold text-gray-800">{timeMessage === 'Belum Dibuka' ? '⏳ Absensi Belum Dibuka' : '❌ Waktu Absensi Telah Berakhir'}</h2>
          <p className="text-gray-500 mt-2">Absen Hadir Mandiri hanya dapat dilakukan pukul 06:00 WIB s.d. 09:04 WIB.</p>
        </div>

      /* ===== BERHASIL ===== */
      ) : isSubmitted ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-200 text-center">
          <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-200">
            <ShieldCheck size={72} className="text-emerald-500"/>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Absensi Berhasil!</h2>
          <p className="text-gray-500 mt-2">{siswa?.nama} telah dicatat <span className="font-bold text-emerald-600">HADIR</span> hari ini.</p>
          <div className="mt-5 inline-flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-200">
            <CheckCircle size={16} className="text-emerald-600"/> <span className="text-sm font-bold text-emerald-700">QR Mandiri Terverifikasi</span>
          </div>
        </div>

      /* ===== GAGAL GPS: DI LUAR RADIUS ===== */
      ) : gpsFailed && !gpsFailed.gpsError ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-red-200 text-center">
          {/* Ikon X merah besar */}
          <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200">
            <XCircle size={72} className="text-white"/>
          </div>

          {/* Judul */}
          <h2 className="text-2xl font-extrabold text-gray-800">Absensi Ditolak!</h2>

          {/* Pesan lokasi */}
          <p className="text-red-600 font-bold text-lg mt-3">Lokasi Anda DI LUAR radius</p>

          {/* Detail jarak */}
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <MapPin size={18} className="text-red-500 flex-shrink-0"/>
              <p className="text-sm">Jarak: <span className="font-extrabold text-red-600 text-lg">{gpsFailed.distance?.toFixed(1)} meter</span> dari titik tengah Radius.</p>
            </div>
            <div className="mt-3 pt-3 border-t border-red-100 text-xs text-red-500 text-center">
              Batas radius yang ditentukan: <span className="font-bold">{gpsFailed.radius} meter</span> — Anda melebihi <span className="font-bold">{Math.round(gpsFailed.distance - gpsFailed.radius)} meter</span>
            </div>
          </div>

          {/* Badge */}
          <div className="mt-5 inline-flex items-center gap-2 bg-red-50 px-5 py-2.5 rounded-full border border-red-200">
            <AlertTriangle size={16} className="text-red-500"/> <span className="text-sm font-bold text-red-600">QR Tidak Terverifikasi</span>
          </div>

          {/* Tombol coba lagi */}
          <div className="mt-7">
            <button
              onClick={handleCobaLagi}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={18}/> Coba Lagi
            </button>
            <p className="text-xs text-gray-400 mt-3">Dekatkan diri ke lingkungan sekolah, lalu scan ulang QR Code.</p>
          </div>
        </div>

      /* ===== GAGAL GPS: TIDAK BISA DIAKSES ===== */
      ) : gpsFailed && gpsFailed.gpsError ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-amber-200 text-center">
          <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200">
            <AlertTriangle size={72} className="text-amber-500"/>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Gagal Mendapatkan Lokasi!</h2>
          <p className="text-gray-500 mt-3">Sistem tidak dapat mengakses GPS perangkat Anda. Pastikan izin lokasi sudah diaktifkan di browser.</p>
          <div className="mt-5 inline-flex items-center gap-2 bg-amber-50 px-5 py-2.5 rounded-full border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500"/> <span className="text-sm font-bold text-amber-600">GPS Tidak Tersedia</span>
          </div>
          <div className="mt-7">
            <button
              onClick={handleCobaLagi}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={18}/> Coba Lagi
            </button>
            <p className="text-xs text-gray-400 mt-3">Aktifkan izin lokasi di pengaturan browser, lalu coba lagi.</p>
          </div>
        </div>

      /* ===== FORM UTAMA ===== */
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Search size={18}/> Langkah 1: Cari Data Siswa</h3>
            <form onSubmit={handleVerifyNISN} className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={nisnInput} onChange={(e) => setNisnInput(e.target.value)} placeholder="Masukkan NISN Anda..." className="w-full sm:flex-1 p-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <button type="submit" disabled={!nisnInput || loading} className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && !siswa ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Cari
              </button>
            </form>
          </div>

          {siswa && (
            <>
              <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-xl border">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow flex-shrink-0">
                  {siswa.nama?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{siswa.nama}</h3>
                  <p className="text-sm text-gray-500">NISN: {siswa.nisn} • Kelas: {siswa.kelas} {siswa.jurusan}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><QrCode size={18}/> Langkah 2: Scan QR Code Kelas</h3>

                {!isCameraOpen && !scannedResult ? (
                  <button onClick={startCamera} disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Camera size={20}/> BUKA KAMERA & SCAN QR
                  </button>
                ) : isCameraOpen ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 shadow-inner">
                      <div id="qr-reader" style={{ width: "100%" }}></div>
                      <button onClick={stopCamera} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-10">
                        <X size={16}/>
                      </button>
                    </div>
                    <p className="text-center text-sm text-gray-500 animate-pulse">Arahkan kamera ke QR Code di ruang kelas Anda...</p>
                  </div>
                ) : null}

                {/* Sedang validasi GPS */}
                {scannedResult && isValidating && !gpsFailed && !isSubmitted && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl text-center mt-4">
                    <Loader2 className="text-blue-600 mx-auto mb-2 animate-spin" size={32}/>
                    <p className="font-bold text-blue-800">QR Terbaca! Sedang Memvalidasi Lokasi GPS...</p>
                    <p className="text-xs text-blue-500 mt-1">Mohon tunggu, sedang memeriksa posisi Anda terhadap radius sekolah</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}