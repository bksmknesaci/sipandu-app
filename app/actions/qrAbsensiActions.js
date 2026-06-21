'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getQRSettings() {
  const { data, error } = await supabaseAdmin.from('qr_settings').select('*')
  if (error) return { settings: {} }
  const settings = {}
  ;(data || []).forEach(row => { settings[row.setting_key] = row.setting_value })
  return { settings }
}

export async function saveQRSettings(settingsObj) {
  const upserts = Object.entries(settingsObj).map(([key, value]) => ({
    setting_key: key,
    setting_value: value === null || value === undefined ? null : String(value),
    updated_at: new Date().toISOString()
  }))
  const { error } = await supabaseAdmin.from('qr_settings').upsert(upserts, { onConflict: 'setting_key' })
  if (error) return { error: error.message }
  return { success: true }
}