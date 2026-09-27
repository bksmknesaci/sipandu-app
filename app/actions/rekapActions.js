'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getHolidays } from '@/app/actions/effectiveDaysActions'

// ============================
// HELPER: Cek apakah tanggal adalah hari efektif
// ============================
async function isEffectiveDay(dateStr) {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  if (day === 0 || day === 6) return false
  const holidays = await getHolidays()
  return !holidays.some(h => h.date === dateStr)
}

// ============================
// GET REKAP KEHADIRAN
// ============================
export async function getRekapKehadiran({ date, tingkat, jurusan, userRole, userId }) {
  let studentQuery = supabaseAdmin.from('siswa').select('*').eq('status', 'Aktif');

  if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
  if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);

  if (userRole === 'Wali Kelas' && !tingkat && userId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('kelas, jurusan')
      .eq('id', userId)
      .maybeSingle()
    if (userData) {
      if (userData.kelas) studentQuery = studentQuery.eq('kelas', userData.kelas.trim())
      if (userData.jurusan) studentQuery = studentQuery.eq('jurusan', userData.jurusan.trim())
    }
  }

  const { data: students, error: studentError } = await studentQuery.order('nama', { ascending: true });
  if (studentError) return { error: studentError.message };
  if (!students || students.length === 0) return { students: [], attendance: [] };

  const studentIds = students.map(s => s.id);

  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7));
  const academicStartYear = month >= 7 ? year : year - 1;
  const startDate = `${academicStartYear}-07-01`;
  const endDate = `${academicStartYear + 1}-06-30`;

  // ── FIX: BATAS 1000 BARIS POSTGREST (akar masalah Rekap salah Alpha) ──
  // Supabase memotong hasil query pada 1000 baris TANPA error.
  // 1 kelas × 1 tahun ajaran = ribuan baris → record siswa bagian akhir
  // terpotong diam-diam → Rekap menganggap mereka belum di-absen → Alpha.
  // (Halaman Absensi Kelas tampil benar karena hanya mengambil 1 tanggal.)
  // Solusi: ambil bertahap 1000 baris per batch + ORDER BY id agar urutan
  // antar-batch stabil (WAJIB — tanpa ORDER BY, baris bisa terlewat/ganda).
  let absensi = [];
  let absensiError = null;
  const BATCH_SIZE = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('absensi')
      .select('*')
      .in('siswa_id', studentIds)
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('id', { ascending: true })
      .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

    if (error) { absensiError = error; break; }
    absensi = [...absensi, ...(data || [])];
    hasMore = (data || []).length === BATCH_SIZE;
    page++;
  }

  if (absensiError) return { error: absensiError.message };

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  if (date === today && currentHour >= 14) {
    const todayIsEffective = await isEffectiveDay(today);

if (absentStudents.length > 0) {
  const alphaInserts = absentStudents.map(s => ({
    siswa_id: s.id,
    tanggal: today,
    status: 'Alpha',
    input_by: 'Sistem Otomatis',
    locked: true
  }));

  // Ambil baris yang baru di-insert — TANPA re-fetch satu tahun penuh
  const { data: insertedAlphas } = await supabaseAdmin
    .from('absensi')
    .upsert(alphaInserts, { onConflict: 'siswa_id,tanggal', ignoreDuplicates: true })
    .select('id, siswa_id, tanggal, status, input_by, locked, created_at, updated_at');

  if (insertedAlphas && insertedAlphas.length > 0) {
    absensi = [...(absensi || []), ...insertedAlphas];
  }
} else {
      const { data: wrongAlphas } = await supabaseAdmin
        .from('absensi')
        .select('id')
        .eq('tanggal', today)
        .eq('status', 'Alpha')
        .eq('input_by', 'Sistem Otomatis');

      if (wrongAlphas && wrongAlphas.length > 0) {
  const wrongIds = wrongAlphas.map(a => a.id);
  await supabaseAdmin.from('absensi').delete().in('id', wrongIds);

  // Hapus lokal — TANPA re-fetch satu tahun penuh
  const wrongIdSet = new Set(wrongIds);
  absensi = (absensi || []).filter(a => !wrongIdSet.has(a.id));
}
    }
  }

  return { students, attendance: absensi || [] };
}

// ============================
// GET FILTER OPTIONS
// ============================
export async function getFilterOptions() {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('kelas, jurusan')
    .eq('status', 'Aktif')

  if (error) return { kelas: [], jurusan: [] }
  const kelas = [...new Set(data.map(s => s.kelas).filter(Boolean))].sort()
  const jurusan = [...new Set(data.map(s => s.jurusan).filter(Boolean))].sort()
  return { kelas, jurusan }
}

// ============================
// RESET SEMESTER ABSENSI
// ============================
export async function resetSemesterAbsensi({ date, tingkat, jurusan, userRole, userId }) {
  let studentQuery = supabaseAdmin.from('siswa').select('id').eq('status', 'Aktif');

  if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
  if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);

  if (userRole === 'Wali Kelas' && !tingkat && userId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('kelas, jurusan')
      .eq('id', userId)
      .maybeSingle()
    if (userData) {
      if (userData.kelas) studentQuery = studentQuery.eq('kelas', userData.kelas.trim())
      if (userData.jurusan) studentQuery = studentQuery.eq('jurusan', userData.jurusan.trim())
    }
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) return { error: 'Tidak ada siswa' };

  const studentIds = students.map(s => s.id);
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7));
  const academicStartYear = month >= 7 ? year : year - 1;

  let startDate, endDate;
  if (month >= 7) {
    startDate = `${academicStartYear}-07-01`;
    endDate = `${academicStartYear}-12-31`;
  } else {
    startDate = `${academicStartYear + 1}-01-01`;
    endDate = `${academicStartYear + 1}-06-30`;
  }

  const { error } = await supabaseAdmin
    .from('absensi')
    .delete()
    .in('siswa_id', studentIds)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (error) return { error: error.message };
  return { success: true };
}

// ============================
// RESET SEMUA ABSENSI (TAHUNAN)
// ============================
export async function resetAllAbsensi({ tingkat, jurusan, userRole, userId }) {
  let studentQuery = supabaseAdmin.from('siswa').select('id').eq('status', 'Aktif');

  if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
  if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);

  if (userRole === 'Wali Kelas' && !tingkat && userId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('kelas, jurusan')
      .eq('id', userId)
      .maybeSingle()
    if (userData) {
      if (userData.kelas) studentQuery = studentQuery.eq('kelas', userData.kelas.trim())
      if (userData.jurusan) studentQuery = studentQuery.eq('jurusan', userData.jurusan.trim())
    }
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) return { error: 'Tidak ada siswa' };

  const studentIds = students.map(s => s.id);

  const { error } = await supabaseAdmin
    .from('absensi')
    .delete()
    .in('siswa_id', studentIds);

  if (error) return { error: error.message };
  return { success: true };
}