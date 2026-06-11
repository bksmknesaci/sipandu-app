import React from 'react'
import { Shield } from 'lucide-react'

export default function PenangananSiswaPage() {
  return (
    <div className="p-8 text-center text-gray-500 space-y-4 min-h-screen flex flex-col justify-center items-center">
      <Shield size={64} className="text-gray-300" />
      <h1 className="text-2xl font-bold text-gray-700">Menu Penanganan Siswa</h1>
      <p className="text-sm">Fitur ini sedang dalam tahap pengembangan.</p>
    </div>
  )
}