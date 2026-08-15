import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type Periode = 'jour' | 'semaine' | 'mois' | 'tous'

function calculerDebutPeriode(periode: Periode): string | null {
  const now = new Date()
  if (periode === 'jour') {
    const debut = new Date(now); debut.setHours(0, 0, 0, 0)
    return debut.toISOString()
  }
  if (periode === 'semaine') {
    const debut = new Date(now); debut.setDate(now.getDate() - now.getDay()); debut.setHours(0, 0, 0, 0)
    return debut.toISOString()
  }
  if (periode === 'mois') {
    const debut = new Date(now.getFullYear(), now.getMonth(), 1)
    return debut.toISOString()
  }
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organisationId } = await params
  const url = new URL(request.url)
  const periode = (url.searchParams.get('periode') as Periode) ?? 'tous'
  const debutPeriode = calculerDebutPeriode(periode)

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

  const { data: org } = await admin
    .from('organisations')
    .select('id, owner_id')
    .eq('id', organisationId)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  let autorise = org.owner_id === user.id
  if (!autorise) {
    const { data: membre } = await admin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', organisationId)
      .eq('user_id', user.id)
      .maybeSingle()
    autorise = !!membre && ['owner', 'admin'].includes(membre.role)
  }
  if (!autorise) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const [{ count: nbVuesOrg }, { count: nbFollowers }] = await Promise.all([
    (debutPeriode
      ? admin.from('vues_organisations').select('id', { count: 'exact', head: true }).eq('organisation_id', organisationId).gte('created_at', debutPeriode)
      : admin.from('vues_organisations').select('id', { count: 'exact', head: true }).eq('organisation_id', organisationId)),
    admin.from('organisation_membres').select('user_id', { count: 'exact', head: true }).eq('org_id', organisationId).neq('role', 'owner'),
  ])

  const { data: evenements } = await admin
    .from('evenements')
    .select('id, titre')
    .eq('organisation_id', organisationId)
    .eq('statut', 'approuve')

  const evenementIds = (evenements ?? []).map(e => e.id)

  if (evenementIds.length === 0) {
    return NextResponse.json({
      periode,
      nb_vues_total: 0,
      nb_partages_total: 0,
      nb_favoris_total: 0,
      nb_participations_total: 0,
      nb_commentaires_total: 0,
      nb_vues_organisation: nbVuesOrg ?? 0,
      nb_followers: nbFollowers ?? 0,
      partages_par_canal: {},
      evenements: [],
    })
  }

  let requeteVues = admin.from('vues_evenements').select('evenement_id').in('evenement_id', evenementIds)
  let requetePartages = admin.from('partages_evenements').select('evenement_id, canal').in('evenement_id', evenementIds)
  let requeteFavoris = admin.from('favoris').select('evenement_id').in('evenement_id', evenementIds)
  let requeteParticipations = admin.from('participations').select('evenement_id').in('evenement_id', evenementIds)
  let requeteCommentaires = admin.from('commentaires').select('evenement_id').in('evenement_id', evenementIds)

  if (debutPeriode) {
    requeteVues = requeteVues.gte('created_at', debutPeriode)
    requetePartages = requetePartages.gte('created_at', debutPeriode)
    requeteFavoris = requeteFavoris.gte('created_at', debutPeriode)
    requeteParticipations = requeteParticipations.gte('created_at', debutPeriode)
    requeteCommentaires = requeteCommentaires.gte('created_at', debutPeriode)
  }

  const [{ data: vuesData }, { data: partagesData }, { data: favorisData }, { data: participationsData }, { data: commentairesData }] = await Promise.all([
    requeteVues, requetePartages, requeteFavoris, requeteParticipations, requeteCommentaires,
  ])

  const vuesParEvenement: Record<string, number> = {}
  for (const v of vuesData ?? []) {
    vuesParEvenement[v.evenement_id] = (vuesParEvenement[v.evenement_id] ?? 0) + 1
  }

  const partagesParEvenement: Record<string, number> = {}
  const partagesParCanal: Record<string, number> = {}
  for (const p of partagesData ?? []) {
    partagesParEvenement[p.evenement_id] = (partagesParEvenement[p.evenement_id] ?? 0) + 1
    partagesParCanal[p.canal] = (partagesParCanal[p.canal] ?? 0) + 1
  }

  const compterPar = (data: { evenement_id: string }[] | null): Record<string, number> => {
    const compte: Record<string, number> = {}
    for (const row of data ?? []) compte[row.evenement_id] = (compte[row.evenement_id] ?? 0) + 1
    return compte
  }

  const favorisParEvenement = compterPar(favorisData)
  const participationsParEvenement = compterPar(participationsData)
  const commentairesParEvenement = compterPar(commentairesData)

  const evenementsAvecStats = (evenements ?? [])
    .map(e => ({
      id: e.id,
      titre: e.titre,
      vues: vuesParEvenement[e.id] ?? 0,
      partages: partagesParEvenement[e.id] ?? 0,
      favoris: favorisParEvenement[e.id] ?? 0,
      participations: participationsParEvenement[e.id] ?? 0,
      commentaires: commentairesParEvenement[e.id] ?? 0,
    }))
    .sort((a, b) => b.vues - a.vues)

  return NextResponse.json({
    periode,
    nb_vues_total: (vuesData ?? []).length,
    nb_partages_total: (partagesData ?? []).length,
    nb_favoris_total: (favorisData ?? []).length,
    nb_participations_total: (participationsData ?? []).length,
    nb_commentaires_total: (commentairesData ?? []).length,
    nb_vues_organisation: nbVuesOrg ?? 0,
    nb_followers: nbFollowers ?? 0,
    partages_par_canal: partagesParCanal,
    evenements: evenementsAvecStats,
  })
}
