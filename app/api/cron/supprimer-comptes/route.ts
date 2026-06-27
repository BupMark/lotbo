import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * CRON — Suppression effective des comptes après 30 jours de grâce
 * Déclenché par GitHub Actions chaque nuit à 03h00 UTC
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Récupérer les comptes dont la demande date de plus de 30 jours
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { data: comptes, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .not('suppression_demandee_at', 'is', null)
    .lt('suppression_demandee_at', cutoff.toISOString())

  if (fetchError) {
    console.error('[CRON suppression] Erreur lecture:', fetchError)
    return NextResponse.json({ error: 'ERREUR_LECTURE' }, { status: 500 })
  }

  if (!comptes || comptes.length === 0) {
    return NextResponse.json({ success: true, supprimés: 0 })
  }

  let supprimés = 0
  let erreurs   = 0

  for (const compte of comptes) {
    try {
      // 1. Exécuter la RPC de suppression des données
      const { error: rpcError } = await supabase.rpc('supprimer_compte_utilisateur', {
        p_user_id: compte.id,
      })

      if (rpcError) {
        console.error(`[CRON suppression] RPC erreur pour ${compte.id}:`, rpcError)
        erreurs++
        continue
      }

      // 2. Supprimer le compte Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(compte.id)

      if (authError) {
        console.error(`[CRON suppression] Auth erreur pour ${compte.id}:`, authError)
        erreurs++
        continue
      }

      supprimés++
    } catch (err) {
      console.error(`[CRON suppression] Erreur inattendue pour ${compte.id}:`, err)
      erreurs++
    }
  }

  return NextResponse.json({ success: true, supprimés, erreurs })
}
