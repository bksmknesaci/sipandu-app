import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/supabase-admin'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()

    // Ambil token dari cookie Supabase
    const sbToken = cookieStore.get('sb-access-token')?.value
    const sbRefresh = cookieStore.get('sb-refresh-token')?.value

    if (!sbToken) return null

    // Verifikasi token dengan admin
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(sbToken)

    if (error || !authUser) return null

    // Cari data user di tabel users
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

    // Auto-create jika belum ada di tabel users
    if (!userData) {
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({
          nama: authUser.user_metadata?.nama || authUser.email.split('@')[0],
          username: authUser.email.split('@')[0],
          email: authUser.email,
          role: 'administrator',
          status: 'aktif',
        })
        .select()
        .single()

      return newUser
    }

    return userData
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}