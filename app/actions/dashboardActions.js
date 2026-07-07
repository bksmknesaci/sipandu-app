'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

function getTodayWIB() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}

function getDateWIB(d) {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export async function getAdminDashboardData() {
  const today = getTodayWIB();

  // ── Batch 1: 10 query paralel (sudah optimal, tidak diubah) ──
  const [
    siswaCountRes,
    wkCountRes,
    sekCountRes,
    beritaCountRes,
    rewardDataRes,
    pelanggaranDataRes,
    absensiHariIniRes,
    newsRes,
    siswaAllRes,
    penangananRes,
  ] = await Promise.all([
    supabaseAdmin.from('siswa').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Wali Kelas').eq('status', 'Aktif'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Sekretaris Kelas').eq('status', 'Aktif'),
    supabaseAdmin.from('news_posts').select('*', { count: 'exact', head: true }).eq('status', 'Publish'),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, reward_poin, kelas, jurusan'),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, nama_siswa, poin, jenis_pelanggaran, kelas, jurusan'),
    supabaseAdmin.from('absensi').select('status, siswa_id, input_by, created_at').eq('tanggal', today),
    supabaseAdmin.from('news_posts').select('id, title, category, views').eq('status', 'Publish').order('published_at', { ascending: false }).limit(5),
    supabaseAdmin.from('siswa').select('id, kelas, jurusan, nama'),
    supabaseAdmin.from('tb_penanganan_siswa').select('id, sp1, sp2, sp3').eq('status_akhir', 'Aktif'),
  ]);

  // ── Processing Batch 1 ──
  const totalSiswa = siswaCountRes.count || 0;
  const totalWaliKelas = wkCountRes.count || 0;
  const totalSekretaris = sekCountRes.count || 0;
  const totalBerita = beritaCountRes.count || 0;
  const penangananAktif = (penangananRes.data || []).filter(p => p.sp1 || p.sp2 || p.sp3).length;

  const totalReward = (rewardDataRes.data || []).reduce((sum, r) => sum + (r.reward_poin || 0), 0);
  const totalPelanggaran = (pelanggaranDataRes.data || []).reduce((sum, p) => sum + (p.poin || 0), 0);

  const absensiHariIni = absensiHariIniRes.data || [];
  const hadirHariIni = absensiHariIni.filter(a => a.status === 'Hadir').length;
  const sakitHariIni = absensiHariIni.filter(a => a.status === 'Sakit').length;
  const izinHariIni = absensiHariIni.filter(a => a.status === 'Izin').length;
  const alphaHariIni = absensiHariIni.filter(a => a.status === 'Alpha').length;

  const siswaAll = siswaAllRes.data || [];
  const distribusi = { x: 0, xi: 0, xii: 0 };
  const kelasSet = new Set();
  for (const s of siswaAll) {
    kelasSet.add(`${s.kelas} ${s.jurusan}`.trim());
    const k = (s.kelas || '').toUpperCase().trim();
    if (k.startsWith('XII')) distribusi.xii++;
    else if (k.startsWith('XI')) distribusi.xi++;
    else if (k.startsWith('X')) distribusi.x++;
  }
  const totalKelas = kelasSet.size;

  const rewardMap = {};
  for (const r of (rewardDataRes.data || [])) {
    if (!rewardMap[r.nisn]) {
      rewardMap[r.nisn] = { nisn: r.nisn, nama: r.nama_siswa || r.nisn, kelas: r.kelas || '', jurusan: r.jurusan || '', total: 0 };
    }
    rewardMap[r.nisn].total += r.reward_poin || 0;
  }
  const topReward = Object.values(rewardMap).sort((a, b) => b.total - a.total).slice(0, 10);

  const pelanggaranMap = {};
  for (const p of (pelanggaranDataRes.data || [])) {
    if (!pelanggaranMap[p.nisn]) {
      pelanggaranMap[p.nisn] = { nisn: p.nisn, nama: p.nama_siswa || p.nisn, kelas: p.kelas || '', jurusan: p.jurusan || '', total: 0, items: [] };
    }
    pelanggaranMap[p.nisn].total += p.poin || 0;
    pelanggaranMap[p.nisn].items.push({ jenis_pelanggaran: p.jenis_pelanggaran });
  }
  const topPelanggaran = Object.values(pelanggaranMap).sort((a, b) => b.total - a.total).slice(0, 10);

  const siswaLookup = {};
  for (const s of siswaAll) siswaLookup[s.id] = s;

  const kelasGroup = {};
  for (const s of siswaAll) {
    const kelasFull = `${s.kelas} ${s.jurusan}`.trim();
    if (!kelasGroup[kelasFull]) {
      kelasGroup[kelasFull] = { kelas: kelasFull, total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    }
    kelasGroup[kelasFull].total++;
  }
  for (const a of absensiHariIni) {
    const s = siswaLookup[a.siswa_id];
    if (!s) continue;
    const kelasFull = `${s.kelas} ${s.jurusan}`.trim();
    if (kelasGroup[kelasFull]) {
      if (a.status === 'Hadir') kelasGroup[kelasFull].hadir++;
      else if (a.status === 'Sakit') kelasGroup[kelasFull].sakit++;
      else if (a.status === 'Izin') kelasGroup[kelasFull].izin++;
      else if (a.status === 'Alpha') kelasGroup[kelasFull].alpha++;
    }
  }
  const kelasAbsensi = Object.values(kelasGroup).sort((a, b) => a.kelas.localeCompare(b.kelas));

  // ── OPTIMASI: Batch 2 — 2 query paralel (sebelumnya sequential) ──
  const siswaIdSet = [...new Set(absensiHariIni.map(a => a.siswa_id).filter(Boolean))];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const startDate = getDateWIB(thirtyDaysAgo);

  const [namaRes, absensi30Res] = await Promise.all([
    siswaIdSet.length > 0
      ? supabaseAdmin.from('siswa').select('id, nama').in('id', siswaIdSet)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from('absensi').select('tanggal, status').gte('tanggal', startDate).lte('tanggal', today),
  ]);

  // ── Processing Batch 2 ──
  let namaLookup = {};
  for (const s of (namaRes.data || [])) namaLookup[s.id] = s.nama;

  const activities = absensiHariIni.slice(0, 10).map(a => ({
    jam: new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    input_by: a.input_by,
    nama: namaLookup[a.siswa_id] || '-',
    status: a.status,
  }));

  const dateMap = {};
  for (const a of (absensi30Res.data || [])) {
    if (!dateMap[a.tanggal]) dateMap[a.tanggal] = { hadir: 0, alpha: 0 };
    if (a.status === 'Hadir') dateMap[a.tanggal].hadir++;
    if (a.status === 'Alpha') dateMap[a.tanggal].alpha++;
  }
  const lineChartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const ds = getDateWIB(d);
    const dayData = dateMap[ds] || { hadir: 0, alpha: 0 };
    return { date: d.getDate().toString(), hadir: dayData.hadir, alpha: dayData.alpha };
  });

  return {
    totalSiswa, totalWaliKelas, totalSekretaris, totalKelas,
    hadirHariIni, sakitHariIni, izinHariIni, alphaHariIni,
    totalReward, totalPelanggaran, penangananAktif, totalBerita,
    distribusi, topReward, topPelanggaran, kelasAbsensi,
    latestNews: newsRes.data || [],
    activities,
    lineChartData,
  };
}

// ═══════════════════════════════════════════════════════════════
// WALI KELAS DASHBOARD
// OPTIMASI: 6 query sequential → 1 Promise.all (hemat ~1000ms)
// ═══════════════════════════════════════════════════════════════
export async function getWaliKelasDashboardFull(kelas, userId) {
  const today = getTodayWIB();
  const kelasArr = (kelas || '').trim().split(/\s+/);
  let tingkat = kelasArr[0] || '';
  let jurusan = kelasArr.slice(1).join(' ') || '';

  // Step 1: Ambil jurusan dari DB jika kosong (harus sequential, conditional)
  if (!jurusan && userId) {
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('kelas, jurusan')
        .eq('id', userId)
        .maybeSingle();
      if (userData) {
        if (!tingkat && userData.kelas) tingkat = userData.kelas.trim();
        if (!jurusan && userData.jurusan) jurusan = userData.jurusan.trim();
      }
    } catch (e) {
      console.error('[WK Dashboard] Gagal ambil jurusan dari DB:', e);
    }
  }

  // Step 2: Ambil siswa kelas ini (harus sequential, bergantung pada jurusan)
  let siswaQuery = supabaseAdmin.from('siswa').select('*').eq('kelas', tingkat);
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan);
  const { data: siswaList } = await siswaQuery;

  const siswaIds = (siswaList || []).map(s => s.id);
  const nisnArr = (siswaList || []).map(s => s.nisn).filter(Boolean);
  const totalSiswa = siswaList?.length || 0;
  const safeSiswaIds = siswaIds.length > 0 ? siswaIds : [-1];
  const safeNisnArr = nisnArr.length > 0 ? nisnArr : ['__none__'];

  // ── OPTIMASI: Step 3 — 6 query paralel (sebelumnya 6x sequential) ──
  const [
    absensiHariIniRes,
    izinPendingRes,
    rewardDataRes,
    pelanggaranDataRes,
    penangananDataRes,
    messagesRes,
  ] = await Promise.all([
    supabaseAdmin.from('absensi').select('siswa_id, status').eq('tanggal', today).in('siswa_id', safeSiswaIds),
    supabaseAdmin.from('tb_absensi_sakit_izin').select('id, jenis_absensi, jam, nama_siswa, alasan').in('nisn', safeNisnArr).eq('status_verifikasi', 'MENUNGGU VERIFIKASI').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, reward_poin').in('nisn', safeNisnArr),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, nama_siswa, poin').in('nisn', safeNisnArr),
    supabaseAdmin.from('tb_penanganan_siswa').select('id, sp1, sp2, sp3').in('siswa_id', safeSiswaIds).eq('status_akhir', 'Aktif'),
    supabaseAdmin.from('parent_messages').select('sender_type, message, created_at').in('student_id', safeSiswaIds).order('created_at', { ascending: false }).limit(10),
  ]);

  // ── Processing ──
  const absenMap = {};
  for (const a of (absensiHariIniRes.data || [])) absenMap[a.siswa_id] = a.status;

  const hadirHariIni = Object.values(absenMap).filter(s => s === 'Hadir').length;
  const sakitHariIni = Object.values(absenMap).filter(s => s === 'Sakit').length;
  const izinHariIni = Object.values(absenMap).filter(s => s === 'Izin').length;
  const alphaHariIni = Object.values(absenMap).filter(s => s === 'Alpha').length;
  const belumAbsen = (siswaList || []).filter(s => !absenMap[s.id]);

  const rewardMap = {};
  let totalReward = 0;
  for (const r of (rewardDataRes.data || [])) {
    totalReward += r.reward_poin || 0;
    if (!rewardMap[r.nisn]) {
      rewardMap[r.nisn] = { nama: r.nama_siswa || r.nisn, total: 0 };
    }
    rewardMap[r.nisn].total += r.reward_poin || 0;
  }
  const topReward = Object.values(rewardMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const pelanggaranMap = {};
  let totalPelanggaran = 0;
  for (const p of (pelanggaranDataRes.data || [])) {
    totalPelanggaran += p.poin || 0;
    if (!pelanggaranMap[p.nisn]) {
      pelanggaranMap[p.nisn] = { nama: p.nama_siswa || p.nisn, total: 0 };
    }
    pelanggaranMap[p.nisn].total += p.poin || 0;
  }
  const topPelanggaran = Object.values(pelanggaranMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const penangananAktif = (penangananDataRes.data || []).filter(p => p.sp1 || p.sp2 || p.sp3).length;

  return {
    totalSiswa, hadirHariIni, sakitHariIni, izinHariIni, alphaHariIni,
    totalReward, totalPelanggaran,
    belumAbsen: belumAbsen.map(s => ({ id: s.id, nama: s.nama, nisn: s.nisn })),
    izinPending: izinPendingRes.data || [],
    penangananAktif,
    topReward, topPelanggaran,
    messages: messagesRes.data || [],
  };
}

// ═══════════════════════════════════════════════════════════════
// SEKRETARIS DASHBOARD
// OPTIMASI: 2 query absensi digabung jadi 1, sisanya paralel
// ═══════════════════════════════════════════════════════════════
export async function getSekretarisDashboardFull(kelas, userId) {
  const today = getTodayWIB();
  const kelasArr = (kelas || '').trim().split(/\s+/);
  let tingkat = kelasArr[0] || '';
  let jurusan = kelasArr.slice(1).join(' ') || '';

  if (!jurusan && userId) {
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('kelas, jurusan')
        .eq('id', userId)
        .maybeSingle();
      if (userData) {
        if (!tingkat && userData.kelas) tingkat = userData.kelas.trim();
        if (!jurusan && userData.jurusan) jurusan = userData.jurusan.trim();
      }
    } catch (e) {
      console.error('[Sekretaris Dashboard] Gagal ambil jurusan dari DB:', e);
    }
  }

  let siswaQuery = supabaseAdmin.from('siswa').select('*').eq('kelas', tingkat);
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan);
  const { data: siswaList } = await siswaQuery;

  const siswaIds = (siswaList || []).map(s => s.id);
  const nisnArr = (siswaList || []).map(s => s.nisn).filter(Boolean);
  const totalSiswa = siswaList?.length || 0;
  const safeSiswaIds = siswaIds.length > 0 ? siswaIds : [-1];
  const safeNisnArr = nisnArr.length > 0 ? nisnArr : ['__none__'];

  // ── OPTIMASI: Query 7 hari saja, derivate data hari ini dari dalamnya (hemat 1 query) ──
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate7 = getDateWIB(sevenDaysAgo);

  // ── OPTIMASI: absensi 7 hari + izin pending → paralel ──
  const [absensi7Res, izinPendingRes] = await Promise.all([
    supabaseAdmin.from('absensi').select('tanggal, status, siswa_id').gte('tanggal', startDate7).lte('tanggal', today).in('siswa_id', safeSiswaIds),
    supabaseAdmin.from('tb_absensi_sakit_izin').select('id, jenis_absensi, jam, nama_siswa, alasan').in('nisn', safeNisnArr).eq('status_verifikasi', 'MENUNGGU VERIFIKASI').order('created_at', { ascending: false }).limit(10),
  ]);

  // ── Derivate data hari ini dari hasil 7 hari ──
  const absensi7All = absensi7Res.data || [];
  const absensiHariIni = absensi7All.filter(a => a.tanggal === today);

  const absenMap = {};
  for (const a of absensiHariIni) absenMap[a.siswa_id] = a.status;

  const hadir = Object.values(absenMap).filter(s => s === 'Hadir').length;
  const sakit = Object.values(absenMap).filter(s => s === 'Sakit').length;
  const izin = Object.values(absenMap).filter(s => s === 'Izin').length;
  const alpha = Object.values(absenMap).filter(s => s === 'Alpha').length;
  const sudahAbsen = Object.keys(absenMap).length;
  const belumAbsen = totalSiswa - sudahAbsen;
  const persentase = totalSiswa > 0 ? Math.round((sudahAbsen / totalSiswa) * 100) : 0;

  const belumAbsenList = (siswaList || []).filter(s => !absenMap[s.id]).map(s => ({ id: s.id, nama: s.nama, nisn: s.nisn }));

  // ── Chart 7 hari dari data yang sudah diambil ──
  const weekMap = {};
  for (const a of absensi7All) {
    if (!weekMap[a.tanggal]) weekMap[a.tanggal] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    if (a.status === 'Hadir') weekMap[a.tanggal].hadir++;
    else if (a.status === 'Sakit') weekMap[a.tanggal].sakit++;
    else if (a.status === 'Izin') weekMap[a.tanggal].izin++;
    else if (a.status === 'Alpha') weekMap[a.tanggal].alpha++;
  }

  const hariNama = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const weekChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const ds = getDateWIB(d);
    const dayData = weekMap[ds] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    return { date: hariNama[d.getDay()], ...dayData };
  });

  return {
    totalSiswa, sudahAbsen, belumAbsen,
    hadir, sakit, izin, alpha, persentase,
    izinPending: izinPendingRes.data || [],
    weekChartData,
    belumAbsenList,
  };
}

// ═══════════════════════════════════════════════════════════════
// OSIS DASHBOARD
// OPTIMASI: 2 blok Promise.all digabung jadi 1 (hemat ~200ms)
// ═══════════════════════════════════════════════════════════════
export async function getOsisDashboardFull() {
  const today = getTodayWIB();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const startDate = getDateWIB(thirtyDaysAgo);

  // ── OPTIMASI: Semua query dalam 1 Promise.all (sebelumnya 2 blok terpisah) ──
  const [
    siswaCountRes,
    beritaCountRes,
    rewardHariIniRes,
    pelanggaranHariIniRes,
    recentRewardRes,
    recentPelanggaranRes,
    newsBeritaRes,
    newsPrestasiRes,
    reward30Res,
    pelanggaran30Res,
  ] = await Promise.all([
    supabaseAdmin.from('siswa').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('news_posts').select('*', { count: 'exact', head: true }).eq('status', 'Publish'),
    supabaseAdmin.from('tb_reward_siswa').select('*', { count: 'exact', head: true }).eq('tanggal', today),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('*', { count: 'exact', head: true }).eq('tanggal', today),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, reward_nama, reward_poin, tanggal, kelas').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, nama_siswa, jenis_pelanggaran, poin, tanggal, kelas').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('news_posts').select('id, slug, title, category, views').eq('status', 'Publish').eq('category', 'Berita Sekolah').order('published_at', { ascending: false }).limit(6),
    supabaseAdmin.from('news_posts').select('id, slug, title, category, views').eq('status', 'Publish').eq('category', 'Siswa Berprestasi').order('published_at', { ascending: false }).limit(6),
    supabaseAdmin.from('tb_reward_siswa').select('tanggal').gte('tanggal', startDate).lte('tanggal', today),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('tanggal').gte('tanggal', startDate).lte('tanggal', today),
  ]);

  const totalSiswa = siswaCountRes.count || 0;
  const totalBerita = beritaCountRes.count || 0;
  const rewardHariIni = rewardHariIniRes.count || 0;
  const pelanggaranHariIni = pelanggaranHariIniRes.count || 0;

  // ── Chart 30 hari ──
  const chartMap = {};
  for (const r of (reward30Res.data || [])) {
    if (!chartMap[r.tanggal]) chartMap[r.tanggal] = { reward: 0, pelanggaran: 0 };
    chartMap[r.tanggal].reward++;
  }
  for (const p of (pelanggaran30Res.data || [])) {
    if (!chartMap[p.tanggal]) chartMap[p.tanggal] = { reward: 0, pelanggaran: 0 };
    chartMap[p.tanggal].pelanggaran++;
  }
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const ds = getDateWIB(d);
    const dayData = chartMap[ds] || { reward: 0, pelanggaran: 0 };
    return { date: d.getDate().toString(), ...dayData };
  });

  return {
    totalSiswa, totalBerita, rewardHariIni, pelanggaranHariIni,
    chartData,
    recentReward: (recentRewardRes.data || []).map(r => ({ ...r, nama: r.nama_siswa || r.nisn })),
    recentPelanggaran: (recentPelanggaranRes.data || []).map(p => ({ ...p, nama: p.nama_siswa || p.nisn })),
    newsBerita: newsBeritaRes.data || [],
    newsPrestasi: newsPrestasiRes.data || [],
  };
}