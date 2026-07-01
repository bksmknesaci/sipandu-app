'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

// ── Helper: mapping key frontend → kolom database ──
function mapSiswaToDB(data) {
  const { nis, parent_whatsapp, ...rest } = data;
  return {
    ...rest,
    nisn: nis || null,
    parent_whatsapp: parent_whatsapp || null,
  };
}

export async function fetchSiswaAction() {
  const pageSize = 1000;
  let allData = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('siswa')
      .select('*')
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) return { error: error.message };

    allData = [...allData, ...(data || [])];
    hasMore = (data || []).length === pageSize;
    page++;
  }

  return { data: allData };
}

export async function saveSiswaAction(siswaData, editMode) {
  // Mapping key frontend → kolom database SEBELUM operasi DB
  const dbData = mapSiswaToDB(siswaData);

  const { id, ...dataWithoutId } = dbData;

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
  // Mapping key CSV → kolom database untuk setiap baris
  const cleanData = dataArray.map(({ id, nis, parent_whatsapp, ...rest }) => ({
    ...rest,
    nisn: nis || null,
    parent_whatsapp: parent_whatsapp || null,
  }));

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

// ── KOP Surat Settings ──
export async function getKopSuratSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('nama_sekolah, alamat, kop_logo_dinas, kop_logo_sekolah')
      .eq('id', 1)
      .single()
    if (error) return {}
    return data || {}
  } catch (e) {
    return {}
  }
}