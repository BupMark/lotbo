import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STADES: Record<string, { longitude: number, latitude: number }> = {
  'Land des Gabions': { longitude: -73.7485, latitude: 18.1947 },
  'Parc Sainte-Thérèse': { longitude: -72.2845, latitude: 18.5170 },
  'Parc Saint-Victor': { longitude: -72.3388, latitude: 19.7575 },
  'Parc Levelt': { longitude: -72.7007, latitude: 19.1069 },
  'Stade Sylvio Cator': { longitude: -72.3388, latitude: 18.5444 },
  'Stade de Carrefour': { longitude: -72.4057, latitude: 18.5307 },
}

function trouverCoords(lieu: string): { longitude: number, latitude: number } {
  for (const [nom, coords] of Object.entries(STADES)) {
    if (lieu.toLowerCase().includes(nom.toLowerCase())) {
      return coords
    }
  }
  return { longitude: -72.3388, latitude: 18.5444 }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results = []
  const errors = []

  try {
    const res = await fetch('https://www.liguehaitienne.com/fr/matches', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Lotbo/1.0; https://lotbo.app)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    })

    const html = await res.text()

    const matchLinks = [...html.matchAll(/href="(\/fr\/matches\/[^"]+)"/g)]
      .map(m => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(l => l !== '/fr/matches')
      .slice(0, 20)

    for (const link of matchLinks) {
      try {
        const source_id = link.replace('/fr/matches/', '')

        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'liguehaitienne')
          .eq('source_id', source_id)
          .single()

        if (existing) { skipped++; continue }

        const matchRes = await fetch(`https://www.liguehaitienne.com${link}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Lotbo/1.0; https://lotbo.app)',
          }
        })
        const matchHtml = await matchRes.text()

        // Extraire équipes + date depuis source_id
        const equipeMatch = source_id.match(/^(.+)-v-(.+)-(\d{4}-\d{2}-\d{2})$/)
        if (!equipeMatch) { skipped++; continue }

        const equipeA = equipeMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const equipeB = equipeMatch[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const dateStr = equipeMatch[3]

        // Extraire le lieu complet — pattern "Land des Gabions, Les Cayes"
        const lieuMatch = matchHtml.match(/(?:Land des Gabions|Parc Sainte-Thérèse|Parc Saint-Victor|Parc Levelt|Stade Sylvio Cator|Stade de Carrefour)[^<"]{0,50}/)
        const lieuComplet = lieuMatch ? lieuMatch[0].trim().replace(/\\u[\dA-F]{4}/gi, '') : 'Port-au-Prince, Haïti'

        const coords = trouverCoords(lieuComplet)

        // Extraire le score
        const scoreMatch = matchHtml.match(/(\d+)\s*[-–]\s*(\d+)/)
        const score = scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : ''

        // Extraire la phase
        const phaseMatch = matchHtml.match(/Championnat National[^<"]{0,30}/)
        const phase = phaseMatch ? phaseMatch[0].trim() : 'Championnat National'

        const titre = `🇭🇹 ${equipeA} vs ${equipeB}`
        const lieu = lieuComplet
        const description = score
          ? `${phase} · ${equipeA} ${score} ${equipeB}`
          : `${phase} · ${equipeA} vs ${equipeB}`

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          date: dateStr,
          date_debut: dateStr,
          heure_debut: '00:00',
          description,
          longitude: coords.longitude,
          latitude: coords.latitude,
          categorie: 'Sport',
          acces: 'public',
          prix: 'payant',
          image_url: null,
          statut: 'approuve',
          source: 'liguehaitienne',
          source_id,
          lien: `https://www.liguehaitienne.com${link}`,
        }])

        if (error) {
          errors.push({ source_id, error: error.message })
          skipped++
        } else {
          results.push({ titre, lieu, date: dateStr })
          imported++
        }

        await new Promise(r => setTimeout(r, 500))

      } catch (err) {
        errors.push({ link, error: String(err) })
        skipped++
      }
    }

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, imported, skipped, results, errors })
}