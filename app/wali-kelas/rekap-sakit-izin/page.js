"use client"

import React, { useState, useEffect } from 'react'
import { HeartPulse, CheckCircle, XCircle, Eye, ImageOff, AlertTriangle, X, RefreshCw, Loader2, MapPin, ExternalLink, Filter, Users, Clock, Frown } from 'lucide-react'
import { getSakitIzinWaliKelas, verifySakitIzin, getKelasFilters, cleanupOldBuktiSakitIzin } from '@/app/actions/absensiActions'

function CountUp({ end, duration = 800 }) {
  const [count, setCount] = useState(0)
  const prevEnd = React.useRef(0)
  useEffect(() => {
    const startVal = prevEnd.current; const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startVal + (end - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate); prevEnd.current = end
  }, [end, duration])
  return <span>{count}</span>
}

export default function RekapSakitIzinWali() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('MENUNGGU VERIFIKASI')
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [processing, setProcessing] = useState(false)
  const [viewImage, setViewImage] = useState(null)
  const [toast, setToast] = useState(null)

  // Filter States
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [jurusanFilter, setJurusanFilter] = useState('')
  const [kelasJurusanList, setKelasJurusanList] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      if (u.role === 'Wali Kelas' && u.kelas) {
        const parts = u.kelas.trim().split(/\s+/)
        setTingkatFilter(parts[0] || '')
        setJurusanFilter(parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''))
      }
    }
  }, [])

  useEffect(() => {
    const fetchFilters = async () => {
      const res = await getKelasFilters()
      if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList)
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    const fetchFilters = async () => {
      const res = await getKelasFilters()
      if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList)
    }
    fetchFilters()
  }, [])

  // Cleanup foto bukti lama (>1 hari) — berjalan silent di background
  useEffect(() => {
    cleanupOldBuktiSakitIzin()
  }, [])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    const res = await getSakitIzinWaliKelas(tingkatFilter, jurusanFilter)
    if (res.data) setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user, tingkatFilter, jurusanFilter])

  const handleVerify = async (id, status, nisn, tanggal, jenisAbsensi) => {
    if (status === 'DITOLAK' && !catatan) {
      setToast({ type: 'error', message: 'Wajib mengisi alasan penolakan!' })
      return
    }
    setProcessing(true)
    const res = await verifySakitIzin(id, status, status === 'DITOLAK' ? catatan : '', user.id, nisn, tanggal, jenisAbsensi)
    if (res.success) {
      setToast({ type: 'success', message: `Absensi berhasil ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}!` })
      setShowRejectModal(null)
      setCatatan('')
      fetchData()
    } else {
      setToast({ type: 'error', message: res.error || 'Gagal memproses' })
    }
    setProcessing(false)
  }

  const handleResetFilter = () => {
    if (user?.role === 'Administrator') {
      setTingkatFilter('')
      setJurusanFilter('')
    }
  }

  const filteredData = data.filter(d => d.status_verifikasi === filterStatus)

  const stats = {
    total: data.length,
    menunggu: data.filter(d => d.status_verifikasi === 'MENUNGGU VERIFIKASI').length,
    disetujui: data.filter(d => d.status_verifikasi === 'DISETUJUI').length,
    ditolak: data.filter(d => d.status_verifikasi === 'DITOLAK').length,
  }

  const StatusBadge = ({ status }) => {
    if (status === 'MENUNGGU VERIFIKASI') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🟡 Menunggu</span>
    if (status === 'DISETUJUI') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">🟢 Disetujui</span>
    if (status === 'DITOLAK') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 Ditolak</span>
  }

  const isAdmin = user?.role === 'Administrator'

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2"><HeartPulse size={28} className="text-blue-600"/> Rekap Sakit & Izin</h1>
        <button onClick={fetchData} className="p-2 bg-white rounded-xl border hover:bg-gray-50 shadow-sm"><RefreshCw size={16}/></button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengajuan', value: stats.total, icon: Users, gradient: 'from-slate-500 to-slate-600' },
          { label: 'Menunggu Verifikasi', value: stats.menunggu, icon: Clock, gradient: 'from-amber-500 to-amber-600' },
          { label: 'Disetujui', value: stats.disetujui, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'Ditolak', value: stats.ditolak, icon: Frown, gradient: 'from-red-500 to-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl text-white shadow-lg`}>
            <stat.icon size={20} className="opacity-80"/>
            <p className="text-3xl font-extrabold mt-2"><CountUp end={stat.value}/></p>
            <p className="text-xs opacity-90 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Filter size={16}/> Filter Kelas:</div>
        
        {isAdmin ? (
          <>
            <select value={tingkatFilter} onChange={e => { setTingkatFilter(e.target.value); setJurusanFilter('') }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[120px]">
              <option value="">Semua Tingkat</option>
              {['X', 'XI', 'XII'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={jurusanFilter} onChange={e => setJurusanFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]">
              <option value="">Semua Jurusan</option>
              {(() => {
  const opts = tingkatFilter
    ? [...new Set(kelasJurusanList.filter(c => c.kelas === tingkatFilter).map(c => c.jurusan))].sort()
    : [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()
  return opts.map(j => <option key={j} value={j}>{j}</option>)
})()}
            </select>
            
            {/* Tombol Reset Filter */}
            <button onClick={handleResetFilter} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5">
              <RefreshCw size={12}/> Reset Filter
            </button>
          </>
        ) : (
          <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">{tingkatFilter} {jurusanFilter}</span>
        )}

        <div className="ml-auto flex gap-2">
          {['MENUNGGU VERIFIKASI', 'DISETUJUI', 'DITOLAK'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filterStatus === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'MENUNGGU VERIFIKASI' ? 'Menunggu' : s === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div> : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Tanggal</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Nama Siswa</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Jenis</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Alasan</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Bukti</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Lokasi Peta</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Status</th>
                  <th className="py-3 px-4 font-bold text-xs text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
                ) : (
                  filteredData.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-medium text-nowrap">{new Date(d.tanggal).toLocaleDateString('id-ID')} <span className="text-xs text-gray-400">{d.jam}</span></td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{d.nama_siswa}</p>
                        <p className="text-xs text-gray-500">{d.kelas} {d.jurusan}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.jenis_absensi === 'Sakit' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {d.jenis_absensi}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{d.alasan}</td>
                      <td className="py-3 px-4">
                        {d.foto_bukti ? (
                          <button onClick={() => setViewImage(d.foto_bukti)} className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1"><Eye size={12}/> Lihat</button>
                        ) : (
                          <span className="text-gray-400 text-xs flex items-center gap-1"><ImageOff size={12}/> Kosong</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {d.latitude && d.longitude ? (
                          <a href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-xs font-semibold flex items-center gap-1">
                            <MapPin size={12}/> Lihat Peta <ExternalLink size={10}/>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={12}/> Tidak ada</span>
                        )}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={d.status_verifikasi} /></td>
                      <td className="py-3 px-4">
                        {d.status_verifikasi === 'MENUNGGU VERIFIKASI' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(d.id, 'DISETUJUI', d.nisn, d.tanggal, d.jenis_absensi)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">Setujui</button>
                            <button onClick={() => setShowRejectModal(d)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600">Tolak</button>
                          </div>
                        )}
                        {d.status_verifikasi === 'DITOLAK' && d.catatan_wali_kelas && (
                          <p className="text-xs text-red-500 italic max-w-[150px] truncate" title={d.catatan_wali_kelas}>Alasan: {d.catatan_wali_kelas}</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tolak (Teks Hitam) */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Tolak Pengajuan</h3>
            <p className="text-sm text-gray-600 mb-4">Siswa akan otomatis diubah menjadi <span className="font-bold text-red-500">ALPHA</span> di Rekap Kehadiran. Wajib isi alasan penolakan.</p>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-sm text-gray-800 placeholder:text-gray-400" placeholder="Tulis alasan penolakan..."></textarea>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Batal</button>
              <button onClick={() => handleVerify(showRejectModal.id, 'DITOLAK', showRejectModal.nisn, showRejectModal.tanggal, showRejectModal.jenis_absensi)} disabled={processing} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {processing ? '⏳ Memproses...' : 'Tolak & Jadikan Alpha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Gambar */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="relative max-w-lg w-full">
            <button onClick={() => setViewImage(null)} className="absolute -top-4 -right-4 bg-white text-gray-800 p-2 rounded-full shadow-lg z-10"><X size={20}/></button>
            <img src={viewImage} alt="Bukti" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}