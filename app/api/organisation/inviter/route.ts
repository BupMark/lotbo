import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Vérifier que l'appelant est owner ou admin de l'org
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('id, owner_id')
    .eq('id', org_id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  const isOwner = (org as { id: string; owner_id: string }).owner_id === user.id
  if (!isOwner) {
    const { data: callerMembre } = await supabaseAdmin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!callerMembre || !['owner', 'admin'].includes((callerMembre as { role: string }).role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    // Un admin ne peut pas inviter un autre admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Seul le owner peut inviter un admin' }, { status: 403 })
    }
  }

  // Trouver l'utilisateur cible par email via auth admin
  const { data: usersResponse } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const targetUser = (usersResponse?.users ?? []).find(u => u.email === email)

  if (!targetUser) {
    return NextResponse.json({ error: 'Aucun compte avec cet email' }, { status: 404 })
  }

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

  return NextResponse.json({ message: 'Membre ajouté' })
}
