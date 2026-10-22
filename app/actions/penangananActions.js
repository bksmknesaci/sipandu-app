'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

function parseKelasJurusan(kelas) {
  if (!kelas) return { tingkat: '', jurusan: '' }
  const parts = kelas.trim().split(/\s+/)
  return {
    tingkat: parts[0] || '',
    jurusan: parts.length >= 3 ? parts.slice(1).join(' ') : (parts[1] || ''),
  }
}

// ── Helper: batch .in() query agar tidak melebihi batas panjang URL PostgREST ──
async function fetchInBatches(table, columns, nisns, batchSize = 100) {
  const results = []
  for (let i = 0; i < nisns.length; i += batchSize) {
    const batch = nisns.slice(i, i + batchSize)
    const { data } = await supabaseAdmin.from(table).select(columns).in('nisn', batch)
    if (data) results.push(...data)
  }
  return results
}

// ── OPTIMASI: Cache 5 menit — filter options jarang berubah ──
export async function getPenangananFilters() {
  return getCached('penanganan_filters', async () => {
    const { data, error } = await supabaseAdmin.from('siswa').select('kelas, jurusan').eq('status', 'Aktif')
    if (error) return { tingkat: [], jurusan: [] }

    const tingkat = [...new Set(data.map(s => {
      const k = (s.kelas || '').trim()
      const firstWord = k.split(/\s+/)[0]
      return ['X', 'XI', 'XII'].includes(firstWord) ? firstWord : null
    }).filter(Boolean))].sort((a, b) => {
      const order = { 'X': 1, 'XI': 2, 'XII': 3 }
      return (order[a] || 99) - (order[b] || 99)
    })

    const jurusan = [...new Set(data.map(s => {
      const k = (s.kelas || '').trim()
      const parts = k.split(/\s+/)
      if (parts.length > 1) return parts.slice(1).join(' ')
      return (s.jurusan || '').trim()
    }).filter(Boolean))].sort()

    return { tingkat, jurusan }
  }, TTL.KELAS_FILTERS)
}

export async function getPenangananData(filters = {}) {
  try {
    // ── FIX BATAS 1000 BARIS POSTGREST ──
    // Tanpa filter tingkat, query mengambil seluruh sekolah (>1000 baris) dan
    // terpotong diam-diam di 1000 — siswa urutan nama terakhir hilang
    // (itulah sebabnya filter Mutasi menampilkan 9 dari 11 siswa).
    // Solusi: bangun ulang query per halaman 1000 baris + ORDER stabil.
    const buildSiswaQuery = () => {
      let q = supabaseAdmin.from('siswa').select('*').in('status', ['Aktif', 'Pindah', 'Keluar']);

      if (filters?.userRole === 'Wali Kelas') {
        const parsed = parseKelasJurusan(filters.userKelas);
        const jurusan = (filters?.userJurusan || '').trim() || parsed.jurusan;
        if (parsed.tingkat) q = q.eq('kelas', parsed.tingkat);
        if (jurusan) q = q.eq('jurusan', jurusan);
      } else {
        if (filters?.tingkat) q = q.eq('kelas', filters.tingkat);
        if (filters?.jurusan) q = q.eq('jurusan', filters.jurusan);
      }

      if (filters?.search) {
        const safeSearch = filters.search.replace(/[%_]/g, '\\$&');
        q = q.or(`nama.ilike.%${safeSearch}%,nisn.ilike.%${safeSearch}%`);
      }
      return q;
    };

    let siswaList = [];
    let queryError = null;
    const PAGE = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await buildSiswaQuery()
        .order('nama', { ascending: true })
        .order('id', { ascending: true })   // tie-breaker — pagination harus stabil
        .range(page * PAGE, (page + 1) * PAGE - 1);
      if (error) { queryError = error; break; }
      siswaList = siswaList.concat(data || []);
      hasMore = (data || []).length === PAGE;
      page++;
    }

    if (queryError) return { data: [], error: queryError.message };
    if (siswaList.length === 0) return { data: [] };

    const nisns = siswaList.map(s => s.nisn).filter(Boolean)
    if (nisns.length === 0) return { data: [] }

    // Gunakan batch query agar data lengkap meski nisns sangat banyak
    const [pelanggaranData, penangananData] = await Promise.all([
      fetchInBatches('tb_pelanggaran_siswa', 'nisn, poin', nisns),
      fetchInBatches('tb_penanganan_siswa', '*', nisns),
    ])

    const pelanggaranTotals = {}
    pelanggaranData.forEach(p => {
      const nisn = (p.nisn || '').trim()
      if (!pelanggaranTotals[nisn]) pelanggaranTotals[nisn] = 0
      pelanggaranTotals[nisn] += (p.poin || 0)
    })

    const penangananMap = {}
    penangananData.forEach(p => {
      penangananMap[(p.nisn || '').trim()] = p
    })

    const result = siswaList.map(s => {
      const nisn = (s.nisn || '').trim()
      const totalPoin = pelanggaranTotals[nisn] || 0
      const penanganan = penangananMap[nisn] || null

      // Trim tahap dari database untuk menghindari mismatch akibat whitespace
      const dbTahap = (penanganan?.tahap || '').trim()
      const statusAkhir = (penanganan?.status_akhir || s.status || 'Aktif').trim()

      let tahap = 'Belum Pembinaan'

      if (statusAkhir === 'Pindah' || statusAkhir === 'Keluar') {
        tahap = dbTahap || statusAkhir
      } else if (dbTahap) {
        tahap = dbTahap
      } else if (totalPoin > 0) {
        if (totalPoin >= 150) tahap = 'SP3'
        else if (totalPoin >= 126) tahap = 'SP2'
        else if (totalPoin >= 100) tahap = 'SP1'
        else tahap = 'Dalam Pembinaan'
      }

      return {
        ...s,
        total_pelanggaran: totalPoin,
        penanganan: penanganan ? { ...penanganan, tahap, status_akhir: statusAkhir } : { tahap, status_akhir: statusAkhir }
      }
    })

    // Sort: Pindah/Keluar ke bawah, lalu poin pelanggaran tertinggi di atas
    result.sort((a, b) => {
      const aExit = a.penanganan?.status_akhir === 'Aktif' ? 0 : 1
      const bExit = b.penanganan?.status_akhir === 'Aktif' ? 0 : 1
      if (aExit !== bExit) return aExit - bExit
      return (b.total_pelanggaran || 0) - (a.total_pelanggaran || 0)
    })

    let finalData = result;
    if (filters?.status && filters.status !== 'Semua') {
      const filterStatus = (filters.status || '').trim()
      if (filterStatus === 'Pindah' || filterStatus === 'Keluar') {
        finalData = finalData.filter(s => (s.penanganan?.status_akhir || '').trim() === filterStatus || (s.status || '').trim() === filterStatus)
      } else {
        finalData = finalData.filter(s => (s.penanganan?.tahap || '').trim() === filterStatus)
      }
    }

    return { data: finalData }
  } catch (err) { return { data: [], error: err.message } }
}

export async function getPenangananStats() {
  try {
    let siswa = [];
{
  const PAGE = 1000;
  let pg = 0;
  let more = true;
  while (more) {
    const { data } = await supabaseAdmin.from('siswa').select('nisn, status')
      .in('status', ['Aktif', 'Pindah', 'Keluar'])
      .order('id', { ascending: true })
      .range(pg * PAGE, (pg + 1) * PAGE - 1);
    siswa = siswa.concat(data || []);
    more = (data || []).length === PAGE;
    pg++;
  }
}
    const nisns = (siswa || []).map(s => s.nisn).filter(Boolean)

    // Gunakan batch query agar data lengkap
    const [pelanggaranData, penangananData] = await Promise.all([
      fetchInBatches('tb_pelanggaran_siswa', 'nisn, poin', nisns),
      fetchInBatches('tb_penanganan_siswa', 'nisn, tahap, status_akhir', nisns),
    ])

    const pelanggaranTotals = {}
    pelanggaranData.forEach(p => {
      const nisn = (p.nisn || '').trim()
      if (!pelanggaranTotals[nisn]) pelanggaranTotals[nisn] = 0
      pelanggaranTotals[nisn] += (p.poin || 0)
    })

    const penangananMap = {}
    penangananData.forEach(p => {
      penangananMap[(p.nisn || '').trim()] = p
    })

    let bk = 0, sp1 = 0, sp2 = 0, sp3 = 0, pindah = 0, keluar = 0

    ;(siswa || []).forEach(s => {
      const nisn = (s.nisn || '').trim()
      const p = penangananMap[nisn]
      const totalPoin = pelanggaranTotals[nisn] || 0

      // Trim nilai dari database
      const dbStatusAkhir = (p?.status_akhir || '').trim()
      const dbTahap = (p?.tahap || '').trim()

      if (dbStatusAkhir === 'Pindah') { pindah++; return }
      if (dbStatusAkhir === 'Keluar') { keluar++; return }

      if (totalPoin > 0 || p) {
        let tahap = 'Dalam Pembinaan'
        if (dbStatusAkhir && dbStatusAkhir !== 'Aktif') tahap = dbTahap || dbStatusAkhir
        else if (dbTahap) tahap = dbTahap
        else {
          if (totalPoin >= 150) tahap = 'SP3'
          else if (totalPoin >= 126) tahap = 'SP2'
          else if (totalPoin >= 100) tahap = 'SP1'
        }
        if (tahap === 'SP3') sp3++
        else if (tahap === 'SP2') sp2++
        else if (tahap === 'SP1') sp1++
        else bk++
      }
    })

    return { bk, sp1, sp2, sp3, pindah, keluar }
  } catch (err) { return { bk: 0, sp1: 0, sp2: 0, sp3: 0, pindah: 0, keluar: 0 } }
}

export async function savePenangananAction(payload) {
  try {
    const today = new Date().toLocaleDateString('sv-SE')
    const parseDate = (val) => (!val || val.trim() === '') ? null : val

    const { data: penanganan, error: upsertError } = await supabaseAdmin
      .from('tb_penanganan_siswa')
      .upsert({
        siswa_id: payload.siswa_id, nisn: payload.nisn, total_poin: payload.total_poin,
        tahap: (payload.tahap || '').trim(),
        layanan_bk: (payload.layanan_bk || '').trim(),
        sp1: payload.sp1 || false, tgl_sp1: parseDate(payload.tgl_sp1),
        sp2: payload.sp2 || false, tgl_sp2: parseDate(payload.tgl_sp2),
        sp3: payload.sp3 || false, tgl_sp3: parseDate(payload.tgl_sp3),
        catatan_bk: payload.catatan_bk || null,
        alasan_pindah_keluar: payload.alasan_pindah_keluar || null,
        penggalian_masalah: payload.penggalian_masalah || null,
        tindakan_korektip: payload.tindakan_korektip || null,
        hasil_diharapkan: payload.hasil_diharapkan || null,
        status_akhir: (payload.status_akhir || 'Aktif').trim(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'siswa_id' })
      .select().single()

    if (upsertError) return { error: upsertError.message }

    // Riwayat: sinkronkan Catatan Permasalahan + Alasan Pindah/Keluar
    const noteParts = []
    if (payload.catatan_bk) noteParts.push(`Catatan: ${payload.catatan_bk}`)
    if (payload.alasan_pindah_keluar) noteParts.push(`Alasan PK: ${payload.alasan_pindah_keluar}`)

    await supabaseAdmin.from('tb_penanganan_history').insert([{
      penanganan_id: penanganan.id, updated_by: payload.user_id,
      action: `Update penanganan ke tahap ${(payload.tahap || '').trim()} (Status: ${(payload.status_akhir || 'Aktif').trim()})`,
      note: noteParts.join(' | ') || '-'
    }])

    const statusAkhir = (payload.status_akhir || 'Aktif').trim()

    if (statusAkhir === 'Pindah' || statusAkhir === 'Keluar') {
      await supabaseAdmin.from('siswa').update({ status: statusAkhir }).eq('id', payload.siswa_id)

      const { data: existingPK } = await supabaseAdmin.from('tb_pindah_keluar').select('id').eq('siswa_id', payload.siswa_id).maybeSingle()

      if (!existingPK) {
        const tanggalKeputusan = parseDate(payload.tanggal_keputusan) || today
        await supabaseAdmin.from('tb_pindah_keluar').insert([{
          siswa_id: payload.siswa_id, nisn: payload.nisn, nama: payload.nama,
          kelas: payload.kelas, jurusan: payload.jurusan, jenis_kelamin: payload.jenis_kelamin,
          status: statusAkhir, tanggal_keputusan: tanggalKeputusan,
          alasan: payload.alasan_pindah_keluar || '-',
          ditetapkan_oleh: payload.user_id
        }])
      }
    }

    // Status Aktif → kembalikan status siswa + HAPUS record dari tb_pindah_keluar
    if (statusAkhir === 'Aktif') {
      await supabaseAdmin.from('siswa').update({ status: 'Aktif' }).eq('id', payload.siswa_id)
      await supabaseAdmin.from('tb_pindah_keluar').delete().eq('siswa_id', payload.siswa_id)
    }

    invalidateCacheByPrefix('penanganan_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

export async function getSiswaPenangananDetail(siswaId) {
  try {
    const { data: siswa } = await supabaseAdmin.from('siswa').select('*').eq('id', siswaId).single()
    if (!siswa) return { error: 'Siswa tidak ditemukan' }

    const nisn = (siswa.nisn || '').trim()

    const [pelanggaranRes, rewardRes, penangananRes, calendarRes] = await Promise.all([
      supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('tb_penanganan_siswa').select('*').eq('siswa_id', siswaId).maybeSingle(),
      supabaseAdmin.from('academic_calendar').select('*').eq('is_active', true).maybeSingle(),
    ])

    let semesterAttendance = []
    let semesterInfo = null
    if (calendarRes.data?.start_date && calendarRes.data?.end_date) {
      semesterInfo = calendarRes.data
      const { data: attData } = await supabaseAdmin
        .from('absensi')
        .select('tanggal, status')
        .eq('siswa_id', siswaId)
        .gte('tanggal', calendarRes.data.start_date)
        .lte('tanggal', calendarRes.data.end_date)
      semesterAttendance = attData || []
    }

    let history = []
    if (penangananRes.data?.id) {
      const { data: historyData } = await supabaseAdmin.from('tb_penanganan_history').select('*').eq('penanganan_id', penangananRes.data.id).order('created_at', { ascending: false })
      history = historyData || []
    }

    const totalPelanggaran = (pelanggaranRes.data || []).reduce((sum, p) => sum + (p.poin || 0), 0)

    return {
      siswa: { ...siswa, total_pelanggaran: totalPelanggaran },
      pelanggaran: pelanggaranRes.data || [],
      reward: rewardRes.data || [],
      semesterAttendance,
      semesterInfo,
      penanganan: penangananRes.data || {},
      history,
    }
  } catch (err) { return { error: err.message } }
}

export async function getPindahKeluarData(filters = {}) {
  try {
    let query = supabaseAdmin.from('tb_pindah_keluar').select('*, tb_pindah_keluar_dokumen(*)').order('created_at', { ascending: false })
    if (filters?.status && filters.status !== 'Semua') query = query.eq('status', filters.status)
    if (filters?.kelas) query = query.eq('kelas', filters.kelas)
    if (filters?.jurusan) query = query.eq('jurusan', filters.jurusan)
    if (filters?.search) {
      const safeSearch = filters.search.replace(/[%_]/g, '\\$&')
      query = query.or(`nama.ilike.%${safeSearch}%,nisn.ilike.%${safeSearch}%`)
    }
    const { data, error } = await query
    if (error) return { data: [], error: error.message }
    return { data }
  } catch (err) { return { data: [], error: err.message } }
}

export async function getPindahKeluarStats() {
  try {
    const { data } = await supabaseAdmin.from('tb_pindah_keluar').select('status, created_at')
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    let pindah = 0, keluar = 0, tahunIni = 0, semesterIni = 0

    ;(data || []).forEach(d => {
      if (d.status === 'Pindah') pindah++
      if (d.status === 'Keluar') keluar++
      const date = new Date(d.created_at)
      if (date.getFullYear() === currentYear) tahunIni++
      if (date.getFullYear() === currentYear) {
        if ((currentMonth >= 6 && date.getMonth() >= 6) || (currentMonth < 6 && date.getMonth() < 6)) semesterIni++
      }
    })

    return { pindah, keluar, tahunIni, semesterIni }
  } catch (err) { return { pindah: 0, keluar: 0, tahunIni: 0, semesterIni: 0 } }
}

export async function autoUpdateTahapByPelanggaran(payload) {
  try {
    const { data: penanganan, error: upsertError } = await supabaseAdmin
      .from('tb_penanganan_siswa')
      .upsert({
        siswa_id: payload.siswa_id, nisn: payload.nisn, total_poin: payload.total_poin,
        tahap: (payload.tahap || '').trim(),
        layanan_bk: (payload.layanan_bk || 'Belum Pendampingan').trim(),
        status_akhir: (payload.status_akhir || 'Aktif').trim(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'siswa_id' })
      .select().single()

    if (upsertError) return { error: upsertError.message }

    await supabaseAdmin.from('tb_penanganan_history').insert([{
      penanganan_id: penanganan.id, updated_by: payload.user_id,
      action: `Auto-update tahap ke ${(payload.tahap || '').trim()}`,
      note: payload.reason
    }])

    invalidateCacheByPrefix('penanganan_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

export async function resetAllPenangananAction() {
  try {
    await Promise.all([
      supabaseAdmin.from('tb_pindah_keluar_dokumen').delete().neq('id', 0),
      supabaseAdmin.from('tb_pindah_keluar').delete().neq('id', 0),
      supabaseAdmin.from('tb_penanganan_history').delete().neq('id', 0),
      supabaseAdmin.from('tb_penanganan_siswa').delete().neq('id', 0),
    ])
    await supabaseAdmin.from('siswa').update({ status: 'Aktif' }).neq('status', 'Aktif')
    invalidateCacheByPrefix('penanganan_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

// ── #5: Hapus SATU record Pindah/Keluar + pulihkan siswa ke Aktif ──
export async function deletePindahKeluarRecord(recordId, userId) {
  try {
    // Hanya Administrator (halaman ini memang area admin)
    if (!userId) {
  return { error: 'Sesi tidak terkirim dari halaman (userId kosong) — sumber userId di pindah-keluar/page.js belum benar' }
}
const { data: user } = await supabaseAdmin.from('users').select('role, status').eq('id', userId).maybeSingle()
if (!user) return { error: `User id "${userId}" tidak ditemukan di tabel users` }
if (user.status !== 'Aktif') return { error: `Akun Anda berstatus "${user.status}" — harus "Aktif"` }
if (user.role !== 'Administrator') return { error: `Role akun Anda: "${user.role}" — hanya Administrator yang bisa menghapus` }

    // Ambil record + dokumennya sekaligus (embed — tidak perlu tahu nama kolom FK)
    const { data: record } = await supabaseAdmin
      .from('tb_pindah_keluar')
      .select('*, tb_pindah_keluar_dokumen(id, file_url)')
      .eq('id', recordId)
      .maybeSingle()
    if (!record) return { error: 'Record tidak ditemukan' }

    // 1. Hapus file dokumen dari storage (best-effort — gagal tidak memblokir hapus data)
    for (const doc of (record.tb_pindah_keluar_dokumen || [])) {
      try {
        if (doc.file_url) {
          const m = String(doc.file_url).match(/\/object\/public\/([^/]+)\/(.+)$/)
          if (m) await supabaseAdmin.storage.from(m[1]).remove([decodeURIComponent(m[2])])
        }
      } catch (e) { /* file sudah tidak ada / URL bukan public — lanjut */ }
    }

    // 2. Hapus rows dokumen dulu (hindari FK constraint — pola resetAllPenangananAction)
    const docIds = (record.tb_pindah_keluar_dokumen || []).map(d => d.id)
    if (docIds.length > 0) {
      await supabaseAdmin.from('tb_pindah_keluar_dokumen').delete().in('id', docIds)
    }

    // 3. Hapus record utama
    const { error: delError } = await supabaseAdmin.from('tb_pindah_keluar').delete().eq('id', recordId)
    if (delError) return { error: delError.message }

    // 4. Pulihkan siswa + status_akhir penanganan, sekaligus catat riwayat/audit
    if (record.siswa_id) {
      await supabaseAdmin.from('siswa').update({ status: 'Aktif' }).eq('id', record.siswa_id)

      const { data: penanganan } = await supabaseAdmin
        .from('tb_penanganan_siswa')
        .update({ status_akhir: 'Aktif', updated_at: new Date().toISOString() })
        .eq('siswa_id', record.siswa_id)
        .select('id')
        .maybeSingle()

      if (penanganan) {
        await supabaseAdmin.from('tb_penanganan_history').insert([{
          penanganan_id: penanganan.id,
          updated_by: userId,
          action: `Hapus record ${record.status} — status siswa dikembalikan ke Aktif`,
          note: `Dihapus dari Rekap Pindah & Keluar. Tanggal keputusan lama: ${record.tanggal_keputusan || '-'}`
        }])
      }
    }

    invalidateCacheByPrefix('penanganan_')
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

// ── #5: Hapus SEMUA record Pindah/Keluar + pulihkan semua siswa terkait ──
// Beda dari resetAllPenangananAction: riwayat & data penanganan TETAP utuh.
export async function deleteAllPindahKeluarRecords(userId) {
  try {
    if (!userId) {
  return { error: 'Sesi tidak terkirim dari halaman (userId kosong) — sumber userId di pindah-keluar/page.js belum benar' }
}
const { data: user } = await supabaseAdmin.from('users').select('role, status').eq('id', userId).maybeSingle()
if (!user) return { error: `User id "${userId}" tidak ditemukan di tabel users` }
if (user.status !== 'Aktif') return { error: `Akun Anda berstatus "${user.status}" — harus "Aktif"` }
if (user.role !== 'Administrator') return { error: `Role akun Anda: "${user.role}" — hanya Administrator yang bisa menghapus` }

    // Ambil semua record + dokumen — bertahap (anti batas 1000 baris PostgREST)
    let all = []
    const BATCH = 1000
    let page = 0
    let hasMore = true
    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('tb_pindah_keluar')
        .select('id, siswa_id, status, tb_pindah_keluar_dokumen(id, file_url)')
        .order('id', { ascending: true })
        .range(page * BATCH, (page + 1) * BATCH - 1)
      if (error) break
      all = all.concat(data || [])
      hasMore = (data || []).length === BATCH
      page++
    }
    if (all.length === 0) return { success: true, deleted: 0 }

    // 1. Hapus semua file dokumen dari storage (best-effort, dikelompokkan per bucket)
    const fileRefs = []
    for (const rec of all) {
      for (const doc of (rec.tb_pindah_keluar_dokumen || [])) {
        if (doc.file_url) {
          const m = String(doc.file_url).match(/\/object\/public\/([^/]+)\/(.+)$/)
          if (m) fileRefs.push({ bucket: m[1], path: decodeURIComponent(m[2]) })
        }
      }
    }
    for (let i = 0; i < fileRefs.length; i += 100) {
      try {
        const byBucket = {}
        for (const f of fileRefs.slice(i, i + 100)) {
          (byBucket[f.bucket] = byBucket[f.bucket] || []).push(f.path)
        }
        for (const [bucket, paths] of Object.entries(byBucket)) {
          await supabaseAdmin.storage.from(bucket).remove(paths)
        }
      } catch (e) { /* lanjut — file storage tidak boleh memblokir pembersihan data */ }
    }

    // 2. Hapus rows dokumen (batch 100)
    const docIds = all.flatMap(r => (r.tb_pindah_keluar_dokumen || []).map(d => d.id))
    for (let i = 0; i < docIds.length; i += 100) {
      await supabaseAdmin.from('tb_pindah_keluar_dokumen').delete().in('id', docIds.slice(i, i + 100))
    }

    // 3. Hapus semua record utama
    await supabaseAdmin.from('tb_pindah_keluar').delete().neq('id', 0)

    // 4. Pulihkan semua siswa ke Aktif (batch 100)
    const siswaIds = [...new Set(all.map(r => r.siswa_id).filter(Boolean))]
    for (let i = 0; i < siswaIds.length; i += 100) {
      await supabaseAdmin.from('siswa').update({ status: 'Aktif' }).in('id', siswaIds.slice(i, i + 100))
    }

    // 5. Pulihkan status_akhir penanganan + catat riwayat audit (batch 100)
    let penangananIds = []
    for (let i = 0; i < siswaIds.length; i += 100) {
      const { data: updated } = await supabaseAdmin
        .from('tb_penanganan_siswa')
        .update({ status_akhir: 'Aktif', updated_at: new Date().toISOString() })
        .in('siswa_id', siswaIds.slice(i, i + 100))
        .select('id')
      penangananIds = penangananIds.concat((updated || []).map(p => p.id))
    }
    const historyRows = penangananIds.map(pid => ({
      penanganan_id: pid,
      updated_by: userId,
      action: 'Hapus Semua record Pindah/Keluar — status siswa dikembalikan ke Aktif',
      note: 'Pembersihan massal dari Rekap Pindah & Keluar'
    }))
    for (let i = 0; i < historyRows.length; i += 100) {
      await supabaseAdmin.from('tb_penanganan_history').insert(historyRows.slice(i, i + 100))
    }

    invalidateCacheByPrefix('penanganan_')
    return { success: true, deleted: all.length }
  } catch (err) {
    return { error: err.message }
  }
}