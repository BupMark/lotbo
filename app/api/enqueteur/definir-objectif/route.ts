import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = makeAdminClient()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { objectif_fiches } = await request.json() as { objectif_fiches: number }
    if (!objectif_fiches || objectif_fiches < 1 || objectif_fiches > 10000) {
      return NextResponse.json({ error: 'Objectif invalide (doit être entre 1 et 10000)' }, { status: 400 })
    }

    const { data: enq, error: fetchErr } = await admin
      .from('enqueteurs')
      .select('id, statut')
      .eq('user_id', user.id)
      .eq('statut', 'actif')
      .maybeSingle()

    if (fetchErr || !enq) {
      return NextResponse.json({ error: 'Aucune fiche enquêteur active trouvée pour ce compte' }, { status: 404 })
    }

    const { error: updateErr } = await admin
      .from('enqueteurs')
      .update({ objectif_fiches })
      .eq('id', enq.id)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, objectif_fiches })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
