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

  const body = await request.json() as { token?: string; reponse?: 'accepte' | 'conteste' }
  const { token, reponse } = body
  if (!token || !reponse || !['accepte', 'conteste'].includes(reponse)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const admin = makeAdminClient()

  const { data: rec } = await admin
    .from('reclamations_organisations')
    .select('id, organisation_id, reclamant_id, statut, proprietaire_reponse')
    .eq('token', token)
    .maybeSingle()

  if (!rec) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
  if (rec.statut !== 'proprietaire_notifie' || rec.proprietaire_reponse) {
    return NextResponse.json({ error: 'lien_expire' }, { status: 410 })
  }

  const { data: org } = await admin
    .from('organisations')
    .select('id, nom, owner_id')
    .eq('id', rec.organisation_id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  if (org.owner_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const now = new Date()

  if (reponse === 'accepte') {
    await admin.from('organisations').update({ owner_id: rec.reclamant_id }).eq('id', org.id)
    await admin.from('reclamations_organisations').update({
      statut: 'approuve',
      proprietaire_reponse: 'accepte',
      proprietaire_repondu_le: now.toISOString(),
      traite_le: now.toISOString(),
    }).eq('id', rec.id)

    await admin.from('notifications').insert([{
      user_id: rec.reclamant_id,
      type: 'organisation_approuve',
      titre: '🔑 Réclamation approuvée !',
      message: `Tu es maintenant propriétaire de "${org.nom}".`,
      lien: `/organisation/${org.id}`,
      lu: false,
    }])
  } else {
    const litigeExpireLe = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    await admin.from('organisations').update({
      suspendue: true,
      suspendue_le: now.toISOString(),
      suspendue_raison: 'litige_claim',
    }).eq('id', org.id)

    await admin.from('reclamations_organisations').update({
      statut: 'litige',
      proprietaire_reponse: 'conteste',
      proprietaire_repondu_le: now.toISOString(),
      litige_expire_le: litigeExpireLe.toISOString(),
    }).eq('id', rec.id)

    await admin.from('notifications').insert([{
      user_id: rec.reclamant_id,
      type: 'organisation_litige',
      titre: 'Ta réclamation est contestée',
      message: `Le propriétaire actuel de "${org.nom}" conteste ta demande. La page est suspendue pendant l'examen.`,
      lien: null,
      lu: false,
    }])
  }

  return NextResponse.json({ success: true, reponse })
}
