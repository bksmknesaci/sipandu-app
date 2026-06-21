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
  return { data, error };
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

  const { data, error, count } = await query
    .range(offset, offset + limit - 1);

  return { data: data || [], error, total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
export async function markAsRead(notificationId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId);
  return { error };
}

export async function markAllAsRead(userId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
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
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .lt('created_at', ds);
  return { error };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS: Cari User ID berdasarkan role & kelas
// ═══════════════════════════════════════════════════════════════
export async function getUserIdsByRole(role, { kelas, status = 'Aktif' } = {}) {
  let query = supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', role)
    .eq('status', status);
  if (kelas) query = query.eq('kelas', kelas);
  const { data } = await query;
  return (data || []).map(u => u.id);
}

export async function getWaliKelasUserId(kelas) {
  if (!kelas) return null;
  const kelasArr = (kelas || '').trim().split(/\s+/);
  const tingkat = kelasArr[0] || '';
  const jurusan = kelasArr.slice(1).join(' ') || '';
  let query = supabaseAdmin
    .from('users')
    .select('id, kelas')
    .eq('role', 'Wali Kelas')
    .eq('status', 'Aktif');
  if (tingkat) query = query.ilike('kelas', `%${tingkat}%`);
  if (jurusan) query = query.ilike('kelas', `%${jurusan}%`);
  const { data } = await query.limit(1).single();
  return data?.id || null;
}

export async function getSekretarisUserId(kelas) {
  if (!kelas) return null;
  const kelasArr = (kelas || '').trim().split(/\s+/);
  const tingkat = kelasArr[0] || '';
  const jurusan = kelasArr.slice(1).join(' ') || '';
  let query = supabaseAdmin
    .from('users')
    .select('id, kelas')
    .eq('role', 'Sekretaris Kelas')
    .eq('status', 'Aktif');
  if (tingkat) query = query.ilike('kelas', `%${tingkat}%`);
  if (jurusan) query = query.ilike('kelas', `%${jurusan}%`);
  const { data } = await query.limit(1).single();
  return data?.id || null;
}

export async function getAdminUserIds() {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'Administrator')
    .eq('status', 'Aktif');
  return (data || []).map(u => u.id);
}

// ═══════════════════════════════════════════════════════════════
// READ ADVANCED (untuk halaman pusat notifikasi)
// ═══════════════════════════════════════════════════════════════
export async function getUserNotificationsAdvanced(userId, { limit = 20, offset = 0, filter = 'all', dateFilter = 'all', search = '' } = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Filter status
  if (filter === 'unread') query = query.eq('is_read', false);
  else if (filter === 'read') query = query.eq('is_read', true);
  else if (filter === 'important') query = query.in('priority', ['WARNING', 'DANGER']);
  else if (filter === 'system') query = query.eq('type', 'system');

  // Filter tanggal
  if (dateFilter === 'today') {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    query = query.gte('created_at', today).lt('created_at', today + 'T24:00:00');
  } else if (dateFilter === '7days') {
    const d = new Date(); d.setDate(d.getDate() - 7);
    const ds = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    query = query.gte('created_at', ds);
  } else if (dateFilter === '30days') {
    const d = new Date(); d.setDate(d.getDate() - 30);
    const ds = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    query = query.gte('created_at', ds);
  }

  // Search
  if (search && search.trim().length > 0) {
    const s = search.trim();
    query = query.or(`title.ilike.%${s}%,message.ilike.%${s}%`);
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