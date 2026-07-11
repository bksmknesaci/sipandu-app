'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function logActivity(adminId, activity, detail) {
  await supabaseAdmin.from('effective_day_logs').insert({
    admin_id: adminId,
    activity: activity,
    detail: detail
  })
}

// ── OPTIMASI: Cache 10 menit — stats jarang berubah ──
export async function getEffectiveDaysStats() {
  return getCached('effective_days_stats', async () => {
    const { data: holidays } = await supabaseAdmin.from('effective_days').select('category, date')
    const { data: calendar } = await supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).maybeSingle()

    const countCat = (cat) => holidays?.filter(h => h.category === cat).length || 0

    const totalNasional = countCat('Nasional')
    const totalSekolah = countCat('Sekolah')
    const totalSemester = countCat('Semester')
    const totalUjian = countCat('Ujian')
    const totalKegiatan = countCat('Kegiatan Sekolah')
    const totalKhusus = countCat('Khusus')
    const totalNonEfektif = totalNasional + totalSekolah + totalSemester + totalUjian + totalKegiatan + totalKhusus

    let totalEfektif = 0
    if (calendar?.start_date && calendar?.end_date) {
      const holidayDates = new Set((holidays || []).map(h => h.date))
      const start = new Date(calendar.start_date)
      const end = new Date(calendar.end_date)
      const current = new Date(start)

      // Hitung hanya weekday (Senin-Jumat) yang BUKAN hari libur
      while (current <= end) {
        const day = current.getDay()
        if (day !== 0 && day !== 6) {
          const dateStr = current.toLocaleDateString('sv-SE')
          if (!holidayDates.has(dateStr)) {
            totalEfektif++
          }
        }
        current.setDate(current.getDate() + 1)
      }
    }

    return {
      totalEfektif, totalNonEfektif,
      totalNasional, totalSekolah, totalSemester, totalUjian, totalKegiatan, totalKhusus,
      calendar
    }
  }, TTL.HARI_EFEKTIF);
}

// ── OPTIMASI: Cache 10 menit — data libur jarang berubah ──
export async function getHolidays() {
  return getCached('holidays_all_list', async () => {
    const { data, error } = await supabaseAdmin
      .from('effective_days')
      .select('*')
      .order('date', { ascending: true })

    if (error) return []
    return data
  }, TTL.HARI_EFEKTIF);
}

// Write operations — TIDAK di-cache
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

  // Invalidate cache setelah insert ATAU update — gunakan prefix agar semua bulan ter-clear
  invalidateCacheByPrefix('holidays_');
  invalidateCacheByPrefix('effective_days_stats');

  return { success: true }
}

export async function deleteHoliday(id) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  const { data: oldData } = await supabaseAdmin.from('effective_days').select('*').eq('id', id).maybeSingle()
  const { error } = await supabaseAdmin.from('effective_days').delete().eq('id', id)
  if (error) return { error: error.message }

  // Invalidate cache setelah hapus
  invalidateCacheByPrefix('holidays_');
  invalidateCacheByPrefix('effective_days_stats');

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

  // Invalidate stats cache saat kalender berubah
  invalidateCacheByPrefix('effective_days_stats');

  return { success: true }
}

export async function getActivityLogs() {
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

  // Invalidate semua cache libur
  invalidateCacheByPrefix('holidays_');
  invalidateCacheByPrefix('effective_days_stats');

  // Hapus semua hari libur
  const { error } = await supabaseAdmin.from('effective_days').delete().neq('id', 0)
  if (error) return { error: error.message }

  // Hapus semua riwayat aktivitas
  await supabaseAdmin.from('effective_day_logs').delete().neq('id', 0)

  return { success: true }
}

// ═══════════════════════════════════════════════════════════════
// IMPORT CSV — Batch insert + 1x cache invalidation
// ═══════════════════════════════════════════════════════════════
export async function importCSVEffectiveDays(rows) {
  if (!rows || rows.length === 0) {
    return { success: false, error: 'Tidak ada data untuk diimport' }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  // Validasi & bersihkan data
  const validRows = rows
    .filter(r => r.date && r.holiday_name && r.category)
    .map(r => ({
      date: r.date,
      holiday_name: r.holiday_name,
      category: r.category,
      description: r.description || null,
      created_by: adminId,
    }))

  if (validRows.length === 0) {
    return { success: false, error: 'Tidak ada data valid dalam file CSV' }
  }

  // Coba batch insert (1 query untuk semua row)
  const { data, error } = await supabaseAdmin
    .from('effective_days')
    .insert(validRows)
    .select()

  let successCount = 0
  let errorCount = 0

  if (error) {
    // Fallback: insert satu per satu jika batch gagal (misal constraint violation per row)
    for (const row of validRows) {
      const { error: singleError } = await supabaseAdmin.from('effective_days').insert(row)
      if (singleError) {
        console.warn('[importCSV] Gagal insert row:', row.date, singleError.message)
        errorCount++
      } else {
        successCount++
      }
    }
  } else {
    successCount = validRows.length
  }

  // Invalidate cache sekali di akhir — gunakan prefix agar semua bulan ter-clear
  invalidateCacheByPrefix('holidays_');
  invalidateCacheByPrefix('effective_days_stats');

  // Log aktivitas sekali
  await logActivity(adminId, 'Import CSV Hari Libur', {
    total: validRows.length,
    success: successCount,
    error: errorCount,
  })

  return { success: true, successCount, errorCount }
}