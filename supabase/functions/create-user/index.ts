// Creates an admin or customer account. Only callable by admins.
// Needs the service role key, which is why this runs here and not in the browser.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

type Body = {
  email?: unknown
  password?: unknown
  role?: unknown
  full_name?: unknown
  company_name?: unknown
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Verify the caller and that they are an admin.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Du är inte inloggad.' }, 401)
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Du är inte inloggad.' }, 401)

  const { data: caller } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
  if (caller?.role !== 'admin') return json({ error: 'Endast administratörer kan skapa konton.' }, 403)

  // Validate input.
  const body = (await req.json().catch(() => ({}))) as Body
  const email = str(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const role = body.role === 'admin' ? 'admin' : body.role === 'customer' ? 'customer' : null
  const fullName = str(body.full_name)
  const companyName = str(body.company_name)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Ogiltig e-postadress.' }, 400)
  if (password.length < 8) return json({ error: 'Lösenordet måste vara minst 8 tecken.' }, 400)
  if (!role) return json({ error: 'Ogiltig roll.' }, 400)
  if (role === 'customer' && !companyName) return json({ error: 'Kundkonton behöver ett företagsnamn.' }, 400)

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName, company_name: companyName },
  })
  if (createError || !created.user) {
    const taken = createError?.message.toLowerCase().includes('already')
    return json({ error: taken ? 'E-postadressen används redan.' : 'Kunde inte skapa kontot.' }, taken ? 409 : 400)
  }

  // The auth trigger creates the profile. Set the fields explicitly as well so the role is always right.
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role, full_name: fullName, company_name: companyName || null })
    .eq('id', created.user.id)
  if (profileError) return json({ error: 'Kontot skapades men profilen kunde inte sparas.' }, 500)

  return json({ id: created.user.id, email, role }, 201)
})
