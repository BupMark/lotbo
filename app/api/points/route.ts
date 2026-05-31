import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculerNiveau } from '../../../lib/points'

// ── Table des points par action ───────────────────────────────────────────────
const POINTS: Record<string, number> = {
  // GM1 — Utilisateur
  'commenter':           2,
  'repondre':            1,
  'reaction_recue':      1,
  'partager':            3,
  'liker':               1,
  'favoris':             1,
  'serai_la':            5,
  'referral':           10,
  // GM2 — Organisateur
  'evenement_approuve': 10,
  'evenement_trending':  5,
  'commentaire_recu':    2,
  'like_recu':           1,
  'partage_recu':        3,
  'evenement_signale':  -5,
  'evenement_rejete':  -10,
}

const NIVEAU_LABELS: Record<string, { emoji: string; label: string }> = {
  'decouvreur':       { emoji: '🌱', label: 'Découvreur' },
  'actif':            { emoji: '🔥', label: 'Actif' },
  'contributeur':     { emoji: '⭐', label: 'Contributeur' },
  'top_contributeur': { emoji: '🏅', label: 'Top Contributeur' },
  'elite':            { emoji: '🥇', label: 'Élite' },
  'legende':          { emoji: '👑', label: 'Légende LOTBO' },
}

// ── Vérifier accès — secret interne OU token Supabase ────────────────────────
async function verifierAcces(request: Request): Promise<{ ok: boolean; userId?: string }> {
  // Option 1 : secret interne (appels serveur-à-serveur)
  const secret = request.headers.get('x-internal-secret')
  if (secret === process.env.INTERNAL_API_SECRET) {
    return { ok: true }
  }

  // Option 2 : token Supabase utilisateur connecté (appels frontend)
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const token = auth.replace('Bearer ', '')
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabaseAnon.auth.getUser(token)
    if (user) return { ok: true, userId: user.id }
  }

  return { ok: false }
}

export async function POST(request: Request) {
  const acces = await verifierAcces(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { user_id, action, evenement_id, type_role } = await request.json()

    // Si appel frontend, utiliser l'userId du token
    const userId = user_id || acces.userId
    if (!userId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const pts = POINTS[action]
    if (pts === undefined) {
      return NextResponse.json({ error: `Action inconnue : ${action}` }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Enregistrer la transaction
    await supabase.from('transactions_points').insert([{
      user_id: userId,
      points: pts,
      type: action,
      description: `Action : ${action}`,
      evenement_id: evenement_id || null,
    }])

    // 2. Récupérer le profil actuel
    const { data: profile } = await supabase
      .from('profiles')
      .select('points_utilisateur, points_organisateur, points_total, niveau, role')
      .eq('id', userId)
      .single()

    // 3. Recalculer le total depuis les transactions (source de vérité)
    const { data: txs } = await supabase
      .from('transactions_points')
      .select('points')
      .eq('user_id', userId)
    const nouveauTotal = Math.max(0, (txs || []).reduce((s: number, t: { points: number }) => s + (t.points || 0), 0))

    // 4. Mettre à jour les points selon le rôle (silos conservés pour le classement)
    const isOrga = type_role === 'organisateur'
    const update: Record<string, number | string> = {
      points_total: nouveauTotal,
    }

    if (isOrga) {
      update.points_organisateur = Math.max(0, (profile?.points_organisateur || 0) + pts)
    } else {
      update.points_utilisateur  = Math.max(0, (profile?.points_utilisateur  || 0) + pts)
    }

    // 5. Calculer le nouveau niveau
    const nouveauNiveau = calculerNiveau(update.points_total as number)
    update.niveau = nouveauNiveau

    // 5b. Promotion automatique membre → contributeur à la première action
    const roleActuel = (profile as any)?.role ?? 'membre'
    if (roleActuel === 'membre' || roleActuel === 'visiteur') {
      update.role = 'contributeur'
    }

    await supabase.from('profiles').upsert({
      id: userId,
      ...update,
      updated_at: new Date().toISOString(),
    })

    // 6. Détecter montée de niveau
    const ancienNiveau = profile?.niveau || 'decouvreur'
    const niveauChange = ancienNiveau !== nouveauNiveau

    return NextResponse.json({
      success:        true,
      points_ajoutes: pts,
      nouveau_total:  update.points_total,
      niveau:         nouveauNiveau,
      niveau_label:   NIVEAU_LABELS[nouveauNiveau],
      niveau_change:  niveauChange,
      ancien_niveau:  ancienNiveau,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET — Récupérer les points d'un utilisateur
export async function GET(request: Request) {
  const acces = await verifierAcces(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'user_id manquant' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('points_utilisateur, points_organisateur, points_total, niveau')
    .eq('id', user_id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions_points')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    points_utilisateur:  profile?.points_utilisateur  || 0,
    points_organisateur: profile?.points_organisateur || 0,
    points_total:        profile?.points_total        || 0,
    niveau:              profile?.niveau              || 'decouvreur',
    niveau_label:        NIVEAU_LABELS[profile?.niveau || 'decouvreur'],
    transactions:        transactions || [],
  })
}