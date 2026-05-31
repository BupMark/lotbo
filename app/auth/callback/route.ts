import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

    // Vérifier si déjà membre
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
    console.error('[Auth] ❌ exchangeCodeForSession:', error)
    return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
  }

  const userEmail = data.user.email || ''

  const { data: profil } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .single()

  // ── Nouveau profil ─────────────────────────────────────────────────────────
  if (!profil) {
    const nom =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      'Membre LOTBO'

    await supabase.from('profiles').upsert({
      id: data.user.id, nom, role: 'membre', created_at: new Date().toISOString(),
    })

    if (userEmail) await attribuerBadgeSupporter(supabase, data.user.id, userEmail)
  } else {
    if (userEmail) await attribuerBadgeSupporter(supabase, data.user.id, userEmail)
  }

  // ── Accepter invitation si token présent dans l'URL ───────────────────────
  if (invitation) {
    await accepterInvitation(data.user.id, invitation)
  }

  return NextResponse.redirect(`https://app.lotbo.app${redirect}`)
}
