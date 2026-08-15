import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organisationId } = await params

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 })
  }

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: userData, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 })
  }
  const userId = userData.user.id

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: org } = await admin
    .from('organisations')
    .select('id, owner_id')
    .eq('id', organisationId)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'ORGANISATION_INTROUVABLE' }, { status: 404 })
  if (org.owner_id !== userId) {
    return NextResponse.json({ error: 'SEUL_OWNER_PEUT_SUPPRIMER' }, { status: 403 })
  }

  const body = await request.json() as { option?: 'transferer' | 'supprimer_tout' }
  const { option } = body
  if (!option || !['transferer', 'supprimer_tout'].includes(option)) {
    return NextResponse.json({ error: 'OPTION_INVALIDE' }, { status: 400 })
  }

  if (option === 'transferer') {
    const { error: transfertError } = await admin
      .from('evenements')
      .update({ organisation_id: null, user_id: userId })
      .eq('organisation_id', organisationId)
    if (transfertError) {
      return NextResponse.json({ error: 'ERREUR_TRANSFERT' }, { status: 500 })
    }
  }
  // Si 'supprimer_tout' : les événements ne sont PAS supprimés immédiatement.
  // Le CRON de suppression effective (après 30 jours) les supprimera en même temps
  // que l'organisation, cohérent avec le délai de grâce global.

  const { error: updateError } = await admin
    .from('organisations')
    .update({ suppression_demandee_at: new Date().toISOString(), suppression_option: option })
    .eq('id', organisationId)

  if (updateError) {
    return NextResponse.json({ error: 'ERREUR_SUPPRESSION_DONNEES' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    mode: 'soft_delete',
    message: "La demande de suppression a été enregistrée. L'organisation sera définitivement supprimée dans 30 jours.",
  })
}
