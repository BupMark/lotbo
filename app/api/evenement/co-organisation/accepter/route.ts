import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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

  const body = await request.json() as { token?: string; organisation_id_choisie?: string }
  const { token, organisation_id_choisie } = body

  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const admin = makeAdminClient()

  const { data: invitation } = await admin
    .from('invitations_co_organisateurs_en_attente')
    .select('id, evenement_id, type_cible, email, organisation_cible_id, invite_par, statut, expire_le')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
  if (invitation.statut !== 'en_attente') return NextResponse.json({ error: 'Invitation déjà utilisée' }, { status: 409 })
  if (new Date(invitation.expire_le) < new Date()) return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 })

  // Cas individu — l'utilisateur connecté devient co-organisateur, email ciblé ou non
  if (invitation.type_cible === 'utilisateur') {
    const { error: insertError } = await admin.from('evenement_co_organisateurs').insert({
      evenement_id: invitation.evenement_id,
      type_cible: 'utilisateur',
      user_id: user.id,
      invite_par: invitation.invite_par,
    })
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Tu es déjà co-organisateur de cet événement' }, { status: 409 })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Cas organisation — l'invitation cible déjà une org précise ; il faut vérifier que l'utilisateur qui accepte a les droits sur CETTE org
  if (invitation.type_cible === 'organisation') {
    const orgId = invitation.organisation_cible_id || organisation_id_choisie
    if (!orgId) return NextResponse.json({ error: 'Organisation manquante' }, { status: 400 })

    const { data: membre } = await admin
      .from('organisation_membres')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membre || !['owner', 'admin'].includes(membre.role)) {
      return NextResponse.json({ error: 'Tu dois être owner ou admin de cette organisation pour accepter' }, { status: 403 })
    }

    const { error: insertError } = await admin.from('evenement_co_organisateurs').insert({
      evenement_id: invitation.evenement_id,
      type_cible: 'organisation',
      organisation_id: orgId,
      invite_par: invitation.invite_par,
    })
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Cette organisation est déjà co-organisatrice de cet événement' }, { status: 409 })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  await admin
    .from('invitations_co_organisateurs_en_attente')
    .update({ statut: 'acceptee' })
    .eq('id', invitation.id)

  return NextResponse.json({ success: true, evenement_id: invitation.evenement_id })
}
