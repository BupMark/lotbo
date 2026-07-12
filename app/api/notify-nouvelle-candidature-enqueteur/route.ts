import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { nom_complet, ville, email } = await request.json()
    if (!nom_complet) {
      return NextResponse.json({ error: 'nom_complet requis' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'admin_enqueteur'])
      .limit(2000)

    if (!admins || admins.length === 0) {
      return NextResponse.json({ success: true, notifies: 0 })
    }

    const adminIds = new Set(admins.map(a => a.id))
    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const destinataires = (usersResponse?.users ?? []).filter(u => adminIds.has(u.id) && u.email)

    let envoyes = 0
    for (const dest of destinataires) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
          body: JSON.stringify({
            sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
            to: [{ email: dest.email! }],
            subject: `Nouvelle candidature enquêteur — ${nom_complet}`,
            htmlContent: `
              <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Nouvelle candidature</h1>
              <p style="color:#1A1410;font-family:Arial,sans-serif"><strong>${nom_complet}</strong> vient de soumettre sa candidature pour rejoindre le programme enquêteur LOTBO.</p>
              <p style="color:#1A1410;font-family:Arial,sans-serif">Ville : ${ville || '—'}${email ? `<br/>Email : ${email}` : ''}</p>
              <a href="https://app.lotbo.app/admin" style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-weight:500">Voir dans le panel →</a>
            `,
          })
        })
        envoyes++
      } catch (e) {
        console.error('[NouvelleCandidature] Envoi échoué pour', dest.email, e)
      }
    }

    return NextResponse.json({ success: true, notifies: envoyes })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[NouvelleCandidature] Erreur:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
