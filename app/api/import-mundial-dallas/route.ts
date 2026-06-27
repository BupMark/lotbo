// SC-MONDIAL-FIFA-2 S2 — Événements autour de la Coupe du Monde 2026 · Dallas / Arlington
// ⚠️ FORMULATION : "Événements à Dallas pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : dallasfwc26.com, texaslive.com,
//   klydewarrenpark.org, deepellumtexas.com, toyotamusicfactory.com)
// Période couverte : 11 juin → 14 juillet 2026 (Dallas 9 matchs + demi-finale)
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estSourceBloquee } from '../../../lib/deduplication'

// Coordonnées GPS niveau bâtiment — Dallas + Arlington, Texas
const LIEUX_DALLAS: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Fair Park — FIFA Fan Festival Dallas':  { latitude: 32.7788, longitude: -96.7583, adresse: '3809 Grand Avenue', ville: 'Dallas', pays: 'USA' },
  'Dos Equis Pavilion (Fair Park)':        { latitude: 32.7794, longitude: -96.7570, adresse: '3839 Grand Avenue', ville: 'Dallas', pays: 'USA' },
  'AT&T Stadium (Dallas Stadium)':         { latitude: 32.7480, longitude: -97.0930, adresse: '1 AT&T Way', ville: 'Arlington', pays: 'USA' },
  'Texas Live! Arlington':                 { latitude: 32.7503, longitude: -97.0856, adresse: '1650 E Randol Mill Road', ville: 'Arlington', pays: 'USA' },
  'Klyde Warren Park':                     { latitude: 32.7893, longitude: -96.8016, adresse: '2012 Woodall Rodgers Freeway', ville: 'Dallas', pays: 'USA' },
  'Deep Ellum neighborhood':               { latitude: 32.7833, longitude: -96.7858, adresse: 'Main Street & Commerce Street', ville: 'Dallas', pays: 'USA' },
  'Uptown Dallas — West Village':          { latitude: 32.8021, longitude: -96.8007, adresse: '3699 McKinney Avenue', ville: 'Dallas', pays: 'USA' },
  'American Airlines Center':              { latitude: 32.7905, longitude: -96.8103, adresse: '2500 Victory Avenue', ville: 'Dallas', pays: 'USA' },
  'Dallas Arts District':                  { latitude: 32.7878, longitude: -96.7997, adresse: 'Flora Street', ville: 'Dallas', pays: 'USA' },
  'Toyota Music Factory — Irving':         { latitude: 32.8568, longitude: -96.9611, adresse: '300 W Las Colinas Blvd', ville: 'Irving', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_DALLAS
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — DALLAS / ARLINGTON · FIFA WORLD CUP 2026 PERIOD
// Sources : dallasfwc26.com · texaslive.com · klydewarrenpark.org
//           deepellumtexas.com · toyotamusicfactory.com · uptowndallas.net
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_DALLAS_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFFICIEL ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-dallas-fifa-fan-festival',
    titre: 'FIFA Fan Festival™ Dallas — Fair Park (34 jours)',
    description: 'Le Festival FIFA officiel de Dallas transforme le légendaire Fair Park — 277 acres classés au patrimoine — en la plus grande fan zone de la Coupe du Monde aux États-Unis. Capacité jusqu\'à 35 000 personnes par jour, village walkable, mini soccer fields, 7 000 sièges couverts, écrans géants, food vendors internationaux et scène musicale principale. L\'une des rares fan zones officielles entièrement gratuites du tournoi. Ouvert du 11 juin au 19 juillet 2026 — la plus longue de toutes les villes hôtes.',
    lieu_key: 'Fair Park — FIFA Fan Festival Dallas',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.dallasfwc26.com/fifafanfestival-dallas/',
  },

  // ── CONCERTS ──────────────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-dallas-concert-major-lazer',
    titre: 'Major Lazer — FIFA Fan Festival Concert · Fair Park Pavilion',
    description: 'Diplo, Walshy Fire et Ape Drums headlinent la clôture musicale du FIFA Fan Festival Dallas au Dos Equis Pavilion du Fair Park. Le trio électronique de Major Lazer arrive directement depuis la cérémonie de clôture des Jeux Olympiques de Milan 2026. Une nuit de dance music explosive pour célébrer la fin du Festival. Billets à partir de $26.',
    lieu_key: 'Dos Equis Pavilion (Fair Park)',
    date_debut: '2026-07-09T20:30:00',
    date_fin: '2026-07-10T00:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.dallasfwc26.com/fifafanfestival-dallas/',
  },
  {
    source_id: 'mundial2026-dallas-concert-turnpike-troubadours',
    titre: 'Turnpike Troubadours — FIFA Fan Festival Concert · Fair Park Pavilion',
    description: 'Les Turnpike Troubadours, emblèmes de la Red Dirt music scene texane et du country rock de l\'Oklahoma, headlinent le concert du 4 juillet au Dos Equis Pavilion du Fair Park. Une célébration parfaite de l\'Independance Day américain et de la Coupe du Monde en sol texan. Billets à partir de $26.',
    lieu_key: 'Dos Equis Pavilion (Fair Park)',
    date_debut: '2026-07-04T19:30:00',
    date_fin: '2026-07-04T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.dallasfwc26.com/fifafanfestival-dallas/',
  },
  {
    source_id: 'mundial2026-dallas-concert-junio28-fairpark',
    titre: 'FIFA Fan Festival Opening Concert — Fair Park Pavilion',
    description: 'Premier concert de la série musicale du FIFA Fan Festival Dallas au Dos Equis Pavilion du Fair Park. Un événement d\'ouverture festif qui lance la programmation musicale du festival pour tout le tournoi. Billets à partir de $26. Le Dos Equis Pavilion, l\'une des salles de plein air les plus iconiques de Dallas, accueille ce moment inaugural.',
    lieu_key: 'Dos Equis Pavilion (Fair Park)',
    date_debut: '2026-06-28T20:00:00',
    date_fin: '2026-06-28T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.dallasfwc26.com/fifafanfestival-dallas/',
  },

  // ── FAN ZONES & ENTERTAINMENT DISTRICTS ───────────────────────────────────

  {
    source_id: 'mundial2026-dallas-texas-live-fanzone',
    titre: 'Texas Live! Arlington — World Cup Fan Hub',
    description: 'Texas Live!, le complexe d\'entertainment installé juste en face de l\'AT&T Stadium (Dallas Stadium), est le fan hub incontournable d\'Arlington pendant la Coupe du Monde. Watch parties quotidiennes sur écrans géants, concerts, bars et restaurants thématiques sur 200 000 sq ft d\'espace. Des dizaines d\'établissements animés pendant chacun des 9 matchs de Dallas, à deux minutes à pied de l\'entrée du stade.',
    lieu_key: 'Texas Live! Arlington',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-14T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.texaslive.com',
  },
  {
    source_id: 'mundial2026-dallas-klyde-warren-park',
    titre: 'Klyde Warren Park — World Cup Watch Parties & Events',
    description: 'Le Klyde Warren Park, parc suspendu au-dessus de l\'autoroute Woodall Rodgers au cœur de Dallas, programme des activations FIFA, concerts gratuits, food trucks et retransmissions sur écrans pendant les matchs. Ce parc linéaire de 5 acres, au cœur du quartier des arts, est le salon en plein air de Dallas — le lieu idéal pour vivre la Coupe du Monde en famille ou entre amis.',
    lieu_key: 'Klyde Warren Park',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-14T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.klydewarrenpark.org',
  },
  {
    source_id: 'mundial2026-dallas-deep-ellum-worldcup',
    titre: 'Deep Ellum — World Cup Bar District & Live Music',
    description: 'Deep Ellum, le quartier culturel et nocturne de Dallas, vibre au rythme de la Coupe du Monde. Ses bars légendaires, clubs de musique live blues, rock et hip-hop, murales emblématiques et restaurants du monde entier accueillent des watch parties chaque soir de match. Des dizaines d\'établissements participent aux festivités, créant une atmosphère unique entre art de rue et passion footballistique.',
    lieu_key: 'Deep Ellum neighborhood',
    date_debut: '2026-06-14T18:00:00',
    date_fin: '2026-07-14T23:59:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.deepellumtexas.com',
  },
  {
    source_id: 'mundial2026-dallas-arts-district-summer',
    titre: 'Dallas Arts District — Summer Exhibitions & Performances',
    description: 'Le plus grand contiguous urban arts district des États-Unis programme des expositions et performances pendant toute la Coupe du Monde. Le Dallas Museum of Art, le Nasher Sculpture Center, le Winspear Opera House et le Wyly Theatre accueillent des événements spéciaux en lien avec la diversité culturelle du tournoi. Entrées partiellement gratuites dans certains musées.',
    lieu_key: 'Dallas Arts District',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-14T21:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.dallasartsdistrict.org',
  },
  {
    source_id: 'mundial2026-dallas-toyota-music-factory',
    titre: 'Toyota Music Factory — Summer Concert Series, Irving',
    description: 'Le Toyota Music Factory à Las Colinas (Irving), à proximité du DFW Airport, programme une saison de concerts estivaux en plein air et en salle pendant toute la période de la Coupe du Monde. Ce complexe de divertissement de 100 000 sq ft — avec restaurants, bars et deux salles de concert — accueille des artistes nationaux et internationaux dans un cadre moderne au bord du lac Las Colinas.',
    lieu_key: 'Toyota Music Factory — Irving',
    date_debut: '2026-06-11T18:00:00',
    date_fin: '2026-07-14T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.toyotamusicfactory.com',
  },
  {
    source_id: 'mundial2026-dallas-uptown-fanzone',
    titre: 'Uptown Dallas — World Cup Watch Parties & Nightlife',
    description: 'Uptown Dallas, le quartier le plus animé de la ville avec ses terrasses, restaurants gastronomiques et bars branchés le long de McKinney Avenue et Henderson Avenue, se transforme en fan zone internationale pendant les 9 matchs de Dallas. Watch parties géantes sur terrasses, ambiance internationale, restaurants du monde entier et nightlife texane se mêlent à la fièvre de la Coupe du Monde.',
    lieu_key: 'Uptown Dallas — West Village',
    date_debut: '2026-06-14T12:00:00',
    date_fin: '2026-07-14T23:59:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.uptowndallas.net',
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
    for (const evt of EVENEMENTS_DALLAS_MUNDIAL) {
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
      const lieuData = LIEUX_DALLAS[evt.lieu_key]
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
      ville: 'Dallas / Arlington',
      total: EVENEMENTS_DALLAS_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 14 juillet 2026 (Dallas 9 matchs + demi-finale)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
