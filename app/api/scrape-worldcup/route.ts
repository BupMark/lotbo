import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../lib/adminAuth'

async function geocodeStade(stade: string, ville: string): Promise<{ longitude: number, latitude: number }> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const query = encodeURIComponent(`${stade}, ${ville}`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    if (data.features?.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
  } catch {}
  return { longitude: -100, latitude: 40 }
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

  // Phase de groupes = rounds 1 à 3
  // Phase finale = rounds 4 à 8
  const totalRounds = 8

  for (let round = 1; round <= totalRounds; round++) {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=4429&r=${round}&s=2026`,
        { headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app)' } }
      )
      const data = await res.json()
      const events = data.events || []

      for (const ev of events) {
        try {
          const { data: existing } = await supabase
            .from('evenements')
            .select('id')
            .eq('source', 'worldcup2026')
            .eq('source_id', ev.idEvent)
            .single()

          if (existing) { skipped++; continue }

          const aujourd_hui = new Date().toISOString().split('T')[0]
          if (ev.dateEvent < aujourd_hui) { skipped++; continue }

          const coords = await geocodeStade(
            ev.strVenue || '',
            ev.strCity || ev.strCountry || 'USA'
          )

          const groupe = ev.strGroup ? `Groupe ${ev.strGroup}` : `Round ${round}`
          const phase = round <= 3 ? `Phase de groupes · ${groupe}` :
                        round === 4 ? 'Huitièmes de finale' :
                        round === 5 ? 'Quarts de finale' :
                        round === 6 ? 'Demi-finales' :
                        round === 7 ? 'Match pour la 3e place' :
                        'Finale'

          const titre = `🏆🌍 ${ev.strHomeTeam} vs ${ev.strAwayTeam}`
          const lieu = ev.strVenue
            ? `${ev.strVenue}, ${ev.strCity || ev.strCountry}`
            : 'USA / Canada / Mexique'
          const date = ev.dateEvent
          const heure = ev.strTime ? ev.strTime.slice(0, 5) : ''
          const image = ev.strPoster || ev.strThumb || null

          const { error } = await supabase.from('evenements').insert([{
            titre,
            lieu,
            date,
            date_debut: date,
            heure_debut: heure,
            description: `FIFA Coupe du Monde 2026 · ${phase} · ${ev.strHomeTeam} vs ${ev.strAwayTeam} · ${lieu}`,
            longitude: coords.longitude,
            latitude: coords.latitude,
            categorie: 'Sport',
            acces: 'public',
            prix: 'payant',
            image_url: image,
            statut: 'approuve',
            source: 'worldcup2026',
            source_id: ev.idEvent,
            lien: `https://www.thesportsdb.com/event/${ev.idEvent}`,
          }])

          if (error) {
            errors.push({ titre, error: error.message })
            skipped++
          } else {
            results.push({ titre, lieu, date, phase })
            imported++
          }

          // Pause entre chaque requête géocodage
          await new Promise(r => setTimeout(r, 200))

        } catch (err) {
          errors.push({ event: ev.idEvent, error: String(err) })
          skipped++
        }
      }

      // Pause entre rounds
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      errors.push({ round, error: String(err) })
    }
  }

  return NextResponse.json({ success: true, imported, skipped, results, errors })
}