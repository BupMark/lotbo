import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CLASSIFICATIONS = [
  { nom: 'Musique', segment: 'music', emoji: '🎵', categorie: 'Musique' },
  { nom: 'Sports', segment: 'sports', emoji: '🏆', categorie: 'Sport' },
  { nom: 'Arts & Theatre', segment: 'arts', emoji: '🎭', categorie: 'Culture' },
  { nom: 'Family', segment: 'family', emoji: '👨‍👩‍👧', categorie: 'Autre' },
]

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TICKETMASTER_API_KEY manquante' }, { status: 500 })
  }

  const aujourd_hui = new Date().toISOString().split('.')[0] + 'Z'
  let imported = 0
  let skipped = 0
  const results = []

  for (const classification of CLASSIFICATIONS) {
    try {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=${classification.segment}&startDateTime=${aujourd_hui}&size=20&sort=date,asc&expand=venues`

      const res = await fetch(url)
      const data = await res.json()
      const events = data._embedded?.events || []

      for (const ev of events) {
        // Vérifier si déjà importé
        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'ticketmaster')
          .eq('source_id', ev.id)
          .single()

        if (existing) { skipped++; continue }

        // Extraire les données du venue
        const venue = ev._embedded?.venues?.[0]
        const longitude = parseFloat(venue?.location?.longitude || '0')
        const latitude = parseFloat(venue?.location?.latitude || '0')
        const ville = venue?.city?.name || ''
        const pays = venue?.country?.name || ''
        const adresse = venue?.address?.line1 || ''

        // Ignorer si pas de coordonnées valides
        if (!longitude || !latitude) { skipped++; continue }

        // Image la plus grande disponible
        const image = ev.images?.find((img: any) => img.ratio === '16_9' && img.width > 500)?.url
          || ev.images?.[0]?.url
          || null

        // Prix
        const prixMin = ev.priceRanges?.[0]?.min
        const prix = prixMin && prixMin > 0 ? 'payant' : 'gratuit'

        const titre = `${classification.emoji} ${ev.name}`
        const lieu = [adresse, ville, pays].filter(Boolean).join(', ')
        const date = ev.dates?.start?.localDate || ''
        const heure = ev.dates?.start?.localTime?.slice(0, 5) || ''
        const genre = ev.classifications?.[0]?.genre?.name || classification.nom

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          date,
          date_debut: date,
          heure_debut: heure,
          description: `${ev.name} · ${genre} · ${ville}${pays ? ', ' + pays : ''}`,
          longitude,
          latitude,
          categorie: classification.categorie,
          acces: 'public',
          prix,
          image_url: image,
          statut: 'approuve',
          source: 'ticketmaster',
          source_id: ev.id,
          lien: ev.url,
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
      results.push({ classification: classification.nom, error: String(err) })
    }
  }

  return NextResponse.json({ success: true, imported, skipped, results })
}