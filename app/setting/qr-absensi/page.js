"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode, Download, MapPin, Crosshair, Clock, Shield, RefreshCw,
  Eye, EyeOff, Lock, Unlock, Loader2, UserCheck, UserX, Save, Plus,
  CheckCircle, XCircle, Printer
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { fetchSiswaAction } from '@/app/actions/siswaActions';
import { getQRSettings, saveQRSettings, getQRStats, getSchoolName } from '@/app/actions/qrAbsensiActions';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function QRAbsensiPage() {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qrSettings, setQrSettings] = useState({
    gps_latitude: '', gps_longitude: '', gps_radius: '100',
    jam_masuk: '06:00', jam_terlambat: '07:15', jam_tutup: '09:04'
  });
  const [activeQR, setActiveQR] = useState({});
  const [qrStats, setQrStats] = useState({ hadirHadir: 0, totalScan: 0 });
  const [gpsLocked, setGpsLocked] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [schoolName, setSchoolName] = useState('');

  const blackText = { color: '#1f2937' };
  const inputClass = "w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white";

  // ── Fetch siswa untuk dynamicKelasList ──
  useEffect(() => {
    const fetchSiswa = async () => {
      setLoading(true);
      const result = await fetchSiswaAction();
      if (result.data) setSiswa(result.data);
      if (result.error) console.error('Fetch error:', result.error);
      setLoading(false);
    };
    fetchSiswa();
  }, []);

  // ── Load QR Settings ──
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      const res = await getQRSettings();
      if (res.settings) {
        const s = res.settings;
        setQrSettings({
          gps_latitude: s.gps_latitude || '', gps_longitude: s.gps_longitude || '',
          gps_radius: s.gps_radius || '100', jam_masuk: s.jam_masuk || '06:00',
          jam_terlambat: s.jam_terlambat || '07:15', jam_tutup: s.jam_tutup || '09:04'
        });
        setGpsLocked(!!s.gps_latitude && !!s.gps_longitude);
      }
      setLoadingSettings(false);
    };
    loadSettings();
  }, []);

  // ── Load Nama Sekolah ──
  useEffect(() => {
    const loadSchool = async () => {
      const name = await getSchoolName();
      setSchoolName(name);
    };
    loadSchool();
  }, []);

  // ── Load QR Stats ──
  useEffect(() => {
    if (gpsLocked) {
      const loadStats = async () => {
        try {
          const res = await getQRStats();
          if (res) setQrStats(res);
        } catch (err) { console.error('QR stats error:', err); }
      };
      loadStats();
    }
  }, [gpsLocked]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  // ── Compute class list ──
  const dynamicKelasList = [...new Set(siswa.map(s => {
    const k = (s.kelas || '').trim();
    const j = (s.jurusan || '').trim();
    if (!['X', 'XI', 'XII'].includes(k)) return k;
    if (j) return `${k} ${j}`;
    return k;
  }).filter(Boolean))].sort((a, b) => {
    const order = { X: 1, XI: 2, XII: 3 };
    const aTingkat = order[a.split(' ')[0]] || 99;
    const bTingkat = order[b.split(' ')[0]] || 99;
    if (aTingkat !== bTingkat) return aTingkat - bTingkat;
    return a.localeCompare(b);
  });

  const activeClassCount = dynamicKelasList.filter(k => activeQR[k]?.active).length;
  const totalSiswaAktif = siswa.filter(s => s.status === 'Aktif').length;

  // ── QR Functions ──
  const generateQRData = (kelas) => {
    const payload = {
      kelas_id: kelas.replace(/\s+/g, '-'), token: crypto.randomUUID(),
      timestamp: new Date().toISOString(), signature: btoa(`SIPANDU-${kelas}-${Date.now()}`)
    };
    return JSON.stringify(payload);
  };
  const handleGenerateQR = (kelas) => setActiveQR(prev => ({ ...prev, [kelas]: { data: generateQRData(kelas), active: true } }));
  const handleToggleQR = (kelas) => setActiveQR(prev => ({ ...prev, [kelas]: { ...prev[kelas], active: !prev[kelas].active } }));
  const downloadQR = (kelas) => {
    const canvas = document.getElementById(`qr-canvas-${kelas}`);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QR-${kelas}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handlePrintPDF = async () => {
    // Generate semua QR yang belum ada
    let needsGenerate = false
    dynamicKelasList.forEach(k => {
      if (!activeQR[k]?.data) {
        handleGenerateQR(k)
        needsGenerate = true
      }
    })

    if (needsGenerate) {
      await new Promise(r => setTimeout(r, 600))
    }

    // Kumpulkan data URL dari canvas
    const qrCards = []
    for (const kelas of dynamicKelasList) {
      const canvas = document.getElementById(`qr-canvas-${kelas}`)
      if (canvas) {
        qrCards.push({ kelas, dataUrl: canvas.toDataURL('image/png') })
      }
    }

    if (qrCards.length === 0) {
      setToast({ type: 'error', message: 'Generate QR Code terlebih dahulu!' })
      return
    }

    const tataCara = [
      'Kunjungi Aplikasi SIPANDU di link berikut : https://sipandu-nesaci.vercel.app/',
      'Buka menu ABSEN HADIR MANDIRI → Cari di tombol navigasi "Siswa"',
      'Ketik NISN Anda pada kolom pencarian, Jika tidak tahu NISN buka menu "Cari Data Siswa"',
      'Klik tombol Buka Kamera & Scan QR (Pastikan QR Code sesuai kelas Anda)',
      'Arahkan kamera ke QR Code dibawah ini yang ada di ruang kelas Anda',
      'Pastikan Anda berada di lingkungan sekolah (dalam radius GPS)',
      'Absen Hadir Mandiri hanya dapat dilakukan mulai pukul 06:00 WIB s.d. 09:04 WIB.',
    ]

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QR Absensi - ${schoolName}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 2.5px solid #1f2937; padding: 18px 14px; text-align: center; page-break-inside: avoid; border-radius: 4px; }
    .title { font-size: 15px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 2px; color: #111; }
    .subtitle { font-size: 8.5px; font-weight: 700; margin-bottom: 10px; color: #6b7280; letter-spacing: 0.5px; }
    .tata-cara { text-align: left; font-size: 7px; color: #374151; margin: 0 0 10px 0; padding: 6px 8px; background: #f9fafb; border-radius: 3px; border: 1px solid #e5e7eb; line-height: 1.55; }
    .tata-cara ol { padding-left: 14px; margin: 0; }
    .tata-cara li { margin-bottom: 1px; }
    .qr-img { width: 130px; height: 130px; margin: 0 auto; display: block; }
    .kelas { font-size: 13px; font-weight: 900; margin-top: 10px; letter-spacing: 0.5px; color: #111; }
    .sekolah { font-size: 10px; font-weight: 700; margin-top: 3px; color: #4b5563; letter-spacing: 0.3px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="grid">
    ${qrCards.map(c => `
      <div class="card">
        <div class="title">ABSEN ONLINE SIPANDU</div>
        <div class="subtitle">> Tata Cara Absen Hadir <</div>
        <div class="tata-cara">
          <ol>${tataCara.map(t => `<li>${t}</li>`).join('')}</ol>
        </div>
        <img src="${c.dataUrl}" class="qr-img" />
        <div class="kelas">KELAS ${c.kelas}</div>
        <div class="sekolah">${schoolName.toUpperCase()}</div>
      </div>
    `).join('')}
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    } else {
      setToast({ type: 'error', message: 'Popup diblokir browser. Izinkan popup untuk halaman ini.' })
    }
  }

  // ── GPS Functions ──
  const handleGetLocation = () => {
    if (!navigator.geolocation) { setToast({ type: 'error', message: 'Browser tidak mendukung Geolocation' }); return; }
    setGettingLocation(true); setValidationResult(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setQrSettings(prev => ({ ...prev, gps_latitude: pos.coords.latitude.toFixed(6), gps_longitude: pos.coords.longitude.toFixed(6) }));
        setGettingLocation(false);
        setToast({ type: 'success', message: 'Lokasi berhasil dideteksi!' });
      },
      (err) => {
        setGettingLocation(false);
        setToast({ type: 'error', message: 'Gagal mendapatkan lokasi: ' + err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleValidateGPS = () => {
    const lat = parseFloat(qrSettings.gps_latitude);
    const lng = parseFloat(qrSettings.gps_longitude);
    const radius = parseFloat(qrSettings.gps_radius);
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) { setToast({ type: 'error', message: 'Isi Latitude, Longitude, dan Radius terlebih dahulu' }); return; }
    setValidating(true); setValidationResult(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(lat, lng, pos.coords.latitude, pos.coords.longitude);
        const within = dist <= radius;
        setValidationResult({ distance: dist.toFixed(1), radius, within, accuracy: pos.coords.accuracy.toFixed(1) });
        setValidating(false);
      },
      (err) => {
        setValidating(false);
        setToast({ type: 'error', message: 'Gagal mendapatkan lokasi: ' + err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveSettings = async () => {
    const lat = parseFloat(qrSettings.gps_latitude);
    const lng = parseFloat(qrSettings.gps_longitude);
    if (isNaN(lat) || isNaN(lng)) { setToast({ type: 'error', message: 'Latitude dan Longitude wajib diisi!' }); return; }
    setSaving(true);
    const res = await saveQRSettings(qrSettings);
    if (res.error) { setToast({ type: 'error', message: res.error }); }
    else { setGpsLocked(true); setToast({ type: 'success', message: 'Pengaturan GPS & Waktu berhasil disimpan!' }); setValidationResult(null); }
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <QrCode size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">QR Absensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate dan kelola QR Code per kelas untuk absensi hadir mandiri siswa</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Hadir Hari Ini', value: qrStats.hadirHadir, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Terlambat', value: 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Belum Hadir', value: totalSiswaAktif - qrStats.hadirHadir, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'QR Aktif', value: activeClassCount, icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Scan', value: qrStats.totalScan, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} p-5 rounded-xl border border-gray-100 shadow-sm`}>
            <stat.icon className={`${stat.color} mb-2`} size={24} />
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pengaturan GPS & Waktu */}
      {loadingSettings ? (
        <div className="p-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-3" size={32} /><p className="font-semibold">Memuat pengaturan...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GPS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin className="text-red-500" size={20} /> Validasi GPS Sekolah</h3>
              {gpsLocked ? (
                <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold"><Lock size={11} /> Terkunci</span>
              ) : (
                <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold"><Unlock size={11} /> Belum Diatur</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Latitude</label>
                <input type="text" value={qrSettings.gps_latitude} onChange={(e) => setQrSettings({ ...qrSettings, gps_latitude: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" placeholder="-6.491234" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Longitude</label>
                <input type="text" value={qrSettings.gps_longitude} onChange={(e) => setQrSettings({ ...qrSettings, gps_longitude: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" placeholder="108.412345" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Radius Maksimal (Meter)</label>
              <input type="number" value={qrSettings.gps_radius} onChange={(e) => setQrSettings({ ...qrSettings, gps_radius: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleGetLocation} disabled={gettingLocation} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {gettingLocation ? <Loader2 className="animate-spin" size={15} /> : <Crosshair size={15} />} Ambil Lokasi
              </button>
              <button onClick={handleValidateGPS} disabled={validating} className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-50">
                {validating ? <Loader2 className="animate-spin" size={15} /> : <Shield size={15} />} Validasi GPS
              </button>
            </div>
            {validationResult && (
              <div className={`p-4 rounded-xl border-2 ${validationResult.within ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center gap-3">
                  {validationResult.within ? <CheckCircle size={28} className="text-emerald-600 shrink-0" /> : <XCircle size={28} className="text-red-600 shrink-0" />}
                  <div>
                    <p className={`font-bold text-sm ${validationResult.within ? 'text-emerald-700' : 'text-red-700'}`}>{validationResult.within ? '✅ Lokasi Anda BERADA dalam radius' : '❌ Lokasi Anda DI LUAR radius'}</p>
                    <p className={`text-xs mt-0.5 ${validationResult.within ? 'text-emerald-600' : 'text-red-600'}`}>Jarak: <span className="font-bold">{validationResult.distance} meter</span> dari titik tengah (Radius: {validationResult.radius}m) · Akurasi GPS: ±{validationResult.accuracy}m</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Waktu */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock className="text-blue-500" size={20} /> Validasi Waktu</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Jam Masuk (Hadir)</label>
              <input type="time" value={qrSettings.jam_masuk} onChange={(e) => setQrSettings({ ...qrSettings, jam_masuk: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Batas Terlambat</label>
              <input type="time" value={qrSettings.jam_terlambat} onChange={(e) => setQrSettings({ ...qrSettings, jam_terlambat: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Jam Tutup Absensi</label>
              <input type="time" value={qrSettings.jam_tutup} onChange={(e) => setQrSettings({ ...qrSettings, jam_tutup: e.target.value })} style={blackText} className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* Tombol Simpan */}
      <button onClick={handleSaveSettings} disabled={saving} className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? <><Loader2 className="animate-spin" size={20} /> Menyimpan Pengaturan...</> : <><Save size={20} /> SIMPAN PENGATURAN GPS & WAKTU</>}
      </button>
      {gpsLocked && (
        <p className="text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1"><Lock size={12} /> Koordinat GPS terkunci — QR Code siap di-generate di bawah</p>
      )}

      {/* Daftar QR Code */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Daftar QR Code Kelas <span className="text-sm font-normal text-gray-400">({dynamicKelasList.length} kelas)</span></h3>
            {gpsLocked && <p className="text-xs text-gray-400 mt-1">Koordinat: {qrSettings.gps_latitude}, {qrSettings.gps_longitude} · Radius: {qrSettings.gps_radius}m</p>}
          </div>
          {dynamicKelasList.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => dynamicKelasList.forEach(k => handleGenerateQR(k))} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"><RefreshCw size={16} /> Generate Semua</button>
              <button onClick={handlePrintPDF} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all shadow-md shadow-indigo-500/25"><Printer size={16} /> Cetak PDF</button>
            </div>
          )}
        </div>

        {dynamicKelasList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dynamicKelasList.map(kelas => (
              <div key={kelas} className="border rounded-2xl p-4 bg-gray-50 hover:shadow-md transition-shadow flex flex-col items-center">
                <h4 className="font-bold text-gray-800 mb-3">{kelas}</h4>
                {activeQR[kelas]?.data ? (
                  <div className="bg-white p-2 rounded-lg shadow-inner mb-3 relative">
                    <QRCodeCanvas id={`qr-canvas-${kelas}`} value={activeQR[kelas].data} size={120} level="H" />
                    {!activeQR[kelas].active && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center rounded-lg"><span className="text-white font-bold text-xs">NONAKTIF</span></div>}
                  </div>
                ) : (
                  <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg mb-3 flex items-center justify-center border-2 border-dashed border-gray-300"><QrCode size={40} className="text-gray-300" /></div>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-auto">
                  {!activeQR[kelas]?.data ? (
                    <button onClick={() => handleGenerateQR(kelas)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700"><Plus size={12} /> Generate</button>
                  ) : (
                    <>
                      <button onClick={() => downloadQR(kelas)} className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100" title="Download PNG"><Download size={14} /></button>
                      <button onClick={() => handleToggleQR(kelas)} className={`p-1.5 rounded-md ${activeQR[kelas].active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title={activeQR[kelas].active ? 'Nonaktifkan' : 'Aktifkan'}>
                        {activeQR[kelas].active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleGenerateQR(kelas)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100" title="Regenerate"><RefreshCw size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <QrCode size={40} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada data kelas. Import data siswa terlebih dahulu.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}