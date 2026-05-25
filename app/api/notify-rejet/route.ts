import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Migration requise (une seule fois via Supabase SQL editor) :
// ALTER TABLE evenements ADD COLUMN IF NOT EXISTS raison_rejet TEXT;

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { evenementId, titre, raison, userId } = await request.json()
    if (!titre || !raison) {
      return NextResponse.json({ error: 'titre et raison requis' }, { status: 400 })
    }

    // Récupérer l'email de l'organisateur via service role
    let destinataire: { email: string; name: string } | null = null
    if (userId) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId)
      const email = authUser?.user?.email
      const { data: prof } = await adminSupabase.from('profiles').select('nom').eq('id', userId).single()
      if (email) {
        destinataire = { email, name: prof?.nom || 'Organisateur' }
      }
    }

    if (!destinataire) {
      return NextResponse.json({ ok: true, skipped: 'no_email' })
    }

    const contenuEmail = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
            <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
          </span>
        </div>
        <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">
          Votre événement n'a pas été approuvé
        </h1>
        <p style="color:#E8E0D0;font-size:14px;margin-bottom:24px">
          Bonjour ${destinataire.name}, nous avons examiné votre événement et il ne peut pas être publié pour le moment.
        </p>
        <div style="background:rgba(255,255,255,0.06);border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px">
          <p style="color:#F7F2E8;font-size:15px;font-weight:bold;margin-bottom:12px">📅 ${titre}</p>
          <p style="color:#C8B89A;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Raison du rejet</p>
          <p style="color:#F7F2E8;font-size:14px;font-weight:bold;line-height:1.6;border-left:3px solid #C8431A;padding-left:12px;margin:0">${raison}</p>
        </div>
        <p style="color:#C8B89A;font-size:13px;line-height:1.7;margin-bottom:24px">
          Vous pouvez corriger votre événement et le soumettre à nouveau en tenant compte de cette raison.
          Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.
        </p>
        <a href="https://app.lotbo.app/ajouter"
           style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
          Soumettre un nouvel événement →
        </a>
        <p style="color:#2a2a2a;font-size:11px;margin-top:24px">
          Lotbo · app.lotbo.app · <a href="https://app.lotbo.app/politique-confidentialite" style="color:#2a2a2a">Confidentialité</a>
        </p>
      </div>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [destinataire],
        subject: `Votre événement "${titre}" n'a pas été approuvé`,
        htmlContent: contenuEmail,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[notify-rejet] Brevo error:', err)
      return NextResponse.json({ error: 'Brevo error', detail: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true, evenementId })
  } catch (err) {
    console.error('[notify-rejet]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
