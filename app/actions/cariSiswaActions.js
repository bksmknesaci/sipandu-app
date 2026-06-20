'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function searchSiswa(query) {
  try {
    if (!query || query.trim().length < 3) {
      return [];
    }

    const term = query.trim();

    const { data, error } = await supabaseAdmin
      .from('siswa')
      .select('id, nisn, nama, kelas, jurusan, jenis_kelamin, status')
      .or(`nama.ilike.%${term}%,nisn.ilike.%${term}%,kelas.ilike.%${term}%`)
      .order('nama', { ascending: true })
      .limit(10);

    if (error) {
      console.error('searchSiswa error:', error.message, error.code);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Ambil status kehadiran hari ini
    const todayWIB = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });
    const ids = data.map((s) => s.id);

    const { data: todayAbsensi } = await supabaseAdmin
      .from('absensi')
      .select('siswa_id, status, created_at')
      .eq('tanggal', todayWIB)
      .in('siswa_id', ids);

    const statusMap = {};
    if (todayAbsensi) {
      todayAbsensi.forEach((a) => {
        statusMap[a.siswa_id] = a.status;
      });
    }

    return data.map((s) => ({
      ...s,
      statusHariIni: statusMap[s.id] || null,
    }));
  } catch (err) {
    console.error('searchSiswa exception:', err);
    return [];
  }
}

export async function getSiswaDetail(id) {
  try {
    // 1. Data siswa
    const { data: siswa, error: sErr } = await supabaseAdmin
      .from('siswa')
      .select('*')
      .eq('id', id)
      .single();

    if (sErr || !siswa) {
      console.error('getSiswaDetail siswa error:', sErr?.message);
      return null;
    }

    // 2. Tanggal hari ini WIB
    const todayWIB = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });

    // 3. Absensi hari ini
    const { data: absenHariIni } = await supabaseAdmin
      .from('absensi')
      .select('*')
      .eq('siswa_id', id)
      .eq('tanggal', todayWIB)
      .single();

    // 4. Semua absensi siswa
    const { data: allAbsensi } = await supabaseAdmin
      .from('absensi')
      .select('tanggal, status, input_by, created_at')
      .eq('siswa_id', id)
      .order('tanggal', { ascending: false });

    // 5. Ambil semester aktif
    const { data: calendar } = await supabaseAdmin
      .from('academic_calendar')
      .select('*')
      .eq('is_active', true)
      .single();

    let semesterStart = null;
    if (calendar && calendar.start_date) {
      semesterStart = calendar.start_date;
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      semesterStart = sixMonthsAgo.toLocaleDateString('sv-SE', {
        timeZone: 'Asia/Jakarta',
      });
    }

    // 6. Filter absensi semester
    const semesterAbsensi = (allAbsensi || []).filter(
      (a) => a.tanggal >= semesterStart
    );

    // 7. Hitung statistik kehadiran semester
    const stats = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    semesterAbsensi.forEach((a) => {
      const s = (a.status || '').toLowerCase();
      if (s === 'hadir') stats.hadir++;
      else if (s === 'sakit') stats.sakit++;
      else if (s === 'izin') stats.izin++;
      else if (s === 'alpha') stats.alpha++;
    });

    const totalSemester = stats.hadir + stats.sakit + stats.izin + stats.alpha;
    const persentaseKehadiran =
      totalSemester > 0
        ? ((stats.hadir / totalSemester) * 100).toFixed(1)
        : '0.0';

    // 8. Reward — match siswa.nisn ke tb_reward_siswa.nisn
    const { data: rewards } = await supabaseAdmin
      .from('tb_reward_siswa')
      .select('*')
      .eq('nisn', siswa.nisn)
      .order('tanggal', { ascending: false });

    const totalRewardPoin = (rewards || []).reduce(
      (sum, r) => sum + (r.reward_poin || 0),
      0
    );

    // 9. Pelanggaran — match siswa.nisn ke tb_pelanggaran_siswa.nisn
    const { data: pelanggaran } = await supabaseAdmin
      .from('tb_pelanggaran_siswa')
      .select('*')
      .eq('nisn', siswa.nisn)
      .order('tanggal', { ascending: false });

    const totalPelanggaranPoin = (pelanggaran || []).reduce(
      (sum, p) => sum + (p.poin || 0),
      0
    );

    const kategoriPelanggaran = { ringan: 0, sedang: 0, berat: 0 };
    (pelanggaran || []).forEach((p) => {
      const kat = (p.kategori || '').toLowerCase();
      if (kat === 'ringan') kategoriPelanggaran.ringan++;
      else if (kat === 'sedang') kategoriPelanggaran.sedang++;
      else if (kat === 'berat') kategoriPelanggaran.berat++;
    });

    // 10. Penanganan
    const { data: penanganan } = await supabaseAdmin
      .from('tb_penanganan_siswa')
      .select('*')
      .eq('siswa_id', id)
      .single();

    return {
      siswa,
      absenHariIni: absenHariIni || null,
      allAbsensi: allAbsensi || [],
      semesterAbsensi,
      stats,
      totalSemester,
      persentaseKehadiran,
      rewards: rewards || [],
      totalRewardPoin,
      pelanggaran: pelanggaran || [],
      totalPelanggaranPoin,
      kategoriPelanggaran,
      penanganan: penanganan || null,
    };
  } catch (err) {
    console.error('getSiswaDetail exception:', err);
    return null;
  }
}