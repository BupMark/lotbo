import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Helper : attribuer badge supporter si email trouvé ────────────────────────
async function attribuerBadgeSupporter(supabase: ReturnType<typeof createServerClient>, userId: string, email: string) {
  try {
    // Chercher le supporter avec cet email
    const { data: supporter } = await supabase
      .from('supporters')
      .select('id, palier, badge_attribue')
      .eq('email', email)
      .eq('badge_attribue', false)
      .single()

    if (!supporter) return // Pas de supporter ou badge déjà attribué

    // Mettre à jour le profil avec le badge
    await supabase
      .from('profiles')
      .update({ badge: supporter.palier })
      .eq('id', userId)

    // Marquer le badge comme attribué et lier le user_id
    await supabase
      .from('supporters')
      .update({ badge_attribue: true, user_id: userId })
      .eq('id', supporter.id)

    console.log(`[Badge] ✅ Badge "${supporter.palier}" attribué à user ${userId}`)
  } catch (e) {
    console.error('[Badge] ❌ Erreur attribution badge:', e)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code     = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const userEmail = data.user.email || ''

      const { data: profil } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profil) {
        // Nouveau compte — créer le profil
        const nom =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'Membre LOTBO'

        await supabase.from('profiles').upsert({
          id:         data.user.id,
          nom,
          role:       'membre',
          created_at: new Date().toISOString(),
        })

        // Vérifier si c'est un supporter
        if (userEmail) {
          await attribuerBadgeSupporter(supabase, data.user.id, userEmail)
        }
      } else {
        // Compte existant — vérifier quand même si badge pas encore attribué
        if (userEmail) {
          await attribuerBadgeSupporter(supabase, data.user.id, userEmail)
        }
      }

      return NextResponse.redirect(`https://app.lotbo.app${redirect}`)
    }
  }

  return NextResponse.redirect('https://app.lotbo.app/login?error=auth')
}