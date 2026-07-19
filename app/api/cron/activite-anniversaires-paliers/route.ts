import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const PALIERS: [string, number][] = [
  ['1_mois', 1], ['3_mois', 3], ['6_mois', 6],
  ['1_an', 12], ['2_ans', 24], ['5_ans', 60],
]

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = makeAdminClient()
  const now = new Date()
  let paliersLogges = 0
  let anniversairesLogges = 0
  const erreurs: string[] = []

  // ── 1. Paliers d'ancienneté ──────────────────────────────────────
  const { data: profils } = await admin
    .from('profiles')
    .select('id, created_at, visible_ansanm')
    .eq('visible_ansanm', true)
    .limit(2000)

  for (const p of profils || []) {
    try {
      const moisEcoules = Math.floor(
        (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      const palierAtteint = PALIERS.find(([, mois]) => mois === moisEcoules)
      if (!palierAtteint) continue

      const { data: dejaNotifie } = await admin
        .from('paliers_anciennete_notifies')
        .select('user_id')
        .eq('user_id', p.id)
        .eq('palier', palierAtteint[0])
        .maybeSingle()
      if (dejaNotifie) continue

      await admin.from('activite_communautaire').insert([{
        type: 'palier_anciennete',
        user_id: p.id,
        ville: null,
        contenu: { palier: palierAtteint[0], date_inscription: p.created_at },
      }])
      await admin.from('paliers_anciennete_notifies').insert([{ user_id: p.id, palier: palierAtteint[0] }])
      paliersLogges++
    } catch (e) {
      erreurs.push(`palier ${p.id}: ${String(e)}`)
    }
  }

  // ── 2. Anniversaires ──────────────────────────────────────────────
  const moisJour = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: profilsAnniv } = await admin
    .from('profiles')
    .select('id, date_naissance, anniversaire_public, anniversaire_visibilite, visible_ansanm')
    .not('date_naissance', 'is', null)
    .eq('anniversaire_public', true)
    .eq('visible_ansanm', true)
    .limit(2000)

  for (const p of profilsAnniv || []) {
    try {
      const dateAnniv = new Date(p.date_naissance)
      const moisJourAnniv = `${String(dateAnniv.getMonth() + 1).padStart(2, '0')}-${String(dateAnniv.getDate()).padStart(2, '0')}`
      if (moisJourAnniv !== moisJour) continue

      const contenu: Record<string, unknown> = { type: 'naissance' }
      // L'âge n'est révélé que si l'utilisateur a choisi d'afficher l'année —
      // sinon on respecte son choix de visibilité 'mois' (pas de fuite d'âge)
      if (p.anniversaire_visibilite === 'annee' || p.anniversaire_visibilite === 'complet') {
        contenu.palier_annees = now.getFullYear() - dateAnniv.getFullYear()
      }

      await admin.from('activite_communautaire').insert([{
        type: 'anniversaire',
        user_id: p.id,
        ville: null,
        contenu,
      }])
      anniversairesLogges++
    } catch (e) {
      erreurs.push(`anniversaire ${p.id}: ${String(e)}`)
    }
  }

  return NextResponse.json({ success: true, paliersLogges, anniversairesLogges, erreurs })
}
