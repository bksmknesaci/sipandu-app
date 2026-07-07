'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached, TTL } from '@/lib/cacheHelpers';

export async function searchSiswa(query) {
  try {
    if (!query || query.trim().length < 3) return [];

    const term = query.trim().replace(/[%_]/g, '\\$&');
    const todayWIB = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    // ── OPTIMASI: 2 query paralel (sebelumnya sequential) ──
    const [siswaRes, todayAbsensiRes] = await Promise.all([
      supabaseAdmin
        .from('siswa')
        .select('id, nisn, nama, kelas, jurusan, jenis_kelamin, status')
        .or(`nama.ilike.%${term}%,nisn.ilike.%${term}%,kelas.ilike.%${term}%`)
        .order('nama', { ascending: true })
        .limit(10),
      supabaseAdmin
        .from('absensi')
        .select('siswa_id, status, created_at')
        .eq('tanggal', todayWIB),
    ]);

    const data = siswaRes.data || [];
    if (data.length === 0) return [];

    const statusMap = {};
    const ids = data.map(s => s.id);
    (todayAbsensiRes.data || []).forEach(a => {
      if (ids.includes(a.siswa_id)) statusMap[a.siswa_id] = a.status;
    });

    return data.map(s => ({ ...s, statusHariIni: statusMap[s.id] || null }));
  } catch (err) {
    console.error('searchSiswa exception:', err);
    return [];
  }
}

export async function getSiswaDetail(id) {
  try {
    // Step 1: Data siswa (harus duluan, siswa.nisn dibutuhkan step berikutnya)
    const { data: siswa, error: sErr } = await supabaseAdmin
      .from('siswa').select('*').eq('id', id).single();
    if (sErr || !siswa) return null;

    const todayWIB = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    // ── OPTIMASI: 6 query paralel (sebelumnya 6x sequential) ──
    const [
      absenHariIniRes,
      allAbsensiRes,
      calendar,
      rewardsRes,
      pelanggaranRes,
      penangananRes,
    ] = await Promise.all([
      supabaseAdmin.from('absensi').select('*').eq('siswa_id', id).eq('tanggal', todayWIB).single(),
      supabaseAdmin.from('absensi').select('tanggal, status, input_by, created_at').eq('siswa_id', id).order('tanggal', { ascending: false }),
      // Cache kalender akademik — jarang berubah
      getCached('academic_calendar_active', () =>
        supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).single().then(r => r.data),
        TTL.HARI_EFEKTIF
      ),
      supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', siswa.nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', siswa.nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('tb_penanganan_siswa').select('*').eq('siswa_id', id).single(),
    ]);

    // Derive semester start
    let semesterStart;
    if (calendar && calendar.start_date) {
      semesterStart = calendar.start_date;
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      semesterStart = sixMonthsAgo.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    }

    // Process in JS (no DB needed)
    const allAbsensi = allAbsensiRes.data || [];
    const semesterAbsensi = allAbsensi.filter(a => a.tanggal >= semesterStart);

    const stats = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    semesterAbsensi.forEach(a => {
      const s = (a.status || '').toLowerCase();
      if (s === 'hadir') stats.hadir++;
      else if (s === 'sakit') stats.sakit++;
      else if (s === 'izin') stats.izin++;
      else if (s === 'alpha') stats.alpha++;
    });

    const totalSemester = stats.hadir + stats.sakit + stats.izin + stats.alpha;
    const persentaseKehadiran = totalSemester > 0 ? ((stats.hadir / totalSemester) * 100).toFixed(1) : '0.0';

    const rewards = rewardsRes.data || [];
    const totalRewardPoin = rewards.reduce((sum, r) => sum + (r.reward_poin || 0), 0);

    const pelanggaran = pelanggaranRes.data || [];
    const totalPelanggaranPoin = pelanggaran.reduce((sum, p) => sum + (p.poin || 0), 0);
    const kategoriPelanggaran = { ringan: 0, sedang: 0, berat: 0 };
    pelanggaran.forEach(p => {
      const kat = (p.kategori || '').toLowerCase();
      if (kat === 'ringan') kategoriPelanggaran.ringan++;
      else if (kat === 'sedang') kategoriPelanggaran.sedang++;
      else if (kat === 'berat') kategoriPelanggaran.berat++;
    });

    let history = [];
    const penanganan = penangananRes.data || null;
    if (penanganan?.id) {
      const { data: historyData } = await supabaseAdmin
        .from('tb_penanganan_history')
        .select('*')
        .eq('penanganan_id', penanganan.id)
        .order('created_at', { ascending: false });
      history = historyData || [];
    }

    return {
      siswa,
      absenHariIni: absenHariIniRes.data || null,
      allAbsensi,
      semesterAbsensi,
      stats,
      totalSemester,
      persentaseKehadiran,
      rewards,
      totalRewardPoin,
      pelanggaran,
      totalPelanggaranPoin,
      kategoriPelanggaran,
      penanganan: penanganan || {},
      history,
    };
  } catch (err) {
    console.error('getSiswaDetail exception:', err);
    return null;
  }
}