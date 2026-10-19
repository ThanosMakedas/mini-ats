// Sets a new password for any account. Only callable by admins.
// The app sends no e-mails, so this is how a customer who forgot their password gets back in.
import { corsHeaders, json, readJsonObject } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const body = await readJsonObject(req)
  const userId = typeof body.user_id === 'string' ? body.user_id : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!userId) return json({ error: 'Konto saknas.' }, 400)
  if (password.length < 8) return json({ error: 'Lösenordet måste vara minst 8 tecken.' }, 400)

  const { error } = await auth.admin.auth.admin.updateUserById(userId, { password })
  if (error) return json({ error: 'Kunde inte byta lösenord.' }, 400)

  // Log the user out everywhere, so whoever had the old password loses access too.
  const { error: revokeError } = await auth.admin.rpc('revoke_user_sessions', { target_user: userId })
  if (revokeError) return json({ error: 'Lösenordet byttes men befintliga inloggningar kunde inte avslutas.' }, 500)

  return json({ ok: true })
})
