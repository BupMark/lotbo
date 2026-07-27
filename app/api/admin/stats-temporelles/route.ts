import { NextResponse } from 'next/server'
import { verifierAdmin, makeAdminClient } from '../../../../lib/adminAuth'
import type { NextRequest } from 'next/server'

type Granularite = 'jour' | 'semaine' | 'mois'

function cleDate(date: Date, granularite: Granularite): string {
  if (granularite === 'jour') {
    return date.toISOString().split('T')[0]
  }
  if (granularite === 'semaine') {
    const d = new Date(date)
    const jour = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() - jour + 1) // lundi de la semaine
    return d.toISOString().split('T')[0]
  }
  // mois
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function fenetreDebut(granularite: Granularite): Date {
  const maintenant = new Date()
  if (granularite === 'jour') {
    maintenant.setUTCDate(maintenant.getUTCDate() - 30)
  } else if (granularite === 'semaine') {
    maintenant.setUTCDate(maintenant.getUTCDate() - 84) // 12 semaines
  } else {
    maintenant.setUTCMonth(maintenant.getUTCMonth() - 12)
  }
  return maintenant
}

function bucketize(dates: string[], granularite: Granularite): Record<string, number> {
  const buckets: Record<string, number> = {}
  for (const d of dates) {
    const cle = cleDate(new Date(d), granularite)
    buckets[cle] = (buckets[cle] || 0) + 1
  }
  return buckets
}

export async function GET(request: NextRequest) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const granularite = (request.nextUrl.searchParams.get('granularite') || 'jour') as Granularite
  if (!['jour', 'semaine', 'mois'].includes(granularite)) {
    return NextResponse.json({ error: 'Granularité invalide' }, { status: 400 })
  }

  const admin = makeAdminClient()
  const depuis = fenetreDebut(granularite).toISOString()

  try {
    // 1. Événements soumis
    const { data: evenements } = await admin
      .from('evenements')
      .select('created_at')
      .gte('created_at', depuis)
      .limit(5000)

    // 2. Événements approuvés (via activite_communautaire, plus fiable
    // que evenements qui n'a pas de colonne de date d'approbation)
    const { data: approbations } = await admin
      .from('activite_communautaire')
      .select('created_at')
      .eq('type', 'evenement_approuve')
      .gte('created_at', depuis)
      .limit(5000)

    // 3. Nouveaux membres
    const { data: nouveauxMembres } = await admin
      .from('profiles')
      .select('created_at')
      .gte('created_at', depuis)
      .limit(5000)

    // 4. Membres actifs — approximation via dernière connexion uniquement
    // (Supabase Auth n'expose pas l'historique complet des connexions,
    // seulement la plus récente par utilisateur — un membre actif
    // plusieurs jours de suite n'apparaît que dans sa période la plus
    // récente, pas dans toutes)
    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const connexions = (usersResponse?.users ?? [])
      .filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= new Date(depuis))
      .map(u => u.last_sign_in_at!)

    return NextResponse.json({
      granularite,
      evenements_soumis: bucketize((evenements || []).map(e => e.created_at), granularite),
      evenements_approuves: bucketize((approbations || []).map(a => a.created_at), granularite),
      nouveaux_membres: bucketize((nouveauxMembres || []).map(m => m.created_at), granularite),
      membres_actifs: bucketize(connexions, granularite),
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
