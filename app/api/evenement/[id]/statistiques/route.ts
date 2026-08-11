import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evenementId } = await params

  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const bearerToken = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(bearerToken)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = makeAdminClient()

  const { data: ev } = await admin
    .from('evenements')
    .select('id, user_id, organisation_id')
    .eq('id', evenementId)
    .maybeSingle()

  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  let autorise = ev.user_id === user.id

  if (!autorise && ev.organisation_id) {
    const { data: membre } = await admin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', ev.organisation_id)
      .eq('user_id', user.id)
      .maybeSingle()
    autorise = !!membre && ['owner', 'admin', 'editeur'].includes(membre.role)
  }

  if (!autorise) {
    const { data: coOrgUser } = await admin
      .from('evenement_co_organisateurs')
      .select('id')
      .eq('evenement_id', evenementId)
      .eq('user_id', user.id)
      .maybeSingle()
    autorise = !!coOrgUser
  }

  if (!autorise) {
    const { data: mesOrgs } = await admin
      .from('organisation_membres')
      .select('org_id')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])

    if (mesOrgs && mesOrgs.length > 0) {
      const { data: coOrgOrg } = await admin
        .from('evenement_co_organisateurs')
        .select('id')
        .eq('evenement_id', evenementId)
        .in('organisation_id', mesOrgs.map(o => o.org_id))
        .maybeSingle()
      autorise = !!coOrgOrg
    }
  }

  if (!autorise) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const [{ count: nbVues }, { data: partagesData }] = await Promise.all([
    admin.from('vues_evenements').select('id', { count: 'exact', head: true }).eq('evenement_id', evenementId),
    admin.from('partages_evenements').select('canal').eq('evenement_id', evenementId),
  ])

  const partagesParCanal: Record<string, number> = {}
  for (const p of partagesData ?? []) {
    partagesParCanal[p.canal] = (partagesParCanal[p.canal] ?? 0) + 1
  }

  return NextResponse.json({
    nb_vues: nbVues ?? 0,
    nb_partages_total: (partagesData ?? []).length,
    partages_par_canal: partagesParCanal,
  })
}
