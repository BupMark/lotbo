import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculerNiveau } from '../../../../lib/points'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}


function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — liste tous les utilisateurs (profiles + auth.users + comptes événements)
export async function GET(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // Mode léger — count uniquement (pour le dashboard principal)
  if (searchParams.get('count') === 'true') {
    try {
      const admin = makeAdminClient()
      const { count: total } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      const { data: roles } = await admin
        .from('profiles')
        .select('role')
        .limit(2000)
      const parRole: Record<string, number> = {}
      for (const r of roles || []) {
        const role = (r as { role: string }).role || 'visiteur'
        parRole[role] = (parRole[role] || 0) + 1
      }
      return NextResponse.json({ total: total || 0, parRole })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  try {
    const admin = makeAdminClient()

    // 1. auth.users via admin API (email + last_sign_in_at + banned_until)
    const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (authErr) throw authErr

    const authMap: Record<string, { email: string; last_sign_in_at: string | null; banned_until: string | null }> = {}
    for (const u of authData.users) {
      authMap[u.id] = {
        email:            u.email ?? '',
        last_sign_in_at:  u.last_sign_in_at ?? null,
        banned_until:     (u as any).banned_until ?? null,
      }
    }

    // 2. profiles
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, nom, role, photo_url, created_at, points_total')
      .order('created_at', { ascending: false })
      .limit(2000)
    if (profErr) throw profErr

    // 3. comptes événements par user_id
    const { data: evStats } = await admin
      .from('evenements')
      .select('user_id, statut')
      .not('user_id', 'is', null)
      .limit(2000)

    const evMap: Record<string, { soumis: number; approuves: number }> = {}
    for (const ev of evStats || []) {
      if (!ev.user_id) continue
      if (!evMap[ev.user_id]) evMap[ev.user_id] = { soumis: 0, approuves: 0 }
      evMap[ev.user_id].soumis++
      if (ev.statut === 'approuve') evMap[ev.user_id].approuves++
    }

    // 4. Fusionner — on inclut tous les auth.users (pas seulement ceux avec profil)
    const allIds = new Set([
      ...authData.users.map(u => u.id),
      ...(profiles || []).map((p: any) => p.id),
    ])

    const profMap: Record<string, any> = {}
    for (const p of profiles || []) profMap[(p as any).id] = p

    const users = Array.from(allIds).map(id => {
      const auth = authMap[id]
      const prof = profMap[id]
      return {
        id,
        email:           auth?.email          ?? '',
        nom:             prof?.nom             ?? null,
        role:            prof?.role            ?? 'visiteur',
        photo_url:       prof?.photo_url       ?? null,
        points_total:    prof?.points_total    ?? 0,
        created_at:      prof?.created_at      ?? auth ? authData.users.find(u => u.id === id)?.created_at ?? '' : '',
        last_sign_in_at: auth?.last_sign_in_at ?? null,
        banned_until:    auth?.banned_until    ?? null,
        nb_soumis:       evMap[id]?.soumis     ?? 0,
        nb_approuves:    evMap[id]?.approuves  ?? 0,
      }
    }).sort((a, b) => (b.created_at > a.created_at ? 1 : -1))

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST — générer un magic link d'invitation pour un utilisateur
export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { email } = await request.json() as { email: string }
    if (!email) return NextResponse.json({ error: 'email manquant' }, { status: 400 })

    const admin = makeAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (error) throw error

    return NextResponse.json({ link: data.properties.action_link })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH — changer le rôle ou suspendre/réactiver un utilisateur
export async function PATCH(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, role, suspendu, raison } = body as { id: string; role?: string; suspendu?: boolean; raison?: string }

    if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

    const cookieStore = await cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { session } } = await supabaseUser.auth.getSession()

    const admin = makeAdminClient()

    if (role !== undefined) {
      const ROLES_VALIDES = ['visiteur', 'membre', 'contributeur', 'contributeur_terrain', 'organisateur', 'ambassadeur', 'admin']
      if (!ROLES_VALIDES.includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
      }

      const { data: profil } = await admin
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()
      const ancien_role = profil?.role ?? 'inconnu'

      // Upsert au lieu de update — crée le profil s'il n'existe pas encore
      const { error } = await admin
        .from('profiles')
        .upsert({ id, role, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error

      // Non-bloquant : admin_logs peut ne pas exister
      try {
        await admin.from('admin_logs').insert([{
          admin_id:    session?.user?.id ?? null,
          user_id:     id,
          ancien_role,
          nouveau_role: role,
          raison:      raison ?? null,
        }])
      } catch { /* table optionnelle */ }

      // Non-bloquant : roles_actifs (colonne peut ne pas exister)
      try {
        const { data: prof, error: raErr } = await admin.from('profiles').select('roles_actifs').eq('id', id).single()
        if (!raErr) {
          const current = (prof?.roles_actifs as string[] | null) || []
          if (!current.includes(role)) {
            await admin.from('profiles').update({ roles_actifs: [...current, role] }).eq('id', id)
          }
        }
      } catch { /* non-bloquant */ }

      // Non-bloquant : sync points
      try {
        const { data: txs } = await admin.from('transactions_points').select('points').eq('user_id', id)
        const total  = Math.max(0, (txs || []).reduce((s: number, t: any) => s + (t.points || 0), 0))
        const niveau = calculerNiveau(total)
        await admin.from('profiles').update({ points_total: total, niveau }).eq('id', id)
      } catch { /* non-bloquant */ }

      return NextResponse.json({ success: true })
    }

    if (suspendu !== undefined) {
      // Utilise l'API Supabase Auth Admin pour bannir/débannir
      const { error } = await admin.auth.admin.updateUserById(id, {
        ban_duration: suspendu ? '876600h' : 'none',
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
