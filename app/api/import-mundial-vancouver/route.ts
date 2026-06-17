// SC-MONDIAL-FIFA-2 S4 — Événements autour de la Coupe du Monde 2026 · Vancouver, Canada
// ⚠️ FORMULATION : "Événements à Vancouver pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : vancouverfwc26.ca, granvilleisland.com,
//   gastown.org, pne.ca, thedrive.ca)
// Période couverte : 11 juin → 7 juillet 2026 (7 matchs + Round of 16)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Vancouver, Canada
const LIEUX_VANCOUVER: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'PNE — Hastings Park (FIFA Fan Festival)':              { latitude: 49.2827, longitude: -123.0368, adresse: '2901 E Hastings Street', ville: 'Vancouver', pays: 'Canada' },
  'BC Place Stadium':                                     { latitude: 49.2777, longitude: -123.1116, adresse: '777 Pacific Blvd', ville: 'Vancouver', pays: 'Canada' },
  'Granville Island':                                     { latitude: 49.2712, longitude: -123.1339, adresse: '1661 Duranleau Street', ville: 'Vancouver', pays: 'Canada' },
  'Granville Street Pedestrian Zone':                     { latitude: 49.2802, longitude: -123.1214, adresse: 'Granville Street', ville: 'Vancouver', pays: 'Canada' },
  'Canada Soccer House — The Shipyards North Vancouver':  { latitude: 49.3098, longitude: -123.0804, adresse: '125 Victory Ship Way', ville: 'North Vancouver', pays: 'Canada' },
  'Gastown — Water Street':                               { latitude: 49.2839, longitude: -123.1075, adresse: 'Water Street', ville: 'Vancouver', pays: 'Canada' },
  'English Bay Beach':                                    { latitude: 49.2863, longitude: -123.1432, adresse: 'Beach Avenue', ville: 'Vancouver', pays: 'Canada' },
  'Stanley Park':                                         { latitude: 49.3043, longitude: -123.1443, adresse: 'Stanley Park Drive', ville: 'Vancouver', pays: 'Canada' },
  'Robson Square':                                        { latitude: 49.2823, longitude: -123.1215, adresse: '800 Robson Street', ville: 'Vancouver', pays: 'Canada' },
  'Commercial Drive':                                     { latitude: 49.2681, longitude: -123.0710, adresse: 'Commercial Drive', ville: 'Vancouver', pays: 'Canada' },
  'Vancouver Marriott Pinnacle — Fan Zone':               { latitude: 49.2880, longitude: -123.1227, adresse: '1128 W Hastings Street', ville: 'Vancouver', pays: 'Canada' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_VANCOUVER
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — VANCOUVER · FIFA WORLD CUP 2026 PERIOD
// Sources : vancouverfwc26.ca · granvilleisland.com · gastown.org
//           pne.ca · thedrive.ca · vancouver.ca
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_VANCOUVER_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-vancouver-pne-fan-festival',
    titre: 'FIFA Fan Festival™ Vancouver — PNE Hastings Park (39 jours, 25 000/jour)',
    description: 'Le FIFA Fan Festival le plus impressionnant du Canada transforme le légendaire PNE (Pacific National Exhibition) en hub mondial du football pendant 39 jours consécutifs. Amphithéâtre Freedom Mobile Arch de 10 000 places, 28 jours de concerts live avec plus de 60 performances gratuites au Park Stage et des concerts ticketés à l\'amphithéâtre principal. Écrans géants pour toutes les retransmissions, gastronomie internationale, programmation culturelle et activations interactives. Jusqu\'à 25 000 visiteurs par jour de match. Entrée au site gratuite (11 juin – 19 juillet 2026).',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },

  // ── CONCERTS AU PNE ──────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-vancouver-concert-motley-crue-pne',
    titre: 'Mötley Crüe + Finger Eleven + Toque — FIFA Fan Festival Concert · PNE',
    description: 'Concert signature à l\'amphithéâtre Freedom Mobile Arch du PNE. Mötley Crüe, les légendes du glam metal américain, headlinent le plus grand show rock du FIFA Fan Festival Vancouver, avec Finger Eleven (rock canadien) et Toque en support. Un événement ticketé qui mêle l\'esprit rock and roll et la ferveur de la Coupe du Monde. Le show le plus attendu du festival à Vancouver. 12 juillet 2026.',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-07-12T19:00:00',
    date_fin: '2026-07-12T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },
  {
    source_id: 'mundial2026-vancouver-concert-kx5-deadmau5-kaskade',
    titre: 'Kx5 (Kaskade & Deadmau5) — FIFA Fan Festival Concert · PNE Vancouver',
    description: 'Concert électronique événement à l\'amphithéâtre du PNE, co-headliné par Kx5 — le projet collaboratif qui réunit Kaskade (DJ américain) et Deadmau5 (Joel Zimmerman, producteur et DJ canadien légendaire originaire de Niagara Falls). Un show de musique électronique de premier plan, avec des invités spéciaux. L\'événement électronique le plus attendu de l\'été 2026 au Canada. Concert ticketé. 17 juillet 2026.',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-07-17T20:00:00',
    date_fin: '2026-07-18T01:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },
  {
    source_id: 'mundial2026-vancouver-concert-kaytranada-finale',
    titre: 'Kaytranada — FIFA Fan Festival Closing Concert · PNE Vancouver (19 juillet)',
    description: 'Kaytranada (Louis Kevin Celestin), DJ et producteur canadien d\'origine haïtienne originaire de Montréal, star mondiale de la house et de l\'électronique, clôture le FIFA Fan Festival de Vancouver le 19 juillet — le soir même de la grande finale de la Coupe du Monde 2026. Une soirée de clôture historique qui mêle le football mondial et la scène musicale canadienne dans le plus grand festival du pays. Concert ticketé.',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-07-19T20:00:00',
    date_fin: '2026-07-20T01:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },
  {
    source_id: 'mundial2026-vancouver-concert-metric-pne',
    titre: 'Metric — FIFA Fan Festival Concert · PNE Vancouver',
    description: 'Le groupe rock canadien Metric — Emily Haines, James Shaw, Josh Winstead et Joules Scott — icônes de la scène indie et alternative canadienne depuis 2003, se produit au Park Stage du PNE dans le cadre du FIFA Fan Festival. Un concert gratuit inclus dans l\'accès au festival, pour les amoureux du rock canadien en plein air. 26 juin 2026.',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-06-26T20:00:00',
    date_fin: '2026-06-26T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },
  {
    source_id: 'mundial2026-vancouver-concert-ziggy-marley-pne',
    titre: 'Ziggy Marley — FIFA Fan Festival Concert · PNE Vancouver',
    description: 'Ziggy Marley, fils de Bob Marley et légende vivante du reggae mondial, se produit au FIFA Fan Festival du PNE à Vancouver. Une soirée reggae, roots et love au cœur du tournoi, résonnant profondément avec la diversité culturelle de Vancouver — l\'une des villes les plus multiculturelles du monde. Concert gratuit inclus dans l\'accès au festival. 3 juillet 2026.',
    lieu_key: 'PNE — Hastings Park (FIFA Fan Festival)',
    date_debut: '2026-07-03T20:00:00',
    date_fin: '2026-07-03T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca/fifa-fan-festival',
  },

  // ── FAN ZONES & QUARTIERS ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-vancouver-granville-island-viewing',
    titre: 'Granville Island — Free Match Viewing Zone (92 matchs sur 104)',
    description: 'Sous le pont Granville, Granville Island installe une zone de visionnage gratuite pour 92 des 104 matchs de la Coupe du Monde. Jusqu\'à 1 000 places assises, food trucks avec cuisines du monde, beer garden en plein air et zone enfants. L\'île créative de Vancouver — avec ses artisans, galeries d\'art, brasseries et le marché couvert le plus animé de la ville — offre un cadre festival-style unique pour regarder le football en bord de bras d\'eau False Creek. Gratuit.',
    lieu_key: 'Granville Island',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://granvilleisland.com',
  },
  {
    source_id: 'mundial2026-vancouver-granville-street-pedestrian',
    titre: 'Granville Street Pedestrian Zone — 5 blocs piétons FIFA World Cup 2026',
    description: 'Pour la Coupe du Monde 2026, Granville Street — le quartier de divertissement principal de Vancouver — est fermée à la circulation sur 5 blocs et transformée en zone piétonne du 11 juin au 20 juillet. Grandes terrasses qui débordent sur la rue, vendeurs de nourriture du monde entier, musique live, artistes de rue et espace de célébration à ciel ouvert. Une transformation urbaine historique : Vancouver n\'avait jamais piétonnisé Granville Street de la sorte. Gratuit.',
    lieu_key: 'Granville Street Pedestrian Zone',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-20T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouver.ca',
  },
  {
    source_id: 'mundial2026-vancouver-canada-soccer-house-shipyards',
    titre: 'Canada Soccer House — The Shipyards, North Vancouver',
    description: 'La maison officielle de Canada Soccer pour la Coupe du Monde 2026 s\'installe à The Shipyards de North Vancouver, avec une vue spectaculaire sur la skyline du centre-ville de Vancouver, les grues du port et les montagnes enneigées en arrière-plan. Watch parties pour chaque match du Canada, entertainment live et expériences fan pour célébrer le Canada à domicile. Accessible en SeaBus depuis le centre-ville de Vancouver en 12 minutes. Gratuit.',
    lieu_key: 'Canada Soccer House — The Shipyards North Vancouver',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-07T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouverfwc26.ca',
  },
  {
    source_id: 'mundial2026-vancouver-english-bay-beach',
    titre: 'English Bay Beach — World Cup Summer Celebrations',
    description: 'English Bay, la plage la plus populaire et la plus centrale de Vancouver, programme des animations estivales pendant toute la Coupe du Monde. Couchers de soleil spectaculaires sur le Pacifique avec les silhouettes des îles en arrière-plan, beach volleyball, food trucks, celebrations informelles et rassemblements communautaires. L\'endroit le plus photogénique de Vancouver pour vivre l\'été du football mondial — où les locaux viennent naturellement célébrer après les matchs du Canada.',
    lieu_key: 'English Bay Beach',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-07T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.vancouver.ca/parks-recreation-culture/english-bay-beach.aspx',
  },
  {
    source_id: 'mundial2026-vancouver-gastown-worldcup',
    titre: 'Gastown — World Cup Bar Scene & Steam Clock District',
    description: 'Gastown, le quartier historique de Vancouver fondé en 1867 et classé lieu historique national, programme des watch parties et des soirées pendant toute la Coupe du Monde. La célèbre horloge à vapeur (la seule au monde) sonne toutes les 15 minutes dans une rue animée de bars tendance et de restaurants gastronomiques installés dans des bâtiments victoriens. Bars français, ukrainiens, véganes, cocktails bars et pubs sportifs — l\'ambiance nocturne la plus authentique de Vancouver.',
    lieu_key: 'Gastown — Water Street',
    date_debut: '2026-06-11T16:00:00',
    date_fin: '2026-07-07T02:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.gastown.org',
  },
  {
    source_id: 'mundial2026-vancouver-commercial-drive-worldcup',
    titre: 'Commercial Drive — The Drive World Cup Community Celebrations',
    description: 'Commercial Drive, surnommée affectueusement "The Drive" par les Vancouvérois, est le quartier le plus multiculturel et populaire de Vancouver. Forte communauté italienne (nombreux cafés expresso depuis les années 1950), latinoaméricaine, africaine et internationale — l\'endroit parfait pour célébrer la Coupe du Monde avec des supporters du monde entier. Cafés ouverts dès l\'aube pour les matchs matinaux, terrasses animées, watch parties de quartier et ambiance festive authentique tout le long de l\'avenue.',
    lieu_key: 'Commercial Drive',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-07T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.thedrive.ca',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const evt of EVENEMENTS_VANCOUVER_MUNDIAL) {
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

      const lieuData = LIEUX_VANCOUVER[evt.lieu_key]
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
      ville: 'Vancouver',
      total: EVENEMENTS_VANCOUVER_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 7 juillet 2026 (7 matchs + Round of 16)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
