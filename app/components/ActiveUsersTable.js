"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Users, Monitor, Clock, Loader2 } from 'lucide-react'
import { getActiveSessions } from '@/app/actions/userActions'

const ROLE_STYLES = {
  'Administrator': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '🛡️' },
  'Wali Kelas': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👨‍🏫' },
  'Sekretaris Kelas': { bg: 'bg-teal-100', text: 'text-teal-700', icon: '📋' },
  'OSIS': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⭐' },
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-fuchsia-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

function getGradient(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function formatTime(isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam ${mins % 60} menit`
  return `${Math.floor(hours / 24)} hari`
}

export default function ActiveUsersTable() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await getActiveSessions()
      if (res.error) throw res.error
      setSessions(res.data || [])
      setError(null)
    } catch (e) {
      console.error('getActiveSessions error:', e)
      setError(e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 60000) // refresh setiap 60 detik
    return () => clearInterval(interval)
  }, [fetchSessions])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-200">
            <Monitor size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Pengguna Aktif</h3>
            <p className="text-[11px] text-gray-400">Login real-time · update 60 detik</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {loading ? '...' : `${sessions.length} online`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchSessions} className="mt-2 text-xs text-blue-600 hover:underline">Coba lagi</button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <Users size={36} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Belum ada pengguna aktif</p>
            <p className="text-xs text-gray-300 mt-0.5">Data akan muncul saat user lain login</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[40px]">No</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pengguna</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peran</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Login</th>
                  <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => {
                  const roleStyle = ROLE_STYLES[s.user_role] || ROLE_STYLES['OSIS']
                  const initials = getInitials(s.user_name)
                  const gradient = getGradient(s.user_name)
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                              {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{s.user_name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 truncate">ID: {s.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                          <span className="text-[10px]">{roleStyle.icon}</span>
                          {s.user_role || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={12} className="text-gray-300" />
                          <span className="font-medium tabular-nums">{formatTime(s.logged_in_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-gray-400 font-medium">{formatDuration(s.last_active)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {!loading && sessions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              💡 Session otomatis dihapus setelah 2 menit tidak aktif
            </p>
            <button
              onClick={fetchSessions}
              className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Loader2 size={10} className={loading ? 'animate-spin' : 'hidden'} />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}