// Fetch app_settings SEKALI per browser (cache 5 menit) — dipakai bersama
// oleh Beranda, AppShell, Login, dan Tentang.
import { supabase } from '@/lib/supabase'

const CACHE_TTL = 5 * 60 * 1000 // 5 menit
let cached = { data: null, timestamp: 0 }
let pending = null

export async function getAppSettings() {
  const now = Date.now()

  // Cache masih segar
  if (cached.data && now - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Ada request sedang berjalan → tunggu bersama (deduplikasi)
  if (pending) return pending

  pending = supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()
    .then(({ data }) => {
      pending = null
      if (data) {
        cached = { data, timestamp: Date.now() }
        return data
      }
      return cached.data // gagal → pakai data lama jika ada
    })
    .catch(() => {
      pending = null
      return cached.data
    })

  return pending
}

// Dipanggil setelah Admin menyimpan perubahan di Profil SIPANDU
export function clearAppSettingsCache() {
  cached = { data: null, timestamp: 0 }
}