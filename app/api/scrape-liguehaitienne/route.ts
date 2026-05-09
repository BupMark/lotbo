import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées des stades haïtiens connus
const STADES: Record<string, { longitude: number, latitude: number, ville: string }> = {
  'Parc Sainte-Thérèse': { longitude: -72.2845, latitude: 18.5170, ville: 'Pétion-Ville' },
  'Land des Gabions': { longitude: -73.7485, latitude: 18.1947, ville: 'Les Cayes' },
  'Parc Saint-Victor': { longitude: -72.3388, latitude: 19.7575, ville: 'Cap-Haïtien' },
  'Parc Levelt': { longitude: -72.7007, latitude: 19.1069, ville: 'Saint-Marc' },
  'Stade Sylvio Cator': { longitude: -72.3388, latitude: 18.5444, ville: 'Port-au-Prince' },
  'Stade de Carrefour': { longitude: -72.4057, latitude: 18.5307, ville: 'Carrefour' },
}

function trouverCoords(stade: string): { longitude: number, latitude: number, ville: string } {
  for (const [nom, coords] of Object.entries(STADES)) {
    if (stade.toLowerCase().includes(nom.toLowerCase())) {
      return coords
    }
  }
  // Défaut : Port-au-Prince
  return { longitude: -72.3388, latitude: 18.5444, ville: 'Haïti' }
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
    // Scrape la page des matchs
    const res = await fetch('https://www.liguehaitienne.com/fr/matches', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Lotbo/1.0; https://lotbo.app)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    })

    const html = await res.text()

    // Extraire les liens de matchs individuels
    const matchLinks = [...html.matchAll(/href="(\/fr\/matches\/[^"]+)"/g)]
      .map(m => m[1])
      .filter((v, i, a) => a.indexOf(v) === i) // dédupliqué
      .filter(l => l !== '/fr/matches')
      .slice(0, 20) // max 20 matchs par passe

    for (const link of matchLinks) {
      try {
        const source_id = link.replace('/fr/matches/', '')

        // Vérifier si déjà importé
        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'liguehaitienne')
          .eq('source_id', source_id)
          .single()

        if (existing) { skipped++; continue }

        // Scrape la page du match individuel
        const matchRes = await fetch(`https://www.liguehaitienne.com${link}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Lotbo/1.0; https://lotbo.app)',
          }
        })
        const matchHtml = await matchRes.text()

        // Extraire les équipes
        const equipeMatch = source_id.match(/^(.+)-v-(.+)-(\d{4}-\d{2}-\d{2})$/)
        if (!equipeMatch) { skipped++; continue }

        const equipeA = equipeMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const equipeB = equipeMatch[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const dateStr = equipeMatch[3]

        // Extraire le stade depuis le HTML
        const stadeMatch = matchHtml.match(/Land des Gabions|Parc Sainte-Thérèse|Parc Saint-Victor|Parc Levelt|Stade Sylvio Cator|Stade de Carrefour/i)
        const stadeNom = stadeMatch ? stadeMatch[0] : 'Haïti'
        const coords = trouverCoords(stadeNom)

        // Extraire le score si disponible
        const scoreMatch = matchHtml.match(/(\d+)\s*-\s*(\d+)/)
        const score = scoreMatch ? `${scoreMatch[1]} - ${scoreMatch[2]}` : 'À venir'

        // Extraire la phase
        const phaseMatch = matchHtml.match(/Championnat National[^<]*/i)
        const phase = phaseMatch ? phaseMatch[0].trim() : 'Championnat National'

        const titre = `🇭🇹 ${equipeA} vs ${equipeB}`
        const lieu = stadeNom !== 'Haïti'
          ? `${stadeNom}, ${coords.ville}`
          : `${coords.ville}, Haïti`
        const description = `${phase} · ${equipeA} vs ${equipeB} · Score: ${score}`

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

        // Pause pour ne pas surcharger le serveur
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