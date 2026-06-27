// SC-MONDIAL-FIFA-2 S3 — Événements autour de la Coupe du Monde 2026 · Kansas City, MO
// ⚠️ FORMULATION : "Événements à Kansas City pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : kansascityfwc26.com, powerandlightdistrict.com,
//   countryclubplaza.com, americanjazzmuseum.org, crowncenter.com)
// Période couverte : 15 juin → 5 juillet 2026 (6 matchs, fan fest 18 jours)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

// Coordonnées GPS niveau bâtiment — Kansas City, MO
const LIEUX_KC: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'National WWI Museum & Memorial — KC': { latitude: 39.0843, longitude: -94.5818, adresse: '2 Memorial Drive', ville: 'Kansas City', pays: 'USA' },
  'Arrowhead Stadium — KC':              { latitude: 39.0489, longitude: -94.4839, adresse: '1 Arrowhead Drive', ville: 'Kansas City', pays: 'USA' },
  'Power & Light District — KC':         { latitude: 39.0997, longitude: -94.5826, adresse: '1323 Walnut Street', ville: 'Kansas City', pays: 'USA' },
  'Country Club Plaza — KC':             { latitude: 39.0408, longitude: -94.5956, adresse: '4750 Main Street', ville: 'Kansas City', pays: 'USA' },
  'Crossroads Arts District — KC':       { latitude: 39.0911, longitude: -94.5831, adresse: '19th & Baltimore Avenue', ville: 'Kansas City', pays: 'USA' },
  'Crown Center — KC':                   { latitude: 39.0855, longitude: -94.5863, adresse: '2450 Grand Blvd', ville: 'Kansas City', pays: 'USA' },
  'Kauffman Stadium — KC':               { latitude: 39.0516, longitude: -94.4803, adresse: '1 Royal Way', ville: 'Kansas City', pays: 'USA' },
  'Jazz District — 18th & Vine':         { latitude: 39.1009, longitude: -94.5572, adresse: '1616 E 18th Street', ville: 'Kansas City', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_KC
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — KANSAS CITY · FIFA WORLD CUP 2026 PERIOD
// Sources : kansascityfwc26.com · powerandlightdistrict.com · countryclubplaza.com
//           americanjazzmuseum.org · crowncenter.com · kcrossroads.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_KC_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-kc-wwi-museum-fan-festival',
    titre: 'FIFA Fan Festival™ Kansas City — National WWI Museum & Memorial',
    description: 'Le Fan Festival de Kansas City bénéficie du cadre le plus iconique de tout le tournoi : le National WWI Museum & Memorial, monument national classé parmi les meilleurs musées des États-Unis. Entrée gratuite avec pass digital requis. Capacité de 25 000 personnes par jour. Installation phare : le KC Heart Gateway, une arche en forme de cœur de 65 pieds de haut à l\'entrée. Écran principal de 45 × 25 pieds, scène secondaire pour la programmation musicale, bus directs ConnectKC26 depuis le stade et le centre-ville. 18 jours de festivités.',
    lieu_key: 'National WWI Museum & Memorial — KC',
    date_debut: '2026-06-15T10:00:00',
    date_fin: '2026-07-05T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://kansascityfwc26.com/fifa-fan-festival/',
  },

  // ── QUARTIERS & DISTRICTS ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-kc-power-light-district',
    titre: 'Power & Light District — World Cup Watch Parties & Nightlife',
    description: 'Le Power & Light District, quartier de divertissement de Kansas City avec ses bars, restaurants et scènes en plein air centrées autour du Sprint Center, programme des watch parties, des soirées DJ et des animations pendant tout le tournoi. L\'endroit le plus animé et le plus festif de KC soir après soir, avec des milliers de fans se retrouvant pour chaque match de la Coupe du Monde.',
    lieu_key: 'Power & Light District — KC',
    date_debut: '2026-06-15T16:00:00',
    date_fin: '2026-07-05T02:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.powerandlightdistrict.com',
  },
  {
    source_id: 'mundial2026-kc-country-club-plaza',
    titre: 'Country Club Plaza — World Cup Events & Fountain District',
    description: 'Le Country Club Plaza, quartier historique de shopping et de dining dont l\'architecture espagnole est directement inspirée de Séville, programme des événements et des watch parties pendant la Coupe du Monde. Ce quartier pionnier — le premier centre commercial en plein air planifié d\'Amérique (1922) — avec ses fontaines, sculptures et façades ornées accueille les fans du monde entier dans un cadre unique aux États-Unis.',
    lieu_key: 'Country Club Plaza — KC',
    date_debut: '2026-06-15T12:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.countryclubplaza.com',
  },
  {
    source_id: 'mundial2026-kc-crossroads-arts-worldcup',
    titre: 'Crossroads Arts District — First Friday & World Cup',
    description: 'Le Crossroads Arts District de Kansas City, connu pour son événement mensuel "First Friday" qui transforme le quartier en galerie d\'art à ciel ouvert, programme des expositions, des performances et des événements pendant la Coupe du Monde. Galeries avant-gardistes, studios d\'artistes ouverts au public, bars et restaurants dans un quartier en pleine transformation qui incarne le renouveau créatif de Kansas City.',
    lieu_key: 'Crossroads Arts District — KC',
    date_debut: '2026-06-15T12:00:00',
    date_fin: '2026-07-05T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.kcrossroads.com',
  },
  {
    source_id: 'mundial2026-kc-jazz-district-18th-vine',
    titre: '18th & Vine Jazz District — World Cup Live Music',
    description: 'Le Jazz District de Kansas City, berceau du jazz américain et du style Kansas City bebop (Count Basie, Charlie Parker, Big Joe Turner), programme des concerts live et des événements culturels pendant toute la Coupe du Monde. L\'American Jazz Museum, le Blue Room jazz club et les venues historiques de 18th & Vine vibrent au rythme du football mondial. Une expérience musicale et culturelle unique qui connecte le patrimoine de KC au football international.',
    lieu_key: 'Jazz District — 18th & Vine',
    date_debut: '2026-06-15T18:00:00',
    date_fin: '2026-07-05T02:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.americanjazzmuseum.org',
  },
  {
    source_id: 'mundial2026-kc-crown-center-worldcup',
    titre: 'Crown Center — Family World Cup Events & Hallmark Experience',
    description: 'Le Crown Center, complexe familial de 85 acres développé par Hallmark Cards au cœur de Kansas City, programme des événements familiaux et des animations pendant la Coupe du Monde. Ice terrace couverte, restaurants, shopping et animations accessibles à tous dans un cadre sécurisé et convivial. À deux pas du FIFA Fan Festival du WWI Museum, le Crown Center est idéal pour les familles avec enfants.',
    lieu_key: 'Crown Center — KC',
    date_debut: '2026-06-15T10:00:00',
    date_fin: '2026-07-05T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.crowncenter.com',
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
    for (const evt of EVENEMENTS_KC_MUNDIAL) {
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

      const lieuData = LIEUX_KC[evt.lieu_key]
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
      ville: 'Kansas City',
      total: EVENEMENTS_KC_MUNDIAL.length,
      imported,
      skipped,
      periode: '15 juin – 5 juillet 2026 (6 matchs, fan fest 18 jours)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
