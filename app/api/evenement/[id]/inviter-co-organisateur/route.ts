import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function envoyerEmail(to: string, subject: string, html: string): Promise<void> {
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender:      { name: 'LOTBO', email: 'hello@lotbo.app' },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })
}

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evenementId } = await params

  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const bearerToken = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(bearerToken)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json() as {
    type_cible?: 'utilisateur' | 'organisation'
    email?: string
    organisation_cible_id?: string
  }
  const { type_cible, email, organisation_cible_id } = body

  if (!type_cible || !['utilisateur', 'organisation'].includes(type_cible)) {
    return NextResponse.json({ error: 'type_cible invalide' }, { status: 400 })
  }
  if (type_cible === 'organisation' && !organisation_cible_id) {
    return NextResponse.json({ error: 'organisation_cible_id requis pour une organisation' }, { status: 400 })
  }

  const admin = makeAdminClient()

  // Vérifier que l'appelant est propriétaire de l'événement (user_id direct OU membre habilité de l'org liée)
  const { data: ev } = await admin
    .from('evenements')
    .select('id, titre, user_id, organisation_id, date_debut, date_fin')
    .eq('id', evenementId)
    .maybeSingle()

  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  const finReference = ev.date_fin ?? ev.date_debut
  const aujourdhui = new Date().toISOString().split('T')[0]
  if (finReference && finReference < aujourdhui) {
    return NextResponse.json({ error: 'Impossible d\'inviter un co-organisateur sur un événement passé' }, { status: 400 })
  }

  let autorise = ev.user_id === user.id
  if (!autorise && ev.organisation_id) {
    const { data: membre } = await admin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', ev.organisation_id)
      .eq('user_id', user.id)
      .maybeSingle()
    autorise = !!membre && ['owner', 'admin', 'editeur'].includes(membre.role)
  }
  if (!autorise) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const newToken = crypto.randomUUID()
  const expireLe = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await admin
    .from('invitations_co_organisateurs_en_attente')
    .insert({
      evenement_id: evenementId,
      type_cible,
      email: email || null,
      organisation_cible_id: organisation_cible_id || null,
      token: newToken,
      invite_par: user.id,
      expire_le: expireLe,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const lienAcceptation = `https://app.lotbo.app/evenement/co-organisation/accepter?token=${newToken}`

  if (email) {
    await envoyerEmail(
      email,
      `Invitation à co-organiser "${ev.titre}" sur LOTBO`,
      `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#F7F2E8;padding:32px 24px;border-radius:12px">
        <p style="font-size:24px;font-weight:bold;color:#1A1410;margin-bottom:8px;font-family:serif;font-style:italic">LOTBO</p>
        <h2 style="color:#1A1410;font-size:18px;margin-bottom:16px">Invitation à co-organiser</h2>
        <p style="color:#4A3830;font-size:14px;line-height:1.6;margin-bottom:24px">
          Tu as été invité à co-organiser <strong>${ev.titre}</strong> sur LOTBO.
        </p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${lienAcceptation}"
             style="background:#C8431A;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
            Accepter l'invitation →
          </a>
        </div>
        <p style="color:#8C5A40;font-size:12px;text-align:center">Lien valable 14 jours · <a href="https://app.lotbo.app" style="color:#C8431A;text-decoration:none">app.lotbo.app</a></p>
      </div>`
    )
  }

  return NextResponse.json({ success: true, lien: lienAcceptation, cas: email ? 'email_envoye' : 'lien_genere' })
}
