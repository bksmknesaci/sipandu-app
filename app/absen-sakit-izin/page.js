"use client"

import React, { useState, useEffect, useRef } from 'react'
import { HeartPulse, Camera, MapPin, Clock, Send, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Loader2, Search, Briefcase } from 'lucide-react'
import { getSiswaByNISN, checkSakitIzinToday, submitSakitIzin, checkStudentPKLStatus } from '@/app/actions/absensiActions'

export default function AbsenSakitIzinPage() {
  const [user, setUser] = useState(null)
  const [siswa, setSiswa] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isWithinTime, setIsWithinTime] = useState(false)
  const [timeMessage, setTimeMessage] = useState('')
  const [countdown, setCountdown] = useState('')

  const [nisnInput, setNisnInput] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [jenisAbsensi, setJenisAbsensi] = useState('')
  const [alasan, setAlasan] = useState('')
  const [lokasi, setLokasi] = useState({ lat: null, lng: null, accuracy: null, status: 'idle' })
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoSize, setFotoSize] = useState(0)
  
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [isPKLStudent, setIsPKLStudent] = useState(false)

  const cameraRef = useRef(null)
  const isAdmin = user?.role === 'Administrator'

  const getWIBDate = () => new Date().toLocaleDateString('sv-SE')

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

  useEffect(() => { const stored = localStorage.getItem('userData'); if (stored) setUser(JSON.parse(stored)); setLoadingProfile(false) }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      setLokasi(prev => ({ ...prev, status: 'fetching' }))
      navigator.geolocation.getCurrentPosition(
        (pos) => setLokasi({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, status: 'success' }),
        () => setLokasi({ lat: null, lng: null, accuracy: null, status: 'error' }),
        { enableHighAccuracy: true }
      )
    } else { setLokasi({ lat: null, lng: null, accuracy: null, status: 'error' }) }
  }, [])

  const handleVerifyNISN = async (e) => {
    e.preventDefault(); if (!nisnInput) return; setVerifyLoading(true)
    const res = await getSiswaByNISN(nisnInput)
    if (res.data) {
      setSiswa(res.data)
      // Cek apakah siswa sedang PKL
      if (res.data.id) {
        const pklCheck = await checkStudentPKLStatus(res.data.id)
        if (pklCheck.isPKL) {
          setIsPKLStudent(true)
          setVerifyLoading(false)
          return
        }
      }
      setIsPKLStudent(false)
      const todayWIB = getWIBDate()
      const checkRes = await checkSakitIzinToday(res.data.nisn, todayWIB)
      if (checkRes.data) setAlreadySubmitted(true); else setAlreadySubmitted(false)
    } else { setToast({ type: 'error', message: res.error || 'NISN tidak ditemukan!' }); setSiswa(null) }
    setVerifyLoading(false)
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; const maxW = 540; const maxH = 720
          if (width > maxW) { height = Math.round((maxW / width) * height); width = maxW }
          if (height > maxH) { width = Math.round((maxH / height) * width); height = maxH }
          canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => resolve(new File([blob], "bukti_compressed.jpg", { type: "image/jpeg" })), 'image/jpeg', 0.6)
        }; img.src = event.target.result
      }; reader.readAsDataURL(file)
    })
  }

  const handleCameraChange = async (e) => {
    const file = e.target.files[0]
    if (file) { const compressed = await compressImage(file); setFotoFile(compressed); setFotoPreview(URL.createObjectURL(compressed)); setFotoSize((compressed.size / 1024).toFixed(0)) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin && (lokasi.status !== 'success' || !fotoFile)) { setToast({ type: 'error', message: 'GPS harus aktif dan foto bukti wajib diambil!' }); return }
    if (!siswa || !jenisAbsensi || alasan.length < 20) { setToast({ type: 'error', message: 'Lengkapi semua data wajib!' }); return }

    setSubmitting(true)
    const wibTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }); const timeParts = new Date(wibTime).toTimeString().split(' ')[0]
    let fileData = null
    if (fotoFile) { const arrayBuffer = await fotoFile.arrayBuffer(); fileData = new Uint8Array(arrayBuffer) }

    const formData = {
      tanggal: getWIBDate(), 
      jam: timeParts, 
      // FIX: gunakan siswa.nisn (bukan .nis)
      nisn: siswa.nisn, 
      nama_siswa: siswa.nama,
      kelas: siswa.kelas, 
      jurusan: siswa.jurusan, 
      jenis_absensi: jenisAbsensi, 
      alasan: alasan,
      latitude: lokasi.lat, 
      longitude: lokasi.lng, 
      akurasi_gps: lokasi.accuracy, 
      fileData: fileData
    }

    const res = await submitSakitIzin(formData)
    if (res.success) { setAlreadySubmitted(true); setToast({ type: 'success', message: 'Absensi Sakit/Izin berhasil dikirim!' }) } 
    else { setToast({ type: 'error', message: res.error || 'Gagal mengirim absensi' }) }
    setSubmitting(false)
  }

  if (loadingProfile) return <div className="p-6 flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-500" size={48}/></div>

  const isButtonDisabled = submitting || !jenisAbsensi || alasan.length < 20 || (!isAdmin && (lokasi.status !== 'success' || !fotoFile))
  const missingRequirements = []
  if (!jenisAbsensi) missingRequirements.push('Pilih Jenis Absensi')
  if (alasan.length < 20) missingRequirements.push('Alasan min 20 karakter')
  if (!isAdmin && lokasi.status !== 'success') missingRequirements.push('GPS Aktif')
  if (!isAdmin && !fotoFile) missingRequirements.push('Foto Bukti')

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2"><HeartPulse size={28}/> ABSENSI SAKIT & IZIN</h1>
            <p className="text-blue-100 mt-1 text-sm">Laporkan ketidakhadiran Anda apabila berhalangan hadir ke sekolah.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold"><Clock size={14}/> {currentTime.toLocaleTimeString('id-ID')}</div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
          {isWithinTime ? <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span> : <span className="w-3 h-3 rounded-full bg-red-400"></span>}
          <span className="font-semibold text-sm">{timeMessage} {countdown && `(${countdown})`}</span>
        </div>
      </div>

      {!isWithinTime && !isAdmin ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-3"/>
          <h2 className="text-xl font-bold text-gray-800">{timeMessage === 'Belum Dibuka' ? '⏳ Absensi Belum Dibuka' : '❌ Waktu Absensi Telah Berakhir'}</h2>
          <p className="text-gray-500 mt-2">Pengajuan Sakit dan Izin hanya dapat dilakukan pukul 06:00 WIB s.d. 09:04 WIB.</p>
        </div>
      ) : alreadySubmitted ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <ShieldCheck size={48} className="mx-auto text-blue-500 mb-3"/>
          <h2 className="text-xl font-bold text-gray-800">Anda Sudah Mengirim Absensi Hari Ini</h2>
          <p className="text-gray-500 mt-2">Data Anda sedang menunggu verifikasi Wali Kelas.</p>
          <span className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🟡 Menunggu Verifikasi</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Search size={18}/> Langkah 1: Cari Data Siswa</h3>
            {/* FIX: flex-col di HP, flex-row di SM ke atas */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={nisnInput} onChange={(e) => setNisnInput(e.target.value)} placeholder="Masukkan NISN..." className="w-full sm:flex-1 p-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <button type="button" onClick={handleVerifyNISN} disabled={!nisnInput || verifyLoading} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {verifyLoading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Cari
              </button>
            </div>
          </div>

          {siswa && (
            isPKLStudent ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-200 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Briefcase size={40} className="text-amber-600"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Siswa Terdaftar sebagai PKL</h2>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    <span className="font-semibold text-gray-700">{siswa.nama}</span> saat ini sedang menjalankan Praktik Kerja Lapangan. Absensi sakit/izin untuk siswa PKL harus diajukan melalui halaman <span className="font-bold text-amber-600">Absensi PKL</span>.
                  </p>
                </div>
                <a
                  href="/absensi-pkl"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/25"
                >
                  <Briefcase size={16}/> Menuju Absensi PKL
                </a>
                <button
                  type="button"
                  onClick={() => { setSiswa(null); setIsPKLStudent(false); setNisnInput('') }}
                  className="block mx-auto text-xs text-gray-400 hover:text-gray-600 underline transition"
                >
                  Cari NISN lain
                </button>
              </div>
            ) : (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">{siswa?.nama?.charAt(0) || 'S'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 truncate">{siswa.nama}</h3>
                  <p className="text-sm text-gray-500">NISN: {siswa.nisn}</p>
                  <p className="text-sm text-blue-600 font-semibold">{siswa.kelas} • {siswa.jurusan}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Absensi <span className="text-red-500">*</span></label>
                  <select value={jenisAbsensi} onChange={e => setJenisAbsensi(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                    <option value="">Pilih Jenis</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alasan Ketidakhadiran <span className="text-red-500">*</span></label>
                  <textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={3} minLength={20} className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Min. 20 karakter..." required></textarea>
                  <p className="text-xs text-gray-400 mt-1 text-right">{alasan.length}/20 karakter</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={18}/> Lokasi GPS {!isAdmin && <span className="text-red-500 text-xs">(WAJIB)</span>}</h4>
                  {lokasi.status === 'fetching' && <p className="text-sm text-gray-500 animate-pulse">Mencari lokasi...</p>}
                  {lokasi.status === 'success' && (
                    <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                      <p className="font-bold flex items-center gap-1"><CheckCircle size={14}/> Lokasi Ditemukan</p>
                      <p className="text-xs mt-1 text-gray-600">Lat: {lokasi.lat?.toFixed(4)}, Lng: {lokasi.lng?.toFixed(4)}</p>
                    </div>
                  )}
                  {lokasi.status === 'error' && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <p className="font-bold flex items-center gap-1"><XCircle size={14}/> Lokasi Tidak Ditemukan</p>
                      {!isAdmin && <p className="text-xs mt-1 font-semibold">Aktifkan GPS di perangkat Anda.</p>}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Camera size={18}/> Foto Bukti {!isAdmin && <span className="text-red-500 text-xs">(WAJIB)</span>}</h4>
                  <input type="file" ref={cameraRef} accept="image/*" capture="environment" onChange={handleCameraChange} className="hidden" />
                  
                  {!fotoPreview ? (
                    <button type="button" onClick={() => cameraRef.current.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-400 transition">
                      <Camera size={24}/><span className="text-xs mt-1 font-semibold">Ambil Foto Langsung</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <img src={fotoPreview} alt="Bukti" className="w-full h-32 object-cover rounded-xl shadow-sm" />
                      <button type="button" onClick={() => cameraRef.current.click()} className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70"><Camera size={14}/></button>
                      <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg flex items-center gap-1"><CheckCircle size={12}/> Foto berhasil diambil ({fotoSize} KB)</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button type="submit" disabled={isButtonDisabled} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${isButtonDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 shadow-blue-500/30'}`}>
                  {submitting ? <><Loader2 className="animate-spin" size={20}/> Mengirim Data...</> : <><Send size={20}/> KIRIM ABSENSI</>}
                </button>
                {isButtonDisabled && !submitting && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                    <p className="flex items-center gap-1 mb-1"><AlertTriangle size={12}/> Tombol terkunci. Syarat yang belum terpenuhi:</p>
                    <ul className="list-disc pl-4 space-y-0.5 font-normal">
                      {missingRequirements.map((req, idx) => <li key={idx}>{req}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </>
            )
          )}
        </form>
      )}
    </div>
  )
}