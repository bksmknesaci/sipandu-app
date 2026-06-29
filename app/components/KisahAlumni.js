"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, GraduationCap, ArrowRight, MapPin, X } from 'lucide-react'
import { getPublishedAlumni, getAlumniStats } from '@/app/actions/alumniActions'

const statusConfig = {
  'Kuliah': { icon: '🎓', color: 'bg-emerald-100 text-emerald-700' },
  'Bekerja': { icon: '💼', color: 'bg-blue-100 text-blue-700' },
  'Wirausaha': { icon: '🚀', color: 'bg-orange-100 text-orange-700' },
  'Kuliah dan Bekerja': { icon: '🎓💼', color: 'bg-teal-100 text-teal-700' },
  'Kursus/Pelatihan': { icon: '📚', color: 'bg-amber-100 text-amber-700' },
  'Mencari Kerja': { icon: '🔍', color: 'bg-yellow-100 text-yellow-700' },
  'Gap Year': { icon: '📖', color: 'bg-gray-100 text-gray-600' },
  'TNI/Polri': { icon: '🪖', color: 'bg-red-100 text-red-700' },
  'Lainnya': { icon: '📍', color: 'bg-slate-100 text-slate-600' },
}
const defaultStatus = { icon: '📍', color: 'bg-slate-100 text-slate-600' }

const statusOrder = ['Kuliah', 'Bekerja', 'Wirausaha', 'Kuliah dan Bekerja', 'Kursus/Pelatihan', 'Mencari Kerja', 'TNI/Polri', 'Gap Year', 'Lainnya']

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
}

function AvatarFallback({ name, size = 20 }) {
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
      style={{ width: size, height: size, fontSize: size * 0.4, background: bg }}
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

function truncate(text, max = 300) {
  if (!text || text.length <= max) return text
  return text.substring(0, max) + '...'
}

export default function KisahAlumni() {
  const [alumni, setAlumni] = useState([])
  const [stats, setStats] = useState({})
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0)
  const [showModal, setShowModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [dataRes, statsRes] = await Promise.all([getPublishedAlumni(), getAlumniStats()])
      if (dataRes?.data) setAlumni(dataRes.data)
      if (statsRes) setStats(statsRes)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (isPaused || alumni.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent(prev => (prev + 1) % alumni.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [isPaused, alumni.length])

  const goTo = useCallback((index) => {
    setDirection(index > current ? 1 : -1)
    setCurrent(index)
  }, [current])

  const getStatusStyle = (status) => statusConfig[status] || defaultStatus

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (alumni.length === 0) {
    return (
      <div className="py-16 text-center">
        <GraduationCap className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-400 font-medium">Belum ada kisah alumni yang dipublikasikan</p>
      </div>
    )
  }

  const sortedStats = statusOrder
    .filter(s => stats[s] > 0)
    .map(s => ({ label: s, icon: statusConfig[s]?.icon || '📍', value: stats[s], color: statusConfig[s]?.color || 'bg-slate-100 text-slate-600' }))

  const a = alumni[current]
  if (!a) return null

  return (
    <>
      <section className="relative py-16 md:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-purple-50"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 mb-4">
              <GraduationCap size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">Kisah Inspiratif Alumni</h2>
            <p className="text-gray-500 mt-3 text-sm md:text-base max-w-2xl mx-auto italic">
              Perjalanan para alumni setelah lulus sebagai inspirasi bagi generasi berikutnya.
            </p>
          </div>

          {/* Carousel */}
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative min-h-[420px] md:min-h-[400px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <div className="h-full flex items-center justify-center px-4">
                    <div className="w-full max-w-2xl">
                      <div className="bg-white/70 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl p-6 md:p-8 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                        <Quote size={36} className="text-blue-300 mb-4 opacity-60" />

                        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-5 min-h-[80px]">
                          {truncate(a.testimoni)}
                        </p>
                        {a.testimoni && a.testimoni.length > 300 && (
                          <button
                            onClick={() => setShowModal(a)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 mb-4 transition-colors"
                          >
                            Baca Selengkapnya →
                          </button>
                        )}

                        {/* Profil alumni: avatar di kiri, nama di kanan */}
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200/60">
                          <AvatarFallback name={a.nama} size={56} />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm md:text-base truncate">{a.nama}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{a.jurusan} • {a.tahun_lulus}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(a.status_saat_ini).color}`}>
                                {getStatusStyle(a.status_saat_ini).icon} {a.status_saat_ini}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                                <MapPin size={10} /> {getKota(a)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav Arrows */}
            {alumni.length > 1 && (
              <>
                <button
                  onClick={() => goTo((current - 1 + alumni.length) % alumni.length)}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full shadow-lg border border-white/50 items-center justify-center text-gray-600 hover:bg-white hover:text-blue-600 hover:scale-110 transition-all z-20"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => goTo((current + 1) % alumni.length)}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full shadow-lg border border-white/50 items-center justify-center text-gray-600 hover:bg-white hover:text-blue-600 hover:scale-110 transition-all z-20"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Dots */}
            {alumni.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {alumni.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-blue-600 scale-125' : 'bg-blue-200/60 hover:bg-blue-300'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats Mini */}
          {sortedStats.length > 0 && (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {sortedStats.map(s => (
                <div key={s.label} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl p-3 md:p-4 text-center shadow-sm">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-lg font-extrabold text-gray-800 mt-1">{s.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA Banner */}
          <div className="mt-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
            <div className="relative z-10">
              <p className="text-lg md:text-xl font-bold mb-2">✨ Jadilah Alumni Inspiratif Berikutnya</p>
              <p className="text-blue-100 text-sm md:text-base mb-4 max-w-lg mx-auto">Teruslah belajar, berkarya, dan harumkan nama sekolah di mana pun berada.</p>
              <a
                href="/alumni"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
              >
                <span>📖</span> Lihat Semua Kisah Alumni
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Baca Selengkapnya — tanpa motion.div */}
      {showModal && (
        <>
          <style>{`
            @keyframes modalFadeInHome {
              from { opacity: 0; transform: scale(0.95) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              style={{ animation: 'modalFadeInHome 0.25s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white rounded-t-3xl z-10">
                <div className="flex items-center gap-4">
                  <AvatarFallback name={showModal.nama} size={64} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{showModal.nama}</h3>
                    <p className="text-blue-100 text-xs">{showModal.jurusan} • Lulusan {showModal.tahun_lulus}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(null)}
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
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusStyle(showModal.status_saat_ini).color}`}>
                      {getStatusStyle(showModal.status_saat_ini).icon} {showModal.status_saat_ini}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Instansi / Perusahaan</span>
                    <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{getInstansi(showModal)}</p>
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Lokasi</span>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <MapPin size={12} className="inline mr-1 text-gray-400" />
                    {(() => {
                      const kota = showModal.kuliah_kota || showModal.bekerja_kota || '-'
                      const prov = showModal.kuliah_provinsi || showModal.bekerja_provinsi || '-'
                      return `${kota}${prov !== '-' ? ', ' + prov : ''}`
                    })()}
                  </p>
                </div>

                {/* Detail Kuliah */}
                {showModal.status_saat_ini === 'Kuliah' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Pendidikan</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showModal.kuliah_nama_pt && <p><span className="text-gray-500">Kampus:</span> <span className="font-semibold text-gray-800">{showModal.kuliah_nama_pt}</span></p>}
                      {showModal.kuliah_prodi && <p><span className="text-gray-500">Prodi:</span> <span className="font-semibold text-gray-800">{showModal.kuliah_prodi}</span></p>}
                      {showModal.kuliah_jenjang && <p><span className="text-gray-500">Jenjang:</span> <span className="font-semibold text-gray-800">{showModal.kuliah_jenjang}</span></p>}
                    </div>
                  </div>
                )}

                {/* Detail Bekerja */}
                {showModal.status_saat_ini === 'Bekerja' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Pekerjaan</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showModal.bekerja_nama_perusahaan && <p><span className="text-gray-500">Perusahaan:</span> <span className="font-semibold text-gray-800">{showModal.bekerja_nama_perusahaan}</span></p>}
                      {showModal.bekerja_jabatan && <p><span className="text-gray-500">Jabatan:</span> <span className="font-semibold text-gray-800">{showModal.bekerja_jabatan}</span></p>}
                      {showModal.bekerja_bidang && <p><span className="text-gray-500">Bidang:</span> <span className="font-semibold text-gray-800">{showModal.bekerja_bidang}</span></p>}
                    </div>
                  </div>
                )}

                {/* Detail Wirausaha */}
                {showModal.status_saat_ini === 'Wirausaha' && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1.5">Detail Usaha</span>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm">
                      {showModal.wirausaha_nama && <p><span className="text-gray-500">Usaha:</span> <span className="font-semibold text-gray-800">{showModal.wirausaha_nama}</span></p>}
                      {showModal.wirausaha_bidang && <p><span className="text-gray-500">Bidang:</span> <span className="font-semibold text-gray-800">{showModal.wirausaha_bidang}</span></p>}
                    </div>
                  </div>
                )}

                {/* Testimoni Lengkap */}
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1.5">Kisah Lengkap</span>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {showModal.testimoni || 'Tidak ada testimoni.'}
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
    </>
  )
}