import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET ?ids=uuid1,uuid2,uuid3 — retourne { id, nom, role } pour chaque ID
export async function GET(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('ids') ?? ''
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean)

  if (ids.length === 0) {
    return NextResponse.json({ profiles: [] })
  }

  try {
    const admin = makeAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id, nom, role')
      .in('id', ids)
      .limit(2000)

    if (error) throw error

    return NextResponse.json({ profiles: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
