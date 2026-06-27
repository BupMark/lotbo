// SC-MONDIAL-FIFA-2 S3 — Événements autour de la Coupe du Monde 2026 · Boston, MA
// ⚠️ FORMULATION : "Événements à Boston pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : bostonfwc26.com, rosekennedygreenway.org,
//   harvardsquare.com, harpoonbrewery.com, tdgarden.com)
// Période couverte : 12 juin → 9 juillet 2026 (7 matchs + quart de finale)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

// Coordonnées GPS niveau bâtiment — Boston, MA
const LIEUX_BOSTON: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Boston City Hall Plaza':         { latitude: 42.3601, longitude: -71.0580, adresse: '1 City Hall Square', ville: 'Boston', pays: 'USA' },
  'Fenway Park':                    { latitude: 42.3467, longitude: -71.0972, adresse: '4 Jersey Street', ville: 'Boston', pays: 'USA' },
  'TD Garden':                      { latitude: 42.3662, longitude: -71.0621, adresse: '100 Legends Way', ville: 'Boston', pays: 'USA' },
  'Boston Common':                  { latitude: 42.3554, longitude: -71.0657, adresse: '139 Tremont Street', ville: 'Boston', pays: 'USA' },
  'Seaport District — Boston':      { latitude: 42.3504, longitude: -71.0443, adresse: 'Seaport Boulevard', ville: 'Boston', pays: 'USA' },
  'Harvard Square — Cambridge':     { latitude: 42.3732, longitude: -71.1190, adresse: 'Massachusetts Avenue', ville: 'Cambridge', pays: 'USA' },
  'Rose Kennedy Greenway':          { latitude: 42.3587, longitude: -71.0526, adresse: 'Atlantic Avenue', ville: 'Boston', pays: 'USA' },
  'Harpoon Brewery — Boston':       { latitude: 42.3467, longitude: -71.0393, adresse: '306 Northern Avenue', ville: 'Boston', pays: 'USA' },
  'Royale Boston':                  { latitude: 42.3524, longitude: -71.0617, adresse: '279 Tremont Street', ville: 'Boston', pays: 'USA' },
  'Nubian Square — Roxbury':        { latitude: 42.3299, longitude: -71.0848, adresse: 'Dudley Street', ville: 'Boston', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_BOSTON
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — BOSTON · FIFA WORLD CUP 2026 PERIOD
// Sources : bostonfwc26.com · rosekennedygreenway.org · harvardsquare.com
//           harpoonbrewery.com · tdgarden.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_BOSTON_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-boston-city-hall-fan-festival',
    titre: 'FIFA Fan Festival™ Boston — City Hall Plaza (16 jours)',
    description: 'Le FIFA Fan Festival officiel de Boston s\'installe à City Hall Plaza, au cœur de la ville, pendant 16 jours. Cultural Showcase avec artistes, musiciens et performers locaux et internationaux. Apparitions de légendes FIFA et des mascottes officielles du tournoi. Retransmission de 2-3 matchs par jour sur écrans géants. Inscription gratuite en avance requise. Un événement pensé pour refléter la diversité culturelle unique de Boston.',
    lieu_key: 'Boston City Hall Plaza',
    date_debut: '2026-06-12T10:00:00',
    date_fin: '2026-06-27T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bostonfwc26.com/fifa-fan-festival/',
  },

  // ── WATCH PARTIES OFFICIELLES DE LA VILLE ─────────────────────────────────

  {
    source_id: 'mundial2026-boston-watch-party-spain-capeverde',
    titre: 'Watch Party — Espagne vs Cap-Vert · Quartier Boston',
    description: 'L\'une des 6 watch parties de quartier annoncées par la Maire Michelle Wu pour la Coupe du Monde 2026. Le match Espagne vs Cap-Vert est retransmis en plein air sur Boston Common. Animations locales, food trucks et ambiance communautaire dans le parc central de Boston. Un événement gratuit, organisé par la Ville, qui reflète la politique d\'inclusion de la Mairie pendant la Coupe du Monde.',
    lieu_key: 'Boston Common',
    date_debut: '2026-06-16T18:00:00',
    date_fin: '2026-06-16T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bostonfwc26.com/',
  },
  {
    source_id: 'mundial2026-boston-watch-party-brazil-haiti',
    titre: 'Watch Party — Brésil vs Haïti · Boston (match historique pour la diaspora haïtienne)',
    description: 'Watch party communautaire pour le match Brésil vs Haïti — un match historique pour la diaspora haïtienne de Boston, l\'une des plus importantes et des plus anciennes des États-Unis. Organisée à Nubian Square (Roxbury), cœur de la communauté haïtiano-américaine de Boston. Animations, musique haïtienne et brésilienne, gastronomie des deux cultures. Un événement de quartier gratuit organisé par la Ville de Boston.',
    lieu_key: 'Nubian Square — Roxbury',
    date_debut: '2026-06-19T18:00:00',
    date_fin: '2026-06-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bostonfwc26.com/',
  },
  {
    source_id: 'mundial2026-boston-watch-party-colombia-portugal',
    titre: 'Watch Party — Colombie vs Portugal · Seaport Boston',
    description: 'Watch party officielle de la Ville de Boston pour le match Colombie vs Portugal, organisée dans le Seaport District. Vue sur le port de Boston et les gratte-ciels du Financial District en arrière-plan, écran géant, food trucks et ambiance internationale dans l\'un des quartiers les plus dynamiques de la ville. Entrée gratuite, sans réservation.',
    lieu_key: 'Seaport District — Boston',
    date_debut: '2026-06-23T16:00:00',
    date_fin: '2026-06-23T20:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bostonfwc26.com/',
  },

  // ── LIEUX & QUARTIERS ─────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-boston-fenway-park-summer',
    titre: 'Fenway Park — Summer Season & World Cup Atmosphere',
    description: 'Le Fenway Park (1912), stade le plus légendaire du baseball américain, programme sa saison des Boston Red Sox en pleine Coupe du Monde. Les bars et restaurants de Lansdowne Street, la rue animée derrière le Green Monster, organisent des watch parties chaque soir. Le House of Blues adjacent accueille des concerts. L\'ambiance sportive la plus authentique et la plus old-school de Boston pendant la Coupe du Monde.',
    lieu_key: 'Fenway Park',
    date_debut: '2026-06-12T12:00:00',
    date_fin: '2026-07-09T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.mlb.com/redsox/fenway-park',
  },
  {
    source_id: 'mundial2026-boston-td-garden-events',
    titre: 'TD Garden — Events & Concerts Summer 2026',
    description: 'Le TD Garden, domicile des Boston Celtics (NBA) et des Boston Bruins (NHL), accueille concerts et événements live pendant la période de la Coupe du Monde. Installé dans le quartier North Station, à quelques minutes à pied du FIFA Fan Festival de City Hall Plaza, c\'est une destination de divertissement incontournable de Boston pour toute la saison estivale.',
    lieu_key: 'TD Garden',
    date_debut: '2026-06-12T19:00:00',
    date_fin: '2026-07-09T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.tdgarden.com',
  },
  {
    source_id: 'mundial2026-boston-greenway-summer',
    titre: 'Rose Kennedy Greenway — Summer Programming & Carousels',
    description: 'Le Rose Kennedy Greenway, parc linéaire de 1,5 km au cœur de Boston, programme animations estivales, marchés fermiers hebdomadaires, carousels centenaires restaurés, fontaines interactives et événements culturels pendant toute la Coupe du Monde. Ce couloir vert relie le Fan Festival de City Hall Plaza au Seaport et au North End. Entièrement gratuit et ouvert tous les jours.',
    lieu_key: 'Rose Kennedy Greenway',
    date_debut: '2026-06-12T10:00:00',
    date_fin: '2026-07-09T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.rosekennedygreenway.org',
  },
  {
    source_id: 'mundial2026-boston-harvard-square-worldcup',
    titre: 'Harvard Square — World Cup Watch Parties & Street Life',
    description: 'Harvard Square à Cambridge, l\'une des places publiques les plus animées et les plus intellectuellement vivantes des États-Unis, programme des watch parties dans ses bars et restaurants pendant la Coupe du Monde. La communauté universitaire internationale de la région Boston-Cambridge — étudiants, professeurs et chercheurs du monde entier — se retrouve autour du football mondial. Bars, terrasses, performances de rue et ambiance internationale.',
    lieu_key: 'Harvard Square — Cambridge',
    date_debut: '2026-06-12T12:00:00',
    date_fin: '2026-07-09T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.harvardsquare.com',
  },
  {
    source_id: 'mundial2026-boston-harpoon-brewery',
    titre: 'Harpoon Brewery Beer Hall — World Cup Watch Parties',
    description: 'La Harpoon Brewery, l\'une des brasseries artisanales les plus emblématiques de la Nouvelle-Angleterre, ouvre son Beer Hall géant du Seaport pour des watch parties pendant tout le tournoi. Bières artisanales brassées sur place, écrans multiples, ambiance de pub authentique et vue sur le port. L\'un des meilleurs spots pour voir les matchs à Boston dans une ambiance festive et décontractée.',
    lieu_key: 'Harpoon Brewery — Boston',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-09T23:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.harpoonbrewery.com',
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
    for (const evt of EVENEMENTS_BOSTON_MUNDIAL) {
      // T-1 — Filtre anti-réimport suppression
      const bloquee = await estSourceBloquee(supabase, 'mundial_2026', evt.source_id)
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

      const lieuData = LIEUX_BOSTON[evt.lieu_key]
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
      ville: 'Boston',
      total: EVENEMENTS_BOSTON_MUNDIAL.length,
      imported,
      skipped,
      periode: '12 juin – 9 juillet 2026 (7 matchs + quart de finale)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
