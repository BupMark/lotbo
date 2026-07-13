import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculerNiveau } from '../../../lib/points'
import { verifierAdmin } from '../../../lib/adminAuth'

const POINTS: Record<string, number> = {
  'evenement_approuve': 10,
  'evenement_trending':  5,
  'commenter':           2,
  'repondre':            1,
  'reaction_recue':      1,
  'partager':            3,
  'liker':               1,
  'serai_la':            5,
  'referral':           10,
  'commentaire_recu':    2,
  'like_recu':           1,
  'partage_recu':        3,
  'evenement_signale':  -5,
  'evenement_rejete':  -10,
}

export async function POST(request: Request) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { user_id, action, evenement_id, type_role } = await request.json() as {
    user_id: string
    action: string
    evenement_id?: string
    type_role?: 'utilisateur' | 'organisateur'
  }

  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id et action requis' }, { status: 400 })
  }

  const pts = POINTS[action]
  if (pts === undefined) {
    return NextResponse.json({ error: `Action inconnue : ${action}` }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await supabase.from('transactions_points').insert([{
    user_id,
    points:       pts,
    type:         action,
    description:  `Action : ${action}`,
    evenement_id: evenement_id || null,
  }])

  // Somme réelle depuis toutes les transactions — évite la dérive par delta
  const { data: txs } = await supabase
    .from('transactions_points')
    .select('points')
    .eq('user_id', user_id)

  const total = Math.max(0, (txs || []).reduce((s: number, t: { points: number }) => s + (t.points || 0), 0))

  const { data: profile } = await supabase
    .from('profiles')
    .select('points_utilisateur, points_organisateur')
    .eq('id', user_id)
    .single()

  const isOrga = type_role === 'organisateur'
  const update: Record<string, number | string> = {
    points_total: total,
    niveau:       calculerNiveau(total),
    updated_at:   new Date().toISOString(),
  }
  if (isOrga) {
    update.points_organisateur = Math.max(0, (profile?.points_organisateur || 0) + pts)
  } else {
    update.points_utilisateur = Math.max(0, (profile?.points_utilisateur || 0) + pts)
  }

  await supabase.from('profiles').update(update).eq('id', user_id)

  return NextResponse.json({ success: true, points_ajoutes: pts, nouveau_total: total })
}
