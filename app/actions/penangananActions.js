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

    if (filters?.userRole === 'Wali Kelas' && filters?.userKelas) {
      const parsed = parseKelasJurusan(filters.userKelas)
      if (parsed.tingkat) query = query.eq('kelas', parsed.tingkat)
      if (parsed.jurusan) query = query.eq('jurusan', parsed.jurusan)
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

    // ── OPTIMASI: 2 query paralel (sebelumnya sequential) ──
    const [pelanggaranRes, penangananRes] = await Promise.all([
      supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, poin').in('nisn', nisns),
      supabaseAdmin.from('tb_penanganan_siswa').select('*').in('nisn', nisns),
    ])

    const pelanggaranTotals = {}
    ;(pelanggaranRes.data || []).forEach(p => {
      const nisn = (p.nisn || '').trim()
      if (!pelanggaranTotals[nisn]) pelanggaranTotals[nisn] = 0
      pelanggaranTotals[nisn] += (p.poin || 0)
    })

    const penangananMap = {}
    ;(penangananRes.data || []).forEach(p => {
      penangananMap[(p.nisn || '').trim()] = p
    })

    const result = siswaList.map(s => {
      const nisn = (s.nisn || '').trim()
      const totalPoin = pelanggaranTotals[nisn] || 0
      const penanganan = penangananMap[nisn] || null

      let tahap = 'Belum Pembinaan'
      const statusAkhir = penanganan?.status_akhir || s.status || 'Aktif'

      if (statusAkhir === 'Pindah' || statusAkhir === 'Keluar') {
        tahap = penanganan?.tahap || statusAkhir
      } else if (penanganan?.tahap) {
        tahap = penanganan.tahap
      } else if (totalPoin > 0) {
        if (totalPoin >= 150) tahap = 'SP3'
        else if (totalPoin >= 126) tahap = 'SP2'
        else if (totalPoin >= 100) tahap = 'SP1'
        else tahap = 'Pembinaan BK'
      }

      return {
        ...s,
        total_pelanggaran: totalPoin,
        penanganan: penanganan ? { ...penanganan, tahap, status_akhir: statusAkhir } : { tahap, status_akhir: statusAkhir }
      }
    })

    result.sort((a, b) => {
      const aStatus = a.penanganan?.status_akhir === 'Aktif' ? 0 : 1;
      const bStatus = b.penanganan?.status_akhir === 'Aktif' ? 0 : 1;
      return aStatus - bStatus;
    });

    let finalData = result;
    if (filters?.status && filters.status !== 'Semua') {
      if (filters.status === 'Pindah' || filters.status === 'Keluar') {
        finalData = finalData.filter(s => s.penanganan?.status_akhir === filters.status || s.status === filters.status)
      } else {
        finalData = finalData.filter(s => s.penanganan?.tahap === filters.status)
      }
    }

    return { data: finalData }
  } catch (err) { return { data: [], error: err.message } }
}

export async function getPenangananStats() {
  try {
    const { data: siswa } = await supabaseAdmin.from('siswa').select('nisn, status').in('status', ['Aktif', 'Pindah', 'Keluar'])
    const nisns = (siswa || []).map(s => s.nisn).filter(Boolean)

    // ── OPTIMASI: 2 query paralel (sebelumnya sequential) ──
    const [pelanggaranRes, penangananRes] = await Promise.all([
      supabaseAdmin.from('tb_pelanggaran_siswa').select('nisn, poin').in('nisn', nisns),
      supabaseAdmin.from('tb_penanganan_siswa').select('nisn, tahap, status_akhir').in('nisn', nisns),
    ])

    const pelanggaranTotals = {}
    ;(pelanggaranRes.data || []).forEach(p => {
      const nisn = (p.nisn || '').trim()
      if (!pelanggaranTotals[nisn]) pelanggaranTotals[nisn] = 0
      pelanggaranTotals[nisn] += (p.poin || 0)
    })

    const penangananMap = {}
    ;(penangananRes.data || []).forEach(p => {
      penangananMap[(p.nisn || '').trim()] = p
    })

    let bk = 0, sp1 = 0, sp2 = 0, sp3 = 0, pindah = 0, keluar = 0

    ;(siswa || []).forEach(s => {
      const nisn = (s.nisn || '').trim()
      const p = penangananMap[nisn]
      const totalPoin = pelanggaranTotals[nisn] || 0

      if (p?.status_akhir === 'Pindah') { pindah++; return }
      if (p?.status_akhir === 'Keluar') { keluar++; return }

      if (totalPoin > 0 || p) {
        let tahap = 'Pembinaan BK'
        if (p?.status_akhir && p.status_akhir !== 'Aktif') tahap = p.tahap || p.status_akhir
        else if (p?.tahap) tahap = p.tahap
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

export async function savePenangananAction(payload, files = []) {
  try {
    const today = new Date().toLocaleDateString('sv-SE')
    const parseDate = (val) => (!val || val.trim() === '') ? null : val

    const { data: penanganan, error: upsertError } = await supabaseAdmin
      .from('tb_penanganan_siswa')
      .upsert({
        siswa_id: payload.siswa_id, nisn: payload.nisn, total_poin: payload.total_poin,
        tahap: payload.tahap, layanan_bk: payload.layanan_bk,
        sp1: payload.sp1 || false, tgl_sp1: parseDate(payload.tgl_sp1),
        sp2: payload.sp2 || false, tgl_sp2: parseDate(payload.tgl_sp2),
        sp3: payload.sp3 || false, tgl_sp3: parseDate(payload.tgl_sp3),
        catatan_bk: payload.catatan_bk || null, status_akhir: payload.status_akhir || 'Aktif',
        updated_at: new Date().toISOString()
      }, { onConflict: 'siswa_id' })
      .select().single()

    if (upsertError) return { error: upsertError.message }

    await supabaseAdmin.from('tb_penanganan_history').insert([{
      penanganan_id: penanganan.id, updated_by: payload.user_id,
      action: `Update penanganan ke tahap ${payload.tahap} (Status: ${payload.status_akhir})`,
      note: payload.catatan_bk || '-'
    }])

    if (payload.status_akhir === 'Pindah' || payload.status_akhir === 'Keluar') {
      await supabaseAdmin.from('siswa').update({ status: payload.status_akhir }).eq('id', payload.siswa_id)

      const { data: existingPK } = await supabaseAdmin.from('tb_pindah_keluar').select('id').eq('siswa_id', payload.siswa_id).maybeSingle()

      if (!existingPK) {
        const tanggalKeputusan = parseDate(payload.tanggal_keputusan) || today
        const { data: pindahKeluarData } = await supabaseAdmin.from('tb_pindah_keluar').insert([{
          siswa_id: payload.siswa_id, nisn: payload.nisn, nama: payload.nama,
          kelas: payload.kelas, jurusan: payload.jurusan, jenis_kelamin: payload.jenis_kelamin,
          status: payload.status_akhir, tanggal_keputusan: tanggalKeputusan,
          alasan: payload.catatan_bk, ditetapkan_oleh: payload.user_id
        }]).select().single()

        if (pindahKeluarData && files.length > 0) {
          for (const file of files) {
            const fileExt = file.name.split('.').pop()
            const fileName = `dokumen-${payload.nisn}-${Date.now()}.${fileExt}`
            const buffer = Buffer.from(await file.arrayBuffer())
            const { error: uploadError } = await supabaseAdmin.storage.from('dokumen-penanganan').upload(fileName, buffer, { contentType: file.type, upsert: true })
            if (!uploadError) {
              const { data: urlData } = supabaseAdmin.storage.from('dokumen-penanganan').getPublicUrl(fileName)
              await supabaseAdmin.from('tb_pindah_keluar_dokumen').insert([{ pindah_keluar_id: pindahKeluarData.id, file_url: urlData.publicUrl, file_name: file.name }])
            }
          }
        }
      }
    }

    invalidateCacheByPrefix('penanganan_')
    return { success: true }
  } catch (err) { return { error: err.message } }
}

export async function getSiswaPenangananDetail(siswaId) {
  try {
    // Step 1: Siswa (harus duluan untuk dapat nisn)
    const { data: siswa } = await supabaseAdmin.from('siswa').select('*').eq('id', siswaId).single()
    if (!siswa) return { error: 'Siswa tidak ditemukan' }

    const nisn = (siswa.nisn || '').trim()
    const today = new Date().toLocaleDateString('sv-SE')

    // ── OPTIMASI: 5 query paralel (sebelumnya 5x sequential) ──
    const [pelanggaranRes, rewardRes, absensiRes, penangananRes] = await Promise.all([
      supabaseAdmin.from('tb_pelanggaran_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('tb_reward_siswa').select('*').eq('nisn', nisn).order('tanggal', { ascending: false }),
      supabaseAdmin.from('absensi').select('status').eq('siswa_id', siswaId).eq('tanggal', today),
      supabaseAdmin.from('tb_penanganan_siswa').select('*').eq('siswa_id', siswaId).maybeSingle(),
    ])

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
      absensi: absensiRes.data || [],
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

export async function resetAllPenangananAction() {
  try {
    // ── OPTIMASI: 4 delete paralel (sebelumnya sequential) ──
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