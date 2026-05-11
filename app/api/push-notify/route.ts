import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { titre, lieu, url } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, envoyes: 0 })
    }

    const payload = JSON.stringify({
      title: `🎉 ${titre}`,
      body: `📍 ${lieu}`,
      url: url || 'https://app.lotbo.app'
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