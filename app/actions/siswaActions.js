'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function fetchSiswaAction() {
  const { data, error } = await supabaseAdmin
    .from('siswa')
    .select('*')
    .order('id', { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function saveSiswaAction(siswaData, editMode) {
  const { id, ...dataWithoutId } = siswaData;

  if (editMode) {
    if (!id) return { error: 'ID siswa tidak ditemukan untuk update' };
    
    const { error } = await supabaseAdmin
      .from('siswa')
      .update(dataWithoutId)
      .eq('id', id);
    
    if (error) {
      if (error.code === '23505') {
        return { error: 'NISN sudah terdaftar! Gunakan NISN lain.' };
      }
      return { error: error.message };
    }
  } else {
    const { error } = await supabaseAdmin
      .from('siswa')
      .insert([dataWithoutId]);
    
    if (error) {
      if (error.code === '23505') {
        return { error: 'NISN sudah terdaftar! Gunakan NISN lain.' };
      }
      return { error: error.message };
    }
  }

  return { success: true };
}

export async function deleteSiswaAction(id) {
  const { error } = await supabaseAdmin
    .from('siswa')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteAllSiswaAction() {
  const { error } = await supabaseAdmin
    .from('siswa')
    .delete()
    .gte('id', 1);
  if (error) return { error: error.message };
  return { success: true };
}

export async function importSiswaAction(dataArray) {
  const cleanData = dataArray.map(({ id, ...rest }) => rest);

  const { data, error } = await supabaseAdmin
    .from('siswa')
    .insert(cleanData)
    .select();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Gagal import: Ada NISN yang sudah terdaftar dalam file CSV.' };
    }
    return { error: error.message };
  }
  return { data };
}

export async function promoteStudentsAction(updates) {
  // updates = [{ id: 1, kelas: 'XI TKRO 1' }, { id: 2, kelas: 'XI RPL 1' }, ...]
  const promises = updates.map(u =>
    supabaseAdmin.from('siswa').update({ kelas: u.kelas }).eq('id', u.id)
  );
  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) return { error: `${errors.length} data gagal diperbarui` };
  return { success: true, count: updates.length };
}

export async function graduateAndDeleteAction(ids) {
  const { error } = await supabaseAdmin
    .from('siswa')
    .delete()
    .in('id', ids);
  if (error) return { error: error.message };
  return { success: true, count: ids.length };
}