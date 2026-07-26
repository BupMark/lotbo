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

const SEUIL_ELIGIBILITE = 20

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = makeAdminClient()
  const aujourd_hui = new Date().toISOString().split('T')[0]

  try {
    // Événements en cours + à venir uniquement (jamais les événements passés)
    const { data: evs, error } = await admin
      .from('evenements')
      .select('ville, pays')
      .eq('statut', 'approuve')
      .not('ville', 'is', null)
      .or(`and(date_fin.not.is.null,date_fin.gte.${aujourd_hui}),and(date_fin.is.null,date_debut.gte.${aujourd_hui})`)
      // db-max-rows Supabase relevé à 5000 pour ce projet (voir
      // CLAUDE.md) — 1048 événements éligibles constatés le 25/07/2026,
      // marge confortable conservée si la plateforme continue de croître.
      .limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const villesCount: Record<string, { count: number; pays: string | null }> = {}
    for (const e of evs || []) {
      if (!e.ville) continue
      if (!villesCount[e.ville]) villesCount[e.ville] = { count: 0, pays: e.pays }
      villesCount[e.ville].count++
    }

    const classement = Object.entries(villesCount)
      .map(([ville, { count, pays }]) => ({ ville, pays, count }))
      .filter(v => v.count >= SEUIL_ELIGIBILITE)
      .sort((a, b) => b.count - a.count)

    if (classement.length === 0) {
      return NextResponse.json({ success: true, changement: false, raison: 'aucune ville éligible' })
    }

    const nouveauTop = classement[0]

    const { data: derniereLigne } = await admin
      .from('classement_villes_historique')
      .select('ville, nb_evenements')
      .order('devenue_top_le', { ascending: false })
      .limit(1)
      .maybeSingle()

    const changement = !derniereLigne || derniereLigne.ville !== nouveauTop.ville

    if (!changement) {
      return NextResponse.json({ success: true, changement: false, ville_actuelle: nouveauTop.ville })
    }

    await admin.from('classement_villes_historique').insert([{
      ville: nouveauTop.ville,
      pays: nouveauTop.pays,
      nb_evenements: nouveauTop.count,
    }])

    // Signal Ansanm — badge nav, réutilise activite_communautaire
    await admin.from('activite_communautaire').insert([{
      type: 'ville_top_changee',
      user_id: null,
      ville: nouveauTop.ville,
      contenu: { ville: nouveauTop.ville, pays: nouveauTop.pays, nb_evenements: nouveauTop.count },
    }])

    // Phase 4 — Notification globale aux opt-in notif_classement_ville
    // (pas de ciblage géo : diffusion communautaire, pas locale —
    // décision produit du 26/07/2026, simplifie FEAT-SUIVI-VILLE-1
    // non construit)
    let notifiesIn = 0
    let notifiesEmail = 0

    const { data: optInMembres } = await admin
      .from('profiles')
      .select('id, nom')
      .eq('notif_classement_ville', true)
      .limit(5000)

    if (optInMembres && optInMembres.length > 0) {
      const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const emailMap = new Map((usersResponse?.users ?? []).map(u => [u.id, u.email]))

      const sujet = `🏆 ${nouveauTop.ville} est maintenant #1 sur LOTBO !`
      const messageIn = `${nouveauTop.ville} vient de passer en tête du classement des villes.`

      for (const membre of optInMembres) {
        try {
          await admin.from('notifications').insert([{
            user_id: membre.id,
            type: 'classement_ville',
            titre: '🏆 Nouvelle ville #1',
            message: messageIn,
            lien: '/ansanm',
            lu: false,
          }])
          notifiesIn++
        } catch (e) {
          console.error('[ClassementVilles] Notification in-app échouée pour', membre.id, e)
        }

        const email = emailMap.get(membre.id)
        if (email) {
          try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
              body: JSON.stringify({
                sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
                to: [{ email, name: membre.nom || email.split('@')[0] }],
                subject: sujet,
                htmlContent: `
                  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
                    <div style="margin-bottom:24px">
                      <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
                        <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
                      </span>
                    </div>
                    <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">🏆 ${nouveauTop.ville} est en tête !</h1>
                    <p style="color:#8C5A40;font-size:14px;margin-bottom:24px">${nouveauTop.ville}${nouveauTop.pays ? ', ' + nouveauTop.pays : ''} vient de devenir la ville #1 sur LOTBO avec ${nouveauTop.count} événements actifs.</p>
                    <a href="https://app.lotbo.app/ansanm"
                       style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
                      Voir le classement →
                    </a>
                    <p style="color:#2a2a2a;font-size:11px;margin-top:24px">Lotbo · app.lotbo.app</p>
                  </div>
                `,
              })
            })
            notifiesEmail++
          } catch (e) {
            console.error('[ClassementVilles] Email échoué pour', email, e)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      changement: true,
      nouvelle_ville_top: nouveauTop.ville,
      ancienne_ville_top: derniereLigne?.ville || null,
      nb_evenements: nouveauTop.count,
      notifiesIn,
      notifiesEmail,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
