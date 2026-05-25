// ⚠️ CE FICHIER = SCRAPER WIKIMEDIA (mauvais nommage historique)
// Ne pas renommer sans mettre à jour le bouton admin correspondant
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const KNOWN_LOCATIONS = [
  'Port-au-Prince', 'Haiti', 'Haïti', 'Pétion-Ville', 'Cap-Haïtien',
  'Paris', 'France', 'London', 'Berlin', 'Germany',
  'Brussels', 'Bruxelles', 'Belgium',
  'Geneva', 'Genève', 'Zurich', 'Switzerland',
  'Amsterdam', 'Netherlands',
  'Rome', 'Milan', 'Italy',
  'Madrid', 'Barcelona', 'Barcelone', 'Spain',
  'Vienna', 'Austria', 'Stockholm', 'Sweden',
  'Oslo', 'Norway', 'Warsaw', 'Poland', 'Prague', 'Czech Republic',
  'Lisbon', 'Lisbonne', 'Portugal', 'Athens', 'Greece', 'Budapest', 'Hungary',
  'New York', 'Washington', 'San Francisco', 'Los Angeles', 'Chicago',
  'USA', 'United States', 'Canada', 'Toronto', 'Montreal',
  'Mexico City', 'Mexico', 'Buenos Aires', 'Argentina',
  'São Paulo', 'Rio de Janeiro', 'Brasilia', 'Brazil',
  'Bogota', 'Bogotá', 'Colombia', 'Lima', 'Peru',
  'Santiago', 'Chile', 'Quito', 'Ecuador',
  'Nairobi', 'Kenya', 'Lagos', 'Nigeria', 'Dakar', 'Senegal',
  'Johannesburg', 'Cape Town', 'South Africa', 'Cairo', 'Egypt',
  'Accra', 'Ghana', 'Abidjan', 'Côte d\'Ivoire', 'Kampala', 'Uganda',
  'Dar es Salaam', 'Tanzania', 'Addis Ababa', 'Ethiopia',
  'Tokyo', 'Japan', 'Beijing', 'Shanghai', 'China', 'Delhi', 'Mumbai', 'India',
  'Singapore', 'Bangkok', 'Thailand', 'Jakarta', 'Indonesia',
  'Seoul', 'South Korea', 'Taipei', 'Taiwan',
  'Hong Kong', 'Kuala Lumpur', 'Malaysia', 'Manila', 'Philippines',
  'Ho Chi Minh City', 'Hanoi', 'Vietnam',
  'Dubai', 'UAE', 'Istanbul', 'Turkey', 'Beirut', 'Lebanon',
  'Amman', 'Jordan', 'Tunis', 'Tunisia', 'Rabat', 'Morocco',
  'Sydney', 'Melbourne', 'Australia', 'Auckland', 'New Zealand',
]

const IGNORE_WORDS = [
  'informel', 'memory', 'Wikimédia', 'Wikimedia', 'Wikipedia',
  'discussions', 'LATAM', 'région', 'region', 'their', 'home',
  'le', 'la', 'un', 'une', 'the', 'a', 'an'
]

function extractLocation(titre: string, description: string): string | null {
  if (titre.includes('Campagnes/') || titre.includes('Campaigns/')) return null
  if (titre.includes('WikiForHumanRights')) return null

  const text = `${titre} ${description}`

  for (const location of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${location}\\b`, 'i')
    if (regex.test(text)) return location
  }

  const inMatch = text.match(/\b(?:in|at|held in|located in|taking place in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (inMatch) {
    const candidate = inMatch[1].trim()
    const isIgnored = IGNORE_WORDS.some(w => candidate.toLowerCase().includes(w.toLowerCase()))
    if (!isIgnored && candidate.length > 3) return candidate
  }

  return null
}

async function geocode(address: string): Promise<{ longitude: number, latitude: number } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    const res = await fetch(url)
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

export async function GET() {
  // ── Instanciation DANS la fonction — jamais au niveau racine ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const res = await fetch(
      'https://meta.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Events&cmlimit=50&format=json',
      {
        headers: {
          'User-Agent': 'Lotbo/1.0 (https://lotbo.app; contact@lotbo.app)',
          'Accept': 'application/json',
        }
      }
    )

    const data = await res.json()
    const pages = data.query?.categorymembers || []

    if (pages.length === 0) {
      return NextResponse.json({ error: 'Aucune page trouvée' })
    }

    let imported = 0
    let geocoded = 0
    let needsCompletion = 0
    let skipped = 0
    const results = []

    for (const page of pages.slice(0, 15)) {
      const pageRes = await fetch(
        `https://meta.wikimedia.org/w/api.php?action=query&pageids=${page.pageid}&prop=extracts&exintro=true&explaintext=true&format=json`,
        {
          headers: {
            'User-Agent': 'Lotbo/1.0 (https://lotbo.app; contact@lotbo.app)',
            'Accept': 'application/json',
          }
        }
      )

      const pageData = await pageRes.json()
      const pageInfo = pageData.query?.pages?.[page.pageid]
      if (!pageInfo) { skipped++; continue }

      const titre = pageInfo.title?.replace('Event:', '').trim() || page.title

      if (titre.includes('/') && titre.split('/').length > 2) { skipped++; continue }

      const description = pageInfo.extract?.slice(0, 500) || ''

      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source_id', String(page.pageid))
        .single()

      if (existing) { skipped++; continue }

      const locationStr = extractLocation(titre, description)
      let coords = null
      let statut = 'à compléter'
      let lieu = 'À compléter'

      if (locationStr) {
        coords = await geocode(locationStr)
        if (coords) {
          statut = 'publié'
          lieu = locationStr
          geocoded++
        }
      }

      if (!coords) {
        coords = { longitude: 0, latitude: 0 }
        needsCompletion++
      }

      const { error } = await supabase.from('evenements').insert([{
        titre,
        lieu,
        date: '2026-01-01',
        date_debut: '2026-01-01',
        description,
        longitude: coords.longitude,
        latitude: coords.latitude,
        categorie: 'Wikimedia',
        statut,
        source: 'wikimedia',
        source_id: String(page.pageid),
        acces: 'public',
        prix: 'gratuit',
        lien: `https://meta.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
      }])

      if (error) {
        results.push({ titre, error: error.message })
        skipped++
      } else {
        results.push({ titre, lieu, statut })
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      geocoded,
      needsCompletion,
      skipped,
      events: results
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}