"use client"
import { useState, useEffect } from 'react'
import EntriPelanggaran from '@/app/components/EntriPelanggaran'

export default function OsisEntriPelanggaranPage() {
  const [userData, setUserData] = useState(null)
  useEffect(() => { try { const stored = localStorage.getItem('userData'); if (stored) setUserData(JSON.parse(stored)) } catch {} }, [])
  if (!userData) return <div className="p-8 text-center text-gray-400">Memuat data pengguna...</div>
  return <EntriPelanggaran userData={userData} />
}