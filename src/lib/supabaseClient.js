import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Perhatian: URL atau Kunci Anonim Supabase belum diatur di file .env")
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
