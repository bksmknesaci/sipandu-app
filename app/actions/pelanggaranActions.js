'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createNotification, getAdminUserIds } from '@/app/actions/notificationActions';

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

export async function getKategoriPelanggaran() {
  return kategoriPelanggaran
}

export async function searchStudentsForPelanggaran(query, userRole, userKelas, userId) {
  if (!query || query.length < 3) return { data: [] }

  let dbQuery = supabaseAdmin
    .from('siswa')
    .select('nisn, nama, kelas, jurusan, jenis_kelamin, total_reward, total_pelanggaran')
    .or(`nama.ilike.%${query}%,nisn.ilike.%${query}%`)
    .limit(10)

  // ── Filter kelas binaan Wali Kelas ──
  // userData.kelas: "XI TKRO 1" → parts: ["XI", "TKRO", "1"]
  // tabel siswa: kelas="XI", jurusan="TKRO 1"
  if (userRole === 'Wali Kelas') {
    let kelasAKurat = null
    if (userId) {
      const { data: userRow } = await supabaseAdmin.from('users').select('kelas').eq('id', userId).single()
      kelasAKurat = userRow?.kelas
    }

    const kelasYangDigunakan = kelasAKurat || userKelas

    if (kelasYangDigunakan) {
      const parts = kelasYangDigunakan.trim().split(/\s+/)

      if (parts.length >= 2) {
        const tingkat = parts[0]                    // "XI"
        const jurusan = parts.slice(1).join(' ')    // "TKRO 1"
        dbQuery = dbQuery.eq('kelas', tingkat).eq('jurusan', jurusan)
      }
    }
  }

  const { data, error } = await dbQuery
  if (error) return { error: error.message }

  const enrichedData = []
  for (const siswa of data) {
    const { data: waliData } = await supabaseAdmin.from('users').select('nama').eq('role', 'Wali Kelas').eq('kelas', siswa.kelas).single()
    enrichedData.push({ ...siswa, wali_kelas: waliData?.nama || '-' })
  }
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

    // ── Kirim notifikasi ke Admin jika pelanggaran BERAT ──
    if (pelanggaranData.kategori === 'Berat') {
      try {
        const adminIds = await getAdminUserIds();
        if (adminIds.length > 0) {
          const lokasi = pelanggaranData.lokasi ? ` di ${pelanggaranData.lokasi}` : '';
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
      } catch (notifErr) {
        console.error('Gagal kirim notifikasi pelanggaran berat:', notifErr);
      }
    }

    return { success: true, newTotalPelanggaran, newTotalReward }
  } catch (err) {
    return { error: 'Terjadi kesalahan server: ' + err.message }
  }
}

export async function getRekapPelanggaranStats() {
  try {
    const { data: pelanggaran } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('kategori, created_at')
    const total = (pelanggaran || []).length
    const ringan = (pelanggaran || []).filter(p => p.kategori === 'Ringan').length
    const sedang = (pelanggaran || []).filter(p => p.kategori === 'Sedang').length
    const berat = (pelanggaran || []).filter(p => p.kategori === 'Berat').length
    return { total, ringan, sedang, berat }
  } catch (err) {
    return { total: 0, ringan: 0, sedang: 0, berat: 0 }
  }
}

export async function getRekapPelanggaranTable() {
  try {
    const { data: siswa } = await supabaseAdmin.from('siswa').select('*').gt('total_pelanggaran', 0).order('total_pelanggaran', { ascending: false })
    if (!siswa) return { data: [] }

    const enrichedData = []
    for (const s of siswa) {
      const { data: lastP } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('jenis_pelanggaran, tanggal').eq('nisn', s.nisn).order('tanggal', { ascending: false }).limit(1).maybeSingle()
      const ringan = (await supabaseAdmin.from('tb_pelanggaran_siswa').select('id').eq('nisn', s.nisn).eq('kategori', 'Ringan')).data?.length || 0
      const sedang = (await supabaseAdmin.from('tb_pelanggaran_siswa').select('id').eq('nisn', s.nisn).eq('kategori', 'Sedang')).data?.length || 0
      const berat = (await supabaseAdmin.from('tb_pelanggaran_siswa').select('id').eq('nisn', s.nisn).eq('kategori', 'Berat')).data?.length || 0
      
      enrichedData.push({ ...s, ringan, sedang, berat, last_pelanggaran: lastP?.jenis_pelanggaran || '-', last_tanggal: lastP?.tanggal || null })
    }
    return { data: enrichedData }
  } catch (err) { return { data: [] } }
}

export async function getStudentDetailPelanggaran(nisn) {
  const { data: siswa } = await supabaseAdmin.from('siswa').select('*').eq('nisn', nisn).single()
  const { data: pelanggaran } = await supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false })
  return { siswa, pelanggaran }
}

export async function deleteAllPelanggaran() {
  const { error } = await supabaseAdmin
    .from('tb_pelanggaran_siswa')
    .delete()
    .gte('id', 1)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getHomePelanggaranChart() {
  try {
    const { data: pelanggaran } = await supabaseAdmin
      .from('tb_pelanggaran_siswa')
      .select('kelas, jurusan, poin')

    const kelasMap = {}
    for (const p of (pelanggaran || [])) {
      const name = `${p.kelas} ${p.jurusan}`.trim()
      if (!kelasMap[name]) kelasMap[name] = 0
      kelasMap[name] += p.poin || 0
    }

    const chartData = Object.entries(kelasMap)
      .map(([name, pelanggaran]) => ({ name, pelanggaran }))
      .sort((a, b) => b.pelanggaran - a.pelanggaran)
      .slice(0, 8)

    return chartData
  } catch (err) {
    return []
  }
}