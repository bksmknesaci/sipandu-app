'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================
// FETCH ALL USERS
// ============================
export async function fetchUsersAction() {
  const pageSize = 1000
  let allData = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) return { error: error.message }
    allData = [...allData, ...(data || [])]
    hasMore = (data || []).length === pageSize
    page++
  }

  return { data: allData }
}

// ============================
// GET USER STATS
// ============================
export async function getUserStats() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role, status')

  if (error) return { total: 0, administrator: 0, waliKelas: 0, sekretaris: 0, osis: 0 }

  return {
    total: data.length,
    administrator: data.filter(u => u.role === 'Administrator').length,
    waliKelas: data.filter(u => u.role === 'Wali Kelas').length,
    sekretaris: data.filter(u => u.role === 'Sekretaris Kelas').length,
    osis: data.filter(u => u.role === 'OSIS').length,
  }
}

// ============================
// GET AVAILABLE KELAS
// ============================
export async function getAvailableKelas() {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('kelas')
    .not('kelas', 'is', null)

  if (error) return { kelas: [] }
  const unique = [...new Set(data.map(s => s.kelas).filter(Boolean))].sort()
  return { kelas: unique }
}

// ============================
// UPLOAD USER PHOTO
// ============================
export async function uploadUserPhotoAction(file) {
  if (!file || !file.name) return { error: 'File tidak valid' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Ukuran foto maksimal 2MB' }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return { error: 'Format harus JPG, PNG, atau WebP' }

  const fileExt = file.name.split('.').pop()
  const fileName = `profiles/profile-${Date.now()}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabaseAdmin.storage
    .from('logos')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: 'Gagal upload foto: ' + uploadError.message }

  const { data: urlData } = supabaseAdmin.storage.from('logos').getPublicUrl(fileName)
  return { url: urlData.publicUrl }
}

// ============================
// SAVE USER (Add / Edit)
// ============================
export async function saveUserAction(userData, editMode) {
  const { id, ...dataWithoutId } = userData

  if (editMode) {
    if (!id) return { error: 'ID user tidak ditemukan' }
    // Jika password kosong saat edit, hapus dari update
    if (!dataWithoutId.password || dataWithoutId.password.trim() === '') {
      delete dataWithoutId.password
    }
    const { error } = await supabaseAdmin
      .from('users')
      .update(dataWithoutId)
      .eq('id', id)
    if (error) {
      if (error.code === '23505') return { error: 'Username atau Email sudah terdaftar!' }
      return { error: error.message }
    }
  } else {
    const { error } = await supabaseAdmin
      .from('users')
      .insert([dataWithoutId])
    if (error) {
      if (error.code === '23505') return { error: 'Username atau Email sudah terdaftar!' }
      return { error: error.message }
    }
  }

  return { success: true }
}

// ============================
// DELETE USER
// ============================
export async function deleteUserAction(id) {
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================
// DELETE ALL USERS
// ============================
export async function deleteAllUsersAction(excludeUserId) {
  // Konversi excludeUserId ke Integer karena tipe id di Supabase adalah bigint
  const safeAdminId = excludeUserId ? parseInt(excludeUserId, 10) : null;

  let query = supabaseAdmin
    .from('users')
    .delete();

  // Jika safeAdminId valid (berhasil di-parse jadi angka), kecualikan admin tersebut
  if (!isNaN(safeAdminId) && safeAdminId !== null) {
    query = query.neq('id', safeAdminId);
  } else {
    // Jika ID admin tidak valid (undefined/NaN/null), batalkan operasi demi keamanan
    // agar tidak ikut menghapus akun admin yang sedang login
    console.error("ID Admin tidak valid, operasi hapus semua dibatalkan.");
    return { error: "ID Admin tidak valid. Gagal menghapus data demi keamanan akun Anda." };
  }

  const { error } = await query;

  if (error) return { error: error.message }
  return { success: true }
}

// ============================
// IMPORT CSV
// ============================
export async function importUsersCSV(csvText) {
  const rows = csvText.split('\n').filter(r => r.trim() !== '')
  if (rows.length < 2) return { error: 'File CSV kosong atau tidak valid' }

  const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const users = []

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const user = {}
    headers.forEach((h, idx) => { user[h] = values[idx] || null })

    if (user.nama && user.username && user.email && user.password && user.role) {
      users.push({
        nama: user.nama,
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        kelas: user.kelas || '',
        jurusan: user.jurusan || '',
        whatsapp: user.whatsapp || '',
        status: user.status || 'Aktif',
        foto_url: user.foto_url || '',
      })
    }
  }

  if (users.length === 0) return { error: 'Tidak ada data valid untuk diimport' }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(users)
    .select()

  if (error) return { error: error.message }
  return { success: true, count: data.length }
}

// ============================
// LOGIN USER
// ============================
export async function loginUserAction(username, password) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .eq('status', 'Aktif')
    .single()

  if (error) return { error: 'Username atau password salah' }
  return { data }
}

// ============================
// UPDATE PROFILE DATA (dari Profil Saya modal)
// ============================
export async function updateProfileData(id, data) {
  if (!id) return { error: 'ID user tidak ditemukan' }
  
  const updateData = {}
  if (data.nama !== undefined) updateData.nama = data.nama
  if (data.email !== undefined) updateData.email = data.email
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp

  const { error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', parseInt(id))

  if (error) return { error: error.message }
  return { success: true }
}