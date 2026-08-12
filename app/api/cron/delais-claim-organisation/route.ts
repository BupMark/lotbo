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

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dry_run') === 'true'

  const admin = makeAdminClient()
  const now = new Date().toISOString()

  try {
    // ── Auto-transfert : délai propriétaire dépassé sans réponse ──────────
    const { data: expirees } = await admin
      .from('reclamations_organisations')
      .select('id, organisation_id, reclamant_id')
      .eq('statut', 'proprietaire_notifie')
      .is('proprietaire_reponse', null)
      .lt('proprietaire_delai_expire_le', now)
      .limit(500)

    let transferts = 0
    for (const rec of expirees ?? []) {
      if (!dryRun) {
        await admin.from('organisations').update({ owner_id: rec.reclamant_id }).eq('id', rec.organisation_id)
        await admin.from('reclamations_organisations').update({
          statut: 'approuve',
          proprietaire_reponse: 'accepte',
          proprietaire_repondu_le: now,
          traite_le: now,
          decision: 'auto_transfert_delai_depasse',
        }).eq('id', rec.id)

        const { data: org } = await admin.from('organisations').select('nom').eq('id', rec.organisation_id).single()
        await admin.from('notifications').insert([{
          user_id: rec.reclamant_id,
          type: 'organisation_approuve',
          titre: '🔑 Réclamation approuvée !',
          message: `Tu es maintenant propriétaire de "${org?.nom ?? 'cette organisation'}" (délai de réponse dépassé).`,
          lien: `/organisation/${rec.organisation_id}`,
          lu: false,
        }])
      }
      transferts++
    }

    // ── Clôture automatique des litiges après 90 jours ─────────────────────
    const { data: litigesExpires } = await admin
      .from('reclamations_organisations')
      .select('id, organisation_id, reclamant_id')
      .eq('statut', 'litige')
      .lt('litige_expire_le', now)
      .limit(500)

    let cloturesLitige = 0
    for (const rec of litigesExpires ?? []) {
      if (!dryRun) {
        await admin.from('organisations').update({
          suspendue: false,
          suspendue_le: null,
          suspendue_raison: null,
        }).eq('id', rec.organisation_id)

        await admin
          .from('evenements')
          .update({ statut: 'approuve' })
          .eq('organisation_id', rec.organisation_id)
          .eq('statut', 'suspendu_litige')

        await admin.from('reclamations_organisations').update({
          statut: 'rejete',
          traite_le: now,
          decision: 'litige_clos_90j_sans_resolution',
        }).eq('id', rec.id)

        const { data: org } = await admin.from('organisations').select('nom').eq('id', rec.organisation_id).single()
        await admin.from('notifications').insert([{
          user_id: rec.reclamant_id,
          type: 'organisation_rejete',
          titre: 'Litige clos',
          message: `Le litige sur "${org?.nom ?? 'cette organisation'}" est clos après 90 jours sans résolution. La page reste au propriétaire actuel.`,
          lien: null,
          lu: false,
        }])
      }
      cloturesLitige++
    }

    return NextResponse.json({ success: true, dryRun, transferts, cloturesLitige })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
