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

const SEUIL_ELIGIBILITE = 20

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = makeAdminClient()
  const aujourd_hui = new Date().toISOString().split('T')[0]

  try {
    // Événements en cours + à venir uniquement (jamais les événements passés)
    const { data: evs, error } = await admin
      .from('evenements')
      .select('ville, pays')
      .eq('statut', 'approuve')
      .not('ville', 'is', null)
      .or(`and(date_fin.not.is.null,date_fin.gte.${aujourd_hui}),and(date_fin.is.null,date_debut.gte.${aujourd_hui})`)
      // db-max-rows Supabase relevé à 5000 pour ce projet (voir
      // CLAUDE.md) — 1048 événements éligibles constatés le 25/07/2026,
      // marge confortable conservée si la plateforme continue de croître.
      .limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const villesCount: Record<string, { count: number; pays: string | null }> = {}
    for (const e of evs || []) {
      if (!e.ville) continue
      if (!villesCount[e.ville]) villesCount[e.ville] = { count: 0, pays: e.pays }
      villesCount[e.ville].count++
    }

    const classement = Object.entries(villesCount)
      .map(([ville, { count, pays }]) => ({ ville, pays, count }))
      .filter(v => v.count >= SEUIL_ELIGIBILITE)
      .sort((a, b) => b.count - a.count)

    if (classement.length === 0) {
      return NextResponse.json({ success: true, changement: false, raison: 'aucune ville éligible' })
    }

    const nouveauTop = classement[0]

    const { data: derniereLigne } = await admin
      .from('classement_villes_historique')
      .select('ville, nb_evenements')
      .order('devenue_top_le', { ascending: false })
      .limit(1)
      .maybeSingle()

    const changement = !derniereLigne || derniereLigne.ville !== nouveauTop.ville

    if (!changement) {
      return NextResponse.json({ success: true, changement: false, ville_actuelle: nouveauTop.ville })
    }

    await admin.from('classement_villes_historique').insert([{
      ville: nouveauTop.ville,
      pays: nouveauTop.pays,
      nb_evenements: nouveauTop.count,
    }])

    // Signal Ansanm — badge nav, réutilise activite_communautaire
    await admin.from('activite_communautaire').insert([{
      type: 'ville_top_changee',
      user_id: null,
      ville: nouveauTop.ville,
      contenu: { ville: nouveauTop.ville, pays: nouveauTop.pays, nb_evenements: nouveauTop.count },
    }])

    // TODO Phase 4 : notification ciblée notif_classement_ville aux
    // utilisateurs géolocalisés sur nouveauTop.ville

    return NextResponse.json({
      success: true,
      changement: true,
      nouvelle_ville_top: nouveauTop.ville,
      ancienne_ville_top: derniereLigne?.ville || null,
      nb_evenements: nouveauTop.count,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
