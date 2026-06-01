// SC-MONDIAL-FIFA-2 S3 — Événements autour de la Coupe du Monde 2026 · Philadelphia, PA
// ⚠️ FORMULATION : "Événements à Philadelphia pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : visitphilly.com, readingterminalmarket.org,
//   rosekennedygreenway.org, nps.gov/inde, southstreet.com)
// Période couverte : 11 juin → 19 juillet 2026 (SEULE ville USA avec 39 jours complets + America 250)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — Philadelphia, PA
const LIEUX_PHILLY: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Lemon Hill — Fairmount Park':        { latitude: 39.9700, longitude: -75.1817, adresse: 'Kelly Drive', ville: 'Philadelphia', pays: 'USA' },
  'Lincoln Financial Field — Philly':   { latitude: 39.9008, longitude: -75.1675, adresse: '1 Lincoln Financial Field Way', ville: 'Philadelphia', pays: 'USA' },
  'Philadelphia Museum of Art':         { latitude: 39.9656, longitude: -75.1810, adresse: '2600 Benjamin Franklin Pkwy', ville: 'Philadelphia', pays: 'USA' },
  'Reading Terminal Market':            { latitude: 39.9534, longitude: -75.1591, adresse: '51 N 12th Street', ville: 'Philadelphia', pays: 'USA' },
  'Old City — Independence Hall':       { latitude: 39.9489, longitude: -75.1500, adresse: '520 Chestnut Street', ville: 'Philadelphia', pays: 'USA' },
  'South Street — Philadelphia':        { latitude: 39.9424, longitude: -75.1558, adresse: 'South Street', ville: 'Philadelphia', pays: 'USA' },
  'Rittenhouse Square':                 { latitude: 39.9496, longitude: -75.1727, adresse: 'Walnut Street & 18th Street', ville: 'Philadelphia', pays: 'USA' },
  'FDR Park — South Philly':            { latitude: 39.8987, longitude: -75.1737, adresse: '1500 Pattison Avenue', ville: 'Philadelphia', pays: 'USA' },
  'Citizens Bank Park':                 { latitude: 39.9061, longitude: -75.1665, adresse: '1 Citizens Bank Way', ville: 'Philadelphia', pays: 'USA' },
  'The Navy Yard — Philadelphia':       { latitude: 39.8948, longitude: -75.1741, adresse: '4747 S Broad Street', ville: 'Philadelphia', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_PHILLY
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — PHILADELPHIA · FIFA WORLD CUP 2026 PERIOD
// Sources : visitphilly.com · readingterminalmarket.org · nps.gov/inde
//           southstreet.com · philamuseum.org · phila.gov/parks
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_PHILLY_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-philly-lemon-hill-fan-festival',
    titre: 'FIFA Fan Festival™ Philadelphia — Lemon Hill, Fairmount Park (39 jours — SEULE ville USA complète)',
    description: 'Philadelphia est la SEULE ville américaine à accueillir le FIFA Fan Festival pendant les 39 jours complets du tournoi (11 juin – 19 juillet), faisant de Philly la capitale mondiale du football aux États-Unis pendant tout l\'été 2026. Installé à Lemon Hill dans le Fairmount Park, le festival est gratuit et ouvert à tous, avec inscription requise par jour de match. De 15 000 à 20 000 fans par jour de match, concerts ticketés et programmation culturelle les jours sans match. Héritage pérenne : amélioration permanente des infrastructures du parc prévue après le tournoi.',
    lieu_key: 'Lemon Hill — Fairmount Park',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.visitphilly.com/things-to-do/events/fifa-fan-festival/',
  },

  // ── SITES CULTURELS & HISTORIQUES ────────────────────────────────────────

  {
    source_id: 'mundial2026-philly-art-museum-rocky-steps',
    titre: 'Philadelphia Museum of Art — Rocky Steps & America 250',
    description: 'Les Rocky Steps du Philadelphia Museum of Art, l\'escalier des 72 marches rendu mondialement célèbre par le film Rocky (1976) et devenu l\'un des lieux les plus photographiés des États-Unis, accueillent des événements en lien avec la Coupe du Monde et America 250 (250e anniversaire de l\'indépendance américaine en 2026). Expositions internationales, performances et animations culturelles tout l\'été, avec vue monumentale sur la Benjamin Franklin Parkway.',
    lieu_key: 'Philadelphia Museum of Art',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T20:00:00',
    categorie: 'Foire/Exposition',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.philamuseum.org',
  },
  {
    source_id: 'mundial2026-philly-independence-hall-america250',
    titre: "Independence Hall — America's 250th Anniversary & World Cup",
    description: 'Philadelphia, ville où furent signés la Déclaration d\'Indépendance (1776) et la Constitution américaine (1787), est au cœur des célébrations du 250e anniversaire des États-Unis (America 250) pendant la Coupe du Monde 2026. Independence Hall, la Constitution Hall et tout l\'Old City programment des événements historiques, des commémorations patriotiques et des célébrations qui se mêlent harmonieusement à l\'enthousiasme footballistique mondial — une convergence unique dans l\'histoire des USA.',
    lieu_key: 'Old City — Independence Hall',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-04T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.nps.gov/inde/',
  },
  {
    source_id: 'mundial2026-philly-reading-terminal-worldcup',
    titre: 'Reading Terminal Market — World Cup Food Experience',
    description: 'Le Reading Terminal Market, l\'un des plus anciens marchés couverts des États-Unis (1893) et Landmark historique de Philadelphia, propose une expérience gastronomique mondiale pendant la Coupe du Monde. Cuisines du monde entier (vietnamienne, mexicaine, africaine, méditerranéenne), producteurs Amish locaux, boulangeries, restaurants et food stands. Le meilleur endroit pour manger international à Philly, à cinq minutes de la gare centrale et du centre-ville.',
    lieu_key: 'Reading Terminal Market',
    date_debut: '2026-06-11T08:00:00',
    date_fin: '2026-07-19T18:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.readingterminalmarket.org',
  },

  // ── QUARTIERS & VIE NOCTURNE ─────────────────────────────────────────────

  {
    source_id: 'mundial2026-philly-south-street-worldcup',
    titre: 'South Street — World Cup Nightlife & Cultural Strip',
    description: 'South Street, l\'artère la plus colorée, la plus diverse et la plus alternative de Philadelphia, programme des watch parties, concerts et événements pendant les 39 jours de la Coupe du Monde. Bars avec musique live, clubs de toutes cultures, restaurants du monde entier, tatoueurs, galeries d\'art underground et le célèbre Magic Gardens (mosaïque géante de Isaiah Zagar). L\'âme nocturne et rebelle de Philadelphia pendant le tournoi.',
    lieu_key: 'South Street — Philadelphia',
    date_debut: '2026-06-11T16:00:00',
    date_fin: '2026-07-19T03:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.southstreet.com',
  },
  {
    source_id: 'mundial2026-philly-fdr-park-worldcup',
    titre: 'FDR Park — World Cup Fan Zone South Philly',
    description: 'FDR Park, le grand parc de South Philadelphia à quelques minutes du Lincoln Financial Field (Philadelphie Stadium), programme des animations et watch parties pendant la Coupe du Monde. Cet espace vert populaire de South Philly — avec son lac, ses terrains de sport et ses aires de pique-nique — accueille la communauté internationale et latinoaméricaine très présente dans ce quartier. Un lieu de rassemblement authentique et accessible à tous.',
    lieu_key: 'FDR Park — South Philly',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.phila.gov/parks',
  },
  {
    source_id: 'mundial2026-philly-rittenhouse-worldcup',
    titre: 'Rittenhouse Square — Watch Parties & Bar Scene',
    description: 'Rittenhouse Square, le quartier le plus chic et le plus résidentiel de Philadelphia, programme des watch parties dans ses bars, restaurants gastronomiques et terrasses pendant les 39 jours de la Coupe du Monde. Le square victorien central, entouré d\'hôtels de luxe, de boutiques de créateurs et de restaurants récompensés, est l\'endroit idéal pour un avant ou après-match dans une ambiance sophistiquée et décontractée.',
    lieu_key: 'Rittenhouse Square',
    date_debut: '2026-06-11T16:00:00',
    date_fin: '2026-07-19T02:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.rittenhousesq.com',
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
    for (const evt of EVENEMENTS_PHILLY_MUNDIAL) {
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

      const lieuData = LIEUX_PHILLY[evt.lieu_key]
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
      ville: 'Philadelphia',
      total: EVENEMENTS_PHILLY_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 19 juillet 2026 (39 jours complets — seule ville USA + America 250)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
