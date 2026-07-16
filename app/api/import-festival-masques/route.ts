// Importateur Festival des Masques — Porto-Novo, Bénin
// Architecture : données curées (pas de scraping HTML fragile)
// Source vérifiée : festivaldesmasques.bj
// robots.txt : 404 (inexistant) → aucune restriction déclarée
// Un seul événement représente le festival dans son ensemble
// (pas une ligne par activité — trop de granularité pour peu de valeur)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

interface EvenementFestivalMasques {
  source_id: string
  titre: string
  description: string
  ville: string
  pays: string
  latitude: number
  longitude: number
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
}

const EVENEMENTS_FESTIVAL_MASQUES: EvenementFestivalMasques[] = [
  {
    source_id: 'festival-masques-2026',
    titre: 'Festival des Masques — Porto-Novo',
    description: 'Le Festival des Masques réunit à Porto-Novo colloque scientifique, animations de masques sacrés et profanes, village des festivités et concerts. Lieux clés : Boulevard lagunaire, Place Lokossa, Place Migan. Entrée libre et gratuite sur tous les sites.',
    ville: 'Porto-Novo',
    pays: 'Bénin',
    latitude: 6.4779,
    longitude: 2.6323,
    date_debut: '2026-07-25',
    date_fin: '2026-07-26',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://festivaldesmasques.bj/programme/',
  },
]

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  // ── Instanciation DANS la fonction — jamais au niveau racine ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const evt of EVENEMENTS_FESTIVAL_MASQUES) {
      // 1. Filtre anti-réimport suppression
      const bloquee = await estSourceBloquee(supabase, 'festival_masques', evt.source_id)
      if (bloquee) { skipped++; continue }

      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source_id', evt.source_id)
        .maybeSingle()

      if (existing) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'déjà importé' })
        continue
      }

      // 2. Insertion
      const { error } = await supabase.from('evenements').insert([{
        titre: evt.titre,
        lieu: evt.ville,
        ville: evt.ville,
        pays: evt.pays,
        latitude: evt.latitude,
        longitude: evt.longitude,
        date_debut: evt.date_debut,
        date_fin: evt.date_fin,
        description: evt.description,
        categorie: evt.categorie,
        statut: 'publié',
        source: 'festival_masques',
        source_id: evt.source_id,
        date: evt.date_debut,
        acces: evt.acces,
        prix: evt.prix,
        lien: evt.lien,
      }])

      if (error) {
        skipped++
        results.push({ titre: evt.titre, statut: 'erreur', raison: error.message })
      } else {
        imported++
        results.push({ titre: evt.titre, statut: 'importé' })
      }
    }

    return NextResponse.json({
      success: true,
      total: EVENEMENTS_FESTIVAL_MASQUES.length,
      imported,
      skipped,
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
