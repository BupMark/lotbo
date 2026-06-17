// SC-MONDIAL-FIFA-2 S3 — Événements autour de la Coupe du Monde 2026 · Miami, FL
// ⚠️ FORMULATION : "Événements à Miami pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : miamifwc26.com, wynwoodmiami.com,
//   baysidemarketplace.com, brickellcitycentre.com, littlehavana.miami)
// Période couverte : 13 juin → 5 juillet 2026 (5 matchs, fan fest 23 jours)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Miami, FL
const LIEUX_MIAMI: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Bayfront Park — Miami':           { latitude: 25.7742, longitude: -80.1868, adresse: '301 Biscayne Blvd', ville: 'Miami', pays: 'USA' },
  'Hard Rock Stadium — Miami Gardens': { latitude: 25.9580, longitude: -80.2388, adresse: '347 Don Shula Drive', ville: 'Miami Gardens', pays: 'USA' },
  'Wynwood Arts District':           { latitude: 25.8007, longitude: -80.1991, adresse: 'NW 2nd Avenue & 26th Street', ville: 'Miami', pays: 'USA' },
  'South Beach — Ocean Drive':       { latitude: 25.7825, longitude: -80.1301, adresse: 'Ocean Drive', ville: 'Miami Beach', pays: 'USA' },
  'Little Havana — Calle Ocho':      { latitude: 25.7687, longitude: -80.2194, adresse: 'SW 8th Street', ville: 'Miami', pays: 'USA' },
  'Brickell City Centre':            { latitude: 25.7617, longitude: -80.1918, adresse: '701 S Miami Avenue', ville: 'Miami', pays: 'USA' },
  'Coconut Grove':                   { latitude: 25.7291, longitude: -80.2386, adresse: 'Grand Avenue', ville: 'Miami', pays: 'USA' },
  'Miami Design District':           { latitude: 25.8130, longitude: -80.1928, adresse: 'NW 39th Street', ville: 'Miami', pays: 'USA' },
  'Marlins Park (loanDepot Park)':   { latitude: 25.7782, longitude: -80.2197, adresse: '501 Marlins Way', ville: 'Miami', pays: 'USA' },
  'Bayside Marketplace':             { latitude: 25.7766, longitude: -80.1855, adresse: '401 Biscayne Blvd', ville: 'Miami', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_MIAMI
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — MIAMI · FIFA WORLD CUP 2026 PERIOD
// Sources : miamifwc26.com · wynwoodmiami.com · baysidemarketplace.com
//           brickellcitycentre.com · littlehavana.miami · coconutgrove.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_MIAMI_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-miami-bayfront-fan-festival',
    titre: 'FIFA Fan Festival™ Miami — Bayfront Park (23 jours)',
    description: 'Le FIFA Fan Festival officiel de Miami s\'installe sur le front de mer de Biscayne Bay au Bayfront Park, pendant 23 jours. Retransmissions live de tous les matchs, entertainment stages avec performances culturelles reflétant la diversité de Miami, food & beverage avec cuisines du monde entier, activations interactives et programmation famille. Vue imprenable sur la Baie et sur le Port de Miami. Entrée libre, sans ticket requis.',
    lieu_key: 'Bayfront Park — Miami',
    date_debut: '2026-06-13T10:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://miamifwc26.com/fan-festival/',
  },

  // ── QUARTIERS & DISTRICTS ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-miami-wynwood-worldcup',
    titre: 'Wynwood — World Cup Art, Murals & Watch Parties',
    description: 'Wynwood, le quartier artistique de Miami mondialement connu pour ses murals géants de street art, programme des watch parties dans ses bars et galeries pendant toute la Coupe du Monde. Rooftops avec vue sur les œuvres murales, clubs underground, restaurants fusion internationale et galeries d\'art contemporain. L\'endroit le plus créatif et le plus international de Miami pour vivre le football mondial avec l\'art en toile de fond.',
    lieu_key: 'Wynwood Arts District',
    date_debut: '2026-06-13T16:00:00',
    date_fin: '2026-07-05T02:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.wynwoodmiami.com',
  },
  {
    source_id: 'mundial2026-miami-south-beach-ocean-drive',
    titre: 'South Beach — Ocean Drive World Cup Beach Parties',
    description: 'Ocean Drive à South Beach, la rue la plus iconique de Miami avec ses façades Art Déco pastel, se transforme en festival continu pendant la Coupe du Monde 2026. Bars en terrasse ouverts sur la rue, musique live latine et internationale, plage de sable blanc à deux pas, atmosphère internationale à 3h du matin. Des milliers de fans du monde entier se retrouvent sur la promenade la plus célèbre des États-Unis, à quelques mètres de l\'Atlantique.',
    lieu_key: 'South Beach — Ocean Drive',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-05T03:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.sobe.com',
  },
  {
    source_id: 'mundial2026-miami-little-havana-calle-ocho',
    titre: 'Little Havana — Calle Ocho World Cup Festival',
    description: 'La Calle Ocho de Little Havana, cœur culturel de la communauté cubaine et latinoaméricaine de Miami, vibre pendant toute la Coupe du Monde. Watch parties géantes sur la rue piétonne, musique salsa et reggaeton en live, gastronomie latino (ceviche, ropa vieja, mojitos), joueurs de dominoes centenaires et cigares roulés à la main. L\'ambiance la plus chaude, la plus authentique et la plus latine de Miami pendant la Coupe du Monde.',
    lieu_key: 'Little Havana — Calle Ocho',
    date_debut: '2026-06-13T14:00:00',
    date_fin: '2026-07-05T02:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.littlehavana.miami',
  },
  {
    source_id: 'mundial2026-miami-bayside-marketplace',
    titre: 'Bayside Marketplace — World Cup Watch Parties & Live Music',
    description: 'Le Bayside Marketplace, centre commercial et de divertissement ouvert sur Biscayne Bay, programme des watch parties et des concerts live pendant toute la Coupe du Monde. Vue directe sur la baie de Miami, bars et restaurants animés, musique live en terrasse et ambiance festive à cinq minutes à pied du Fan Festival de Bayfront Park. Accès gratuit au site, consommation libre.',
    lieu_key: 'Bayside Marketplace',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-05T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.baysidemarketplace.com',
  },
  {
    source_id: 'mundial2026-miami-brickell-city-worldcup',
    titre: 'Brickell City Centre — World Cup Rooftop Parties & Nightlife',
    description: 'Brickell, le quartier financier et lifestyle de Miami, programme des soirées rooftop exclusives, des watch parties dans ses hôtels de luxe et ses bars premium pendant la Coupe du Monde. La clientèle internationale de Brickell — cadres, expats et visiteurs d\'affaires du monde entier — se retrouve pour célébrer le football mondial en mode upscale. Dress code attendu dans les meilleurs établissements.',
    lieu_key: 'Brickell City Centre',
    date_debut: '2026-06-13T18:00:00',
    date_fin: '2026-07-05T03:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.brickellcitycentre.com',
  },
  {
    source_id: 'mundial2026-miami-coconut-grove-summer',
    titre: 'Coconut Grove — Summer Events & World Cup Vibes',
    description: 'Coconut Grove, le quartier bohème, artistique et verdoyant de Miami, programme animations estivales, marchés artisanaux, concerts en plein air et watch parties pendant la Coupe du Monde. Ambiance décontractée en bord de Baie de Biscayne, arbres centenaires qui ombragent les terrasses, restaurants branchés et galeries d\'art. Une alternative plus calme et plus locale aux quartiers animés de South Beach.',
    lieu_key: 'Coconut Grove',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-05T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.coconutgrove.com',
  },
  {
    source_id: 'mundial2026-miami-design-district-worldcup',
    titre: 'Miami Design District — Art, Fashion & World Cup',
    description: 'Le Miami Design District, quartier dédié aux marques de luxe, aux galeries d\'art et au design international, programme des installations artistiques, des événements de mode et des activations culturelles pendant la Coupe du Monde. Galeries ouvrant leurs portes sur l\'espace public, boutiques de grandes maisons et restaurants gastronomiques se mobilisent pour accueillir les visiteurs internationaux dans l\'espace le plus avant-gardiste de Miami.',
    lieu_key: 'Miami Design District',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.miamidesigndistrict.net',
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
    for (const evt of EVENEMENTS_MIAMI_MUNDIAL) {
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

      const lieuData = LIEUX_MIAMI[evt.lieu_key]
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
      ville: 'Miami',
      total: EVENEMENTS_MIAMI_MUNDIAL.length,
      imported,
      skipped,
      periode: '13 juin – 5 juillet 2026 (5 matchs, fan fest 23 jours)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
