// SC-NUITS-AFRIQUE — Import billetterie Festival International Nuits d'Afrique
// Source : page WYSIWYG WordPress sans JSON-LD ni classes CSS — parsing manuel
//   par bloc <h3>jour</h3> + <table><tr><td> (voir inspection HTML brute).
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../lib/deduplication'

const BILLETTERIE_URL = 'https://www.festivalnuitsdafrique.com/billetterie-2026/'

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

export const maxDuration = 30

// Salles fixes de l'édition 2026 — coordonnées géocodées une fois via Mapbox
// (adresses vérifiées, pas d'appel API à chaque exécution du scraper).
const SALLES: Record<string, { adresse: string; latitude: number; longitude: number }> = {
  'MTelus':            { adresse: '59 rue Sainte-Catherine Est, Montréal',   latitude: 45.510772, longitude: -73.563624 },
  'Le Gésu':           { adresse: '1200 rue de Bleury, Montréal',           latitude: 45.505393, longitude: -73.566260 },
  'Club Balattou':     { adresse: '4372 boul. Saint-Laurent, Montréal',     latitude: 45.519083, longitude: -73.584638 },
  'Le National':       { adresse: '1220 rue Sainte-Catherine Est, Montréal', latitude: 45.518581, longitude: -73.555849 },
  'Le Ministère':      { adresse: '4521 boul. Saint-Laurent, Montréal',     latitude: 45.520477, longitude: -73.586766 },
  'Théâtre Fairmount': { adresse: '5240 avenue du Parc, Montréal',          latitude: 45.520385, longitude: -73.598715 },
}

const MOIS_FR: Record<string, string> = {
  'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08', 'aout': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12', 'decembre': '12',
}

// Ne matche QUE les <h3> "jour-de-semaine + jour + mois" — exclut le bloc
// "Offres spéciales" en haut de page, qui n'utilise pas de <h3>.
const JOUR_REGEX = /^(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+([a-zàâéèêëîïôûùç]+)$/i

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface DayBlock {
  date: string   // YYYY-MM-DD
  html: string
}

// Découpe le document en blocs "un jour = un <h3> + tout le HTML jusqu'au
// <h3> suivant (ou fin de document)".
function findDayBlocks(html: string): DayBlock[] {
  const h3Matches = [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)]

  const jours: { date: string; index: number }[] = []
  for (const m of h3Matches) {
    const texte = stripTags(m[1])
    const match = texte.match(JOUR_REGEX)
    if (!match) continue

    const jour  = match[1].padStart(2, '0')
    const mois  = MOIS_FR[match[2].toLowerCase()]
    if (!mois) continue

    jours.push({ date: `2026-${mois}-${jour}`, index: m.index! })
  }

  return jours.map((j, i) => ({
    date: j.date,
    html: html.slice(j.index, i + 1 < jours.length ? jours[i + 1].index : html.length),
  }))
}

interface ConcertData {
  date:        string   // YYYY-MM-DD
  heure:       string   // HH:MM
  artiste:     string
  salle:       string
  pays:        string | null
  prixTexte:   string | null
  lien:        string
}

// Un jour n'a jamais de <table> imbriquée (vérifié sur le HTML réel) —
// une simple extraction <tr>...<td> suffit, pas besoin de parser récursif.
function parseDayBlock(block: DayBlock): ConcertData[] {
  const concerts: ConcertData[] = []
  const rows = [...block.html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1])
    if (cells.length !== 3) continue

    const [cellHeure, cellArtiste, cellPrix] = cells

    const heureMatch = stripTags(cellHeure).match(/(\d{1,2})H(\d{2})/i)
    if (!heureMatch) continue
    const heure = `${heureMatch[1].padStart(2, '0')}:${heureMatch[2]}`

    const divs    = [...cellArtiste.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/g)]
    const artiste = divs[0] ? stripTags(divs[0][1]) : ''
    if (!artiste) continue

    const spans = [...cellArtiste.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)]
    const salle = spans[0] ? stripTags(spans[0][1]) : ''
    const pays  = spans[1] ? stripTags(spans[1][1]) : null
    if (!salle) continue

    const prixSpanMatch = cellPrix.match(/<span[^>]*>([\s\S]*?)<\/span>/)
    const prixTexte = prixSpanMatch ? stripTags(prixSpanMatch[1]) : null

    const lienMatch = cellPrix.match(/<a[^>]+href="([^"]+)"/)
    if (!lienMatch) continue
    const lien = decodeEntities(lienMatch[1])

    concerts.push({ date: block.date, heure, artiste, salle, pays, prixTexte, lien })
  }

  return concerts
}

function parseEvents(html: string): ConcertData[] {
  return findDayBlocks(html).flatMap(parseDayBlock)
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let inseres  = 0
  let doublons = 0
  let erreurs  = 0
  const details: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    const res = await fetch(BILLETTERIE_URL, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch billetterie a échoué (HTTP ${res.status})` }, { status: 502 })
    }

    const html   = await res.text()
    const events = parseEvents(html)

    for (const evt of events) {
      const salleData = SALLES[evt.salle]
      if (!salleData) {
        erreurs++
        details.push({ titre: evt.artiste, statut: 'erreur', raison: `salle inconnue: ${evt.salle}` })
        continue
      }

      const sourceId = `nuits-afrique-${evt.date}-${evt.heure.replace(':', 'h')}-${slugify(evt.artiste)}`

      // T-1 — Filtre anti-réimport suppression
      const bloquee = await estSourceBloquee(supabase, 'nuits-afrique', sourceId)
      if (bloquee) { doublons++; continue }

      const { data: existing } = await supabase
        .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
      if (existing) { doublons++; continue }

      // Anti-doublon cross-sources
      const dedup = await verifierDoublon(supabase, {
        titre:     evt.artiste,
        date:      evt.date,
        latitude:  salleData.latitude,
        longitude: salleData.longitude,
        source_id: sourceId,
      })
      if (dedup.estDoublon) { doublons++; continue }

      const description = [
        `${evt.artiste}${evt.pays ? ` (${evt.pays})` : ''} en concert au ${evt.salle}.`,
        `Festival International Nuits d'Afrique de Montréal, 40e édition.`,
        evt.prixTexte ? `Tarif : ${evt.prixTexte}.` : null,
      ].filter(Boolean).join(' ')

      const { error } = await supabase.from('evenements').insert([{
        titre:       `Nuits d'Afrique — ${evt.artiste}`,
        lieu:        evt.salle,
        ville:       'Montréal',
        pays:        'Canada',
        date:        evt.date,
        date_debut:  evt.date,
        heure_debut: evt.heure,
        description,
        latitude:    salleData.latitude,
        longitude:   salleData.longitude,
        categorie:   'Concert / Spectacle',
        prix:        'payant',
        acces:       'public',
        statut:      'approuve',
        visibilite:  'public',
        source:      'nuits-afrique',
        source_id:   sourceId,
        lien:        evt.lien,
      }])

      if (error) {
        erreurs++
        details.push({ titre: evt.artiste, statut: 'erreur', raison: error.message })
      } else {
        inseres++
        details.push({ titre: evt.artiste, statut: 'inséré' })
      }
    }

    return NextResponse.json({
      success: true,
      total_trouves: events.length,
      inseres,
      doublons,
      erreurs,
      evenements: details,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
