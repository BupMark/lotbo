import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LIGUES = const LIGUES = [
    // ── Football ──
    { id: '4328', nom: 'Premier League', pays: 'Angleterre', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', sport: 'Sport' },
    { id: '4335', nom: 'La Liga', pays: 'Espagne', emoji: '🇪🇸', sport: 'Sport' },
    { id: '4331', nom: 'Bundesliga', pays: 'Allemagne', emoji: '🇩🇪', sport: 'Sport' },
    { id: '4332', nom: 'Serie A', pays: 'Italie', emoji: '🇮🇹', sport: 'Sport' },
    { id: '4334', nom: 'Ligue 1', pays: 'France', emoji: '🇫🇷', sport: 'Sport' },
    { id: '4480', nom: 'Champions League', pays: 'Europe', emoji: '🏆', sport: 'Sport' },
    // ── Basketball ──
    { id: '4387', nom: 'NBA', pays: 'USA', emoji: '🏀', sport: 'Sport' },
    // ── Baseball ──
    { id: '4424', nom: 'MLB', pays: 'USA', emoji: '⚾', sport: 'Sport' },
    // ── Hockey ──
    { id: '4380', nom: 'NHL', pays: 'USA', emoji: '🏒', sport: 'Sport' },
    // ── Football Américain ──
    { id: '4391', nom: 'NFL', pays: 'USA', emoji: '🏈', sport: 'Sport' },
    // ── Formule 1 ──
    { id: '4370', nom: 'Formula 1', pays: 'International', emoji: '🏎️', sport: 'Sport' },
    // ── Tennis ──
    { id: '4653', nom: 'ATP Tour', pays: 'International', emoji: '🎾', sport: 'Sport' },
    // ── Rugby ──
    { id: '4462', nom: 'Rugby World Cup', pays: 'International', emoji: '🏉', sport: 'Sport' },
    // ── MMA ──
    { id: '4443', nom: 'UFC', pays: 'USA', emoji: '🥊', sport: 'Sport' },
  ]

// Coordonnées approximatives des pays pour les matchs sans ville
const COORDS_PAYS: Record<string, { longitude: number, latitude: number, ville: string }> = {
    'Angleterre': { longitude: -0.1278, latitude: 51.5074, ville: 'Londres' },
    'Espagne': { longitude: -3.7038, latitude: 40.4168, ville: 'Madrid' },
    'Allemagne': { longitude: 13.4050, latitude: 52.5200, ville: 'Berlin' },
    'Italie': { longitude: 12.4964, latitude: 41.9028, ville: 'Rome' },
    'France': { longitude: 2.3522, latitude: 48.8566, ville: 'Paris' },
    'Europe': { longitude: 10.0, latitude: 50.0, ville: 'Europe' },
    'USA': { longitude: -95.7129, latitude: 37.0902, ville: 'États-Unis' },
    'International': { longitude: 0, latitude: 20, ville: 'International' },
    'Turquie': { longitude: 32.8597, latitude: 39.9334, ville: 'Ankara' },
  }

async function geocodeStade(stade: string, ville: string, pays: string): Promise<{ longitude: number, latitude: number }> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const query = encodeURIComponent(`${stade}, ${ville || pays}`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
  } catch {
    // fallback
  }
  return COORDS_PAYS[pays] || { longitude: 0, latitude: 0 }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results = []

  for (const ligue of LIGUES) {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${ligue.id}`,
        { headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app)' } }
      )
      const data = await res.json()
      const events = data.events || []

      for (const ev of events) {
        // Vérifier si déjà importé
        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'sports')
          .eq('source_id', ev.idEvent)
          .single()

        if (existing) { skipped++; continue }

        // Géocoder le stade
        const coords = await geocodeStade(
          ev.strVenue || '',
          ev.strVille || ev.strPays || '',
          ligue.pays
        )

        const titre = `${ligue.emoji} ${ev.strEvent}`
        const lieu = ev.strVenue
          ? `${ev.strVenue}${ev.strVille ? ', ' + ev.strVille : ''}`
          : ligue.pays
        const date = ev.dateEvent || ''
        const heure = ev.strTime ? ev.strTime.slice(0, 5) : ''

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          date,
          date_debut: date,
          heure_debut: heure,
          description: `${ev.strHomeTeam} vs ${ev.strAwayTeam} · ${ligue.nom} · Saison ${ev.strSeason}`,
          longitude: coords.longitude,
          latitude: coords.latitude,
          categorie: 'Sport',
          acces: 'public',
          prix: 'payant',
          image_url: ev.strAffiche || ev.strThumb || null,
          statut: 'approuve',
          source: 'sports',
          source_id: ev.idEvent,
          lien: `https://www.thesportsdb.com/event/${ev.idEvent}`,
        }])

        if (error) {
          results.push({ titre, error: error.message })
          skipped++
        } else {
          results.push({ titre, lieu, date })
          imported++
        }
      }
    } catch (err) {
      results.push({ ligue: ligue.nom, error: String(err) })
    }
  }

  return NextResponse.json({ success: true, imported, skipped, results })
}