import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../lib/deduplication'
import { normaliserVille } from '../../../lib/normalisation'

const CATEGORIE_MAP: Record<string, string> = {
  'music':              'Concert / Spectacle',
  'nightlife':          'Concert / Spectacle',
  'performing-arts':    'Concert / Spectacle',
  'comedy':             'Concert / Spectacle',
  'film-media-entertainment': 'Concert / Spectacle',
  'arts':               'Foire / Exposition',
  'visual-arts':        'Foire / Exposition',
  'food-drink':         'Foire / Exposition',
  'fashion':            'Foire / Exposition',
  'sports-fitness':     'Tournoi / Compétition',
  'science-tech':       'Conférence / Sommet',
  'business':           'Conférence / Sommet',
  'community':          'Célébration communautaire',
  'social':              'Célébration communautaire',
  'holiday':            'Célébration communautaire',
  'education':          'Formation / Séminaire',
  'health-wellness':    'Formation / Séminaire',
  'family-education':   'Formation / Séminaire',
  'charity-causes':     'Célébration communautaire',
  'travel-outdoor':     'Festival',
  'hobbies':            'Festival',
}

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

// Une zone = une URL Eventbrite + valeurs de repli ville/pays (déjà normalisées FR).
// Mexico City utilise le slug "--distrito-federal" : le slug court
// "mexico--mexico-city" renvoie une page interstitielle régionale sans jsonld.
const ZONES: Record<string, { url: string; villeFallback: string; paysFallback: string }> = {
  'mexico-city':  { url: 'https://www.eventbrite.com/d/mexico--mexico-city--distrito-federal/events/', villeFallback: 'Ciudad de México', paysFallback: 'Mexique' },
  'guadalajara':  { url: 'https://www.eventbrite.com/d/mexico--guadalajara/events/',                     villeFallback: 'Guadalajara',       paysFallback: 'Mexique' },
  'buenos-aires': { url: 'https://www.eventbrite.com/d/argentina--buenos-aires/events/',                villeFallback: 'Buenos Aires',       paysFallback: 'Argentine' },
  'mendoza':      { url: 'https://www.eventbrite.com/d/argentina--mendoza/events/',                    villeFallback: 'Mendoza',            paysFallback: 'Argentine' },
  'cordoba':      { url: 'https://www.eventbrite.com/d/argentina--cordoba/events/',                    villeFallback: 'Córdoba',            paysFallback: 'Argentine' },
  'bogota':       { url: 'https://www.eventbrite.com/d/colombia--bogota/events/',                       villeFallback: 'Bogotá',             paysFallback: 'Colombie' },
  'toronto':       { url: 'https://www.eventbrite.com/d/canada--toronto/events/',           villeFallback: 'Toronto',       paysFallback: 'Canada' },
  'vancouver':     { url: 'https://www.eventbrite.com/d/canada--vancouver/events/',         villeFallback: 'Vancouver',     paysFallback: 'Canada' },
  'lima':          { url: 'https://www.eventbrite.com/d/peru--lima/events/',                villeFallback: 'Lima',          paysFallback: 'Pérou' },
  'santiago':      { url: 'https://www.eventbrite.com/d/chile--santiago/events/',           villeFallback: 'Santiago',      paysFallback: 'Chili' },
  'sao-paulo':     { url: 'https://www.eventbrite.com/d/brazil--sao-paulo/events/',         villeFallback: 'São Paulo',     paysFallback: 'Brésil' },
  'rio-de-janeiro':{ url: 'https://www.eventbrite.com/d/brazil--rio-de-janeiro/events/',   villeFallback: 'Rio de Janeiro',paysFallback: 'Brésil' },
  'medellin':      { url: 'https://www.eventbrite.com/d/colombia--medell%C3%ADn/events/',   villeFallback: 'Medellín',      paysFallback: 'Colombie' },
  'montevideo':    { url: 'https://www.eventbrite.com/d/uruguay--montevideo/events/',       villeFallback: 'Montevideo',    paysFallback: 'Uruguay' },
  // SCRAPER-EVENTBRITE-DIASPORA — diaspora haïtienne, priorité haute
  'montreal':      { url: 'https://www.eventbrite.com/d/canada--montreal/events/',          villeFallback: 'Montréal',      paysFallback: 'Canada' },
  'quebec-city':   { url: 'https://www.eventbrite.com/d/canada--quebec-city/events/',       villeFallback: 'Québec',        paysFallback: 'Canada' },
  'miami':         { url: 'https://www.eventbrite.com/d/fl--miami/events/',                 villeFallback: 'Miami',         paysFallback: 'USA' },
  'new-york':      { url: 'https://www.eventbrite.com/d/ny--new-york/events/',              villeFallback: 'New York',      paysFallback: 'USA' },
  'boston':        { url: 'https://www.eventbrite.com/d/ma--boston/events/',                villeFallback: 'Boston',        paysFallback: 'USA' },
}

const MAX_PAGES = 3

// Limite explicite pour rester sous le timeout serverless quelle que soit
// l'offre Vercel (Hobby/Pro acceptent toutes deux jusqu'à 60s en config explicite).
export const maxDuration = 60

interface EventData {
  name:       string
  url:        string
  eid:        string
  start_date: string
  start_time: string | null
  end_date:   string | null
  summary:    string | null
  image_url:  string | null
  venue_name: string | null
  city:       string | null
  latitude:   number | null
  longitude:  number | null
  category:   string | null
}

// Extraction robuste du bloc "jsonld":[...] avec comptage des brackets
function extractJsonLd(html: string): any[] {
  const marker = '"jsonld":['
  const idx    = html.indexOf(marker)
  if (idx === -1) return []

  let pos          = idx + marker.length
  let bracketDepth = 1
  let inStr        = false
  let escape       = false

  for (let i = pos; i < html.length; i++) {
    const c = html[i]
    if (escape)                    { escape = false; continue }
    if (c === '\\' && inStr)       { escape = true;  continue }
    if (c === '"' && !escape)      { inStr = !inStr; continue }
    if (inStr)                      continue
    if      (c === '[') bracketDepth++
    else if (c === ']') {
      bracketDepth--
      if (bracketDepth === 0) {
        try {
          const arr  = JSON.parse('[' + html.slice(pos, i) + ']')
          const list = arr[0]?.itemListElement
          if (Array.isArray(list)) return list.map((el: any) => el.item ?? el)
        } catch { return [] }
      }
    }
  }
  return []
}

// Carte eid → data-event-category depuis les attributs HTML des cartes
function extractCategoryMap(html: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of html.matchAll(/data-event-id="(\d+)"[^>]*data-event-category="([^"]+)"/g)) {
    map[m[1]] = m[2]
  }
  return map
}

function parseEvents(html: string): EventData[] {
  const items      = extractJsonLd(html)
  const catMap     = extractCategoryMap(html)
  const events: EventData[] = []
  const seenEids   = new Set<string>()

  for (const item of items) {
    const rawUrl = item.url as string | undefined
    // Accepter tous les domaines Eventbrite (.com, .com.mx, .com.ar, .com.co, etc.)
    if (!rawUrl?.match(/eventbrite\.[a-z.]+\/e\//)) continue

    const url      = rawUrl.split('?')[0]         // retire ?aff=...
    const eidMatch = url.match(/(\d+)[^/]*$/)
    if (!eidMatch) continue
    const eid = eidMatch[1]
    if (seenEids.has(eid)) continue
    seenEids.add(eid)

    // Filtrer les événements en ligne
    if ((item.eventAttendanceMode as string)?.includes('OnlineEvent')) continue

    const startRaw  = (item.startDate as string) ?? ''
    const endRaw    = (item.endDate   as string) ?? ''
    const start_date = startRaw.slice(0, 10)      // "2026-05-28T20:00" → "2026-05-28"
    if (!start_date) continue

    const start_time = startRaw.includes('T') ? startRaw.slice(11, 16) : null
    const endDate    = endRaw.slice(0, 10)
    const end_date   = endDate && endDate !== start_date ? endDate : null

    const lat = item.location?.geo?.latitude  ? parseFloat(item.location.geo.latitude)  : null
    const lon = item.location?.geo?.longitude ? parseFloat(item.location.geo.longitude) : null

    // Décoder l'image : proxy img.evbuc.com → CDN propre cdn.evbuc.com
    let image_url: string | null = (item.image as string) || null
    if (image_url?.startsWith('https://img.evbuc.com/https')) {
      try {
        const inner = image_url.replace(/^https:\/\/img\.evbuc\.com\//, '').split('?')[0]
        image_url   = decodeURIComponent(inner)
      } catch { /* garder l'URL proxy */ }
    }

    events.push({
      name:       (item.name as string) || '',
      url,
      eid,
      start_date,
      start_time,
      end_date,
      summary:    (item.description as string) || null,
      image_url,
      venue_name: (item.location?.name as string) || null,
      city:       (item.location?.address?.addressLocality as string) || null,
      latitude:   lat,
      longitude:  lon,
      category:   catMap[eid] || null,
    })
  }

  return events
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const zoneKey = searchParams.get('zone')

  if (!zoneKey || !ZONES[zoneKey]) {
    return NextResponse.json({
      success: false,
      error: 'Paramètre "zone" requis ou invalide',
      zones_valides: Object.keys(ZONES),
    }, { status: 400 })
  }

  const zone = ZONES[zoneKey]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported      = 0
  let skipped       = 0
  let doublons      = 0
  let errors        = 0
  let pages_scraped = 0
  const seenEids    = new Set<string>()

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const pageUrl = page === 1 ? zone.url : `${zone.url}?page=${page}`
      const res     = await fetch(pageUrl, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)

      if (!res.ok) break

      const html   = await res.text()
      const events = parseEvents(html)
      if (events.length === 0) break

      pages_scraped++

      for (const ev of events) {
        if (seenEids.has(ev.eid)) { skipped++; continue }
        seenEids.add(ev.eid)

        // Ignorer sans coordonnées GPS
        if (!ev.latitude || !ev.longitude) { skipped++; continue }

        const sourceId = `eventbrite-${ev.eid}`

        // Anti-doublon même source
        // T-1 — Filtre anti-réimport suppression
        const bloquee = await estSourceBloquee(supabase, 'eventbrite', sourceId)
        if (bloquee) { skipped++; continue }

        const { data: existing } = await supabase
          .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
        if (existing) { skipped++; continue }

        // Anti-doublon cross-sources
        const dedup = await verifierDoublon(supabase, {
          titre:     ev.name,
          date:      ev.start_date,
          latitude:  ev.latitude,
          longitude: ev.longitude,
          source_id: sourceId,
        })
        if (dedup.estDoublon) { doublons++; continue }

        const categorie = ev.category
          ? (CATEGORIE_MAP[ev.category] ?? 'Célébration communautaire')
          : 'Célébration communautaire'

        const ville = ev.city ? normaliserVille(ev.city) : zone.villeFallback

        const { error } = await supabase.from('evenements').insert([{
          titre:       ev.name,
          lieu:        ev.venue_name || ville,
          ville,
          pays:        zone.paysFallback,
          date:        ev.start_date,
          date_debut:  ev.start_date,
          date_fin:    ev.end_date,
          heure_debut: ev.start_time,
          description: ev.summary,
          latitude:    ev.latitude,
          longitude:   ev.longitude,
          categorie,
          image_url:   ev.image_url,
          prix:        'payant',
          acces:       'public',
          statut:      'approuve',
          visibilite:  'public',
          source:      'eventbrite',
          source_id:   sourceId,
          lien:        ev.url,
        }])

        if (error) { errors++ } else { imported++ }

        await new Promise(r => setTimeout(r, 300))
      }
    } catch { break }
  }

  return NextResponse.json({
    success: true,
    zone:    zoneKey,
    imported,
    skipped,
    doublons,
    errors,
    pages_scraped,
  })
}
