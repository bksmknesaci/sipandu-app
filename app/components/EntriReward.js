"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy, Search, Award, X, CheckCircle, 
  AlertTriangle, FileText, Loader2, User, BookOpen
} from 'lucide-react'
import {
  searchStudentsForReward, getRewardCategories, getStudentRewardHistory, saveRewardAction
} from '@/app/actions/rewardActions'

const getRankInfo = (points) => {
  if (points > 150) return { label: 'Anugerah Waluya Utama', icon: '🏆', color: 'text-yellow-500', bg: 'bg-yellow-50' }
  if (points >= 126) return { label: 'Anugerah Waluya Madya', icon: '🥈', color: 'text-gray-500', bg: 'bg-gray-50' }
  if (points >= 100) return { label: 'Anugerah Waluya Muda', icon: '🥉', color: 'text-amber-700', bg: 'bg-orange-50' }
  return { label: 'Belum Bergelar', icon: '📚', color: 'text-slate-500', bg: 'bg-slate-50' }
}

export default function EntriReward({ userData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [categories, setCategories] = useState([])
  
  const [selectedReward, setSelectedReward] = useState(null)
  const [catatan, setCatatan] = useState('')
  
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => { getRewardCategories().then(setCategories) }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(async (val) => {
    setSearchTerm(val)
    if (val.length >= 3) {
      setIsSearching(true)
      const res = await searchStudentsForReward(val, userData?.role, userData?.kelas, userData?.id)
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
      console.warn('[EntriReward] Gagal ambil Wali Kelas:', e)
    }

    const res = await getStudentRewardHistory(student.nisn)
    if (res.data) setHistory(res.data)
  }

  const handleSelectReward = (kode) => {
    const cat = categories.find(c => c.kode === kode)
    setSelectedReward(cat)
  }

  const poinToAdd = selectedReward ? selectedReward.poin : 0
  const totalAfterSave = (selectedStudent?.total_reward || 0) + poinToAdd

  const handleSave = async () => {
    if (!selectedStudent || !selectedReward) {
      setToast({ type: 'error', message: 'Siswa dan Jenis Reward wajib dipilih!' }); return
    }

    setSaving(true)
    const dataToSave = {
      nisn: selectedStudent.nisn,
      nama_siswa: selectedStudent.nama,
      kelas: selectedStudent.kelas,
      jurusan: selectedStudent.jurusan,
      reward_kode: selectedReward.kode,
      reward_nama: selectedReward.nama,
      reward_poin: poinToAdd,
      catatan: catatan,
      diberikan_oleh: userData?.nama || 'System',
      role_pemberi: userData?.role || 'Unknown',
      current_total: selectedStudent.total_reward || 0
    }

    const res = await saveRewardAction(dataToSave)
    if (res.error) {
      setToast({ type: 'error', message: res.error })
    } else {
      setToast({ type: 'success', message: `Reward +${poinToAdd} poin berhasil diberikan!` })
      setSelectedStudent(prev => ({ ...prev, total_reward: res.newTotal }))
      const histRes = await getStudentRewardHistory(selectedStudent.nisn)
      if (histRes.data) setHistory(histRes.data)
      setSelectedReward(null); setCatatan(''); setShowConfirm(false)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-slideDown`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle size={16}/>} {toast.message}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14}/></button>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-sm border border-white/30"><Trophy size={48} className="drop-shadow-lg"/></div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-sm">🏆 ENTRI REWARD SISWA</h1>
          <p className="text-amber-100 mt-2 text-sm md:text-base font-medium">Berikan penghargaan dan poin reward kepada siswa yang menunjukkan prestasi, kedisiplinan, dan perilaku positif.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cari Siswa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input ref={searchRef} type="text" placeholder="Cari siswa minimal 3 huruf..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-800 text-sm" value={searchTerm} onChange={(e) => handleSearch(e.target.value)}/>
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber-500" size={18}/>}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div ref={dropdownRef} className="absolute z-40 mt-2 w-[calc(100%-40px)] bg-white border border-gray-100 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                {searchResults.map(siswa => (
                  <div key={siswa.nisn} onClick={() => selectStudent(siswa)} className="flex items-center gap-3 p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">{siswa.nama.charAt(0)}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{siswa.nama}</p>
                      <p className="text-xs text-gray-500">NISN: {siswa.nisn} • {siswa.kelas} {siswa.jurusan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedStudent ? (
            <div className="bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-2xl shadow-md border border-amber-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-red-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white mb-3">{selectedStudent.nama.charAt(0)}</div>
                <h3 className="text-lg font-extrabold text-gray-800">{selectedStudent.nama}</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">NISN: {selectedStudent.nisn} • {selectedStudent.kelas} {selectedStudent.jurusan}</p>
                <div className="grid grid-cols-2 gap-4 w-full mt-5 text-xs font-semibold text-gray-600 bg-white/80 p-3 rounded-xl shadow-inner">
                  <div><span className="block text-gray-400 font-normal">J. Kelamin</span>{selectedStudent.jenis_kelamin || '-'}</div>
                  <div><span className="block text-gray-400 font-normal">Wali Kelas</span>{selectedStudent.wali_kelas || '-'}</div>
                </div>
                <div className="mt-5 w-full p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Reward</span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getRankInfo(selectedStudent.total_reward).bg} ${getRankInfo(selectedStudent.total_reward).color}`}>{getRankInfo(selectedStudent.total_reward).icon} {getRankInfo(selectedStudent.total_reward).label}</span>
                  </div>
                  <p className="text-4xl font-extrabold text-amber-500 tracking-tight">{selectedStudent.total_reward || 0} <span className="text-lg text-gray-400 font-semibold">Poin</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm flex flex-col items-center justify-center min-h-[200px]"><User size={40} className="mb-2 opacity-50"/>Silakan cari dan pilih siswa terlebih dahulu</div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3"><BookOpen size={18} className="text-amber-500"/> Informasi Kategori Reward</h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-bold text-gray-600 w-10">No</th>
                    <th className="py-2 px-3 font-bold text-gray-600 w-16">Kode</th>
                    <th className="py-2 px-3 font-bold text-gray-600">Jenis Penghargaan</th>
                    <th className="py-2 px-3 font-bold text-gray-600 w-16">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat.kode} className="border-b border-gray-50 hover:bg-amber-50/30 cursor-pointer" onClick={() => handleSelectReward(cat.kode)}>
                      <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-600">{cat.kode}</td>
                      <td className="py-2 px-3 text-gray-700">{cat.nama}</td>
                      <td className="py-2 px-3 font-bold text-gray-800 text-center">{cat.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4"><Award size={18} className="text-amber-500"/> Form Entri Reward</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Jenis Reward <span className="text-red-500">*</span></label>
                <select className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-800 bg-white" value={selectedReward?.kode || ''} onChange={(e) => handleSelectReward(e.target.value)}>
                  <option value="">-- Pilih Jenis Reward --</option>
                  {categories.map(cat => (<option key={cat.kode} value={cat.kode}>{cat.kode} - {cat.nama} ({cat.poin} poin)</option>))}
                </select>
              </div>

              {selectedReward && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-amber-700 text-lg">{selectedReward.kode} - {selectedReward.nama}</p>
                    <p className="text-amber-600 font-bold text-2xl mt-1">{selectedReward.poin} Poin</p>
                  </div>
                  <Trophy size={40} className="text-amber-300 opacity-50"/>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Catatan Reward</label>
                <textarea className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-800 h-24 resize-none" placeholder="Jelaskan prestasi atau alasan pemberian reward..." value={catatan} onChange={(e) => setCatatan(e.target.value)}></textarea>
              </div>

              {selectedStudent && selectedReward && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-around text-center divide-x divide-gray-200">
                  <div className="flex-1"><p className="text-xs text-gray-500 font-semibold">Poin Saat Ini</p><p className="text-xl font-bold text-gray-800 mt-1">{selectedStudent.total_reward || 0}</p></div>
                  <div className="flex-1 text-green-500 px-4"><p className="text-xs font-semibold">Reward</p><p className="text-xl font-bold mt-1">+{poinToAdd}</p></div>
                  <div className="flex-1 text-amber-500"><p className="text-xs font-semibold">Total Setelah Simpan</p><p className="text-2xl font-extrabold mt-1">{totalAfterSave}</p></div>
                </div>
              )}

              <button onClick={() => setShowConfirm(true)} disabled={!selectedStudent || !selectedReward || saving} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                <Trophy size={18}/> ➕ SIMPAN REWARD
              </button>
            </div>
          </div>

          {selectedStudent && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3"><FileText size={18} className="text-amber-500"/> Riwayat Reward Terakhir</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 font-bold text-gray-600 border-b">Tanggal</th>
                      <th className="py-2 px-3 font-bold text-gray-600 border-b">Reward</th>
                      <th className="py-2 px-3 font-bold text-gray-600 border-b">Poin</th>
                      <th className="py-2 px-3 font-bold text-gray-600 border-b">Pemberi</th>
                      <th className="py-2 px-3 font-bold text-gray-600 border-b">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (<tr><td colSpan="5" className="text-center py-6 text-gray-400">Belum ada riwayat reward</td></tr>) : (
                      history.map(row => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-amber-50/20">
                          <td className="py-2 px-3 text-gray-700 font-medium">{new Date(row.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          <td className="py-2 px-3 text-gray-700">{row.reward_nama}</td>
                          <td className="py-2 px-3 text-green-600 font-bold">+{row.reward_poin}</td>
                          <td className="py-2 px-3 text-gray-500"><span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{row.role_pemberi}</span> {row.diberikan_oleh}</td>
                          <td className="py-2 px-3 text-gray-600 max-w-[150px] truncate">{row.catatan || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy size={32} className="text-amber-500"/></div>
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Reward</h3>
              <div className="text-sm text-gray-500 mt-4 text-left space-y-2 bg-gray-50 p-4 rounded-xl">
                <p>Anda akan memberikan reward:</p>
                <p className="font-bold text-amber-700">{selectedReward?.nama}</p>
                <p>Sebesar: <span className="font-bold text-green-600">{poinToAdd} poin</span></p>
                <p>Kepada: <span className="font-bold text-gray-800">{selectedStudent?.nama}</span></p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white rounded-xl text-sm font-semibold hover:from-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Simpan Reward
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  )
}