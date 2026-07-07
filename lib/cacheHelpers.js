/**
 * cacheHelpers.js — Server-side In-Memory Cache
 * 
 * Menyimpan data semi-static agar tidak query ulang ke database
 * setiap kali ada request. Cache hidup selama serverless instance
 * masih "warm" (di Vercel: 5-15 menit setelah request terakhir).
 * 
 * PENGGUNAAN:
 *   import { getCached, invalidateCache } from '@/lib/cacheHelpers'
 *   
 *   const settings = await getCached('app_settings', async () => {
 *     const { data } = await supabaseAdmin.from('app_settings').select('*').single()
 *     return data
 *   }, TTL.SETTINGS)
 */

const cache = new Map()

const TTL = {
  SETTINGS: 10 * 60 * 1000,        // 10 menit
  KELAS_FILTERS: 5 * 60 * 1000,     // 5 menit
  PENANGGUNG_JAWAB: 5 * 60 * 1000,  // 5 menit
  HARI_EFEKTIF: 10 * 60 * 1000,     // 10 menit
  QR_SETTINGS: 5 * 60 * 1000,       // 5 menit
  KOP_SURAT: 30 * 60 * 1000,        // 30 menit
  DASHBOARD_STATS: 30 * 1000,       // 30 detik
  WHATSAPP_CONFIG: 10 * 60 * 1000,  // 10 menit
  SHORT: 10 * 1000,                 // 10 detik
  MINUTE: 60 * 1000,                // 1 menit
}

/**
 * Ambil data dari cache, atau fetch baru jika expired/kosong.
 * Jika ada request pending untuk key yang sama, tunggu hasilnya
 * (deduplikasi — mencegah 2 query identik secara bersamaan).
 */
export async function getCached(key, fetcher, ttl = TTL.SETTINGS) {
  const now = Date.now()
  const entry = cache.get(key)

  // Cache hit — data masih segar
  if (entry && !entry.pending && entry.timestamp && (now - entry.timestamp < ttl)) {
    return entry.data
  }

  // Ada request pending untuk key sama → tunggu (deduplikasi)
  if (entry?.pending) {
    return entry.pending
  }

  // Fetch baru
  const pending = fetcher()
    .then(data => {
      cache.set(key, { data, timestamp: now, pending: null })
      return data
    })
    .catch(err => {
      cache.delete(key)
      throw err
    })

  cache.set(key, { pending, timestamp: now })
  return pending
}

/**
 * Hapus cache tertentu atau semua.
 * - invalidateCache() → hapus semua
 * - invalidateCache('app_settings') → hapus 1 key
 * - invalidateCache(['key1', 'key2']) → hapus beberapa
 */
export function invalidateCache(keys) {
  if (!keys) {
    cache.clear()
    return
  }
  if (Array.isArray(keys)) {
    keys.forEach(k => cache.delete(k))
  } else {
    cache.delete(keys)
  }
}

/**
 * Hapus cache yang match prefix.
 * invalidateCacheByPrefix('dashboard_') → hapus dashboard_admin, dashboard_wk, dll
 */
export function invalidateCacheByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

/**
 * Debug: lihat isi cache (hanya untuk development)
 */
export function getCacheStatus() {
  const now = Date.now()
  const entries = []
  for (const [key, entry] of cache) {
    entries.push({
      key,
      age: Math.round((now - (entry.timestamp || 0)) / 1000) + 's',
      hasData: !!entry.data,
      isPending: !!entry.pending
    })
  }
  return { total: cache.size, entries }
}

export { TTL }