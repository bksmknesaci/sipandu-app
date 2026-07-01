'use client'
import { useState, useEffect } from 'react'
import { getPJStats, getDerivedPJ } from '@/app/actions/penanggungJawabActions'
import { Users, GraduationCap, UserCog, ClipboardList, Eye, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PenanggungJawabPage() {
  const [stats, setStats] = useState({ totalKelas: 0, totalWali: 0, totalSekretaris: 0, totalPJ: 0 })
  const [listPJ, setListPJ] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailData, setDetailData] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    const [s, pj] = await Promise.all([
      getPJStats(),
      getDerivedPJ()
    ])
    setStats(s)
    setListPJ(pj || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filteredPJ = listPJ.filter(pj => 
    pj.kelas.toLowerCase().includes(search.toLowerCase()) || 
    pj.jurusan.toLowerCase().includes(search.toLowerCase()) ||
    (pj.wali?.nama || '').toLowerCase().includes(search.toLowerCase()) ||
    (pj.sekretaris?.nama || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusConfig = {
    'Aktif': 'bg-green-100 text-green-700 border border-green-200',
    'Tidak Aktif': 'bg-gray-100 text-gray-500 border border-gray-200',
    'Belum Ada PJ': 'bg-amber-100 text-amber-700 border border-amber-200',
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Penanggung Jawab Kelas
        </h1>
        <p className="text-gray-500 mt-1">Kelola data wali kelas dan sekretaris kelas yang bertanggung jawab terhadap setiap rombongan belajar.</p>
        <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-700 text-sm p-3 rounded-lg">
          ℹ️ Data Penanggung Jawab diambil secara otomatis dari <b>Manajemen User</b>. Daftar kelas bersumber dari <b>Data Siswa</b>. Untuk menambah/mengubah data, silakan atur peran (Wali Kelas/Sekretaris) dan kelas pada halaman Manajemen User.
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Kelas Aktif', value: stats.totalKelas, color: 'bg-blue-500', icon: <GraduationCap /> },
          { label: 'Total Wali Kelas', value: stats.totalWali, color: 'bg-green-500', icon: <Users /> },
          { label: 'Total Sekretaris', value: stats.totalSekretaris, color: 'bg-purple-500', icon: <UserCog /> },
          { label: 'Total Penanggung Jawab', value: stats.totalPJ, color: 'bg-orange-500', icon: <ClipboardList /> }
        ].map((card, i) => (
          <div key={i} className={`${card.color} text-white p-5 rounded-xl shadow-lg flex items-center justify-between transition-transform hover:scale-105`}>
            <div>
              <p className="text-sm opacity-90">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{loading ? '...' : card.value}</p>
            </div>
            <div className="opacity-50 text-4xl">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* TABEL DATA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Data Penanggung Jawab</h2>
          <div className="relative w-full sm:w-auto">
            <input type="text" placeholder="Cari kelas, wali, sekretaris..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black" />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded w-full"></div>)}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Jurusan</th>
                <th className="p-3">Wali Kelas</th>
                <th className="p-3">No WA Wali</th>
                <th className="p-3">Sekretaris</th>
                <th className="p-3">No WA Sekretaris</th>
                <th className="p-3">Status</th>
                <th className="p-3">Terakhir Update</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPJ.map((pj, i) => (
                <tr key={pj.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-black">{i + 1}</td>
                  <td className="p-3 font-medium text-black">{pj.kelas}</td>
                  <td className="p-3 text-black">{pj.jurusan}</td>
                  <td className="p-3 text-black">{pj.wali?.nama || <span className="text-gray-300 italic">-</span>}</td>
                  <td className="p-3">
                    {pj.wali?.whatsapp ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        {pj.wali.whatsapp}
                      </span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="p-3 text-black">{pj.sekretaris?.nama || <span className="text-gray-300 italic">-</span>}</td>
                  <td className="p-3">
                    {pj.sekretaris?.whatsapp ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        {pj.sekretaris.whatsapp}
                      </span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[pj.status] || statusConfig['Belum Ada PJ']}`}>
                      {pj.status}
                    </span>
                  </td>
                  <td className="p-3 text-black text-xs">{pj.updated_at ? new Date(pj.updated_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => setDetailData(pj)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredPJ.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-400">
                    {search ? 'Tidak ada data yang cocok dengan pencarian.' : 'Tidak ada data kelas. Pastikan data siswa sudah diinput di Manajemen Data Siswa.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETAIL */}
      {detailData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailData(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Detail Penanggung Jawab</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-black">Kelas / Jurusan</span><span className="font-bold text-black">{detailData.kelas} {detailData.jurusan}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-black">Wali Kelas</span><span className="font-bold text-black">{detailData.wali?.nama || <span className="text-gray-400 font-normal">Belum diatur</span>}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-black">Email Wali</span><span className="font-bold text-black">{detailData.wali?.email || '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-black">Sekretaris</span><span className="font-bold text-black">{detailData.sekretaris?.nama || <span className="text-gray-400 font-normal">Belum diatur</span>}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-black">Email Sekretaris</span><span className="font-bold text-black">{detailData.sekretaris?.email || '-'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-black">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[detailData.status] || statusConfig['Belum Ada PJ']}`}>{detailData.status}</span></div>
              <div className="border-b pb-2"><span className="text-black block mb-1">Catatan</span><span className="font-bold text-black">Data penanggung jawab dikelola langsung dari Manajemen User.</span></div>
            </div>
            <button onClick={() => setDetailData(null)} className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-black py-2 rounded-lg transition-colors">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}