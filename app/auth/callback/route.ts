import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { lierEnqueteurSiEmailCorrespond } from '../../../lib/enqueteurLink'

// ── Helper : attribuer badge supporter si email trouvé ────────────────────────
async function attribuerBadgeSupporter(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string
) {
  try {
    const { data: supporter } = await supabase
      .from('supporters')
      .select('id, palier, badge_attribue')
      .eq('email', email)
      .eq('badge_attribue', false)
      .single()

    if (!supporter) return

    await supabase.from('profiles').update({ badge: supporter.palier }).eq('id', userId)
    await supabase.from('supporters').update({ badge_attribue: true, user_id: userId }).eq('id', supporter.id)

    console.log(`[Badge] ✅ Badge "${supporter.palier}" attribué à user ${userId}`)
  } catch (error) {
    console.error('[Badge] ❌ Erreur attribution badge:', error)
  }
}

// ── Helper : accepter invitation organisation ─────────────────────────────────
async function accepterInvitation(userId: string, token: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: inv } = await supabaseAdmin
      .from('invitations_org_en_attente')
      .select('id, org_id, role, expire_le, statut')
      .eq('token', token)
      .maybeSingle()

    if (!inv) return
    const invRow = inv as { id: string; org_id: string; role: string; expire_le: string; statut: string }

    if (invRow.statut !== 'en_attente' || new Date(invRow.expire_le) < new Date()) return

    const { data: existing } = await supabaseAdmin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', invRow.org_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      await supabaseAdmin.from('organisation_membres').insert({
        org_id:    invRow.org_id,
        user_id:   userId,
        role:      invRow.role,
        joined_at: new Date().toISOString(),
      })
    }

    await supabaseAdmin
      .from('invitations_org_en_attente')
      .update({ statut: 'acceptee' })
      .eq('id', invRow.id)

    console.log(`[Invitation] ✅ Invitation acceptée org=${invRow.org_id} user=${userId}`)
  } catch (error) {
    console.error('[Invitation] ❌ Erreur acceptation:', error)
  }
}

// ── Helper : envoyer email de bienvenue ───────────────────────────────────────
async function envoyerEmailBienvenue(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  email: string,
  nom: string,
  langue: string | null
) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET!,
      },
      body: JSON.stringify({ email, nom, langue: langue || 'fr' }),
    })

    if (!res.ok) {
      console.error('[Welcome] ❌ Envoi échoué:', await res.text())
      return
    }

    await supabase
      .from('profiles')
      .update({ welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() })
      .eq('id', userId)

    console.log(`[Welcome] ✅ Email de bienvenue envoyé à ${email}`)
  } catch (error) {
    console.error('[Welcome] ❌ Erreur envoi bienvenue:', error)
  }
}

// ── Helper partagé : créer profil + badge + redirect ─────────────────────────
async function traiterSession(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  userEmail: string,
  invitation: string | null,
  redirect: string
) {
  const { data: profil } = await supabase
    .from('profiles')
    .select('id, onboarding_complete, consent_cgu, welcome_email_sent, langue_preference, nom')
    .eq('id', userId)
    .single()

  if (!profil) {
    const { data: userData } = await supabase.auth.getUser()
    const nom =
      userData.user?.user_metadata?.full_name ||
      userData.user?.user_metadata?.name ||
      userData.user?.email?.split('@')[0] ||
      'Membre LOTBO'

    await supabase.from('profiles').upsert({
      id: userId, nom, role: 'membre', created_at: new Date().toISOString(),
    })

    if (userEmail) await attribuerBadgeSupporter(supabase, userId, userEmail)
  } else {
    if (userEmail) await attribuerBadgeSupporter(supabase, userId, userEmail)
  }

  if (invitation) {
    await accepterInvitation(userId, invitation)
  }

  // FEAT-EMAIL-BIENVENUE-1 — envoi unique, peu importe le chemin d'inscription
  if (userEmail && !profil?.welcome_email_sent) {
    await envoyerEmailBienvenue(
      supabase,
      userId,
      userEmail,
      profil?.nom || 'Membre LOTBO',
      profil?.langue_preference ?? null
    )
  }

  // FEAT-ENQUETEUR-LIAISON-COMPTE-1 — liaison automatique si candidature validée en attente
  if (userEmail) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      await lierEnqueteurSiEmailCorrespond(admin, userId, userEmail)
    } catch (linkErr) {
      console.error('[EnqueteurLink] Erreur liaison (non bloquant):', linkErr)
    }
  }

  // FEAT-ONBOARDING-CONSENT-1 — Interstitiel OAuth si consentement absent
  const consentementAbsent =
    !profil?.consent_cgu ||
    !profil?.onboarding_complete

  if (consentementAbsent) {
    return NextResponse.redirect(
      `https://app.lotbo.app/consent?redirect=${encodeURIComponent(redirect)}`
    )
  }

  return NextResponse.redirect(`https://app.lotbo.app${redirect}`)
}

// ── GET — Google, Facebook, flux PKCE standard ────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const code       = searchParams.get('code')
  const redirect   = searchParams.get('redirect') || '/'
  const invitation = searchParams.get('invitation')

  if (!code) {
    return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch (error) {
            console.error('[Cookies] ❌ Erreur setAll:', error)
          }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[Auth GET] ❌ exchangeCodeForSession:', error)
    return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
  }

  return traiterSession(supabase, data.user.id, data.user.email || '', invitation, redirect)
}

// ── POST — Apple Sign In (iPad + flux form_post) ──────────────────────────────
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect   = searchParams.get('redirect') || '/'
  const invitation = searchParams.get('invitation')

  let code: string | null = null

  try {
    const body = await request.formData()
    code = body.get('code') as string | null
  } catch {
    // Fallback : essayer JSON
    try {
      const json = await request.json()
      code = json?.code || null
    } catch {
      code = null
    }
  }

  if (!code) {
    console.error('[Auth Apple POST] ❌ Pas de code reçu')
    return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch (error) {
            console.error('[Cookies] ❌ Erreur setAll:', error)
          }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('[Auth Apple POST] ❌ exchangeCodeForSession:', error)
    return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
  }

  return traiterSession(supabase, data.user.id, data.user.email || '', invitation, redirect)
}