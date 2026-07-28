import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const admin = makeAdminClient()
  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' })
  const dateIl7j = new Date()
  dateIl7j.setDate(dateIl7j.getDate() - 7)
  const il7j = dateIl7j.toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' })

  try {
    const { data: candidats, error } = await admin
      .from('evenements')
      .select('id, titre, ville, pays, lieu, image_url, categorie, date_debut, date_fin')
      .eq('statut', 'approuve')
      .gte('date_debut', il7j)
      .lte('date_debut', aujourdhui)
      .or(`date_fin.gte.${aujourdhui},date_fin.is.null`)
      .limit(2000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!candidats || candidats.length === 0) {
      return NextResponse.json({ evenement: null })
    }

    const ids = candidats.map(e => e.id)

    const [favoris, participations, commentaires, vues, partages] = await Promise.all([
      admin.from('favoris').select('evenement_id').in('evenement_id', ids),
      admin.from('participations').select('evenement_id').in('evenement_id', ids),
      admin.from('commentaires').select('evenement_id, nb_likes').in('evenement_id', ids),
      admin.from('vues_evenements').select('evenement_id').in('evenement_id', ids),
      admin.from('partages_evenements').select('evenement_id').in('evenement_id', ids),
    ])

    const compter = (rows: { evenement_id: string }[] | null) => {
      const map: Record<string, number> = {}
      for (const r of rows || []) map[r.evenement_id] = (map[r.evenement_id] || 0) + 1
      return map
    }

    const favorisMap = compter(favoris.data as { evenement_id: string }[] | null)
    const participationsMap = compter(participations.data as { evenement_id: string }[] | null)
    const vuesMap = compter(vues.data as { evenement_id: string }[] | null)
    const partagesMap = compter(partages.data as { evenement_id: string }[] | null)

    const commentairesMap: Record<string, number> = {}
    const likesMap: Record<string, number> = {}
    for (const c of (commentaires.data || []) as { evenement_id: string; nb_likes: number | null }[]) {
      commentairesMap[c.evenement_id] = (commentairesMap[c.evenement_id] || 0) + 1
      likesMap[c.evenement_id] = (likesMap[c.evenement_id] || 0) + (c.nb_likes || 0)
    }

    let meilleur: { ev: typeof candidats[number]; score: number } | null = null

    for (const ev of candidats) {
      const score =
        (favorisMap[ev.id] || 0) * 2 +
        (partagesMap[ev.id] || 0) * 2 +
        (participationsMap[ev.id] || 0) +
        (commentairesMap[ev.id] || 0) +
        (vuesMap[ev.id] || 0) +
        (likesMap[ev.id] || 0)

      if (score > 0 && (!meilleur || score > meilleur.score)) {
        meilleur = { ev, score }
      }
    }

    if (!meilleur) {
      return NextResponse.json({ evenement: null })
    }

    return NextResponse.json({
      evenement: {
        id: meilleur.ev.id,
        titre: meilleur.ev.titre,
        ville: meilleur.ev.ville,
        pays: meilleur.ev.pays,
        lieu: meilleur.ev.lieu,
        image_url: meilleur.ev.image_url,
        categorie: meilleur.ev.categorie,
      },
      score: meilleur.score,
    }, {
      headers: { 'Cache-Control': 'public, max-age=600' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
