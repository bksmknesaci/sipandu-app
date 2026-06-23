"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, TrendingUp, Star, Users, Eye, X, Search, Filter, RefreshCw, FileText, Trash2 } from 'lucide-react'
import { getRekapPelanggaranStats, getRekapPelanggaranTable, getStudentDetailPelanggaran, deleteAllPelanggaran } from '@/app/actions/pelanggaranActions'
import { getKelasFilters } from '@/app/actions/absensiActions'

function CountUp({ end, duration = 1500 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const startTime = Date.now()
    const startVal = 0
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(startVal + (end - startVal) * progress))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])
  return <span>{count}</span>
}

const getStatusDisiplin = (poin) => {
  if (poin > 20) return { label: 'Prioritas Pembinaan', cls: 'bg-red-100 text-red-700' }
  if (poin >= 11) return { label: 'Pengawasan Khusus', cls: 'bg-orange-100 text-orange-700' }
  if (poin >= 6) return { label: 'Perlu Pembinaan', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Sangat Baik', cls: 'bg-green-100 text-green-700' }
}

export default function RekapPelanggaran() {
  const [rawStats, setRawStats] = useState({ total: 0, ringan: 0, sedang: 0, berat: 0 })
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Filter States
  const [tingkatFilter, setTingkatFilter] = useState('')
  const [jurusanFilter, setJurusanFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [kelasJurusanList, setKelasJurusanList] = useState([])

  // Fetch kelas jurusan untuk filter dropdown
  useEffect(() => {
    const fetchFilters = async () => {
      const res = await getKelasFilters()
      if (res.kelasJurusanList) setKelasJurusanList(res.kelasJurusanList)
    }
    fetchFilters()
  }, [])

  // Fetch data utama
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [statRes, tableRes] = await Promise.all([
      getRekapPelanggaranStats(),
      getRekapPelanggaranTable()
    ])
    setRawStats(statRes || {})
    setTableData(tableRes?.data || [])
    setLoading(false)
  }

  // Derived: opsi dropdown dari database
  const tingkatOptions = useMemo(() => {
    return [...new Set(kelasJurusanList.map(c => c.kelas))].sort()
  }, [kelasJurusanList])

  const jurusanOptions = useMemo(() => {
    if (tingkatFilter) {
      return [...new Set(kelasJurusanList.filter(c => c.kelas === tingkatFilter).map(c => c.jurusan))].sort()
    }
    return [...new Set(kelasJurusanList.map(c => c.jurusan))].sort()
  }, [kelasJurusanList, tingkatFilter])

  // Filter & search
  const filteredData = useMemo(() => {
    let result = tableData
    if (tingkatFilter) {
      result = result.filter(s => s.kelas === tingkatFilter)
    }
    if (jurusanFilter) {
      result = result.filter(s => s.jurusan === jurusanFilter)
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      result = result.filter(s =>
        s.nama?.toLowerCase().includes(q) ||
        s.nisn?.toLowerCase().includes(q) ||
        (s.kelas + ' ' + s.jurusan).toLowerCase().includes(q)
      )
    }
    return result
  }, [tableData, tingkatFilter, jurusanFilter, searchTerm])

  // Hitung ulang stats dari data terfilter
  const stats = useMemo(() => {
    if (!tingkatFilter && !jurusanFilter && !searchTerm.trim()) return rawStats
    return {
      total: filteredData.reduce((s, d) => s + (d.total_pelanggaran || 0), 0),
      ringan: filteredData.reduce((s, d) => s + (d.ringan || 0), 0),
      sedang: filteredData.reduce((s, d) => s + (d.sedang || 0), 0),
      berat: filteredData.reduce((s, d) => s + (d.berat || 0), 0),
    }
  }, [filteredData, rawStats, tingkatFilter, jurusanFilter, searchTerm])

  const handleResetFilter = () => {
    setTingkatFilter('')
    setJurusanFilter('')
    setSearchTerm('')
  }

  const openDetail = async (nisn) => {
    const res = await getStudentDetailPelanggaran(nisn)
    setDetailData(res)
    setShowDetail(nisn)
  }

  const isFiltered = !!(tingkatFilter || jurusanFilter || searchTerm.trim())

  // ── Print PDF per Tingkat Semua Jurusan ──
  const handlePrintPDF = () => {
    const dataToPrint = tingkatFilter
      ? tableData.filter(s => s.kelas === tingkatFilter)
      : tableData

    if (dataToPrint.length === 0) {
      alert('Tidak ada data untuk dicetak')
      return
    }

    // Group by jurusan
    const grouped = {}
    dataToPrint.forEach(s => {
      const key = s.jurusan || 'Lainnya'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(s)
    })
    const sortedJurusan = Object.keys(grouped).sort()

    const no = { color: '#1f2937' }

    const sectionsHtml = sortedJurusan.map(jurusan => {
      const list = grouped[jurusan].sort((a, b) => (b.total_pelanggaran || 0) - (a.total_pelanggaran || 0))
      const totalPoin = list.reduce((s, d) => s + (d.total_pelanggaran || 0), 0)
      return (
        '<div style="margin-bottom:24px;">' +
          '<h4 style="font-size:13px;font-weight:bold;color:#1e40af;margin-bottom:8px;border-bottom:2px solid #1e40af;padding-bottom:4px;">' +
            'Jurusan ' + jurusan + ' (' + list.length + ' siswa, Total: ' + totalPoin + ' poin)' +
          '</h4>' +
          '<table style="width:100%;border-collapse:collapse;font-size:11px;">' +
            '<thead><tr style="background:#f3f4f6;">' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:30px;">No</th>' +
              '<th style="border:1px solid #000;padding:5px;">Nama Siswa</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:30px;">L/P</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:40px;">Ringan</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:40px;">Sedang</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:40px;">Berat</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:40px;">Total</th>' +
              '<th style="border:1px solid #000;padding:5px;text-align:center;width:100px;">Status</th>' +
            '</tr></thead>' +
            '<tbody>' +
              list.map((s, idx) => {
                const st = getStatusDisiplin(s.total_pelanggaran)
                return (
                  '<tr>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;color:#6b7280;">' + (idx + 1) + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;font-weight:600;">' + s.nama + '<br/><span style="font-size:9px;color:#9ca3af;">' + (s.nisn || '') + '</span></td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;">' + (s.jenis_kelamin || '-') + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;color:#16a34a;font-weight:bold;">' + (s.ringan || 0) + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;color:#ca8a04;font-weight:bold;">' + (s.sedang || 0) + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;color:#dc2626;font-weight:bold;">' + (s.berat || 0) + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;font-weight:800;font-size:13px;">' + (s.total_pelanggaran || 0) + '</td>' +
                    '<td style="border:1px solid #ddd;padding:4px;text-align:center;"><span style="font-size:9px;padding:2px 6px;border-radius:99px;font-weight:bold;' +
                      (st.cls === 'bg-red-100 text-red-700' ? 'background:#fee2e2;color:#b91c1c;' :
                       st.cls === 'bg-orange-100 text-orange-700' ? 'background:#ffedd5;color:#c2410c;' :
                       st.cls === 'bg-yellow-100 text-yellow-700' ? 'background:#fef9c3;color:#a16207;' :
                       'background:#dcfce7;color:#15803d;') + '">' + st.label + '</span></td>' +
                  '</tr>'
                )
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>'
      )
    }).join('')

    const grandTotal = dataToPrint.reduce((s, d) => s + (d.total_pelanggaran || 0), 0)

    const w = window.open('', '_blank')
    w.document.write(
      '<html><head><title>Rekap Pelanggaran - ' + (tingkatFilter || 'Semua Tingkat') + '</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:20px;margin:0;font-size:12px;} table{width:100%;} @media print{body{margin:0;}}</style>' +
      '</head><body>' +
        '<div style="text-align:center;margin-bottom:16px;">' +
          '<h2 style="margin:0;font-size:16px;">REKAP PELANGGARAN SISWA</h2>' +
          '<p style="margin:4px 0 0 0;font-size:13px;font-weight:bold;">Tingkat: ' + (tingkatFilter || 'Semua Tingkat') + ' — Semua Jurusan</p>' +
          '<p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">Total: ' + dataToPrint.length + ' siswa, ' + grandTotal + ' poin pelanggaran</p>' +
        '</div>' +
        '<hr style="border:1px solid #000;margin-bottom:16px;">' +
        sectionsHtml +
        '<div style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#9ca3af;text-align:center;">' +
          'Dicetak pada: ' + new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
          ' | SIPANDU - Sistem Informasi dan Penanganan Siswa Terpadu' +
        '</div>' +
      '</body></html>'
    )
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  // ── Hapus Semua ──
  const handleDeleteAll = async () => {
    if (!confirm('PERHATIAN!\nSemua data pelanggaran akan dihapus permanen.\nLanjutkan?')) return
    const konfirmasi = prompt('Ketik "HAPUS SEMUA" untuk konfirmasi:')
    if (konfirmasi !== 'HAPUS SEMUA') {
      alert('Penghapusan dibatalkan.')
      return
    }
    setDeleting(true)
    const res = await deleteAllPelanggaran()
    if (res.error) {
      alert('Gagal menghapus: ' + res.error)
    } else {
      alert('Semua data pelanggaran berhasil dihapus!')
      fetchData()
    }
    setDeleting(false)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30">
          <AlertTriangle size={48} />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Rekap Pelanggaran Siswa</h1>
          <p className="text-red-100 mt-2 text-sm md:text-base font-medium">Monitoring seluruh riwayat pelanggaran siswa dan tingkat kedisiplinan.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pelanggaran', value: stats.total, icon: AlertTriangle, color: 'from-gray-700 to-gray-800' },
          { label: 'Ringan', value: stats.ringan, icon: Users, color: 'from-green-500 to-emerald-600' },
          { label: 'Sedang', value: stats.sedang, icon: TrendingUp, color: 'from-yellow-500 to-amber-500' },
          { label: 'Berat', value: stats.berat, icon: Star, color: 'from-red-500 to-rose-600' },
        ].map((stat, idx) => (
          <div key={idx} className={"bg-gradient-to-br " + stat.color + " p-5 rounded-2xl text-white shadow-lg"}>
            <stat.icon size={24} className="opacity-80 mb-2" />
            <p className="text-3xl font-extrabold"><CountUp end={stat.value} /></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={16} /> Filter:
          </div>

          <select
            value={tingkatFilter}
            onChange={e => { setTingkatFilter(e.target.value); setJurusanFilter('') }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-800 min-w-[120px]"
          >
            <option value="">Semua Tingkat</option>
            {tingkatOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={jurusanFilter}
            onChange={e => setJurusanFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-800 min-w-[150px]"
          >
            <option value="">Semua Jurusan</option>
            {jurusanOptions.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau kelas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-gray-800"
            />
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilter}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
            >
              <RefreshCw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b flex flex-wrap justify-between items-center gap-3">
          <h3 className="font-bold text-gray-700">
            Tabel Pelanggaran Siswa
            {isFiltered && (
              <span className="ml-2 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                {filteredData.length} dari {tableData.length} siswa
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 transition border border-red-200"
            >
              <FileText size={14} /> PDF Per Tingkat
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-gray-50 rounded-xl border hover:bg-gray-100 transition"
              title="Refresh Data"
            >
              <RefreshCw size={14} className="text-gray-500" />
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-800 transition shadow-sm disabled:opacity-50"
            >
              <Trash2 size={14} /> {deleting ? 'Menghapus...' : 'Hapus Semua'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Rank</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Nama</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Kelas</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Ringan</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Sedang</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Berat</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Total</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Status</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400 animate-pulse">Memuat...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    {isFiltered ? 'Tidak ada data yang cocok dengan filter' : 'Tidak ada data'}
                  </td>
                </tr>
              ) : (
                filteredData.map((s, idx) => {
                  const status = getStatusDisiplin(s.total_pelanggaran)
                  return (
                    <tr key={s.nisn} className="hover:bg-red-50/30">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {s.nama}
                        <br />
                        <span className="text-[10px] text-gray-400">{s.nisn}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{s.kelas} {s.jurusan}</td>
                      <td className="py-3 px-4 text-green-600 font-bold text-center">{s.ringan}</td>
                      <td className="py-3 px-4 text-yellow-600 font-bold text-center">{s.sedang}</td>
                      <td className="py-3 px-4 text-red-600 font-bold text-center">{s.berat}</td>
                      <td className="py-3 px-4 font-extrabold text-gray-800 text-lg text-center">{s.total_pelanggaran}</td>
                      <td className="py-3 px-4">
                        <span className={"text-[10px] px-2 py-1 rounded-full font-bold " + status.cls}>{status.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => openDetail(s.nisn)} className="text-blue-500 hover:text-blue-700">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white relative">
              <button onClick={() => setShowDetail(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/50">
                  {detailData.siswa?.nama?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{detailData.siswa?.nama}</h3>
                  <p className="text-sm opacity-90">{detailData.siswa?.kelas} {detailData.siswa?.jurusan} - Total Pelanggaran: {detailData.siswa?.total_pelanggaran} poin</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-gray-700 mb-4">Timeline Pelanggaran</h4>
              <div className="space-y-4 relative border-l-2 border-red-100 ml-3">
                {(detailData.pelanggaran || []).map(p => (
                  <div key={p.id} className="ml-6 relative">
                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{'\u26A0\uFE0F'} {p.jenis_pelanggaran}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} {'\u2022'} {p.kategori} {'\u2022'} oleh {p.dicatat_oleh}
                          </p>
                          {p.kronologi && (
                            <p className="text-xs text-gray-400 mt-1 italic">"{p.kronologi}"</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="text-red-600 font-bold text-sm">+{p.poin} poin</span>
                          {p.bukti_file && (
                            <a href={p.bukti_file} target="_blank" rel="noopener noreferrer" className="block text-blue-500 text-[10px] mt-1 hover:underline">Lihat Bukti</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {detailData.pelanggaran?.length === 0 && (
                  <p className="text-sm text-gray-400 ml-6">Belum ada riwayat</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}