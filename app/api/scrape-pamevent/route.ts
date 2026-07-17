import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'

const CATEGORIE_MAP: Record<string, string> = {
  'Music':          'Concert / Spectacle',
  'Social':         'Célébration communautaire',
  'Food and Drink': 'Foire / Exposition',
  'Crafts':         'Foire / Exposition',
  'Sports':         'Tournoi / Compétition',
  'Comedy':         'Concert / Spectacle',
  'Film':           'Foire / Exposition',
  'Fashion':        'Foire / Exposition',
  'Business':       'Conférence / Sommet',
  'Educative':      'Formation / Séminaire',
  'Art':            'Foire / Exposition',
  'Tech':           'Conférence / Sommet',
  'Littéraire':     'Conférence / Sommet',
  'Galleries':      'Foire / Exposition',
  'Nightlife':      'Concert / Spectacle',
  'Theme Park':     'Festival',
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped  = 0
  let doublons = 0
  let errors   = 0
  const results: { titre: string; lieu: string; date: string }[] = []
  const seenIds = new Set<string>()

  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const res = await fetch(`https://pamevent.com/events?page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LOTBO-scraper/1.0)' }
      })
      if (!res.ok) break

      const html = await res.text()
      const eventLinks = [...html.matchAll(/href="(https:\/\/pamevent\.com\/event\/[^"]+\/(\d+))"/g)]
      if (eventLinks.length === 0) { hasMore = false; break }

      for (const match of eventLinks) {
        const eventUrl = match[1]
        const eventId  = match[2]
        if (seenIds.has(eventId)) continue
        seenIds.add(eventId)

        const sourceId = `pamevent-${eventId}`

        // Anti-doublon même source
        const { data: existing } = await supabase
          .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
        if (existing) { skipped++; continue }

        try {
          const detailRes = await fetch(eventUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LOTBO-scraper/1.0)' }
          })
          const detail = await detailRes.text()

          // Titre via og:title
          const titreMatch = detail.match(/property="og:title"\s+content="([^"]+)"/)
          const titre = titreMatch?.[1]?.trim()
          if (!titre) { skipped++; continue }

          // Date via JSON structuré startDate
          const startMatch = detail.match(/"startDate":\s*"(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})"/)
          const endMatch   = detail.match(/"endDate":\s*"(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})"/)
          if (!startMatch) { skipped++; continue }
          const dateDebut   = startMatch[1]
          const heureDebut  = startMatch[2]
          const dateFin     = endMatch?.[1] !== dateDebut ? endMatch?.[1] : null
          const heureFin    = endMatch?.[2] || null

          // Image via og:image
          const imgMatch  = detail.match(/property="og:image"\s+content="([^"]+)"/)
          const image_url = imgMatch?.[1] || ''

          // Lieu via lien Google Calendar (contient adresse complète)
          const gcalMatch = detail.match(/&location=([^&"]+)&sf=true/)
          const lieuBrut  = gcalMatch
            ? decodeURIComponent(gcalMatch[1]).trim()
            : 'Haïti'
          // Garder seulement nom lieu + ville (sans code postal)
          const lieuParts = lieuBrut.split('  ').filter(Boolean)
          const lieu      = lieuParts.slice(0, 2).join(', ') || lieuBrut

          // Ville/pays
          const villeMatch = lieuBrut.match(/P[eé]tion-?ville|Port-au-Prince|Cap-Ha[iï]tien|Jacmel|Les Cayes|Gonaïves/i)
          const ville      = villeMatch?.[0] || 'Port-au-Prince'
          const pays       = 'Haiti'

          // Coordonnées GPS via Google Geocoding
          let latitude  = 18.5392
          let longitude = -72.3288
          if (process.env.GOOGLE_PLACES_KEY && lieuBrut !== 'Haïti') {
            try {
              const geoRes  = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(lieuBrut)}&key=${process.env.GOOGLE_PLACES_KEY}`
              )
              const geoData = await geoRes.json()
              if (geoData.results?.[0]) {
                latitude  = geoData.results[0].geometry.location.lat
                longitude = geoData.results[0].geometry.location.lng
              }
            } catch { /* garder défaut */ }
          }

          // Prix
          const prixMatch = detail.match(/\$[\d.]+/)
          const prix      = prixMatch ? 'payant' : 'gratuit'

          // Description
          const descMatch = detail.match(/property="og:description"\s+content="([^"]+)"/)
          const description = descMatch?.[1]?.trim().slice(0, 500) || ''

          // Catégorie
          const catMatch  = detail.match(/\/events\?category=([^"&]+)/)
          const catRaw    = catMatch?.[1] ? decodeURIComponent(catMatch[1]) : ''
          const categorie = CATEGORIE_MAP[catRaw] || 'Célébration communautaire'

          // Anti-doublon cross-sources SC6
          const dedup = await verifierDoublon(supabase, {
            titre, date: dateDebut, latitude, longitude, source_id: sourceId,
          })
          if (dedup.estDoublon) { doublons++; continue }

          const { error } = await supabase.from('evenements').insert([{
            titre,
            lieu,
            ville,
            pays,
            date:        dateDebut,
            date_debut:  dateDebut,
            date_fin:    dateFin,
            heure_debut: heureDebut,
            heure_fin:   heureFin,
            description,
            longitude,
            latitude,
            categorie,
            image_url,
            prix,
            acces:       'public',
            statut:      'approuve',
            visibilite:  'public',
            source:      'pamevent',
            source_id:   sourceId,
            lien:        eventUrl,
          }])

          if (error) { errors++ } else {
            imported++
            results.push({ titre, lieu, date: dateDebut })
          }

          await new Promise(r => setTimeout(r, 300))
        } catch { errors++ }
      }

      hasMore = html.includes(`page=${page + 1}`)
      page++

    } catch { hasMore = false }
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    doublons,
    errors,
    pages_scannees: page - 1,
    events: results,
  })
}
