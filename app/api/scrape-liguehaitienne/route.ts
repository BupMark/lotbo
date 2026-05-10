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
  const results: any[] = []
  const errors: any[] = []

  try {
    const res = await fetch('https://www.liguehaitienne.com/fr/matches', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Lotbo/1.0; https://lotbo.app)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    })

    const html = await res.text()

    // Parser les blocs de matchs depuis le HTML brut
    // Chaque match est un lien : <a href="/fr/matches/SLUG">...texte...</a>
    const matchRegex = /\[([^\]]+)\]\(https:\/\/www\.liguehaitienne\.com(\/fr\/matches\/[^)]+)\)/g

    // Utiliser le markdown rendu — on va parser le texte des liens
    // Format du texte : "Phase • date • EquipeA • Score • EquipeB • Stade"
    const matchTexte = html.match(
        /(Land des Gabions,\s*[^<"\\]{3,30}|Parc Sainte-Thérèse,\s*[^<"\\]{3,30}|Parc Saint-Victor,\s*[^<"\\]{3,30}|Parc Levelt,\s*[^<"\\]{3,30}|Stade Sylvio Cator,\s*[^<"\\]{3,30}|Stade de Carrefour,\s*[^<"\\]{3,30})/g
      ) || []

    // Extraire les slugs dans l'ordre
    const slugsOrdre = [...html.matchAll(/href="(\/fr\/matches\/((?!matches")[^"]+))"/g)]
      .map(m => ({ url: m[1], slug: m[2] }))
      .filter((v, i, a) => a.findIndex(x => x.slug === v.slug) === i)
      .filter(v => /\d{4}-\d{2}-\d{2}$/.test(v.slug))
      .slice(0, 20)

    // Associer chaque slug avec son stade dans l'ordre
    for (let i = 0; i < slugsOrdre.length; i++) {
      const { url, slug } = slugsOrdre[i]
      const lieuBrut = matchTexte[i] || 'Port-au-Prince, Haïti'
      const lieu = lieuBrut.replace(/\\/g, '').trim()

      try {
        const { data: existing } = await supabase
          .from('evenements')
          .select('id')
          .eq('source', 'liguehaitienne')
          .eq('source_id', slug)
          .single()

        if (existing) { skipped++; continue }

        const equipeMatch = slug.match(/^(.+)-v-(.+)-(\d{4}-\d{2}-\d{2})$/)
        if (!equipeMatch) { skipped++; continue }

        const equipeA = equipeMatch[1].split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const equipeB = equipeMatch[2].split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const dateStr = equipeMatch[3]
        const coords = trouverCoords(lieu)

        const titre = `🇭🇹 ${equipeA} vs ${equipeB}`

        const { error } = await supabase.from('evenements').insert([{
          titre,
          lieu,
          date: dateStr,
          date_debut: dateStr,
          heure_debut: '00:00',
          description: `Championnat National Haïtien · ${equipeA} vs ${equipeB} · ${lieu}`,
          longitude: coords.longitude,
          latitude: coords.latitude,
          categorie: 'Sport',
          acces: 'public',
          prix: 'payant',
          image_url: null,
          statut: 'approuve',
          source: 'liguehaitienne',
          source_id: slug,
          lien: `https://www.liguehaitienne.com${url}`,
        }])

        if (error) {
          errors.push({ slug, error: error.message })
          skipped++
        } else {
          results.push({ titre, lieu, date: dateStr })
          imported++
        }

      } catch (err) {
        errors.push({ slug, error: String(err) })
        skipped++
      }
    }

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true, imported, skipped, results, errors })
}
