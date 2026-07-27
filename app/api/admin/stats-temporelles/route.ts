import { NextResponse } from 'next/server'
import { verifierAdmin, makeAdminClient } from '../../../../lib/adminAuth'
import type { NextRequest } from 'next/server'

type Granularite = 'jour' | 'semaine' | 'mois'

const GRANULARITE_SQL: Record<Granularite, string> = {
  jour: 'day',
  semaine: 'week',
  mois: 'month',
}

function fenetreDebut(granularite: Granularite): Date {
  const maintenant = new Date()
  if (granularite === 'jour') {
    maintenant.setUTCDate(maintenant.getUTCDate() - 30)
  } else if (granularite === 'semaine') {
    maintenant.setUTCDate(maintenant.getUTCDate() - 84)
  } else {
    maintenant.setUTCMonth(maintenant.getUTCMonth() - 12)
  }
  return maintenant
}

function versRecord(rows: { periode: string; total: number }[] | null): Record<string, number> {
  const record: Record<string, number> = {}
  for (const r of rows || []) {
    record[r.periode] = Number(r.total)
  }
  return record
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
  const granulariteSql = GRANULARITE_SQL[granularite]

  try {
    const [evenements, approbations, nouveauxMembres] = await Promise.all([
      admin.rpc('stats_temporelles_evenements', {
        table_cible: 'evenements',
        colonne_date: 'created_at',
        filtre_type: '',
        granularite: granulariteSql,
        depuis,
      }),
      admin.rpc('stats_temporelles_evenements', {
        table_cible: 'activite_communautaire',
        colonne_date: 'created_at',
        filtre_type: 'evenement_approuve',
        granularite: granulariteSql,
        depuis,
      }),
      admin.rpc('stats_temporelles_evenements', {
        table_cible: 'profiles',
        colonne_date: 'created_at',
        filtre_type: '',
        granularite: granulariteSql,
        depuis,
      }),
    ])

    if (evenements.error) throw evenements.error
    if (approbations.error) throw approbations.error
    if (nouveauxMembres.error) throw nouveauxMembres.error

    // Membres actifs — approximation via dernière connexion uniquement
    // (Supabase Auth n'expose pas l'historique complet des connexions,
    // seulement la plus récente par utilisateur)
    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const connexions = (usersResponse?.users ?? [])
      .filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= new Date(depuis))
      .map(u => u.last_sign_in_at!)

    function cleDate(date: Date): string {
      if (granularite === 'jour') return date.toISOString().split('T')[0]
      if (granularite === 'semaine') {
        const d = new Date(date)
        const jour = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() - jour + 1)
        return d.toISOString().split('T')[0]
      }
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    }

    const membresActifs: Record<string, number> = {}
    for (const c of connexions) {
      const cle = cleDate(new Date(c))
      membresActifs[cle] = (membresActifs[cle] || 0) + 1
    }

    return NextResponse.json({
      granularite,
      evenements_soumis: versRecord(evenements.data),
      evenements_approuves: versRecord(approbations.data),
      nouveaux_membres: versRecord(nouveauxMembres.data),
      membres_actifs: membresActifs,
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
