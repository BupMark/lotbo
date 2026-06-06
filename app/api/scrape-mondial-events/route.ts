import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'

const VILLES_HOTES = [
  { ville: 'New York',      pays: 'USA',     slug: 'new-york--ny' },
  { ville: 'Los Angeles',   pays: 'USA',     slug: 'los-angeles--ca' },
  { ville: 'Dallas',        pays: 'USA',     slug: 'dallas--tx' },
  { ville: 'San Francisco', pays: 'USA',     slug: 'san-francisco--ca' },
  { ville: 'Miami',         pays: 'USA',     slug: 'miami--fl' },
  { ville: 'Seattle',       pays: 'USA',     slug: 'seattle--wa' },
  { ville: 'Boston',        pays: 'USA',     slug: 'boston--ma' },
  { ville: 'Atlanta',       pays: 'USA',     slug: 'atlanta--ga' },
  { ville: 'Kansas City',   pays: 'USA',     slug: 'kansas-city--mo' },
  { ville: 'Philadelphia',  pays: 'USA',     slug: 'philadelphia--pa' },
  { ville: 'Houston',       pays: 'USA',     slug: 'houston--tx' },
  { ville: 'Toronto',       pays: 'Canada',  slug: 'canada--on--toronto' },
  { ville: 'Vancouver',     pays: 'Canada',  slug: 'canada--bc--vancouver' },
  { ville: 'Mexico City',   pays: 'Mexique', slug: 'mexico--mexico-city' },
  { ville: 'Guadalajara',   pays: 'Mexique', slug: 'mexico--guadalajara' },
  { ville: 'Monterrey',     pays: 'Mexique', slug: 'mexico--monterrey' },
]

const KEYWORDS_MONDIAL = [
  'world cup', 'coupe du monde', 'fifa', 'fan zone',
  'fanzone', 'watch party', 'soccer', 'football 2026',
]

const DATE_DEBUT = '2026-06-11'
const DATE_FIN   = '2026-07-19'
const MAX_PAGES  = 2

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

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
}

// Extraction robuste du bloc "jsonld":[...] avec comptage des brackets
function extractJsonLd(html: string): Record<string, unknown>[] {
  const marker = '"jsonld":['
  const idx    = html.indexOf(marker)
  if (idx === -1) return []

  const pos          = idx + marker.length
  let bracketDepth   = 1
  let inStr          = false
  let escape         = false

  for (let i = pos; i < html.length; i++) {
    const c = html[i]
    if (escape)               { escape = false; continue }
    if (c === '\\' && inStr)  { escape = true;  continue }
    if (c === '"' && !escape) { inStr = !inStr; continue }
    if (inStr)                  continue
    if      (c === '[') bracketDepth++
    else if (c === ']') {
      bracketDepth--
      if (bracketDepth === 0) {
        try {
          const arr  = JSON.parse('[' + html.slice(pos, i) + ']') as Record<string, unknown>[]
          const list = (arr[0] as Record<string, unknown>)?.itemListElement
          if (Array.isArray(list)) {
            return list.map((el: Record<string, unknown>) =>
              (el.item ?? el) as Record<string, unknown>
            )
          }
        } catch { return [] }
      }
    }
  }
  return []
}

function parseEvents(html: string): EventData[] {
  const items    = extractJsonLd(html)
  const events: EventData[] = []
  const seenEids = new Set<string>()

  for (const item of items) {
    const rawUrl = item.url as string | undefined
    if (!rawUrl?.match(/eventbrite\.[a-z.]+\/e\//)) continue

    const url      = rawUrl.split('?')[0]
    const eidMatch = url.match(/(\d+)[^/]*$/)
    if (!eidMatch) continue
    const eid = eidMatch[1]
    if (seenEids.has(eid)) continue
    seenEids.add(eid)

    if ((item.eventAttendanceMode as string | undefined)?.includes('OnlineEvent')) continue

    const startRaw   = (item.startDate as string) ?? ''
    const endRaw     = (item.endDate   as string) ?? ''
    const start_date = startRaw.slice(0, 10)
    if (!start_date) continue

    // Uniquement événements dans la fenêtre Coupe du Monde 2026
    if (start_date < DATE_DEBUT || start_date > DATE_FIN) continue

    const start_time = startRaw.includes('T') ? startRaw.slice(11, 16) : null
    const endDate    = endRaw.slice(0, 10)
    const end_date   = endDate && endDate !== start_date ? endDate : null

    const loc = item.location as Record<string, unknown> | undefined
    const geo = loc?.geo as Record<string, unknown> | undefined
    const lat = geo?.latitude  ? parseFloat(geo.latitude  as string) : null
    const lon = geo?.longitude ? parseFloat(geo.longitude as string) : null

    let image_url: string | null = (item.image as string) || null
    if (image_url?.startsWith('https://img.evbuc.com/https')) {
      try {
        const inner = image_url.replace(/^https:\/\/img\.evbuc\.com\//, '').split('?')[0]
        image_url   = decodeURIComponent(inner)
      } catch { /* garder l'URL proxy */ }
    }

    const addr = loc?.address as Record<string, unknown> | undefined

    events.push({
      name:       (item.name as string) || '',
      url,
      eid,
      start_date,
      start_time,
      end_date,
      summary:    (item.description as string) || null,
      image_url,
      venue_name: (loc?.name as string) || null,
      city:       (addr?.addressLocality as string) || null,
      latitude:   lat,
      longitude:  lon,
    })
  }

  return events
}

export async function GET() {
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

  for (const villeInfo of VILLES_HOTES) {
    for (const keyword of KEYWORDS_MONDIAL) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        try {
          const base    = `https://www.eventbrite.com/d/${villeInfo.slug}/events/`
          const pageUrl = page === 1
            ? `${base}?q=${encodeURIComponent(keyword)}`
            : `${base}?q=${encodeURIComponent(keyword)}&page=${page}`

          const res = await fetch(pageUrl, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)
          if (!res.ok) break

          const html   = await res.text()
          const events = parseEvents(html)
          if (events.length === 0) break

          pages_scraped++

          for (const ev of events) {
            if (seenEids.has(ev.eid)) { skipped++; continue }
            seenEids.add(ev.eid)

            if (!ev.latitude || !ev.longitude) { skipped++; continue }

            const sourceId = `mondial_2026-${ev.eid}`

            const { data: existing } = await supabase
              .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
            if (existing) { skipped++; continue }

            const dedup = await verifierDoublon(supabase, {
              titre:     ev.name,
              date:      ev.start_date,
              latitude:  ev.latitude,
              longitude: ev.longitude,
              source_id: sourceId,
            })
            if (dedup.estDoublon) { doublons++; continue }

            const { error } = await supabase.from('evenements').insert([{
              titre:       ev.name,
              lieu:        ev.venue_name || ev.city || villeInfo.ville,
              ville:       ev.city       || villeInfo.ville,
              pays:        villeInfo.pays,
              date:        ev.start_date,
              date_debut:  ev.start_date,
              date_fin:    ev.end_date,
              heure_debut: ev.start_time,
              description: ev.summary,
              latitude:    ev.latitude,
              longitude:   ev.longitude,
              categorie:   'Tournoi / Compétition',
              image_url:   ev.image_url,
              prix:        'payant',
              acces:       'public',
              statut:      'approuve',
              visibilite:  'public',
              source:      'mondial_2026',
              source_id:   sourceId,
              lien:        ev.url,
            }])

            if (error) { errors++ } else { imported++ }
          }

          await new Promise(r => setTimeout(r, 500))
        } catch { break }
      }
    }
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    doublons,
    errors,
    pages_scraped,
  })
}
