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

    const profilsEnrichis = await Promise.all(
      (data || []).map(async (p: { id: string; nom: string | null; role: string | null }) => {
        if (p.nom) return p
        try {
          const { data: { user } } = await admin.auth.admin.getUserById(p.id)
          const nomAuth = user?.user_metadata?.full_name
            || user?.user_metadata?.name
            || user?.email?.split('@')[0]
            || null
          if (nomAuth) {
            await admin.from('profiles').update({ nom: nomAuth }).eq('id', p.id)
          }
          return { ...p, nom: nomAuth }
        } catch {
          return p
        }
      })
    )

    return NextResponse.json({ profiles: profilsEnrichis })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
