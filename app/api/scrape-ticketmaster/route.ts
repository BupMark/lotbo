import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'
import { normaliserPays } from '../../../lib/normalisation'
import { verifierAdmin } from '../../../lib/adminAuth'

const CLASSIFICATIONS = [
  { nom: 'Musique',        segment: 'music',  emoji: '🎵', categorie: 'Musique'  },
  { nom: 'Sports',         segment: 'sports', emoji: '🏆', categorie: 'Sport'    },
  { nom: 'Arts & Theatre', segment: 'arts',   emoji: '🎭', categorie: 'Culture'  },
  { nom: 'Family',         segment: 'family', emoji: '👨‍👩‍👧', categorie: 'Autre'    },
]

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

  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TICKETMASTER_API_KEY manquante' }, { status: 500 })
  }

  const aujourd_hui = new Date().toISOString().split('.')[0] + 'Z'
  let imported = 0
  let skipped  = 0
  let doublons = 0
  const results = []

  for (const classification of CLASSIFICATIONS) {
    try {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=${classification.segment}&startDateTime=${aujourd_hui}&size=20&sort=date,asc&expand=venues`

      const res    = await fetch(url)
      const data   = await res.json()
      const events = data._embedded?.events || []

      for (const ev of events) {
        // 1. Doublon même source
        const { data: existing } = await supabase
          .from('evenements').select('id')
          .eq('source', 'ticketmaster').eq('source_id', ev.id).single()
        if (existing) { skipped++; continue }

        const venue     = ev._embedded?.venues?.[0]
        const longitude = parseFloat(venue?.location?.longitude || '0')
        const latitude  = parseFloat(venue?.location?.latitude  || '0')
        if (!longitude || !latitude) { skipped++; continue }

        const date = ev.dates?.start?.localDate || ''
        if (!date) { skipped++; continue }

        // 2. Doublon cross-sources ← SC6
        const dedup = await verifierDoublon(supabase, {
          titre:     ev.name,
          date,
          latitude,
          longitude,
          source_id: ev.id,
        })
        if (dedup.estDoublon) {
          doublons++
          continue
        }

        const ville    = venue?.city?.name    || ''
        const pays     = normaliserPays(venue?.country?.name || '')
        const adresse  = venue?.address?.line1 || ''
        const image    = ev.images?.find((img: { ratio: string; width: number; url: string }) =>
          img.ratio === '16_9' && img.width > 500
        )?.url || ev.images?.[0]?.url || null
        const prixMin  = ev.priceRanges?.[0]?.min
        const prix     = prixMin && prixMin > 0 ? 'payant' : 'gratuit'
        const titre    = `${classification.emoji} ${ev.name}`
        const lieu     = [adresse, ville, pays].filter(Boolean).join(', ')
        const heure    = ev.dates?.start?.localTime?.slice(0, 5) || ''
        const genre    = ev.classifications?.[0]?.genre?.name || classification.nom

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          date,
          date_debut:  date,
          heure_debut: heure,
          description: `${ev.name} · ${genre} · ${ville}${pays ? ', ' + pays : ''}`,
          longitude,
          latitude,
          categorie:   classification.categorie,
          acces:       'public',
          prix,
          image_url:   image,
          statut:      'approuve',
          source:      'ticketmaster',
          source_id:   ev.id,
          lien:        ev.url,
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

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    doublons_cross_sources: doublons,
    results,
  })
}