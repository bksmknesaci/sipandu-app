'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================
// PARSE KELAS
// ============================
function parseKelasJurusan(kelas) {
  if (!kelas) return { tingkat: '', jurusan: '' }
  const parts = kelas.trim().split(/\s+/)
  return {
    tingkat: parts[0] || '',
    jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''),
  }
}

// ============================
// GET REKAP KEHADIRAN
// ============================
export async function getRekapKehadiran({ date, tingkat, jurusan, userRole, userKelas }) {
  // select('*') sudah mencakup kolom 'nis' sehingga NISN akan tersedia di frontend
  let studentQuery = supabaseAdmin.from('siswa').select('*').eq('status', 'Aktif');
  
  if (userRole === 'Wali Kelas' && userKelas) {
    const parsed = parseKelasJurusan(userKelas);
    if (parsed.tingkat) studentQuery = studentQuery.eq('kelas', parsed.tingkat);
    if (parsed.jurusan) studentQuery = studentQuery.eq('jurusan', parsed.jurusan);
  } else {
    if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
    if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);
  }

  const { data: students, error: studentError } = await studentQuery.order('nama', { ascending: true });
  if (studentError) return { error: studentError.message };
  if (!students || students.length === 0) return { students: [], attendance: [] };

  const studentIds = students.map(s => s.id);
  
  // Ambil data 1 tahun ajaran penuh (Juli - Juni) agar Tab Semester & Bulan terisi
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

  // Sync Alpha Otomatis (Hanya untuk hari ini)
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
export async function resetSemesterAbsensi({ date, tingkat, jurusan, userRole, userKelas }) {
  let studentQuery = supabaseAdmin.from('siswa').select('id').eq('status', 'Aktif');
  
  if (userRole === 'Wali Kelas' && userKelas) {
    const parsed = parseKelasJurusan(userKelas);
    if (parsed.tingkat) studentQuery = studentQuery.eq('kelas', parsed.tingkat);
    if (parsed.jurusan) studentQuery = studentQuery.eq('jurusan', parsed.jurusan);
  } else {
    if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
    if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) return { error: 'Tidak ada siswa' };

  const studentIds = students.map(s => s.id);
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7));
  const academicStartYear = month >= 7 ? year : year - 1;
  
  // Tentukan range semester yang dipilih
  let startDate, endDate;
  if (month >= 7) { // Semester 1 (Juli - Desember)
    startDate = `${academicStartYear}-07-01`;
    endDate = `${academicStartYear}-12-31`;
  } else { // Semester 2 (Januari - Juni)
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
export async function resetAllAbsensi({ tingkat, jurusan, userRole, userKelas }) {
  let studentQuery = supabaseAdmin.from('siswa').select('id').eq('status', 'Aktif');
  
  if (userRole === 'Wali Kelas' && userKelas) {
    const parsed = parseKelasJurusan(userKelas);
    if (parsed.tingkat) studentQuery = studentQuery.eq('kelas', parsed.tingkat);
    if (parsed.jurusan) studentQuery = studentQuery.eq('jurusan', parsed.jurusan);
  } else {
    if (tingkat) studentQuery = studentQuery.eq('kelas', tingkat);
    if (jurusan) studentQuery = studentQuery.eq('jurusan', jurusan);
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) return { error: 'Tidak ada siswa' };

  const studentIds = students.map(s => s.id);

  // Hapus semua data absensi untuk siswa di kelas ini, tanpa batasan tanggal
  const { error } = await supabaseAdmin
    .from('absensi')
    .delete()
    .in('siswa_id', studentIds);

  if (error) return { error: error.message };
  return { success: true };
}

// ==========================================
// CATATAN: Fungsi Reward yang sebelumnya ada di bagian bawah sini
// SUDAH DIHAPUS karena duplikat dan sudah diperbaiki sepenuhnya di:
// app/actions/rewardActions.js
// ==========================================