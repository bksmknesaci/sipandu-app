'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

const rewardCategories = [
  { kode: 'R1', nama: 'Melaksanakan praktik-praktik keagamaan', poin: 20 },
  { kode: 'R2', nama: 'Melaporkan tindakan pelanggaran', poin: 20 },
  { kode: 'R3', nama: 'Peringkat pertama di kelas', poin: 20 },
  { kode: 'R3.1', nama: 'Peringkat 5 besar di kelas', poin: 15 },
  { kode: 'R3.2', nama: 'Aktif dalam kegiatan belajar', poin: 10 },
  { kode: 'R3.3', nama: 'Berprestasi tingkat sekolah', poin: 10 },
  { kode: 'R4', nama: 'Tidak pernah melanggar tatib satu semester', poin: 30 },
  { kode: 'R5', nama: 'Terlibat dalam aksi/bakti sosial', poin: 15 },
  { kode: 'R6', nama: 'Menjadi ketua OSIS', poin: 20 },
  { kode: 'R6.1', nama: 'Menjadi pengurus OSIS', poin: 10 },
  { kode: 'R6.2', nama: 'Menjadi ketua ekstrakurikuler', poin: 15 },
  { kode: 'R7', nama: 'Menjadi petugas upacara', poin: 10 },
  { kode: 'R7.1', nama: 'Menjadi duta/pertukaran pelajar', poin: 30 },
  { kode: 'R8', nama: 'Aktif ekstrakurikuler wajib', poin: 10 },
  { kode: 'R8.1', nama: 'Aktif ekstrakurikuler lain', poin: 10 },
  { kode: 'R8.2', nama: 'Juara tingkat sekolah', poin: 5 },
  { kode: 'R8.3', nama: 'Juara tingkat kab/kota', poin: 20 },
  { kode: 'R8.4', nama: 'Juara tingkat provinsi', poin: 30 },
  { kode: 'R8.5', nama: 'Juara tingkat nasional', poin: 40 },
  { kode: 'R9', nama: 'Karya inovatif lingkungan', poin: 20 },
  { kode: 'R10', nama: 'Aktif kewirausahaan di sekolah', poin: 10 },
]

export async function getRewardCategories() { return rewardCategories }

export async function searchStudentsForReward(query, userRole, userKelas, userId) {
  if (!query || query.length < 3) return { data: [] }

  // ── OPTIMASI: Escape ILIKE wildcard ──
  const safeQuery = query.replace(/[%_]/g, '\\$&')

  let dbQuery = supabaseAdmin
    .from('siswa')
    .select('nisn, nama, kelas, jurusan, jenis_kelamin, total_reward, total_pelanggaran')
    .or(`nama.ilike.%${safeQuery}%,nisn.ilike.%${safeQuery}%`)
    .limit(10)

  if (userRole === 'Wali Kelas') {
    let kelasFromDB = null
    let jurusanFromDB = null
    if (userId) {
      const { data: userRow } = await supabaseAdmin.from('users').select('kelas, jurusan').eq('id', userId).single()
      if (userRow) {
        kelasFromDB = userRow.kelas || null
        jurusanFromDB = userRow.jurusan || null
      }
    }
    // users.kelas = "XI", users.jurusan = "RPL 2" (kolom terpisah)
    const tingkat = kelasFromDB || (userKelas ? userKelas.trim().split(/\s+/)[0] : null)
    const jurusan = jurusanFromDB || (userKelas && userKelas.trim().split(/\s+/).length > 1 ? userKelas.trim().split(/\s+/).slice(1).join(' ') : null)
    if (tingkat) dbQuery = dbQuery.eq('kelas', tingkat)
    if (jurusan) dbQuery = dbQuery.eq('jurusan', jurusan)
  }

  const { data, error } = await dbQuery
  if (error) return { error: error.message }

  // ── OPTIMASI: Batch WK lookup — 1 query untuk semua kelas unik (sebelumnya N query) ──
  const uniqueKelas = [...new Set((data || []).map(s => s.kelas).filter(Boolean))]
  const wkMap = {}
  if (uniqueKelas.length > 0) {
    const { data: wkList } = await supabaseAdmin
      .from('users')
      .select('kelas, nama')
      .eq('role', 'Wali Kelas')
      .in('kelas', uniqueKelas)
    for (const wk of (wkList || [])) {
      if (!wkMap[wk.kelas]) wkMap[wk.kelas] = []
      wkMap[wk.kelas].push(wk.nama)
    }
  }

  const enrichedData = (data || []).map(siswa => ({
    ...siswa,
    wali_kelas: wkMap[siswa.kelas]?.[0] || '-'
  }))
  return { data: enrichedData }
}

export async function getStudentRewardHistory(nisn) {
  const { data, error } = await supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false }).limit(10)
  if (error) return { error: error.message }
  return { data }
}

export async function saveRewardAction(rewardData, file) {
  try {
    const today = new Date().toLocaleDateString('sv-SE')
    const { data: existing } = await supabaseAdmin.from('tb_reward_siswa').select('id').eq('nisn', rewardData.nisn).eq('reward_kode', rewardData.reward_kode).eq('tanggal', today).maybeSingle()
    if (existing) return { error: 'Reward serupa sudah pernah diberikan hari ini untuk siswa ini.' }

    let buktiUrl = null
    if (file && file.name) {
      const fileExt = file.name.split('.').pop()
      const fileName = `reward-${rewardData.nisn}-${Date.now()}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabaseAdmin.storage.from('bukti-reward').upload(fileName, buffer, { contentType: file.type, upsert: true })
      if (uploadError) return { error: 'Gagal upload bukti: ' + uploadError.message }
      const { data: urlData } = supabaseAdmin.storage.from('bukti-reward').getPublicUrl(fileName)
      buktiUrl = urlData.publicUrl
    }

    const { current_total, ...insertData } = rewardData;
    const finalData = { ...insertData, tanggal: today, bukti_file: buktiUrl }
    const { error: insertError } = await supabaseAdmin.from('tb_reward_siswa').insert([finalData])
    if (insertError) return { error: 'Gagal menyimpan reward: ' + insertError.message }

    const newTotal = (current_total || 0) + rewardData.reward_poin
    const { error: updateError } = await supabaseAdmin.from('siswa').update({ total_reward: newTotal }).eq('nisn', rewardData.nisn)
    if (updateError) console.error('Gagal update total poin siswa:', updateError.message)

    invalidateCacheByPrefix('reward_')
    return { success: true, newTotal }
  } catch (err) { return { error: 'Terjadi kesalahan server: ' + err.message } }
}

async function calculateRewardTotals(filters) {
  let query = supabaseAdmin.from('tb_reward_siswa').select('nisn, nama_siswa, kelas, jurusan, reward_poin, reward_nama, tanggal')
  if (filters?.kelas) query = query.eq('kelas', filters.kelas)
  if (filters?.jurusan) query = query.eq('jurusan', filters.jurusan)
  
  const { data: rewards, error } = await query
  if (error || !rewards) return { siswaMap: {}, rewards: [] }

  const siswaMap = {}
  rewards.forEach(r => {
    if (!siswaMap[r.nisn]) {
      siswaMap[r.nisn] = { nisn: r.nisn, nama: r.nama_siswa, kelas: r.kelas, jurusan: r.jurusan, total_reward: 0, last_reward_nama: r.reward_nama, last_reward_tanggal: r.tanggal }
    }
    siswaMap[r.nisn].total_reward += r.reward_poin
    if (r.tanggal > siswaMap[r.nisn].last_reward_tanggal) {
      siswaMap[r.nisn].last_reward_nama = r.reward_nama
      siswaMap[r.nisn].last_reward_tanggal = r.tanggal
    }
  })

  return { siswaMap, rewards }
}

// ── OPTIMASI: Cache 1 menit — dipanggil di beranda ──
export async function getTopRewardStudents() {
  return getCached('reward_top3', async () => {
    try {
      const { siswaMap } = await calculateRewardTotals({})
      const sorted = Object.values(siswaMap).filter(s => s.total_reward > 0).sort((a, b) => b.total_reward - a.total_reward).slice(0, 3)
      return { data: sorted }
    } catch (err) { return { data: [] } }
  }, TTL.MINUTE)
}

export async function getRekapRewardAdmin(filters) {
  let query = supabaseAdmin.from('tb_reward_siswa').select('*').order('tanggal', { ascending: false })
  if (filters?.kelas) query = query.eq('kelas', filters.kelas)
  if (filters?.jurusan) query = query.eq('jurusan', filters.jurusan)
  if (filters?.tanggal_mulai) query = query.gte('tanggal', filters.tanggal_mulai)
  if (filters?.tanggal_selesai) query = query.lte('tanggal', filters.tanggal_selesai)
  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data }
}

// ── OPTIMASI: Cache 1 menit ──
export async function getRekapRewardStats() {
  return getCached('reward_stats', async () => {
    try {
      const { rewards } = await calculateRewardTotals({})
      const siswaMap = {}
      let totalPoin = 0
      ;(rewards || []).forEach(r => {
        if (!siswaMap[r.nisn]) siswaMap[r.nisn] = 0
        siswaMap[r.nisn] += r.reward_poin
        totalPoin += r.reward_poin
      })
      const totalSiswaDapatReward = Object.keys(siswaMap).length
      const siswaBerprestasi = Object.values(siswaMap).filter(total => total >= 100).length
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const entriBulanIni = (rewards || []).filter(r => new Date(r.created_at) >= new Date(startOfMonth)).length
      return { totalSiswaDapatReward, totalPoinSekolah: totalPoin, siswaBerprestasi, entriBulanIni }
    } catch (err) { return { totalSiswaDapatReward: 0, totalPoinSekolah: 0, siswaBerprestasi: 0, entriBulanIni: 0 } }
  }, TTL.MINUTE)
}

// ── OPTIMASI: Cache 1 menit ──
export async function getChartData() {
  return getCached('reward_chart', async () => {
    try {
      const { data: rewards, error } = await supabaseAdmin.from('tb_reward_siswa').select('nisn, kelas, jurusan, reward_poin, created_at')
      if (error || !rewards || rewards.length === 0) return { chartKelas: [], chartJurusan: [], chartBulan: [] }

      const kelasMap = {}
      rewards.forEach(r => { if (!kelasMap[r.kelas]) kelasMap[r.kelas] = 0; kelasMap[r.kelas] += r.reward_poin })
      const chartKelas = Object.keys(kelasMap).map(k => ({ name: k, poin: kelasMap[k] })).sort((a, b) => b.poin - a.poin).slice(0, 10)

      const jurusanMap = {}
      rewards.forEach(r => { if (!jurusanMap[r.jurusan]) jurusanMap[r.jurusan] = 0; jurusanMap[r.jurusan] += r.reward_poin })
      const chartJurusan = Object.keys(jurusanMap).map(j => ({ name: j, value: jurusanMap[j] }))

      const bulanMap = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'Mei', 6: 'Jun', 7: 'Jul', 8: 'Agu', 9: 'Sep', 10: 'Okt', 11: 'Nov', 12: 'Des' }
      const bulanData = Object.keys(bulanMap).map(k => ({ name: bulanMap[k], poin: 0 }))
      rewards.forEach(r => { const month = new Date(r.created_at).getMonth() + 1; const year = new Date(r.created_at).getFullYear(); if (year === new Date().getFullYear()) bulanData[month - 1].poin += r.reward_poin })

      return { chartKelas, chartJurusan, chartBulan: bulanData }
    } catch (err) { return { chartKelas: [], chartJurusan: [], chartBulan: [] } }
  }, TTL.MINUTE)
}

// ── OPTIMASI: Cache 1 menit per filter combo ──
export async function getRekapRewardTable(filters) {
  const cacheKey = `reward_table_${filters?.kelas || ''}_${filters?.jurusan || ''}`
  return getCached(cacheKey, async () => {
    try {
      const { siswaMap } = await calculateRewardTotals(filters)
      const result = Object.values(siswaMap).filter(s => s.total_reward > 0).sort((a, b) => b.total_reward - a.total_reward)
      return { data: result }
    } catch (err) { return { data: [] } }
  }, TTL.MINUTE)
}

export async function getStudentDetailReward(nisn) {
  const { data: siswa } = await supabaseAdmin.from('siswa').select('*').eq('nisn', nisn).single()
  const { data: rewards } = await supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false })
  const totalReward = (rewards || []).reduce((sum, r) => sum + (r.reward_poin || 0), 0)
  return { siswa: siswa ? { ...siswa, total_reward: totalReward } : null, rewards }
}

export async function deleteRewardAction(rewardId, nisn, poinToDeduct) {
  try {
    const { error: deleteError } = await supabaseAdmin.from('tb_reward_siswa').delete().eq('id', rewardId)
    if (deleteError) return { error: 'Gagal menghapus reward' }
    try {
      const { data: siswa } = await supabaseAdmin.from('siswa').select('total_reward').eq('nisn', nisn).single()
      if (siswa && siswa.total_reward !== undefined && siswa.total_reward !== null) {
        const newTotal = Math.max(0, (siswa.total_reward || 0) - poinToDeduct)
        await supabaseAdmin.from('siswa').update({ total_reward: newTotal }).eq('nisn', nisn)
      }
    } catch (e) { /* Abaikan jika kolom tidak ada */ }
    invalidateCacheByPrefix('reward_')
    return { success: true }
  } catch (err) { return { error: 'Terjadi kesalahan server' } }
}

export async function deleteAllRewardAction() {
  try {
    const { error: deleteError } = await supabaseAdmin.from('tb_reward_siswa').delete().neq('id', 0)
    if (deleteError) return { error: 'Gagal menghapus semua data reward: ' + deleteError.message }
    const { error: updateError } = await supabaseAdmin.from('siswa').update({ total_reward: 0 }).neq('id', 0)
    if (updateError) console.error('Gagal reset total poin siswa:', updateError.message)
    invalidateCacheByPrefix('reward_')
    return { success: true }
  } catch (err) { return { error: 'Terjadi kesalahan server: ' + err.message } }
}

// ── OPTIMASI: Cache 1 menit — dipanggil di beranda semua role ──
export async function getHomeRewardChart() {
  return getCached('reward_home_chart', async () => {
    const { data: rewards } = await supabaseAdmin.from('tb_reward_siswa').select('kelas, jurusan, reward_poin')
    const kelasMap = {}
    for (const r of (rewards || [])) {
      const name = `${r.kelas} ${r.jurusan}`.trim()
      if (!kelasMap[name]) kelasMap[name] = 0
      kelasMap[name] += r.reward_poin || 0
    }
    return Object.entries(kelasMap).map(([name, reward]) => ({ name, reward })).sort((a, b) => b.reward - a.reward).slice(0, 8)
  }, TTL.MINUTE)
}