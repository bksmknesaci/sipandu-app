'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================
// GET REKAP KEHADIRAN
// ============================
// CATATAN OPTIMASI: Alur ini secara inherent sequential —
// absensi bergantung pada studentIds dari query siswa.
// Tidak bisa diparalelkan. Query sudah se-optimal mungkin.
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

  let { data: absensi, error: absensiError } = await supabaseAdmin
    .from('absensi')
    .select('*')
    .in('siswa_id', studentIds)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate);

  if (absensiError) return { error: absensiError.message };

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  if (date === today && currentHour >= 14) {
    const todayRecords = (absensi || []).filter(a => a.tanggal === today);
    const presentIds = todayRecords.map(a => a.siswa_id);
    const absentStudents = students.filter(s => !presentIds.includes(s.id));

    if (absentStudents.length > 0) {
      const alphaInserts = absentStudents.map(s => ({
        siswa_id: s.id,
        tanggal: today,
        status: 'Alpha',
        input_by: 'Sistem Otomatis',
        locked: true
      }));

      await supabaseAdmin
        .from('absensi')
        .upsert(alphaInserts, { onConflict: 'siswa_id,tanggal', ignoreDuplicates: true });

      const { data: updatedAbsensi } = await supabaseAdmin
        .from('absensi')
        .select('*')
        .in('siswa_id', studentIds)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      absensi = updatedAbsensi || [];
    }
  }

  return { students, attendance: absensi || [] };
}

// ============================
// GET FILTER OPTIONS
// ============================
// CATATAN: Fungsi ini sudah digantikan oleh getKelasFilters() di absensiActions.js
// yang memiliki cache 5 menit. Pertahankan untuk backward compatibility.
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