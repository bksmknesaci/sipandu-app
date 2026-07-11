"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { HeartPulse, CheckCircle, XCircle, Eye, ImageOff, AlertTriangle, X, RefreshCw, Loader2, MapPin, ExternalLink, Filter, Users, Clock, Frown, CalendarDays, FileText, Shield } from 'lucide-react'
import { getSakitIzinWaliKelas, verifySakitIzin, getKelasFilters, cleanupOldBuktiSakitIzin, getUserKelasInfo } from '@/app/actions/absensiActions'

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

const StatusBadge = ({ status }) => {
  if (status === 'MENUNGGU VERIFIKASI') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🟡 Menunggu</span>
  if (status === 'DISETUJUI') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">🟢 Disetujui</span>
  if (status === 'DITOLAK') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 Ditolak</span>
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
  const [showDetail, setShowDetail] = useState(null)
  const [toast, setToast] = useState(null)

  // Filter States
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [jurusanFilter, setJurusanFilter] = useState('')
  const [kelasJurusanList, setKelasJurusanList] = useState([])
  const [dateFilter, setDateFilter] = useState('')

  const today = new Date().toLocaleDateString('sv-SE')
  const isAdmin = user?.role === 'Administrator'

  // ── Ambil userData & auto-set filter kelas binaan WK dari DB ──
  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      if (u.role === 'Wali Kelas' && u.id) {
        const initWK = async () => {
          try {
            const dbInfo = await getUserKelasInfo(u.id)
            if (dbInfo.kelas) {
              setTingkatFilter(dbInfo.kelas.trim())
              setJurusanFilter(dbInfo.jurusan ? dbInfo.jurusan.trim() : '')
            } else {
              const parts = (u.kelas || '').trim().split(/\s+/)
              setTingkatFilter(parts[0] || '')
              setJurusanFilter(parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''))
            }
          } catch (e) {
            console.error('Gagal ambil kelas WK dari DB:', e)
            const parts = (u.kelas || '').trim().split(/\s+/)
            setTingkatFilter(parts[0] || '')
            setJurusanFilter(parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''))
          }
        }
        initWK()
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

  // Cleanup foto bukti lama (>1 hari) — berjalan silent di background
  useEffect(() => { cleanupOldBuktiSakitIzin() }, [])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    const res = await getSakitIzinWaliKelas(tingkatFilter, jurusanFilter)
    if (res.data) setData(res.data)
    setLoading(false)
  }

  useEffect(() => { if (user) fetchData() }, [user, tingkatFilter, jurusanFilter])

  // ── Filtered data: tanggal + status ──
  const filteredData = useMemo(() => {
    let result = data
    if (dateFilter) {
      result = result.filter(d => d.tanggal === dateFilter)
    }
    return result.filter(d => d.status_verifikasi === filterStatus)
  }, [data, dateFilter, filterStatus])

  // ── Statistik dari filtered data ──
  const stats = useMemo(() => ({
    total: filteredData.length,
    menunggu: filteredData.filter(d => d.status_verifikasi === 'MENUNGGU VERIFIKASI').length,
    disetujui: filteredData.filter(d => d.status_verifikasi === 'DISETUJUI').length,
    ditolak: filteredData.filter(d => d.status_verifikasi === 'DITOLAK').length,
  }), [filteredData])

  // ── Pengajuan Hari Ini (selalu dari ALL data, bukan filtered) ──
  const todayCount = useMemo(() => {
    return data.filter(d => d.tanggal === today).length
  }, [data, today])

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
    if (isAdmin) {
      setTingkatFilter('')
      setJurusanFilter('')
    }
    setDateFilter('')
  }

  const tingkatOptions = [...new Set(kelasJurusanList.map(c => c.kelas))].sort()
  const jurusanOptions = tingkatFilter
    ? [...new Set(kelasJurusanList.filter(c => c.kelas === tingkatFilter).map(c => c.jurusan))].sort()
    : [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()

  const dateFilterLabel = dateFilter
    ? new Date(dateFilter + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle size={16}/>} {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2"><HeartPulse size={28} className="text-blue-600"/> Rekap Sakit & Izin</h1>
        <button onClick={fetchData} className="p-2 bg-white rounded-xl border hover:bg-gray-50 shadow-sm"><RefreshCw size={16}/></button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg">
          <CalendarDays size={20} className="opacity-80"/>
          <p className="text-3xl font-extrabold mt-2"><CountUp end={todayCount}/></p>
          <p className="text-xs opacity-90 font-medium mt-0.5">Pengajuan Hari Ini</p>
        </div>
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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Filter size={16}/> Filter:</div>
          
          {isAdmin ? (
            <>
              <select value={tingkatFilter} onChange={e => { setTingkatFilter(e.target.value); setJurusanFilter('') }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[120px]">
                <option value="">Semua Tingkat</option>
                {tingkatOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={jurusanFilter} onChange={e => setJurusanFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800 min-w-[150px]">
                <option value="">Semua Jurusan</option>
                {jurusanOptions.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              <button onClick={handleResetFilter} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5">
                <RefreshCw size={12}/> Reset Filter
              </button>
            </>
          ) : (
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">{tingkatFilter} {jurusanFilter}</span>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} className="text-blue-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-800"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                title="Tampilkan semua tanggal"
              >
                Semua Tanggal
              </button>
            )}
          </div>

          <div className="ml-auto flex gap-2">
            {['MENUNGGU VERIFIKASI', 'DISETUJUI', 'DITOLAK'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filterStatus === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === 'MENUNGGU VERIFIKASI' ? 'Menunggu' : s === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
              </button>
            ))}
          </div>
        </div>
        {dateFilterLabel && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg w-fit">
            <CalendarDays size={12} />
            <span className="font-semibold">Filter Tanggal:</span> {dateFilterLabel}
            <span className="text-gray-400">— {filteredData.length} data ditemukan</span>
          </div>
        )}
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
                  <tr><td colSpan="8" className="text-center py-10 text-gray-400">
                    {dateFilter ? 'Tidak ada data untuk tanggal tersebut' : 'Tidak ada data'}
                  </td></tr>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowDetail(d)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title="Lihat Detail"
                          >
                            <Eye size={14}/>
                          </button>
                          {d.status_verifikasi === 'MENUNGGU VERIFIKASI' && (
                            <>
                              <button onClick={() => handleVerify(d.id, 'DISETUJUI', d.nisn, d.tanggal, d.jenis_absensi)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">Setujui</button>
                              <button onClick={() => setShowRejectModal(d)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600">Tolak</button>
                            </>
                          )}
                          {d.status_verifikasi === 'DITOLAK' && d.catatan_wali_kelas && (
                            <p className="text-xs text-red-500 italic max-w-[150px] truncate" title={d.catatan_wali_kelas}>Alasan: {d.catatan_wali_kelas}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
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

      {/* Modal Detail Siswa */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button onClick={() => setShowDetail(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition"><X size={20}/></button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/50 shrink-0">
                  {showDetail.nama_siswa?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{showDetail.nama_siswa}</h3>
                  <p className="text-sm opacity-90">{showDetail.nisn} • {showDetail.kelas} {showDetail.jurusan}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Jenis Absensi</p>
                  <p className={`text-sm font-bold mt-0.5 ${showDetail.jenis_absensi === 'Sakit' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {showDetail.jenis_absensi === 'Sakit' ? '🤒' : '📋'} {showDetail.jenis_absensi}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Status Verifikasi</p>
                  <div className="mt-1"><StatusBadge status={showDetail.status_verifikasi} /></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tanggal</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {new Date(showDetail.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Waktu Pengajuan</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{showDetail.jam} WIB</p>
                </div>
              </div>

              {/* Alasan */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><FileText size={14}/> Alasan Pengajuan</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border leading-relaxed">{showDetail.alasan || '—'}</p>
              </div>

              {/* Foto Bukti */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><Eye size={14}/> Foto Bukti</h4>
                {showDetail.foto_bukti ? (
                  <img
                    src={showDetail.foto_bukti}
                    alt="Bukti"
                    onClick={() => setViewImage(showDetail.foto_bukti)}
                    className="w-full max-h-64 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border text-gray-400">
                    <ImageOff size={32}/>
                    <p className="text-xs mt-2">Tidak ada foto bukti</p>
                  </div>
                )}
              </div>

              {/* Lokasi GPS */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><MapPin size={14}/> Lokasi GPS</h4>
                {showDetail.latitude && showDetail.longitude ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Latitude</span>
                      <span className="font-mono font-bold text-gray-800">{showDetail.latitude}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Longitude</span>
                      <span className="font-mono font-bold text-gray-800">{showDetail.longitude}</span>
                    </div>
                    {showDetail.akurasi_gps && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Akurasi GPS</span>
                        <span className="font-bold text-gray-800">{showDetail.akurasi_gps} meter</span>
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${showDetail.latitude},${showDetail.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <ExternalLink size={14}/> Buka di Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded-xl border">Tidak ada data lokasi GPS</p>
                )}
              </div>

              {/* Catatan Wali Kelas (jika ditolak) */}
              {showDetail.catatan_wali_kelas && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><Shield size={14}/> Catatan Wali Kelas</h4>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-700">{showDetail.catatan_wali_kelas}</p>
                    {showDetail.waktu_verifikasi && (
                      <p className="text-[10px] text-red-400 mt-2">
                        Ditolak pada: {new Date(showDetail.waktu_verifikasi).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info verifikasi */}
              {showDetail.waktu_verifikasi && showDetail.status_verifikasi !== 'MENUNGGU VERIFIKASI' && (
                <p className="text-[10px] text-gray-400 text-right">
                  Diverifikasi pada: {new Date(showDetail.waktu_verifikasi).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}