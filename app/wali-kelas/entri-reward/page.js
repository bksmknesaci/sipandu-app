"use client"

import { useState, useEffect } from 'react'
import EntriReward from '@/app/components/EntriReward'

export default function WaliKelasEntriRewardPage() {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData')
      if (stored) setUserData(JSON.parse(stored))
    } catch {}
  }, [])

  if (!userData) {
    return <div className="p-8 text-center text-gray-400 flex items-center justify-center min-h-screen">Memuat data pengguna...</div>
  }

  return <EntriReward userData={userData} />
}