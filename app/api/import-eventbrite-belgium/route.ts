import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'

const CATEGORIE_MAP: Record<string, string> = {
  'Music':              'Concert / Spectacle',
  'Nightlife':          'Concert / Spectacle',
  'Performing Arts':    'Concert / Spectacle',
  'Comedy':             'Concert / Spectacle',
  'Film & Media':       'Concert / Spectacle',
  'Arts':               'Foire / Exposition',
  'Visual Arts':        'Foire / Exposition',
  'Food & Drink':       'Foire / Exposition',
  'Fashion':            'Foire / Exposition',
  'Sports & Fitness':   'Tournoi / Compétition',
  'Science & Tech':     'Conférence / Sommet',
  'Business':           'Conférence / Sommet',
  'Community':          'Célébration communautaire',
  'Social':             'Célébration communautaire',
  'Holiday':            'Célébration communautaire',
  'Education':          'Formation / Séminaire',
  'Health':             'Formation / Séminaire',
  'Family & Education': 'Formation / Séminaire',
  'Charity':            'Célébration communautaire',
  'Travel & Outdoor':   'Festival',
  'Hobbies':            'Festival',
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const MAX_PAGES  = 5
const BASE_URL   = 'https://www.eventbrite.com/d/belgium--brussels/events/'

function decodeJsonString(s: string): string {
  try { return JSON.parse('"' + s + '"') } catch { return s }
}

interface EventData {
  name:       string
  url:        string
  eid:        string
  start_date: string
  start_time: string | null
  end_date:   string | null
  end_time:   string | null
  summary:    string | null
  image_url:  string | null
  venue_name: string | null
  city:       string | null
  latitude:   number | null
  longitude:  number | null
  category:   string | null
}

function parseEvents(html: string): EventData[] {
  const events: EventData[]   = []
  const seenEids = new Set<string>()

  // Each destination_event ends with: "name":"...","url":"https://www.eventbrite.com/e/...","hide_start_date"
  const matches = [
    ...html.matchAll(/"name":"([^"]+)","url":"(https:\/\/www\.eventbrite\.com\/e\/[^"]+)","hide_start_date"/g),
  ]

  for (let i = 0; i < matches.length; i++) {
    const match     = matches[i]
    const prevMatch = matches[i - 1]

    const name = decodeJsonString(match[1])
    const url  = match[2]

    const eidMatch = url.match(/(\d+)$/)
    if (!eidMatch) continue
    const eid = eidMatch[1]
    if (seenEids.has(eid)) continue
    seenEids.add(eid)

    // Window: bounded left by previous event's end to avoid cross-event leakage
    const windowStart = prevMatch
      ? Math.max(prevMatch.index! + prevMatch[0].length, match.index! - 5000)
      : Math.max(0, match.index! - 5000)
    const segment    = html.slice(windowStart, match.index! + 300)
    const fwdSegment = html.slice(match.index!, match.index! + 400)

    // Dates
    const startDateM = segment.match(/"start_date":"(\d{4}-\d{2}-\d{2})"/)
    if (!startDateM) continue
    const startDate  = startDateM[1]

    const startTimeM = segment.match(/"start_time":"(\d{2}:\d{2})"/)
    const endDateM   = segment.match(/"end_date":"(\d{4}-\d{2}-\d{2})"/)
    const endTimeM   = segment.match(/"end_time":"(\d{2}:\d{2})"/)
    const endDate    = endDateM?.[1] && endDateM[1] !== startDate ? endDateM[1] : null

    // Summary (appears right after url in the event object)
    const summaryM = fwdSegment.match(/"summary":"([^"]*)"/)
    const summary  = summaryM?.[1] ? decodeJsonString(summaryM[1]) : null

    // Venue name (right after "_type":"destination_venue")
    const venueM = segment.match(/"_type":"destination_venue","name":"([^"]+)"/)

    // GPS coords and city (inside primary_venue.address)
    const latM     = segment.match(/"latitude":"([^"]+)"/)
    const lonM     = segment.match(/"longitude":"([^"]+)"/)
    const cityM    = segment.match(/"city":"([^"]+)"/)

    // Image: decode imgix proxy → raw cdn.evbuc.com URL
    const imgM = segment.match(/"url":"(https:\/\/img\.evbuc\.com\/https%3A%2F%2Fcdn\.evbuc\.com[^"]+)"/)
    let image_url: string | null = null
    if (imgM) {
      try {
        const proxyUrl      = imgM[1].replace(/\\u0026/g, '&')
        const innerEncoded  = proxyUrl.replace('https://img.evbuc.com/', '').split('?')[0]
        image_url           = decodeURIComponent(innerEncoded)
      } catch { image_url = null }
    }

    // Category (first EventbriteCategory tag)
    const catM = segment.match(/"prefix":"EventbriteCategory","tag":"[^"]+","display_name":"([^"]+)"/)

    events.push({
      name,
      url,
      eid,
      start_date: startDate,
      start_time: startTimeM?.[1]  || null,
      end_date:   endDate,
      end_time:   endTimeM?.[1]    || null,
      summary,
      image_url,
      venue_name: venueM?.[1] ? decodeJsonString(venueM[1]) : null,
      city:       cityM?.[1]  ? decodeJsonString(cityM[1])  : null,
      latitude:   latM  ? parseFloat(latM[1])  : null,
      longitude:  lonM  ? parseFloat(lonM[1])  : null,
      category:   catM?.[1] || null,
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

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const pageUrl = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`
      const res     = await fetch(pageUrl, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) break

      const html   = await res.text()
      const events = parseEvents(html)
      if (events.length === 0) break

      pages_scraped++

      for (const ev of events) {
        // Dédupliquer les doublons intra-page (event apparaît dans plusieurs sections)
        if (seenEids.has(ev.eid)) { skipped++; continue }
        seenEids.add(ev.eid)

        // Ignorer les événements sans coordonnées GPS (en ligne, lieu inconnu)
        if (!ev.latitude || !ev.longitude) { skipped++; continue }

        const sourceId = `eventbrite-${ev.eid}`

        // Anti-doublon même source
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

        const { error } = await supabase.from('evenements').insert([{
          titre:       ev.name,
          lieu:        ev.venue_name || ev.city || 'Bruxelles',
          ville:       ev.city       || 'Bruxelles',
          pays:        'Belgique',
          date:        ev.start_date,
          date_debut:  ev.start_date,
          date_fin:    ev.end_date,
          heure_debut: ev.start_time,
          heure_fin:   ev.end_time,
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
    imported,
    skipped,
    doublons,
    errors,
    pages_scraped,
  })
}
