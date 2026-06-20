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

  const [
    siswaCountRes,
    wkCountRes,
    sekCountRes,
    beritaCountRes,
    rewardCountRes,
    pelanggaranCountRes,
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
    supabaseAdmin.from('tb_reward_siswa').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, reward_poin'),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, nama_siswa, poin, jenis_pelanggaran'),
    supabaseAdmin.from('absensi').select('status, siswa_id, input_by, created_at').eq('tanggal', today),
    supabaseAdmin.from('news_posts').select('id, title, category, views').eq('status', 'Publish').order('published_at', { ascending: false }).limit(5),
    supabaseAdmin.from('siswa').select('id, kelas, jurusan, nama'),
    supabaseAdmin.from('tb_penanganan_siswa').select('id, sp1, sp2, sp3').eq('status_akhir', 'Aktif'),
  ]);

  // ── Counts ──
  const totalSiswa = siswaCountRes.count || 0;
  const totalWaliKelas = wkCountRes.count || 0;
  const totalSekretaris = sekCountRes.count || 0;
  const totalBerita = beritaCountRes.count || 0;
  const totalReward = rewardCountRes.count || 0;
  const totalPelanggaran = pelanggaranCountRes.count || 0;
  const penangananAktif = (penangananRes.data || []).filter(p => p.sp1 || p.sp2 || p.sp3).length;

  // ── Kehadiran Hari Ini ──
  const absensiHariIni = absensiHariIniRes.data || [];
  const hadirHariIni = absensiHariIni.filter(a => a.status === 'Hadir').length;
  const sakitHariIni = absensiHariIni.filter(a => a.status === 'Sakit').length;
  const izinHariIni = absensiHariIni.filter(a => a.status === 'Izin').length;
  const alphaHariIni = absensiHariIni.filter(a => a.status === 'Alpha').length;

  // ── Distribusi per Tingkat & Total Kelas ──
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

  // ── Top 10 Reward (pakai nama_siswa, bukan nisn) ──
  const rewardMap = {};
  for (const r of (rewardDataRes.data || [])) {
    if (!rewardMap[r.nisn]) {
      rewardMap[r.nisn] = { nisn: r.nisn, nama: r.nama_siswa || r.nisn, total: 0 };
    }
    rewardMap[r.nisn].total += r.reward_poin || 0;
  }
  const topReward = Object.values(rewardMap).sort((a, b) => b.total - a.total).slice(0, 10);

  // ── Top 10 Pelanggaran (pakai nama_siswa, bukan nisn) ──
  const pelanggaranMap = {};
  for (const p of (pelanggaranDataRes.data || [])) {
    if (!pelanggaranMap[p.nisn]) {
      pelanggaranMap[p.nisn] = { nisn: p.nisn, nama: p.nama_siswa || p.nisn, total: 0, items: [] };
    }
    pelanggaranMap[p.nisn].total += p.poin || 0;
    pelanggaranMap[p.nisn].items.push({ jenis_pelanggaran: p.jenis_pelanggaran });
  }
  const topPelanggaran = Object.values(pelanggaranMap).sort((a, b) => b.total - a.total).slice(0, 10);

  // ── Kelas Absensi ──
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

  // ── Activities ──
  const siswaIdSet = [...new Set(absensiHariIni.map(a => a.siswa_id).filter(Boolean))];
  let namaLookup = {};
  if (siswaIdSet.length > 0) {
    const { data: namaData } = await supabaseAdmin.from('siswa').select('id, nama').in('id', siswaIdSet);
    for (const s of (namaData || [])) namaLookup[s.id] = s.nama;
  }
  const activities = absensiHariIni.slice(0, 10).map(a => ({
    jam: new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    input_by: a.input_by,
    nama: namaLookup[a.siswa_id] || '-',
    status: a.status,
  }));

  // ── Line Chart 30 Hari (data real, bukan random) ──
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const startDate = getDateWIB(thirtyDaysAgo);
  const { data: absensi30 } = await supabaseAdmin
    .from('absensi')
    .select('tanggal, status')
    .gte('tanggal', startDate)
    .lte('tanggal', today);

  const dateMap = {};
  for (const a of (absensi30 || [])) {
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
// ═══════════════════════════════════════════════════════════════
export async function getWaliKelasDashboardFull(kelas) {
  const today = getTodayWIB();
  const kelasArr = (kelas || '').trim().split(/\s+/);
  const tingkat = kelasArr[0] || '';
  const jurusan = kelasArr.slice(1).join(' ') || '';

  // Ambil siswa kelas ini
  let siswaQuery = supabaseAdmin.from('siswa').select('*').eq('kelas', tingkat);
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan);
  const { data: siswaList } = await siswaQuery;

  const siswaIds = (siswaList || []).map(s => s.id);
  const nisnArr = (siswaList || []).map(s => s.nisn).filter(Boolean);
  const totalSiswa = siswaList?.length || 0;
  const safeSiswaIds = siswaIds.length > 0 ? siswaIds : [-1];
  const safeNisnArr = nisnArr.length > 0 ? nisnArr : ['__none__'];

  // Absensi hari ini
  const { data: absensiHariIni } = await supabaseAdmin
    .from('absensi')
    .select('siswa_id, status')
    .eq('tanggal', today)
    .in('siswa_id', safeSiswaIds);

  const absenMap = {};
  for (const a of (absensiHariIni || [])) absenMap[a.siswa_id] = a.status;

  const hadirHariIni = Object.values(absenMap).filter(s => s === 'Hadir').length;
  const sakitHariIni = Object.values(absenMap).filter(s => s === 'Sakit').length;
  const izinHariIni = Object.values(absenMap).filter(s => s === 'Izin').length;
  const alphaHariIni = Object.values(absenMap).filter(s => s === 'Alpha').length;
  const belumAbsen = (siswaList || []).filter(s => !absenMap[s.id]);

  // Izin pending (filter by NISN siswa kelas ini)
  const { data: izinPending } = await supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .select('id, jenis_absensi, jam, nama_siswa, alasan')
    .in('nisn', safeNisnArr)
    .eq('status_verifikasi', 'MENUNGGU VERIFIKASI')
    .order('created_at', { ascending: false })
    .limit(10);

  // Reward (filter by NISN, pakai nama_siswa)
  const { data: rewardData } = await supabaseAdmin
    .from('tb_reward_siswa')
    .select('nisn, nama_siswa, reward_poin')
    .in('nisn', safeNisnArr);

  const rewardMap = {};
  let totalReward = 0;
  for (const r of (rewardData || [])) {
    totalReward += r.reward_poin || 0;
    if (!rewardMap[r.nisn]) {
      rewardMap[r.nisn] = { nama: r.nama_siswa || r.nisn, total: 0 };
    }
    rewardMap[r.nisn].total += r.reward_poin || 0;
  }
  const topReward = Object.values(rewardMap).sort((a, b) => b.total - a.total).slice(0, 5);

  // Pelanggaran (filter by NISN, pakai nama_siswa)
  const { data: pelanggaranData } = await supabaseAdmin
    .from('tb_pelanggaran_siswa')
    .select('nisn, nama_siswa, poin')
    .in('nisn', safeNisnArr);

  const pelanggaranMap = {};
  let totalPelanggaran = 0;
  for (const p of (pelanggaranData || [])) {
    totalPelanggaran += p.poin || 0;
    if (!pelanggaranMap[p.nisn]) {
      pelanggaranMap[p.nisn] = { nama: p.nama_siswa || p.nisn, total: 0 };
    }
    pelanggaranMap[p.nisn].total += p.poin || 0;
  }
  const topPelanggaran = Object.values(pelanggaranMap).sort((a, b) => b.total - a.total).slice(0, 5);

  // Penanganan aktif
  const { data: penangananData } = await supabaseAdmin
    .from('tb_penanganan_siswa')
    .select('id, sp1, sp2, sp3')
    .in('siswa_id', safeSiswaIds)
    .eq('status_akhir', 'Aktif');
  const penangananAktif = (penangananData || []).filter(p => p.sp1 || p.sp2 || p.sp3).length;

  // Pesan orang tua
  const { data: messages } = await supabaseAdmin
    .from('parent_messages')
    .select('sender_type, message, created_at')
    .in('student_id', safeSiswaIds)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalSiswa, hadirHariIni, sakitHariIni, izinHariIni, alphaHariIni,
    totalReward, totalPelanggaran,
    belumAbsen: belumAbsen.map(s => ({ id: s.id, nama: s.nama, nisn: s.nisn })),
    izinPending: izinPending || [],
    penangananAktif,
    topReward, topPelanggaran,
    messages: messages || [],
  };
}

// ═══════════════════════════════════════════════════════════════
// SEKRETARIS DASHBOARD
// ═══════════════════════════════════════════════════════════════
export async function getSekretarisDashboardFull(kelas) {
  const today = getTodayWIB();
  const kelasArr = (kelas || '').trim().split(/\s+/);
  const tingkat = kelasArr[0] || '';
  const jurusan = kelasArr.slice(1).join(' ') || '';

  let siswaQuery = supabaseAdmin.from('siswa').select('*').eq('kelas', tingkat);
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan);
  const { data: siswaList } = await siswaQuery;

  const siswaIds = (siswaList || []).map(s => s.id);
  const nisnArr = (siswaList || []).map(s => s.nisn).filter(Boolean);
  const totalSiswa = siswaList?.length || 0;
  const safeSiswaIds = siswaIds.length > 0 ? siswaIds : [-1];
  const safeNisnArr = nisnArr.length > 0 ? nisnArr : ['__none__'];

  // Absensi hari ini
  const { data: absensiHariIni } = await supabaseAdmin
    .from('absensi')
    .select('siswa_id, status')
    .eq('tanggal', today)
    .in('siswa_id', safeSiswaIds);

  const absenMap = {};
  for (const a of (absensiHariIni || [])) absenMap[a.siswa_id] = a.status;

  const hadir = Object.values(absenMap).filter(s => s === 'Hadir').length;
  const sakit = Object.values(absenMap).filter(s => s === 'Sakit').length;
  const izin = Object.values(absenMap).filter(s => s === 'Izin').length;
  const alpha = Object.values(absenMap).filter(s => s === 'Alpha').length;
  const sudahAbsen = Object.keys(absenMap).length;
  const belumAbsen = totalSiswa - sudahAbsen;
  const persentase = totalSiswa > 0 ? Math.round((sudahAbsen / totalSiswa) * 100) : 0;

  const belumAbsenList = (siswaList || []).filter(s => !absenMap[s.id]).map(s => ({ id: s.id, nama: s.nama, nisn: s.nisn }));

  // Izin pending
  const { data: izinPending } = await supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .select('id, jenis_absensi, jam, nama_siswa, alasan')
    .in('nisn', safeNisnArr)
    .eq('status_verifikasi', 'MENUNGGU VERIFIKASI')
    .order('created_at', { ascending: false })
    .limit(10);

  // Chart 7 hari terakhir
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate7 = getDateWIB(sevenDaysAgo);

  const { data: absensi7 } = await supabaseAdmin
    .from('absensi')
    .select('tanggal, status')
    .gte('tanggal', startDate7)
    .lte('tanggal', today)
    .in('siswa_id', safeSiswaIds);

  const weekMap = {};
  for (const a of (absensi7 || [])) {
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
    izinPending: izinPending || [],
    weekChartData,
    belumAbsenList,
  };
}

// ═══════════════════════════════════════════════════════════════
// OSIS DASHBOARD
// ═══════════════════════════════════════════════════════════════
export async function getOsisDashboardFull() {
  const today = getTodayWIB();

  const [
    siswaCountRes,
    beritaCountRes,
    rewardHariIniRes,
    pelanggaranHariIniRes,
    recentRewardRes,
    recentPelanggaranRes,
    newsBeritaRes,
    newsPrestasiRes,
  ] = await Promise.all([
    supabaseAdmin.from('siswa').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('news_posts').select('*', { count: 'exact', head: true }).eq('status', 'Publish'),
    supabaseAdmin.from('tb_reward_siswa').select('*', { count: 'exact', head: true }).eq('tanggal', today),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('*', { count: 'exact', head: true }).eq('tanggal', today),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, reward_nama, reward_poin, tanggal, kelas').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, nama_siswa, jenis_pelanggaran, poin, tanggal, kelas').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('news_posts').select('id, slug, title, category, views').eq('status', 'Publish').eq('category', 'Berita Sekolah').order('published_at', { ascending: false }).limit(6),
    supabaseAdmin.from('news_posts').select('id, slug, title, category, views').eq('status', 'Publish').eq('category', 'Siswa Berprestasi').order('published_at', { ascending: false }).limit(6),
  ]);

  const totalSiswa = siswaCountRes.count || 0;
  const totalBerita = beritaCountRes.count || 0;
  const rewardHariIni = rewardHariIniRes.count || 0;
  const pelanggaranHariIni = pelanggaranHariIniRes.count || 0;

  // Chart 30 hari (reward vs pelanggaran)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const startDate = getDateWIB(thirtyDaysAgo);

  const [reward30Res, pelanggaran30Res] = await Promise.all([
    supabaseAdmin.from('tb_reward_siswa').select('tanggal').gte('tanggal', startDate).lte('tanggal', today),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('tanggal').gte('tanggal', startDate).lte('tanggal', today),
  ]);

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