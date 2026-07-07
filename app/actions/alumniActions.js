'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

// ── OPTIMASI: Cache 1 menit — dipanggil di beranda (Kisah Alumni) ──
export async function getPublishedAlumni() {
  return getCached('alumni_published', async () => {
    const { data, error } = await supabaseAdmin
      .from('form_tracer_studi')
      .select('id, nama, nisn, tahun_lulus, jurusan, status_saat_ini, kuliah_nama_pt, kuliah_prodi, kuliah_kota, kuliah_provinsi, bekerja_nama_perusahaan, bekerja_jabatan, bekerja_kota, bekerja_provinsi, wirausaha_nama, wirausaha_bidang, testimoni, foto_aktivitas_url, is_featured, pin_order')
      .eq('is_published', true)
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })
    return { data: data || [] }
  }, TTL.MINUTE)
}

export async function getAllAlumni({ search, tahunLulus, jurusan, status, kota, page = 1, pageSize = 12 }) {
  try {
    let query = supabaseAdmin
      .from('form_tracer_studi')
      .select('id, nama, nisn, tahun_lulus, jurusan, status_saat_ini, kuliah_nama_pt, kuliah_prodi, kuliah_kota, kuliah_provinsi, bekerja_nama_perusahaan, bekerja_jabatan, bekerja_kota, bekerja_provinsi, wirausaha_nama, wirausaha_bidang, testimoni, foto_aktivitas_url, is_published, is_featured, pin_order, created_at', { count: 'exact' })
      .eq('is_published', true)
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (search) {
      const safeSearch = search.replace(/[%_]/g, '\\$&')
      query = query.or(`nama.ilike.%${safeSearch}%,nisn.ilike.%${safeSearch}%`)
    }
    if (tahunLulus) query = query.eq('tahun_lulus', tahunLulus)
    if (jurusan) query = query.eq('jurusan', jurusan)
    if (status) query = query.eq('status_saat_ini', status)
    if (kota) {
      const safeKota = kota.replace(/[%_]/g, '\\$&')
      query = query.or(`kuliah_kota.ilike.%${safeKota}%,bekerja_kota.ilike.%${safeKota}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // ── OPTIMASI: Dropdown options di-cache terpisah (tidak perlu query ulang tiap ganti halaman) ──
    const [mainRes, tahunRes, jurusanRes, statusRes, kotaRes] = await Promise.all([
      query.range(from, to),
      getCached('alumni_dropdowns', async () => {
        const [tR, jR, sR, kR] = await Promise.all([
          supabaseAdmin.from('form_tracer_studi').select('tahun_lulus').eq('is_published', true),
          supabaseAdmin.from('form_tracer_studi').select('jurusan').eq('is_published', true),
          supabaseAdmin.from('form_tracer_studi').select('status_saat_ini').eq('is_published', true),
          supabaseAdmin.from('form_tracer_studi').select('kuliah_kota, bekerja_kota').eq('is_published', true),
        ])
        return {
          tahun: [...new Set((tR.data || []).map(r => r.tahun_lulus).filter(Boolean))].sort(),
          jurusan: [...new Set((jR.data || []).map(r => r.jurusan).filter(Boolean))].sort(),
          status: [...new Set((sR.data || []).map(r => r.status_saat_ini).filter(Boolean))].sort(),
          kota: [...new Set([...(kR.data || []).map(r => r.kuliah_kota).filter(Boolean), ...(kR.data || []).map(r => r.bekerja_kota).filter(Boolean)])].sort(),
        }
      }, TTL.KELAS_FILTERS),
    ])

    const dd = tahunRes || {}
    return {
      data: mainRes.data || [],
      total: mainRes.count || 0,
      tahunLulusList: dd.tahun || [],
      jurusanList: dd.jurusan || [],
      statusList: dd.status || [],
      kotaList: dd.kota || [],
    }
  } catch (err) {
    return { data: [], total: 0, tahunLulusList: [], jurusanList: [], statusList: [], kotaList: [] }
  }
}

// ── OPTIMASI: Cache 1 menit — dipanggil dari getFormulirStats ──
export async function getAlumniStats() {
  return getCached('alumni_stats', async () => {
    const { data } = await supabaseAdmin.from('form_tracer_studi').select('status_saat_ini').eq('is_published', true)
    const stats = {}
    for (const row of (data || [])) {
      const s = row.status_saat_ini || 'Lainnya'
      stats[s] = (stats[s] || 0) + 1
    }
    return stats
  }, TTL.MINUTE)
}

export async function toggleAlumniPublish(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ is_published: value }).eq('id', id)
  if (error) return { error: error.message }
  invalidateCacheByPrefix('alumni_')
  return { success: true }
}

export async function toggleAlumniFeatured(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ is_featured: value }).eq('id', id)
  if (error) return { error: error.message }
  invalidateCacheByPrefix('alumni_')
  return { success: true }
}

export async function toggleAlumniPin(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ pin_order: value }).eq('id', id)
  if (error) return { error: error.message }
  invalidateCacheByPrefix('alumni_')
  return { success: true }
}