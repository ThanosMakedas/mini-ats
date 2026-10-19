import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY saknas. Kopiera .env.example till .env.local.')
}

export const supabase = createClient<Database>(url, key)
