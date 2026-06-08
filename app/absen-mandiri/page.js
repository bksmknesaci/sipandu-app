"use client";

import React, { useState, useEffect } from 'react';
import { UserCheck, Camera, MapPin, Clock, Shield, AlertTriangle, CheckCircle, QrCode, LogIn } from 'lucide-react';

export default function AbsenMandiriPage() {
  const [step, setStep] = useState('idle'); // idle, camera, scanning, validating, success, failed
  const [message, setMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);

  // Cek apakah user login
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loggedIn === 'true');
  }, []);

  // Validasi GPS (Simulasi)
  const checkGPS = () => {
    setLocationStatus('checking');
    // Di dunia nyata, gunakan navigator.geolocation.getCurrentPosition
    // lalu hitung jarak ke koordinat sekolah (Haversine formula)
    setTimeout(() => {
      // Simulasi berhasil (dalam radius)
      setLocationStatus('valid');
    }, 1500);
  };

  // Validasi Waktu (Simulasi)
  const checkTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    
    // Jam masuk 06:00 - 07:15 (360 - 435)
    if (time >= 360 && time <= 435) {
      setTimeStatus('valid');
      return 'Hadir';
    }
    // Terlambat 07:16 - 08:00 (436 - 480)
    else if (time > 435 && time <= 480) {
      setTimeStatus('valid');
      return 'Terlambat';
    }
    // Di luar jam
    else {
      setTimeStatus('invalid');
      return 'Diluar Jam Absensi';
    }
  };

  const startScan = () => {
    if (!isLoggedIn) {
      setStep('failed');
      setMessage('Anda harus login sebagai siswa aktif terlebih dahulu.');
      return;
    }
    setStep('camera');
    checkGPS();
  };

  const handleScanSimulation = () => {
    setStep('validating');
    
    // Cek GPS
    if (locationStatus !== 'valid') {
      setStep('failed');
      setMessage('Anda berada di luar area sekolah. Silakan lakukan absensi dari lingkungan sekolah.');
      return;
    }

    // Cek Waktu
    const timeResult = checkTime();
    if (timeStatus === 'invalid') {
      setStep('failed');
      setMessage(`Absensi gagal. ${timeResult}. Jam absensi adalah 06:00 - 08:00.`);
      return;
    }

    // Simulasi Cek Duplikat
    const alreadyScan = false; // Di dunia nyata, cek ke Supabase
    if (alreadyScan) {
      setStep('failed');
      setMessage('Anda sudah melakukan absensi hari ini.');
      return;
    }

    // Simulasi Cek Kelas
    const correctClass = true; // Di dunia nyata, bandingkan QR kelas dengan kelas siswa
    if (!correctClass) {
      setStep('failed');
      setMessage('QR Code tidak sesuai dengan kelas Anda.');
      return;
    }

    // Semua valid
    setTimeout(() => {
      setStep('success');
      setMessage(`Absensi berhasil dicatat pada ${new Date().toLocaleTimeString()} dengan status: ${timeResult}`);
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        
        {/* Idle State */}
        {step === 'idle' && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center animate-fadeIn">
            <div className="bg-blue-50 p-4 rounded-full inline-block mb-5">
              <QrCode size={40} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Absen Hadir Mandiri</h1>
            <p className="text-gray-500 text-sm mb-8">
              Pastikan Anda berada di lingkungan sekolah dan dalam jam absensi yang ditentukan.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-left mb-6 text-xs text-yellow-700 space-y-2">
              <p className="font-bold text-sm mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Syarat Absensi:</p>
              <p className="flex items-center gap-2"><CheckCircle size={12}/> Login sebagai siswa aktif</p>
              <p className="flex items-center gap-2"><CheckCircle size={12}/> Berada di area sekolah (Max 100m)</p>
              <p className="flex items-center gap-2"><CheckCircle size={12}/> Dilakukan pada jam 06:00 - 08:00</p>
              <p className="flex items-center gap-2"><CheckCircle size={12}/> Belum absen hari ini</p>
            </div>

            <button onClick={startScan} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md">
              <Camera size={20}/> Mulai Scan QR Kelas
            </button>
          </div>
        )}

        {/* Camera / Scanning State */}
        {(step === 'camera' || step === 'scanning') && (
          <div className="bg-white rounded-2xl shadow-lg border p-6 text-center animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Scan QR Code Kelas</h3>
            
            {/* Camera Viewport Mockup */}
            <div className="relative bg-gray-900 w-full h-64 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
              <div className="absolute w-40 h-40 border-4 border-blue-400 rounded-2xl opacity-80 animate-pulse"></div>
              <Camera size={40} className="text-gray-600"/>
            </div>

            {/* Validations List */}
            <div className="space-y-2 text-left text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className={locationStatus === 'valid' ? 'text-green-500' : 'text-yellow-500'}/> 
                {locationStatus === 'valid' ? 'Lokasi Terverifikasi' : locationStatus === 'checking' ? 'Mengecek lokasi...' : 'Menunggu lokasi'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} className="text-green-500"/> Jam absensi aktif
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <LogIn size={16} className="text-green-500"/> Siswa aktif terautentikasi
              </div>
            </div>

            <button onClick={handleScanSimulation} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md">
              <QrCode size={20}/> Simulasikan Scan Berhasil
            </button>
          </div>
        )}

        {/* Validating State */}
        {step === 'validating' && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Memvalidasi Absensi...</h3>
            <p className="text-sm text-gray-500">Cek lokasi, waktu, dan data kehadiran</p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center animate-fadeIn">
            <div className="bg-green-50 p-4 rounded-full inline-block mb-5">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-2">Absensi Berhasil!</h3>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <button onClick={() => setStep('idle')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all">Kembali</button>
          </div>
        )}

        {/* Failed State */}
        {step === 'failed' && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center animate-fadeIn">
            <div className="bg-red-50 p-4 rounded-full inline-block mb-5">
              <AlertTriangle size={40} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-2">Absensi Ditolak</h3>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <button onClick={() => setStep('idle')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all">Coba Lagi</button>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}