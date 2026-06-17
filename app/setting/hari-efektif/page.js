'use client'
import { useState, useEffect, useRef } from 'react'
import { getEffectiveDaysStats, getHolidays, saveHoliday, deleteHoliday, getAcademicCalendar, saveAcademicCalendar, getActivityLogs, resetAllEffectiveDays } from '@/app/actions/effectiveDaysActions'
import { CalendarDays, Landmark, School, CalendarX, Save, Trash2, Pencil, Plus, Upload, Download, History, CalendarRange, ListChecks, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

export default function HariEfektifPage() {
  const [stats, setStats] = useState({ totalEfektif: 0, totalLiburNasional: 0, totalLiburSekolah: 0, totalNonEfektif: 0 })
  const [holidays, setHolidays] = useState([])
  const [calendars, setCalendars] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('libur')
  
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Semua')
  const fileInputRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    const [s, h, c, l] = await Promise.all([getEffectiveDaysStats(), getHolidays(), getAcademicCalendar(), getActivityLogs()])
    setStats(s)
    setHolidays(h || [])
    setCalendars(c || [])
    setLogs(l || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveHoliday = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    if (editingHoliday) formData.append('id', editingHoliday.id)
    
    const res = await saveHoliday(formData)
    if (res.error) Swal.fire('Error!', res.error, 'error')
    else {
      toast.success('Data libur berhasil disimpan!')
      setEditingHoliday(null)
      fetchData()
      e.target.reset()
    }
  }

  const handleDeleteHoliday = (id) => {
    Swal.fire({
      title: 'Yakin ingin menghapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33'
    }).then(async (res) => {
      if (res.isConfirmed) {
        await deleteHoliday(id)
        toast.success('Data libur dihapus!')
        fetchData()
      }
    })
  }

  const handleResetAll = () => {
    Swal.fire({
      title: 'Hapus Semua Data Libur?',
      text: "Seluruh data hari libur manual akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus Semua!'
    }).then(async (res) => {
      if (res.isConfirmed) {
        const result = await resetAllEffectiveDays()
        if (result.error) Swal.fire('Error!', result.error, 'error')
        else {
          toast.success('Semua data hari libur berhasil dihapus!')
          fetchData()
        }
      }
    })
  }

  const handleSaveCalendar = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    if (editingCalendar) formData.append('id', editingCalendar.id)
    
    const res = await saveAcademicCalendar(formData)
    if (res.error) Swal.fire('Error!', res.error, 'error')
    else {
      toast.success('Kalender pendidikan disimpan!')
      setEditingCalendar(null)
      fetchData()
    }
  }

  const handleDownloadTemplate = () => {
    const csv = "Tanggal,Nama Libur,Kategori,Keterangan\n2026-08-17,HUT RI,Nasional,Libur Nasional\n2026-12-25,Natal,Nasional,Libur Nasional\n2026-06-22,Class Meeting,Sekolah,Kegiatan Sekolah"
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = "Template_Hari_Efektif.csv"
    link.click()
  }

  const handleImportCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split('\n').filter(l => l.trim() !== '')
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim())
        if (cols.length >= 3) {
          const formData = new FormData()
          formData.append('date', cols[0])
          formData.append('holiday_name', cols[1])
          formData.append('category', cols[2])
          formData.append('description', cols[3] || '')
          const res = await saveHoliday(formData)
          if (res.success) successCount++
          else errorCount++
        }
      }
      toast.success(`Import selesai! ${successCount} berhasil, ${errorCount} gagal.`)
      fetchData()
    }
    reader.readAsText(file)
    e.target.value = '' 
  }

  const filteredHolidays = holidays.filter(h => 
    (filterCat === 'Semua' || h.category === filterCat) &&
    (h.holiday_name.toLowerCase().includes(search.toLowerCase()) || h.date.includes(search))
  )

  const isWeekend = (dateStr) => {
    const day = new Date(dateStr).getDay()
    return day === 0 || day === 6
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="text-blue-600" /> Manajemen Hari Efektif
          </h1>
          <p className="text-gray-800 mt-1 font-medium">Kelola kalender akademik, hari efektif pembelajaran, dan hari libur sekolah.</p>
        </div>
        <button onClick={handleResetAll} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm">
          <Trash2 size={16} /> Hapus Semua Data
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Hari Efektif', value: stats.totalEfektif, color: 'bg-green-500', icon: <ListChecks /> },
          { label: 'Libur Nasional', value: stats.totalLiburNasional, color: 'bg-red-500', icon: <Landmark /> },
          { label: 'Libur Sekolah', value: stats.totalLiburSekolah, color: 'bg-yellow-500', icon: <School /> },
          { label: 'Total Hari Non-Efektif', value: stats.totalNonEfektif, color: 'bg-gray-500', icon: <CalendarX /> }
        ].map((card, i) => (
          <div key={i} className={`${card.color} text-white p-5 rounded-xl shadow-lg flex items-center justify-between`}>
            <div>
              <p className="text-sm opacity-90">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{loading ? '...' : card.value}</p>
            </div>
            <div className="opacity-50 text-4xl">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2 border-b mb-6 overflow-x-auto">
          {[
            { id: 'libur', label: 'Hari Libur Manual', icon: <ListChecks size={16} /> },
            { id: 'kalender', label: 'Kalender Pendidikan', icon: <CalendarRange size={16} /> },
            { id: 'preview', label: 'Preview Kalender', icon: <CalendarDays size={16} /> },
            { id: 'riwayat', label: 'Riwayat Aktivitas', icon: <History size={16} /> }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-800 hover:bg-gray-50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: HARI LIBUR MANUAL */}
        {activeTab === 'libur' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editingHoliday ? <Pencil size={18} /> : <Plus size={18} />} {editingHoliday ? 'Edit Libur' : 'Tambah Libur'}
              </h3>
              <form onSubmit={handleSaveHoliday} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-800">Tanggal</label>
                  <input type="date" name="date" required defaultValue={editingHoliday?.date} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-800">Nama Libur</label>
                  <input type="text" name="holiday_name" required defaultValue={editingHoliday?.holiday_name} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" placeholder="cth: HUT RI" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-800">Kategori</label>
                  <select name="category" required defaultValue={editingHoliday?.category || 'Nasional'} className="w-full mt-1 p-2 border rounded-lg bg-white text-black">
                    <option>Nasional</option><option>Sekolah</option><option>Semester</option><option>Ujian</option><option>Kegiatan Sekolah</option><option>Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-800">Keterangan</label>
                  <textarea name="description" rows="2" defaultValue={editingHoliday?.description} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" placeholder="Opsional..."></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"><Save size={16} /> Simpan</button>
                {editingHoliday && <button type="button" onClick={() => setEditingHoliday(null)} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg">Batal</button>}
              </form>
              
              <div className="mt-6 border-t pt-4">
                <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleImportCSV} />
                <button onClick={handleDownloadTemplate} className="w-full bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg flex items-center justify-center gap-2 mb-2 hover:bg-green-100"><Download size={16} /> Download Template CSV</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-orange-50 text-orange-700 border border-orange-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-100"><Upload size={16} /> Import CSV Massal</button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex justify-between mb-4">
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="p-2 border rounded-lg text-sm text-black bg-white">
                  <option>Semua</option><option>Nasional</option><option>Sekolah</option><option>Semester</option><option>Ujian</option>
                </select>
                <input type="text" placeholder="Cari libur..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 border rounded-lg text-sm w-40 text-black bg-white" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-gray-800 font-bold">Tanggal</th>
                      <th className="p-3 text-gray-800 font-bold">Nama Libur</th>
                      <th className="p-3 text-gray-800 font-bold">Kategori</th>
                      <th className="p-3 text-gray-800 font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHolidays.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-3 text-black font-medium">{new Date(h.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
                        <td className="p-3 font-bold text-black">{h.holiday_name}</td>
                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${h.category === 'Nasional' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.category}</span></td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => setEditingHoliday(h)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KALENDER PENDIDIKAN */}
        {activeTab === 'kalender' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-gray-800 mb-4">Setup Kalender Aktif</h3>
              <form onSubmit={handleSaveCalendar} className="space-y-3">
                <input type="hidden" name="id" value={editingCalendar?.id || ''} />
                <div>
                  <label className="text-xs font-semibold text-gray-800">Tahun Pelajaran</label>
                  <input type="text" name="school_year" required defaultValue={editingCalendar?.school_year || '2026/2027'} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-800">Semester</label>
                  <select name="semester" required defaultValue={editingCalendar?.semester || 'Ganjil'} className="w-full mt-1 p-2 border rounded-lg bg-white text-black">
                    <option>Ganjil</option><option>Genap</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-semibold text-gray-800">Mulai</label><input type="date" name="start_date" defaultValue={editingCalendar?.start_date} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" /></div>
                  <div><label className="text-xs font-semibold text-gray-800">Selesai</label><input type="date" name="end_date" defaultValue={editingCalendar?.end_date} className="w-full mt-1 p-2 border rounded-lg bg-white text-black" /></div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked={editingCalendar?.is_active || !editingCalendar} className="w-4 h-4" />
                  <label htmlFor="is_active" className="text-sm text-gray-800 font-medium">Jadikan Kalender Aktif</label>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"><Save size={16} /> Simpan Kalender</button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-4">Daftar Kalender</h3>
              <div className="space-y-3">
                {calendars.map(c => (
                  <div key={c.id} className={`p-4 rounded-lg border flex justify-between items-center ${c.is_active ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                    <div>
                      <p className="font-bold text-black">{c.school_year} - Semester {c.semester} {c.is_active && <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">AKTIF</span>}</p>
                      <p className="text-xs text-gray-800 mt-1">{c.start_date ? new Date(c.start_date).toLocaleDateString('id-ID') : '-'} s/d {c.end_date ? new Date(c.end_date).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <button onClick={() => setEditingCalendar(c)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Pencil size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PREVIEW KALENDER */}
        {activeTab === 'preview' && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Preview Kalender Bulan Ini</h3>
              <div className="flex gap-3 text-xs font-medium text-gray-800">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200 rounded"></div> Efektif</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-200 rounded"></div> Libur Nasional</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-200 rounded"></div> Libur Sekolah</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded"></div> Sabtu/Minggu</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d} className="text-center font-bold text-xs text-gray-800 pb-2">{d}</div>)}
              {Array.from({length: 35}, (_, i) => {
                const today = new Date()
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                const startDay = startOfMonth.getDay()
                const dateObj = new Date(today.getFullYear(), today.getMonth(), i - startDay + 1)
                const dateStr = dateObj.toISOString().split('T')[0]
                
                const isWeekendDay = dateObj.getDay() === 0 || dateObj.getDay() === 6
                const holiday = holidays.find(h => h.date === dateStr)
                
                let bgColor = 'bg-white border-gray-100'
                if (isWeekendDay) bgColor = 'bg-gray-200 border-gray-300 text-gray-800'
                if (holiday) {
                  bgColor = holiday.category === 'Nasional' ? 'bg-red-200 border-red-300' : 'bg-yellow-200 border-yellow-300'
                }
                if (dateObj.getMonth() !== today.getMonth()) bgColor = 'opacity-0 pointer-events-none'
                
                return (
                  <div key={i} className={`p-2 border rounded-lg min-h-[80px] ${bgColor}`}>
                    <p className="text-xs font-bold text-gray-800">{dateObj.getDate()}</p>
                    {holiday && <p className="text-[10px] mt-1 text-black font-bold truncate">{holiday.holiday_name}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT AKTIVITAS */}
        {activeTab === 'riwayat' && (
          <div className="space-y-3">
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs font-medium border border-blue-100 mb-4">
              ℹ️ <b>Riwayat Aktivitas (Audit Trail)</b> berfungsi untuk melacak siapa, kapan, dan perubahan apa yang dilakukan oleh Admin terkait pengaturan kalender akademik sekolah.
            </div>
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><History size={18} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-black">{log.activity}</p>
                  <p className="text-xs text-gray-800">
                    Oleh: Administrator • {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-gray-800 py-8">Belum ada riwayat aktivitas.</p>}
          </div>
        )}
      </div>
    </div>
  )
}