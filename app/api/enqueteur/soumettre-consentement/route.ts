import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nom_complet, ville, email, whatsapp,
      type_affichage, valeur_affichage,
      consent_publication, consent_volontariat, consent_age,
      consent_photo, photo_url, signature_texte, langue,
    } = body

    if (!nom_complet || !ville || !email || !signature_texte) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    if (!consent_publication || !consent_volontariat || !consent_age) {
      return NextResponse.json({ error: 'Consentements obligatoires manquants' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const token         = crypto.randomUUID()
    const now            = new Date()
    const tokenExpireAt  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    const { error: insertError } = await supabaseAdmin
      .from('enqueteurs_consentements')
      .insert({
        token,
        nom_complet,
        ville,
        email,
        whatsapp: whatsapp || null,
        nom_affichage_type: type_affichage,
        nom_affichage_valeur: valeur_affichage,
        consent_publication,
        consent_publication_at: now.toISOString(),
        consent_volontariat,
        consent_volontariat_at: now.toISOString(),
        consent_age,
        consent_age_at: now.toISOString(),
        consent_photo: !!consent_photo,
        consent_photo_at: consent_photo ? now.toISOString() : null,
        photo_url: photo_url || null,
        signature_texte,
        signature_at: now.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        langue: langue || 'fr',
        token_expire_at: tokenExpireAt.toISOString(),
        token_utilise: false,
      })

    if (insertError) {
      console.error('[Consentement] Erreur insertion:', insertError)
      return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 })
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-consentement-enqueteur`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET!,
        },
        body: JSON.stringify({ email, nom: nom_complet.split(' ')[0], langue: langue || 'fr' }),
      })
    } catch (emailErr) {
      console.error('[Consentement] Email confirmation échoué (non bloquant):', emailErr)
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-nouvelle-candidature-enqueteur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET! },
        body: JSON.stringify({ nom_complet, ville, email }),
      })
    } catch (notifAdminErr) {
      console.error('[Consentement] Notification admins échouée (non bloquant):', notifAdminErr)
    }

    return NextResponse.json({ success: true, token })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[Consentement] Erreur soumission:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
