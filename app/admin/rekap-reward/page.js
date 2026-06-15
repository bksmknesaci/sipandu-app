"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  Trophy, Star, TrendingUp, Users, Filter, X, Download, Trash2, Eye, GraduationCap, AlertTriangle 
} from 'lucide-react'

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts'

import { 
  getRekapRewardStats, getChartData, getRekapRewardTable, 
  getStudentDetailReward, deleteRewardAction, getTopRewardStudents 
} from '@/app/actions/rewardActions'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const rankThemes = [
  { color: '#D4AF37', bg: '#FFF9E5', ring: '#F7E7A0' },
  { color: '#A2A2A2', bg: '#F5F5F5', ring: '#D1D5DB' },
  { color: '#CD7F32', bg: '#FFF0E5', ring: '#E8C8A8' },
]

const getStatusBadge = (poin) => {
  if (poin > 150) return { label: 'Utama', cls: 'bg-yellow-100 text-yellow-700' }
  if (poin >= 126) return { label: 'Madya', cls: 'bg-green-100 text-green-700' }
  if (poin >= 100) return { label: 'Pertama', cls: 'bg-blue-100 text-blue-700' }
  return { label: 'Belum Berprestasi', cls: 'bg-gray-100 text-gray-600' }
}

function CountUp({ end, duration = 1500 }) {
  const [count, setCount] = useState(0)
  const prevEnd = useRef(0)
  
  useEffect(() => {
    const startTime = Date.now()
    const startVal = prevEnd.current
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(startVal + (end - startVal) * progress))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevEnd.current = end
  }, [end, duration])
  
  return <span>{count}</span>
}

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-700">{label}</p>
        <p className="text-blue-600 font-semibold">Poin: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

const CustomTooltipPie = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-700">{payload[0].name}</p>
        <p className="text-emerald-600 font-semibold">Total Poin: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

const CustomTooltipLine = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-sm">
        <p className="font-bold text-gray-700">{label}</p>
        <p className="text-emerald-600 font-semibold">Poin: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function RekapRewardAdmin() {
  const [stats, setStats] = useState({ totalSiswaDapatReward: 0, totalPoinSekolah: 0, siswaBerprestasi: 0, entriBulanIni: 0 })
  const [chartData, setChartData] = useState({ chartKelas: [], chartJurusan: [], chartBulan: [] })
  const [tableData, setTableData] = useState([])
  const [top3, setTop3] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ kelas: '', jurusan: '' })
  
  const [showDetail, setShowDetail] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statRes, chartRes, tableRes, topRes] = await Promise.all([
        getRekapRewardStats(), 
        getChartData(), 
        getRekapRewardTable(filters), 
        getTopRewardStudents()
      ])
      
      setStats(statRes || {})
      setChartData(chartRes || {})
      setTableData(tableRes?.data || [])
      setTop3((topRes?.data || []).map((s, i) => ({ ...s, rank: i+1, theme: rankThemes[i] || rankThemes[2] })))
    } catch (error) {
      console.error("Gagal memuat data rekap reward:", error)
    }
    setLoading(false)
  }

  const openDetail = async (nisn) => {
    try {
      const res = await getStudentDetailReward(nisn)
      setDetailData(res)
      setShowDetail(nisn)
    } catch (err) {
      console.error("Gagal memuat detail:", err)
    }
  }

  const handleDelete = async (id, nisn, poin) => {
    const res = await deleteRewardAction(id, nisn, poin)
    if (res.error) alert(res.error)
    setShowDeleteConfirm(null)
    fetchData()
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><Trophy size={48}/></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">🏆 Rekapitulasi Poin Reward</h1>
          <p className="text-blue-100 mt-2 text-sm md:text-base font-medium">Menampilkan seluruh perolehan reward siswa dan ranking penghargaan siswa secara realtime.</p>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Siswa Dapat Reward', value: stats.totalSiswaDapatReward || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Poin Sekolah', value: stats.totalPoinSekolah || 0, icon: Star, color: 'from-amber-500 to-yellow-500' },
          { label: 'Siswa Berprestasi', value: stats.siswaBerprestasi || 0, icon: Trophy, color: 'from-green-500 to-emerald-600' },
          { label: 'Entri Bulan Ini', value: stats.entriBulanIni || 0, icon: TrendingUp, color: 'from-purple-500 to-indigo-600' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl text-white shadow-lg`}>
            <stat.icon size={24} className="opacity-80 mb-2"/>
            <p className="text-3xl font-extrabold"><CountUp end={stat.value}/></p>
            <p className="text-xs opacity-90 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* PODIUM TOP 3 */}
      {top3.length > 0 && (
        <div className="bg-[#FFFBF5] p-6 md:p-10 rounded-2xl border border-gray-300/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">⭐ Tiga Besar Peraih Poin Reward Tertinggi</h2>
            <div className="flex-grow h-1 bg-orange-500 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3.map((siswa) => {
              const percentage = Math.min(((siswa.total_reward || 0) / 150) * 100, 100);
              const deg = (percentage / 100) * 360;
              return (
                <div key={siswa.nisn} className="group bg-white border-2 rounded-xl p-6 flex flex-col items-center relative hover:scale-[1.03] hover:shadow-xl transition-all duration-300" style={{ borderColor: siswa.theme.color }}>
                  <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-10" style={{ backgroundColor: siswa.theme.color }}>{siswa.rank}</div>
                  <div className="animate-float mb-4 mt-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ borderColor: siswa.theme.ring, backgroundColor: siswa.theme.bg }}>
                      <GraduationCap size={32} style={{ color: siswa.theme.color }} />
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-800 text-center text-sm leading-tight">{siswa.nama}</h4>
                  <p className="text-xs text-gray-500 mb-1">{siswa.kelas} {siswa.jurusan}</p>
                  <p className="text-[10px] text-gray-400 font-mono mb-4">{siswa.nisn || '—'}</p>
                  <div className="relative w-28 h-28 mb-5 group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-full animate-spin-slow">
                      <div className="w-full h-full rounded-full shadow-sm" style={{ background: `conic-gradient(${siswa.theme.color} ${deg}deg, #E5E7EB ${deg}deg 360deg)` }}></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                      <p className="text-xl font-bold text-gray-800">{siswa.total_reward || 0}</p>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wider">POIN</p>
                    </div>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full text-center">{getStatusBadge(siswa.total_reward).label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FILTER & GRAFIK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><Filter size={18} className="text-blue-500"/> Filter Data</h3>
          <div className="space-y-3">
            <input type="text" placeholder="Kelas (contoh: XII)" value={filters.kelas} onChange={e => setFilters(p=>({...p, kelas: e.target.value}))} className="w-full p-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"/>
            <input type="text" placeholder="Jurusan (contoh: RPL 1)" value={filters.jurusan} onChange={e => setFilters(p=>({...p, jurusan: e.target.value}))} className="w-full p-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"/>
            <div className="flex gap-2">
              <button onClick={() => setFilters({ kelas: '', jurusan: '' })} className="flex-1 px-3 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">🔄 Reset</button>
              <button onClick={fetchData} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">📊 Tampilkan</button>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {mounted ? (
            <>
              {/* GRAFIK REWARD PER KELAS */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Reward Per Kelas
                </h4>
                <div className="h-56 w-full">
                  {(chartData.chartKelas || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.chartKelas || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280'}} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280'}} />
                        <Tooltip content={<CustomTooltipBar />} />
                        <Bar dataKey="poin" fill="url(#blueGradient)" radius={[6,6,0,0]} />
                        <defs>
                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data reward per kelas</div>
                  )}
                </div>
              </div>

              {/* GRAFIK REWARD PER JURUSAN (PIE) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  Reward Per Jurusan
                </h4>
                <div className="h-56 w-full">
                  {(chartData.chartJurusan || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartData.chartJurusan || []} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={75} 
                          innerRadius={40}
                          paddingAngle={3}
                          label={({name, percent}) => `${name} (${(percent*100).toFixed(0)}%)`}
                        >
                          {(chartData.chartJurusan || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltipPie />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data reward per jurusan</div>
                  )}
                </div>
              </div>

              {/* GRAFIK PERKEMBANGAN REWARD BULANAN */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  Perkembangan Reward Bulanan
                </h4>
                <div className="h-64 w-full">
                  {(chartData.chartBulan || []).some(d => d.poin > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.chartBulan || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} />
                        <YAxis tick={{fontSize: 11, fill: '#6b7280'}} />
                        <Tooltip content={<CustomTooltipLine />} />
                        <Line 
                          type="monotone" 
                          dataKey="poin" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{r:5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                          activeDot={{r:8, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                        />
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data perkembangan reward bulanan</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gray-100 h-64 rounded-2xl animate-pulse"></div>
               <div className="bg-gray-100 h-64 rounded-2xl animate-pulse"></div>
               <div className="md:col-span-2 bg-gray-100 h-64 rounded-2xl animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* TABEL UTAMA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Rekap Data Siswa Berpoint</h3>
          <div className="flex gap-2 text-xs">
            <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 flex items-center gap-1"><Download size={12}/> PDF</button>
            <button className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 flex items-center gap-1"><Download size={12}/> Excel</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Rank</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">NISN</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Nama Siswa</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Kelas</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Total Poin</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Kategori</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Reward Terakhir</th>
                <th className="py-3 px-4 font-bold text-gray-600 text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400 animate-pulse">Memuat data...</td></tr>
              ) : tableData.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">Belum ada siswa yang memiliki poin reward</td></tr>
              ) : (
                tableData.map((siswa, idx) => {
                  const status = getStatusBadge(siswa.total_reward)
                  return (
                    <tr key={siswa.nisn || idx} className="hover:bg-blue-50/30">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{siswa.nisn || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{siswa.nama}</td>
                      <td className="py-3 px-4 text-gray-600">{siswa.kelas} {siswa.jurusan}</td>
                      <td className="py-3 px-4 font-extrabold text-blue-600 text-lg">{siswa.total_reward}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${status.cls}`}>{status.label}</span></td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-[150px] truncate">{siswa.last_reward_nama}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => openDetail(siswa.nisn)} className="text-blue-500 hover:text-blue-700" title="Detail"><Eye size={16}/></button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button onClick={() => setShowDetail(null)} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={20}/></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/50">{detailData.siswa?.nama?.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold">{detailData.siswa?.nama}</h3>
                  <p className="text-sm opacity-90">NISN: {detailData.siswa?.nisn || '—'} • {detailData.siswa?.kelas} {detailData.siswa?.jurusan} • Total: {detailData.siswa?.total_reward} Poin</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-gray-700 mb-4">Riwayat Timeline Reward</h4>
              <div className="space-y-4 relative border-l-2 border-gray-100 ml-3">
                {(detailData.rewards || []).map(r => (
                  <div key={r.id} className="ml-6 relative">
                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">🏆 {r.reward_nama}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • oleh {r.diberikan_oleh}</p>
                        {r.catatan && <p className="text-xs text-gray-400 mt-1 italic">"{r.catatan}"</p>}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-green-600 font-bold">+{r.reward_poin} poin</span>
                        <button onClick={() => { setShowDetail(null); setShowDeleteConfirm(r); }} className="text-red-400 hover:text-red-600" title="Hapus Reward"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {detailData.rewards?.length === 0 && <p className="text-sm text-gray-400 ml-6">Belum ada riwayat</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scaleIn p-6 text-center" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={40}/>
            <h3 className="font-bold text-lg text-gray-800">Hapus Reward?</h3>
            <p className="text-sm text-gray-500 mt-2">Poin siswa akan otomatis dikurangi sebesar <span className="font-bold text-red-500">{showDeleteConfirm.reward_poin} poin</span>.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.nisn, showDeleteConfirm.reward_poin)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      `}</style>
    </div>
  )
}