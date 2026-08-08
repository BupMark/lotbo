import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function makeUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.replace('Bearer ', '')
  if (!bearerToken) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userClient = makeUserClient(bearerToken)
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const userId = userData.user.id

  const body = await request.json().catch(() => null) as { org_id?: string } | null
  const orgId = body?.org_id
  if (!orgId) {
    return NextResponse.json({ error: 'org_id manquant' }, { status: 400 })
  }

  const admin = makeAdminClient()

  // Vérifie que l'utilisateur est owner ou admin de cette org
  const { data: org } = await admin
    .from('organisations')
    .select('id, slug, nom, email_contact, owner_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  let autorise = org.owner_id === userId
  if (!autorise) {
    const { data: membre } = await admin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle()
    autorise = membre?.role === 'admin' || membre?.role === 'owner'
  }
  if (!autorise) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  if (!org.email_contact) {
    return NextResponse.json({ error: 'Aucun email de contact renseigné' }, { status: 400 })
  }

  const token = crypto.randomUUID()
  const expireLe = new Date(Date.now() + 48 * 3600 * 1000).toISOString() // 48h

  await admin
    .from('organisations')
    .update({
      email_contact_verifie_token: token,
      email_contact_verifie_token_expire_le: expireLe,
    })
    .eq('id', orgId)

  const lienVerif = `https://app.lotbo.app/api/organisation/verifier-email?token=${token}`

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email: org.email_contact }],
        subject: `Confirme l'email de contact de ${org.nom}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
            <div style="margin-bottom:24px">
              <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
                <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
              </span>
            </div>
            <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">Confirme cet email</h1>
            <p style="color:#8C5A40;font-size:14px;margin-bottom:24px">Cet email a été renseigné comme contact public pour ${org.nom} sur LOTBO. Clique ci-dessous pour le confirmer.</p>
            <a href="${lienVerif}"
               style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
              Confirmer cet email →
            </a>
            <p style="color:#2a2a2a;font-size:11px;margin-top:24px">Ce lien expire dans 48h. Lotbo · app.lotbo.app</p>
          </div>
        `,
      }),
    })
  } catch (e) {
    console.error('[EnvoyerVerificationEmail] Échec envoi', e)
    return NextResponse.json({ error: 'Échec envoi email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
