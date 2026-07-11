'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers';

// ── OPTIMASI: Throttle deleteOldNotifications — max 1x per 5 menit ──
let lastCleanupTime = 0;

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
  invalidateCacheByPrefix('notif_');
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
  invalidateCacheByPrefix('notif_');
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
  const izinEmoji = jenisAbsensi === 'Izin' ? '📋' : '🤒';
  if (!waliId) {
    console.log(`[notifyWK-SI] Wali Kelas TIDAK DITEMUKAN untuk kelas="${kelas}" jurusan="${jurusan}"`);
    return null;
  }
  return createNotificationWithAdminCC({
    userId: waliId,
    title: `${izinEmoji} Pengajuan ${jenisAbsensi} Baru`,
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
  return createNotificationWithAdminCC({
    userId: waliId,
    title: `💬 Pesan Baru dari Orang Tua`,
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
    title: isApproved ? `✅ Revisi Absensi Disetujui` : `❌ Revisi Absensi Ditolak`,
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
// ── OPTIMASI: Cache 10 detik per userId — dipanggil setiap navigasi header ──
export async function getUnreadCount(userId) {
  // ── Throttle cleanup — max 1x per 5 menit ──
  const now = Date.now();
  if (now - lastCleanupTime > 5 * 60 * 1000) {
    lastCleanupTime = now;
    deleteOldNotifications(7);
  }

  const cacheKey = `notif_unread_${userId}`;
  return getCached(cacheKey, async () => {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { count: count || 0, error };
  }, TTL.SHORT);
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
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function markAsRead(notificationId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) console.error('[markAsRead] Error:', error.message);
  invalidateCacheByPrefix('notif_');
  return { error };
}

export async function markAllAsRead(userId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) console.error('[markAllAsRead] Error:', error.message);
  invalidateCacheByPrefix('notif_');
  return { error };
}

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════
export async function deleteNotification(notificationId) {
  const { error } = await supabaseAdmin.from('notifications').delete().eq('id', notificationId);
  invalidateCacheByPrefix('notif_');
  return { error };
}

export async function deleteAllNotifications(userId) {
  const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
  invalidateCacheByPrefix('notif_');
  return { error };
}

export async function deleteOldNotifications(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const ds = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const { error } = await supabaseAdmin.from('notifications').delete().lt('created_at', ds);
  if (error) console.error('[deleteOldNotifications] Error:', error.message);
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

// ── OPTIMASI: Cache 10 menit — daftar Admin jarang berubah ──
export async function getAdminUserIds() {
  return getCached('admin_user_ids', async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'Administrator')
      .eq('status', 'Aktif');
    const ids = (data || []).map(u => u.id);
    console.log(`[getAdminUserIds] Found ${ids.length} admin`);
    if (error) console.error('[getAdminUserIds] Error:', error.message);
    return ids;
  }, TTL.SETTINGS);
}

/**
 * ── OPTIMASI: Cache 5 menit — mapping kelas→WK jarang berubah ──
 */
export async function getWaliKelasUserId(kelas, jurusan = '') {
  if (!kelas) return null;

  const cacheKey = `wk_id_${kelas.trim()}_${(jurusan || '').trim()}`;

  return getCached(cacheKey, async () => {
    let tingkat, jurusanPart;
    if (jurusan && jurusan.trim()) {
      const kelasWords = kelas.trim().split(/\s+/);
      tingkat = kelasWords[0] || '';
      jurusanPart = jurusan.trim();
    } else {
      const kelasArr = kelas.trim().split(/\s+/);
      tingkat = kelasArr[0] || '';
      jurusanPart = kelasArr.length > 1 ? kelasArr.slice(1).join(' ') : '';
    }

    // Strategi 1: Exact match kelas (tingkat) + ILIKE jurusan — cara paling akurat
    // users.kelas = "XII", users.jurusan = "RPL 2"
    if (tingkat) {
      let query = supabaseAdmin
        .from('users')
        .select('id, kelas, jurusan, nama')
        .eq('role', 'Wali Kelas')
        .eq('status', 'Aktif')
        .eq('kelas', tingkat);

      if (jurusanPart) {
        query = query.ilike('jurusan', `%${jurusanPart}%`);
      }

      let { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) return data[0].id;
    }

    // Strategi 2: ILIKE jurusan saja (fallback jika tingkat tidak cocok)
    if (jurusanPart) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, kelas, jurusan, nama')
        .eq('role', 'Wali Kelas')
        .eq('status', 'Aktif')
        .ilike('jurusan', `%${jurusanPart}%`)
        .limit(1);
      if (!error && data && data.length > 0) return data[0].id;
    }

    // Strategi 3: ILIKE kelas dengan full string (fallback format lama)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, kelas, jurusan, nama')
      .eq('role', 'Wali Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${kelas.trim()}%`)
      .limit(1);
    if (!error && data && data.length > 0) return data[0].id;

    console.log(`[getWaliKelasUserId] Tidak ditemukan untuk kelas="${kelas}" jurusan="${jurusan}"`);
    return null;
  }, TTL.PENANGGUNG_JAWAB);
}

/**
 * ── OPTIMASI: Cache 5 menit — sama seperti WK ──
 */
export async function getSekretarisUserId(kelas, jurusan = '') {
  if (!kelas) return null;

  const cacheKey = `sek_id_${kelas.trim()}_${(jurusan || '').trim()}`;

  return getCached(cacheKey, async () => {
    let tingkat, jurusanPart;
    if (jurusan && jurusan.trim()) {
      const kelasWords = kelas.trim().split(/\s+/);
      tingkat = kelasWords[0] || '';
      jurusanPart = jurusan.trim();
    } else {
      const kelasArr = kelas.trim().split(/\s+/);
      tingkat = kelasArr[0] || '';
      jurusanPart = kelasArr.length > 1 ? kelasArr.slice(1).join(' ') : '';
    }

    // Strategi 1: Exact match kelas (tingkat) + ILIKE jurusan
    if (tingkat) {
      let query = supabaseAdmin
        .from('users')
        .select('id, kelas, jurusan, nama')
        .eq('role', 'Sekretaris Kelas')
        .eq('status', 'Aktif')
        .eq('kelas', tingkat);

      if (jurusanPart) {
        query = query.ilike('jurusan', `%${jurusanPart}%`);
      }

      let { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) return data[0].id;
    }

    // Strategi 2: ILIKE jurusan saja
    if (jurusanPart) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, kelas, jurusan, nama')
        .eq('role', 'Sekretaris Kelas')
        .eq('status', 'Aktif')
        .ilike('jurusan', `%${jurusanPart}%`)
        .limit(1);
      if (!error && data && data.length > 0) return data[0].id;
    }

    // Strategi 3: ILIKE kelas dengan full string (fallback format lama)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, kelas, jurusan, nama')
      .eq('role', 'Sekretaris Kelas')
      .eq('status', 'Aktif')
      .ilike('kelas', `%${kelas.trim()}%`)
      .limit(1);
    if (!error && data && data.length > 0) return data[0].id;

    console.log(`[getSekretarisUserId] Tidak ditemukan untuk kelas="${kelas}" jurusan="${jurusan}"`);
    return null;
  }, TTL.PENANGGUNG_JAWAB);
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
    // ── OPTIMASI: Escape wildcard ILIKE untuk mencegah pattern injection ──
    const safeSearch = search.trim().replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${safeSearch}%,message.ilike.%${safeSearch}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data: data || [], error, total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// GET NOTIFICATIONS UNTUK WIDGET DASHBOARD (5 terbaru)
// ── OPTIMASI: Cache 10 detik per userId ──
// ═══════════════════════════════════════════════════════════════
export async function getDashboardNotifications(userId) {
  const cacheKey = `notif_dashboard_${userId}`;
  return getCached(cacheKey, async () => {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, type, priority, action_url, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    return { data: data || [], error };
  }, TTL.SHORT);
}