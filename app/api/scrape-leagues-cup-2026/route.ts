import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../lib/adminAuth'
import { estSourceBloquee } from '../../../lib/deduplication'
import { normaliserVille, normaliserPays } from '../../../lib/normalisation'

const ID_LEAGUE   = 5281       // Leagues Cup — TheSportsDB
const SAISON      = '2026'
const DATE_DEBUT  = '2026-08-04'
const DATE_FIN    = '2026-09-06'

const VILLE_SECOURS_MX: Record<string, string> = {
  'Toluca':      'Toluca',
  'Tigres UANL': 'Monterrey',
  'América':     'Ciudad de México',
}

interface MapboxContext {
  id: string
  text: string
}

async function geocodeStade(stade: string, ville: string): Promise<{ longitude: number, latitude: number, ville: string }> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const query = encodeURIComponent(`${stade}, ${ville}`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    const feature = data.features?.[0]
    if (feature) {
      const [longitude, latitude] = feature.center
      const placeContext = (feature.context as MapboxContext[] | undefined)?.find(c => c.id.startsWith('place.'))
      const villeResolue = placeContext?.text || ville
      return { longitude, latitude, ville: villeResolue }
    }
  } catch {}
  return { longitude: -100, latitude: 40, ville }
}

async function lookupTeamLocation(idTeam: string): Promise<{ ville: string, pays: string } | null> {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${idTeam}`,
      { headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app)' } }
    )
    const data = await res.json()
    const strLocation: string | undefined = data.teams?.[0]?.strLocation
    if (!strLocation) return null

    const segments = strLocation.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (segments.length === 0) return null

    return { ville: segments[0], pays: segments[segments.length - 1] }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  const secretValide = secret === process.env.INTERNAL_API_SECRET
  if (!secretValide) {
    const acces = await verifierAdmin(request)
    if (!acces.ok) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: any[] = []
  const errors: any[] = []
  const cacheEquipes = new Map<string, { ville: string, pays: string }>()

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${ID_LEAGUE}&s=${SAISON}`,
      { headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app)' } }
    )
    const data = await res.json()
    const events = data.events || []

    for (const ev of events) {
      try {
        if (!ev.dateEvent || ev.dateEvent < DATE_DEBUT || ev.dateEvent > DATE_FIN) {
          skipped++
          continue
        }

        const aujourd_hui = new Date().toISOString().split('T')[0]
        if (ev.dateEvent < aujourd_hui) { skipped++; continue }

        const sourceId = String(ev.idEvent)

        const bloquee = await estSourceBloquee(supabase, 'leaguescup2026', sourceId)
        if (bloquee) { skipped++; continue }

        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'leaguescup2026')
          .eq('source_id', sourceId)
          .maybeSingle()

        if (existing) { skipped++; continue }

        const idHomeTeam = String(ev.idHomeTeam || '')
        let localisation = idHomeTeam ? cacheEquipes.get(idHomeTeam) : undefined
        if (!localisation && idHomeTeam) {
          const trouvee = await lookupTeamLocation(idHomeTeam)
          if (trouvee) {
            localisation = trouvee
            cacheEquipes.set(idHomeTeam, trouvee)
          }
        }

        const pays  = normaliserPays(ev.strCountry || localisation?.pays || 'USA')
        const ville = normaliserVille(
          localisation?.ville || VILLE_SECOURS_MX[ev.strHomeTeam] || pays
        )
        const coords = await geocodeStade(ev.strVenue || '', ville)

        const titre = `⚽ ${ev.strHomeTeam} vs ${ev.strAwayTeam}`
        const lieu  = ev.strVenue ? `${ev.strVenue}, ${ville}` : ville
        const date  = ev.dateEvent
        const heure = ev.strTime ? ev.strTime.slice(0, 5) : ''
        const image = ev.strPoster || ev.strThumb || null

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          ville,
          pays,
          date,
          date_debut: date,
          heure_debut: heure,
          description: `Leagues Cup 2026 · ${ev.strHomeTeam} vs ${ev.strAwayTeam} · ${lieu}`,
          longitude: coords.longitude,
          latitude: coords.latitude,
          categorie: 'Tournoi / Compétition',
          acces: 'public',
          prix: 'payant',
          image_url: image,
          statut: 'approuve',
          visibilite: 'public',
          source: 'leaguescup2026',
          source_id: sourceId,
          lien: `https://www.thesportsdb.com/event/${ev.idEvent}`,
        }])

        if (error) {
          errors.push({ titre, error: error.message })
          skipped++
        } else {
          results.push({ titre, lieu, date, heure })
          imported++
        }

        await new Promise(r => setTimeout(r, 200))

      } catch (err) {
        errors.push({ event: ev.idEvent, error: String(err) })
        skipped++
      }
    }

  } catch (err) {
    errors.push({ error: String(err) })
  }

  return NextResponse.json({ success: true, imported, skipped, results, errors })
}
