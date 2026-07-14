'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createNotification, getAdminUserIds } from '@/app/actions/notificationActions'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

const kategoriPelanggaran = {
  Ringan: [
    { nama: 'Terlambat', poin: 1 },
    { nama: 'Kelengkapan Atribut', poin: 1 },
    { nama: 'Rambut Panjang', poin: 1 },
  ],
  Sedang: [
    { nama: 'Bolos Sekolah', poin: 2 },
    { nama: 'Bolos Pelajaran', poin: 2 },
    { nama: 'Mencoret Seragam', poin: 2 },
  ],
  Berat: [
    { nama: 'Mencuri', poin: 3 },
    { nama: 'Bullying', poin: 3 },
    { nama: 'Berjudi', poin: 3 },
    { nama: 'Merokok', poin: 3 },
    { nama: 'Berkelahi', poin: 3 },
    { nama: 'Membawa Sajam', poin: 3 },
    { nama: 'Tawuran', poin: 3 },
    { nama: 'Narkoba', poin: 3 },
  ]
}

export async function getKategoriPelanggaran() { return kategoriPelanggaran }

export async function searchStudentsForPelanggaran(query, userRole, userKelas, userId) {
  if (!query || query.length < 3) return { data: [] }

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
    const tingkat = kelasFromDB || (userKelas ? userKelas.trim().split(/\s+/)[0] : null)
    const jurusan = jurusanFromDB || (userKelas && userKelas.trim().split(/\s+/).length > 1 ? userKelas.trim().split(/\s+/).slice(1).join(' ') : null)
    if (tingkat) dbQuery = dbQuery.eq('kelas', tingkat)
    if (jurusan) dbQuery = dbQuery.eq('jurusan', jurusan)
  }

  const { data, error } = await dbQuery
  if (error) return { error: error.message }

  // ── OPTIMASI: Batch WK lookup — 1 query (sebelumnya N query) ──
  const uniqueKelas = [...new Set((data || []).map(s => s.kelas).filter(Boolean))]
  const wkMap = {}
  if (uniqueKelas.length > 0) {
    const { data: wkList } = await supabaseAdmin.from('users').select('kelas, nama').eq('role', 'Wali Kelas').in('kelas', uniqueKelas)
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

export async function savePelanggaranAction(pelanggaranData, file) {
  try {
    let buktiUrl = null
    if (file && file.name) {
      const fileExt = file.name.split('.').pop()
      const fileName = `pelanggaran-${pelanggaranData.nisn}-${Date.now()}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabaseAdmin.storage.from('bukti-pelanggaran').upload(fileName, buffer, { contentType: file.type, upsert: true })
      if (uploadError) return { error: 'Gagal upload bukti: ' + uploadError.message }
      const { data: urlData } = supabaseAdmin.storage.from('bukti-pelanggaran').getPublicUrl(fileName)
      buktiUrl = urlData.publicUrl
    }

    const { current_total_pelanggaran, current_total_reward, ...insertData } = pelanggaranData;
    const finalData = { ...insertData, bukti_file: buktiUrl }

    const { error: insertError } = await supabaseAdmin.from('tb_pelanggaran_siswa').insert([finalData])
    if (insertError) return { error: 'Gagal menyimpan pelanggaran: ' + insertError.message }

    const newTotalPelanggaran = (current_total_pelanggaran || 0) + pelanggaranData.poin
    await supabaseAdmin.from('siswa').update({ total_pelanggaran: newTotalPelanggaran }).eq('nisn', pelanggaranData.nisn)

    const deductMap = { 'Ringan': 1, 'Sedang': 2, 'Berat': 5 }
    const deductPoin = deductMap[pelanggaranData.kategori] || 0
    const newTotalReward = Math.max(0, (current_total_reward || 0) - deductPoin)
    await supabaseAdmin.from('siswa').update({ total_reward: newTotalReward }).eq('nisn', pelanggaranData.nisn)

    if (pelanggaranData.kategori === 'Berat') {
      try {
        const adminIds = await getAdminUserIds()
        if (adminIds.length > 0) {
          const lokasi = pelanggaranData.lokasi ? ` di ${pelanggaranData.lokasi}` : ''
          await createNotification({
            userId: adminIds[0],
            title: '⚠️ Pelanggaran Berat Terdeteksi',
            message: `${pelanggaranData.nama_siswa} (${pelanggaranData.kelas} ${pelanggaranData.jurusan}) melakukan pelanggaran berat: ${pelanggaranData.jenis_pelanggaran}${lokasi}. Poin: +${pelanggaranData.poin}`,
            type: 'violation',
            priority: 'DANGER',
            referenceType: 'violation',
            referenceId: pelanggaranData.nisn,
            actionUrl: '/admin/siswa/penanganan',
          });
        }
      } catch (notifErr) { console.error('Gagal kirim notifikasi pelanggaran berat:', notifErr) }
    }

    invalidateCacheByPrefix('pelanggaran_')
    return { success: true, newTotalPelanggaran, newTotalReward }
  } catch (err) { return { error: 'Terjadi kesalahan server: ' + err.message } }
}

// ── OPTIMASI: Cache 1 menit ──
export async function getRekapPelanggaranStats() {
  return getCached('pelanggaran_stats', async () => {
    const { data: pelanggaran } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('kategori, created_at')
    const total = (pelanggaran || []).length
    const ringan = (pelanggaran || []).filter(p => p.kategori === 'Ringan').length
    const sedang = (pelanggaran || []).filter(p => p.kategori === 'Sedang').length
    const berat = (pelanggaran || []).filter(p => p.kategori === 'Berat').length
    return { total, ringan, sedang, berat }
  }, TTL.MINUTE)
}

// ── OPTIMASI KRITIS: 1 batch query mengganti N×4 query (sebelumnya 200 query untuk 50 siswa!) ──
export async function getRekapPelanggaranTable() {
  try {
    const { data: siswa } = await supabaseAdmin.from('siswa').select('*').gt('total_pelanggaran', 0).order('total_pelanggaran', { ascending: false })
    if (!siswa) return { data: [] }

    const nisns = siswa.map(s => s.nisn).filter(Boolean)
    if (nisns.length === 0) return { data: [] }

    // 1 query untuk SEMUA data pelanggaran — sebelumnya 4 query per siswa
    const { data: allPelanggaran } = await supabaseAdmin
      .from('tb_pelanggaran_siswa')
      .select('nisn, jenis_pelanggaran, tanggal, kategori')
      .in('nisn', nisns)

    // Process di JS — group per NISN
    const pelanggaranMap = {}
    for (const p of (allPelanggaran || [])) {
      const n = (p.nisn || '').trim()
      if (!pelanggaranMap[n]) pelanggaranMap[n] = { items: [], ringan: 0, sedang: 0, berat: 0 }
      pelanggaranMap[n].items.push(p)
      if (p.kategori === 'Ringan') pelanggaranMap[n].ringan++
      else if (p.kategori === 'Sedang') pelanggaranMap[n].sedang++
      else if (p.kategori === 'Berat') pelanggaranMap[n].berat++
    }

    const enrichedData = siswa.map(s => {
      const pm = pelanggaranMap[s.nisn] || { items: [], ringan: 0, sedang: 0, berat: 0 }
      const sorted = pm.items.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))
      return {
        ...s,
        ringan: pm.ringan,
        sedang: pm.sedang,
        berat: pm.berat,
        last_pelanggaran: sorted[0]?.jenis_pelanggaran || '-',
        last_tanggal: sorted[0]?.tanggal || null
      }
    })
    return { data: enrichedData }
  } catch (err) { return { data: [] } }
}

export async function getStudentDetailPelanggaran(nisn) {
  const { data: siswa } = await supabaseAdmin.from('siswa').select('*').eq('nisn', nisn).single()
  const { data: pelanggaran } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false })
  return { siswa, pelanggaran }
}

export async function deleteAllPelanggaran() {
  try {
    // 1. Hapus semua record dari tb_pelanggaran_siswa
    //    .gte('id', 0) sebagai WHERE clause wajib PostgREST (DELETE tanpa WHERE ditolak)
    const { error: deleteError } = await supabaseAdmin
      .from('tb_pelanggaran_siswa')
      .delete()
      .gte('id', 0)

    if (deleteError) return { error: 'Gagal menghapus data pelanggaran: ' + deleteError.message }

    // 2. Reset total_pelanggaran ke 0 untuk semua siswa yang nilainya > 0
    //    Tidak perlu kumpulkan NISN — langsung filter berdasarkan kondisi kolom
    const { error: updateError } = await supabaseAdmin
      .from('siswa')
      .update({ total_pelanggaran: 0 })
      .gte('total_pelanggaran', 1)

    if (updateError) return { error: 'Gagal reset total poin: ' + updateError.message }

    invalidateCacheByPrefix('pelanggaran_')
    return { success: true }
  } catch (err) {
    return { error: 'Terjadi kesalahan: ' + err.message }
  }
}

// ── OPTIMASI: Cache 1 menit — dipanggil di beranda semua role ──
export async function getHomePelanggaranChart() {
  return getCached('pelanggaran_home_chart', async () => {
    const { data: pelanggaran } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('kelas, jurusan, poin')
    const kelasMap = {}
    for (const p of (pelanggaran || [])) {
      const name = `${p.kelas} ${p.jurusan}`.trim()
      if (!kelasMap[name]) kelasMap[name] = 0
      kelasMap[name] += p.poin || 0
    }
    return Object.entries(kelasMap).map(([name, pelanggaran]) => ({ name, pelanggaran })).sort((a, b) => b.pelanggaran - a.pelanggaran).slice(0, 8)
  }, TTL.MINUTE)
}