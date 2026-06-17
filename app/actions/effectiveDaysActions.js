'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function logActivity(adminId, activity, detail) {
  await supabaseAdmin.from('effective_day_logs').insert({
    admin_id: adminId,
    activity: activity,
    detail: detail
  })
}

export async function getEffectiveDaysStats() {
  const { data: holidays } = await supabaseAdmin.from('effective_days').select('category, date')
  
  // Perbaikan: Gunakan maybeSingle() agar tidak error jika tabel kosong
  const { data: calendar } = await supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).maybeSingle()

  const totalLiburNasional = holidays?.filter(h => h.category === 'Nasional').length || 0
  const totalLiburSekolah = holidays?.filter(h => h.category !== 'Nasional').length || 0
  const totalNonEfektif = totalLiburNasional + totalLiburSekolah

  let totalEfektif = 0
  if (calendar?.start_date && calendar?.end_date) {
    const start = new Date(calendar.start_date)
    const end = new Date(calendar.end_date)
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    totalEfektif = days - totalNonEfektif
  }

  return { totalEfektif, totalLiburNasional, totalLiburSekolah, totalNonEfektif, calendar }
}

export async function getHolidays() {
  const { data, error } = await supabaseAdmin
    .from('effective_days')
    .select('*')
    .order('date', { ascending: true })
  
  if (error) return []
  return data
}

export async function saveHoliday(formData) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  const id = formData.get('id')
  const date = formData.get('date')
  const holiday_name = formData.get('holiday_name')
  const category = formData.get('category')
  const description = formData.get('description')

  if (id) {
    const { data, error } = await supabaseAdmin.from('effective_days').update({ date, holiday_name, category, description, updated_at: new Date() }).eq('id', id).select().single()
    if (error) return { error: error.message }
    await logActivity(adminId, 'Edit Hari Libur', { id, date, holiday_name })
  } else {
    const { data, error } = await supabaseAdmin.from('effective_days').insert({ date, holiday_name, category, description, created_by: adminId }).select().single()
    if (error) return { error: error.message }
    await logActivity(adminId, 'Tambah Hari Libur', { date, holiday_name })
  }
  return { success: true }
}

export async function deleteHoliday(id) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  const { data: oldData } = await supabaseAdmin.from('effective_days').select('*').eq('id', id).maybeSingle()
  const { error } = await supabaseAdmin.from('effective_days').delete().eq('id', id)
  if (error) return { error: error.message }
  
  await logActivity(adminId, 'Hapus Hari Libur', { oldData })
  return { success: true }
}

export async function getAcademicCalendar() {
  const { data, error } = await supabaseAdmin.from('academic_calendar').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function saveAcademicCalendar(formData) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  const id = formData.get('id')
  const school_year = formData.get('school_year')
  const semester = formData.get('semester')
  const start_date = formData.get('start_date') || null
  const end_date = formData.get('end_date') || null
  const pas_date = formData.get('pas_date') || null
  const pat_date = formData.get('pat_date') || null
  const pkl_date = formData.get('pkl_date') || null
  const mpls_date = formData.get('mpls_date') || null
  const semester_break_date = formData.get('semester_break_date') || null
  const is_active = formData.get('is_active') === 'true'

  if (is_active) {
    await supabaseAdmin.from('academic_calendar').update({ is_active: false }).neq('id', id || 0)
  }

  if (id) {
    const { error } = await supabaseAdmin.from('academic_calendar').update({ school_year, semester, start_date, end_date, pas_date, pat_date, pkl_date, mpls_date, semester_break_date, is_active }).eq('id', id)
    if (error) return { error: error.message }
    await logActivity(adminId, 'Edit Kalender Pendidikan', { school_year, semester })
  } else {
    const { error } = await supabaseAdmin.from('academic_calendar').insert({ school_year, semester, start_date, end_date, pas_date, pat_date, pkl_date, mpls_date, semester_break_date, is_active })
    if (error) return { error: error.message }
    await logActivity(adminId, 'Tambah Kalender Pendidikan', { school_year, semester })
  }
  return { success: true }
}

export async function getActivityLogs() {
  // Hapus join ke tabel users karena tidak ada Foreign Key bawaan
  const { data, error } = await supabaseAdmin
    .from('effective_day_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error("Error fetching logs:", error.message)
    return []
  }
  return data
}

export async function resetAllEffectiveDays() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  // Hapus semua data di tabel effective_days
  const { error } = await supabaseAdmin.from('effective_days').delete().neq('id', 0)
  if (error) return { error: error.message }
  
  await logActivity(adminId, 'Hapus Semua Hari Libur', { message: 'Seluruh data hari libur dihapus permanen' })
  return { success: true }
}