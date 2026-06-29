"use client";

import { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Search, MapPin, ChevronLeft, ChevronRight, X, Loader2, Filter, Users } from 'lucide-react';
import { getAllAlumni } from '@/app/actions/alumniActions';

const statusConfig = {
  'Kuliah': { icon: '🎓', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'Bekerja': { icon: '💼', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Wirausaha': { icon: '🚀', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Kuliah dan Bekerja': { icon: '🎓💼', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  'Kursus/Pelatihan': { icon: '📚', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Mencari Kerja': { icon: '🔍', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Gap Year': { icon: '📖', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  'TNI/Polri': { icon: '🪖', color: 'bg-red-100 text-red-700 border-red-200' },
  'Lainnya': { icon: '📍', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}
const defaultStatus = { icon: '📍', color: 'bg-slate-100 text-slate-600 border-slate-200' }

function AvatarFallback({ name, size = 40 }) {
  const gradients = [
    'linear-gradient(135deg, #60a5fa, #22d3ee)',
    'linear-gradient(135deg, #c084fc, #f472b6)',
    'linear-gradient(135deg, #fbbf24, #fb923c)',
    'linear-gradient(135deg, #34d399, #2dd4bf)',
    'linear-gradient(135deg, #fb7185, #ef4444)',
    'linear-gradient(135deg, #818cf8, #8b5cf6)',
  ]
  const bg = gradients[(name || '').charCodeAt(0) % gradients.length]
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md"
      style={{ width: size, height: size, fontSize: size * 0.38, background: bg }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function getInstansi(a) {
  if (a.kuliah_nama_pt) return a.kuliah_nama_pt
  if (a.bekerja_nama_perusahaan) return a.bekerja_nama_perusahaan
  if (a.wirausaha_nama) return a.wirausaha_nama
  return '-'
}

function getKota(a) {
  return a.kuliah_kota || a.bekerja_kota || '-'
}

function getKotaProvinsi(a) {
  const kota = a.kuliah_kota || a.bekerja_kota || ''
  const prov = a.kuliah_provinsi || a.bekerja_provinsi || ''
  return kota + (prov && prov !== '-' ? ', ' + prov : '')
}

export default function AlumniPage() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [filterJurusan, setFilterJurusan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKota, setFilterKota] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Dropdown options (dari data)
  const [dropdowns, setDropdowns] = useState({ tahunLulusList: [], jurusanList: [], statusList: [], kotaList: [] })

  // Load data + dropdowns
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const res = await getAllAlumni({
        search: search || undefined,
        tahunLulus: filterTahun || undefined,
        jurusan: filterJurusan || undefined,
        status: filterStatus || undefined,
        kota: filterKota || undefined,
        page, pageSize
      })
      if (res.data) setData(res.data)
      if (res.total !== undefined) setTotal(res.total)
      setDropdowns({
        tahunLulusList: res.tahunLulusList || [],
        jurusanList: res.jurusanList || [],
        statusList: res.statusList || [],
        kotaList: res.kotaList || [],
      })
      setLoading(false)
    }
    loadData()
  }, [search, filterTahun, filterJurusan, filterStatus, filterKota, page])

  // Reset halaman saat filter berubah
  useEffect(() => { setPage(1) }, [search, filterTahun, filterJurusan, filterStatus, filterKota])

  const filteredTotal = useMemo(() => {
    return total
  }, [total])

  const totalPages = Math.ceil(filteredTotal / pageSize)
  const hasFilters = search || filterTahun || filterJurusan || filterStatus || filterKota

  const handleResetFilter = () => {
    setSearch('')
    setFilterTahun('')
    setFilterJurusan('')
    setFilterStatus('')
    setFilterKota('')
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
        <p className="text-gray-500 font-medium">Memuat data alumni...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 md:p-10 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 mb-4">
            <GraduationCap size={32} className="text-blue-200" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Semua Kisah Alumni</h1>
          <p className="text-blue-200 mt-2 text-sm md:text-base">Kisah nyata para alumni setelah lulus — sumber inspirasi bagi siswa saat ini</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Search */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama alumni, NISN, atau kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white min-w-[120px]"
            >
              <option value="">Tahun Lulus</option>
              {dropdowns.tahunLulusList.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              value={filterJurusan}
              onChange={(e) => setFilterJurusan(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white min-w-[120px]"
            >
              <option value="">Jurusan</option>
              {dropdowns.jurusanList.map(j => <option key={j}>{j}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={((e) => setFilterStatus(e.target.value))}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white min-w-[140px]"
            >
              <option value="">Status</option>
              {dropdowns.statusList.map(s => <option key={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Kota..."
              value={filterKota}
              onChange={(e) => setFilterKota(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white min-w-[120px]"
            />
            {hasFilters && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition"
              >
                ✕ Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {hasFilters && (
          <div className="text-sm text-gray-500">
            Ditemukan <span className="font-bold text-gray-800">{filteredTotal}</span> alumni dari filter
          </div>
        )}

        {/* Alumni Grid — 2 kolom di HP, 3 kolom di desktop */}
        {data.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {data.map((a) => {
              const statusStyle = statusConfig[a.status_saat_ini] || defaultStatus
              return (
                <div
                  key={a.id}
                  onClick={() => setShowDetail(a)}
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Card Header Gradient */}
                  <div className={`h-1.5 ${a.status_saat_ini === 'Kuliah' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : a.status_saat_ini === 'Bekerja' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : a.status_saat_ini === 'Wirausaha' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-gray-400 to-slate-500'}`}></div>

                  <div className="p-3 md:p-5">
                    {/* Avatar di tengah atas */}
                    <div className="flex justify-center mb-3">
                      <AvatarFallback name={a.nama} size={48} />
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h3 className="font-bold text-gray-800 text-[11px] md:text-sm truncate">{a.nama}</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 truncate">{a.jurusan} • {a.tahun_lulus}</p>
                      <div className="flex justify-center mt-1.5">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] md:text-[11px] font-bold ${statusStyle.color}`}>
                          {statusStyle.icon} {a.status_saat_ini}
                        </span>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="space-y-1 mt-3 text-[10px] md:text-xs text-gray-600">
                      <div className="flex items-start gap-1.5">
                        <span className="text-gray-400 shrink-0 w-12 md:w-14">Instansi:</span>
                        <span className="text-gray-700 font-medium truncate">{getInstansi(a)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={10} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 truncate">{getKota(a)}</span>
                      </div>
                    </div>

                    {/* Testimoni Preview — hanya tampil di desktop */}
                    {a.testimoni && (
                      <div className="hidden md:block bg-gray-50 rounded-lg p-2.5 border border-gray-100 mt-3">
                        <p className="text-gray-600 line-clamp-2 text-xs">"{a.testimoni}"</p>
                      </div>
                    )}

                    {/* Read More */}
                    <div className="mt-2 text-center">
                      <span className="text-blue-600 text-[10px] md:text-xs font-semibold group-hover:text-blue-800 transition-colors inline-flex items-center gap-0.5">
                        Baca Selengkapnya <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400 font-medium text-lg">
              {hasFilters ? 'Tidak ada alumni yang cocok dengan filter' : 'Belum ada data alumni yang dipublikasikan'}
            </p>
            {!hasFilters && (
              <p className="text-gray-400 text-sm mt-2">Admin dapat mempublikasikan kisah dari halaman <span className="text-blue-600 font-semibold">Rekap Formulir → Tab Tracer Studi</span></p>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-blue-600 text-white shadow-sm scale-110' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Footer spacer */}
        <div className="h-12"></div>
      </div>

      {/* Modal Detail — tanpa motion.div */}
      {showDetail && (
        <>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              style={{ animation: 'modalFadeIn 0.25s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white rounded-t-3xl z-10">
                <div className="flex items-center gap-4">
                  <AvatarFallback name={showDetail.nama} size={64} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{showDetail.nama}</h3>
                    <p className="text-blue-100 text-xs">{showDetail.jurusan} • Lulusan {showDetail.tahun_lulus}</p>
                  </div>
                  <button
                    onClick={() => setShowDetail(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Status & Instansi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Status Saat Ini</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig[showDetail.status_saat_ini]?.color || defaultStatus.color}`}>
                      {statusConfig[showDetail.status_saat_ini]?.icon || '📍'} {showDetail.status_saat_ini}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Instansi / Perusahaan</span>
                    <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{getInstansi(showDetail)}</p>
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Lokasi</span>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <MapPin size={12} className="inline mr-1 text-gray-400" />
                    {getKotaProvinsi(showDetail)}
                  </p>
                </div>

                {/* Detail Kuliah */}
                {showDetail.status_saat_ini === 'Kuliah' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Pendidikan</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showDetail.kuliah_nama_pt && <p><span className="text-gray-500">Kampus:</span> <span className="font-semibold text-gray-800">{showDetail.kuliah_nama_pt}</span></p>}
                      {showDetail.kuliah_prodi && <p><span className="text-gray-500">Prodi:</span> <span className="font-semibold text-gray-800">{showDetail.kuliah_prodi}</span></p>}
                      {showDetail.kuliah_jenjang && <p><span className="text-gray-500">Jenjang:</span> <span className="font-semibold text-gray-800">{showDetail.kuliah_jenjang}</span></p>}
                      {showDetail.kuliah_kota && <p><span className="text-gray-500">Kota:</span> <span className="font-semibold text-gray-800">{showDetail.kuliah_kota}</span></p>}
                      {showDetail.kuliah_provinsi && <p><span className="text-gray-500">Provinsi:</span> <span className="font-semibold text-gray-800">{showDetail.kuliah_provinsi}</span></p>}
                    </div>
                  </div>
                )}

                {/* Detail Bekerja */}
                {showDetail.status_saat_ini === 'Bekerja' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Pekerjaan</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showDetail.bekerja_nama_perusahaan && <p><span className="text-gray-500">Perusahaan:</span> <span className="font-semibold text-gray-800">{showDetail.bekerja_nama_perusahaan}</span></p>}
                      {showDetail.bekerja_jabatan && <p><span className="text-gray-500">Jabatan:</span> <span className="font-semibold text-gray-800">{showDetail.bekerja_jabatan}</span></p>}
                      {showDetail.bekerja_bidang && <p><span className="text-gray-500">Bidang:</span> <span className="font-semibold text-gray-800">{showDetail.bekerja_bidang}</span></p>}
                      {showDetail.bekerja_kota && <p><span className="text-gray-500">Kota:</span> <span className="font-semibold text-gray-800">{showDetail.bekerja_kota}</span></p>}
                      {showDetail.bekerja_provinsi && <p><span className="text-gray-500">Provinsi:</span> <span className="font-semibold text-gray-800">{showDetail.bekerja_provinsi}</span></p>}
                    </div>
                  </div>
                )}

                {/* Detail Wirausaha */}
                {showDetail.status_saat_ini === 'Wirausaha' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Usaha</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showDetail.wirausaha_nama && <p><span className="text-gray-500">Nama Usaha:</span> <span className="font-semibold text-gray-800">{showDetail.wirausaha_nama}</span></p>}
                      {showDetail.wirausaha_bidang && <p><span className="text-gray-500">Bidang:</span> <span className="font-semibold text-gray-800">{showDetail.wirausaha_bidang}</span></p>}
                    </div>
                  </div>
                )}

                {/* Testimoni Lengkap */}
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Kisah Lengkap</span>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {showDetail.testimoni || 'Tidak ada testimoni.'}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                  Dicetak dari SIPANDU — Sistem Informasi dan Penanganan Siswa Terpadu
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}