import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rafraîchir les cookies Supabase sur TOUTES les routes ─────────────────
  // Nécessaire pour que la session OAuth soit bien transmise après le callback
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() revalide le token côté serveur — obligatoire dans le middleware
  const { data: { user } } = await supabase.auth.getUser()

  // ── Protection /admin ────────────────────────────────────────────────────
  // /admin/engagement est un formulaire public sécurisé par token — pas de session requise
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/engagement')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // user_metadata.role est vide pour les comptes Google OAuth — lire profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? user.user_metadata?.role
    if (role !== 'admin' && role !== 'admin_enqueteur') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Protection /enquete ───────────────────────────────────────────────────
  if (pathname.startsWith('/enquete')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role ?? user.user_metadata?.role
    if (role !== 'contributeur_terrain' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
