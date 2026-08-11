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
  if (!autorise) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const [{ data: invitations }, { data: coOrgs }] = await Promise.all([
    admin
      .from('invitations_co_organisateurs_en_attente')
      .select('id, type_cible, email, organisation_cible_id, statut, expire_le, created_at')
      .eq('evenement_id', evenementId)
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false }),
    admin
      .from('evenement_co_organisateurs')
      .select('id, type_cible, user_id, organisation_id, accepted_at')
      .eq('evenement_id', evenementId),
  ])

  const userIds = (coOrgs ?? []).filter(c => c.user_id).map(c => c.user_id as string)
  const orgIds = [
    ...(coOrgs ?? []).filter(c => c.organisation_id).map(c => c.organisation_id as string),
    ...(invitations ?? []).filter(i => i.organisation_cible_id).map(i => i.organisation_cible_id as string),
  ]

  const [{ data: profilsData }, { data: orgsData }] = await Promise.all([
    userIds.length > 0 ? admin.from('profiles').select('id, nom').in('id', userIds) : Promise.resolve({ data: [] }),
    orgIds.length > 0 ? admin.from('organisations').select('id, nom').in('id', orgIds) : Promise.resolve({ data: [] }),
  ])

  const nomProfil = (id: string) => (profilsData ?? []).find((p: { id: string; nom: string | null }) => p.id === id)?.nom ?? 'Utilisateur'
  const nomOrg = (id: string) => (orgsData ?? []).find((o: { id: string; nom: string }) => o.id === id)?.nom ?? 'Organisation'

  return NextResponse.json({
    invitations: (invitations ?? []).map(i => ({
      id: i.id,
      type_cible: i.type_cible,
      cible: i.type_cible === 'utilisateur' ? (i.email || 'Lien générique') : nomOrg(i.organisation_cible_id as string),
      expire_le: i.expire_le,
    })),
    coOrganisateurs: (coOrgs ?? []).map(c => ({
      id: c.id,
      type_cible: c.type_cible,
      nom: c.type_cible === 'utilisateur' ? nomProfil(c.user_id as string) : nomOrg(c.organisation_id as string),
      accepted_at: c.accepted_at,
    })),
  })
}

export async function DELETE(
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

  const body = await request.json() as { cible_id?: string; type?: 'invitation' | 'co_organisateur' }
  const { cible_id, type } = body
  if (!cible_id || !type) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

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
  if (!autorise) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const table = type === 'invitation' ? 'invitations_co_organisateurs_en_attente' : 'evenement_co_organisateurs'
  const { error } = await admin.from(table).delete().eq('id', cible_id).eq('evenement_id', evenementId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
