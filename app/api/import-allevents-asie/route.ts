import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'
import { normaliserVille } from '../../../lib/normalisation'

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

const ZONES: Record<string, { url: string; villeFallback: string; paysFallback: string }> = {
  'mumbai':    { url: 'https://allevents.in/mumbai',    villeFallback: 'Mumbai',    paysFallback: 'Inde' },
  'new-delhi': { url: 'https://allevents.in/new-delhi', villeFallback: 'New Delhi', paysFallback: 'Inde' },
  'bangalore': { url: 'https://allevents.in/bangalore', villeFallback: 'Bangalore', paysFallback: 'Inde' },
  'goa':       { url: 'https://allevents.in/goa',       villeFallback: 'Goa',       paysFallback: 'Inde' },
  'colombo':   { url: 'https://allevents.in/colombo',   villeFallback: 'Colombo',   paysFallback: 'Sri Lanka' },
  'kathmandu': { url: 'https://allevents.in/kathmandu', villeFallback: 'Kathmandu', paysFallback: 'Népal' },
}

export const maxDuration = 60

// ── Types JSON-LD (subset utilisé) ──────────────────────────────
interface JsonLdAddress {
  addressLocality?: string
  addressCountry?: string
}

interface JsonLdGeo {
  latitude?: number | string
  longitude?: number | string
}

interface JsonLdLocation {
  name?: string
  address?: JsonLdAddress
  geo?: JsonLdGeo
}

interface JsonLdOffer {
  lowPrice?: string
  priceCurrency?: string
}

interface JsonLdEvent {
  '@type'?: string
  name?: string
  url?: string
  image?: string
  startDate?: string
  endDate?: string
  eventStatus?: string
  eventAttendanceMode?: string
  location?: JsonLdLocation
  offers?: JsonLdOffer[]
}

interface EventData {
  name:       string
  url:        string
  eid:        string
  start_date: string
  start_time: string | null
  end_date:   string | null
  image_url:  string | null
  venue_name: string | null
  city:       string | null
  latitude:   number | null
  longitude:  number | null
  prix:       'gratuit' | 'payant'
}

function toNumber(v: number | string | undefined): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return isNaN(n) ? null : n
}

// AllEvents injecte plusieurs <script type="application/ld+json"> par page
// (Event[], ItemList, Organization, FAQPage, BreadcrumbList) — on cherche
// celui qui est un tableau d'objets @type "Event".
function extractEventsJsonLd(html: string): JsonLdEvent[] {
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as JsonLdEvent
        if (first['@type'] === 'Event') return parsed as JsonLdEvent[]
      }
    } catch {
      continue
    }
  }
  return []
}

function parseEvents(html: string): EventData[] {
  const items    = extractEventsJsonLd(html)
  const events: EventData[] = []
  const seenEids = new Set<string>()

  for (const item of items) {
    const rawUrl = item.url
    if (!rawUrl?.startsWith('https://allevents.in/')) continue
    const url = rawUrl.split('?')[0]
    const eidMatch = url.match(/(\d+)[^/]*$/)
    if (!eidMatch) continue
    const eid = eidMatch[1]
    if (seenEids.has(eid)) continue
    seenEids.add(eid)

    if (item.eventAttendanceMode?.includes('OnlineEvent')) continue
    if (item.eventStatus === 'https://schema.org/EventCancelled') continue

    const startRaw   = item.startDate ?? ''
    const endRaw     = item.endDate ?? ''
    const start_date = startRaw.slice(0, 10)
    if (!start_date) continue
    const start_time = startRaw.includes('T') ? startRaw.slice(11, 16) : null
    const endDateStr = endRaw.slice(0, 10)
    const end_date   = endDateStr && endDateStr !== start_date ? endDateStr : null

    const lat = toNumber(item.location?.geo?.latitude)
    const lon = toNumber(item.location?.geo?.longitude)

    let prix: 'gratuit' | 'payant' = 'payant'
    const offers = item.offers
    if (Array.isArray(offers) && offers.length > 0) {
      const lowPrice = parseFloat(offers[0]?.lowPrice ?? '')
      if (!isNaN(lowPrice) && lowPrice === 0) prix = 'gratuit'
    }

    events.push({
      name: item.name || '', url, eid,
      start_date, start_time, end_date,
      image_url:  item.image || null,
      venue_name: item.location?.name || null,
      city:       item.location?.address?.addressLocality || null,
      latitude: lat, longitude: lon, prix,
    })
  }
  return events
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zoneKey = searchParams.get('zone')
  if (!zoneKey || !ZONES[zoneKey]) {
    return NextResponse.json({
      success: false, error: 'Paramètre "zone" requis ou invalide',
      zones_valides: Object.keys(ZONES),
    }, { status: 400 })
  }

  const zone = ZONES[zoneKey]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0, skipped = 0, doublons = 0, errors = 0, events_found = 0

  try {
    const res = await fetch(zone.url, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)
    if (!res.ok) {
      return NextResponse.json({ success: false, zone: zoneKey, error: `HTTP ${res.status}` }, { status: 502 })
    }
    const html   = await res.text()
    const events = parseEvents(html)
    events_found = events.length

    for (const ev of events) {
      if (!ev.latitude || !ev.longitude) { skipped++; continue }

      const sourceId = `allevents-${ev.eid}`
      const { data: existing } = await supabase
        .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
      if (existing) { skipped++; continue }

      const dedup = await verifierDoublon(supabase, {
        titre: ev.name, date: ev.start_date,
        latitude: ev.latitude, longitude: ev.longitude, source_id: sourceId,
      })
      if (dedup.estDoublon) { doublons++; continue }

      const ville = ev.city ? normaliserVille(ev.city) : zone.villeFallback
      const { error } = await supabase.from('evenements').insert([{
        titre: ev.name, lieu: ev.venue_name || ville, ville,
        pays: zone.paysFallback,
        date: ev.start_date, date_debut: ev.start_date, date_fin: ev.end_date,
        heure_debut: ev.start_time, description: null,
        latitude: ev.latitude, longitude: ev.longitude,
        categorie: 'Célébration communautaire', image_url: ev.image_url,
        prix: ev.prix, acces: 'public', statut: 'approuve', visibilite: 'public',
        source: 'allevents', source_id: sourceId, lien: ev.url,
      }])
      if (error) { errors++ } else { imported++ }
      await new Promise(r => setTimeout(r, 300))
    }
  } catch (e) {
    return NextResponse.json({ success: false, zone: zoneKey, error: String(e) }, { status: 500 })
  }

  return NextResponse.json({
    success: true, zone: zoneKey, events_found, imported, skipped, doublons, errors,
  })
}
