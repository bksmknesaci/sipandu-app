'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { getCached, TTL, invalidateCacheByPrefix } from '@/lib/cacheHelpers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── OPTIMASI: Cache 1 menit — stats dipanggil setiap buka Pos Berita ──
export async function getNewsStats() {
  return getCached('news_stats', async () => {
    const { data: news } = await supabaseAdmin.from('news_posts').select('category, status, views, published_at')
    if (!news) return { total: 0, sekolah: 0, prestasi: 0, views: 0 }
    
    const now = new Date()
    const viewsThisMonth = news.filter(n => new Date(n.published_at).getMonth() === now.getMonth() && new Date(n.published_at).getFullYear() === now.getFullYear()).reduce((sum, n) => sum + n.views, 0)
    
    return {
      total: news.length,
      sekolah: news.filter(n => n.category === 'Berita Sekolah').length,
      prestasi: news.filter(n => n.category === 'Siswa Berprestasi').length,
      views: viewsThisMonth
    }
  }, TTL.MINUTE)
}

// ── OPTIMASI: Cache 1 menit — dipanggil di halaman admin Pos Berita ──
export async function getAllNews() {
  return getCached('news_all', async () => {
    const { data, error } = await supabaseAdmin
      .from('news_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error("Error fetching all news:", error.message)
      return []
    }
    return data
  }, TTL.MINUTE)
}

// ── OPTIMASI: Cache 1 menit per kombinasi limit+category — dipanggil di BERANDA semua role ──
export async function getPublishedNews(limit = 5, category = null) {
  const cacheKey = `news_published_${limit}_${category || 'all'}`
  return getCached(cacheKey, async () => {
    let query = supabaseAdmin
      .from('news_posts')
      .select('*')
      .eq('status', 'Publish')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
    if (category) query = query.eq('category', category)
    if (limit) query = query.limit(limit)
    
    const { data, error } = await query
    if (error) return []
    return data
  }, TTL.MINUTE)
}

// ── OPTIMASI: Cache 1 menit per slug ──
export async function getNewsBySlug(slug) {
  const cacheKey = `news_slug_${slug}`
  return getCached(cacheKey, async () => {
    const { data, error } = await supabaseAdmin
      .from('news_posts')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) return null
    return data
  }, TTL.MINUTE)
}

export async function incrementNewsViews(id) {
  const { data: news } = await supabaseAdmin.from('news_posts').select('views').eq('id', id).single()
  if (news) {
    await supabaseAdmin.from('news_posts').update({ views: news.views + 1 }).eq('id', id)
  }
}

export async function saveNews(formData) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser()
  const adminId = user?.id || 1

  const id = formData.get('id')
  const title = formData.get('title')
  const slug = formData.get('slug') || generateSlug(title)
  const excerpt = formData.get('excerpt')
  const content = formData.get('content')
  const category = formData.get('category')
  const status = formData.get('status')
  const featured = formData.get('featured') === 'true'
  const cover_url = formData.get('cover_url') || null
  const published_at = status === 'Publish' ? new Date().toISOString() : null

  if (id) {
    const { error } = await supabaseAdmin.from('news_posts').update({ title, slug, excerpt, content, category, status, featured, cover_url, updated_at: new Date() }).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabaseAdmin.from('news_posts').insert({ title, slug, excerpt, content, category, status, featured, cover_url, author_id: adminId, published_at })
    if (error) return { error: error.message }
  }

  // ── OPTIMASI: Invalidate semua cache berita setelah simpan ──
  invalidateCacheByPrefix('news_')
  return { success: true }
}

export async function deleteNews(id) {
  const { error } = await supabaseAdmin.from('news_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  invalidateCacheByPrefix('news_')
  return { success: true }
}

export async function uploadNewsCover(file) {
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, '')}`
  const { data, error } = await supabaseAdmin.storage.from('news-media').upload(fileName, file)
  if (error) return { error: error.message }
  
  const { data: urlData } = supabaseAdmin.storage.from('news-media').getPublicUrl(fileName)
  return { url: urlData.publicUrl }
}

export async function resetAllNews() {
  const { error } = await supabaseAdmin.from('news_posts').delete().neq('id', 0)
  if (error) return { error: error.message }
  invalidateCacheByPrefix('news_')
  return { success: true }
}