'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getPublishedAlumni() {
  try {
    const { data, error } = await supabaseAdmin
      .from('form_tracer_studi')
      .select('id, nama, nisn, tahun_lulus, jurusan, status_saat_ini, kuliah_nama_pt, kuliah_prodi, kuliah_kota, kuliah_provinsi, bekerja_nama_perusahaan, bekerja_jabatan, bekerja_kota, bekerja_provinsi, wirausaha_nama, wirausaha_bidang, testimoni, foto_aktivitas_url, is_featured, pin_order')
      .eq('is_published', true)
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) return { data: [] }
    return { data: data || [] }
  } catch (err) {
    return { data: [] }
  }
}

export async function getAllAlumni({ search, tahunLulus, jurusan, status, kota, page = 1, pageSize = 12 }) {
  try {
    let query = supabaseAdmin
      .from('form_tracer_studi')
      .select('id, nama, nisn, tahun_lulus, jurusan, status_saat_ini, kuliah_nama_pt, kuliah_prodi, kuliah_kota, kuliah_provinsi, bekerja_nama_perusahaan, bekerja_jabatan, bekerja_kota, bekerja_provinsi, wirausaha_nama, wirausaha_bidang, testimoni, foto_aktivitas_url, is_published, is_featured, pin_order, created_at', { count: 'exact' })
      .eq('is_published', true)
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (search) query = query.or(`nama.ilike.%${search}%,nisn.ilike.%${search}%`)
    if (tahunLulus) query = query.eq('tahun_lulus', tahunLulus)
    if (jurusan) query = query.eq('jurusan', jurusan)
    if (status) query = query.eq('status_saat_ini', status)
    if (kota) query = query.or(`kuliah_kota.ilike.%${kota}%,bekerja_kota.ilike.%${kota}%`)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // FIX: Hapus head: true agar data rows dikembalikan, bukan hanya count
    const [mainRes, tahunRes, jurusanRes, statusRes, kotaRes] = await Promise.all([
      query.range(from, to),
      supabaseAdmin.from('form_tracer_studi').select('tahun_lulus').eq('is_published', true),
      supabaseAdmin.from('form_tracer_studi').select('jurusan').eq('is_published', true),
      supabaseAdmin.from('form_tracer_studi').select('status_saat_ini').eq('is_published', true),
      supabaseAdmin.from('form_tracer_studi').select('kuliah_kota, bekerja_kota').eq('is_published', true),
    ])

    // Ambil nilai unik dari data rows
    const tahunLulusList = [...new Set((tahunRes.data || []).map(r => r.tahun_lulus).filter(Boolean))].sort()
    const jurusanList = [...new Set((jurusanRes.data || []).map(r => r.jurusan).filter(Boolean))].sort()
    const statusList = [...new Set((statusRes.data || []).map(r => r.status_saat_ini).filter(Boolean))].sort()
    const kotaList = [...new Set([
      ...(kotaRes.data || []).map(r => r.kuliah_kota).filter(Boolean),
      ...(kotaRes.data || []).map(r => r.bekerja_kota).filter(Boolean),
    ])].sort()

    return { data: mainRes.data || [], total: mainRes.count || 0, tahunLulusList, jurusanList, statusList, kotaList }
  } catch (err) {
    return { data: [], total: 0, tahunLulusList: [], jurusanList: [], statusList: [], kotaList: [] }
  }
}

export async function getAlumniStats() {
  try {
    const { data } = await supabaseAdmin
      .from('form_tracer_studi')
      .select('status_saat_ini')
      .eq('is_published', true)

    const stats = {}
    for (const row of (data || [])) {
      const s = row.status_saat_ini || 'Lainnya'
      stats[s] = (stats[s] || 0) + 1
    }
    return stats
  } catch (err) {
    return {}
  }
}

export async function toggleAlumniPublish(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ is_published: value }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleAlumniFeatured(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ is_featured: value }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleAlumniPin(id, value) {
  const { error } = await supabaseAdmin.from('form_tracer_studi').update({ pin_order: value }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}