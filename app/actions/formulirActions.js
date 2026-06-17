'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================
// SAVE TRACER STUDI
// ============================
export async function saveTracerStudi(payload, file) {
  try {
    let fotoUrl = null
    if (file && file.name) {
      const fileExt = file.name.split('.').pop()
      const fileName = `tracer-${payload.nisn}-${Date.now()}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabaseAdmin.storage.from('bukti-formulir').upload(fileName, buffer, { contentType: file.type, upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('bukti-formulir').getPublicUrl(fileName)
        fotoUrl = urlData.publicUrl
      }
    }

    const { error } = await supabaseAdmin.from('form_tracer_studi').insert([{ ...payload, foto_aktivitas_url: fotoUrl }])
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

// ============================
// SAVE PEMETAAN KARIR
// ============================
export async function savePemetaanKarir(payload) {
  try {
    const { error } = await supabaseAdmin.from('form_pemetaan_karir').insert([payload])
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

// ============================
// SAVE SNBP/SNBT
// ============================
export async function saveSnbpSnbt(payload, file) {
  try {
    let buktiUrl = null
    if (file && file.name) {
      const fileExt = file.name.split('.').pop()
      const fileName = `snbp-${payload.nisn}-${Date.now()}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabaseAdmin.storage.from('bukti-formulir').upload(fileName, buffer, { contentType: file.type, upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('bukti-formulir').getPublicUrl(fileName)
        buktiUrl = urlData.publicUrl
      }
    }

    const { error } = await supabaseAdmin.from('form_snbp_snbt').insert([{ ...payload, bukti_file_url: buktiUrl }])
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

// ============================
// GET FORMULIR STATS (For Dashboard)
// ============================
export async function getFormulirStats() {
  try {
    const [tracer, karir, snbp] = await Promise.all([
      supabaseAdmin.from('form_tracer_studi').select('id, status_saat_ini, created_at', { count: 'exact' }),
      supabaseAdmin.from('form_pemetaan_karir').select('id, created_at', { count: 'exact' }),
      supabaseAdmin.from('form_snbp_snbt').select('id, jalur_pendaftaran, status_hasil, created_at', { count: 'exact' })
    ])

    const totalTracer = tracer.count || 0
    const totalKarir = karir.count || 0
    const totalSnbp = snbp.count || 0
    const totalAll = totalTracer + totalKarir + totalSnbp

    return {
      totalTracer,
      totalKarir,
      totalSnbp,
      totalAll
    }
  } catch (err) {
    return { totalTracer: 0, totalKarir: 0, totalSnbp: 0, totalAll: 0 }
  }
}

// ============================
// GET REKAP FORMULIR (For Admin Table)
// ============================
export async function getRekapFormulir(type, filters = {}) {
  try {
    let query;
    if (type === 'tracer') {
      query = supabaseAdmin.from('form_tracer_studi').select('*').order('created_at', { ascending: false })
    } else if (type === 'karir') {
      query = supabaseAdmin.from('form_pemetaan_karir').select('*').order('created_at', { ascending: false })
    } else if (type === 'snbp') {
      query = supabaseAdmin.from('form_snbp_snbt').select('*').order('created_at', { ascending: false })
    } else {
      return { data: [] }
    }

    if (filters?.search) {
      query = query.or(`nama.ilike.%${filters.search}%,nisn.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    return { data }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

// ============================
// RESET ALL FORMULIR (NEW)
// ============================
export async function resetAllFormulirAction() {
  try {
    // Hapus semua data dari ketiga tabel formulir
    await supabaseAdmin.from('form_tracer_studi').delete().neq('id', 0)
    await supabaseAdmin.from('form_pemetaan_karir').delete().neq('id', 0)
    await supabaseAdmin.from('form_snbp_snbt').delete().neq('id', 0)

    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}