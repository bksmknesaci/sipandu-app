"use client"

import React, { useState, useEffect } from 'react'
import {
  Building2, MapPin, Clock, Calendar, User, Briefcase,
  ExternalLink, CheckCircle, XCircle, AlertTriangle, Coffee, Loader2
} from 'lucide-react'
import { getPklStudentProfile } from '@/app/actions/pklActions'

const PKL_STATUS_STYLE = {
  'Belum Mulai': { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  'Berjalan': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  'Selesai': { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
}

const ATT_STYLE = {
  'Hadir': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  'Terlambat': { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  'Sakit': { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Coffee },
  'Izin': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Coffee },
  'Alpha': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  'Libur': { bg: 'bg-gray-100', text: 'text-gray-500', icon: Calendar },
}

function fmtDate(s) {
  if (!s) return '-'
  return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(s) { return s ? s.substring(0, 5) : '-' }

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-sky-600 font-medium">{label}</div>
        <div className="text-xs text-gray-800 font-medium break-words">{value}</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-2.5 text-center`}>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}

export default function PklInfoSection({ studentId, onPklDetected }) {
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) { setLoading(false); return }
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      const res = await getPklStudentProfile({ studentId })
      if (cancelled) return
      setProfile(res.profile)
      setAttendance(res.attendance || [])
      if (onPklDetected) onPklDetected(res.isPkl)
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [studentId])

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100">
          <div className="h-4 bg-sky-100 rounded w-36 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-sky-100 rounded-lg" />)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="h-4 bg-gray-100 rounded w-48 mb-3" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  // Bukan siswa PKL — tidak render apa-apa
  if (!profile) return null

  const today = new Date().toLocaleDateString('sv-SE')
  const todayAtt = attendance.find(a => a.attendance_date === today)

  // Stats bulan ini
  const monthStr = today.substring(0, 7)
  const mAtt = attendance.filter(a => a.attendance_date.startsWith(monthStr))
  const st = {
    hadir: mAtt.filter(a => a.status === 'Hadir').length,
    terlambat: mAtt.filter(a => a.status === 'Terlambat').length,
    sakit: mAtt.filter(a => a.status === 'Sakit').length,
    izin: mAtt.filter(a => a.status === 'Izin').length,
    alpha: mAtt.filter(a => a.status === 'Alpha').length,
    libur: mAtt.filter(a => a.status === 'Libur').length,
  }
  const totalRec = st.hadir + st.terlambat + st.sakit + st.izin + st.alpha
  const pct = totalRec > 0 ? Math.round(((st.hadir + st.terlambat) / totalRec) * 100) : 0

  const sc = PKL_STATUS_STYLE[profile.status] || PKL_STATUS_STYLE['Belum Mulai']
  const SIcon = sc.icon
  const mapsUrl = profile.latitude && profile.longitude
    ? `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`
    : null

  return (
    <div className="space-y-4">
      {/* ── Profil PKL ── */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-5 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Briefcase size={16} className="text-white" />
          </div>
          <h3 className="font-bold text-sky-800 text-sm">Profil PKL</h3>
          <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
            <SIcon size={11} /> {profile.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
          <InfoRow icon={Building2} label="Perusahaan" value={profile.company_name} />
          <InfoRow icon={MapPin} label="Alamat PKL" value={profile.company_address} />
          <InfoRow icon={User} label="Pembimbing Industri" value={profile.industry_supervisor} />
          <InfoRow icon={User} label="Guru Pembimbing" value={profile.guru_pembimbing} />
          <InfoRow icon={Calendar} label="Periode PKL" value={`${fmtDate(profile.start_date)} — ${fmtDate(profile.end_date)}`} />
          <InfoRow icon={Clock} label="Jam Kerja" value={`${fmtTime(profile.work_start_time)} — ${fmtTime(profile.work_end_time)}`} />
          <InfoRow icon={Calendar} label="Hari Kerja" value={(profile.work_days || []).join(', ')} />
          {mapsUrl && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-sky-500 flex-shrink-0" />
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1 font-medium">
                Lihat Lokasi di Google Maps <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Status Hari Ini ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h4 className="text-xs font-bold text-gray-500 mb-3">Status Kehadiran PKL Hari Ini</h4>
        {todayAtt ? (
          <div className="flex flex-wrap items-center gap-3">
            {(() => {
              const ac = ATT_STYLE[todayAtt.status] || ATT_STYLE['Alpha']
              const AI = ac.icon
              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${ac.bg} ${ac.text}`}>
                  <AI size={13} /> {todayAtt.status}
                </span>
              )
            })()}
            {todayAtt.check_in_time && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Masuk {todayAtt.check_in_time}
              </span>
            )}
            {todayAtt.check_out_time && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Pulang {todayAtt.check_out_time}
              </span>
            )}
            {todayAtt.is_late && (
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} /> Terlambat
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={14} />
            <span className="text-xs">Belum ada absensi PKL hari ini</span>
          </div>
        )}
      </div>

      {/* ── Statistik Bulanan ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h4 className="text-xs font-bold text-gray-500 mb-3">
          Kehadiran PKL — {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <MiniStat label="Hadir" value={st.hadir} color="text-emerald-600" bg="bg-emerald-50" />
          <MiniStat label="Terlambat" value={st.terlambat} color="text-amber-600" bg="bg-amber-50" />
          <MiniStat label="Sakit" value={st.sakit} color="text-yellow-600" bg="bg-yellow-50" />
          <MiniStat label="Izin" value={st.izin} color="text-blue-600" bg="bg-blue-50" />
          <MiniStat label="Alpha" value={st.alpha} color="text-red-600" bg="bg-red-50" />
          <MiniStat label="Libur" value={st.libur} color="text-gray-500" bg="bg-gray-50" />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Persentase Kehadiran PKL</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-sm font-bold text-indigo-600 w-10 text-right">{pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Riwayat Absensi PKL ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h4 className="text-xs font-bold text-gray-500 mb-3">Riwayat Absensi PKL Terakhir</h4>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {attendance.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat absensi PKL</p>
          ) : attendance.slice(0, 20).map(a => {
            const ac = ATT_STYLE[a.status] || ATT_STYLE['Alpha']
            const AI = ac.icon
            return (
              <div key={a.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${ac.bg} ${ac.text} flex-shrink-0`}>
                    <AI size={13} />
                  </span>
                  <div>
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(a.attendance_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    {a.is_late && <span className="ml-2 text-[10px] text-amber-600 font-semibold">Terlambat</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-shrink-0">
                  {a.check_in_time && <span className="hidden sm:inline">Masuk {a.check_in_time}</span>}
                  {a.check_out_time && <span className="hidden sm:inline">Pulang {a.check_out_time}</span>}
                  {a.note && <span className="italic text-gray-400 truncate max-w-[120px]">{a.note}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}