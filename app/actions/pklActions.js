'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL } from '@/lib/cacheHelpers'

const LATE_TOLERANCE_MINUTES = 15
const CHECKIN_EARLY_MIN = 60
const CHECKIN_LATE_MIN = 180
const CHECKOUT_EARLY_MIN = 60
const CHECKOUT_LATE_MIN = 120
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const STATUS_CFG = {
  Hadir: { label: 'H', color: '#10B981', bg: '#D1FAE5' },
  Sakit: { label: 'S', color: '#F59E0B', bg: '#FEF3C7' },
  Izin: { label: 'I', color: '#3B82F6', bg: '#DBEAFE' },
  Alpha: { label: 'A', color: '#EF4444', bg: '#FEE2E2' },
  Terlambat: { label: 'T', color: '#F97316', bg: '#FFF7ED' },
  Libur: { label: 'L', color: '#6B7280', bg: '#F3F4F6' },
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeToMin(t) {
  if (!t) return 0
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}

function getWIBDate() { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) }
function getWIBTime() { return new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }) }

function isWorkDay(dateStr, workDays) {
  if (!workDays || !Array.isArray(workDays)) return false
  const d = new Date(dateStr + 'T00:00:00')
  return workDays.includes(DAY_NAMES[d.getDay()])
}

function base64ToBuffer(b64) {
  const data = b64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(data, 'base64')
}

// ═════════════════ PROFILE ═════════════════

export async function searchStudentForPkl(nisn) {
  const trimmed = (nisn || '').trim()
  if (!trimmed) return { error: 'NISN tidak boleh kosong' }
  let { data, error } = await supabaseAdmin.from('siswa').select('*').eq('nisn', trimmed).maybeSingle()
  if (!data) {
    const { data: d2 } = await supabaseAdmin.from('siswa').select('*').eq('nis', trimmed).maybeSingle()
    if (d2) { data = d2; error = null }
  }
  if (error) return { error: error.message }
  if (!data) return { error: 'NISN tidak ditemukan dalam database' }
  if (!data.nisn && data.nis) data.nisn = data.nis
  const { data: profile } = await supabaseAdmin.from('pkl_profiles').select('*').eq('student_id', data.id).maybeSingle()
  return { student: data, profile }
}

/**
 * Data lengkap siswa + profil PKL + attendance hari ini
 * Jika NISN belum terdaftar, otomatis buat data siswa minimal
 */
export async function getPklStudentData(nisn) {
  const trimmed = (nisn || '').trim()
  if (!trimmed) return { error: 'NISN tidak boleh kosong' }

  // 1. Cari siswa
  let { data: siswa, error: errSiswa } = await supabaseAdmin
    .from('siswa')
    .select('id, nisn, nama, kelas, jurusan, jenis_kelamin, status')
    .eq('nisn', trimmed)
    .maybeSingle()

  if (!siswa) {
    const { data: d2 } = await supabaseAdmin
      .from('siswa')
      .select('id, nisn, nama, kelas, jurusan, jenis_kelamin, status')
      .eq('nis', trimmed)
      .maybeSingle()
    if (d2) { siswa = d2; errSiswa = null }
  }

  // 2. Jika tidak ditemukan, buat data siswa baru (minimal: NISN saja)
  if (!siswa) {
    const { data: newSiswa, error: insertErr } = await supabaseAdmin
      .from('siswa')
      .insert([{ nisn: trimmed, nama: null, kelas: null, jurusan: null, status: 'Aktif', jenis_kelamin: null }])
      .select('id, nisn, nama, kelas, jurusan, jenis_kelamin, status')
      .single()
    if (insertErr) return { error: 'Gagal mendaftarkan NISN. Silakan coba lagi.' }
    siswa = newSiswa
  }

  if (errSiswa) return { error: errSiswa.message }
  if (!siswa.nisn && siswa.nis) siswa.nisn = siswa.nis

  // 3. Ambil profil PKL + auto-update status
  const { data: profile, error: errProfile } = await supabaseAdmin
    .from('pkl_profiles')
    .select('*')
    .eq('student_id', siswa.id)
    .maybeSingle()

  if (errProfile) return { error: errProfile.message }
  if (!profile) return { error: 'NO_PROFILE', student: siswa } // Sinyal khusus: siswa ada tapi belum punya profil

  // Auto-update status berdasarkan tanggal
  const today = getWIBDate()
  let ns = profile.status
  if (profile.start_date && profile.end_date) {
    if (today < profile.start_date && ns !== 'Belum Mulai') ns = 'Belum Mulai'
    else if (today >= profile.start_date && today <= profile.end_date && ns !== 'Berjalan') ns = 'Berjalan'
    else if (today > profile.end_date && ns !== 'Selesai') ns = 'Selesai'
  }
  if (ns !== profile.status) {
    await supabaseAdmin.from('pkl_profiles').update({ status: ns, updated_at: new Date().toISOString() }).eq('student_id', siswa.id)
    profile.status = ns
  }

  // 4. Ambil attendance hari ini
  const { data: todayAtt } = await supabaseAdmin
    .from('pkl_attendance')
    .select('*')
    .eq('student_id', siswa.id)
    .eq('attendance_date', today)
    .maybeSingle()

  return {
    student: siswa,
    profile: profile,
    todayAttendance: todayAtt || null
  }
}

export async function savePklProfile(d) {
  const today = getWIBDate()
  let status = 'Belum Mulai'
  if (d.start_date && d.end_date) {
    if (today >= d.start_date && today <= d.end_date) status = 'Berjalan'
    else if (today > d.end_date) status = 'Selesai'
  }
  const row = {
    student_id: d.student_id,
    company_name: d.company_name || null,
    company_address: d.company_address || null,
    industry_supervisor: d.industry_supervisor || null,
    guru_pembimbing: d.guru_pembimbing || null,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    work_start_time: d.work_start_time || null,
    work_end_time: d.work_end_time || null,
    work_days: d.work_days || ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    latitude: d.latitude ? parseFloat(d.latitude) : null,
    longitude: d.longitude ? parseFloat(d.longitude) : null,
    radius_meter: 50,
    status,
    updated_at: new Date().toISOString(),
  }
  const { data: ex } = await supabaseAdmin.from('pkl_profiles').select('id').eq('student_id', d.student_id).maybeSingle()
  let res
  if (ex) {
    res = await supabaseAdmin.from('pkl_profiles').update(row).eq('student_id', d.student_id).select().single()
  } else {
    res = await supabaseAdmin.from('pkl_profiles').insert([row]).select().single()
  }
  if (res.error) return { error: res.error.message }

  // Update data siswa jika ada (untuk siswa yang baru terdaftar)
  if (d.student_nama || d.student_kelas || d.student_jurusan || d.student_jenis_kelamin) {
    const studentUpdate = {}
    if (d.student_nama) studentUpdate.nama = d.student_nama
    if (d.student_kelas) studentUpdate.kelas = d.student_kelas
    if (d.student_jurusan) studentUpdate.jurusan = d.student_jurusan
    if (d.student_jenis_kelamin) studentUpdate.jenis_kelamin = d.student_jenis_kelamin
    await supabaseAdmin.from('siswa').update(studentUpdate).eq('id', d.student_id)
  }

  return { success: true, profile: res.data }
}

// ═══════════════════ ATTENDANCE (STUDENT) ═════════════════

export async function getTodayPklAttendance(studentId) {
  const today = getWIBDate()
  const { data, error } = await supabaseAdmin.from('pkl_attendance').select('*').eq('student_id', studentId).eq('attendance_date', today).maybeSingle()
  if (error) return { error: error.message }
  return { attendance: data }
}

export async function submitPklCheckIn({ studentId, profile, photoBase64, latitude, longitude, address }) {
  const now = getWIBTime()
  const ws = profile.work_start_time
  if (!ws) return { error: 'Jam kerja belum diatur di pengaturan PKL' }
  const nowMin = timeToMin(now), startMin = timeToMin(ws)
  if (nowMin < startMin - CHECKIN_EARLY_MIN) return { error: `Terlalu awal. Absensi dibuka ${CHECKIN_EARLY_MIN} menit sebelum ${ws}` }
  if (nowMin > startMin + CHECKIN_LATE_MIN) return { error: `Batas waktu absensi masuk telah lewat (${CHECKIN_LATE_MIN} menit setelah ${ws})` }
  if (profile.latitude && profile.longitude) {
    const dist = haversine(latitude, longitude, profile.latitude, profile.longitude)
    if (dist > 50) return { error: `Anda berada di luar area lokasi PKL. Jarak: ${Math.round(dist)}m (batas: 50m)` }
  }

  const today = getWIBDate()

  const [selfieResult, existingResult] = await Promise.all([
    (async () => {
      if (!photoBase64) return null
      try {
        const buf = base64ToBuffer(photoBase64)
        const fn = `${today}/${studentId}_in_${Date.now()}.jpg`
        const { data: ud } = await supabaseAdmin.storage.from('pkl-selfies').upload(fn, buf, { contentType: 'image/jpeg', upsert: true })
        if (ud) { const { data: pu } = supabaseAdmin.storage.from('pkl-selfies').getPublicUrl(ud.path); return pu.publicUrl }
      } catch (e) { console.error('Upload selfie error:', e) }
      return null
    })(),
    supabaseAdmin.from('pkl_attendance').select('id').eq('student_id', studentId).eq('attendance_date', today).maybeSingle(),
  ])

  if (existingResult.data) return { error: 'Anda sudah melakukan absensi masuk hari ini' }

  const isLate = nowMin > startMin + LATE_TOLERANCE_MINUTES
  const status = isLate ? 'Terlambat' : 'Hadir'
  const { data, error } = await supabaseAdmin.from('pkl_attendance').insert([{
    student_id: studentId, attendance_date: today, attendance_type: 'Hadir',
    check_in_time: now, check_in_latitude: latitude, check_in_longitude: longitude,
    check_in_address: address, selfie_url: selfieResult, is_late: isLate, status,
  }]).select().single()
  if (error) return { error: error.message }
  return { success: true, data, status, isLate }
}

export async function submitPklCheckOut({ studentId, profile, photoBase64, latitude, longitude, address }) {
  const now = getWIBTime()
  const we = profile.work_end_time
  if (!we) return { error: 'Jam pulang belum diatur' }
  const nowMin = timeToMin(now), endMin = timeToMin(we)
  if (nowMin < endMin - CHECKOUT_EARLY_MIN) return { error: `Terlalu awal untuk absen pulang. Dibuka ${CHECKOUT_EARLY_MIN} menit sebelum ${we}` }
  if (nowMin > endMin + CHECKOUT_LATE_MIN) return { error: `Batas waktu absen pulang telah lewat (${CHECKOUT_LATE_MIN} menit setelah ${we})` }
  if (profile.latitude && profile.longitude) {
    const dist = haversine(latitude, longitude, profile.latitude, profile.longitude)
    if (dist > 50) return { error: `Anda berada di luar area lokasi PKL. Jarak: ${Math.round(dist)}m (batas: 50m)` }
  }

  const today = getWIBDate()

  const [selfieResult, existingResult] = await Promise.all([
    (async () => {
      if (!photoBase64) return null
      try {
        const buf = base64ToBuffer(photoBase64)
        const fn = `${today}/${studentId}_out_${Date.now()}.jpg`
        const { data: ud } = await supabaseAdmin.storage.from('pkl-selfies').upload(fn, buf, { contentType: 'image/jpeg', upsert: true })
        if (ud) { const { data: pu } = supabaseAdmin.storage.from('pkl-selfies').getPublicUrl(ud.path); return pu.publicUrl }
      } catch (e) { console.error('Upload selfie error:', e) }
      return null
    })(),
    supabaseAdmin.from('pkl_attendance').select('*').eq('student_id', studentId).eq('attendance_date', today).maybeSingle(),
  ])

  if (existingResult.error) return { error: existingResult.error.message }
  if (!existingResult.data) return { error: 'Anda belum melakukan absensi masuk hari ini' }
  if (existingResult.data.check_out_time) return { error: 'Anda sudah melakukan absensi pulang hari ini' }

  const { data, error } = await supabaseAdmin.from('pkl_attendance').update({
    check_out_time: now, check_out_latitude: latitude, check_out_longitude: longitude,
    check_out_address: address, check_out_selfie_url: selfieResult, updated_at: new Date().toISOString()
  }).eq('id', existingResult.data.id).select().single()
  if (error) return { error: error.message }
  return { success: true, data }
}

export async function submitPklSakitIzin({ studentId, type, photoBase64, note, latitude, longitude }) {
  if (!note || !note.trim()) return { error: 'Alasan wajib diisi untuk sakit/izin' }

  const today = getWIBDate()

  const [selfieResult, existingResult] = await Promise.all([
    (async () => {
      if (!photoBase64) return null
      try {
        const buf = base64ToBuffer(photoBase64)
        const fn = `${today}/${studentId}_${type.toLowerCase()}_${Date.now()}.jpg`
        const { data: ud } = await supabaseAdmin.storage.from('pkl-selfies').upload(fn, buf, { contentType: 'image/jpeg', upsert: true })
        if (ud) { const { data: pu } = supabaseAdmin.storage.from('pkl-selfies').getPublicUrl(ud.path); return pu.publicUrl }
      } catch (e) { console.error('Upload selfie error:', e) }
      return null
    })(),
    supabaseAdmin.from('pkl_attendance').select('id').eq('student_id', studentId).eq('attendance_date', today).maybeSingle(),
  ])

  if (existingResult.data) return { error: 'Anda sudah memiliki catatan absensi hari ini' }

  const { data, error } = await supabaseAdmin.from('pkl_attendance').insert([{
    student_id: studentId, attendance_date: today, attendance_type: type,
    selfie_url: selfieResult, note: note.trim(), status: type,
    check_in_latitude: latitude ? parseFloat(latitude) : null,
    check_in_longitude: longitude ? parseFloat(longitude) : null,
    check_in_address: (latitude && longitude) ? `Lat: ${latitude}, Lng: ${longitude}` : null,
  }]).select().single()
  if (error) return { error: error.message }
  return { success: true, data }
}

// ═══════════════════ REKAP (WK/ADMIN) ═════════════════

export async function getPklFilters() {
  return getCached('pkl_filters', async () => {
    const [profilesRes, siswaRes] = await Promise.all([
      supabaseAdmin.from('pkl_profiles').select('company_name, status'),
      supabaseAdmin.from('siswa').select('kelas, jurusan').not('kelas', 'is', null),
    ])

    const companies = [...new Set((profilesRes.data || []).map(p => p.company_name).filter(Boolean))].sort()
    const statuses = ['Belum Mulai', 'Berjalan', 'Selesai']

    const kelasSet = new Set(), jurusanSet = new Set(), kelasJurusanList = [], kjSet = new Set()
    ;(siswaRes.data || []).forEach(s => {
      if (s.kelas) kelasSet.add(s.kelas.trim())
      if (s.jurusan) jurusanSet.add(s.jurusan.trim())
      if (s.kelas && s.jurusan) {
        const combo = `${s.kelas.trim()} ${s.jurusan.trim()}`
        if (!kjSet.has(combo)) { kjSet.add(combo); kelasJurusanList.push({ kelas: s.kelas.trim(), jurusan: s.jurusan.trim() }) }
      }
    })
    return { companies, statuses, tingkat: [...kelasSet].sort(), jurusan: [...jurusanSet].sort(), kelasJurusanList }
  }, TTL.KELAS_FILTERS)
}

export async function getPklStudents(filters = {}) {
  let query = supabaseAdmin.from('pkl_profiles').select('*')
  if (filters.company) query = query.eq('company_name', filters.company)
  if (filters.status) query = query.eq('status', filters.status)
  query = query.order('id', { ascending: true })
  const { data: profiles, error } = await query
  if (error) { console.error('[getPklStudents]', error.message); return { students: [], error: error.message } }
  if (!profiles || profiles.length === 0) return { students: [] }
  const studentIds = profiles.map(p => p.student_id).filter(Boolean)
  const { data: siswaList } = await supabaseAdmin.from('siswa').select('id, nisn, nama, kelas, jurusan, jenis_kelamin').in('id', studentIds)
  const siswaMap = {}; (siswaList || []).forEach(s => { siswaMap[s.id] = s })
  let students = profiles.map(p => ({ ...p, ...(siswaMap[p.student_id] || {}), student_id: p.student_id }))

  // FIX: Gunakan exact match (===) bukan substring match (.includes())
  if (filters.kelas) students = students.filter(s => (s.kelas || '').trim() === filters.kelas.trim())
  if (filters.jurusan) students = students.filter(s => (s.jurusan || '').trim() === filters.jurusan.trim())

  students.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
  return { students }
}

export async function getPklRekapHarian(date, filters = {}) {
  const { students } = await getPklStudents(filters)
  if (students.length === 0) return { students: [], date }
  const ids = students.map(s => s.student_id)
  const { data: att } = await supabaseAdmin.from('pkl_attendance').select('*').eq('attendance_date', date).in('student_id', ids)
  const attMap = {}
  ;(att || []).forEach(a => { attMap[a.student_id] = a })
  const merged = students.map(s => {
    const a = attMap[s.student_id]
    const wd = s.work_days ? isWorkDay(date, s.work_days) : false
    let status = a ? a.status : (wd ? 'Alpha' : 'Libur')
    if (s.start_date && date < s.start_date) status = '-'
    if (s.end_date && date > s.end_date) status = '-'
    return { ...s, attendance: a, computedStatus: status, isWorkDay: wd }
  })
  return { students: merged, date }
}

export async function getPklRekapBulanan(year, month, filters = {}) {
  const { students } = await getPklStudents(filters)
  if (students.length === 0) return { students: [], year, month, daysInMonth: 0 }
  const daysInMonth = new Date(year, month, 0).getDate()
  const ids = students.map(s => s.student_id)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`
  const { data: att } = await supabaseAdmin.from('pkl_attendance').select('*').gte('attendance_date', startDate).lte('attendance_date', endDate).in('student_id', ids)
  const attMap = {}
  ;(att || []).forEach(a => { attMap[`${a.student_id}_${a.attendance_date}`] = a })
  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  // FIX REALTIME: Ambil tanggal hari ini WIB untuk batasi Alpha hanya sampai hari ini
  const todayStr = getWIBDate()

  const merged = students.map(s => {
    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayName = DAY_NAMES[new Date(ds + 'T00:00:00').getDay()]
      const wd = s.work_days ? s.work_days.includes(dayName) : false
      const inRange = (!s.start_date || ds >= s.start_date) && (!s.end_date || ds <= s.end_date)
      const a = attMap[`${s.student_id}_${ds}`]

      // FIX REALTIME: Alpha hanya dihitung untuk tanggal yang sudah lewat atau hari ini
      // Tanggal masa depan yang belum terjadi tidak langsung di-mark Alpha
      const isPastOrToday = ds <= todayStr

      let status
      if (!inRange) status = null
      else if (a) status = a.status
      else if (wd && isPastOrToday) status = 'Alpha'
      else if (wd) status = null // hari kerja masa depan — belum ada status
      else status = 'Libur'

      days.push({ date: ds, day: d, dayName, isWorkDay: wd, inRange, attendance: a, status, isPastOrToday })
    }
    return { ...s, days }
  })
  return { students: merged, year, month, monthName: monthNames[month], daysInMonth }
}

export async function getPklRekapSemester(filters = {}) {
  const { students } = await getPklStudents(filters)
  if (students.length === 0) return { students: [], semesterInfo: null }
  let startDate, endDate, semesterLabel

  const cal = await getCached('academic_calendar_active', () =>
    supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).maybeSingle()
      .then(r => r.data || null),
    TTL.HARI_EFEKTIF
  )

  if (cal) {
    startDate = cal.start_date; endDate = cal.end_date
    semesterLabel = `${cal.semester} ${cal.school_year}`
  } else {
    const now = new Date(), m = now.getMonth() + 1, y = now.getFullYear()
    if (m >= 7) { startDate = `${y}-07-01`; endDate = `${y + 1}-12-31`; semesterLabel = `Ganjil ${y}/${y + 1}` }
    else { startDate = `${y}-01-01`; endDate = `${y}-06-30`; semesterLabel = `Genap ${y - 1}/${y}` }
  }
  const ids = students.map(s => s.student_id)
  const { data: att } = await supabaseAdmin.from('pkl_attendance').select('*').gte('attendance_date', startDate).lte('attendance_date', endDate).in('student_id', ids)
  const attMap = {}
  ;(att || []).forEach(a => { attMap[`${a.student_id}_${a.attendance_date}`] = a })

  // FIX REALTIME: Alpha semester juga hanya sampai hari ini
  const todayStr = getWIBDate()

  const merged = students.map(s => {
    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Terlambat: 0, Libur: 0 }
    let totalKerja = 0
    const cur = new Date(startDate + 'T00:00:00'), end = new Date(endDate + 'T00:00:00')
    while (cur <= end) {
      const ds = cur.toLocaleDateString('sv-SE')
      const dayName = DAY_NAMES[cur.getDay()]
      const wd = s.work_days ? s.work_days.includes(dayName) : false
      const inRange = (!s.start_date || ds >= s.start_date) && (!s.end_date || ds <= s.end_date)
      if (inRange) {
        if (wd) {
          // FIX REALTIME: hanya hitung hari kerja sampai hari ini
          if (ds <= todayStr) totalKerja++
          const a = attMap[`${s.student_id}_${ds}`]
          if (a) {
            counts[a.status] = (counts[a.status] || 0) + 1
          } else if (ds <= todayStr) {
            counts.Alpha++
          }
          // hari kerja masa depan tanpa record = belum ada status, tidak dihitung
        } else {
          counts.Libur++
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    const hadirTotal = counts.Hadir + counts.Terlambat
    const persentase = totalKerja > 0 ? ((hadirTotal / totalKerja) * 100).toFixed(1) : '0.0'
    return { ...s, ...counts, totalKerja, hadirTotal, persentase }
  })
  return { students: merged, semesterInfo: { startDate, endDate, label: semesterLabel } }
}

export async function getPklStats(filters = {}) {
  const { students } = await getPklStudents(filters)
  const ids = students.map(s => s.student_id)
  const today = getWIBDate()
  const { data: att } = await supabaseAdmin.from('pkl_attendance').select('*').eq('attendance_date', today).in('student_id', ids)
  const stats = { total: students.length, hadir: 0, sakit: 0, izin: 0, alpha: 0, terlambat: 0, libur: 0 }
  const attMap = {}
  ;(att || []).forEach(a => { attMap[a.student_id] = a })
  students.forEach(s => {
    const a = attMap[s.student_id]
    const wd = s.work_days ? isWorkDay(today, s.work_days) : false
    const inRange = (!s.start_date || today >= s.start_date) && (!s.end_date || today <= s.end_date)
    if (!inRange || s.status !== 'Berjalan') return
    if (a) { const key = (a.status || '').toLowerCase(); stats[key] = (stats[key] || 0) + 1 }
    else if (wd) { stats.alpha++ }
    else { stats.libur++ }
  })
  const hadirTotal = stats.hadir + stats.terlambat
  const workDays = stats.hadir + stats.sakit + stats.izin + stats.alpha + stats.terlambat
  stats.persentase = workDays > 0 ? ((hadirTotal / workDays) * 100).toFixed(1) : '0.0'
  return stats
}

export async function getPklAttendanceDetail(id) {
  const { data, error } = await supabaseAdmin.from('pkl_attendance').select('*, siswa:student_id(nisn, nama, kelas, jurusan)').eq('id', id).maybeSingle()
  if (error) return { error: error.message }

  // Ambil profil PKL siswa
  let pklProfile = null
  if (data?.student_id) {
    const { data: profile } = await supabaseAdmin
      .from('pkl_profiles')
      .select('*')
      .eq('student_id', data.student_id)
      .maybeSingle()
    if (profile) pklProfile = profile
  }

  return { detail: { ...data, pklProfile } }
}

// ═══════════════════ MAINTENANCE ═══════════════════

export async function resetAllPklData() {
  const { data: att } = await supabaseAdmin.from('pkl_attendance').select('selfie_url, check_out_selfie_url').not('selfie_url', 'is', null)
  const paths = []
  ;(att || []).forEach(a => {
    const extract = (url) => { const m = url?.match(/\/pkl-selfies\/(.+)/); return m ? m[1] : null }
    const p1 = extract(a.selfie_url), p2 = extract(a.check_out_selfie_url)
    if (p1) paths.push(p1)
    if (p2) paths.push(p2)
  })
  if (paths.length > 0) { try { await supabaseAdmin.storage.from('pkl-selfies').remove(paths) } catch (e) { console.error('Storage cleanup error:', e) } }
  const { error: e1 } = await supabaseAdmin.from('pkl_attendance').delete().neq('id', 0)
  const { error: e2 } = await supabaseAdmin.from('pkl_profiles').delete().neq('id', 0)
  if (e1 || e2) return { error: (e1 || e2).message }
  return { success: true }
}

/**
 * Hapus foto selfie PKL yang sudah > 1 hari
 * - Loop sampai semua record terproses (bukan sekali limit 200)
 * - Hapus file dari Storage bucket 'pkl-selfies'
 * - Set kolom URL menjadi null di database
 */
export async function cleanupOldPklSelfies() {
  try {
    let totalDeleted = 0
    let hasMore = true
    while (hasMore) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 1)
      const { data: old } = await supabaseAdmin.from('pkl_attendance')
        .select('id, selfie_url, check_out_selfie_url')
        .or('selfie_url.is.not.null,check_out_selfie_url.is.not.null')
        .lt('created_at', cutoff.toISOString())
        .limit(200)

      if (!old || old.length === 0) {
        hasMore = false
        break
      }

      const paths = [], ids = []
      old.forEach(r => {
        const ex = (url) => { const m = url?.match(/\/pkl-selfies\/(.+)/); return m ? m[1] : null }
        const p1 = ex(r.selfie_url), p2 = ex(r.check_out_selfie_url)
        if (p1) paths.push(p1)
        if (p2) paths.push(p2)
        if (p1 || p2) ids.push(r.id)
      })

      if (paths.length > 0) {
        try {
          const { error: delErr } = await supabaseAdmin.storage.from('pkl-selfies').remove(paths)
          if (!delErr) totalDeleted += paths.length
        } catch (e) {
          console.error('[cleanupPklSelfies] Storage remove error:', e)
        }
      }

      if (ids.length > 0) {
        await supabaseAdmin.from('pkl_attendance')
          .update({ selfie_url: null, check_out_selfie_url: null })
          .in('id', ids)
      }

      // Jika hasil kurang dari limit, berarti sudah tidak ada lagi
      if (old.length < 200) hasMore = false
    }
    return { deleted: totalDeleted }
  } catch (e) {
    console.error('[cleanupPklSelfies]', e)
    return { deleted: 0 }
  }
}

// ── PKL Student Info untuk Portal Orang Tua & Cari Data Siswa ──
export async function getPklStudentProfile({ studentId }) {
  if (!studentId) return { profile: null, attendance: [], isPkl: false }

  const { data: profile, error } = await supabaseAdmin
    .from('pkl_profiles')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (error || !profile) return { profile: null, attendance: [], isPkl: false }

  const { data: att } = await supabaseAdmin
    .from('pkl_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })
    .limit(60)

  return { profile, attendance: att || [], isPkl: true }
}

// ── Hapus Data PKL Selesai ──
export async function getCompletedPklStudentIds(filters = {}) {
  let query = supabaseAdmin
    .from('pkl_profiles')
    .select('student_id')
    .eq('status', 'Selesai')
  if (filters.company) query = query.ilike('company_name', `%${filters.company}%`)
  if (filters.kelas) query = query.eq('kelas', filters.kelas)
  if (filters.jurusan) query = query.eq('jurusan', filters.jurusan)
  const { data, error } = await query
  if (error) return { ids: [], error: error.message }
  return { ids: (data || []).map(p => p.student_id), error: null }
}

export async function deleteCompletedPklData(filters = {}) {
  const { ids, error: idErr } = await getCompletedPklStudentIds(filters)
  if (idErr || !ids || ids.length === 0) {
    return { error: idErr || 'Tidak ada data PKL Selesai', deleted: 0 }
  }
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    await supabaseAdmin.from('pkl_attendance').delete().in('student_id', batch)
  }
  const { error: pErr } = await supabaseAdmin.from('pkl_profiles').delete().in('student_id', ids)
  if (pErr) return { error: pErr.message, deleted: 0 }
  try { const { invalidateCacheByPrefix } = await import('@/lib/cacheHelpers'); invalidateCacheByPrefix('pkl_') } catch {}
  return { error: null, deleted: ids.length }
}