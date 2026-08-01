import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../../lib/deduplication'
import { normaliserVille } from '../../../../lib/normalisation'

export const maxDuration = 60

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const ICAL_URL = 'https://www.buzzmagmartinique.com/?post_type=tribe_events&ical=1&eventDisplay=list'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ── Mapping CATEGORIES iCal → texte libre "categorie" (aligné sur le
// vocabulaire déjà utilisé par sortirdanslaube — cf. incohérence connue
// avec event_types en base, non corrigée ici, signalée séparément) ─────────
const CATEGORIE_PRIORITE = [
  'Sport', 'Marché', 'Soirée', 'Science', 'Art & Culture',
  'Environnement', 'Santé', 'Gastronomie', 'Jeune public', 'Buzziness',
]

const CATEGORIE_MAP: Record<string, string> = {
  'Sport': 'Tournoi / Compétition',
  'Marché': 'Foire / Exposition',
  'Soirée': 'Concert / Spectacle',
  'Science': 'Formation / Séminaire',
  'Art & Culture': 'Foire / Exposition',
  'Environnement': 'Formation / Séminaire',
  'Santé': 'Formation / Séminaire',
  'Gastronomie': 'Foire / Exposition',
  'Jeune public': 'Célébration communautaire',
  'Buzziness': 'Célébration communautaire',
}

function mapCategorie(categories: string[]): string {
  for (const p of CATEGORIE_PRIORITE) {
    if (categories.includes(p)) return CATEGORIE_MAP[p]
  }
  return 'Célébration communautaire'
}

// ── Parsing iCal minimal (unfold RFC5545 + line-based parser) ──────────────
interface VEventBrut {
  uid: string
  summary: string
  description: string
  location: string
  dateDebut: string | null
  dateFin: string | null
  categories: string[]
  url: string
  image: string | null
}

function unescapeIcs(s: string): string {
  return s
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function extractDate(value: string): string | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

function parseIcs(icsText: string): VEventBrut[] {
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events: VEventBrut[] = []
  let current: Partial<VEventBrut> & { categories: string[] } | null = null

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = { categories: [] }
      continue
    }
    if (line.startsWith('END:VEVENT')) {
      if (current?.uid && current.summary) {
        events.push({
          uid: current.uid,
          summary: current.summary,
          description: current.description || '',
          location: current.location || '',
          dateDebut: current.dateDebut || null,
          dateFin: current.dateFin || null,
          categories: current.categories || [],
          url: current.url || '',
          image: current.image || null,
        })
      }
      current = null
      continue
    }
    if (!current) continue

    const sepIndex = line.indexOf(':')
    if (sepIndex === -1) continue
    const key = line.slice(0, sepIndex).split(';')[0]
    const value = line.slice(sepIndex + 1)

    switch (key) {
      case 'UID': current.uid = value.trim(); break
      case 'SUMMARY': current.summary = unescapeIcs(value).trim(); break
      case 'DESCRIPTION': current.description = unescapeIcs(value).trim().slice(0, 1500); break
      case 'LOCATION': current.location = unescapeIcs(value).trim(); break
      case 'DTSTART': current.dateDebut = extractDate(value); break
      case 'DTEND': current.dateFin = extractDate(value); break
      case 'CATEGORIES': current.categories = value.split(',').map(c => c.trim()).filter(Boolean); break
      case 'URL': current.url = value.trim(); break
      case 'ATTACH': current.image = value.trim(); break
    }
  }

  return events
}

// ── Ville extraite du dernier segment du titre (ex. "..., FORT DE FRANCE") ─
function extraireVille(summary: string): string | null {
  const parts = summary.split(',')
  if (parts.length < 2) return null
  const dernier = parts[parts.length - 1].trim()
  if (dernier.length < 2 || dernier.length > 40) return null
  return dernier
}

async function geocode(address: string): Promise<{ longitude: number; latitude: number } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
    return null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  let doublons = 0
  let errors = 0
  const cacheGeocode = new Map<string, { longitude: number; latitude: number } | null>()

  try {
    const res = await fetch(ICAL_URL, { headers: HEADERS, signal: AbortSignal.timeout(20000) })
    if (!res.ok) {
      return NextResponse.json({ error: `Flux iCal inaccessible (${res.status})` }, { status: 502 })
    }
    const icsText = await res.text()
    const events = parseIcs(icsText)

    for (const ev of events) {
      if (!ev.dateDebut) { skipped++; continue }
      if (!ev.location) { skipped++; continue }

      const sourceId = `buzzmag-${ev.uid.split('@')[0]}`

      const bloquee = await estSourceBloquee(admin, 'buzzmag-martinique', sourceId)
      if (bloquee) { skipped++; continue }

      const { data: existing } = await admin
        .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
      if (existing) { skipped++; continue }

      let coords = cacheGeocode.get(ev.location)
      if (coords === undefined) {
        coords = await geocode(ev.location)
        cacheGeocode.set(ev.location, coords)
      }
      if (!coords) { skipped++; continue }

      const villeBrute = extraireVille(ev.summary)
      const ville = villeBrute ? normaliserVille(villeBrute) : 'Martinique'

      const dedup = await verifierDoublon(admin, {
        titre: ev.summary,
        date: ev.dateDebut,
        latitude: coords.latitude,
        longitude: coords.longitude,
        source_id: sourceId,
      })
      if (dedup.estDoublon) { doublons++; continue }

      const { error } = await admin.from('evenements').insert([{
        titre: ev.summary,
        lieu: ville,
        ville,
        pays: 'Martinique',
        date: ev.dateDebut,
        date_debut: ev.dateDebut,
        date_fin: ev.dateFin,
        description: ev.description || null,
        categorie: mapCategorie(ev.categories),
        latitude: coords.latitude,
        longitude: coords.longitude,
        image_url: ev.image || null,
        prix: 'payant',
        acces: 'public',
        statut: 'approuve',
        visibilite: 'public',
        source: 'buzzmag-martinique',
        source_id: sourceId,
        lien: ev.url || ICAL_URL,
      }])

      if (error) { errors++ } else { imported++ }

      await new Promise(r => setTimeout(r, 50))
    }

    return NextResponse.json({ success: true, imported, skipped, doublons, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
