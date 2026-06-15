"use client"

import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Star, Users, Eye, X, Download } from 'lucide-react'
import { getRekapPelanggaranStats, getRekapPelanggaranTable, getStudentDetailPelanggaran } from '@/app/actions/pelanggaranActions'

function CountUp({ end, duration = 1500 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const startTime = Date.now(); const startVal = 0
    const animate = () => {
      const elapsed = Date.now() - startTime; const progress = Math.min(elapsed / duration, 1)
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
  const [stats, setStats] = useState({ total: 0, ringan: 0, sedang: 0, berat: 0 })
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(null)
  const [detailData, setDetailData] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [statRes, tableRes] = await Promise.all([getRekapPelanggaranStats(), getRekapPelanggaranTable()])
    setStats(statRes || {}); setTableData(tableRes?.data || [])
    setLoading(false)
  }

  const openDetail = async (nisn) => {
    const res = await getStudentDetailPelanggaran(nisn); setDetailData(res); setShowDetail(nisn)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><AlertTriangle size={48}/></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">📋 Rekap Pelanggaran Siswa</h1>
          <p className="text-red-100 mt-2 text-sm md:text-base font-medium">Monitoring seluruh riwayat pelanggaran siswa dan tingkat kedisiplinan.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pelanggaran', value: stats.total, icon: AlertTriangle, color: 'from-gray-700 to-gray-800' },
          { label: 'Ringan', value: stats.ringan, icon: Users, color: 'from-green-500 to-emerald-600' },
          { label: 'Sedang', value: stats.sedang, icon: TrendingUp, color: 'from-yellow-500 to-amber-500' },
          { label: 'Berat', value: stats.berat, icon: Star, color: 'from-red-500 to-rose-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl text-white shadow-lg`}>
            <stat.icon size={24} className="opacity-80 mb-2"/>
            <p className="text-3xl font-extrabold"><CountUp end={stat.value}/></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Tabel Pelanggaran Siswa</h3>
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
              {loading ? <tr><td colSpan="9" className="text-center py-8 text-gray-400 animate-pulse">Memuat...</td></tr> :
              tableData.length === 0 ? <tr><td colSpan="9" className="text-center py-8 text-gray-400">Tidak ada data</td></tr> :
              tableData.map((s, idx) => {
                const status = getStatusDisiplin(s.total_pelanggaran)
                return (
                  <tr key={s.nisn} className="hover:bg-red-50/30">
                    <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{s.nama}<br/><span className="text-[10px] text-gray-400">{s.nisn}</span></td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{s.kelas} {s.jurusan}</td>
                    <td className="py-3 px-4 text-green-600 font-bold text-center">{s.ringan}</td>
                    <td className="py-3 px-4 text-yellow-600 font-bold text-center">{s.sedang}</td>
                    <td className="py-3 px-4 text-red-600 font-bold text-center">{s.berat}</td>
                    <td className="py-3 px-4 font-extrabold text-gray-800 text-lg text-center">{s.total_pelanggaran}</td>
                    <td className="py-3 px-4"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${status.cls}`}>{status.label}</span></td>
                    <td className="py-3 px-4"><button onClick={() => openDetail(s.nisn)} className="text-blue-500 hover:text-blue-700"><Eye size={16}/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white relative">
              <button onClick={() => setShowDetail(null)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={20}/></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/50">{detailData.siswa?.nama?.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold">{detailData.siswa?.nama}</h3>
                  <p className="text-sm opacity-90">{detailData.siswa?.kelas} {detailData.siswa?.jurusan} • Total Pelanggaran: {detailData.siswa?.total_pelanggaran} poin</p>
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
                          <p className="font-semibold text-gray-800 text-sm">⚠️ {p.jenis_pelanggaran}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {p.kategori} • oleh {p.dicatat_oleh}</p>
                          {p.kronologi && <p className="text-xs text-gray-400 mt-1 italic">"{p.kronologi}"</p>}
                        </div>
                        <div className="text-right ml-4">
                          <span className="text-red-600 font-bold text-sm">+{p.poin} poin</span>
                          {p.bukti_file && <a href={p.bukti_file} target="_blank" className="block text-blue-500 text-[10px] mt-1 hover:underline">Lihat Bukti</a>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {detailData.pelanggaran?.length === 0 && <p className="text-sm text-gray-400 ml-6">Belum ada riwayat</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scaleIn { animation: scaleIn 0.2s ease-out; }`}</style>
    </div>
  )
}