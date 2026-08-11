import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SEUIL_EVENEMENTS = 3
const SEUIL_ANCIENNETE_JOURS = 30

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === 'true'

  const admin = makeAdminClient()

  try {
    const { data: orgs, error } = await admin
      .from('organisations')
      .select('id, nom, verified, created_at, logo_url, description, email_contact_verifie, site_web, created_at')
      .limit(2000)

    if (error) throw error
    if (!orgs || orgs.length === 0) return NextResponse.json({ success: true, dryRun, traitees: 0, changements: [] })

    const seuilDate = new Date(Date.now() - SEUIL_ANCIENNETE_JOURS * 24 * 60 * 60 * 1000).toISOString()

    const changements: { org: string; ancien: boolean; nouveau: boolean }[] = []

    for (const org of orgs) {
      // Critère 1 : profil complet (mêmes critères que FEAT-VERIF-PROFIL-ORGA-1, sauf catégorie/charte non requis ici)
      const profilComplet = !!org.logo_url && !!org.description?.trim() && !!org.email_contact_verifie && !!org.site_web?.trim()

      // Critère 2 : au moins 3 événements publiés et approuvés
      const { count: nbEvenements } = await admin
        .from('evenements')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', org.id)
        .eq('statut', 'approuve')

      // Critère 3 : compte actif depuis au moins 30 jours
      const ancienSuffisant = org.created_at < seuilDate

      // Critère 4 : aucun signalement non résolu ('nouveau')
      const { count: nbSignalementsOuverts } = await admin
        .from('signalements')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', org.id)
        .eq('statut', 'nouveau')

      const eligible = profilComplet
        && (nbEvenements ?? 0) >= SEUIL_EVENEMENTS
        && ancienSuffisant
        && (nbSignalementsOuverts ?? 0) === 0

      if (eligible !== org.verified) {
        changements.push({ org: org.nom, ancien: org.verified, nouveau: eligible })
        if (!dryRun) {
          await admin.from('organisations').update({ verified: eligible }).eq('id', org.id)
        }
      }
    }

    return NextResponse.json({ success: true, dryRun, traitees: orgs.length, changements })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
