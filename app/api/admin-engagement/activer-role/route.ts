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
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'email requis' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: engagement, error: fetchErr } = await admin
      .from('admin_engagements')
      .select('nom_complet, email, role_assigne, token_utilise')
      .eq('email', email)
      .maybeSingle()

    if (fetchErr || !engagement) {
      return NextResponse.json({ error: 'Engagement introuvable pour cet email' }, { status: 404 })
    }
    if (!engagement.token_utilise) {
      return NextResponse.json({ error: 'Engagement pas encore soumis — activation impossible' }, { status: 409 })
    }

    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const targetUser = (usersResponse?.users ?? []).find(u => u.email === email)

    if (!targetUser) {
      return NextResponse.json({ error: 'Aucun compte LOTBO trouvé avec cet email — la personne doit créer un compte avant activation' }, { status: 404 })
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ role: engagement.role_assigne })
      .eq('id', targetUser.id)

    if (updateErr) throw updateErr

    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
          to: [{ email, name: engagement.nom_complet }],
          subject: 'Ton accès administrateur LOTBO est activé ✅',
          htmlContent: `
            <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Accès activé</h1>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjour ${engagement.nom_complet.split(' ')[0]},</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Ton rôle ${engagement.role_assigne} est maintenant actif. Tu peux te connecter à <a href="https://app.lotbo.app/admin" style="color:#C8431A">app.lotbo.app/admin</a> avec ton compte pour accéder à ton panel.</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Rappel de ce qui est accessible :</p>
            <ul style="color:#1A1410;font-family:Arial,sans-serif;line-height:1.8">
              <li>Validation et rejet des candidatures enquêteur</li>
              <li>Modification du statut enquêteur</li>
              <li>Consultation des données enquêteurs</li>
              <li>Gestion des demandes de badge physique</li>
            </ul>
            <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">Pour toute question : handgod@lotbo.app</p>
          `,
        })
      })
    } catch (emailErr) {
      console.error('[ActiverRole] Email activation échoué (non bloquant):', emailErr)
    }

    return NextResponse.json({ success: true, role: engagement.role_assigne, userId: targetUser.id })
  } catch (err: unknown) {
    console.error('[ActiverRole] Erreur:', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
