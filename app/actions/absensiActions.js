'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getWaliKelasUserId,
  getSekretarisUserId,
  getAdminUserIds,
  createNotification,
  notifyMultipleUsers,
  createNotificationWithAdminCC,
  notifyWaliKelasSakitIzin,
} from '@/app/actions/notificationActions';

export async function getAllKelas() {
  const { data, error } = await supabaseAdmin.from('siswa').select('kelas').not('kelas', 'is', null)
  if (error) return { kelas: [] }
  const unique = [...new Set(data.map(s => s.kelas).filter(Boolean))].sort()
  return { kelas: unique }
}

export async function getKelasFilters() {
  const tingkat = ['X', 'XI', 'XII']
  const jurusan = ['TKRO', 'DKV', 'RPL', 'PH', 'KL', 'LPKKK']
  const nomor = ['1', '2', '3', '4']
  const { data, error } = await supabaseAdmin.from('siswa').select('kelas, jurusan').not('kelas', 'is', null)
  const kelasSet = new Set()
  const kelasJurusanList = []
  const kelasJurusanSet = new Set()
  if (!error && data) {
    data.forEach(s => {
      if (s.kelas) kelasSet.add(s.kelas.trim())
      if (s.jurusan) {
        const combo = `${s.kelas.trim()} ${s.jurusan.trim()}`
        if (!kelasJurusanSet.has(combo)) {
          kelasJurusanSet.add(combo)
          kelasJurusanList.push({ kelas: s.kelas.trim(), jurusan: s.jurusan.trim(), full: combo })
        }
      }
    })
  }
  return { kelas: [...kelasSet].sort(), tingkat, jurusan, nomor, kelasJurusanList }
}

export async function getSiswaByKelas(kelas, jurusan) {
  let query = supabaseAdmin.from('siswa').select('*')
  if (kelas) query = query.eq('kelas', kelas)
  if (jurusan) query = query.ilike('jurusan', `%${jurusan}%`)
  const { data, error } = await query.order('nama', { ascending: true })
  if (error) return { siswa: [], error: error.message }
  return { siswa: data || [] }
}

export async function getAbsensiByDate(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('*').order('nama', { ascending: true })
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList, error: siswaError } = await siswaQuery
  if (siswaError) return { data: [], error: siswaError.message }
  if (!siswaList || siswaList.length === 0) return { data: [], error: null }
  const siswaIds = siswaList.map(s => s.id)
  const { data: absensiList, error: absensiError } = await supabaseAdmin.from('absensi').select('*').eq('tanggal', tanggal).in('siswa_id', siswaIds)
  if (absensiError) return { data: [], error: absensiError.message }
  const absensiMap = {}; (absensiList || []).forEach(a => { absensiMap[a.siswa_id] = a })
  const merged = siswaList.map(s => ({ ...s, absensi_id: absensiMap[s.id]?.id || null, status: absensiMap[s.id]?.status || null, input_by: absensiMap[s.id]?.input_by || null, locked: absensiMap[s.id]?.locked || false }))
  return { data: merged, error: null }
}

export async function getAbsensiStats(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas)
  if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList } = await siswaQuery
  const siswaIds = (siswaList || []).map(s => s.id); const totalSiswa = siswaIds.length
  if (totalSiswa === 0) return { total: 0, hadir: 0, sakit: 0, izin: 0, alpha: 0, belum: 0 }
  const { data: absensiList } = await supabaseAdmin.from('absensi').select('status').eq('tanggal', tanggal).in('siswa_id', siswaIds)
  const hadir = (absensiList || []).filter(a => a.status === 'Hadir').length
  const sakit = (absensiList || []).filter(a => a.status === 'Sakit').length
  const izin = (absensiList || []).filter(a => a.status === 'Izin').length
  const alpha = (absensiList || []).filter(a => a.status === 'Alpha').length
  const sudahAbsen = hadir + sakit + izin + alpha
  return { total: totalSiswa, hadir, sakit, izin, alpha, belum: totalSiswa - sudahAbsen }
}

export async function upsertAbsensi(siswaId, tanggal, status, inputBy = 'Sekretaris Kelas', locked = false) {
  const { data, error } = await supabaseAdmin.from('absensi').upsert({ siswa_id: siswaId, tanggal, status, input_by: inputBy, locked, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' }).select().single()
  if (error) return { error: error.message }; return { success: true, data }
}

export async function batchUpsertAbsensi(records) {
  const upsertData = records.map(r => ({ siswa_id: r.siswa_id, tanggal: r.tanggal, status: r.status, input_by: r.input_by || 'Sekretaris Kelas', locked: r.locked || false, updated_at: new Date().toISOString() }))
  const { data, error } = await supabaseAdmin.from('absensi').upsert(upsertData, { onConflict: 'siswa_id,tanggal' }).select()
  if (error) return { error: error.message }; return { success: true, count: data.length }
}

export async function getAbsentStudentsForDashboard(tanggal) {
  const { data: absensiList, error } = await supabaseAdmin.from('absensi').select('siswa_id, status').eq('tanggal', tanggal).neq('status', 'Hadir')
  if (error || !absensiList || absensiList.length === 0) return { data: [] }
  const siswaIds = absensiList.map(a => a.siswa_id)
  const { data: siswaList } = await supabaseAdmin.from('siswa').select('id, nama, kelas, jurusan, jenis_kelamin').in('id', siswaIds)
  const absensiMap = {}; absensiList.forEach(a => { absensiMap[a.siswa_id] = a.status })
  const grouped = {}; (siswaList || []).forEach(s => {
    const tingkat = (s.kelas || '').trim(); const jurusan = (s.jurusan || '').trim()
    const fullKelas = tingkat && jurusan ? `${tingkat} ${jurusan}` : (tingkat || jurusan || 'Lainnya')
    if (!grouped[fullKelas]) grouped[fullKelas] = { kelas: fullKelas, siswa: [] }
    grouped[fullKelas].siswa.push({ nama: s.nama, lp: s.jenis_kelamin === 'P' ? 'P' : 'L', status: absensiMap[s.id] || 'Alpha' })
  })
  return { data: Object.values(grouped) }
}

export async function submitAbsensi(tanggal, kelas, jurusan, records = null) {
  if (records && records.length > 0) {
    const { error } = await supabaseAdmin.from('absensi').upsert(records, { onConflict: 'siswa_id,tanggal' })
    if (error) return { error: error.message }
  }
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas); if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList } = await siswaQuery; if (!siswaList || siswaList.length === 0) return { error: 'Tidak ada siswa' }
  const siswaIds = siswaList.map(s => s.id)
  const { error } = await supabaseAdmin.from('absensi').update({ locked: true, updated_at: new Date().toISOString() }).eq('tanggal', tanggal).in('siswa_id', siswaIds)
  if (error) return { error: error.message }; return { success: true }
}

export async function isAbsensiSubmitted(tanggal, kelas, jurusan) {
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas); if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList } = await siswaQuery; if (!siswaList || siswaList.length === 0) return { submitted: false }
  const siswaIds = siswaList.map(s => s.id)
  const { data: absensiList } = await supabaseAdmin.from('absensi').select('id, status, locked').eq('tanggal', tanggal).in('siswa_id', siswaIds)
  if (!absensiList || absensiList.length === 0) return { submitted: false }
  const allHaveStatus = absensiList.every(a => a.status !== null); const allLocked = absensiList.every(a => a.locked === true)
  return { submitted: allHaveStatus && allLocked }
}

export async function createEditRequest(userId, kelas, jurusan, tanggal, reason) {
  const { data, error } = await supabaseAdmin.from('absensi_edit_requests').insert([{
    user_id: userId, kelas, jurusan, tanggal, reason, status: 'pending'
  }]).select().single()
  if (error) return { error: error.message }

  // Kirim notifikasi ke SEMUA Admin
  try {
    const adminIds = await getAdminUserIds();
    if (adminIds.length > 0) {
      await notifyMultipleUsers({
        userIds: adminIds,
        title: '📝 Permintaan Revisi Absensi Baru',
        message: `${kelas ? kelas + ' ' : ''}${jurusan || ''} — Tanggal ${tanggal}. Alasan: "${(reason || '-').substring(0, 100)}"`,
        type: 'attendance_revision',
        priority: 'WARNING',
        referenceType: 'absensi_edit_request',
        referenceId: String(data?.id || ''),
        actionUrl: '/absensi',
      });
      console.log(`[createEditRequest] ✅ Notifikasi terkirim ke ${adminIds.length} Admin`);
    }
  } catch (notifErr) {
    console.error('[createEditRequest] Gagal kirim notifikasi ke Admin:', notifErr);
  }

  // Kirim konfirmasi ke pemohon
  try {
    const requestorRole = data ? await getRoleByUserId(data.user_id) : null;
    let targetId = data.user_id;
    
    if (requestorRole === 'Sekretaris Kelas') {
      const sekId = await getSekretarisUserId(kelas, jurusan);
      if (sekId) targetId = sekId;
    } else if (requestorRole === 'Wali Kelas') {
      const wkId = await getWaliKelasUserId(kelas, jurusan);
      if (wkId) targetId = wkId;
    }
    
    if (targetId && String(targetId) !== String(adminId)) {
      await createNotification({
        userId: targetId,
        title: '📨 Permintaan Revisi Terkirim',
        message: `Permintaan revisi absensi tanggal ${tanggal} telah dikirim ke Administrator. Tunggu persetujuan sebelum bisa mengedit.`,
        type: 'attendance_revision',
        priority: 'INFO',
        referenceType: 'absensi_edit_request',
        referenceId: String(data?.id || ''),
        actionUrl: '/absensi',
      });
      console.log(`[createEditRequest] ✅ Konfirmasi dikirim ke id=${targetId} (role: ${requestorRole})`);
    }
  } catch (err) {
    console.error('[createEditRequest] Gagal kirim konfirmasi ke pemohon:', err);
  }

  return { success: true, data }
}

export async function approveEditRequest(requestId, adminId, kelas, jurusan, tanggal) {
  // 1. Update status request
  const { error: reqError } = await supabaseAdmin.from('absensi_edit_requests').update({ status: 'approved', approved_by: adminId, updated_at: new Date().toISOString() }).eq('id', requestId)
  if (reqError) return { error: reqError.message }

  // 2. Unlock absensi kelas tersebut
  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas); if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList } = await siswaQuery; if (!siswaList || siswaList.length === 0) return { error: 'Tidak ada siswa' }
  const siswaIds = siswaList.map(s => s.id)
  const { error: unlockError } = await supabaseAdmin.from('absensi').update({ locked: false, updated_at: new Date().toISOString() }).eq('tanggal', tanggal).in('siswa_id', siswaIds)
  if (unlockError) return { error: unlockError.message }

  // 3. Kirim notifikasi ke pemohon (Sekretaris/WK)
  try {
    const { data: reqData } = await supabaseAdmin
      .from('absensi_edit_requests')
      .select('user_id, kelas, jurusan, tanggal')
      .eq('id', requestId)
      .maybeSingle();

    if (reqData) {
      const requestorRole = await getRoleByUserId(reqData.user_id);
      let targetId = reqData.user_id;
      
      if (requestorRole === 'Sekretaris Kelas') {
        const sekId = await getSekretarisUserId(reqData.kelas, reqData.jurusan);
        if (sekId) targetId = sekId;
      } else if (requestorRole === 'Wali Kelas') {
        const wkId = await getWaliKelasUserId(reqData.kelas, reqData.jurusan);
        if (wkId) targetId = wkId;
      }
      
      if (targetId && String(targetId) !== String(adminId)) {
        await createNotification({
          userId: targetId,
          title: '✅ Revisi Absensi Disetujui',
          message: `Administrator telah menyetujui revisi absensi tanggal ${reqData.tanggal} kelas ${reqData.kelas} ${reqData.jurusan || ''}. Anda sekarang bisa mengedit data absensi.`,
          type: 'attendance_revision',
          priority: 'SUCCESS',
          referenceType: 'attendance_revision',
          referenceId: String(requestId),
          actionUrl: '/absensi',
        });
        console.log(`[approveEdit] ✅ Notifikasi dikirim ke id=${targetId} (role: ${requestorRole})`);
      }
    }
  } catch (notifErr) {
    console.error('[approveEdit] Gagal kirim notifikasi:', notifErr);
  }

  return { success: true }
}

export async function rejectEditRequest(requestId, adminId) {
  // 1. Kirim notifikasi SEBELUM update status
  try {
    const { data: reqData } = await supabaseAdmin
      .from('absensi_edit_requests')
      .select('user_id, kelas, jurusan, tanggal, reason')
      .eq('id', requestId)
      .maybeSingle();

    if (reqData) {
      const requestorRole = await getRoleByUserId(reqData.user_id);
      let targetId = reqData.user_id;
      
      if (requestorRole === 'Sekretaris Kelas') {
        const sekId = await getSekretarisUserId(reqData.kelas, reqData.jurusan);
        if (sekId) targetId = sekId;
      } else if (requestorRole === 'Wali Kelas') {
        const wkId = await getWaliKelasUserId(reqData.kelas, reqData.jurusan);
        if (wkId) targetId = wkId;
      }
      
      if (targetId && String(targetId) !== String(adminId)) {
        await createNotification({
          userId: targetId,
          title: '❌ Revisi Absensi Ditolak',
          message: `Administrator menolak revisi absensi tanggal ${reqData.tanggal} kelas ${reqData.kelas} ${reqData.jurusan || ''}. Alasan: ${reqData.reason || '-'}`,
          type: 'attendance_revision',
          priority: 'DANGER',
          referenceType: 'attendance_revision',
          referenceId: String(requestId),
          actionUrl: '/absensi',
        });
        console.log(`[rejectEdit] ✅ Notifikasi dikirim ke id=${targetId} (role: ${requestorRole})`);
      }
    }
  } catch (notifErr) {
    console.error('[rejectEdit] Gagal kirim notifikasi:', notifErr);
  }

  // 2. Update status request
  const { error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .update({ status: 'rejected', approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) return { error: error.message };
  return { success: true }
}

export async function checkPendingRequest(userId, tanggal) {
  const { data, error } = await supabaseAdmin.from('absensi_edit_requests').select('id, status').eq('user_id', userId).eq('tanggal', tanggal).order('created_at', { ascending: false }).limit(1)
  if (error) return { hasPending: false, hasApproved: false }
  const latest = data?.[0]; return { hasPending: latest?.status === 'pending', hasApproved: latest?.status === 'approved', requestId: latest?.id || null }
}

export async function getSiswaProfileFromUser(nama, kelas) {
  const { data, error } = await supabaseAdmin.from('siswa').select('id, nisn, nama, kelas, jurusan').ilike('nama', nama).eq('kelas', kelas).limit(1).single()
  if (error) return { error: 'Data siswa tidak ditemukan di database' }; return { data }
}

export async function checkSakitIzinToday(nisn, tanggal) {
  const { data, error } = await supabaseAdmin.from('tb_absensi_sakit_izin').select('id, status_verifikasi').eq('nisn', nisn).eq('tanggal', tanggal).maybeSingle()
  if (error) return { error: error.message }; return { data }
}

export async function getSakitIzinWaliKelas(kelas, jurusan) {
  const query = supabaseAdmin.from('tb_absensi_sakit_izin').select('*').order('created_at', { ascending: false })
  if (kelas) query.eq('kelas', kelas); if (jurusan) query.eq('jurusan', jurusan)
  const { data, error } = await query; if (error) return { data: [], error: error.message }; return { data }
}

export async function submitSakitIzin(formData) {
  let fotoUrl = null
  try {
    if (formData.fileData && formData.fileData.length > 0) {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('bukti-sakit-izin').upload(`${formData.tanggal}/${formData.nisn}_${Date.now()}.jpg`, formData.fileData, { contentType: 'image/jpeg', upsert: true })
      if (!uploadError && uploadData) { const { data: publicUrlData } = supabaseAdmin.storage.from('bukti-sakit-izin').getPublicUrl(uploadData.path); fotoUrl = publicUrlData.publicUrl }
    }
  } catch (err) { console.error("Foto upload error:", err) }

  const { error: insertError } = await supabaseAdmin.from('tb_absensi_sakit_izin').insert([{ tanggal: formData.tanggal, jam: formData.jam, nisn: formData.nisn, nama_siswa: formData.nama_siswa, kelas: formData.kelas, jurusan: formData.jurusan, jenis_absensi: formData.jenis_absensi, alasan: formData.alasan, foto_bukti: fotoUrl, latitude: formData.latitude, longitude: formData.longitude, akurasi_gps: formData.akurasi_gps, status_verifikasi: 'MENUNGGU VERIFIKASI' }])
  if (insertError) return { error: "Gagal menyimpan pengajuan: " + insertError.message }

  const { data: siswaData, error: siswaError } = await supabaseAdmin.from('siswa').select('id').eq('nisn', formData.nisn).single()
  if (siswaError || !siswaData) return { error: "Data siswa tidak ditemukan di database untuk sinkronisasi rekap!" }

  const { error: absensiError } = await supabaseAdmin.from('absensi').upsert({ siswa_id: siswaData.id, tanggal: formData.tanggal, status: formData.jenis_absensi, input_by: 'Sakit/Izin Online', locked: true, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' })
  if (absensiError) return { error: "Gagal sinkronisasi ke tabel absensi utama: " + absensiError.message }

  // ── Kirim notifikasi ke Wali Kelas + Admin CC ──
  try {
    console.log(`[submitSakitIzin] Cari WK untuk kelas="${formData.kelas}" jurusan="${formData.jurusan}"`);
    await notifyWaliKelasSakitIzin({
      siswaNama: formData.nama_siswa,
      kelas: formData.kelas,
      jurusan: formData.jurusan,
      jenisAbsensi: formData.jenis_absensi,
      siswaId: siswaData.id,
    });
    console.log('[submitSakitIzin] Notifikasi WK terkirim');
  } catch (notifErr) {
    console.error('[submitSakitIzin] Gagal kirim notifikasi WK:', notifErr);
  }

  // Tambahkan SEBELUM baris return { success: true }
  console.log(`[submitSakitIzin] ✅ Data masuk ke tabel absensi: siswa_id=${siswaData.id}, tanggal=${formData.tanggal}, status=${formData.jenis_absensi}, locked=true`);

  return { success: true }
}

export async function verifySakitIzin(id, status, catatan, waliKelasId, nisn, tanggal, jenisAbsensi) {
  const { error: updateError } = await supabaseAdmin.from('tb_absensi_sakit_izin').update({ status_verifikasi: status, verifikator: waliKelasId, waktu_verifikasi: new Date().toISOString(), catatan_wali_kelas: catatan, updated_at: new Date().toISOString() }).eq('id', id)
  if (updateError) return { error: updateError.message }
  if (status === 'DITOLAK') {
    const { data: siswaData } = await supabaseAdmin.from('siswa').select('id').eq('nisn', nisn).single()
    if (siswaData) { await supabaseAdmin.from('absensi').upsert({ siswa_id: siswaData.id, tanggal: tanggal, status: 'Alpha', input_by: 'Sistem Otomatis', locked: true, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' }) }
  }
  return { success: true }
}

export async function checkQRScanToday(nisn) {
  const today = new Date().toLocaleDateString('sv-SE')
  const { data: siswa } = await supabaseAdmin.from('siswa').select('id').eq('nisn', nisn).maybeSingle()
  if (!siswa) return { alreadyScanned: false }
  const { data } = await supabaseAdmin
    .from('absensi')
    .select('id')
    .eq('siswa_id', siswa.id)
    .eq('tanggal', today)
    .eq('input_by', 'QR Mandiri')
    .maybeSingle()
  return { alreadyScanned: !!data }
}

export async function submitAbsenMandiri(nisn, tanggal, scannedKelas) {
  const { data: siswa, error: siswaError } = await supabaseAdmin.from('siswa').select('id, nisn, nama, kelas, jurusan').eq('nisn', nisn).single()
  if (siswaError || !siswa) return { error: 'NISN tidak ditemukan dalam database!' }
  if (scannedKelas && scannedKelas !== '') {
    const fullKelasSiswa = `${siswa.kelas.trim()} ${siswa.jurusan.trim()}`
    if (fullKelasSiswa !== scannedKelas.trim()) return { error: `Gagal! Anda siswa kelas ${fullKelasSiswa}, namun mencoba scan QR kelas ${scannedKelas}.` }
  }
  const { data: existingAbsensi } = await supabaseAdmin.from('absensi').select('id, status, input_by').eq('siswa_id', siswa.id).eq('tanggal', tanggal).maybeSingle()
  if (existingAbsensi) return { error: `Anda sudah tercatat hari ini dengan status: ${existingAbsensi.status} (${existingAbsensi.input_by})` }
  if (scannedKelas && scannedKelas !== '') {
    const { error: absensiError } = await supabaseAdmin.from('absensi').upsert({ siswa_id: siswa.id, tanggal: tanggal, status: 'Hadir', input_by: 'QR Mandiri', locked: true, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' })
    if (absensiError) return { error: absensiError.message }
  }
  // Tambahkan SEBELUM return { success: true, data: siswa }
  console.log(`[submitAbsenMandiri] ✅ Data masuk ke tabel absensi: siswa_id=${siswa.id}, tanggal=${tanggal}, status=Hadir, locked=true`);

  return { success: true, data: siswa }
}

export async function getSiswaByNISN(nisn) {
  const trimmed = (nisn || '').trim()
  if (!trimmed) return { error: 'NISN tidak boleh kosong!' }

  let { data, error } = await supabaseAdmin.from('siswa').select('*').eq('nisn', trimmed).maybeSingle()

  if (!data) {
    const { data: data2 } = await supabaseAdmin.from('siswa').select('*').eq('nis', trimmed).maybeSingle()
    if (data2) { data = data2; error = null }
  }

  if (error) return { error: error.message }
  if (!data) return { error: 'NISN tidak ditemukan dalam database!' }

  if (!data.nisn && data.nis) data.nisn = data.nis

  return { data }
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP: Hapus foto bukti sakit/izin yang lebih dari 1 hari
// ═══════════════════════════════════════════════════════════════
function extractStoragePath(url) {
  if (!url) return null
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/bukti-sakit-izin\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export async function cleanupOldBuktiSakitIzin() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const cutoff = yesterday.toISOString()

    // Cari record yang sudah lebih dari 1 hari dan punya foto
    const { data: oldRecords, error: queryError } = await supabaseAdmin
      .from('tb_absensi_sakit_izin')
      .select('id, foto_bukti')
      .not('foto_bukti', 'is', null)
      .lt('created_at', cutoff)
      .limit(100)

    if (queryError || !oldRecords || oldRecords.length === 0) {
      return { deleted: 0 }
    }

    let deletedCount = 0
    const idsToUpdate = []

    for (const record of oldRecords) {
      const path = extractStoragePath(record.foto_bukti)
      if (path) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('bukti-sakit-izin')
          .remove([path])

        if (!deleteError) {
          idsToUpdate.push(record.id)
          deletedCount++
        }
      }
    }

    // Kosongkan kolom foto_bukti di database untuk file yang berhasil dihapus
    if (idsToUpdate.length > 0) {
      await supabaseAdmin
        .from('tb_absensi_sakit_izin')
        .update({ foto_bukti: null })
        .in('id', idsToUpdate)
    }

    if (deletedCount > 0) {
      console.log(`[cleanupBukti] ${deletedCount} file foto lama dihapus dari storage`)
    }

    return { deleted: deletedCount }
  } catch (err) {
    console.error('[cleanupBukti] Error:', err)
    return { deleted: 0 }
  }
}

async function getRoleByUserId(userId) {
  if (!userId) return null
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).maybeSingle()
  return data?.role || null
}