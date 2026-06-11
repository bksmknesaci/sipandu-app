'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================
// GET ALL KELAS (from siswa table)
// ============================
export async function getAllKelas() {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('kelas')
    .not('kelas', 'is', null)

  if (error) return { kelas: [] }
  const unique = [...new Set(data.map(s => s.kelas).filter(Boolean))].sort()
  return { kelas: unique }
}

// ============================
// GET KELAS FILTERS
// ============================
export async function getKelasFilters() {
  const tingkat = ['X', 'XI', 'XII']
  const jurusan = ['TKRO', 'DKV', 'RPL', 'PH', 'KL', 'LPKKK']
  const nomor = ['1', '2', '3', '4']

  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('kelas')
    .not('kelas', 'is', null)

  const kelasSet = new Set()
  if (!error && data) {
    data.forEach(s => {
      if (s.kelas) kelasSet.add(s.kelas.trim())
    })
  }

  return { kelas: [...kelasSet].sort(), tingkat, jurusan, nomor }
}

// ============================
// GET SISWA BY KELAS + JURUSAN
// ============================
export async function getSiswaByKelas(kelas, jurusan) {
  let query = supabaseAdmin.from('siswa').select('*')
  if (kelas) query = query.eq('kelas', kelas)
  if (jurusan) query = query.ilike('jurusan', `%${jurusan}%`)

  const { data, error } = await query.order('nama', { ascending: true })
  if (error) return { siswa: [], error: error.message }
  return { siswa: data || [] }
}

// ============================
// GET ABSENSI BY DATE + KELAS + JURUSAN
// ============================
export async function getAbsensiByDate(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('*').order('nama', { ascending: true })
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)

  const { data: siswaList, error: siswaError } = await siswaQuery
  if (siswaError) return { data: [], error: siswaError.message }
  if (!siswaList || siswaList.length === 0) return { data: [], error: null }

  const siswaIds = siswaList.map(s => s.id)
  const { data: absensiList, error: absensiError } = await supabaseAdmin
    .from('absensi')
    .select('*')
    .eq('tanggal', tanggal)
    .in('siswa_id', siswaIds)

  if (absensiError) return { data: [], error: absensiError.message }

  const absensiMap = {}
  ;(absensiList || []).forEach(a => { absensiMap[a.siswa_id] = a })

  const merged = siswaList.map(s => ({
    ...s,
    absensi_id: absensiMap[s.id]?.id || null,
    status: absensiMap[s.id]?.status || null,
    input_by: absensiMap[s.id]?.input_by || null,
    locked: absensiMap[s.id]?.locked || false,
  }))

  return { data: merged, error: null }
}

// ============================
// GET ABSENSI STATS (by kelas + jurusan)
// ============================
export async function getAbsensiStats(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)

  const { data: siswaList } = await siswaQuery
  const siswaIds = (siswaList || []).map(s => s.id)
  const totalSiswa = siswaIds.length

  if (totalSiswa === 0) return { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, belum: 0 }

  const { data: absensiList } = await supabaseAdmin
    .from('absensi')
    .select('status')
    .eq('tanggal', tanggal)
    .in('siswa_id', siswaIds)

  const hadir = (absensiList || []).filter(a => a.status === 'Hadir').length
  const sakit = (absensiList || []).filter(a => a.status === 'Sakit').length
  const izin = (absensiList || []).filter(a => a.status === 'Izin').length
  const alpha = (absensiList || []).filter(a => a.status === 'Alpha').length
  const sudahAbsen = hadir + sakit + izin + alpha

  return { total: totalSiswa, hadir, sakit, izin, alpha, belum: totalSiswa - sudahAbsen }
}

// ============================
// UPSERT ABSENSI (single record)
// ============================
export async function upsertAbsensi(siswaId, tanggal, status, inputBy = 'Sekretaris Kelas', locked = false) {
  const { data, error } = await supabaseAdmin
    .from('absensi')
    .upsert(
      { siswa_id: siswaId, tanggal, status, input_by: inputBy, locked, updated_at: new Date().toISOString() },
      { onConflict: 'siswa_id,tanggal' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, data }
}

// ============================
// BATCH UPSERT ABSENSI
// ============================
export async function batchUpsertAbsensi(records) {
  const upsertData = records.map(r => ({
    siswa_id: r.siswa_id,
    tanggal: r.tanggal,
    status: r.status,
    input_by: r.input_by || 'Sekretaris Kelas',
    locked: r.locked || false,
    updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabaseAdmin
    .from('absensi')
    .upsert(upsertData, { onConflict: 'siswa_id,tanggal' })
    .select()

  if (error) return { error: error.message }
  return { success: true, count: data.length }
}

// ============================
// GET ABSENT STUDENTS FOR DASHBOARD (FIXED)
// ============================
export async function getAbsentStudentsForDashboard(tanggal) {
  const { data: absensiList, error } = await supabaseAdmin
    .from('absensi')
    .select('siswa_id, status')
    .eq('tanggal', tanggal)
    .neq('status', 'Hadir')

  if (error || !absensiList || absensiList.length === 0) return { data: [] }

  const siswaIds = absensiList.map(a => a.siswa_id)
  const { data: siswaList } = await supabaseAdmin
    .from('siswa')
    .select('id, nama, kelas, jurusan, jenis_kelamin')
    .in('id', siswaIds)

  const absensiMap = {}
  absensiList.forEach(a => { absensiMap[a.siswa_id] = a.status })

  const grouped = {}
  ;(siswaList || []).forEach(s => {
    // PERBAIKAN: Gabungkan kelas (X) dan jurusan (TKRO 1) agar tampilan lengkap
    const tingkat = (s.kelas || '').trim();
    const jurusan = (s.jurusan || '').trim();
    const fullKelas = tingkat && jurusan ? `${tingkat} ${jurusan}` : (tingkat || jurusan || 'Lainnya');

    if (!grouped[fullKelas]) grouped[fullKelas] = { kelas: fullKelas, siswa: [] }
    grouped[fullKelas].siswa.push({
      nama: s.nama,
      lp: s.jenis_kelamin === 'P' ? 'P' : 'L',
      status: absensiMap[s.id] || 'Alpha',
    })
  })

  return { data: Object.values(grouped) }
}

// ============================
// SUBMIT ABSENSI (lock all for the day)
// ============================
export async function submitAbsensi(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)

  const { data: siswaList } = await siswaQuery
  if (!siswaList || siswaList.length === 0) return { error: 'Tidak ada siswa' }

  const siswaIds = siswaList.map(s => s.id)

  const { error } = await supabaseAdmin
    .from('absensi')
    .update({ locked: true, updated_at: new Date().toISOString() })
    .eq('tanggal', tanggal)
    .in('siswa_id', siswaIds)

  if (error) return { error: error.message }
  return { success: true }
}

// ============================
// CHECK IF ABSENSI IS SUBMITTED (all locked)
// ============================
export async function isAbsensiSubmitted(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)

  const { data: siswaList } = await siswaQuery
  if (!siswaList || siswaList.length === 0) return { submitted: false }

  const siswaIds = siswaList.map(s => s.id)

  const { data: absensiList } = await supabaseAdmin
    .from('absensi')
    .select('id, status, locked')
    .eq('tanggal', tanggal)
    .in('siswa_id', siswaIds)

  if (!absensiList || absensiList.length === 0) return { submitted: false }

  const allHaveStatus = absensiList.every(a => a.status !== null)
  const allLocked = absensiList.every(a => a.locked === true)

  return { submitted: allHaveStatus && allLocked }
}

// ============================
// CREATE EDIT REQUEST
// ============================
export async function createEditRequest(userId, kelas, jurusan, tanggal, reason) {
  const { data, error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .insert([{ user_id: userId, kelas, jurusan, tanggal, reason, status: 'pending' }])
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, data }
}

// ============================
// GET EDIT REQUESTS (for admin)
// ============================
export async function getEditRequests(status = 'pending') {
  const { data, error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data || [] }
}

// ============================
// APPROVE EDIT REQUEST (unlock for one-time edit)
// ============================
export async function approveEditRequest(requestId, adminId, kelas, jurusan, tanggal) {
  const { error: reqError } = await supabaseAdmin
    .from('absensi_edit_requests')
    .update({ status: 'approved', approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqError) return { error: reqError.message }

  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)

  const { data: siswaList } = await siswaQuery
  if (!siswaList || siswaList.length === 0) return { error: 'Tidak ada siswa' }

  const siswaIds = siswaList.map(s => s.id)

  const { error: unlockError } = await supabaseAdmin
    .from('absensi')
    .update({ locked: false, updated_at: new Date().toISOString() })
    .eq('tanggal', tanggal)
    .in('siswa_id', siswaIds)

  if (unlockError) return { error: unlockError.message }
  return { success: true }
}

// ============================
// REJECT EDIT REQUEST
// ============================
export async function rejectEditRequest(requestId, adminId) {
  const { error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .update({ status: 'rejected', approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) return { error: error.message }
  return { success: true }
}

// ============================
// CHECK EXISTING PENDING REQUEST
// ============================
export async function checkPendingRequest(userId, tanggal) {
  const { data, error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('tanggal', tanggal)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return { hasPending: false, hasApproved: false }

  const latest = data?.[0]
  return {
    hasPending: latest?.status === 'pending',
    hasApproved: latest?.status === 'approved',
    requestId: latest?.id || null,
  }
}

// ============================
// SAKIT & IZIN ACTIONS
// ============================

// Get Siswa Profile from logged-in user
export async function getSiswaProfileFromUser(nama, kelas) {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('id, nis, nama, kelas, jurusan')
    .ilike('nama', nama)
    .eq('kelas', kelas)
    .limit(1)
    .single()

  if (error) return { error: 'Data siswa tidak ditemukan di database' }
  return { data }
}

// Check if already submitted today
export async function checkSakitIzinToday(nisn, tanggal) {
  const { data, error } = await supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .select('id, status_verifikasi')
    .eq('nisn', nisn)
    .eq('tanggal', tanggal)
    .maybeSingle()

  if (error) return { error: error.message }
  return { data }
}

// Get Sakit/Izin for Wali Kelas
export async function getSakitIzinWaliKelas(kelas, jurusan) {
  const query = supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .select('*')
    .order('created_at', { ascending: false })

  if (kelas) query.eq('kelas', kelas)
  if (jurusan) query.eq('jurusan', jurusan)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data }
}

// ============================
// SUBMIT SAKIT/IZIN (Langsung masuk rekap absensi & Dikunci)
// ============================
export async function submitSakitIzin(formData) {
  let fotoUrl = null
  
  // 1. Upload foto (Jika ada fileData dan berhasil, simpan URL. Jika gagal, lanjutkan tanpa foto)
  try {
    if (formData.fileData && formData.fileData.length > 0) {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('bukti-sakit-izin')
        .upload(`${formData.tanggal}/${formData.nisn}_${Date.now()}.jpg`, formData.fileData, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabaseAdmin.storage.from('bukti-sakit-izin').getPublicUrl(uploadData.path)
        fotoUrl = publicUrlData.publicUrl
      }
    }
  } catch (err) {
    console.error("Foto upload error, melanjutkan tanpa foto:", err)
  }

  // 2. Masukkan ke tabel tb_absensi_sakit_izin
  const { error: insertError } = await supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .insert([{
      tanggal: formData.tanggal,
      jam: formData.jam,
      nisn: formData.nisn,
      nama_siswa: formData.nama_siswa,
      kelas: formData.kelas,
      jurusan: formData.jurusan,
      jenis_absensi: formData.jenis_absensi,
      alasan: formData.alasan,
      foto_bukti: fotoUrl,
      latitude: formData.latitude,
      longitude: formData.longitude,
      akurasi_gps: formData.akurasi_gps,
      status_verifikasi: 'MENUNGGU VERIFIKASI'
    }])

  if (insertError) return { error: "Gagal menyimpan pengajuan: " + insertError.message }

  // 3. Cari ID Siswa untuk tabel absensi utama
  const { data: siswaData, error: siswaError } = await supabaseAdmin
    .from('siswa')
    .select('id')
    .eq('nis', formData.nisn)
    .single()

  if (siswaError || !siswaData) return { error: "Data siswa tidak ditemukan di database untuk sinkronisasi rekap!" }

  // 4. Langsung Upsert ke tabel absensi utama (Sakit/Izin) dan DIKUNCI UNTUK SEKRETARIS
  const { error: absensiError } = await supabaseAdmin
    .from('absensi')
    .upsert({
      siswa_id: siswaData.id,
      tanggal: formData.tanggal,
      status: formData.jenis_absensi,
      input_by: 'Sakit/Izin Online',
      locked: true, // KUNCI PENTING: Sekretaris tidak bisa edit
      updated_at: new Date().toISOString()
    }, { onConflict: 'siswa_id,tanggal' })

  if (absensiError) return { error: "Gagal sinkronisasi ke tabel absensi utama: " + absensiError.message }

  return { success: true }
}

// ============================
// VERIFY SAKIT/IZIN (Jika Ditolak jadi Alpha)
// ============================
export async function verifySakitIzin(id, status, catatan, waliKelasId, nisn, tanggal, jenisAbsensi) {
  const { error: updateError } = await supabaseAdmin
    .from('tb_absensi_sakit_izin')
    .update({
      status_verifikasi: status,
      verifikator: waliKelasId,
      waktu_verifikasi: new Date().toISOString(),
      catatan_wali_kelas: catatan,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  if (status === 'DITOLAK') {
    const { data: siswaData } = await supabaseAdmin
      .from('siswa')
      .select('id')
      .eq('nis', nisn)
      .single()

    if (siswaData) {
      await supabaseAdmin
        .from('absensi')
        .upsert({
          siswa_id: siswaData.id,
          tanggal: tanggal,
          status: 'Alpha',
          input_by: 'Sistem Otomatis',
          locked: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'siswa_id,tanggal' })
    }
  }

  return { success: true }
}

// ============================
// SUBMIT ABSEN HADIR MANDIRI (QR Scan + Validasi Kelas)
// ============================
export async function submitAbsenMandiri(nisn, tanggal, scannedKelas) {
  // 1. Cari data siswa berdasarkan NISN
  const { data: siswa, error: siswaError } = await supabaseAdmin
    .from('siswa')
    .select('id, nis, nama, kelas, jurusan')
    .eq('nis', nisn)
    .single()

  if (siswaError || !siswa) return { error: 'NISN tidak ditemukan dalam database!' }

  // 2. Validasi Kelas QR Code (Hanya jika sedang proses scan, bukan cek awal)
  if (scannedKelas && scannedKelas !== '') {
    const fullKelasSiswa = `${siswa.kelas.trim()} ${siswa.jurusan.trim()}`
    if (fullKelasSiswa !== scannedKelas.trim()) {
      return { error: `Gagal! Anda siswa kelas ${fullKelasSiswa}, namun mencoba scan QR kelas ${scannedKelas}.` }
    }
  }

  // 3. Cek apakah siswa sudah pernah absen hari ini
  const { data: existingAbsensi } = await supabaseAdmin
    .from('absensi')
    .select('id, status, input_by')
    .eq('siswa_id', siswa.id)
    .eq('tanggal', tanggal)
    .maybeSingle()

  if (existingAbsensi) {
    return { error: `Anda sudah tercatat hari ini dengan status: ${existingAbsensi.status} (${existingAbsensi.input_by})` }
  }

  // 4. Simpan ke tabel absensi utama sebagai Hadir (Hanya jika sedang proses scan)
  if (scannedKelas && scannedKelas !== '') {
    const { error: absensiError } = await supabaseAdmin
      .from('absensi')
      .upsert({
        siswa_id: siswa.id,
        tanggal: tanggal,
        status: 'Hadir',
        input_by: 'QR Mandiri',
        locked: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'siswa_id,tanggal' })

    if (absensiError) return { error: absensiError.message }
  }

  return { success: true, data: siswa }
}

// ============================
// GET SISWA BY NISN (For Sakit/Izin Page)
// ============================
export async function getSiswaByNISN(nisn) {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('*')
    .eq('nis', nisn)
    .single()

  if (error || !data) return { error: 'NISN tidak ditemukan dalam database!' }
  return { data }
}