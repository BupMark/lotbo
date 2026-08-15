import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * CRON — Suppression effective des organisations après 30 jours de grâce
 * Déclenché par GitHub Actions chaque nuit
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { data: orgs, error: fetchError } = await admin
    .from('organisations')
    .select('id, suppression_option')
    .not('suppression_demandee_at', 'is', null)
    .lt('suppression_demandee_at', cutoff.toISOString())

  if (fetchError) {
    return NextResponse.json({ error: 'ERREUR_LECTURE' }, { status: 500 })
  }
  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ success: true, supprimees: 0 })
  }

  let supprimees = 0
  let erreurs = 0

  for (const org of orgs) {
    try {
      if (org.suppression_option === 'supprimer_tout') {
        await admin.from('evenements').delete().eq('organisation_id', org.id)
      }
      const { error: deleteError } = await admin.from('organisations').delete().eq('id', org.id)
      if (deleteError) {
        console.error(`[CRON suppression orga] Erreur pour ${org.id}:`, deleteError)
        erreurs++
        continue
      }
      supprimees++
    } catch (err) {
      console.error(`[CRON suppression orga] Erreur inattendue pour ${org.id}:`, err)
      erreurs++
    }
  }

  return NextResponse.json({ success: true, supprimees, erreurs })
}
