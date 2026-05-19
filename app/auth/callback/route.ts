import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/ajouter'
  const redirect = searchParams.get('redirect') ?? next

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
              )
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Créer le profil si première connexion Google
      const { data: profil } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profil) {
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
      }

      // Redirection vers la page d'origine ou /ajouter par défaut
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv    = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirect}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirect}`)
      } else {
        return NextResponse.redirect(`${origin}${redirect}`)
      }
    }
  }

  // En cas d'erreur — retour login avec message
  return NextResponse.redirect(`${origin}/login?error=auth`)
}