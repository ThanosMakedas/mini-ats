import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { json } from './cors.ts'

// Returns a service role client if the request comes from a logged in admin,
// otherwise a ready error response to send back.
export async function requireAdmin(req: Request): Promise<{ admin: SupabaseClient } | { error: Response }> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { error: json({ error: 'Du är inte inloggad.' }, 401) }
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return { error: json({ error: 'Du är inte inloggad.' }, 401) }

  const { data: caller } = await admin.from('profiles').select('role').eq('id', data.user.id).single()
  if (caller?.role !== 'admin') return { error: json({ error: 'Endast administratörer har behörighet.' }, 403) }

  return { admin }
}
