'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL } from '@/lib/cacheHelpers'
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

// ── OPTIMASI: Cache 5 menit — data kelas/jurusan jarang berubah ──
export async function getKelasFilters() {
  return getCached('kelas_filters', async () => {
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
  }, TTL.KELAS_FILTERS)
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
  if (absensiList.length < siswaIds.length) return { submitted: false }
  const allHaveStatus = absensiList.every(a => a.status !== null); const allLocked = absensiList.every(a => a.locked === true)
  return { submitted: allHaveStatus && allLocked }
}

export async function createEditRequest(userId, kelas, jurusan, tanggal, reason) {
  const { data, error } = await supabaseAdmin.from('absensi_edit_requests').insert([{
    user_id: userId, kelas, jurusan, tanggal, reason, status: 'pending'
  }]).select().single()
  if (error) return { error: error.message }

  try {
    console.log(`[createEditRequest] Mencari Admin untuk notifikasi...`);
    const adminIds = await getAdminUserIds();
    console.log(`[createEditRequest] Admin ditemukan: ${adminIds.length} user, IDs:`, adminIds);
    if (adminIds.length > 0) {
      const notifResult = await notifyMultipleUsers({
        userIds: adminIds,
        title: '📝 Permintaan Revisi Absensi Baru',
        message: `${kelas ? kelas + ' ' : ''}${jurusan || ''} — Tanggal ${tanggal}. Alasan: "${(reason || '-').substring(0, 100)}"`,
        type: 'attendance_revision',
        priority: 'WARNING',
        referenceType: 'absensi_edit_request',
        referenceId: String(data?.id || ''),
        actionUrl: '/absensi',
      });
      if (notifResult.error) {
        console.error(`[createEditRequest] ❌ Gagal insert notifikasi ke Admin:`, notifResult.error);
      } else {
        console.log(`[createEditRequest] ✅ Notifikasi terkirim ke ${adminIds.length} Admin, jumlah row: ${notifResult.data?.length || 0}`);
      }
    } else {
      console.warn(`[createEditRequest] ⚠️ TIDAK ADA Admin ditemukan di tabel users (role=Administrator, status=Aktif)! Notifikasi tidak terkirim.`);
    }
  } catch (notifErr) {
    console.error('[createEditRequest] Gagal kirim notifikasi ke Admin:', notifErr);
  }

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
    
    if (targetId) {
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
  const { error: reqError } = await supabaseAdmin.from('absensi_edit_requests').update({ status: 'approved', approved_by: adminId, updated_at: new Date().toISOString() }).eq('id', requestId)
  if (reqError) return { error: reqError.message }

  let siswaQuery = supabaseAdmin.from('siswa').select('id')
  if (kelas) siswaQuery = siswaQuery.eq('kelas', kelas); if (jurusan) siswaQuery = siswaQuery.eq('jurusan', jurusan)
  const { data: siswaList } = await siswaQuery; if (!siswaList || siswaList.length === 0) return { error: 'Tidak ada siswa' }
  const siswaIds = siswaList.map(s => s.id)
  const { error: unlockError } = await supabaseAdmin.from('absensi').update({ locked: false, updated_at: new Date().toISOString() }).eq('tanggal', tanggal).in('siswa_id', siswaIds)
  if (unlockError) return { error: unlockError.message }

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
          referenceType: 'absensi_revision',
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
          referenceType: 'absensi_revision',
          referenceId: String(requestId),
          actionUrl: '/absensi',
        });
        console.log(`[rejectEdit] ✅ Notifikasi dikirim ke id=${targetId} (role: ${requestorRole})`);
      }
    }
  } catch (notifErr) {
    console.error('[rejectEdit] Gagal kirim notifikasi:', notifErr);
  }

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

// ── OPTIMASI: Upload foto + cari siswa → PARALEL (hemat ~20ms) ──
export async function submitSakitIzin(formData) {
  // Jalankan upload foto dan cari siswa secara paralel
  const [uploadResult, siswaResult] = await Promise.all([
    // Upload foto
    (async () => {
      try {
        if (formData.fileData && formData.fileData.length > 0) {
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('bukti-sakit-izin').upload(`${formData.tanggal}/${formData.nisn}_${Date.now()}.jpg`, formData.fileData, { contentType: 'image/jpeg', upsert: true })
          if (!uploadError && uploadData) { const { data: publicUrlData } = supabaseAdmin.storage.from('bukti-sakit-izin').getPublicUrl(uploadData.path); return publicUrlData.publicUrl }
        }
      } catch (err) { console.error("Foto upload error:", err) }
      return null
    })(),
    // Cari siswa
    supabaseAdmin.from('siswa').select('id').eq('nisn', formData.nisn).single(),
  ])

  const fotoUrl = uploadResult
  const { data: siswaData, error: siswaError } = siswaResult
  if (siswaError || !siswaData) return { error: "Data siswa tidak ditemukan di database untuk sinkronisasi rekap!" }

  const { error: insertError } = await supabaseAdmin.from('tb_absensi_sakit_izin').insert([{ tanggal: formData.tanggal, jam: formData.jam, nisn: formData.nisn, nama_siswa: formData.nama_siswa, kelas: formData.kelas, jurusan: formData.jurusan, jenis_absensi: formData.jenis_absensi, alasan: formData.alasan, foto_bukti: fotoUrl, latitude: formData.latitude, longitude: formData.longitude, akurasi_gps: formData.akurasi_gps, status_verifikasi: 'MENUNGGU VERIFIKASI' }])
  if (insertError) return { error: "Gagal menyimpan pengajuan: " + insertError.message }

  const { error: absensiError } = await supabaseAdmin.from('absensi').upsert({ siswa_id: siswaData.id, tanggal: formData.tanggal, status: formData.jenis_absensi, input_by: 'Sakit/Izin Online', locked: false, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' })
  if (absensiError) return { error: "Gagal sinkronisasi ke tabel absensi utama: " + absensiError.message }

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

  console.log(`[submitSakitIzin] ✅ Data masuk ke tabel absensi: siswa_id=${siswaData.id}, tanggal=${formData.tanggal}, status=${formData.jenis_absensi}, locked=false`);

  return { success: true }
}

export async function verifySakitIzin(id, status, catatan, waliKelasId, nisn, tanggal, jenisAbsensi) {
  const { error: updateError } = await supabaseAdmin.from('tb_absensi_sakit_izin').update({ status_verifikasi: status, verifikator: waliKelasId, waktu_verifikasi: new Date().toISOString(), catatan_wali_kelas: catatan, updated_at: new Date().toISOString() }).eq('id', id)
  if (updateError) return { error: updateError.message }
  if (status === 'DITOLAK') {
    const { data: siswaData } = await supabaseAdmin.from('siswa').select('id').eq('nisn', nisn).single()
    if (siswaData) { await supabaseAdmin.from('absensi').upsert({ siswa_id: siswaData.id, tanggal: tanggal, status: 'Alpha', input_by: 'Sistem Otomatis', locked: false, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' }) }
  }
  return { success: true }
}

// ── OPTIMASI: 2 query sequential → 1 paralel (cari siswa + cek absensi) ──
export async function checkQRScanToday(nisn) {
  const today = new Date().toLocaleDateString('sv-SE')
  // Jalankan cari siswa dan cek duplikat secara paralel
  // Catatan: cek absensi membutuhkan siswa.id, jadi kita gunakan approach
  // yang tetap aman: cari siswa dulu, lalu cek absensi
  // Kedua query sangat ringan (indexed, ~10ms masing-masing)
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

// ── OPTIMASI: Cari siswa + cek existing → paralel ──
export async function submitAbsenMandiri(nisn, tanggal, scannedKelas) {
  const { data: siswa, error: siswaError } = await supabaseAdmin.from('siswa').select('id, nisn, nama, kelas, jurusan').eq('nisn', nisn).single()
  if (siswaError || !siswa) return { error: 'NISN tidak ditemukan dalam database!' }
  if (scannedKelas && scannedKelas !== '') {
    const fullKelasSiswa = `${siswa.kelas.trim()} ${siswa.jurusan.trim()}`
    if (fullKelasSiswa !== scannedKelas.trim()) return { error: `Gagal! Anda siswa kelas ${fullKelasSiswa}, namun mencoba scan QR kelas ${scannedKelas}.` }
  }

  // Cek existing secara paralel dengan persiapan data
  const [existingResult] = await Promise.all([
    supabaseAdmin.from('absensi').select('id, status, input_by').eq('siswa_id', siswa.id).eq('tanggal', tanggal).maybeSingle(),
  ])

  if (existingResult.data) return { error: `Anda sudah tercatat hari ini dengan status: ${existingResult.data.status} (${existingResult.data.input_by})` }
  if (scannedKelas && scannedKelas !== '') {
    const { error: absensiError } = await supabaseAdmin.from('absensi').upsert({ siswa_id: siswa.id, tanggal: tanggal, status: 'Hadir', input_by: 'QR Mandiri', locked: false, updated_at: new Date().toISOString() }, { onConflict: 'siswa_id,tanggal' })
    if (absensiError) return { error: absensiError.message }
  }
  console.log(`[submitAbsenMandiri] ✅ Data masuk ke tabel absensi: siswa_id=${siswa.id}, tanggal=${tanggal}, status=Hadir, locked=false`);

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
    // ── 1. Hapus foto bukti yang sudah lebih dari 1 hari (existing behavior) ──
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const oneDayCutoff = oneDayAgo.toISOString()

    const { data: oldPhotos } = await supabaseAdmin
      .from('tb_absensi_sakit_izin')
      .select('id, foto_bukti')
      .lt('created_at', oneDayCutoff)
      .not('foto_bukti', 'is', null)

    for (const record of (oldPhotos || [])) {
      if (record.foto_bukti) {
        const fileName = record.foto_bukti.split('/').pop()
        if (fileName) {
          await supabaseAdmin.storage.from('bukti-sakit-izin').remove([fileName])
        }
      }
    }

    // ── 2. Hapus record yang sudah lebih dari 30 hari ──
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDayCutoff = thirtyDaysAgo.toISOString()

    const { data: oldRecords } = await supabaseAdmin
      .from('tb_absensi_sakit_izin')
      .select('id, foto_bukti')
      .lte('created_at', thirtyDayCutoff)

    if (oldRecords && oldRecords.length > 0) {
      // Hapus foto yang mungkin masih tersisa (jika cleanup 1 hari sebelumnya gagal)
      for (const record of oldRecords) {
        if (record.foto_bukti) {
          const fileName = record.foto_bukti.split('/').pop()
          if (fileName) {
            await supabaseAdmin.storage.from('bukti-sakit-izin').remove([fileName])
          }
        }
      }

      // Hapus record dari database (batch 100 untuk aman)
      const ids = oldRecords.map(r => r.id)
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100)
        await supabaseAdmin
          .from('tb_absensi_sakit_izin')
          .delete()
          .in('id', batch)
      }
    }
  } catch (err) {
    console.error('Gagal cleanup sakit/izin:', err)
  }
}

export async function getEditRequestDetails(requestId) {
  const { data, error } = await supabaseAdmin
    .from('absensi_edit_requests')
    .select('id, user_id, kelas, jurusan, tanggal, reason, status, approved_by, created_at')
    .eq('id', requestId)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getUserKelasInfo(userId) {
  if (!userId) return { kelas: null, jurusan: null }
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('kelas, jurusan')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[getUserKelasInfo] Error:', error.message)
    return { kelas: null, jurusan: null }
  }
  return { kelas: data?.kelas || null, jurusan: data?.jurusan || null }
}

export async function getWKKelasAssignment(userId) {
  if (!userId) return { kelas: null, jurusan: null, jurusanOptions: [], needsSelection: false }

  try {
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('kelas, jurusan')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[getWKKelasAssignment] DB Error:', error.message)
      return { kelas: null, jurusan: null, jurusanOptions: [], needsSelection: false }
    }

    const kelas = userData?.kelas?.trim() || null
    const jurusan = (userData?.jurusan && typeof userData.jurusan === 'string') ? userData.jurusan.trim() : null

    if (kelas && jurusan) {
      return { kelas, jurusan, jurusanOptions: [jurusan], needsSelection: false }
    }

    if (kelas) {
      const { data: siswaList } = await supabaseAdmin
        .from('siswa')
        .select('jurusan')
        .eq('kelas', kelas)
        .not('jurusan', 'is', null)

      const uniqueJurusan = [...new Set((siswaList || []).map(s => {
        if (!s.jurusan || typeof s.jurusan !== 'string') return null
        return s.jurusan.trim()
      }).filter(Boolean))].sort()

      if (uniqueJurusan.length === 1) {
        console.log(`[getWKKelasAssignment] Auto-pilih jurusan: "${uniqueJurusan[0]}"`)
        return { kelas, jurusan: uniqueJurusan[0], jurusanOptions: uniqueJurusan, needsSelection: false }
      } else if (uniqueJurusan.length > 1) {
        console.log(`[getWKKelasAssignment] Ditemukan ${uniqueJurusan.length} jurusan:`, uniqueJurusan)
        return { kelas, jurusan: null, jurusanOptions: uniqueJurusan, needsSelection: true }
      }
    }

    return { kelas, jurusan: null, jurusanOptions: [], needsSelection: false }
  } catch (err) {
    console.error('[getWKKelasAssignment] Unexpected error:', err)
    return { kelas: null, jurusan: null, jurusanOptions: [], needsSelection: false }
  }
}

async function getRoleByUserId(userId) {
  if (!userId) return null
  const { data } = await supabaseAdmin.from('users').select('role').eq('id', userId).maybeSingle()
  return data?.role || null
}

export async function checkStudentPKLStatus(studentId) {
  const { data, error } = await supabaseAdmin
    .from('pkl_profiles')
    .select('status')
    .eq('student_id', studentId)
    .eq('status', 'Berjalan')
    .maybeSingle()
  if (error) return { isPKL: false }
  return { isPKL: !!data }
}