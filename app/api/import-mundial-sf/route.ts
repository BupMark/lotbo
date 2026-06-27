// SC-MONDIAL-FIFA-2 S2 — Événements autour de la Coupe du Monde 2026 · San Francisco Bay Area
// ⚠️ FORMULATION : "Événements à San Francisco pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : sfbayareafwc26.com, bayareahostcommittee.com,
//   soundersfc.com, santamonicapier.org, fishermanswharf.org)
// Période couverte : 11 juin → 1er juillet 2026 (SF 5 matchs + Round of 32)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

// Coordonnées GPS niveau bâtiment — San Francisco Bay Area
const LIEUX_SF: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Thrive City at Chase Center':               { latitude: 37.7680, longitude: -122.3876, adresse: '1 Warriors Way', ville: 'San Francisco', pays: 'USA' },
  'China Basin Park — Mission Rock':           { latitude: 37.7786, longitude: -122.3892, adresse: '1 Giants Plaza', ville: 'San Francisco', pays: 'USA' },
  'Levi\'s Stadium — Santa Clara':             { latitude: 37.4033, longitude: -121.9700, adresse: '4900 Marie P DeBartolo Way', ville: 'Santa Clara', pays: 'USA' },
  'San Pedro Square Market — San Jose':        { latitude: 37.3388, longitude: -121.8897, adresse: '87 N San Pedro Street', ville: 'San Jose', pays: 'USA' },
  'Santana Row — San Jose':                    { latitude: 37.3202, longitude: -121.9483, adresse: '334 Santana Row', ville: 'San Jose', pays: 'USA' },
  'Yerba Buena Lane — San Francisco':          { latitude: 37.7845, longitude: -122.4033, adresse: 'Yerba Buena Lane & Mission St', ville: 'San Francisco', pays: 'USA' },
  'Dolores Park — San Francisco':              { latitude: 37.7596, longitude: -122.4269, adresse: '19th Street & Dolores Street', ville: 'San Francisco', pays: 'USA' },
  'Fisherman\'s Wharf — San Francisco':        { latitude: 37.8080, longitude: -122.4177, adresse: 'Jefferson Street', ville: 'San Francisco', pays: 'USA' },
  'Oracle Park — San Francisco':               { latitude: 37.7786, longitude: -122.3893, adresse: '24 Willie Mays Plaza', ville: 'San Francisco', pays: 'USA' },
  'Alameda County Fairgrounds — Pleasanton':   { latitude: 37.6571, longitude: -121.8971, adresse: '4501 Pleasanton Avenue', ville: 'Pleasanton', pays: 'USA' },
  'Santa Cruz Beach Boardwalk':                { latitude: 36.9641, longitude: -122.0178, adresse: '400 Beach Street', ville: 'Santa Cruz', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_SF
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — SAN FRANCISCO BAY AREA · FIFA WORLD CUP 2026 PERIOD
// Sources : sfbayareafwc26.com · bayareahostcommittee.com · fishermanswharf.org
//           santamonicapier.org · travelnoire.com · visitcalifornia.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_SF_MUNDIAL: EvenementMundial[] = [

  // ── FAN ZONES OFFICIELLES ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-sf-thrive-city-splash',
    titre: 'Splash at Thrive City — Watch Parties FIFA World Cup 2026 (Chase Center)',
    description: 'Splash at Thrive City est le sports bar officiel de la Bay Area pour la Coupe du Monde 2026, installé au Chase Center des Golden State Warriors. 30 000 sq ft d\'espace avec un méga-écran de 1 400 sq ft, le plus grand bar de watch party de San Francisco. DJ sets pre et post-match, restauration premium et ambiance stadium pour tous les matchs du tournoi. Premier arrivé, premier servi — RSVP gratuit requis.',
    lieu_key: 'Thrive City at Chase Center',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-01T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-china-basin-park',
    titre: 'China Basin Park at Mission Rock — Fan Zone FIFA World Cup 2026',
    description: 'La fan zone officielle de la Bay Area au bord de la Baie de San Francisco, organisée par Giants Enterprises (MLB). Installée à China Basin Park au Mission Rock, avec vue panoramique sur la Baie, Oracle Park et le Bay Bridge. Écrans géants, gastronomie, entertainment et animations gratuites pour toute la durée du tournoi. L\'une des fan zones les plus pittoresques de toute la Coupe du Monde 2026.',
    lieu_key: 'China Basin Park — Mission Rock',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-01T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bayareahostcommittee.com',
  },
  {
    source_id: 'mundial2026-sf-san-pedro-square-celebration',
    titre: 'San Pedro Square Market — Celebration of Soccer (104 matchs en direct)',
    description: 'Le San Pedro Square Market à San Jose propose l\'expérience la plus complète de la Bay Area : les 104 matchs de la Coupe du Monde 2026 diffusés gratuitement tout au long du tournoi. Village de vendeurs, animations, restauration internationale, concerts et programmation culturelle dans ce marché couvert du cœur de San Jose. L\'un des sites les plus complets et accessibles de tout le tournoi.',
    lieu_key: 'San Pedro Square Market — San Jose',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-santana-row-cup',
    titre: 'Santana Row — The Row Cup · FIFA World Cup 2026',
    description: 'Le mall de luxe Santana Row à San Jose se transforme en destination World Cup premium pendant la Coupe du Monde. Pop-ups FIFA officiels, menus thématiques inspirés des nations participantes, cocktails spéciaux et retransmissions des matchs dans plus de 15 restaurants et bars haut de gamme. La Row Cup offre une expérience unique qui mêle shopping, gastronomie et passion footballistique.',
    lieu_key: 'Santana Row — San Jose',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-01T23:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },

  // ── ÉVÉNEMENTS SPÉCIAUX ───────────────────────────────────────────────────

  {
    source_id: 'mundial2026-sf-pride-house-usa-australia',
    titre: 'Pride House SF — Family Day Watch Party USA vs Australia',
    description: 'Watch party inclusive LGBTQ+ organisée à The Crossing at East Cut pour le match USA vs Australie, en partenariat avec Street Soccer USA et SF Pride. Animations, drag performances, trivia soccer et célébration de l\'équipe américaine. Un événement familial et festif qui célèbre la diversité à San Francisco pendant la Coupe du Monde. Entrée gratuite.',
    lieu_key: 'Yerba Buena Lane — San Francisco',
    date_debut: '2026-06-19T18:00:00',
    date_fin: '2026-06-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-pride-watch-party-usa-turkey',
    titre: 'SF Pride Watch Party — USA vs Türkiye · Yerba Buena Lane',
    description: 'Watch party officielle SF Pride pour le match USA vs Turquie, organisée en partenariat avec SF Pride et la Yerba Buena Partnership. DJ sets, drag performances et la Drag Laureate de San Francisco Persia en hôte. Une célébration inclusive au cœur de SoMa pendant la Coupe du Monde. Entrée gratuite — l\'un des événements les plus festifs de la Bay Area pendant le tournoi.',
    lieu_key: 'Yerba Buena Lane — San Francisco',
    date_debut: '2026-06-25T18:00:00',
    date_fin: '2026-06-25T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-carnaval-copa-pueblo',
    titre: 'Carnaval San Francisco — La Copa del Pueblo 2026',
    description: 'Pour 2026, le Carnaval San Francisco adopte le thème "La Copa del Pueblo" — la Coupe du Peuple. Cette grande célébration latine et footballistique dans le Mission District réunit musique, danse, costumes, gastronomie et art de rue. L\'un des plus grands carnavals des États-Unis fusionné avec l\'esprit de la Coupe du Monde, sur deux jours au Dolores Park et dans les rues du Mission.',
    lieu_key: 'Dolores Park — San Francisco',
    date_debut: '2026-06-20T12:00:00',
    date_fin: '2026-06-21T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-alameda-fairgrounds',
    titre: 'Alameda County Fair & World Cup Fan Zone — Pleasanton',
    description: 'L\'Alameda County Fair à Pleasanton propose l\'expérience la plus originale de toute la Bay Area : manèges, concerts, monster trucks, pig races, feux d\'artifice ET retransmissions des matchs sur écrans géants. Ce fair annuel coïncide avec la période de la Coupe du Monde et intègre des activations FIFA. Une combinaison inédite d\'Americana et de football mondial, accessible en BART depuis San Francisco.',
    lieu_key: 'Alameda County Fairgrounds — Pleasanton',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-santa-cruz-beach-worldcup',
    titre: 'Santa Cruz Beach Boardwalk — World Cup Watch Party on the Sand',
    description: 'Watch party sur la plage de Santa Cruz avec écran LED géant face à l\'océan Pacifique, beer garden en bord de plage et restauration du célèbre Boardwalk. L\'expérience beach football la plus originale de Californie du Nord : regarder la Coupe du Monde les pieds dans le sable, à 75 minutes de San Francisco. Entrée gratuite pour les retransmissions sur la plage.',
    lieu_key: 'Santa Cruz Beach Boardwalk',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-01T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sfbayareafwc26.com/bay-area-events',
  },
  {
    source_id: 'mundial2026-sf-fishermans-wharf-summer',
    titre: "Fisherman's Wharf — Summer Events & World Cup Atmosphere",
    description: 'Le Fisherman\'s Wharf de San Francisco programme ses animations estivales habituelles enrichies de l\'atmosphère de la Coupe du Monde : restaurants de fruits de mer, animations de rue, marchands ambulants et retransmissions dans les bars et restaurants du Wharf. Vue sur Alcatraz, Angel Island et le Golden Gate Bridge. Accès libre toute la journée — l\'endroit le plus visité de San Francisco.',
    lieu_key: 'Fisherman\'s Wharf — San Francisco',
    date_debut: '2026-06-11T08:00:00',
    date_fin: '2026-07-01T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.fishermanswharf.org',
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
    for (const evt of EVENEMENTS_SF_MUNDIAL) {
      // 1. Déduplication via source_id
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

      // 2. Récupérer les coordonnées du lieu
      const lieuData = LIEUX_SF[evt.lieu_key]
      if (!lieuData) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'lieu inconnu' })
        continue
      }

      // 3. Insertion
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
      ville: 'San Francisco Bay Area',
      total: EVENEMENTS_SF_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 1er juillet 2026 (SF 5 matchs + Round of 32)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
