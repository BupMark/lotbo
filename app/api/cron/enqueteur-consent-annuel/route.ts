import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()
  const dans30Jours = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const il_y_a_60_jours = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  let renouvellementsEnvoyes = 0
  let masquagesEffectues = 0
  let anonymisationsEffectuees = 0
  const erreurs: string[] = []

  // ── 1. Email de renouvellement J-30 ────────────────────────────────
  const { data: aRenouveler } = await admin
    .from('enqueteurs')
    .select('id, nom_affichage, email, ville, fiches_total, consent_revue_due')
    .lte('consent_revue_due', dans30Jours.toISOString())
    .is('renouvellement_notifie_le', null)
    .eq('fiche_masquee', false)
    .is('anonymise_le', null)
    .not('email', 'is', null)
    .limit(500)

  for (const enq of aRenouveler || []) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-enqueteur-renouvellement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET! },
        body: JSON.stringify({
          email: enq.email,
          prenom: enq.nom_affichage?.split(' ')[0] || enq.nom_affichage,
          ville: enq.ville,
          fichesTotal: enq.fiches_total,
          enqueteurId: enq.id,
          dateExpiration: enq.consent_revue_due,
          langue: 'fr',
        }),
      })
      if (res.ok) {
        await admin.from('enqueteurs').update({ renouvellement_notifie_le: now.toISOString() }).eq('id', enq.id)
        renouvellementsEnvoyes++
      } else {
        erreurs.push(`renouvellement ${enq.id}: HTTP ${res.status}`)
      }
    } catch (e) {
      erreurs.push(`renouvellement ${enq.id}: ${String(e)}`)
    }
  }

  // ── 2. Masquage automatique à expiration ───────────────────────────
  const { data: aMasquer } = await admin
    .from('enqueteurs')
    .select('id, nom_affichage, email, consent_revue_due')
    .lte('consent_revue_due', now.toISOString())
    .eq('fiche_masquee', false)
    .is('anonymise_le', null)
    .limit(500)

  for (const enq of aMasquer || []) {
    try {
      const masqueLe = now.toISOString()
      await admin.from('enqueteurs').update({ fiche_masquee: true, masque_le: masqueLe }).eq('id', enq.id)
      masquagesEffectues++

      if (enq.email) {
        const dateLimite = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-enqueteur-masque`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET! },
          body: JSON.stringify({
            email: enq.email,
            prenom: enq.nom_affichage?.split(' ')[0] || enq.nom_affichage,
            enqueteurId: enq.id,
            dateLimite,
            langue: 'fr',
          }),
        }).catch(() => {})
      }
    } catch (e) {
      erreurs.push(`masquage ${enq.id}: ${String(e)}`)
    }
  }

  // ── 3. Anonymisation après 60 jours de masquage ────────────────────
  const { data: aAnonymiser } = await admin
    .from('enqueteurs')
    .select('id, photo_url')
    .lte('masque_le', il_y_a_60_jours.toISOString())
    .is('anonymise_le', null)
    .limit(500)

  for (const enq of aAnonymiser || []) {
    try {
      await admin.from('enqueteurs').update({
        nom_affichage: null,
        email: null,
        photo_url: null,
        anonymise_le: now.toISOString(),
      }).eq('id', enq.id)

      if (enq.photo_url) {
        try {
          const path = enq.photo_url.split('/enqueteurs-photos/')[1]
          if (path) await admin.storage.from('enqueteurs-photos').remove([path])
        } catch { /* non bloquant */ }
      }

      anonymisationsEffectuees++
    } catch (e) {
      erreurs.push(`anonymisation ${enq.id}: ${String(e)}`)
    }
  }

  return NextResponse.json({
    success: true,
    renouvellementsEnvoyes,
    masquagesEffectues,
    anonymisationsEffectuees,
    erreurs,
  })
}
