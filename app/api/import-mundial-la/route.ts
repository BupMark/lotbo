// SC-MONDIAL-FIFA-2 — Événements autour de la Coupe du Monde 2026 · Los Angeles
// ⚠️ FORMULATION : "Événements à Los Angeles pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : losangelesfwc26.com, timeout.com/la,
//   discoverlosangeles.com, lacoliseum.com, sofistadium.com, visitcalifornia.com)
// Période couverte : 11 juin → 10 juillet 2026 (matchs LA jusqu'au quart de finale)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

// Coordonnées GPS niveau bâtiment — Los Angeles County
const LIEUX_LA: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  // Stade & alentours
  'SoFi Stadium — Inglewood':              { latitude: 33.9535, longitude: -118.3392, adresse: '1001 Stadium Drive', ville: 'Inglewood', pays: 'USA' },
  'Kia Forum — Inglewood':                 { latitude: 33.9584, longitude: -118.3416, adresse: '3900 W Manchester Blvd', ville: 'Inglewood', pays: 'USA' },
  'Intuit Dome — Inglewood':               { latitude: 33.9579, longitude: -118.3446, adresse: '3939 S Figueroa Street', ville: 'Inglewood', pays: 'USA' },
  // Fan Zones officielles
  'LA Memorial Coliseum — Exposition Park': { latitude: 34.0141, longitude: -118.2879, adresse: '3911 S Figueroa Street', ville: 'Los Angeles', pays: 'USA' },
  'Original Farmers Market — Fairfax':     { latitude: 34.0705, longitude: -118.3597, adresse: '6333 W 3rd Street', ville: 'Los Angeles', pays: 'USA' },
  'Union Station — Downtown LA':           { latitude: 34.0559, longitude: -118.2361, adresse: '800 N Alameda Street', ville: 'Los Angeles', pays: 'USA' },
  'Venice Beach':                          { latitude: 33.9850, longitude: -118.4695, adresse: '1800 Ocean Front Walk', ville: 'Los Angeles', pays: 'USA' },
  'Hansen Dam Lake — Lake View Terrace':   { latitude: 34.2670, longitude: -118.3680, adresse: '11798 Foothill Blvd', ville: 'Lake View Terrace', pays: 'USA' },
  'Earvin Magic Johnson Park':             { latitude: 33.9228, longitude: -118.2444, adresse: '905 E El Segundo Blvd', ville: 'Compton', pays: 'USA' },
  'Fairplex — Pomona':                     { latitude: 34.0543, longitude: -117.7578, adresse: '1101 W McKinley Avenue', ville: 'Pomona', pays: 'USA' },
  'West Harbor — San Pedro':               { latitude: 33.7274, longitude: -118.2778, adresse: '1 Harbor Drive', ville: 'San Pedro', pays: 'USA' },
  'City of Downey':                        { latitude: 33.9401, longitude: -118.1332, adresse: '11111 Brookshire Avenue', ville: 'Downey', pays: 'USA' },
  // Lieux culturels
  'Hollywood Bowl':                        { latitude: 34.1122, longitude: -118.3390, adresse: '2301 N Highland Avenue', ville: 'Los Angeles', pays: 'USA' },
  'The Greek Theatre':                     { latitude: 34.1188, longitude: -118.2985, adresse: '2700 N Vermont Avenue', ville: 'Los Angeles', pays: 'USA' },
  'Getty Center':                          { latitude: 34.0780, longitude: -118.4741, adresse: '1200 Getty Center Drive', ville: 'Los Angeles', pays: 'USA' },
  'LACMA — Los Angeles County Museum of Art': { latitude: 34.0639, longitude: -118.3592, adresse: '5905 Wilshire Blvd', ville: 'Los Angeles', pays: 'USA' },
  'The Broad Museum':                      { latitude: 34.0543, longitude: -118.2502, adresse: '221 S Grand Avenue', ville: 'Los Angeles', pays: 'USA' },
  'Grand Park — Downtown LA':              { latitude: 34.0560, longitude: -118.2468, adresse: '200 N Grand Avenue', ville: 'Los Angeles', pays: 'USA' },
  'Santa Monica Pier':                     { latitude: 34.0095, longitude: -118.4975, adresse: '200 Santa Monica Pier', ville: 'Santa Monica', pays: 'USA' },
  'Dodger Stadium':                        { latitude: 34.0739, longitude: -118.2400, adresse: '1000 Vin Scully Avenue', ville: 'Los Angeles', pays: 'USA' },
  'Staples Center (Crypto.com Arena)':     { latitude: 34.0430, longitude: -118.2673, adresse: '1111 S Figueroa Street', ville: 'Los Angeles', pays: 'USA' },
  'Griffith Observatory':                  { latitude: 34.1184, longitude: -118.3004, adresse: '2800 E Observatory Road', ville: 'Los Angeles', pays: 'USA' },
  'Whittier Narrows Recreation Area':      { latitude: 34.0305, longitude: -118.0499, adresse: '750 S Santa Anita Avenue', ville: 'Whittier', pays: 'USA' },
  'Burbank Downtown':                      { latitude: 34.1808, longitude: -118.3090, adresse: 'San Fernando Blvd & Palm Avenue', ville: 'Burbank', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_LA
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — LOS ANGELES · FIFA WORLD CUP 2026 PERIOD
// Sources : losangelesfwc26.com · timeout.com/los-angeles · discoverlosangeles.com
//           lacoliseum.com · sofistadium.com · visitcalifornia.com · travelnoire.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_LA_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL & FAN ZONES ────────────────────────────────────

  {
    source_id: 'mundial2026-la-fifa-fan-festival-coliseum',
    titre: 'Official FIFA Fan Festival™ Los Angeles — LA Memorial Coliseum',
    description: 'Le Festival FIFA officiel de Los Angeles transforme le légendaire Los Angeles Memorial Coliseum en une célébration mondiale du football et de la culture. Retransmissions live des matchs, concerts de superstars mondiales, programmation culturelle, expériences interactives et gastronomie internationale reflétant la diversité de LA. Ouverture le 11 juin avec Katy Perry, Future, Anitta et LISA lors de la cérémonie d\'ouverture du match USA. Billets à partir de $10, enfants de moins de 12 ans gratuits.',
    lieu_key: 'LA Memorial Coliseum — Exposition Park',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-06-14T22:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.lacoliseum.com/events/fifa-fan-festival-los-angeles/',
  },
  {
    source_id: 'mundial2026-la-fanzone-farmers-market',
    titre: 'LA World Cup Fan Zone — Original Farmers Market (Fairfax)',
    description: 'La fan zone officielle de Los Angeles au célèbre Original Farmers Market sur Fairfax : retransmissions live des matchs, cuisine internationale, animations et music. Le marché emblématique de LA se transforme en carrefour mondial pendant la Coupe du Monde. Accès gratuit, dans un cadre iconique de Los Angeles depuis 1934.',
    lieu_key: 'Original Farmers Market — Fairfax',
    date_debut: '2026-06-18T11:00:00',
    date_fin: '2026-06-21T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-union-station',
    titre: 'LA World Cup Fan Zone — Union Station & LA Plaza de Cultura y Artes',
    description: 'La fan zone officielle au cœur de Downtown Los Angeles, entre l\'Union Station et LA Plaza de Cultura y Artes. Retransmissions des matchs, animations culturelles et célébrations dans l\'un des quartiers les plus historiques et multiculturels de LA. Un point de convergence idéal pour les fans arrivant en train ou en métro.',
    lieu_key: 'Union Station — Downtown LA',
    date_debut: '2026-06-25T11:00:00',
    date_fin: '2026-06-28T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-hansen-dam',
    titre: 'LA World Cup Fan Zone — Hansen Dam Lake, Lake View Terrace',
    description: 'Fan zone officielle de LA au Hansen Dam Lake, dans la vallée de San Fernando. Retransmissions en plein air avec vue sur le lac, animations familiales, food trucks et activités sportives. Un cadre naturel exceptionnel pour vivre la Coupe du Monde loin du bruit de la ville. Parking disponible sur place.',
    lieu_key: 'Hansen Dam Lake — Lake View Terrace',
    date_debut: '2026-07-02T11:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-magic-johnson-park',
    titre: 'LA World Cup Fan Zone — Earvin Magic Johnson Park, Compton',
    description: 'Fan zone officielle de la Coupe du Monde au Earvin "Magic" Johnson Park, dans le quartier de Compton. Retransmissions des matchs, animations culturelles et festivités communautaires dans le parc qui porte le nom de la légende des Lakers. Une célébration inclusive au cœur de LA.',
    lieu_key: 'Earvin Magic Johnson Park',
    date_debut: '2026-07-04T11:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-whittier',
    titre: 'LA World Cup Fan Zone — Whittier Narrows Recreation Area',
    description: 'Fan zone officielle au Whittier Narrows Recreation Area, dans l\'est de LA County. Trois jours de retransmissions live, animations et festivités dans ce grand parc de la vallée de San Gabriel. Un espace de 1 400 acres qui accueille la communauté latinoaméricaine très présente dans l\'est de Los Angeles.',
    lieu_key: 'Whittier Narrows Recreation Area',
    date_debut: '2026-07-09T11:00:00',
    date_fin: '2026-07-11T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-venice-beach',
    titre: 'LA World Cup Fan Zone — Venice Beach',
    description: 'Fan zone officielle de la Coupe du Monde à Venice Beach, l\'une des plages les plus emblématiques du monde. Retransmissions live avec vue sur le Pacifique, animations, muscle beach, skate park et l\'ambiance bohème unique de Venice. Une expérience de beach soccer à l\'américaine. Accès gratuit.',
    lieu_key: 'Venice Beach',
    date_debut: '2026-07-11T11:00:00',
    date_fin: '2026-07-11T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-fairplex',
    titre: 'LA World Cup Fan Zone — Fairplex, Pomona',
    description: 'Fan zone officielle des phases finales de la Coupe du Monde au Fairplex de Pomona, au cœur de l\'Inland Empire. Active pour les matchs de quart de finale (14-15 et 18-19 juillet), cette fan zone de grande capacité offre retransmissions sur écrans géants, food fest et animations culturelles pour toute la famille.',
    lieu_key: 'Fairplex — Pomona',
    date_debut: '2026-07-14T11:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-west-harbor',
    titre: 'LA World Cup Fan Zone — West Harbor, San Pedro',
    description: 'Fan zone officielle au nouveau complexe West Harbor de San Pedro, le port de Los Angeles récemment réaménagé. Vue sur le port et les îles Channel Islands, retransmissions des quarts de finale, restaurants, bars et animations. Une destination de choix pour les fans qui séjournent dans la partie sud de LA County.',
    lieu_key: 'West Harbor — San Pedro',
    date_debut: '2026-07-14T11:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-downey',
    titre: 'LA World Cup Fan Zone — City of Downey',
    description: 'Fan zone officielle de la Coupe du Monde dans la ville de Downey, dans le sud-est de LA County. Animations communautaires, retransmissions des matchs et célébrations reflétant la forte communauté latinoaméricaine de cette ville. Un événement ancré dans la communauté, gratuit et accessible à tous.',
    lieu_key: 'City of Downey',
    date_debut: '2026-06-20T11:00:00',
    date_fin: '2026-06-20T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },
  {
    source_id: 'mundial2026-la-fanzone-burbank',
    titre: 'Downtown Burbank Watch Party & Fan Zone — FIFA World Cup 2026',
    description: 'La ville de Burbank transforme son centre-ville en fan zone pour les matchs décisifs de la Coupe du Monde (18-19 juillet). Dans les rues animées du downtown Burbank, retransmissions en plein air, animations, restaurants et bars thématiques. À deux pas des grands studios hollywoodiens, une atmosphère festive et cinématographique.',
    lieu_key: 'Burbank Downtown',
    date_debut: '2026-07-18T14:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.timeout.com/los-angeles/things-to-do/fifa-world-cup-2026-los-angeles-guide',
  },

  // ── CONCERTS & SPECTACLES ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-la-opening-ceremony-katy-perry',
    titre: 'Opening Ceremony — Katy Perry, Future, Anitta, LISA · SoFi Stadium',
    description: 'La cérémonie d\'ouverture de la Coupe du Monde 2026 à Los Angeles précède le match d\'ouverture des États-Unis. Katy Perry, Future, Anitta (Brésil) et LISA (Thaïlande/BLACKPINK) headlinent un spectacle mondial de premier plan au SoFi Stadium d\'Inglewood. Une nuit historique qui marque le début du plus grand événement sportif de l\'histoire.',
    lieu_key: 'SoFi Stadium — Inglewood',
    date_debut: '2026-06-12T18:00:00',
    date_fin: '2026-06-12T21:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.sofistadium.com',
  },
  {
    source_id: 'mundial2026-la-hollywood-bowl-summer',
    titre: 'Hollywood Bowl Summer Season — Concerts under the Stars',
    description: 'Le Hollywood Bowl, amphithéâtre en plein air le plus iconique des États-Unis, programme sa saison estivale pendant toute la période de la Coupe du Monde. Concerts symphoniques, pop, jazz et world music sous les étoiles hollywoodiennes, avec les collines de Los Angeles en toile de fond. Une expérience musicale unique à LA que tout visiteur de la Coupe du Monde se doit de vivre.',
    lieu_key: 'Hollywood Bowl',
    date_debut: '2026-06-11T19:30:00',
    date_fin: '2026-07-10T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.hollywoodbowl.com',
  },
  {
    source_id: 'mundial2026-la-greek-theatre-summer',
    titre: 'Greek Theatre — Summer Concert Season',
    description: 'Le Greek Theatre au cœur du Griffith Park programme une saison de concerts estivaux pendant la Coupe du Monde. Cet amphithéâtre de 5 900 places, entouré de forêts, accueille des artistes pop, rock et world music. L\'un des lieux de concert les plus romantiques et caractéristiques de Los Angeles, à deux pas de l\'observatoire Griffith.',
    lieu_key: 'The Greek Theatre',
    date_debut: '2026-06-11T19:00:00',
    date_fin: '2026-07-10T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.greektheatrela.com',
  },
  {
    source_id: 'mundial2026-la-kia-forum-events',
    titre: 'Kia Forum — Live Events Summer 2026',
    description: 'Le Kia Forum à Inglewood, à quelques minutes à pied du SoFi Stadium, accueille des concerts et événements live pendant la période de la Coupe du Monde. Un centre d\'entertainment de légende au cœur du nouveau "Stadium District" d\'Inglewood, entouré de restaurants, bars et hôtels qui vibreront au rythme du football mondial.',
    lieu_key: 'Kia Forum — Inglewood',
    date_debut: '2026-06-11T19:00:00',
    date_fin: '2026-07-10T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.kiaforum.com',
  },
  {
    source_id: 'mundial2026-la-grand-park-summer-concerts',
    titre: 'Grand Park Summer Concerts & Activations — Downtown LA',
    description: 'Grand Park au cœur de Downtown Los Angeles programme des concerts gratuits, des activations culturelles et des animations estivales pendant la Coupe du Monde. Le parc du Civic Center, face à la mairie et au Music Center, est le cœur civique et culturel de LA — et sera vibrant de festivités mondiales tout l\'été.',
    lieu_key: 'Grand Park — Downtown LA',
    date_debut: '2026-06-11T17:00:00',
    date_fin: '2026-07-10T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://grandparkla.org',
  },

  // ── CULTURE & ARTS ────────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-la-lacma-summer-program',
    titre: 'LACMA — Summer Programs & Urban Light',
    description: 'Le Los Angeles County Museum of Art programme des événements estivaux pendant la période de la Coupe du Monde : visites nocturnes, performances, concerts au Bing Theater et animations autour de l\'installation "Urban Light" de Chris Burden. Le plus grand musée d\'art de la côte Ouest, avec une programmation internationale en résonance avec la diversité du tournoi.',
    lieu_key: 'LACMA — Los Angeles County Museum of Art',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-10T21:00:00',
    categorie: 'Foire/Exposition',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.lacma.org',
  },
  {
    source_id: 'mundial2026-la-the-broad-summer',
    titre: 'The Broad Museum — Summer Exhibitions',
    description: 'The Broad, musée d\'art contemporain de Downtown LA, offre un accès gratuit à ses expositions permanentes pendant l\'été. Œuvres de Cindy Sherman, Jeff Koons, Jean-Michel Basquiat et Kara Walker dans un bâtiment architectural spectaculaire. Une destination culturelle gratuite à quelques minutes des fan zones du centre-ville.',
    lieu_key: 'The Broad Museum',
    date_debut: '2026-06-11T11:00:00',
    date_fin: '2026-07-10T20:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.thebroad.org',
  },
  {
    source_id: 'mundial2026-la-getty-center-summer',
    titre: 'Getty Center — Free Summer Visits (with reservation)',
    description: 'Le Getty Center, musée gratuit perché dans les collines de Brentwood, accueille les visiteurs internationaux de la Coupe du Monde avec des programmes estivaux. Collections d\'art européen, jardins paysagers, vues panoramiques sur Los Angeles et le Pacifique. Réservation en ligne obligatoire, mais admission gratuite — une des meilleures offres culturelles gratuites de LA.',
    lieu_key: 'Getty Center',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-10T17:30:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.getty.edu',
  },
  {
    source_id: 'mundial2026-la-griffith-observatory-summer',
    titre: 'Griffith Observatory — Free Stargazing & Views of LA',
    description: 'L\'Observatoire Griffith, icône de Los Angeles visible dans des centaines de films et séries, offre un accès gratuit à ses terrasses et à ses téléscopes publics. Vue à 360° sur toute la ville, Hollywood Hills, le Pacifique et le centre-ville. Un passage incontournable pour tout visiteur de la Coupe du Monde à LA — surtout au coucher du soleil.',
    lieu_key: 'Griffith Observatory',
    date_debut: '2026-06-11T12:00:00',
    date_fin: '2026-07-10T22:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://griffithobservatory.org',
  },

  // ── PLAGE & VIE EXTÉRIEURE ────────────────────────────────────────────────

  {
    source_id: 'mundial2026-la-venice-beach-summer',
    titre: 'Venice Beach Summer — Boardwalk, Muscle Beach & Street Art',
    description: 'Venice Beach en été pendant la Coupe du Monde : boardwalk animé avec jongleurs, musiciens, acrobates et artistes de rue, Muscle Beach (la salle de sport en plein air la plus célèbre du monde), piste cyclable le long du Pacifique, skateparks et galeries de street art. L\'endroit le plus coloré et le plus libre de Los Angeles, accessible à tous, toute la journée.',
    lieu_key: 'Venice Beach',
    date_debut: '2026-06-11T08:00:00',
    date_fin: '2026-07-10T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.visitvenice.com',
  },
  {
    source_id: 'mundial2026-la-santa-monica-pier-summer',
    titre: 'Santa Monica Pier — Concerts & Twilight Summer Series',
    description: 'La jetée de Santa Monica programme sa célèbre Twilight Summer Concert Series pendant la Coupe du Monde. Concerts gratuits en bord de Pacifique chaque jeudi soir, avec des artistes de world music, reggae, latin et indie. Le carrousel centenaire, les manèges, les restaurants et la vue sur les collines de Malibu font du Pier l\'une des destinations incontournables de l\'été à LA.',
    lieu_key: 'Santa Monica Pier',
    date_debut: '2026-06-11T18:00:00',
    date_fin: '2026-07-10T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.santamonicapier.org',
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
    for (const evt of EVENEMENTS_LA_MUNDIAL) {
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
      const lieuData = LIEUX_LA[evt.lieu_key]
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
      ville: 'Los Angeles',
      total: EVENEMENTS_LA_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 10 juillet 2026 (matchs LA jusqu\'au quart de finale)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
