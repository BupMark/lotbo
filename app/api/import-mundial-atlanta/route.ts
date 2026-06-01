// SC-MONDIAL-FIFA-2 S3 — Événements autour de la Coupe du Monde 2026 · Atlanta, GA
// ⚠️ FORMULATION : "Événements à Atlanta pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : atlantafwc26.com, poncecitymarket.com,
//   beltline.org, thebatteryatlanta.com, midtownatl.com)
// Période couverte : 14 juin → 4 juillet 2026 (6 matchs, fan fest 16-17 jours select)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Atlanta, GA
const LIEUX_ATLANTA: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Centennial Olympic Park — Atlanta':  { latitude: 33.7600, longitude: -84.3925, adresse: '265 Park Ave W NW', ville: 'Atlanta', pays: 'USA' },
  'Mercedes-Benz Stadium':              { latitude: 33.7553, longitude: -84.4007, adresse: '1 AMB Drive NW', ville: 'Atlanta', pays: 'USA' },
  'Georgia Aquarium':                   { latitude: 33.7634, longitude: -84.3951, adresse: '225 Baker Street NW', ville: 'Atlanta', pays: 'USA' },
  'Ponce City Market':                  { latitude: 33.7726, longitude: -84.3660, adresse: '675 Ponce De Leon Ave NE', ville: 'Atlanta', pays: 'USA' },
  'Little Five Points — Atlanta':       { latitude: 33.7604, longitude: -84.3488, adresse: 'Moreland Avenue', ville: 'Atlanta', pays: 'USA' },
  'Sweet Auburn District':              { latitude: 33.7554, longitude: -84.3769, adresse: 'Auburn Avenue NE', ville: 'Atlanta', pays: 'USA' },
  'Midtown Atlanta':                    { latitude: 33.7840, longitude: -84.3832, adresse: 'Peachtree Street NE', ville: 'Atlanta', pays: 'USA' },
  'College Football Hall of Fame':      { latitude: 33.7572, longitude: -84.3920, adresse: '250 Marietta Street NW', ville: 'Atlanta', pays: 'USA' },
  'The Battery Atlanta':                { latitude: 33.8902, longitude: -84.4680, adresse: '800 Battery Avenue SE', ville: 'Atlanta', pays: 'USA' },
  'BeltLine — Eastside Trail':          { latitude: 33.7630, longitude: -84.3640, adresse: 'Irwin Street NE', ville: 'Atlanta', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_ATLANTA
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — ATLANTA · FIFA WORLD CUP 2026 PERIOD
// Sources : atlantafwc26.com · poncecitymarket.com · beltline.org
//           thebatteryatlanta.com · midtownatl.com · cfbhall.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_ATLANTA_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-atlanta-centennial-park-fan-festival',
    titre: 'FIFA Fan Festival™ Atlanta — Centennial Olympic Park',
    description: 'Le FIFA Fan Festival officiel d\'Atlanta s\'installe au Centennial Olympic Park, le parc qui accueillit les Jeux Olympiques d\'Atlanta en 1996 — un cadre chargé d\'histoire sportive mondiale. Retransmissions live, musique, gastronomie et programmation culturelle pendant 16-17 jours sélectionnés du tournoi. Entrée libre, adjacente au Georgia Aquarium (le plus grand aquarium du monde occidental) et au World of Coca-Cola.',
    lieu_key: 'Centennial Olympic Park — Atlanta',
    date_debut: '2026-06-14T10:00:00',
    date_fin: '2026-07-04T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.atlantafwc26.com',
  },

  // ── QUARTIERS & LIEUX ─────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-atlanta-ponce-city-market',
    titre: 'Ponce City Market — World Cup Watch Parties & Rooftop',
    description: 'L\'emblématique Ponce City Market, installé dans l\'ancienne centrale Sears d\'Atlanta (1927), programme des watch parties sur son rooftop spectaculaire et dans ses espaces communs pendant la Coupe du Monde. Food hall international au rez-de-chaussée, bars et restaurants sur plusieurs niveaux, vue panoramique à 360° sur Atlanta depuis le Roof, où l\'on retrouve également un mini-golf et des manèges vintage.',
    lieu_key: 'Ponce City Market',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-04T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.poncecitymarket.com',
  },
  {
    source_id: 'mundial2026-atlanta-beltline-worldcup',
    titre: 'Atlanta BeltLine — Summer Programming & World Cup Vibes',
    description: 'L\'Atlanta BeltLine, réseau de 35 km de sentiers et d\'espaces verts qui relie 45 quartiers d\'Atlanta le long d\'anciennes voies ferrées, programme des événements estivaux, des pop-up markets, des installations artistiques et des animations pendant la Coupe du Monde. Le projet urbain le plus transformateur et le plus inclusif d\'Atlanta — entièrement gratuit, accessible à pied, à vélo ou en trottinette.',
    lieu_key: 'BeltLine — Eastside Trail',
    date_debut: '2026-06-14T08:00:00',
    date_fin: '2026-07-04T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.beltline.org',
  },
  {
    source_id: 'mundial2026-atlanta-battery-worldcup',
    titre: 'The Battery Atlanta — World Cup Fan Zone (Truist Park area)',
    description: 'The Battery Atlanta, le complexe de divertissement construit autour du Truist Park (domicile des Atlanta Braves, MLB), programme des watch parties, des concerts et des animations pendant la Coupe du Monde. Restaurants, bars, bowling, cinéma et activités pour tous les âges à 20 minutes du Mercedes-Benz Stadium. Une alternative festive et familiale au Fan Festival officiel du centre-ville.',
    lieu_key: 'The Battery Atlanta',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-04T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.thebatteryatlanta.com',
  },
  {
    source_id: 'mundial2026-atlanta-midtown-summer-events',
    titre: 'Midtown Atlanta — Summer Events & Arts',
    description: 'Midtown Atlanta, quartier culturel de la ville qui abrite le High Museum of Art, le Fox Theatre, le Woodruff Arts Center et le campus de Georgia Tech, programme des événements estivaux et culturels pendant la Coupe du Monde. Des dizaines de restaurants proposant des cuisines du monde entier, des bars branchés sur Peachtree Street et des venues culturelles animant la saison footballistique dans le poumon artistique d\'Atlanta.',
    lieu_key: 'Midtown Atlanta',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-04T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.midtownatl.com',
  },
  {
    source_id: 'mundial2026-atlanta-sweet-auburn-worldcup',
    titre: 'Sweet Auburn District — World Cup Community Celebrations',
    description: 'Le Historic Sweet Auburn District, berceau du mouvement des droits civiques américains et quartier natal de Martin Luther King Jr., programme des événements communautaires et des watch parties pendant la Coupe du Monde. La Martin Luther King Jr. National Historic Site, Ebenezer Baptist Church et les commerces locaux d\'Auburn Avenue s\'associent pour une célébration inclusive et historiquement significative du football mondial à Atlanta.',
    lieu_key: 'Sweet Auburn District',
    date_debut: '2026-06-14T14:00:00',
    date_fin: '2026-07-04T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sweetauburn.com',
  },
  {
    source_id: 'mundial2026-atlanta-college-football-hof',
    titre: 'College Football Hall of Fame — World Cup Crossover Experience',
    description: 'Le College Football Hall of Fame, installé à deux pâtés de maisons du Centennial Park et du fan festival, programme des activations spéciales pendant la Coupe du Monde. Exposition thématique sur les intersections entre le football américain et le soccer mondial, expériences immersives en réalité augmentée, et événements éducatifs qui racontent l\'histoire des deux sports les plus populaires aux États-Unis.',
    lieu_key: 'College Football Hall of Fame',
    date_debut: '2026-06-14T10:00:00',
    date_fin: '2026-07-04T20:00:00',
    categorie: 'Foire/Exposition',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.cfbhall.com',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const evt of EVENEMENTS_ATLANTA_MUNDIAL) {
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

      const lieuData = LIEUX_ATLANTA[evt.lieu_key]
      if (!lieuData) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'lieu inconnu' })
        continue
      }

      const { error } = await supabase.from('evenements').insert([{
        titre: evt.titre,
        lieu: evt.lieu_key,
        ville: lieuData.ville,
        pays: lieuData.pays,
        latitude: lieuData.latitude,
        longitude: lieuData.longitude,
        date_debut: evt.date_debut,
        date_fin: evt.date_fin,
        date: evt.date_debut,
        description: evt.description,
        categorie: evt.categorie,
        statut: 'publié',
        source: 'mundial_2026',
        source_id: evt.source_id,
        acces: evt.acces,
        prix: evt.prix,
        lien: evt.lien,
        ...(evt.image_url ? { image_url: evt.image_url } : {}),
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
      ville: 'Atlanta',
      total: EVENEMENTS_ATLANTA_MUNDIAL.length,
      imported,
      skipped,
      periode: '14 juin – 4 juillet 2026 (6 matchs, fan fest 16-17 jours select)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
