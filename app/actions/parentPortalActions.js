'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWaliKelasUserId, createNotification } from '@/app/actions/notificationActions';

export async function searchStudentByNIS(nis) {
  const nisClean = nis.trim()

  // Cari di kolom nisn (format baru)
  let { data, error } = await supabaseAdmin
    .from('siswa')
    .select('*')
    .eq('nisn', nisClean)
    .single()

  // Fallback: cari di kolom nis (format lama)
  if (error || !data) {
    const { data: data2, error: err2 } = await supabaseAdmin
      .from('siswa')
      .select('*')
      .eq('nis', nisClean)
      .single()

    if (!err2 && data2) return data2

    // Fallback: cari dengan ilike
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

  // Hitung batas tanggal bulan ini dengan benar
  const lastDay = new Date(currentYear, currentMonth, 0).getDate()
  const startDate = `${currentYear}-${monthStr}-01`
  const endDate = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const kelas = studentKelas
  const jurusan = studentJurusan
  const nisValue = studentNisn || ''

  // Ambil semua data paralel
    const [
    todayRes,
    attMonthRes,
    attTimelineRes,
    rewardRes,
    pelanggaranRes,
    msgRes,
    notifRes,
    effectiveRes,
    calendarRes,
    academicRes,
    waliSekretarisRes,
    rankAllRes,
    penangananRes
  ] = await Promise.all([
    // 1. Hari ini
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).eq('tanggal', today).single(),
    // 2. Absensi bulan ini
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).gte('tanggal', startDate).lte('tanggal', endDate),
    // 3. Timeline absensi terakhir
    supabaseAdmin.from('absensi').select('*').eq('siswa_id', studentId).order('tanggal', { ascending: false }).limit(15),
    // 4. Reward berdasarkan NISN
    supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisValue).order('tanggal', { ascending: false }),
    // 5. Pelanggaran berdasarkan NISN
    supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisValue).order('tanggal', { ascending: false }),
    // 6. Pesan
    supabaseAdmin.from('parent_messages').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50),
    // 7. Notifikasi
    supabaseAdmin.from('parent_notifications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    // 8. Hari efektif bulan ini
    supabaseAdmin.from('effective_days').select('*').gte('date', startDate).lte('date', endDate),
    // 9. Kalender untuk highlight
    supabaseAdmin.from('effective_days').select('*').gte('date', startDate).lte('date', endDate),
    // 10. Kalender akademik aktif
    supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).single(),
    // 11. Wali Kelas & Sekretaris
    supabaseAdmin.from('users').select('*').in('role', ['Wali Kelas', 'Sekretaris Kelas']),
    // 12. Semua reward untuk ranking
    supabaseAdmin.from('tb_reward_siswa').select('nisn, reward_poin'),
    // 13. Data Penanganan Siswa (SP)
    supabaseAdmin.from('tb_penanganan_siswa').select('*').eq('siswa_id', studentId).single(),
  ]);

  // === PROSES KEHADIRAN ===
  const todayStatus = todayRes.data || null
  const attData = attMonthRes.data || []
  const hadir = attData.filter(a => a.status === 'Hadir').length
  const izin = attData.filter(a => a.status === 'Izin').length
  const sakit = attData.filter(a => a.status === 'Sakit').length
  const alpha = attData.filter(a => a.status === 'Alpha').length

  // Hitung hari efektif (bukan weekend, bukan libur)
  const holidays = (effectiveRes.data || []).map(d => d.date)
  let effectiveCount = 0
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(currentYear, currentMonth - 1, d)
    const day = dt.getDay()
    if (day === 0 || day === 6) continue
    const dateStr = dt.toLocaleDateString('sv-SE')
    if (!holidays.includes(dateStr)) effectiveCount++
  }
  const persentase = effectiveCount > 0 ? Math.round((hadir / effectiveCount) * 100) : 0

  // === PROSES REWARD ===
  const rewards = rewardRes.data || []
  const totalReward = rewards.reduce((s, r) => s + (r.reward_poin || 0), 0)
  const rewardMonthly = {}
  rewards.forEach(r => {
    const m = new Date(r.tanggal).toLocaleDateString('id-ID', { month: 'short' })
    rewardMonthly[m] = (rewardMonthly[m] || 0) + (r.reward_poin || 0)
  })

  // === PROSES PELANGGARAN ===
  const pelanggaran = pelanggaranRes.data || []
  const totalPelanggaran = pelanggaran.reduce((s, p) => s + (p.poin || 0), 0)
  const pelanggaranMonthly = {}
  pelanggaran.forEach(p => {
    const m = new Date(p.tanggal).toLocaleDateString('id-ID', { month: 'short' })
    pelanggaranMonthly[m] = (pelanggaranMonthly[m] || 0) + (p.poin || 0)
  })

  // === RANKING REWARD ===
  const allRewardEntries = rankAllRes.data || []
  const rankMap = {}
  allRewardEntries.forEach(r => {
    rankMap[r.nisn] = (rankMap[r.nisn] || 0) + (r.reward_poin || 0)
  })
  const sorted = Object.entries(rankMap).sort((a, b) => b[1] - a[1])
  const rank = sorted.findIndex(([n]) => n === nisValue) + 1

  // === PENANGANAN SISWA (SP) ===
  const penanganan = penangananRes.data || null

  // === WALI KELAS & SEKRETARIS ===
  const allPJ = waliSekretarisRes.data || []
  const kelasLower = (kelas || '').toLowerCase().trim()

  // Fungsi matching fleksibel: "XI" cocok dengan "XI TKRO 1", "XI TKRO" cocok dengan "XI TKRO 1", dll
  function matchKelas(userKelas) {
    if (!userKelas || !kelasLower) return false
    const uk = userKelas.toLowerCase().trim()
    if (uk === kelasLower) return true
    const tingkatSiswa = kelasLower.split(/[\s-]/)[0]
    if (uk === tingkatSiswa) return true
    if (kelasLower.includes(uk) || uk.includes(tingkatSiswa)) return true
    return false
  }

  const waliKelas = allPJ.find(u => u.role === 'Wali Kelas' && matchKelas(u.kelas)) || null
  const sekretaris = allPJ.find(u => u.role === 'Sekretaris Kelas' && matchKelas(u.kelas)) || null

  // === KALENDER ===
  const calEvents = calendarRes.data || []
  const calendarDays = []
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(currentYear, currentMonth - 1, d)
    const dateStr = dt.toLocaleDateString('sv-SE')
    const day = dt.getDay()
    let type = 'effective'
    if (day === 0 || day === 6) {
      type = 'weekend'
    } else {
      const holiday = calEvents.find(e => e.date === dateStr)
      if (holiday) {
        const cat = holiday.category
        if (cat === 'Nasional') type = 'holiday_nasional'
        else if (cat === 'Ujian') type = 'ujian'
        else if (cat === 'Kegiatan Sekolah' || cat === 'Khusus') type = 'kegiatan'
        else type = 'holiday_sekolah'
      }
    }
    calendarDays.push({ day: d, date: dateStr, type, holiday: calEvents.find(e => e.date === dateStr)?.holiday_name || null })
  }

  const academicYear = academicRes.data || null

  // === PESAN & NOTIFIKASI ===
  const messages = msgRes.data || []
  const notifications = notifRes.data || []
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'Wali Kelas').length

  // Timeline absensi
  const attendanceTimeline = attTimelineRes.data || []

  // === AKTIVITAS TERBARU ===
  const activities = []
  rewards.slice(0, 3).forEach(r => activities.push({ type: 'reward', title: r.reward_nama, date: r.tanggal, poin: r.reward_poin }))
  pelanggaran.slice(0, 3).forEach(p => activities.push({ type: 'pelanggaran', title: p.jenis_pelanggaran, date: p.tanggal, poin: p.poin }))
  messages.slice(0, 2).forEach(m => activities.push({ type: 'message', title: m.message?.substring(0, 60), date: m.created_at }))
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))

  // === RADAR CHART ===
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
    calendarDays, academicYear,
    messages, notifications, unreadMessages,
    attendanceTimeline, activities, radarData,
    penanganan,
    currentMonth, currentYear
  }
}

export async function sendParentMessage(studentId, message) {
  const { error } = await supabaseAdmin.from('parent_messages').insert({
    student_id: studentId, sender_type: 'Orang Tua', message
  })
  if (error) return { error: error.message }

  // ── Kirim notifikasi ke Wali Kelas ──
  try {
    const { data: studentInfo } = await supabaseAdmin
      .from('siswa')
      .select('nama, kelas, jurusan')
      .eq('id', studentId)
      .single();

    if (studentInfo) {
      const waliId = await getWaliKelasUserId(studentInfo.kelas, studentInfo.jurusan);
      if (waliId) {
        await createNotification({
          userId: waliId,
          title: '💬 Pesan Baru dari Orang Tua',
          message: `Orang tua ${studentInfo.nama || 'Siswa'} mengirim pesan.`,
          type: 'parent_message',
          priority: 'WARNING',
          referenceType: 'parent_message',
          referenceId: studentId,
          actionUrl: `/portal-ortu`,
        });
      }
    }
  } catch (notifErr) { console.error('Gagal kirim notifikasi WK:', notifErr); }

  return { success: true }
}

export async function markNotificationRead(id) {
  await supabaseAdmin.from('parent_notifications').update({ is_read: true }).eq('id', id)
}