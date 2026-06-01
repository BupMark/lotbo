// SC-MONDIAL-FIFA-2 S2 — Événements autour de la Coupe du Monde 2026 · Seattle, Washington
// ⚠️ FORMULATION : "Événements à Seattle pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : seattlefc26.com, soundersfc.com,
//   pikeplacemarket.org, capitolhillseattle.com)
// Période couverte : 11 juin → 6 juillet 2026 (Seattle 6 matchs, dernier Round of 16)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Seattle, Washington
const LIEUX_SEATTLE: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Seattle Center — The Armory':          { latitude: 47.6214, longitude: -122.3511, adresse: '305 Harrison Street', ville: 'Seattle', pays: 'USA' },
  'Pier 62 — Seattle Waterfront':         { latitude: 47.6073, longitude: -122.3398, adresse: '1301 Alaskan Way', ville: 'Seattle', pays: 'USA' },
  'Pacific Place — Seattle Soccer House': { latitude: 47.6110, longitude: -122.3364, adresse: '600 Pine Street', ville: 'Seattle', pays: 'USA' },
  'Victory Hall — SODO':                  { latitude: 47.5952, longitude: -122.3300, adresse: '1 Safeco Place', ville: 'Seattle', pays: 'USA' },
  'Lumen Field (Seattle Stadium)':        { latitude: 47.5952, longitude: -122.3316, adresse: '800 Occidental Avenue S', ville: 'Seattle', pays: 'USA' },
  'International Fountain — Seattle Center': { latitude: 47.6200, longitude: -122.3519, adresse: '305 Harrison Street', ville: 'Seattle', pays: 'USA' },
  'Capitol Hill — Seattle':               { latitude: 47.6253, longitude: -122.3222, adresse: 'Broadway & Pike Street', ville: 'Seattle', pays: 'USA' },
  'Pike Place Market':                    { latitude: 47.6097, longitude: -122.3422, adresse: '85 Pike Street', ville: 'Seattle', pays: 'USA' },
  'Mural Amphitheatre — Seattle Center':  { latitude: 47.6208, longitude: -122.3520, adresse: '305 Harrison Street', ville: 'Seattle', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_SEATTLE
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — SEATTLE · FIFA WORLD CUP 2026 PERIOD
// Sources : seattlefc26.com · soundersfc.com · pikeplacemarket.org
//           capitolhillseattle.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_SEATTLE_MUNDIAL: EvenementMundial[] = [

  // ── HUB PRINCIPAL & FAN ZONES ─────────────────────────────────────────────

  {
    source_id: 'mundial2026-seattle-center-armory-hub',
    titre: 'Seattle Center Armory — World Cup Fan Hub (Hub principal)',
    description: 'Le Seattle Center Armory est le hub principal des fan celebrations de Seattle pendant la Coupe du Monde 2026. Écran intérieur grand format, espace all-weather idéal pour la météo de Seattle, restauration, cultural programming, activations Festál (festival multiculturel annuel du Seattle Center) et kid zones. Un espace couvert et inclusif, gratuit, au cœur du Seattle Center — juste à côté de la Space Needle.',
    lieu_key: 'Seattle Center — The Armory',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-06T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
  },
  {
    source_id: 'mundial2026-seattle-soccer-celebration-pier62',
    titre: 'Seattle Soccer Celebration — Floating Fan Experience · Pier 62',
    description: 'L\'expérience fan la plus unique au monde : un terrain de mini-foot flottant sur Elliott Bay au Pier 62 du Seattle Waterfront ! Organisé par les Seattle Sounders FC, Seattle Reign FC et la RAVE Foundation, cet événement propose également des watch parties sur écran LED en bord de baie, musique, food et programmation culturelle avec vue sur les Olympic Mountains. La fan experience la plus spectaculaire de tout le tournoi.',
    lieu_key: 'Pier 62 — Seattle Waterfront',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-06T22:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.soundersfc.com/seattle-soccer-celebration/',
  },
  {
    source_id: 'mundial2026-seattle-pacific-place-soccer-house',
    titre: 'Seattle Soccer House — Pacific Place (Écran LED 4 étages)',
    description: 'L\'attraction la plus impressionnante de Seattle pour la Coupe du Monde : un écran LED haute résolution de 4 étages installé dans l\'atrium du mall Pacific Place, en plein cœur de Downtown Seattle. Activations interactives, info booths FIFA et accès direct au parking du mall. L\'écran le plus grand jamais installé dans un espace commercial de Seattle — visible depuis l\'extérieur. Entrée gratuite.',
    lieu_key: 'Pacific Place — Seattle Soccer House',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-06T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
  },
  {
    source_id: 'mundial2026-seattle-victory-hall-matchday-live',
    titre: 'Victory Hall SODO — Seattle Matchday Live (Seattle Mariners host)',
    description: 'Les Seattle Mariners (MLB) accueillent "Seattle Matchday Live" à Victory Hall en SODO, à quelques pâtés de maisons de Lumen Field. Écran principal de 23 pieds, ambiance authentique de stade sans billet de match requis, restauration et bières de la ville. Un des espaces de watch party les plus appréciés des supporters locaux — ouvert pour chaque match de Seattle et les grandes affiches du tournoi.',
    lieu_key: 'Victory Hall — SODO',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-06T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
  },

  // ── PROGRAMMATION CULTURELLE ──────────────────────────────────────────────

  {
    source_id: 'mundial2026-seattle-international-fountain-djs',
    titre: 'International Fountain — DJs & Artists du Monde Entier · Seattle Center',
    description: 'L\'International Fountain du Seattle Center, avec ses 274 jets d\'eau synchronisés, accueille DJs et artistes locaux et internationaux pendant toute la période de la Coupe du Monde. Spectacles d\'eau et de lumière synchronisés avec la musique, performances artistiques en plein air et animations gratuites chaque jour. Un des sites les plus photogéniques de Seattle avec vue sur la Space Needle.',
    lieu_key: 'International Fountain — Seattle Center',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-06T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
  },
  {
    source_id: 'mundial2026-seattle-mural-amphitheatre',
    titre: 'Mural Amphitheatre — Performances & Space Needle View · Seattle Center',
    description: 'L\'Amphithéâtre Mural du Seattle Center programme concerts et performances en plein air avec une vue spectaculaire sur la Space Needle et les arches du Pacific Science Center. Programmation culturelle gratuite pendant toute la Coupe du Monde, dans l\'esprit multiculturel du Seattle Center. Un espace all-ages au cœur du parc, ouvert à tous.',
    lieu_key: 'Mural Amphitheatre — Seattle Center',
    date_debut: '2026-06-11T14:00:00',
    date_fin: '2026-07-06T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
  },
  {
    source_id: 'mundial2026-seattle-capitol-hill-nightlife',
    titre: 'Capitol Hill — World Cup Nightlife & Bar Scene · Seattle',
    description: 'Capitol Hill, le quartier LGBTQ+, culturel et artistique de Seattle, programme watch parties, concerts et événements communautaires pendant toute la Coupe du Monde. Bars, clubs, restaurants et venues indépendants de Broadway et Pike Street célèbrent la diversité du football mondial. Un quartier vivant 24h/24 qui incarne l\'esprit ouvert et créatif de Seattle pendant le plus grand événement sportif de l\'histoire.',
    lieu_key: 'Capitol Hill — Seattle',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-06T23:59:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.capitolhillseattle.com',
  },
  {
    source_id: 'mundial2026-seattle-pike-place-market',
    titre: 'Pike Place Market — Summer Season & World Cup Atmosphere',
    description: 'Le Pike Place Market, marché public historique de Seattle fondé en 1907 et le plus visité des États-Unis, programme sa saison estivale avec musiciens de rue, artisans, producteurs locaux et restaurateurs du monde entier. Une destination incontournable pour les fans internationaux de la Coupe du Monde visitant Seattle. Ouvert tous les jours, du lundi au dimanche. Accès gratuit au marché.',
    lieu_key: 'Pike Place Market',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-06T18:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.pikeplacemarket.org',
  },
  {
    source_id: 'mundial2026-seattle-unity-loop-global',
    titre: 'Unity Loop Seattle — World Cup Fan Experience (Multi-sites)',
    description: 'Le Seattle Unity Loop connecte tous les sites fan de la ville en une expérience cohérente : Seattle Center Armory, Pier 62 Waterfront, Pacific Place Soccer House et Victory Hall SODO. Un circuit fan gratuit et ouvert à tous, tout au long des 6 matchs de Seattle. Le modèle distribué le plus innovant de toute la Coupe du Monde 2026 — chaque site offre une expérience unique mais connectée.',
    lieu_key: 'Seattle Center — The Armory',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-06T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://seattlefc26.com/',
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
    for (const evt of EVENEMENTS_SEATTLE_MUNDIAL) {
      // 1. Déduplication via source_id
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
      const lieuData = LIEUX_SEATTLE[evt.lieu_key]
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
      ville: 'Seattle',
      total: EVENEMENTS_SEATTLE_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 6 juillet 2026 (Seattle 6 matchs, dernier Round of 16)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
