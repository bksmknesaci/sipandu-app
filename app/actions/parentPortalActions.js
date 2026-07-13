'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL } from '@/lib/cacheHelpers'
import { notifyWaliKelasParentMessage } from '@/app/actions/notificationActions';
import { getPJByClass } from '@/app/actions/penanggungJawabActions';

export async function searchStudentByNIS(nis) {
  const nisClean = nis.trim()

  let { data, error } = await supabaseAdmin
    .from('siswa')
    .select('*')
    .eq('nisn', nisClean)
    .single()

  if (error || !data) {
    const { data: data2, error: err2 } = await supabaseAdmin
      .from('siswa')
      .select('*')
      .eq('nis', nisClean)
      .single()

    if (!err2 && data2) return data2

    const { data: data3, error: err3 } = await supabaseAdmin
      .from('siswa')
      .select('*')
      .or(`nisn.ilike.%${nisClean}%,nis.ilike.%${nisClean}%`)
      .limit(1)

    if (!err3 && data3 && data3.length > 0) return data3[0]

    console.log('[searchStudentByNIS] Tidak ditemukan:', nisClean)
    return null
  }

  return data
}

export async function getDashboardData(studentId, studentNisn, studentKelas = '', studentJurusan = '') {
  const now = new Date()
  const today = now.toLocaleDateString('sv-SE')
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthStr = String(currentMonth).padStart(2, '0')

  const lastDay = new Date(currentYear, currentMonth, 0).getDate()
  const startDate = `${currentYear}-${monthStr}-01`
  const endDate = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const kelas = studentKelas
  const jurusan = studentJurusan
  const nisValue = studentNisn || ''

  const [
    todayRes,
    attMonthRes,
    attTimelineRes,
    rewardRes,
    pelanggaranRes,
    msgRes,
    notifRes,
    allHolidaysRes,
    academicRes,
    pjRes,
    rankAllRes,
    penangananRes
  ] = await Promise.all([
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).eq('tanggal', today).single(),
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).gte('tanggal', startDate).lte('tanggal', endDate),
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).order('tanggal', { ascending: false }).limit(15),
    supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisValue).order('tanggal', { ascending: false }),
    supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisValue).order('tanggal', { ascending: false }),
    supabaseAdmin.from('parent_messages').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('parent_notifications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    getCached('holidays_all_portal', () =>
      supabaseAdmin.from('effective_days').select('date, category, holiday_name').then(r => r.data || []),
      TTL.HARI_EFEKTIF
    ),
    supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).single(),
    getCached(`pj_${kelas}_${jurusan}`, () =>
      getPJByClass(kelas, jurusan),
      TTL.PENANGGUNG_JAWAB
    ),
    supabaseAdmin.from('tb_reward_siswa').select('nisn, reward_poin'),
    supabaseAdmin.from('tb_penanganan_siswa').select('*').eq('siswa_id', studentId).single(),
  ]);

  const todayStatus = todayRes.data || null
  const attData = attMonthRes.data || []
  const hadir = attData.filter(a => a.status === 'Hadir').length
  const izin = attData.filter(a => a.status === 'Izin').length
  const sakit = attData.filter(a => a.status === 'Sakit').length
  const alpha = attData.filter(a => a.status === 'Alpha').length

  const allHolidays = allHolidaysRes || []
  const holidays = allHolidays.map(d => d.date)
  let effectiveCount = 0
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(currentYear, currentMonth - 1, d)
    const day = dt.getDay()
    if (day === 0 || day === 6) continue
    const dateStr = dt.toLocaleDateString('sv-SE')
    if (!holidays.includes(dateStr)) effectiveCount++
  }
  const persentase = effectiveCount > 0 ? Math.round((hadir / effectiveCount) * 100) : 0

  const rewards = rewardRes.data || []
  const totalReward = rewards.reduce((s, r) => s + (r.reward_poin || 0), 0)
  const rewardMonthly = {}
  rewards.forEach(r => {
    const m = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'short' })
    rewardMonthly[m] = (rewardMonthly[m] || 0) + (r.reward_poin || 0)
  })

  const pelanggaran = pelanggaranRes.data || []
  const totalPelanggaran = pelanggaran.reduce((s, p) => s + (p.poin || 0), 0)
  const pelanggaranMonthly = {}
  pelanggaran.forEach(p => {
    const m = new Date(p.tanggal).toLocaleDateString('id-ID', { month: 'short' })
    pelanggaranMonthly[m] = (pelanggaranMonthly[m] || 0) + (p.poin || 0)
  })

  const allRewardEntries = rankAllRes.data || []
  const rankMap = {}
  allRewardEntries.forEach(r => {
    rankMap[r.nisn] = (rankMap[r.nisn] || 0) + (r.reward_poin || 0)
  })
  const sorted = Object.entries(rankMap).sort((a, b) => b[1] - a[1])
  const rank = sorted.findIndex(([n]) => n === nisValue) + 1

  const penanganan = penangananRes.data || null

  const waliKelas = pjRes?.wali || null
  const sekretaris = pjRes?.sekretaris || null

  const academicYear = academicRes.data || null

  const messages = msgRes.data || []
  const notifications = notifRes.data || []
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'Wali Kelas').length

  const attendanceTimeline = attTimelineRes.data || []

  const activities = []
  rewards.slice(0, 3).forEach(r => activities.push({ type: 'reward', title: r.reward_nama, date: r.tanggal, poin: r.reward_poin }))
  pelanggaran.slice(0, 3).forEach(p => activities.push({ type: 'pelanggaran', title: p.jenis_pelanggaran, date: p.tanggal, poin: p.poin }))
  messages.slice(0, 2).forEach(m => activities.push({ type: 'message', title: m.message?.substring(0, 60), date: m.created_at }))
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))

  const radarData = [
    { subject: 'Kehadiran', value: Math.min(100, persentase) },
    { subject: 'Prestasi', value: Math.min(100, totalReward * 2) },
    { subject: 'Disiplin', value: Math.max(0, 100 - totalPelanggaran * 8) },
    { subject: 'Aktivitas', value: Math.min(100, (rewards.length + pelanggaran.length) * 6 + 40) },
    { subject: 'Akademik', value: Math.min(100, 50 + totalReward + (persentase > 80 ? 20 : 0)) }
  ]

  return {
    nisValue,
    todayStatus, hadir, izin, sakit, alpha, persentase, effectiveCount, lastDay,
    rewards, totalReward, rewardMonthly,
    pelanggaran, totalPelanggaran, pelanggaranMonthly,
    rank, waliKelas, sekretaris,
    allHolidays, academicYear,
    messages, notifications, unreadMessages,
    attendanceTimeline, activities, radarData,
    penanganan,
    currentMonth, currentYear
  }
}

export async function sendParentMessage(studentId, message) {
  const { error } = await supabaseAdmin.from('parent_messages').insert({
    student_id: studentId, sender_type: 'Orang Tua', sender_id: null, message
  })
  if (error) return { error: error.message }

  try {
    const { data: studentInfo } = await supabaseAdmin
      .from('siswa')
      .select('nama, kelas, jurusan')
      .eq('id', studentId)
      .single();

    if (studentInfo) {
      await notifyWaliKelasParentMessage({
        siswaNama: studentInfo.nama,
        kelas: studentInfo.kelas,
        jurusan: studentInfo.jurusan,
        siswaId: studentId,
        pesanPreview: message,
      });
    }
  } catch (notifErr) {
    console.error('[sendParentMessage] Gagal kirim notifikasi WK:', notifErr);
  }

  return { success: true }
}

export async function deleteParentMessage(messageId) {
  const { data: msg, error: fetchErr } = await supabaseAdmin
    .from('parent_messages')
    .select('sender_type')
    .eq('id', messageId)
    .single()

  if (fetchErr || !msg) return { error: 'Pesan tidak ditemukan' }
  if (msg.sender_type !== 'Orang Tua') return { error: 'Hanya bisa menghapus pesan yang Anda kirim' }

  const { error } = await supabaseAdmin
    .from('parent_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_type', 'Orang Tua')

  if (error) return { error: error.message }
  return { success: true }
}

export async function markNotificationRead(id) {
  await supabaseAdmin.from('parent_notifications').update({ is_read: true }).eq('id', id)
}

export async function deleteOldParentMessages(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const ds = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const { error } = await supabaseAdmin.from('parent_messages').delete().lt('created_at', ds);
  if (error) console.error('[deleteOldParentMessages] Error:', error.message);
  return { error };
}

export async function getParentMessages(studentId) {
  await deleteOldParentMessages(7);
  const { data, error } = await supabaseAdmin
    .from('parent_messages')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return { data: [], error: error.message }
  return { data: data || [], error: null }
}

// ═══════════════════════════════════════════════════════════════
// PARENT NOTIFICATIONS (untuk lonceng notif di Portal Orang Tua)
// ═══════════════════════════════════════════════════════════════
export async function createParentNotification(studentId, title, message, type = 'system') {
  const { data, error } = await supabaseAdmin.from('parent_notifications').insert({
    student_id: studentId,
    title,
    message: message || null,
    type,
    is_read: false,
  }).select().single();
  if (error) console.error('[createParentNotification] Error:', error.message);
  return { data, error };
}

export async function getParentNotifications(studentId) {
  // Auto-hapus notif > 7 hari
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const ds = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  await supabaseAdmin.from('parent_notifications').delete().lt('created_at', ds);

  const { data, error } = await supabaseAdmin
    .from('parent_notifications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return { data: [], error: error.message };
  return { data: data || [], error: null };
}

export async function sendWKReplyMessage(studentId, message, senderId) {
  const { error } = await supabaseAdmin.from('parent_messages').insert({
    student_id: studentId,
    sender_type: 'Wali Kelas',
    sender_id: senderId || null,
    message,
    is_read: false,
  })
  if (error) return { error: error.message }

  // Kirim notifikasi ke orang tua
  try {
    const { data: studentInfo } = await supabaseAdmin
      .from('siswa')
      .select('nama')
      .eq('id', studentId)
      .single();

    const preview = (message || '').substring(0, 80);
    await createParentNotification(
      studentId,
      `💬 Balasan dari Wali Kelas`,
      studentInfo
        ? `Wali Kelas ${studentInfo.nama}: "${preview}${message.length > 80 ? '...' : ''}"`
        : `Wali Kelas: "${preview}${message.length > 80 ? '...' : ''}"`,
      'wk_reply'
    );
  } catch (notifErr) {
    console.error('[sendWKReplyMessage] Gagal kirim notifikasi orang tua:', notifErr);
  }

  return { success: true }
}