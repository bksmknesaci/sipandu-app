'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Normalisasi string: trim + collapse multiple spaces
// Agar grouping tidak terpengaruh inkonsistensi whitespace di database
// Contoh: "TKRO 1" dan "TKRO  1" dianggap sama
function normalizeStr(s) {
  if (!s) return ''
  return String(s).trim().replace(/\s+/g, ' ')
}

export async function getPJStats() {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, role, kelas, jurusan, status')
    .in('role', ['Wali Kelas', 'Sekretaris Kelas']);
  
  if (!users) return { totalKelas: 0, totalWali: 0, totalSekretaris: 0, totalPJ: 0 };
  
  // Gabungkan kelas + jurusan dengan normalisasi untuk menghitung kelas unik
  const kelasSet = new Set();
  users.forEach(u => {
    const k = normalizeStr(u.kelas);
    const j = normalizeStr(u.jurusan);
    if (k && j) {
      kelasSet.add(`${k} ${j}`);
    } else if (k) {
      kelasSet.add(k);
    }
  });
  const totalKelas = kelasSet.size;
  const totalWali = users.filter(u => u.role === 'Wali Kelas' && u.status === 'Aktif').length;
  const totalSekretaris = users.filter(u => u.role === 'Sekretaris Kelas' && u.status === 'Aktif').length;
  const totalPJ = totalWali + totalSekretaris;
  
  return { totalKelas, totalWali, totalSekretaris, totalPJ };
}

export async function getPJByClass(kelas, jurusan) {
  if (!kelas) return null;

  // Normalisasi input
  const normKelas = normalizeStr(kelas);
  const normJurusan = normalizeStr(jurusan);

  // Ambil semua WK & Sekretaris dengan kelas yang cocok (setelah normalisasi)
  // Tidak bisa langsung .eq() karena data di DB mungkin punya whitespace berbeda
  const { data: allUsers } = await supabaseAdmin
    .from('users')
    .select('nama, whatsapp, email, kelas, jurusan, role, status')
    .in('role', ['Wali Kelas', 'Sekretaris Kelas'])
    .eq('status', 'Aktif');

  if (!allUsers) return null;

  // Filter di level aplikasi dengan normalisasi
  const wali = allUsers.find(u =>
    u.role === 'Wali Kelas' &&
    normalizeStr(u.kelas) === normKelas &&
    (!normJurusan || normalizeStr(u.jurusan) === normJurusan)
  );

  const sekretaris = allUsers.find(u =>
    u.role === 'Sekretaris Kelas' &&
    normalizeStr(u.kelas) === normKelas &&
    (!normJurusan || normalizeStr(u.jurusan) === normJurusan)
  );

  if (!wali && !sekretaris) return null;
  return { 
    wali: wali ? { nama: wali.nama, whatsapp: wali.whatsapp, email: wali.email } : null, 
    sekretaris: sekretaris ? { nama: sekretaris.nama, whatsapp: sekretaris.whatsapp, email: sekretaris.email } : null 
  };
}

export async function getDerivedPJ() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, nama, whatsapp, email, role, kelas, jurusan, status, created_at')
    .in('role', ['Wali Kelas', 'Sekretaris Kelas']);
  
  if (error) {
    console.error("Error fetching derived PJ:", error.message);
    return [];
  }
  
  // Grouping berdasarkan kelas + jurusan TERNORMALISASI
  // "X TKRO 1" dan "X  TKRO  1" akan masuk ke grup yang sama
  const grouped = {};
  users.forEach(u => {
    const k = normalizeStr(u.kelas);
    const j = normalizeStr(u.jurusan);
    const fullKelas = (k && j) ? `${k} ${j}` : (k || 'Tidak Diketahui');

    if (!grouped[fullKelas]) {
      grouped[fullKelas] = {
        id: fullKelas, 
        kelas: k,
        jurusan: j,
        wali: null,
        sekretaris: null,
        status: 'Tidak Aktif',
        history: [],
        updated_at: u.created_at
      };
    }
    if (u.role === 'Wali Kelas') grouped[fullKelas].wali = u;
    if (u.role === 'Sekretaris Kelas') grouped[fullKelas].sekretaris = u;
    if (u.status === 'Aktif') grouped[fullKelas].status = 'Aktif';
    
    if (u.created_at > grouped[fullKelas].updated_at) {
      grouped[fullKelas].updated_at = u.created_at;
    }
  });
  
  // Urutkan: X → XI → XII, lalu jurusan alfabet
  const kelasOrder = { 'X': 1, 'XI': 2, 'XII': 3 };
  return Object.values(grouped).sort((a, b) => {
    const kelasA = kelasOrder[a.kelas] || 99;
    const kelasB = kelasOrder[b.kelas] || 99;
    if (kelasA !== kelasB) return kelasA - kelasB;
    return a.jurusan.localeCompare(b.jurusan);
  });
}