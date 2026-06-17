'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getPJStats() {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, role, kelas, status')
    .in('role', ['Wali Kelas', 'Sekretaris Kelas']);
  
  if (!users) return { totalKelas: 0, totalWali: 0, totalSekretaris: 0, totalPJ: 0 };
  
  const kelasSet = new Set(users.map(u => u.kelas).filter(Boolean));
  const totalKelas = kelasSet.size;
  const totalWali = users.filter(u => u.role === 'Wali Kelas' && u.status === 'Aktif').length;
  const totalSekretaris = users.filter(u => u.role === 'Sekretaris Kelas' && u.status === 'Aktif').length;
  const totalPJ = totalWali + totalSekretaris;
  
  return { totalKelas, totalWali, totalSekretaris, totalPJ };
}

export async function getPJByClass(kelas, jurusan) {
  if (!kelas || !jurusan) return null;
  const fullKelas = `${kelas} ${jurusan}`.trim();
  
  const { data: wali } = await supabaseAdmin
    .from('users')
    .select('nama, whatsapp, email')
    .eq('kelas', fullKelas)
    .eq('role', 'Wali Kelas')
    .eq('status', 'Aktif')
    .maybeSingle();
    
  const { data: sekretaris } = await supabaseAdmin
    .from('users')
    .select('nama, whatsapp, email')
    .eq('kelas', fullKelas)
    .eq('role', 'Sekretaris Kelas')
    .eq('status', 'Aktif')
    .maybeSingle();

  if (!wali && !sekretaris) return null;
  return { wali, sekretaris };
}

export async function getDerivedPJ() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, nama, whatsapp, email, role, kelas, status, created_at')
    .in('role', ['Wali Kelas', 'Sekretaris Kelas'])
    .order('kelas', { ascending: true });
  
  if (error) {
    console.error("Error fetching derived PJ:", error.message);
    return [];
  }
  
  const grouped = {};
  users.forEach(u => {
    if (!u.kelas) return;
    if (!grouped[u.kelas]) {
      const parts = u.kelas.trim().split(/\s+/);
      grouped[u.kelas] = {
        id: u.kelas, 
        kelas: parts[0] || '',
        jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''),
        wali: null,
        sekretaris: null,
        status: 'Tidak Aktif',
        history: [],
        updated_at: u.created_at
      };
    }
    if (u.role === 'Wali Kelas') grouped[u.kelas].wali = u;
    if (u.role === 'Sekretaris Kelas') grouped[u.kelas].sekretaris = u;
    if (u.status === 'Aktif') grouped[u.kelas].status = 'Aktif';
    
    if (u.created_at > grouped[u.kelas].updated_at) {
      grouped[u.kelas].updated_at = u.created_at;
    }
  });
  
  return Object.values(grouped);
}