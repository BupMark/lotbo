import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
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

  const body = await request.json() as { token?: string }
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Chercher l'invitation par token
  const { data: inv } = await supabaseAdmin
    .from('invitations_org_en_attente')
    .select('id, org_id, role, expire_le, statut')
    .eq('token', token)
    .maybeSingle()

  if (!inv) {
    return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
  }

  const invRow = inv as { id: string; org_id: string; role: string; expire_le: string; statut: string }

  if (invRow.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Cette invitation a déjà été utilisée' }, { status: 410 })
  }

  if (new Date(invRow.expire_le) < new Date()) {
    return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 })
  }

  // Récupérer le slug de l'organisation
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('slug')
    .eq('id', invRow.org_id)
    .maybeSingle()

  const orgSlug = (org as { slug: string } | null)?.slug ?? ''

  // Vérifier si déjà membre
  const { data: existing } = await supabaseAdmin
    .from('organisation_membres')
    .select('role')
    .eq('org_id', invRow.org_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('organisation_membres')
      .insert({
        org_id:    invRow.org_id,
        user_id:   user.id,
        role:      invRow.role,
        joined_at: new Date().toISOString(),
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Marquer l'invitation comme acceptée
  await supabaseAdmin
    .from('invitations_org_en_attente')
    .update({ statut: 'acceptee' })
    .eq('id', invRow.id)

  return NextResponse.json({ success: true, org_slug: orgSlug })
}
