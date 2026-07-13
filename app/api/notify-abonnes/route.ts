import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../lib/adminAuth'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Body {
  id: string
  titre: string
  lieu: string
  ville: string
  date: string
  categorie: string
}

function contenuEmail(titre: string, lieu: string, date: string, id: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
      <div style="margin-bottom:24px">
        <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
          <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
        </span>
      </div>
      <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">🎉 Nouvel événement près de chez toi</h1>
      <div style="background:rgba(255,255,255,0.06);border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px">
        <p style="color:#F7F2E8;font-size:16px;font-weight:bold;margin-bottom:12px">${titre}</p>
        <p style="color:#8C5A40;font-size:13px;margin-bottom:6px">📍 ${lieu}</p>
        <p style="color:#8C5A40;font-size:13px">📅 ${date}</p>
      </div>
      <a href="https://app.lotbo.app/evenement/${id}"
         style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
        Voir l'événement →
      </a>
      <p style="color:#2a2a2a;font-size:11px;margin-top:24px">Lotbo · app.lotbo.app</p>
    </div>
  `
}

async function envoyerEmail(email: string, nom: string, sujet: string, html: string) {
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email, name: nom || email.split('@')[0] }],
        subject: sujet,
        htmlContent: html,
      })
    })
  } catch (e) {
    console.error('[NotifyAbonnes] Envoi échoué pour', email, e)
  }
}

export async function POST(request: Request) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id, titre, lieu, ville, date, categorie } = await request.json() as Body
    if (!id || !titre) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const admin = makeAdminClient()
    const sujet = `🎉 Nouvel événement : ${titre}`
    const html  = contenuEmail(titre, lieu, date, id)

    let membresNotifies = 0
    let abonnesNotifies = 0

    // ── 1. Membres connectés avec notif_nouveaux_evenements = true ──────────
    const { data: membresOptIn } = await admin
      .from('profiles')
      .select('id, nom')
      .eq('notif_nouveaux_evenements', true)
      .limit(2000)

    if (membresOptIn && membresOptIn.length > 0) {
      const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const emailMap = new Map((usersResponse?.users ?? []).map(u => [u.id, u.email]))

      for (const membre of membresOptIn) {
        // Notification in-app
        try {
          await admin.from('notifications').insert([{
            user_id: membre.id,
            type: 'nouvel_evenement',
            titre: '🎉 Nouvel événement',
            message: `${titre} — ${lieu}`,
            lien: `/evenement/${id}`,
            lu: false,
          }])
        } catch (e) {
          console.error('[NotifyAbonnes] Notification in-app échouée pour', membre.id, e)
        }

        // Email
        const email = emailMap.get(membre.id)
        if (email) {
          await envoyerEmail(email, membre.nom || '', sujet, html)
          membresNotifies++
        }
      }
    }

    // ── 2. Abonnés anonymes (table abonnements) — filtrage ville + catégorie ─
    if (ville) {
      const { data: abonnes } = await admin
        .from('abonnements')
        .select('email, ville, categories')
        .ilike('ville', ville.trim())
        .limit(2000)

      for (const ab of abonnes || []) {
        // Si categories est renseigné, l'événement doit y figurer ; si null, opt-in à tout
        if (ab.categories && ab.categories.length > 0 && categorie && !ab.categories.includes(categorie)) {
          continue
        }
        await envoyerEmail(ab.email, '', sujet, html)
        abonnesNotifies++
      }
    }

    return NextResponse.json({ success: true, membresNotifies, abonnesNotifies })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[NotifyAbonnes] Erreur:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
