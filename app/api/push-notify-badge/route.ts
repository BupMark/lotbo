import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { user_id, badge_emoji, badge_label, badge_desc } = await request.json()

    if (!user_id || !badge_label) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer uniquement les abonnements de cet utilisateur
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, envoyes: 0, raison: 'Aucun abonnement trouvé pour cet utilisateur' })
    }

    const payload = JSON.stringify({
      title: `${badge_emoji || '🏅'} Badge débloqué !`,
      body: `Tu viens de débloquer le badge ${badge_label}${badge_desc ? ' — ' + badge_desc : ''} sur LOTBO !`,
      url: 'https://app.lotbo.app/profil?onglet=badges',
      badge: badge_emoji || '🏅',
    })

    let envoyes = 0
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        envoyes++
      } catch {
        // Subscription expirée — supprimer
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }

    return NextResponse.json({ success: true, envoyes })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}