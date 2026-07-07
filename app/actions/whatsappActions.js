'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, invalidateCache, TTL } from '@/lib/cacheHelpers'

// ─── Cache Keys ────────────────────────────────────────────────
const CACHE_WA_CONFIG = 'whatsapp_config'
const CACHE_WA_SETTINGS = 'wa_school_settings'

// ─── Helper: format nomor HP Indonesia ──────────────────────────
function normalizePhone(phone) {
  if (!phone) return ''
  let p = String(phone).trim().replace(/[^\d+]/g, '')
  if (p.startsWith('+')) p = p.substring(1)
  if (p.startsWith('08')) p = '62' + p.substring(1)
  return p
}

function isValidPhone(phone) {
  const p = normalizePhone(phone)
  return p.startsWith('62') && p.length >= 10 && p.length <= 15
}

function maskToken(token) {
  if (!token) return ''
  if (token.length <= 8) return '••••••••'
  return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4)
}

// ─── Helper: get school settings (cached via getCached) ────────
async function getSchoolSettings() {
  return getCached(CACHE_WA_SETTINGS, async () => {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('nama_sekolah, alamat')
      .eq('id', 1)
      .maybeSingle()

    return {
      nama_sekolah: data?.nama_sekolah || 'SMK Negeri 1 Cikedung',
      alamat: data?.alamat || '',
    }
  }, TTL.SETTINGS)
}

// ─── Helper: get raw config (tanpa mask, untuk internal use) ───
async function getRawWhatsAppConfig() {
  const { data } = await supabaseAdmin
    .from('whatsapp_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  return data
}

// ─── GET CONFIG (token dimask, cached 10 min) ──────────────────
export async function getWhatsAppConfig() {
  return getCached(CACHE_WA_CONFIG, async () => {
    const data = await getRawWhatsAppConfig()

    if (!data) {
      return {
        api_token_masked: '',
        device_id: '',
        sender_name: '',
        mode: 'testing',
        is_connected: false,
        gateway_phone: '',
        device_name: '',
        last_sync_at: null,
        send_alpha: true,
        send_terlambat: false,
        send_pulang_awal: false,
      }
    }

    return {
      api_token_masked: maskToken(data.api_token),
      device_id: data.device_id || '',
      sender_name: data.sender_name || '',
      mode: data.mode || 'testing',
      is_connected: data.is_connected || false,
      gateway_phone: data.gateway_phone || '',
      device_name: data.device_name || '',
      last_sync_at: data.last_sync_at,
      send_alpha: data.send_alpha !== false,
      send_terlambat: data.send_terlambat || false,
      send_pulang_awal: data.send_pulang_awal || false,
    }
  }, TTL.WHATSAPP_CONFIG)
}

// ─── SAVE CONFIG ────────────────────────────────────────────────
export async function saveWhatsAppConfig(formData) {
  const existing = await getRawWhatsAppConfig()
  let token = existing?.api_token || ''

  // Jika field token tidak di-mask (berarti user mengisi baru), gunakan yang baru
  if (formData.api_token && !formData.api_token.includes('•')) {
    token = formData.api_token.trim()
  }

  const upsertData = {
    id: 1,
    api_token: token,
    device_id: formData.device_id || null,
    sender_name: formData.sender_name || null,
    mode: formData.mode || 'testing',
    send_alpha: formData.send_alpha !== false,
    send_terlambat: formData.send_terlambat || false,
    send_pulang_awal: formData.send_pulang_awal || false,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('whatsapp_config')
    .upsert(upsertData, { onConflict: 'id' })

  if (error) return { error: error.message }

  invalidateCache(CACHE_WA_CONFIG)
  return { success: true }
}

// ─── TEST CONNECTION ────────────────────────────────────────────
export async function testWhatsAppConnection() {
  const config = await getRawWhatsAppConfig()

  // Diagnostic 1: Cek apakah token ada di database
  if (!config?.api_token) {
    return {
      success: false,
      error: 'API Token belum tersimpan di database. Pastikan Anda sudah klik "💾 Simpan Konfigurasi" terlebih dahulu SEBELUM "Uji Koneksi".',
      diagnostic: 'TOKEN_KOSONG'
    }
  }

  // Diagnostic 2: Cek panjang token
  if (config.api_token.length < 10) {
    return {
      success: false,
      error: `Token terlalu pendek (${config.api_token.length} karakter). Token Fonnte biasanya 30+ karakter. Pastikan copy-paste lengkap tanpa spasi.`,
      diagnostic: 'TOKEN_PENDEK'
    }
  }

  try {
    const formBody = new FormData()
    // target '0' = tidak mengirim ke siapapun, hanya cek koneksi
    formBody.append('target', '0')
    formBody.append('message', 'SIPANDU Connection Test')
    if (config.device_id) formBody.append('device', config.device_id)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 detik timeout

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': config.api_token },
      body: formBody,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Baca response mentah
    const responseText = await res.text()

    // Coba parse JSON
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      return {
        success: false,
        error: `Fonnte mengembalikan response bukan JSON. HTTP ${res.status}: ${responseText.substring(0, 300)}`,
        diagnostic: `HTTP_${res.status}_NOT_JSON`
      }
    }

    // HTTP 401/403 = Token salah atau expired
    if (res.status === 401 || res.status === 403) {
      await supabaseAdmin.from('whatsapp_config').update({
        is_connected: false, updated_at: new Date().toISOString()
      }).eq('id', 1)
      invalidateCache(CACHE_WA_CONFIG)

      let detail = ''
      if (result?.reason) detail = result.reason
      else if (result?.message) detail = result.message
      else if (result?.error) detail = result.error
      else detail = JSON.stringify(result)

      return {
        success: false,
        error: `Token TIDAK VALID atau SUDAH EXPIRED (HTTP ${res.status}). Silakan copy ulang token baru dari dashboard Fonnte.`,
        detail,
        diagnostic: `TOKEN_INVALID_HTTP_${res.status}`
      }
    }

    // HTTP 400 = Request salah
    if (res.status === 400) {
      let detail = result?.reason || result?.message || result?.error || JSON.stringify(result)
      return {
        success: false,
        error: `Request tidak valid (HTTP 400): ${detail}`,
        diagnostic: 'HTTP_400'
      }
    }

    // HTTP 429 = Rate limit
    if (res.status === 429) {
      return {
        success: false,
        error: 'Terlalu banyak request ke Fonnte. Tunggu 1-2 menit lalu coba lagi.',
        diagnostic: 'HTTP_429_RATE_LIMIT'
      }
    }

    // HTTP 500+ = Error server Fonnte
    if (res.status >= 500) {
      return {
        success: false,
        error: `Server Fonnte sedang bermasalah (HTTP ${res.status}). Coba lagi beberapa menit.`,
        detail: responseText.substring(0, 200),
        diagnostic: `HTTP_${res.status}_SERVER_ERROR`
      }
    }

    // Bukan 200 = Gagal
    if (res.status !== 200) {
      return {
        success: false,
        error: `Gagal terhubung (HTTP ${res.status}). Response: ${responseText.substring(0, 300)}`,
        diagnostic: `HTTP_${res.status}`
      }
    }

    // HTTP 200 = BERHASIL
    const updateData = {
      is_connected: true,
      updated_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
    }
    if (result?.device?.name) updateData.device_name = result.device.name
    if (result?.device?.phone) updateData.gateway_phone = result.device.phone

    await supabaseAdmin.from('whatsapp_config').update(updateData).eq('id', 1)
    invalidateCache(CACHE_WA_CONFIG)

    return {
      success: true,
      message: 'API berhasil terhubung!',
      detail: result?.device?.phone
        ? `Device: ${result.device.name || '-'} | Nomor: ${result.device.phone}`
        : `Device: ${result.device?.name || '-'}`
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Koneksi ke Fonnte timeout setelah 15 detik. Pastikan server Vercel bisa mengakses api.fonnte.com (bisa diblokir firewall).',
        diagnostic: 'TIMEOUT_15S'
      }
    }
    return {
      success: false,
      error: `Koneksi gagal: ${err.message}. Pastikan tidak ada firewall yang memblokir akses dari server ke api.fonnte.com.`,
      diagnostic: 'FETCH_ERROR'
    }
  }
}

// ─── GET ALPHA STUDENTS WITH PARENT WA (1 query join) ──────────
export async function getAlphaStudentsForWA(date, tingkat, jurusan) {
  // Single query: INNER JOIN absensi → siswa, filter Alpha + parent_whatsapp not null
  // Filter tingkat/jurusan di DB level (bukan di JS) — lebih efisien untuk dataset besar
  let query = supabaseAdmin
    .from('absensi')
    .select('siswa_id, siswa!inner(id, nisn, nama, kelas, jurusan, parent_whatsapp)')
    .eq('tanggal', date)
    .eq('status', 'Alpha')
    .not('siswa.parent_whatsapp', 'is', null)

  if (tingkat) {
    query = query.eq('siswa.kelas', tingkat)
  }
  if (jurusan) {
    query = query.eq('siswa.jurusan', jurusan)
  }

  const { data } = await query

  if (!data || data.length === 0) {
    return { students: [], total: 0 }
  }

  const students = data.map(a => {
    const s = a.siswa
    return {
      id: s.id,
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas,
      jurusan: s.jurusan,
      phone: normalizePhone(s.parent_whatsapp),
      phoneValid: isValidPhone(s.parent_whatsapp),
    }
  })

  return { students, total: students.length }
}

// ─── EXECUTE SEND WA (batch log insert) ────────────────────────
export async function executeSendWA(students, date, senderId) {
  // 1. Ambil config (raw, tanpa cache — perlu token asli)
  const config = await getRawWhatsAppConfig()

  if (!config?.api_token) {
    return { error: 'API Token WhatsApp belum diatur. Buka Konfigurasi WhatsApp di Pengaturan.' }
  }

  // 2. Ambil info sekolah (cached via getCached)
  const settings = await getSchoolSettings()
  const schoolName = settings.nama_sekolah
  const schoolAddr = settings.alamat

  // 3. Format tanggal
  const tanggalDisplay = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const results = []
  let successCount = 0
  let failCount = 0
  const logEntries = [] // Kumpulkan, lalu insert 1x di akhir

  for (const student of students) {
    if (!student.phoneValid) {
      results.push({
        ...student,
        status: 'failed',
        error: 'Nomor tidak valid',
        logId: null,
      })
      logEntries.push({
        student_id: student.id,
        phone: student.phone,
        message: '',
        status: 'failed',
        response: 'Nomor tidak valid',
        sent_by: senderId,
        sent_at: new Date().toISOString(),
        retry_count: 0,
      })
      failCount++
      continue
    }

    const fullKelas = `${student.kelas} ${student.jurusan}`.trim()
    const message = `Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Orang Tua/Wali dari:

🎓 *${student.nama}*

Kelas: *${fullKelas}*

Berdasarkan data absensi SIPANDU pada hari ini:

📅 Tanggal: ${tanggalDisplay}

Ananda tercatat:

❌ **ALPHA / TIDAK HADIR TANPA KETERANGAN**

Apabila terjadi kesalahan data atau terdapat alasan tertentu, mohon segera menghubungi Wali Kelas.

Terima kasih atas perhatian dan kerja samanya.

Hormat kami,
*${schoolName}*
-----------------------------------

_Info selengkapnya di Aplikasi *SIPANDU*_ :
🌐 https://sipandu-nesaci.vercel.app/
_(Sistem Informasi dan Penanganan Siswa Terpadu)_`

    try {
      const formBody = new FormData()
      formBody.append('target', student.phone)
      formBody.append('message', message)
      if (config.device_id) formBody.append('device', config.device_id)
      if (config.sender_name) formBody.append('senderName', config.sender_name)

      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': config.api_token },
        body: formBody,
      })

      const result = await res.json()
      const isSuccess = result?.status === true

      results.push({
        ...student,
        status: isSuccess ? 'success' : 'failed',
        error: isSuccess ? null : (result?.reason || 'Gagal mengirim'),
        logId: null, // Diisi setelah batch insert
      })

      logEntries.push({
        student_id: student.id,
        phone: student.phone,
        message,
        status: isSuccess ? 'success' : 'failed',
        response: JSON.stringify(result),
        sent_by: senderId,
        sent_at: new Date().toISOString(),
        retry_count: 0,
      })

      if (isSuccess) successCount++
      else failCount++
    } catch (err) {
      results.push({
        ...student,
        status: 'failed',
        error: err.message,
        logId: null,
      })
      logEntries.push({
        student_id: student.id,
        phone: student.phone,
        message,
        status: 'failed',
        response: err.message,
        sent_by: senderId,
        sent_at: new Date().toISOString(),
        retry_count: 0,
      })
      failCount++
    }
  }

  // Batch insert semua log dalam 1 query (sebelumnya: N query terpisah)
  if (logEntries.length > 0) {
    const { data: insertedLogs } = await supabaseAdmin
      .from('whatsapp_logs')
      .insert(logEntries)
      .select('id')

    // Map log ID kembali ke results (order preserved oleh Supabase insert)
    if (insertedLogs) {
      for (let i = 0; i < results.length; i++) {
        results[i].logId = insertedLogs[i]?.id || null
      }
    }
  }

  // Update last sync
  await supabaseAdmin.from('whatsapp_config').update({
    last_sync_at: new Date().toISOString(),
  }).eq('id', 1)

  return {
    results,
    summary: { total: students.length, success: successCount, failed: failCount },
  }
}

// ─── GET WHATSAPP LOGS ─────────────────────────────────────────
export async function getWhatsAppLogs({ page = 1, limit = 20, status, search, dateFrom, dateTo }) {
  let query = supabaseAdmin
    .from('whatsapp_logs')
    .select('*, siswa(nama, kelas, jurusan)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (search) {
    // Escape wildcard ILIKE (%) dan (_) untuk mencegah pattern injection
    const safeSearch = search.replace(/[%_]/g, '\\$&')
    query = query.or(`phone.ilike.%${safeSearch}%,siswa.nama.ilike.%${safeSearch}%`)
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom + 'T00:00:00')
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59')
  }

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) return { error: error.message, data: [], total: 0 }

  return {
    data: (data || []).map(log => ({
      ...log,
      siswa_nama: log.siswa?.nama || '-',
      siswa_kelas: log.siswa?.kelas || '-',
      siswa_jurusan: log.siswa?.jurusan || '-',
    })),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

// ─── RETRY FAILED LOG (parallel queries) ───────────────────────
export async function retryWhatsAppLog(logId) {
  // Ambil log + config secara paralel (sebelumnya 2 query sequential)
  const [logResult, configResult] = await safeParallel([
    supabaseAdmin.from('whatsapp_logs').select('*').eq('id', logId).single(),
    supabaseAdmin.from('whatsapp_config').select('*').eq('id', 1).maybeSingle(),
  ])

  const log = logResult?.data
  const config = configResult?.data

  if (!log) return { error: 'Log tidak ditemukan' }
  if (log.status === 'success') return { error: 'Log sudah berhasil, tidak perlu retry' }
  if (!config?.api_token) return { error: 'API Token belum diatur' }

  try {
    const formBody = new FormData()
    formBody.append('target', log.phone)
    formBody.append('message', log.message || 'Pesan retry dari SIPANDU')
    if (config.device_id) formBody.append('device', config.device_id)
    if (config.sender_name) formBody.append('senderName', config.sender_name)

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': config.api_token },
      body: formBody,
    })

    const result = await res.json()
    const isSuccess = result?.status === true

    await supabaseAdmin.from('whatsapp_logs').update({
      status: isSuccess ? 'success' : 'failed',
      response: JSON.stringify(result),
      sent_at: new Date().toISOString(),
      retry_count: (log.retry_count || 0) + 1,
    }).eq('id', logId)

    if (isSuccess) return { success: true }
    return { error: result?.reason || 'Gagal mengirim ulang' }
  } catch (err) {
    await supabaseAdmin.from('whatsapp_logs').update({
      status: 'failed',
      response: err.message,
      retry_count: (log.retry_count || 0) + 1,
    }).eq('id', logId)
    return { error: err.message }
  }
}

// ─── DELETE ALL WA LOGS ───────────────────────────────────────
export async function deleteAllWALogs() {
  const { error } = await supabaseAdmin
    .from('whatsapp_logs')
    .delete()
    .gte('id', 0)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── GET TODAY STATS (parallel head:true) ──────────────────────
export async function getWhatsAppTodayStats() {
  const today = new Date().toLocaleDateString('sv-SE')
  const startOfDay = today + 'T00:00:00'
  const endOfDay = today + 'T23:59:59'

  // 3 count query paralel (sebelumnya 3 sequential, sekarang sama waktu)
  const [successRes, failedRes, pendingRes] = await Promise.all([
    supabaseAdmin.from('whatsapp_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay),
    supabaseAdmin.from('whatsapp_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay),
    supabaseAdmin.from('whatsapp_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay),
  ])

  return {
    success: successRes?.count || 0,
    failed: failedRes?.count || 0,
    pending: pendingRes?.count || 0,
  }
}