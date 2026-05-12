import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Protéger uniquement /admin ────────────────────────────────────────────
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── Créer le client Supabase SSR (Edge compatible) ────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── Vérifier la session ───────────────────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession()

  // Pas de session → rediriger vers /login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/admin')
    return NextResponse.redirect(loginUrl)
  }

  // Session présente mais pas admin → rediriger vers /
  const role = session.user.user_metadata?.role
  if (role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Admin confirmé → laisser passer ──────────────────────────────────────
  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
