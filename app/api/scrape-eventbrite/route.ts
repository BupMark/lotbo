import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Liste de villes et pays connus à détecter
const KNOWN_LOCATIONS = [
  // Haïti
  'Port-au-Prince', 'Haiti', 'Haïti', 'Pétion-Ville', 'Cap-Haïtien',
  // Europe
  'Paris', 'France', 'London', 'Berlin', 'Germany', 'Brussels', 'Belgium',
  'Geneva', 'Switzerland', 'Amsterdam', 'Netherlands', 'Rome', 'Italy',
  'Madrid', 'Spain', 'Vienna', 'Austria', 'Stockholm', 'Sweden',
  'Oslo', 'Norway', 'Warsaw', 'Poland', 'Prague', 'Czech Republic',
  'Lisbon', 'Portugal', 'Athens', 'Greece', 'Budapest', 'Hungary',
  // Amérique
  'New York', 'Washington', 'San Francisco', 'Los Angeles', 'Chicago',
  'USA', 'United States', 'Canada', 'Toronto', 'Montreal',
  'Mexico City', 'Mexico', 'Buenos Aires', 'Argentina',
  'São Paulo', 'Brasilia', 'Brazil', 'Bogota', 'Colombia',
  // Afrique
  'Nairobi', 'Kenya', 'Lagos', 'Nigeria', 'Dakar', 'Senegal',
  'Johannesburg', 'Cape Town', 'South Africa', 'Cairo', 'Egypt',
  'Accra', 'Ghana', 'Abidjan', 'Côte d\'Ivoire', 'Kampala', 'Uganda',
  'Dar es Salaam', 'Tanzania', 'Addis Ababa', 'Ethiopia',
  // Asie
  'Tokyo', 'Japan', 'Beijing', 'Shanghai', 'China', 'Delhi', 'Mumbai', 'India',
  'Singapore', 'Bangkok', 'Thailand', 'Jakarta', 'Indonesia',
  'Seoul', 'South Korea', 'Taipei', 'Taiwan',
  // Moyen-Orient
  'Dubai', 'UAE', 'Istanbul', 'Turkey', 'Beirut', 'Lebanon',
  'Amman', 'Jordan', 'Tunis', 'Tunisia', 'Rabat', 'Morocco',
  // Océanie
  'Sydney', 'Melbourne', 'Australia', 'Auckland', 'New Zealand',
]

// Détecte le lieu dans le texte
// Mots à ignorer — pas des lieux
const IGNORE_WORDS = [
  'informel', 'memory', 'Wikimédia', 'Wikimedia', 'Wikipedia',
  'discussions', 'LATAM', 'région', 'region', 'their', 'home',
  'le', 'la', 'un', 'une', 'the', 'a', 'an'
]

function extractLocation(titre: string, description: string): string | null {
  // Ignorer les pages de travail Wikimedia
  if (titre.includes('Campagnes/') || titre.includes('Campaigns/')) return null
  if (titre.includes('WikiForHumanRights')) return null

  const text = `${titre} ${description}`

  // D'abord chercher dans la liste de lieux connus
  for (const location of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${location}\\b`, 'i')
    if (regex.test(text)) return location
  }

  // Pattern "in [Ville]" — mais valider que c'est un vrai nom propre
  const inMatch = text.match(/\b(?:in|at|held in|located in|taking place in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (inMatch) {
    const candidate = inMatch[1].trim()
    // Vérifier que ce n'est pas un mot à ignorer
    const isIgnored = IGNORE_WORDS.some(w => candidate.toLowerCase().includes(w.toLowerCase()))
    if (!isIgnored && candidate.length > 3) return candidate
  }

  return null
}

// Géocode via Mapbox
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
  try {
    // Étape 1 — Récupère les événements Wikimedia
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
      // Détail de chaque page
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
      // Après : const titre = ...
// Ajoute ce filtre :
if (titre.includes('/') && titre.split('/').length > 2) { skipped++; continue }
      const description = pageInfo.extract?.slice(0, 500) || ''

      // Vérifier si déjà importé
      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source_id', String(page.pageid))
        .single()

      if (existing) { skipped++; continue }

      // Détecter le lieu
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

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}