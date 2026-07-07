'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL } from '@/lib/cacheHelpers'

// ── OPTIMASI: Cache 5 menit — pengaturan QR jarang berubah ──
export async function getQRSettings() {
  return getCached('qr_settings', async () => {
    const { data, error } = await supabaseAdmin.from('qr_settings').select('*')
    if (error) return { settings: {} }
    const settings = {}
    ;(data || []).forEach(row => { settings[row.setting_key] = row.setting_value })
    return { settings }
  }, TTL.QR_SETTINGS)
}

// TIDAK di-cache — stats real-time (harus akurat)
export async function saveQRSettings(settingsObj) {
  const upserts = Object.entries(settingsObj).map(([key, value]) => ({
    setting_key: key,
    setting_value: value === null || value === undefined ? null : String(value),
    updated_at: new Date().toISOString()
  }))
  const { error } = await supabaseAdmin.from('qr_settings').upsert(upserts, { onConflict: 'setting_key' })
  if (error) return { error: error.message }

  // Invalidate cache saat ada perubahan
  const { invalidateCache } = await import('@/lib/cacheHelpers');
  invalidateCache('qr_settings');

  return { success: true }
}

export async function getQRStats() {
  const today = new Date().toLocaleDateString('sv-SE')
  const { count: hadirHadir } = await supabaseAdmin
    .from('absensi')
    .select('*', { count: 'exact', head: true })
    .eq('tanggal', today)
    .eq('input_by', 'QR Mandiri')
    .eq('status', 'Hadir')
  const { count: totalScan } = await supabaseAdmin
    .from('absensi')
    .select('*', { count: 'exact', head: true })
    .eq('tanggal', today)
    .eq('input_by', 'QR Mandiri')
  return { hadirHadir: hadirHadir || 0, totalScan: totalScan || 0 }
}