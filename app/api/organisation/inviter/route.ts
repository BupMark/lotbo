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

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const token = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json() as { org_id?: string; email?: string; role?: string }
  const { org_id, email, role } = body

  if (!org_id || !email || !role) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  if (!['admin', 'editeur', 'lecteur'].includes(role)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Vérifier que l'appelant est owner ou admin
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('id, nom, slug, owner_id')
    .eq('id', org_id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  const orgRow = org as { id: string; nom: string; slug: string; owner_id: string }
  const isOwner = orgRow.owner_id === user.id

  if (!isOwner) {
    const { data: callerMembre } = await supabaseAdmin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const callerRole = (callerMembre as { role: string } | null)?.role ?? ''
    if (!['owner', 'admin'].includes(callerRole)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    if (role === 'admin') {
      return NextResponse.json({ error: 'Seul le owner peut inviter un admin' }, { status: 403 })
    }
  }

  // Chercher l'utilisateur cible par email
  const { data: usersResponse } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const targetUser = (usersResponse?.users ?? []).find(u => u.email === email)

  // ── Cas A : email déjà inscrit ────────────────────────────────────────────
  if (targetUser) {
    // Vérifier si déjà membre
    const { data: existing } = await supabaseAdmin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Cet utilisateur est déjà membre' }, { status: 409 })
    }

    const { error: insertError } = await supabaseAdmin
      .from('organisation_membres')
      .insert({
        org_id,
        user_id:   targetUser.id,
        role,
        joined_at: new Date().toISOString(),
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { data: p } = await supabaseAdmin.from('profiles').select('notif_organisation').eq('id', targetUser.id).single()
    if (p?.notif_organisation ?? true) {
      await supabaseAdmin.from('notifications').insert([{
        user_id: targetUser.id,
        type: 'organisation_ajout',
        titre: 'Tu as rejoint une organisation',
        message: `Tu es maintenant membre de ${orgRow.nom}.`,
        lien: '/organisations',
        lu: false,
      }])
    }

    // Email de confirmation à l'utilisateur ajouté
    await envoyerEmail(
      email,
      `Tu as rejoint ${orgRow.nom} sur LOTBO`,
      `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#F7F2E8;padding:32px 24px;border-radius:12px">
        <p style="font-size:24px;font-weight:bold;color:#1A1410;margin-bottom:8px;font-family:serif;font-style:italic">LOTBO</p>
        <h2 style="color:#1A1410;font-size:18px;margin-bottom:16px">Tu as été ajouté à ${orgRow.nom}</h2>
        <p style="color:#4A3830;font-size:14px;line-height:1.6;margin-bottom:24px">
          Tu fais maintenant partie de <strong>${orgRow.nom}</strong> en tant que <strong>${role}</strong> sur LOTBO.
        </p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="https://app.lotbo.app/organisation/${orgRow.slug}"
             style="background:#C8431A;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
            Voir l'organisation →
          </a>
        </div>
        <p style="color:#8C5A40;font-size:12px;text-align:center">Tous les événements, un seul endroit · <a href="https://app.lotbo.app" style="color:#C8431A;text-decoration:none">app.lotbo.app</a></p>
      </div>`
    )

    return NextResponse.json({ cas: 'ajout_direct' })
  }

  // ── Cas B : email non inscrit → invitation en attente ─────────────────────
  const { data: existingInv } = await supabaseAdmin
    .from('invitations_org_en_attente')
    .select('id')
    .eq('org_id', org_id)
    .eq('email', email)
    .maybeSingle()

  const isRenvoi = !!existingInv
  const newToken = crypto.randomUUID()
  const expireLe = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { error: upsertError } = await supabaseAdmin
    .from('invitations_org_en_attente')
    .upsert(
      { org_id, email, role, token: newToken, expire_le: expireLe, statut: 'en_attente', invite_par: user.id },
      { onConflict: 'org_id,email' }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Email d'invitation vers /inscription?invitation=[token]
  await envoyerEmail(
    email,
    `${orgRow.nom} t'invite à rejoindre LOTBO`,
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#F7F2E8;padding:32px 24px;border-radius:12px">
      <p style="font-size:24px;font-weight:bold;color:#1A1410;margin-bottom:8px;font-family:serif;font-style:italic">LOTBO</p>
      <h2 style="color:#1A1410;font-size:18px;margin-bottom:16px">${orgRow.nom} t'invite à rejoindre LOTBO</h2>
      <p style="color:#4A3830;font-size:14px;line-height:1.6;margin-bottom:24px">
        Tu as été invité à rejoindre <strong>${orgRow.nom}</strong> sur LOTBO en tant que <strong>${role}</strong>.<br/>
        Crée ton compte gratuit pour accepter l'invitation.
      </p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://app.lotbo.app/login?mode=inscription&invitation=${newToken}"
           style="background:#C8431A;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
          Accepter l'invitation →
        </a>
      </div>
      <p style="color:#8C5A40;font-size:12px;text-align:center">Lien valable 14 jours · <a href="https://app.lotbo.app" style="color:#C8431A;text-decoration:none">app.lotbo.app</a></p>
    </div>`
  )

  return NextResponse.json({ cas: isRenvoi ? 'invitation_renvoyee' : 'invitation_envoyee' })
}
