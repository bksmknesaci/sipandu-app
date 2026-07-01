'use client'
import { useState, useEffect } from 'react'
import {
  getWhatsAppConfig, saveWhatsAppConfig, testWhatsAppConnection,
  getWhatsAppLogs, retryWhatsAppLog, deleteAllWALogs
} from '@/app/actions/whatsappActions'
import {
  MessageCircle, Wifi, WifiOff, Save, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, RotateCcw,
  Settings, Send, Shield, Clock, Trash2, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'config', label: 'Konfigurasi API', icon: Settings },
  { key: 'sending', label: 'Pengaturan Pengiriman', icon: Send },
  { key: 'riwayat', label: 'Riwayat Pengiriman', icon: Clock },
]

export default function KonfigurasiWhatsApp() {
  const [activeTab, setActiveTab] = useState('config')
  const [loading, setLoading] = useState(true)

  // Config state
  const [config, setConfig] = useState({
    api_token_masked: '', device_id: '', sender_name: '', mode: 'testing',
    is_connected: false, gateway_phone: '', device_name: '', last_sync_at: null,
    send_alpha: true, send_terlambat: false, send_pulang_awal: false,
  })
  const [formToken, setFormToken] = useState('')
  const [formDeviceId, setFormDeviceId] = useState('')
  const [formSenderName, setFormSenderName] = useState('')
  const [formMode, setFormMode] = useState('testing')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // Sending state
  const [sendAlpha, setSendAlpha] = useState(true)
  const [sendTerlambat, setSendTerlambat] = useState(false)
  const [sendPulangAwal, setSendPulangAwal] = useState(false)
  const [savingSending, setSavingSending] = useState(false)

  // Riwayat state
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilterStatus, setLogFilterStatus] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [retryingId, setRetryingId] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deleteAllText, setDeleteAllText] = useState('')
  const [deletingAll, setDeletingAll] = useState(false)

  const fetchConfig = async () => {
    setLoading(true)
    const res = await getWhatsAppConfig()
    if (!res.error) {
      setConfig(res)
      setFormToken(res.api_token_masked)
      setFormDeviceId(res.device_id)
      setFormSenderName(res.sender_name)
      setFormMode(res.mode)
      setSendAlpha(res.send_alpha)
      setSendTerlambat(res.send_terlambat)
      setSendPulangAwal(res.send_pulang_awal)
    }
    setLoading(false)
  }

  useEffect(() => { fetchConfig() }, [])
  useEffect(() => { if (activeTab === 'riwayat') fetchLogs() }, [activeTab, logsPage, logFilterStatus])

  const fetchLogs = async () => {
    setLogsLoading(true)
    const res = await getWhatsAppLogs({
      page: logsPage, limit: 15, status: logFilterStatus, search: logSearch || undefined,
    })
    if (!res.error) { setLogs(res.data); setLogsTotal(res.total) }
    setLogsLoading(false)
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    const res = await saveWhatsAppConfig({
      api_token: formToken, device_id: formDeviceId,
      sender_name: formSenderName, mode: formMode,
    })
    if (res.error) toast.error(res.error)
    else { toast.success('Konfigurasi berhasil disimpan'); fetchConfig() }
    setSaving(false)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    const res = await testWhatsAppConnection()
    if (res.success) toast.success(res.message || 'API berhasil terhubung')
    else toast.error(res.error || 'Gagal terhubung')
    fetchConfig()
    setTesting(false)
  }

  const handleSaveSending = async () => {
    setSavingSending(true)
    const res = await saveWhatsAppConfig({
      api_token: formToken, send_alpha: sendAlpha,
      send_terlambat: sendTerlambat, send_pulang_awal: sendPulangAwal,
    })
    if (res.error) toast.error(res.error)
    else toast.success('Pengaturan pengiriman disimpan')
    setSavingSending(false)
  }

  const handleRetry = async (logId) => {
    setRetryingId(logId)
    const res = await retryWhatsAppLog(logId)
    if (res.success) toast.success('Pengiriman ulang berhasil')
    else toast.error(res.error || 'Gagal mengirim ulang')
    setRetryingId(null)
    fetchLogs()
  }

  const handleDeleteAllLogs = async () => {
    setDeletingAll(true)
    const res = await deleteAllWALogs()
    if (res.error) {
      toast.error('Gagal menghapus: ' + res.error)
    } else {
      toast.success('Semua riwayat berhasil dihapus')
      setShowDeleteAllModal(false)
      setDeleteAllText('')
      setLogsPage(1)
      fetchLogs()
    }
    setDeletingAll(false)
  }

  const handleSearchLogs = (e) => {
    e.preventDefault()
    setLogsPage(1)
    fetchLogs()
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <MessageCircle className="text-green-600" /> Konfigurasi WhatsApp
        </h1>
        <p className="text-sm text-gray-500 mt-1">Hubungkan SIPANDU dengan Fonnte API untuk notifikasi otomatis ke orang tua siswa.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1.5 rounded-xl shadow-sm border w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: KONFIGURASI API ═══ */}
      {activeTab === 'config' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Card */}
          <div className={`p-6 rounded-2xl border-2 ${config.is_connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${config.is_connected ? 'bg-green-100' : 'bg-red-100'}`}>
                {config.is_connected ? <Wifi className="text-green-600" /> : <WifiOff className="text-red-500" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${config.is_connected ? 'text-green-800' : 'text-red-800'}`}>
                  {config.is_connected ? '🟢 Terhubung' : '🔴 Belum Terhubung'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                  <div><p className="text-[10px] text-gray-500 uppercase font-bold">Status API</p><p className="text-sm font-semibold text-gray-800">{config.is_connected ? 'Aktif' : 'Tidak Aktif'}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase font-bold">Nomor Gateway</p><p className="text-sm font-semibold text-gray-800">{config.gateway_phone || '—'}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase font-bold">Nama Device</p><p className="text-sm font-semibold text-gray-800">{config.device_name || '—'}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase font-bold">Terakhir Sinkron</p><p className="text-sm font-semibold text-gray-800">{config.last_sync_at ? new Date(config.last_sync_at).toLocaleString('id-ID') : '—'}</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Config Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={18} /> Konfigurasi API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Fonnte API Token</label>
                <input type="password" value={formToken} onChange={e => setFormToken(e.target.value)}
                  placeholder="Masukkan token Fonnte API..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800 font-mono" />
                <p className="text-[10px] text-gray-400 mt-1">Token disimpan terenkripsi di server dan tidak pernah ditampilkan lengkap di frontend.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Device ID <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input type="text" value={formDeviceId} onChange={e => setFormDeviceId(e.target.value)}
                  placeholder="Contoh: device_abc123"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nama Pengirim</label>
                <input type="text" value={formSenderName} onChange={e => setFormSenderName(e.target.value)}
                  placeholder="Contoh: SIPANDU"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Mode</label>
                <select value={formMode} onChange={e => setFormMode(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800 bg-white">
                  <option value="testing">Testing</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleTestConnection} disabled={testing}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition disabled:opacity-50">
                <RefreshCw size={16} className={testing ? 'animate-spin' : ''} /> {testing ? 'Menguji...' : '🔗 Uji Koneksi'}
              </button>
              <button onClick={handleSaveConfig} disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 shadow-lg shadow-green-500/25">
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: PENGATURAN PENGIRIMAN ═══ */}
      {activeTab === 'sending' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Send size={18} /> Pengaturan Pengiriman Otomatis</h3>
            <p className="text-sm text-gray-500">Atur kapan notifikasi WhatsApp otomatis dikirim ke orang tua siswa melalui proses Finalisasi Absensi.</p>

            <div className="space-y-4">
              {[
                { key: 'alpha', label: 'Kirim otomatis ke Orang Tua siswa Alpha', desc: 'Notifikasi dikirim saat absensi difinalisasi dan siswa berstatus Alpha', state: sendAlpha, setter: setSendAlpha, default: true },
                { key: 'terlambat', label: 'Kirim otomatis ke Orang Tua siswa Terlambat', desc: 'Fitur ini akan tersedia di pengembangan selanjutnya', state: sendTerlambat, setter: setSendTerlambat, default: false, disabled: true },
                { key: 'pulang', label: 'Kirim otomatis ke Orang Tua siswa Pulang sebelum waktunya', desc: 'Fitur ini akan tersedia di pengembangan selanjutnya', state: sendPulangAwal, setter: setSendPulangAwal, default: false, disabled: true },
              ].map(item => (
                <div key={item.key} className={`flex items-start gap-4 p-4 rounded-xl border ${item.state ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} ${item.disabled ? 'opacity-60' : ''}`}>
                  <button onClick={() => !item.disabled && item.setter(!item.state)}
                    className={`mt-0.5 w-11 h-6 rounded-full relative transition-colors shrink-0 ${item.state ? 'bg-green-500' : 'bg-gray-300'} ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.state ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    {item.disabled && <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">Segera Hadir</span>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveSending} disabled={savingSending}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 shadow-lg shadow-green-500/25">
              <Save size={16} /> {savingSending ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TAB: RIWAYAT PENGIRIMAN ═══ */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-3 items-center">
              <form onSubmit={handleSearchLogs} className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Cari nama/nomor..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800" />
              </form>
              <select value={logFilterStatus} onChange={e => { setLogFilterStatus(e.target.value); setLogsPage(1) }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800 bg-white">
                <option value="all">Semua Status</option>
                <option value="success">Berhasil</option>
                <option value="failed">Gagal</option>
                <option value="pending">Menunggu</option>
              </select>
              <button onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                <Trash2 size={16} /> Hapus Semua Riwayat
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Siswa</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">Kelas</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">No WA</th>
                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase">Pesan Error</th>
                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={7} className="py-4"><div className="h-4 bg-gray-100 rounded" /></td></tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Belum ada riwayat pengiriman</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 font-medium text-gray-800 text-xs">{log.siswa_nama}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{log.siswa_kelas} {log.siswa_jurusan}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">{log.phone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' :
                          log.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {log.status === 'success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {log.status === 'success' ? 'Berhasil' : log.status === 'failed' ? 'Gagal' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-red-500 max-w-[200px] truncate">{log.response || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        {log.status === 'failed' && (
                          <button onClick={() => handleRetry(log.id)} disabled={retryingId === log.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition disabled:opacity-50">
                            <RotateCcw size={10} className={retryingId === log.id ? 'animate-spin' : ''} /> Kirim Ulang
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logsTotal > 15 && (
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <span className="text-xs text-gray-500">Halaman {logsPage} dari {Math.ceil(logsTotal / 15)}</span>
                <div className="flex gap-2">
                  <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}
                    className="p-2 bg-white border rounded-lg text-gray-700 hover:bg-green-600 hover:text-white disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14}/></button>
                  <button onClick={() => setLogsPage(p => Math.min(Math.ceil(logsTotal / 15), p + 1))} disabled={logsPage >= Math.ceil(logsTotal / 15)}
                    className="p-2 bg-white border rounded-lg text-gray-700 hover:bg-green-600 hover:text-white disabled:opacity-40 transition shadow-sm"><ChevronRight size={14}/></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL HAPUS SEMUA RIWAYAT ═══ */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4" onClick={() => { setShowDeleteAllModal(false); setDeleteAllText('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center"><Trash2 size={24} className="text-red-500" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Hapus Semua Riwayat?</h3>
                  <p className="text-sm text-gray-500">Semua data riwayat pengiriman WhatsApp akan dihapus secara permanen.</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                <p className="text-sm text-red-700">Tindakan ini <strong>TIDAK dapat dibatalkan</strong>. Pastikan Anda sudah membackup data yang diperlukan.</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ketik <span className="text-red-600 font-bold tracking-wider">HAPUS SEMUA</span> untuk konfirmasi</label>
                <input type="text" value={deleteAllText} onChange={e => setDeleteAllText(e.target.value)} placeholder="HAPUS SEMUA"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-800 text-sm text-center font-bold tracking-widest" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteAllModal(false); setDeleteAllText('') }}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleDeleteAllLogs} disabled={deleteAllText !== 'HAPUS SEMUA' || deletingAll}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {deletingAll ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16}/> Hapus Semua</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </div>
  )
}