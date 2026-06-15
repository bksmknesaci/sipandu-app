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
// DELETE ALL USERS (FIX: support fallback identifier via username)
// ============================
export async function deleteAllUsersAction(excludeUserId, excludeUsername) {
  let query = supabaseAdmin
    .from('users')
    .delete();

  const safeAdminId = excludeUserId ? parseInt(excludeUserId, 10) : null;

  if (!isNaN(safeAdminId) && safeAdminId !== null) {
    query = query.neq('id', safeAdminId);
  }
  else if (excludeUsername && excludeUsername.trim() !== '') {
    query = query.neq('username', excludeUsername.trim());
  }
  else {
    console.error("ID dan Username Admin tidak valid, operasi hapus semua dibatalkan.");
    return { error: "Identitas admin tidak valid. Gagal menghapus data demi keamanan akun Anda." };
  }

  const { error } = await query;

  if (error) return { error: error.message }
  return { success: true }
}

// ============================
// IMPORT USERS EXCEL (Fix Case-Insensitive & Better Debug)
// ============================
export async function importUsersCSV(usersData) {
  if (!usersData || usersData.length === 0) {
    return { error: 'Tidak ada data untuk diimpor' };
  }

  const getVal = (obj, key) => {
    const found = Object.keys(obj).find(k => k.toLowerCase().trim() === key.toLowerCase());
    return found ? (obj[found] || '').trim() : '';
  };

  const { data: existingUsers, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('username');

  if (fetchError) {
    return { error: 'Gagal memeriksa data user yang sudah ada di database' };
  }

  const existingUsernames = new Set(existingUsers.map(u => u.username));
  const seenUsernames = new Set();
  const usersToInsert = [];

  for (const user of usersData) {
    const username = getVal(user, 'username');

    if (!username) continue;
    if (existingUsernames.has(username) || seenUsernames.has(username)) {
      continue;
    }

    seenUsernames.add(username);

    // ============================
    // FIX: Tambahkan kolom jurusan yang sebelumnya lupa dimasukkan
    // ============================
    usersToInsert.push({
      nama: getVal(user, 'nama'),
      username: username,
      email: getVal(user, 'email'),
      password: getVal(user, 'password') || 'user123',
      role: getVal(user, 'role') || 'Siswa',
      kelas: getVal(user, 'kelas'),
      jurusan: getVal(user, 'jurusan'), // DITAMBAHKAN
      whatsapp: getVal(user, 'whatsapp'),
      status: getVal(user, 'status') || 'Aktif',
    });
  }

  if (usersToInsert.length === 0) {
    const sampleKeys = usersData.length > 0 ? Object.keys(usersData[0]).join(', ') : 'Tidak ada kolom';
    return {
      error: `0 user diimpor. Pastikan kolom header Excel Anda bernama: nama, username, email, password, role, kelas, jurusan, whatsapp, status. (Header terbaca dari file Anda: "${sampleKeys}")`
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from('users')
    .insert(usersToInsert);

  if (insertError) {
    return { error: 'Gagal menyimpan data: ' + insertError.message };
  }

  const skippedCount = usersData.length - usersToInsert.length;

  return {
    success: true,
    count: usersToInsert.length,
    skipped: skippedCount,
    message: `${usersToInsert.length} user berhasil diimpor.${skippedCount > 0 ? ` ${skippedCount} data dilewati (username sudah ada/kosong).` : ''}`
  };
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