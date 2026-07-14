"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AlertTriangle, Search, X, CheckCircle, Loader2, User } from 'lucide-react'
import { searchStudentsForPelanggaran, getKategoriPelanggaran, savePelanggaranAction } from '@/app/actions/pelanggaranActions'

const getStatusDisiplin = (poin) => {
  if (poin > 20) return { label: 'Prioritas Pembinaan', cls: 'bg-red-100 text-red-700' }
  if (poin >= 11) return { label: 'Pengawasan Khusus', cls: 'bg-orange-100 text-orange-700' }
  if (poin >= 6) return { label: 'Perlu Pembinaan', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Sangat Baik', cls: 'bg-green-100 text-green-700' }
}

export default function EntriPelanggaran({ userData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  const [kategoriList, setKategoriList] = useState({})
  const [formData, setFormData] = useState({ kategori: '', jenis_pelanggaran: '', poin: 0, tanggal: new Date().toLocaleDateString('sv-SE'), waktu: new Date().toTimeString().slice(0,5), lokasi: '', kronologi: '' })
  const [filteredJenis, setFilteredJenis] = useState([])
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => { getKategoriPelanggaran().then(setKategoriList) }, [])
  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target) && searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(async (val) => {
    setSearchTerm(val)
    if (val.length >= 3) {
      setIsSearching(true)
      const res = await searchStudentsForPelanggaran(val, userData?.role, userData?.kelas, userData?.id)
      if (res.error) {
        setToast({ type: 'error', message: 'Gagal mencari: ' + res.error })
        setSearchResults([])
      } else if (res.data) {
        setSearchResults(res.data)
      }
      setIsSearching(false)
      setShowDropdown(true)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [userData])

  const selectStudent = async (student) => {
    setSelectedStudent(student)
    setSearchTerm(student.nama)
    setShowDropdown(false)

    // Ambil nama Wali Kelas dari sumber data yang sama dengan halaman Penanggung Jawab
    try {
      const { getPJByClass } = await import('@/app/actions/penanggungJawabActions')
      const pj = await getPJByClass(student.kelas, student.jurusan)
      if (pj?.wali?.nama) {
        setSelectedStudent(prev => ({ ...prev, wali_kelas: pj.wali.nama }))
      }
    } catch (e) {
      console.warn('[EntriPelanggaran] Gagal ambil Wali Kelas:', e)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'kategori') {
        updated.jenis_pelanggaran = ''; updated.poin = 0
        setFilteredJenis(kategoriList[value] || [])
      }
      if (name === 'jenis_pelanggaran') {
        const selected = (kategoriList[formData.kategori] || []).find(j => j.nama === value)
        updated.poin = selected ? selected.poin : 0
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (!selectedStudent || !formData.kategori || !formData.jenis_pelanggaran) { setToast({ type: 'error', message: 'Data tidak lengkap!' }); return }
    setSaving(true)
    const dataToSave = {
      nisn: selectedStudent.nisn, nama_siswa: selectedStudent.nama, kelas: selectedStudent.kelas, jurusan: selectedStudent.jurusan,
      kategori: formData.kategori, jenis_pelanggaran: formData.jenis_pelanggaran, poin: formData.poin,
      tanggal: formData.tanggal, waktu: formData.waktu, lokasi: formData.lokasi, kronologi: formData.kronologi,
      dicatat_oleh: userData?.nama || 'System', role_pencatat: userData?.role || 'Unknown',
      current_total_pelanggaran: selectedStudent.total_pelanggaran || 0, current_total_reward: selectedStudent.total_reward || 0
    }
    const res = await savePelanggaranAction(dataToSave)
    if (res.error) { setToast({ type: 'error', message: res.error }) } 
    else {
      setToast({ type: 'success', message: `Pelanggaran berhasil dicatat! Poin reward dikurangi ${formData.kategori === 'Berat' ? 5 : formData.kategori === 'Sedang' ? 2 : 1}.` })
      setSelectedStudent(prev => ({ ...prev, total_pelanggaran: res.newTotalPelanggaran, total_reward: res.newTotalReward }))
      setFormData({ kategori: '', jenis_pelanggaran: '', poin: 0, tanggal: new Date().toLocaleDateString('sv-SE'), waktu: new Date().toTimeString().slice(0,5), lokasi: '', kronologi: '' }); setShowConfirm(false)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>} {toast.message}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14}/></button>
        </div>
      )}

      <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><AlertTriangle size={48}/></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">⚠️ Entri Pelanggaran Siswa</h1>
          <p className="text-red-100 mt-2 text-sm md:text-base font-medium">Catat dan dokumentasikan pelanggaran siswa secara akurat dan terintegrasi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cari Siswa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input ref={searchRef} type="text" placeholder="Minimal 3 huruf..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800 text-sm" value={searchTerm} onChange={(e) => handleSearch(e.target.value)}/>
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-red-500" size={18}/>}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div ref={dropdownRef} className="absolute z-40 mt-2 w-[calc(100%-40px)] bg-white border border-gray-100 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                {searchResults.map(s => (
                  <div key={s.nisn} onClick={() => selectStudent(s)} className="flex items-center gap-3 p-3 hover:bg-red-50 cursor-pointer border-b border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm">{s.nama.charAt(0)}</div>
                    <div><p className="font-semibold text-gray-800 text-sm">{s.nama}</p><p className="text-xs text-gray-500">{s.nisn} • {s.kelas} {s.jurusan}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedStudent ? (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-red-100 relative overflow-hidden">
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-3">{selectedStudent.nama.charAt(0)}</div>
                <h3 className="text-lg font-extrabold text-gray-800">{selectedStudent.nama}</h3>
                <p className="text-xs text-gray-500 mt-1">NISN: {selectedStudent.nisn} • {selectedStudent.kelas} {selectedStudent.jurusan}</p>
                <div className="grid grid-cols-2 gap-4 w-full mt-5 text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div><span className="block text-gray-400 font-normal">Wali Kelas</span>{selectedStudent.wali_kelas || '-'}</div>
                  <div><span className="block text-gray-400 font-normal">Total Reward</span>{selectedStudent.total_reward || 0}</div>
                </div>
                <div className="mt-4 w-full p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm font-bold text-gray-700">Total Pelanggaran: <span className="text-red-600 text-xl">{selectedStudent.total_pelanggaran || 0}</span> poin</p>
                  <span className={`mt-2 inline-block text-[10px] px-2 py-1 rounded-full font-bold ${getStatusDisiplin(selectedStudent.total_pelanggaran).cls}`}>{getStatusDisiplin(selectedStudent.total_pelanggaran).label}</span>
                </div>
              </div>
            </div>
          ) : <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm flex flex-col items-center justify-center min-h-[200px]"><User size={40} className="mb-2 opacity-50"/>Cari siswa terlebih dahulu</div>}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-red-500"/> Form Input Pelanggaran</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Kategori <span className="text-red-500">*</span></label>
                  <select name="kategori" value={formData.kategori} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800 bg-white">
                    <option value="">Pilih Kategori</option>
                    <option value="Ringan">🟢 Ringan</option><option value="Sedang">🟡 Sedang</option><option value="Berat">🔴 Berat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Jenis Pelanggaran <span className="text-red-500">*</span></label>
                  <select name="jenis_pelanggaran" value={formData.jenis_pelanggaran} onChange={handleInputChange} disabled={!formData.kategori} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800 bg-white disabled:bg-gray-50">
                    <option value="">{formData.kategori ? 'Pilih Jenis' : 'Pilih Kategori Dulu'}</option>
                    {filteredJenis.map((j, i) => <option key={`${j.nama}-${i}`} value={j.nama}>{j.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Poin</label>
                  <input type="number" value={formData.poin} readOnly className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Tanggal</label><input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800"/></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Waktu</label><input type="time" name="waktu" value={formData.waktu} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800"/></div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Lokasi</label>
                  <select name="lokasi" value={formData.lokasi} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800 bg-white">
                    <option value="">Pilih Lokasi</option><option value="Ruang Kelas">Ruang Kelas</option><option value="Lapangan">Lapangan</option><option value="Kantin">Kantin</option><option value="Mushola">Mushola</option><option value="Perpustakaan">Perpustakaan</option><option value="Luar Sekolah">Luar Sekolah</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Kronologi <span className="text-red-500">*</span></label>
                <textarea name="kronologi" value={formData.kronologi} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none text-gray-800 h-24 resize-none" placeholder="Jelaskan kronologi kejadian..."></textarea>
              </div>
              <button onClick={() => setShowConfirm(true)} disabled={!selectedStudent || !formData.kategori || !formData.jenis_pelanggaran || saving} className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-sm hover:from-red-600 hover:to-rose-700 transition disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                <AlertTriangle size={18}/> Simpan Pelanggaran
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={40}/>
            <h3 className="font-bold text-lg text-gray-800">Konfirmasi Pelanggaran</h3>
            <p className="text-sm text-gray-500 mt-2">Catat pelanggaran <span className="font-bold text-red-500">{formData.jenis_pelanggaran}</span> kepada <span className="font-bold">{selectedStudent?.nama}</span>?</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">{saving ? '⏳' : <><CheckCircle size={14}/> Ya, Simpan</>}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}