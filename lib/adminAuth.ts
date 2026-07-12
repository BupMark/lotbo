import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function makeAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type VerifierAdminResult = { ok: true; userId: string } | { ok: false }

// SEC-ADMIN-ROUTES-1 — vérifie le JWT de session Supabase (Authorization: Bearer)
// et confirme le rôle admin côté serveur, plutôt que de faire confiance à un secret
// exposé au navigateur (NEXT_PUBLIC_INTERNAL_API_SECRET, utilisé ailleurs).
export async function verifierAdmin(request: Request): Promise<VerifierAdminResult> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { ok: false }

  const admin = makeAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return { ok: false }

  const { data: prof } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (prof?.role !== 'admin') return { ok: false }

  return { ok: true, userId: user.id }
}

export async function verifierAdminOuEnqueteur(request: Request): Promise<VerifierAdminResult> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { ok: false }

  const admin = makeAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return { ok: false }

  const { data: prof } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (prof?.role !== 'admin' && prof?.role !== 'admin_enqueteur') return { ok: false }

  return { ok: true, userId: user.id }
}
