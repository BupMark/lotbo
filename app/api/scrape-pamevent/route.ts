import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon } from '../../../lib/deduplication'

const CATEGORIE_MAP: Record<string, string> = {
  'Music':      'Concert / Spectacle',
  'Social':     'Célébration communautaire',
  'Food and Drink': 'Foire / Exposition',
  'Crafts':     'Foire / Exposition',
  'Sports':     'Tournoi / Compétition',
  'Comedy':     'Concert / Spectacle',
  'Film':       'Foire / Exposition',
  'Fashion':    'Foire / Exposition',
  'Business':   'Conférence / Sommet',
  'Educative':  'Formation / Séminaire',
  'Art':        'Foire / Exposition',
  'Tech':       'Conférence / Sommet',
  'Littéraire': 'Conférence / Sommet',
  'Galleries':  'Foire / Exposition',
  'Nightlife':  'Concert / Spectacle',
  'Theme Park': 'Festival',
}

export async function GET() {
  const secret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped  = 0
  let doublons = 0
  let errors   = 0
  const results: { titre: string; lieu: string; date: string }[] = []

  // Scraper toutes les pages
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const res = await fetch(`https://pamevent.com/events?page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LOTBO-scraper/1.0)' }
      })
      if (!res.ok) break

      const html = await res.text()

      // Extraire les liens d'événements
      const eventLinks = [...html.matchAll(/href="(https:\/\/pamevent\.com\/event\/[^"]+\/(\d+))"/g)]
      if (eventLinks.length === 0) { hasMore = false; break }

      for (const match of eventLinks) {
        const eventUrl = match[1]
        const eventId  = match[2]
        const sourceId = `pamevent-${eventId}`

        // Anti-doublon même source
        const { data: existing, error: existingError } = await supabase
          .from('evenements').select('id').eq('source_id', sourceId).single()
        if (existing && !existingError) { skipped++; continue }

        // Scraper la page détail
        try {
          const detailRes = await fetch(eventUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LOTBO-scraper/1.0)' }
          })
          const detail = await detailRes.text()

          // Extraire titre
          const titreMatch = detail.match(/<h1[^>]*>([^<]+)<\/h1>/)
          const titre = titreMatch?.[1]?.trim()
          if (!titre) { skipped++; continue }

          // Extraire date (format: "27 Jun" ou "27 Jun 2026")
          const dateMatch = detail.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})?/)
          if (!dateMatch) { skipped++; continue }
          const months: Record<string, string> = {
            Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
            Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'
          }
          const year = dateMatch[3] || new Date().getFullYear().toString()
          const dateDebut = `${year}-${months[dateMatch[2]]}-${dateMatch[1].padStart(2,'0')}`

          // Extraire lieu
          const lieuMatch = detail.match(/class="[^"]*venue[^"]*"[^>]*>([^<]+)</)
            || detail.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</)
          const lieu = lieuMatch?.[1]?.trim() || 'Haïti'

          // Extraire prix
          const prixMatch = detail.match(/\$[\d.]+/)
          const prixLabel = prixMatch ? 'payant' : 'gratuit'

          // Extraire description
          const descMatch = detail.match(/class="[^"]*description[^"]*"[^>]*>([\s\S]{0,500})/)
          const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim().slice(0, 500) || ''

          // Extraire catégorie
          const catMatch = detail.match(/class="[^"]*category[^"]*"[^>]*>([^<]+)</)
          const catRaw = catMatch?.[1]?.trim() || ''
          const categorie = CATEGORIE_MAP[catRaw] || 'Célébration communautaire'

          // Extraire image
          const imgMatch = detail.match(/property="og:image"\s+content="([^"]+)"/)
          const image_url = imgMatch?.[1] || ''

          // Géocodage via Google Places
          let latitude  = 18.5392  // défaut Haïti
          let longitude = -72.3288
          let ville     = 'Port-au-Prince'
          let pays      = 'Haiti'

          if (lieu && lieu !== 'Haïti') {
            try {
              const geoRes = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(lieu + ', Haiti')}&key=${process.env.GOOGLE_PLACES_API_KEY}`
              )
              const geoData = await geoRes.json()
              if (geoData.results?.[0]) {
                latitude  = geoData.results[0].geometry.location.lat
                longitude = geoData.results[0].geometry.location.lng
                const comps = geoData.results[0].address_components
                ville = comps.find((c: {types: string[]}) => c.types.includes('locality'))?.long_name || ville
                pays  = comps.find((c: {types: string[]}) => c.types.includes('country'))?.long_name || pays
              }
            } catch { /* garder défaut Haïti */ }
          }

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
            date:       dateDebut,
            date_debut: dateDebut,
            description,
            longitude,
            latitude,
            categorie,
            image_url,
            prix:       prixLabel,
            acces:      'public',
            statut:     'approuve',
            visibilite: 'public',
            source:     'pamevent',
            source_id:  sourceId,
            lien:       eventUrl,
          }])

          if (error) { errors++ } else {
            imported++
            results.push({ titre, lieu, date: dateDebut })
          }

          await new Promise(r => setTimeout(r, 300))
        } catch { errors++ }
      }

      // Vérifier s'il y a une page suivante
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
    events: results.slice(0, 20),
  })
}
