/**
 * dbOptimize.js — Helper Database yang Sudah Dioptimasi
 * 
 * Mengurangi overhead query:
 * - fastCount: hitung row TANPA fetch data (head:true)
 * - fetchPaginated: pagination dengan count 1x query
 * - parallelQueries: jalankan banyak query sekaligus
 * - safeParallel: query paralel yang tetap jalan walau sebagian gagal
 */

import { supabaseAdmin } from './supabase-admin'

/**
 * Hitung jumlah row TANPA memfetch data.
 * 
 * SEBELUM: supabase.from('siswa').select('*') → fetch SEMUA row → .length
 * SESUDAH: supabase.from('siswa').select('*', { count: 'exact', head: true }) → hanya angka
 * 
 * Penghematan: jika tabel 800 row, hemat ~800 row transfer dari DB.
 */
export async function fastCount(table, filters = {}) {
  let query = supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value)
    }
  }

  const { count, error } = await query
  if (error) {
    console.error(`[fastCount] ${table}:`, error.message)
    return 0
  }
  return count || 0
}

/**
 * Fetch data dengan pagination efisien (count + data dalam 1 query).
 */
export async function fetchPaginated(table, {
  page = 1,
  limit = 20,
  filters = {},
  orFilter,
  searchColumn,
  searchQuery,
  orderBy = 'created_at',
  orderAsc = false,
  select = '*'
} = {}) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from(table)
    .select(select, { count: 'exact' })
    .range(from, to)
    .order(orderBy, { ascending: orderAsc })

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value)
    }
  }

  if (orFilter) {
    query = query.or(orFilter)
  }

  if (searchColumn && searchQuery) {
    query = query.ilike(searchColumn, `%${searchQuery}%`)
  }

  const { data, count, error } = await query
  if (error) {
    console.error(`[fetchPaginated] ${table}:`, error.message)
    return { data: [], total: 0, page, totalPages: 0 }
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

/**
 * Jalankan banyak query secara PARALEL (bukan sequential).
 * 
 * SEBELUM (sequential — lambat):
 *   const siswa = await getSiswa()
 *   const absensi = await getAbsensi()    // menunggu siswa selesai dulu
 *   const reward = await getReward()      // menunggu absensi selesai dulu
 *   // Total waktu: 3 detik (1+1+1)
 * 
 * SESUDAH (paralel — cepat):
 *   const [siswa, absensi, reward] = await parallelQueries([
 *     getSiswa(),
 *     getAbsensi(),    // jalan bersamaan
 *     getReward()      // jalan bersamaan
 *   ])
 *   // Total waktu: 1 detik (max dari ketiganya)
 */
export async function parallelQueries(queries) {
  return Promise.all(queries)
}

/**
 * Query paralel yang TIDAK gagal total jika sebagian error.
 * Mengembalikan object { key: data }, key yang error = null.
 */
export async function safeParallel(queries) {
  // queries: [{ key: 'siswa', query: getSiswa() }, ...]
  const results = {}
  const settled = await Promise.allSettled(queries.map(q => q.query))

  settled.forEach((result, i) => {
    const key = queries[i].key
    if (result.status === 'fulfilled') {
      results[key] = result.value
    } else {
      console.error(`[safeParallel] ${key}:`, result.reason?.message || result.reason)
      results[key] = null
    }
  })

  return results
}