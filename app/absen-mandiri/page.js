"use client"

import React, { useState, useEffect, useRef } from 'react'
import { UserCheck, Search, Camera, CheckCircle, XCircle, Loader2, ShieldCheck, QrCode, X } from 'lucide-react'
import { getSiswaByNISN, submitAbsenMandiri } from '@/app/actions/absensiActions'

export default function AbsenHadirMandiri() {
  const [nisnInput, setNisnInput] = useState('')
  const [siswa, setSiswa] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [toast, setToast] = useState(null)
  
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [scannedResult, setScannedResult] = useState('')
  const html5QrCodeRef = useRef(null)

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayStr = new Date().toLocaleDateString('sv-SE')

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }
  }, [toast])

  const handleVerifyNISN = async (e) => {
    e.preventDefault()
    if (!nisnInput) return
    setLoading(true)
    setSiswa(null)
    setIsSubmitted(false)
    
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

  const validateAndSubmit = async (qrText) => {
    if (!siswa) return
    
    const fullKelasSiswa = `${siswa.kelas.trim()} ${siswa.jurusan.trim()}`
    let kelasFromQR = ""
    
    // PERBAIKAN: Parse format JSON dari QR Absensi SIPANDU
    try {
      const qrData = JSON.parse(qrText)
      if (qrData.kelas_id) {
        // Ganti strip dengan spasi (X-TKRO-1 menjadi X TKRO 1)
        kelasFromQR = qrData.kelas_id.replace(/-/g, ' ')
      }
    } catch (e) {
      // Jika bukan format JSON, gunakan teks aslinya
      kelasFromQR = qrText
    }
    
    // Cek kecocokan kelas
    if (kelasFromQR !== fullKelasSiswa) {
      setToast({ type: 'error', message: `Gagal! QR ini untuk kelas ${kelasFromQR}, sedangkan Anda siswa kelas ${fullKelasSiswa}.` })
      return
    }

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

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-xl">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><UserCheck size={28}/> ABSEN HADIR MANDIRI</h1>
        <p className="text-emerald-100 mt-1 text-sm">{today}</p>
        <p className="text-emerald-100 mt-2 text-sm">Masukkan NISN, lalu scan QR Code yang tertempel di meja kelas Anda menggunakan kamera.</p>
      </div>

      {isSubmitted ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <ShieldCheck size={64} className="mx-auto text-emerald-500 mb-4"/>
          <h2 className="text-2xl font-bold text-gray-800">Absensi Berhasil!</h2>
          <p className="text-gray-500 mt-2">Anda telah dicatat <span className="font-bold text-emerald-600">HADIR</span> hari ini.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
            <CheckCircle size={16} className="text-emerald-600"/> <span className="text-sm font-bold text-emerald-700">QR Mandiri Terverifikasi</span>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Search size={18}/> Langkah 1: Cari Data Siswa</h3>
            <form onSubmit={handleVerifyNISN} className="flex gap-3">
              <input type="text" value={nisnInput} onChange={(e) => setNisnInput(e.target.value)} placeholder="Masukkan NISN Anda..." className="flex-1 p-3 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              <button type="submit" disabled={!nisnInput || loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
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
                  <p className="text-sm text-gray-500">NISN: {siswa.nis} • Kelas: {siswa.kelas} {siswa.jurusan}</p>
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
                    <p className="text-center text-sm text-gray-500 animate-pulse">Arahkan kamera ke QR Code di meja/dinding kelas Anda...</p>
                  </div>
                ) : null}

                {scannedResult && !isSubmitted && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center mt-4">
                    <CheckCircle className="text-emerald-600 mx-auto mb-2" size={32}/>
                    <p className="font-bold text-emerald-800">QR Terbaca & Sedang Divalidasi!</p>
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