'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function getMajorLogosAction() {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('major_logos')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching major logos:', error);
    return {};
  }

  return data?.major_logos || {};
}

export async function uploadMajorLogoAction(formData) {
  const file = formData.get('file');
  const code = formData.get('code');

  if (!file || !code) {
    return { error: 'File dan kode jurusan wajib diisi.' };
  }

  // Validasi ukuran (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Ukuran file maksimal 2MB.' };
  }

  // Validasi tipe
  if (!file.type.startsWith('image/')) {
    return { error: 'File harus berupa gambar.' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `major-logos/${code}-${Date.now()}.${fileExt}`;

  // Upload ke Supabase Storage menggunakan admin client (bypass RLS)
  const { data, error } = await supabaseAdmin.storage
    .from('logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return { error: 'Gagal upload ke storage: ' + error.message };
  }

  // Dapatkan public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('logos')
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

export async function saveMajorLogosAction(majorLogos) {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .update({ major_logos: majorLogos })
    .eq('id', 1)
    .select();

  if (error) {
    console.error('Save error:', error);
    return { error: 'Gagal menyimpan logo jurusan.' };
  }

  revalidatePath('/');
  return { success: true };
}