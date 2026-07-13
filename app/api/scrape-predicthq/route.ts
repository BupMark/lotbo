import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'
import { codeVersNomPays } from '../../../lib/normalisation'
import { verifierAdmin } from '../../../lib/adminAuth'

const CATEGORIE_MAP: Record<string, string> = {
  'concerts':        'Concert / Spectacle',
  'festivals':       'Festival',
  'sports':          'Tournoi / Compétition',
  'community':       'Célébration communautaire',
  'conferences':     'Conférence / Sommet',
  'expos':           'Foire / Exposition',
  'performing-arts': 'Concert / Spectacle',
  'school-holidays': 'Célébration communautaire',
  'public-holidays': 'Célébration communautaire',
  'observances':     'Célébration communautaire',
  'politics':        'Assemblée / Réunion',
  'daylight-savings':'Autre',
  'airport-delays':  'Autre',
  'severe-weather':  'Autre',
  'disasters':       'Autre',
  'terror':          'Autre',
  'health-warnings': 'Autre',
}

const ZONES = [
  { label: 'Haiti',       country: 'HT', within: '500km@18.5392,-72.3288' },
  { label: 'Caribbean',   country: 'DO', within: '300km@18.7357,-70.1627' },
  { label: 'Martinique',  country: 'MQ', within: '100km@14.6415,-61.0242' },
  { label: 'Guadeloupe',  country: 'GP', within: '100km@16.2650,-61.5510' },
  { label: 'Miami',       country: 'US', within: '100km@25.7617,-80.1918' },
  { label: 'New York',    country: 'US', within: '100km@40.7128,-74.0060' },
  { label: 'Montreal',    country: 'CA', within: '100km@45.5017,-73.5673' },
  { label: 'Paris',       country: 'FR', within: '80km@48.8566,2.3522'   },
  { label: 'Dakar',       country: 'SN', within: '100km@14.7167,-17.4677'},
  { label: 'Abidjan',     country: 'CI', within: '100km@5.3600,-4.0083'  },
  { label: 'Lagos',       country: 'NG', within: '100km@6.5244,3.3792'   },
  { label: 'Mexico City', country: 'MX', within: '100km@19.4326,-99.1332' },
  { label: 'Guadalajara', country: 'MX', within: '100km@20.6597,-103.3496'},
  { label: 'Buenos Aires',country: 'AR', within: '100km@-34.6037,-58.3816'},
  { label: 'Bogota',      country: 'CO', within: '100km@4.7110,-74.0721'  },
]

const CATEGORIES_ACTIVES = [
  'concerts', 'festivals', 'sports', 'community',
  'conferences', 'expos', 'performing-arts',
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

  const apiKey = process.env.PREDICTHQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'PREDICTHQ_API_KEY manquante' }, { status: 500 })
  }

  const aujourd_hui   = new Date().toISOString().split('T')[0]
  const dans_90_jours = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let imported  = 0
  let skipped   = 0
  let doublons  = 0
  let errors    = 0
  const results: { titre: string; lieu: string; date: string; zone: string }[] = []

  for (const zone of ZONES) {
    for (const categorie of CATEGORIES_ACTIVES) {
      try {
        const params = new URLSearchParams({
          'category':    categorie,
          'within':      zone.within,
          'active.gte':  aujourd_hui,
          'active.lte':  dans_90_jours,
          'sort':        'rank',
          'limit':       '10',
          'fields':      'id,title,description,category,start,end,location,geo,entities,rank,local_rank',
        })

        const res = await fetch(
          `https://api.predicthq.com/v1/events/?${params.toString()}`,
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } }
        )

        if (!res.ok) { errors++; continue }

        const data   = await res.json()
        const events = data.results || []

        for (const ev of events) {
          // 1. Doublon même source
          const { data: existing } = await supabase
            .from('evenements').select('id').eq('source_id', ev.id).single()
          if (existing) { skipped++; continue }

          // Extraire coordonnées
          const coords    = ev.geo?.geometry?.coordinates || ev.location
          if (!coords || coords.length < 2) { skipped++; continue }
          const longitude = Array.isArray(coords) ? coords[0] : null
          const latitude  = Array.isArray(coords) ? coords[1] : null
          if (!longitude || !latitude) { skipped++; continue }

          const dateDebut = ev.start?.split('T')[0] || aujourd_hui

          // 2. Doublon cross-sources ← SC6
          const dedup = await verifierDoublon(supabase, {
            titre:      ev.title,
            date:       dateDebut,
            latitude,
            longitude,
            source_id:  ev.id,
          })
          if (dedup.estDoublon) {
            doublons++
            continue
          }

          const venueEntity   = ev.entities?.find((e: { type: string }) => e.type === 'venue') as {
            name?: string; formatted_address?: string;
            address?: { locality?: string; country_code?: string }
          } | undefined
          const lieu          = venueEntity
            ? `${venueEntity.name}${venueEntity.formatted_address ? ', ' + venueEntity.formatted_address : ''}`
            : zone.label
          const ville         = venueEntity?.address?.locality || zone.label
          const pays          = codeVersNomPays(venueEntity?.address?.country_code || zone.country)
          const dateFin       = ev.end?.split('T')[0] || null
          const dateFinDiff   = dateFin && dateFin !== dateDebut ? dateFin : null
          const categorieNom  = CATEGORIE_MAP[ev.category] || 'Autre'
          const description   = ev.description?.slice(0, 500) || ''

          const { error } = await supabase.from('evenements').insert([{
            titre:       ev.title,
            lieu,
            ville,
            pays,
            date:        dateDebut,
            date_debut:  dateDebut,
            date_fin:    dateFinDiff,
            description,
            longitude,
            latitude,
            categorie:   categorieNom,
            statut:      'approuve',
            source:      'predicthq',
            source_id:   ev.id,
            acces:       'public',
            prix:        'gratuit',
            visibilite:  'public',
          }])

          if (error) { errors++ } else {
            imported++
            results.push({ titre: ev.title, lieu, date: dateDebut, zone: zone.label })
          }
        }

        await new Promise(r => setTimeout(r, 200))
      } catch { errors++ }
    }
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    doublons_cross_sources: doublons,
    errors,
    zones_scannees:      ZONES.length,
    categories_scannees: CATEGORIES_ACTIVES.length,
    events:              results.slice(0, 20),
  })
}