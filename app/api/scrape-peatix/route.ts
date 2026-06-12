import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normaliserPays } from '../../../lib/normalisation'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PeatixEvent {
  id: string | number
  title: string
  start_time: string
  end_time?: string | null
  location?: string
  venue_name?: string
  city?: string
  country?: string
  description?: string
  category?: string
  url?: string
  image_url?: string
  lat?: number
  lng?: number
  is_free?: boolean
}

interface Zone {
  ville: string
  pays: string
  lat: number
  lng: number
  radius: number
}

interface ResultEntry {
  titre: string
  ville: string
  date: string
  zone: string
}

interface NominatimResult {
  lat: string
  lon: string
}

interface PeatixAPIResponse {
  events?: PeatixEvent[]
}

interface NextDataShape {
  props?: {
    pageProps?: {
      events?: PeatixEvent[]
      searchResults?: PeatixEvent[]
    }
  }
}

interface InitialStateShape {
  events?: PeatixEvent[]
}

// ── Zones Asie ────────────────────────────────────────────────────────────────

const ZONES_ASIE: Zone[] = [
  { ville: 'Tokyo',            pays: 'Japan',        lat: 35.6762,  lng: 139.6503, radius: 50 },
  { ville: 'Osaka',            pays: 'Japan',        lat: 34.6937,  lng: 135.5023, radius: 30 },
  { ville: 'Seoul',            pays: 'South Korea',  lat: 37.5665,  lng: 126.9780, radius: 50 },
  { ville: 'Singapore',        pays: 'Singapore',    lat: 1.3521,   lng: 103.8198, radius: 30 },
  { ville: 'Bangkok',          pays: 'Thailand',     lat: 13.7563,  lng: 100.5018, radius: 50 },
  { ville: 'Jakarta',          pays: 'Indonesia',    lat: -6.2088,  lng: 106.8456, radius: 50 },
  { ville: 'Manila',           pays: 'Philippines',  lat: 14.5995,  lng: 120.9842, radius: 50 },
  { ville: 'Ho Chi Minh City', pays: 'Vietnam',      lat: 10.8231,  lng: 106.6297, radius: 40 },
  { ville: 'Hanoi',            pays: 'Vietnam',      lat: 21.0285,  lng: 105.8542, radius: 30 },
  { ville: 'Mumbai',           pays: 'India',        lat: 19.0760,  lng: 72.8777,  radius: 50 },
  { ville: 'Delhi',            pays: 'India',        lat: 28.6139,  lng: 77.2090,  radius: 50 },
  { ville: 'Bangalore',        pays: 'India',        lat: 12.9716,  lng: 77.5946,  radius: 30 },
  { ville: 'Hong Kong',        pays: 'Hong Kong',    lat: 22.3193,  lng: 114.1694, radius: 20 },
  { ville: 'Taipei',           pays: 'Taiwan',       lat: 25.0330,  lng: 121.5654, radius: 30 },
  { ville: 'Kuala Lumpur',     pays: 'Malaysia',     lat: 3.1390,   lng: 101.6869, radius: 40 },
  { ville: 'Shanghai',         pays: 'China',        lat: 31.2304,  lng: 121.4737, radius: 50 },
  { ville: 'Beijing',          pays: 'China',        lat: 39.9042,  lng: 116.4074, radius: 50 },
  { ville: 'Shenzhen',         pays: 'China',        lat: 22.5431,  lng: 114.0579, radius: 30 },
]

// ── Mapping catégories ────────────────────────────────────────────────────────

function mapCategorie(cat: string | undefined): string {
  if (!cat) return 'Autre'
  const c = cat.toLowerCase()
  if (c.includes('music') || c.includes('concert'))                          return 'Concert / Spectacle'
  if (c.includes('festival'))                                                 return 'Festival'
  if (c.includes('conference') || c.includes('seminar') || c.includes('workshop')) return 'Conférence / Formation'
  if (c.includes('sport'))                                                    return 'Tournoi / Compétition'
  if (c.includes('art') || c.includes('exhibition'))                         return 'Foire / Exposition'
  if (c.includes('food'))                                                     return 'Célébration communautaire'
  return 'Autre'
}

// ── Géocodage Nominatim (fallback si lat/lng absent) ─────────────────────────

async function geocoderAdresse(lieu: string, ville: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q   = encodeURIComponent(`${lieu}, ${ville}`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LOTBO/1.0 (lotbo@bup-mark.com)' } }
    )
    if (!res.ok) return null
    const data = await res.json() as NominatimResult[]
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ── Fallback HTML — parse __NEXT_DATA__ ou __INITIAL_STATE__ ─────────────────

async function fetchPeatixHTML(zone: Zone, aujourd_hui: string): Promise<PeatixEvent[]> {
  try {
    const params = new URLSearchParams({
      lat:        String(zone.lat),
      lng:        String(zone.lng),
      radius:     String(zone.radius),
      start_from: aujourd_hui,
      limit:      '20',
      lang:       'en',
    })
    const res = await fetch(`https://peatix.com/search?${params.toString()}`, {
      headers: {
        'User-Agent':      'LOTBO/1.0 (lotbo@bup-mark.com)',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) return []
    const html = await res.text()

    // Tentative 1 — __NEXT_DATA__
    const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (nextMatch) {
      const parsed = JSON.parse(nextMatch[1]) as NextDataShape
      const events = parsed?.props?.pageProps?.events ?? parsed?.props?.pageProps?.searchResults
      if (Array.isArray(events)) return events
    }

    // Tentative 2 — window.__INITIAL_STATE__
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)
    if (stateMatch) {
      const parsed = JSON.parse(stateMatch[1]) as InitialStateShape
      if (Array.isArray(parsed.events)) return parsed.events
    }

    return []
  } catch {
    return []
  }
}

// ── Fetch principal avec fallback HTML ────────────────────────────────────────

async function fetchPeatixZone(zone: Zone, aujourd_hui: string): Promise<PeatixEvent[]> {
  const params = new URLSearchParams({
    lat:        String(zone.lat),
    lng:        String(zone.lng),
    radius:     String(zone.radius),
    start_from: aujourd_hui,
    limit:      '20',
    lang:       'en',
  })

  try {
    const res = await fetch(`https://peatix.com/api/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'LOTBO/1.0 (lotbo@bup-mark.com)',
        'Accept':     'application/json',
      },
    })

    if (!res.ok) return fetchPeatixHTML(zone, aujourd_hui)

    const data = await res.json() as PeatixAPIResponse
    return Array.isArray(data.events) ? data.events : fetchPeatixHTML(zone, aujourd_hui)
  } catch {
    return fetchPeatixHTML(zone, aujourd_hui)
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const aujourd_hui = new Date().toISOString().split('T')[0]

  let imported       = 0
  let skipped        = 0
  let errors         = 0
  let zones_traitees = 0
  const results: ResultEntry[] = []

  for (const zone of ZONES_ASIE) {
    try {
      const events = await fetchPeatixZone(zone, aujourd_hui)
      zones_traitees++

      for (const ev of events) {
        if (!ev.id || !ev.title || !ev.start_time) { skipped++; continue }

        const sourceId = 'peatix_' + String(ev.id)

        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source_id', sourceId)
          .limit(1)
          .single()
        if (existing) { skipped++; continue }

        const dateDebut   = ev.start_time.split('T')[0]
        const dateFin     = ev.end_time ? ev.end_time.split('T')[0] : null
        const dateFinDiff = dateFin && dateFin !== dateDebut ? dateFin : null

        // Coordonnées : event > géocodage Nominatim > fallback zone
        let latitude  = ev.lat  ?? null
        let longitude = ev.lng  ?? null

        if (!latitude || !longitude) {
          const lieu   = ev.location || ev.venue_name || ''
          const coords = lieu ? await geocoderAdresse(lieu, zone.ville) : null
          if (coords) {
            latitude  = coords.lat
            longitude = coords.lng
          } else {
            latitude  = zone.lat
            longitude = zone.lng
          }
        }

        const { error } = await supabase.from('evenements').insert([{
          titre:       ev.title,
          description: ev.description?.slice(0, 500) ?? '',
          lieu:        ev.location ?? ev.venue_name ?? zone.ville,
          ville:       ev.city    ?? zone.ville,
          pays:        normaliserPays(ev.country ?? zone.pays),
          latitude,
          longitude,
          date_debut:  dateDebut,
          date_fin:    dateFinDiff,
          date:        dateDebut,
          categorie:   mapCategorie(ev.category),
          statut:      'publié',
          source:      'peatix',
          source_id:   sourceId,
          acces:       'public',
          prix:        ev.is_free ? 'gratuit' : 'payant',
          lien:        ev.url ?? 'https://peatix.com',
          image_url:   ev.image_url ?? null,
        }])

        if (error) {
          errors++
        } else {
          imported++
          results.push({
            titre: ev.title,
            ville: ev.city ?? zone.ville,
            date:  dateDebut,
            zone:  zone.ville,
          })
        }
      }
    } catch {
      errors++
    }

    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({
    success: true,
    zones_traitees,
    imported,
    skipped,
    errors,
    events: results.slice(0, 20),
  })
}
