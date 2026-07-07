'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAlumniStats } from '@/app/actions/alumniActions'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

export async function saveTracerStudi(payload) {
  try {
    const { error } = await supabaseAdmin.from('form_tracer_studi').insert([payload])
    if (error) return { error: error.message }
    invalidateCacheByPrefix('alumni_')
    invalidateCacheByPrefix('formulir_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

export async function savePemetaanKarir(payload) {
  try {
    const { error } = await supabaseAdmin.from('form_pemetaan_karir').insert([payload])
    if (error) return { error: error.message }
    invalidateCacheByPrefix('formulir_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

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
    invalidateCacheByPrefix('formulir_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

// ── OPTIMASI: Cache 1 menit — dipanggil di dashboard admin ──
export async function getFormulirStats() {
  return getCached('formulir_stats', async () => {
    const [tracer, karir, snbp, alumniStats] = await Promise.all([
      supabaseAdmin.from('form_tracer_studi').select('id', { count: 'exact' }),
      supabaseAdmin.from('form_pemetaan_karir').select('id', { count: 'exact' }),
      supabaseAdmin.from('form_snbp_snbt').select('id', { count: 'exact' }),
      getAlumniStats()
    ])
    const totalTracer = tracer.count || 0
    const totalKarir = karir.count || 0
    const totalSnbp = snbp.count || 0
    return { totalTracer, totalKarir, totalSnbp, totalAll: totalTracer + totalKarir + totalSnbp, alumniStats }
  }, TTL.MINUTE)
}

export async function getRekapFormulir(type, filters = {}) {
  try {
    let query;
    if (type === 'tracer') query = supabaseAdmin.from('form_tracer_studi').select('*').order('created_at', { ascending: false })
    else if (type === 'karir') query = supabaseAdmin.from('form_pemetaan_karir').select('*').order('created_at', { ascending: false })
    else if (type === 'snbp') query = supabaseAdmin.from('form_snbp_snbt').select('*').order('created_at', { ascending: false })
    else return { data: [] }

    if (filters?.search) {
      const safeSearch = filters.search.replace(/[%_]/g, '\\$&')
      query = query.or(`nama.ilike.%${safeSearch}%,nisn.ilike.%${safeSearch}%`)
    }

    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    return { data }
  } catch (err) { return { data: [], error: err.message } }
}

export async function resetAllFormulirAction() {
  try {
    // ── OPTIMASI: 3 delete paralel (sebelumnya sequential) ──
    await Promise.all([
      supabaseAdmin.from('form_tracer_studi').delete().neq('id', 0),
      supabaseAdmin.from('form_pemetaan_karir').delete().neq('id', 0),
      supabaseAdmin.from('form_snbp_snbt').delete().neq('id', 0),
    ])
    invalidateCacheByPrefix('alumni_')
    invalidateCacheByPrefix('formulir_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}