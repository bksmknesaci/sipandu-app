'use client'
import { useEffect, useState } from 'react'
import { getPJByClass } from '@/app/actions/penanggungJawabActions'
import { UserCog, Users, AlertCircle } from 'lucide-react'

export default function PJInfoCard({ kelas, jurusan }) {
  const [pj, setPj] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (kelas && jurusan) {
      setLoading(true)
      getPJByClass(kelas, jurusan).then(data => {
        setPj(data)
        setLoading(false)
      })
    } else {
      setPj(null)
      setLoading(false)
    }
  }, [kelas, jurusan])

  if (loading) return <div className="text-sm text-gray-400 p-2">Memuat info PJ...</div>
  if (!kelas || !jurusan) return null
  if (!pj) return (
    <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 border border-red-100">
      <AlertCircle size={16} /> Belum ada Penanggung Jawab untuk kelas {kelas} {jurusan}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
        <div className="bg-blue-500 text-white p-3 rounded-lg">
          <Users size={20} />
        </div>
        <div>
          <p className="text-xs text-blue-500 font-medium">Wali Kelas</p>
          <p className="text-sm font-bold text-gray-800">{pj.wali?.nama || 'Belum diset'}</p>
          <p className="text-xs text-gray-500">{pj.wali?.whatsapp || '-'}</p>
        </div>
      </div>
      <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-4">
        <div className="bg-green-500 text-white p-3 rounded-lg">
          <UserCog size={20} />
        </div>
        <div>
          <p className="text-xs text-green-600 font-medium">Sekretaris Kelas</p>
          <p className="text-sm font-bold text-gray-800">{pj.sekretaris?.nama || 'Belum diset'}</p>
          <p className="text-xs text-gray-500">{pj.sekretaris?.whatsapp || '-'}</p>
        </div>
      </div>
    </div>
  )
}