'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
export async function createNotification({ userId, title, message, type, priority, referenceType, referenceId, actionUrl }) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message: message || null,
      type: type || 'system',
      priority: priority || 'INFO',
      reference_type: referenceType || null,
      reference_id: String(referenceId || ''),
      action_url: actionUrl || null,
      is_read: false,
    })
    .select()
    .single();
  if (error) console.error('[createNotification] Error:', error.message);
  return { data, error };
}

export async function notifyMultipleUsers({ userIds, title, message, type, priority, referenceType, referenceId, actionUrl }) {
  if (!userIds || userIds.length === 0) return { data: [], error: null };
  const rows = userIds.map(uid => ({
    user_id: uid,
    title,
    message: message || null,
    type: type || 'system',
    priority: priority || 'INFO',
    reference_type: referenceType || null,
    reference_id: String(referenceId || ''),
    action_url: actionUrl || null,
    is_read: false,
  }));
  const { data, error } = await supabaseAdmin.from('notifications').insert(rows).select();
  if (error) console.error('[notifyMultipleUsers] Error:', error.message);
  return { data, error };
}

// ═══════════════════════════════════════════════════════════════
// CREATE WITH ADMIN CC
// ═══════════════════════════════════════════════════════════════
export async function createNotificationWithAdminCC({ userId, title, message, type, priority, referenceType, referenceId, actionUrl, skipAdmin = false }) {
  const result = await createNotification({ userId, title, message, type, priority, referenceType, referenceId, actionUrl });

  if (!skipAdmin) {
    try {
      const adminIds = await getAdminUserIds();
      const ccIds = adminIds.filter(id => String(id) !== String(userId));
      if (ccIds.length > 0) {
        await notifyMultipleUsers({ userIds: ccIds, title, message, type, priority, referenceType, referenceId, actionUrl });
      }
    } catch (e) {
      console.error('[AdminCC] Gagal kirim copy ke admin:', e);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE: Notifikasi per tipe
// ═══════════════════════════════════════════════════════════════
export async function notifyWaliKelasSakitIzin({ siswaNama, kelas, jurusan, jenisAbsensi, siswaId }) {
  const waliId = await getWaliKelasUserId(kelas, jurusan);
  if (!waliId) {
    console.log(`[notifyWK-SI] Wali Kelas TIDAK DITEMUKAN untuk kelas="${kelas}" jurusan="${jurusan}"`);
    return null;
  }
  console.log(`[notifyWK-SI] Wali Kelas DITEMUKAN id=${waliId} untuk kelas="${kelas}" jurusan="${jurusan}"`);
  return createNotificationWithAdminCC({
    userId: waliId,
    title: `🤒 Pengajuan ${jenisAbsensi} Baru`,
    message: `${siswaNama} (${kelas} ${jurusan}) mengajukan ${jenisAbsensi.toLowerCase()}. Segera verifikasi pengajuannya.`,
    type: 'sick_permission',
    priority: 'WARNING',
    referenceType: 'sakit_izin',
    referenceId: String(siswaId || ''),
    actionUrl: '/wali-kelas/rekap-sakit-izin',
  });
}

export async function notifyWaliKelasParentMessage({ siswaNama, kelas, jurusan, siswaId, pesanPreview }) {
  const waliId = await getWaliKelasUserId(kelas, jurusan);
  if (!waliId) {
    console.log(`[notifyWK-MSG] Wali Kelas TIDAK DITEMUKAN untuk kelas="${kelas}" jurusan="${jurusan}"`);
    return null;
  }
  console.log(`[notifyWK-MSG] Wali Kelas DITEMUKAN id=${waliId}`);
  return createNotificationWithAdminCC({
    userId: waliId,
    title: '💬 Pesan Baru dari Orang Tua',
    message: `Orang tua ${siswaNama} (${kelas} ${jurusan}) mengirim pesan: "${(pesanPreview || '').substring(0, 80)}"`,
    type: 'parent_message',
    priority: 'WARNING',
    referenceType: 'parent_message',
    referenceId: String(siswaId || ''),
    actionUrl: '/portal-ortu',
  });
}

export async function notifySekretarisRevision({ sekretarisId, siswaNama, tanggal, kelas, isApproved }) {
  if (!sekretarisId) {
    console.log('[notifySekretaris-REV] Sekretaris ID kosong, skip notifikasi');
    return null;
  }
  return createNotificationWithAdminCC({
    userId: sekretarisId,
    title: isApproved ? '✅ Revisi Absensi Disetujui' : '❌ Revisi Absensi Ditolak',
    message: `Pengajuan revisi absensi untuk ${siswaNama} (${kelas}) tanggal ${tanggal} telah ${isApproved ? 'disetujui' : 'ditolak'} oleh Administrator.`,
    type: 'attendance_revision',
    priority: isApproved ? 'SUCCESS' : 'DANGER',
    referenceType: 'absensi_edit',
    referenceId: tanggal,
    actionUrl: '/absensi',
  });
}

// ═══════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════
export async function getUnreadCount(userId) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return { count: count || 0, error };
}

export async function getUserNotifications(userId, { limit = 20, offset = 0, filter = 'all' } = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filter === 'unread') query = query.eq('is_read', false);
  if (filter === 'important') query = query.in('priority', ['WARNING', 'DANGER']);
  if (filter === 'system') query = query.eq('type', 'system');

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  return { data: data || [], error, total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE (tanpa updated_at — kolom tidak ada di tabel)
// ═══════════════════════════════════════════════════════════════
export async function markAsRead(notificationId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) console.error('[markAsRead] Error:', error.message);
  return { error };
}

export async function markAllAsRead(userId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) console.error('[markAllAsRead] Error:', error.message);
  return { error };
}

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════
export async function deleteNotification(notificationId) {
  const { error } = await supabaseAdmin.from('notifications').delete().eq('id', notificationId);
  return { error };
}

export async function deleteAllNotifications(userId) {
  const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
  return { error };
}

export async function deleteOldNotifications(days = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const ds = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const { error } = await supabaseAdmin.from('notifications').delete().lt('created_at', ds);
  return { error };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS: Cari User ID berdasarkan role & kelas
// ═══════════════════════════════════════════════════════════════
export async function getUserIdsByRole(role, { kelas, status = 'Aktif' } = {}) {
  let query = supabaseAdmin.from('users').select('id').eq('role', role).eq('status', status);
  if (kelas) query = query.eq('kelas', kelas);
  const { data } = await query;
  return (data || []).map(u => u.id);
}

export async function getAdminUserIds() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'Administrator')
    .eq('status', 'Aktif');
  return (data || []).map(u => u.id);
}

/**
 * Cari ID Wali Kelas berdasarkan kelas & jurusan.
 * 3 strategi fallback:
 *   1. Gabungan kelas+jurusan ILIKE (paling ketat)
 *   2. Pisahkan kata pertama sebagai tingkat + jurusan terpisah
 *   3. Hanya jurusan saja (paling longgar)
 */
export async function getWaliKelasUserId(kelas, jurusan = '') {
  if (!kelas) return null;

  // ── Ekstrak tingkat & jurusanPart ──
  let tingkat, jurusanPart;
  if (jurusan && jurusan.trim()) {
    // Format terpisah dari tabel siswa: kelas="X DKV 3", jurusan="DKV"
    // Ambil hanya kata pertama kelas sebagai tingkat
    const kelasWords = kelas.trim().split(/\s+/);
    tingkat = kelasWords[0] || '';
    jurusanPart = jurusan.trim();
  } else {
    // Format gabungan: kelas="X DKV 3"
    const kelasArr = kelas.trim().split(/\s+/);
    tingkat = kelasArr[0] || '';
    jurusanPart = kelasArr.length > 1 ? kelasArr[1] : '';
  }

  console.log(`[getWaliKelasUserId] Input: kelas="${kelas}" jurusan="${jurusan}" → tingkat="${tingkat}" jurusanPart="${jurusanPart}"`);

  // ── Strategi 1: tingkat + jurusanPart (paling ketat) ──
  let query = supabaseAdmin
    .from('users')
    .select('id, kelas, nama')
    .eq('role', 'Wali Kelas')
    .eq('status', 'Aktif');
  if (tingkat) query = query.ilike('kelas', `%${tingkat}%`);
  if (jurusanPart) query = query.ilike('kelas', `%${jurusanPart}%`);
  let { data, error } = await query.limit(1);
  if (!error && data && data.length > 0) {
    console.log(`[getWaliKelasUserId] ✅ Strategi 1: id=${data[0].id} kelas="${data[0].kelas}" nama="${data[0].nama}"`);
    return data[0].id;
  }
  console.log(`[getWaliKelasUserId] Strategi 1 gagal: ${error?.message || '0 hasil'}`);

  // ── Strategi 2: coba dengan jurusan dari dalam kelas sendiri ──
  // Contoh: kelas="X DKV 3" → tingkat="X", jurusan="DKV"
  const allWords = kelas.trim().split(/\s+/);
  if (allWords.length >= 2) {
    const t2 = allWords[0];
    const j2 = allWords[1];
    query = supabaseAdmin
      .from('users')
      .select('id, kelas, nama')
      .eq('role', 'Wali Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${t2}%`)
      .ilike('kelas', `%${j2}%`);
    ({ data, error } = await query.limit(1));
    if (!error && data && data.length > 0) {
      console.log(`[getWaliKelasUserId] ✅ Strategi 2: id=${data[0].id} kelas="${data[0].kelas}" nama="${data[0].nama}"`);
      return data[0].id;
    }
    console.log(`[getWaliKelasUserId] Strategi 2 gagal: ${error?.message || '0 hasil'}`);
  }

  // ── Strategi 3: hanya jurusan saja (paling longgar) ──
  const jurusanSearch = jurusanPart || (allWords.length >= 2 ? allWords[1] : '');
  if (jurusanSearch) {
    query = supabaseAdmin
      .from('users')
      .select('id, kelas, nama')
      .eq('role', 'Wali Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${jurusanSearch}%`);
    ({ data, error } = await query.limit(1));
    if (!error && data && data.length > 0) {
      console.log(`[getWaliKelasUserId] ✅ Strategi 3 (jurusan only): id=${data[0].id} kelas="${data[0].kelas}" nama="${data[0].nama}"`);
      return data[0].id;
    }
    console.log(`[getWaliKelasUserId] Strategi 3 gagal: ${error?.message || '0 hasil'}`);
  }

  // ── Strategi 4: full kelas ILIKE (fallback terakhir) ──
  query = supabaseAdmin
    .from('users')
    .select('id, kelas, nama')
    .eq('role', 'Wali Kelas')
    .eq('status', 'Aktif')
    .ilike('kelas', `%${kelas.trim()}%`);
  ({ data, error } = await query.limit(1));
  if (!error && data && data.length > 0) {
    console.log(`[getWaliKelasUserId] ✅ Strategi 4 (full kelas): id=${data[0].id} kelas="${data[0].kelas}" nama="${data[0].nama}"`);
    return data[0].id;
  }
  console.log(`[getWaliKelasUserId] ❌ SEMUA STRATEGI GAGAL untuk kelas="${kelas}" jurusan="${jurusan}"`);
  return null;
}

/**
 * Sama seperti getWaliKelasUserId tapi untuk Sekretaris Kelas.
 */
export async function getSekretarisUserId(kelas, jurusan = '') {
  if (!kelas) return null;

  let tingkat, jurusanPart;
  if (jurusan && jurusan.trim()) {
    const kelasWords = kelas.trim().split(/\s+/);
    tingkat = kelasWords[0] || '';
    jurusanPart = jurusan.trim();
  } else {
    const kelasArr = kelas.trim().split(/\s+/);
    tingkat = kelasArr[0] || '';
    jurusanPart = kelasArr.length > 1 ? kelasArr[1] : '';
  }

  console.log(`[getSekretarisUserId] Input: kelas="${kelas}" jurusan="${jurusan}" → tingkat="${tingkat}" jurusanPart="${jurusanPart}"`);

  // Strategi 1
  let query = supabaseAdmin
    .from('users')
    .select('id, kelas, nama')
    .eq('role', 'Sekretaris Kelas')
    .eq('status', 'Aktif');
  if (tingkat) query = query.ilike('kelas', `%${tingkat}%`);
  if (jurusanPart) query = query.ilike('kelas', `%${jurusanPart}%`);
  let { data, error } = await query.limit(1);
  if (!error && data && data.length > 0) {
    console.log(`[getSekretarisUserId] ✅ Strategi 1: id=${data[0].id} kelas="${data[0].kelas}"`);
    return data[0].id;
  }

  // Strategi 2
  const allWords = kelas.trim().split(/\s+/);
  if (allWords.length >= 2) {
    query = supabaseAdmin
      .from('users')
      .select('id, kelas, nama')
      .eq('role', 'Sekretaris Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${allWords[0]}%`)
      .ilike('kelas', `%${allWords[1]}%`);
    ({ data, error } = await query.limit(1));
    if (!error && data && data.length > 0) {
      console.log(`[getSekretarisUserId] ✅ Strategi 2: id=${data[0].id} kelas="${data[0].kelas}"`);
      return data[0].id;
    }
  }

  // Strategi 3
  const jurusanSearch = jurusanPart || (allWords.length >= 2 ? allWords[1] : '');
  if (jurusanSearch) {
    query = supabaseAdmin
      .from('users')
      .select('id, kelas, nama')
      .eq('role', 'Sekretaris Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${jurusanSearch}%`);
    ({ data, error } = await query.limit(1));
    if (!error && data && data.length > 0) {
      console.log(`[getSekretarisUserId] ✅ Strategi 3: id=${data[0].id} kelas="${data[0].kelas}"`);
      return data[0].id;
    }
  }

  console.log(`[getSekretarisUserId] ❌ SEMUA STRATEGI GAGAL untuk kelas="${kelas}" jurusan="${jurusan}"`);
  return null;
}

// ═══════════════════════════════════════════════════════════════
// READ ADVANCED (untuk halaman pusat notifikasi)
// ═══════════════════════════════════════════════════════════════
export async function getUserNotificationsAdvanced(userId, { limit = 20, offset = 0, filter = 'all', dateFilter = 'all', search = '' } = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filter === 'unread') query = query.eq('is_read', false);
  else if (filter === 'read') query = query.eq('is_read', true);
  else if (filter === 'important') query = query.in('priority', ['WARNING', 'DANGER']);
  else if (filter === 'system') query = query.eq('type', 'system');

  if (dateFilter === 'today') {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    query = query.gte('created_at', today).lt('created_at', today + 'T24:00:00');
  } else if (dateFilter === '7days') {
    const d = new Date(); d.setDate(d.getDate() - 7);
    query = query.gte('created_at', d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  } else if (dateFilter === '30days') {
    const d = new Date(); d.setDate(d.getDate() - 30);
    query = query.gte('created_at', d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }));
  }

  if (search && search.trim().length > 0) {
    query = query.or(`title.ilike.%${search.trim()}%,message.ilike.%${search.trim()}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data || [], error, total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// GET NOTIFICATIONS UNTUK WIDGET DASHBOARD (5 terbaru)
// ═══════════════════════════════════════════════════════════════
export async function getDashboardNotifications(userId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, title, message, type, priority, action_url, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  return { data: data || [], error };
}