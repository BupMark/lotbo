// SC-MONDIAL-FIFA-2 S4 — Événements autour de la Coupe du Monde 2026 · Toronto, Canada
// ⚠️ FORMULATION : "Événements à Toronto pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : toronto.ca/fifa-world-cup-26,
//   harbourfrontcentre.com, bloor-yorkville.com, batashoemuseum.ca, stacktmarket.com)
// Thème officiel Toronto : "The World in a City"
// Période couverte : 11 juin → 2 juillet 2026 (6 matchs + Round of 32)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Toronto, Canada
const LIEUX_TORONTO: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Fort York & The Bentway':                      { latitude: 43.6381, longitude: -79.4030, adresse: '250 Fort York Blvd', ville: 'Toronto', pays: 'Canada' },
  'BMO Field — Toronto Stadium':                  { latitude: 43.6333, longitude: -79.4188, adresse: '170 Princes\' Blvd', ville: 'Toronto', pays: 'Canada' },
  'STACKT Market':                                { latitude: 43.6388, longitude: -79.3991, adresse: '28 Bathurst Street', ville: 'Toronto', pays: 'Canada' },
  'Harbourfront Centre':                          { latitude: 43.6387, longitude: -79.3817, adresse: '235 Queens Quay W', ville: 'Toronto', pays: 'Canada' },
  'Bloor-Yorkville — Village Park':               { latitude: 43.6705, longitude: -79.3940, adresse: '4 Cumberland Street', ville: 'Toronto', pays: 'Canada' },
  'Distillery District':                          { latitude: 43.6503, longitude: -79.3594, adresse: '55 Mill Street', ville: 'Toronto', pays: 'Canada' },
  'Kensington Market':                            { latitude: 43.6549, longitude: -79.4007, adresse: 'Augusta Avenue', ville: 'Toronto', pays: 'Canada' },
  'CN Tower — Ripley\'s Aquarium':               { latitude: 43.6426, longitude: -79.3871, adresse: '290 Bremner Blvd', ville: 'Toronto', pays: 'Canada' },
  'Rogers Centre':                                { latitude: 43.6414, longitude: -79.3894, adresse: '1 Blue Jays Way', ville: 'Toronto', pays: 'Canada' },
  'Scotiabank Arena':                             { latitude: 43.6435, longitude: -79.3791, adresse: '40 Bay Street', ville: 'Toronto', pays: 'Canada' },
  'Riverside & Leslieville — Queen Street East':  { latitude: 43.6571, longitude: -79.3433, adresse: 'Queen Street E', ville: 'Toronto', pays: 'Canada' },
  'Bata Shoe Museum':                             { latitude: 43.6681, longitude: -79.3988, adresse: '327 Bloor Street W', ville: 'Toronto', pays: 'Canada' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_TORONTO
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — TORONTO · FIFA WORLD CUP 2026 PERIOD
// Sources : toronto.ca/fifa-world-cup-26 · harbourfrontcentre.com
//           bloor-yorkville.com · batashoemuseum.ca · stacktmarket.com
//           thedistillerydistrict.com · kensington-market.ca
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_TORONTO_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-toronto-fort-york-fan-festival',
    titre: 'FIFA Fan Festival™ Toronto — Fort York & The Bentway (22 jours)',
    description: 'Le FIFA Fan Festival officiel de Toronto s\'installe au site historique Fort York combiné à The Bentway, l\'espace public sous l\'autoroute Gardiner — un lieu urbain unique au Canada. 22 jours de festival sur les jours de match, du 11 juin au 19 juillet. Retransmissions live, performances culturelles reflétant le thème "The World in a City", installations interactives et gastronomie locale. Pièce maîtresse : un mini-terrain de soccer créé par l\'artiste autochtone Alanah Jewel. Tkaronto Market avec vendeurs autochtones et artisans. Admission gratuite — billet numérique en avance requis. Environ 500 billets par jour réservés aux organisations communautaires.',
    lieu_key: 'Fort York & The Bentway',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.toronto.ca/explore-enjoy/festivals-events/fifa-world-cup-26/',
  },

  // ── ACTIVATIONS OFFICIELLES ───────────────────────────────────────────────

  {
    source_id: 'mundial2026-toronto-stackt-adidas-home-soccer',
    titre: 'Adidas Home of Soccer — STACKT Market Toronto',
    description: 'L\'activation officielle Adidas pour la Coupe du Monde 2026 au Canada s\'installe au STACKT Market, le marché de conteneurs maritimes le plus original de Toronto. Espace de watch parties en plein air, activations interactives Adidas, boutique pop-up en édition limitée et ambiance football mondiale pendant tout le tournoi. Admission entièrement gratuite — jusqu\'à 1 200 fans par jour, premier arrivé premier servi, sans inscription requise.',
    lieu_key: 'STACKT Market',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-02T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.stacktmarket.com',
  },
  {
    source_id: 'mundial2026-toronto-harbourfront-canada-soccer-house',
    titre: 'Canada Soccer House — Harbourfront Centre (maison officielle Canada Soccer)',
    description: 'La destination officielle de Canada Soccer pour la Coupe du Monde 2026 s\'installe au Harbourfront Centre, en bord du lac Ontario avec vue sur le port de Toronto. Watch parties pour chaque match du Canada, entertainment live, food & drink canadiens et expériences fan interactives. Un espace de fierté nationale pour célébrer les matchs historiques du Canada à domicile devant ses propres supporters. Gratuit.',
    lieu_key: 'Harbourfront Centre',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-02T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.harbourfrontcentre.com',
  },

  // ── ÉVÉNEMENTS DE QUARTIER ────────────────────────────────────────────────

  {
    source_id: 'mundial2026-toronto-bloor-yorkville-soccer-fest',
    titre: 'Bloor-Yorkville Soccer Fest — Freestyle Soccer & Neighbourhood Trail',
    description: 'Festival de soccer gratuit dans le quartier chic de Bloor-Yorkville, le "Mayfair" torontois. Performances de freestyle soccer toutes les heures de 13h à 17h par des athlètes de renommée mondiale, expériences fan interactives et Neighbourhood Soccer Trail à travers les commerces, restaurants et galeries du quartier. Les dates couvrent les week-ends des 13-14 juin, 20 juin et 27 juin 2026 — alignées sur les matchs de la phase de groupes.',
    lieu_key: 'Bloor-Yorkville — Village Park',
    date_debut: '2026-06-13T13:00:00',
    date_fin: '2026-06-27T20:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.bloor-yorkville.com',
  },
  {
    source_id: 'mundial2026-toronto-distillery-district-worldcup',
    titre: 'Distillery District — World Cup Events & Patio Season',
    description: 'Le Distillery District, quartier victorien restauré du 19e siècle et l\'un des quartiers les plus photographiés de Toronto, programme des watch parties dans ses bars, galeries et restaurants pendant la Coupe du Monde. Pavés en briques rouges, architecture industrielle préservée, terrasses animées et galleries d\'art contemporain créent une atmosphère unique pour vivre le thème "The World in a City" au quotidien pendant le tournoi.',
    lieu_key: 'Distillery District',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-02T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.thedistillerydistrict.com',
  },
  {
    source_id: 'mundial2026-toronto-riverside-leslieville-game-on',
    titre: 'Game On East End — Riverside & Leslieville, Queen Street East',
    description: 'Festival de soccer communautaire gratuit dans les quartiers de Riverside et Leslieville le long de Queen Street East. Projections en plein air à Riverside Common Park, BBQs communautaires, projets d\'art collectif, zone fraîche les jours de chaleur, soirées caribéennes avec musique et danse, ateliers interactifs et célébrations de quartier. Un événement qui incarne parfaitement le thème de Toronto "The World in a City" dans ses quartiers les plus vivants.',
    lieu_key: 'Riverside & Leslieville — Queen Street East',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-02T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.toronto.ca/explore-enjoy/festivals-events/fifa-world-cup-26/',
  },
  {
    source_id: 'mundial2026-toronto-bata-shoe-museum-soccer-sundays',
    titre: 'Soccer Sundays — Bata Shoe Museum (célébration des cultures mondiales)',
    description: 'Série de 6 dimanches au Bata Shoe Museum, musée unique au monde dédié à l\'histoire de la chaussure, qui célèbre les cultures mondiales pendant la Coupe du Monde. "Kick off your Sunday" avec des événements familiaux gratuits : exploration de la culture des équipes nationales à travers le prisme du design, de l\'artisanat et de la mode sportive. Tous les dimanches du 14 juin au 19 juillet 2026, de 12h à 16h.',
    lieu_key: 'Bata Shoe Museum',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-19T16:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.batashoemuseum.ca',
  },
  {
    source_id: 'mundial2026-toronto-kensington-market-worldcup',
    titre: 'Kensington Market — World Cup Street Festival',
    description: 'Kensington Market, le quartier le plus multiculturel, bohème et alternatif de Toronto, vibre pendant toute la Coupe du Monde. Bars avec musiques du monde entier, restaurants de toutes cuisines (jamaïcaine, portugaise, mexicaine, éthiopienne, coréenne…), marchés en plein air, artistes de rue et animations dans ce quartier emblématique. L\'endroit idéal pour vivre "The World in a City" au quotidien sans billet ni réservation.',
    lieu_key: 'Kensington Market',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-02T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://kensington-market.ca',
  },
  {
    source_id: 'mundial2026-toronto-cn-tower-worldcup',
    titre: 'CN Tower & Ripley\'s Aquarium — World Cup Experience',
    description: 'La CN Tower (553 mètres), symbole de Toronto et l\'une des structures autoportantes les plus hautes du monde, et le Ripley\'s Aquarium of Canada voisin programment des expériences spéciales pendant la Coupe du Monde 2026. Vue à 553 mètres sur la ville en pleine effervescence footballistique, illuminations nocturnes spéciales aux couleurs des nations participantes et activations FIFA. Les deux attractions sont adjacentes au Rogers Centre et à moins d\'un kilomètre du Fan Festival.',
    lieu_key: 'CN Tower — Ripley\'s Aquarium',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-02T23:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.cntower.ca',
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
    for (const evt of EVENEMENTS_TORONTO_MUNDIAL) {
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

      const lieuData = LIEUX_TORONTO[evt.lieu_key]
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
      ville: 'Toronto',
      total: EVENEMENTS_TORONTO_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 2 juillet 2026 (6 matchs + Round of 32)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
