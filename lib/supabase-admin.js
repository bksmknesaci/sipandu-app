// lib/supabase-admin.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * Singleton Supabase Admin Client
 * 1 instance per serverless warm instance — semua action memakai koneksi yang sama.
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'sipandu-admin'
    }
  }
})

// NAMED export — sesuai pola import di semua file actions
export { supabaseAdmin }