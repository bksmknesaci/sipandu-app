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
    let query = supabaseAdmin.from('siswa').select('*').in('status', ['Aktif', 'Pindah', 'Keluar'])

    if (filters?.userRole === 'Wali Kelas') {
      const parsed = parseKelasJurusan(filters.userKelas)
      const jurusan = (filters?.userJurusan || '').trim() || parsed.jurusan
      if (parsed.tingkat) query = query.eq('kelas', parsed.tingkat)
      if (jurusan) query = query.eq('jurusan', jurusan)
    } else {
      if (filters?.tingkat) query = query.eq('kelas', filters.tingkat)
      if (filters?.jurusan) query = query.eq('jurusan', filters.jurusan)
    }

    if (filters?.search) {
      const safeSearch = filters.search.replace(/[%_]/g, '\\$&')
      query = query.or(`nama.ilike.%${safeSearch}%,nisn.ilike.%${safeSearch}%`)
    }

    const { data: siswaList, error } = await query.order('nama', { ascending: true })
    if (error) return { data: [], error: error.message }
    if (!siswaList || siswaList.length === 0) return { data: [] }

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
    const { data: siswa } = await supabaseAdmin.from('siswa').select('nisn, status').in('status', ['Aktif', 'Pindah', 'Keluar'])
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