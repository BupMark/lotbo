import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../../lib/deduplication'
import { normaliserVille } from '../../../../lib/normalisation'

export const maxDuration = 60

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

const NB_PAGES = 4 // ~112 événements récents — au-delà, volume plus ancien/moins prioritaire

const CATEGORIE_MAP: Record<string, string> = {
  'Concert':     'Concert / Spectacle',
  'Culture':     'Foire / Exposition',
  'Formation':   'Formation / Séminaire',
  'Soirée':      'Concert / Spectacle',
  'Tourisme':    'Célébration communautaire',
  'Sport':       'Tournoi / Compétition',
  'Festival':    'Festival',
  'Science':     'Formation / Séminaire',
  'Religieux':   'Culte / Cérémonie religieuse',
  'Gastronomie': 'Foire / Exposition',
  'Business':    'Conférence / Sommet',
  'Autre':       'Célébration communautaire',
}

interface EventJsonLd {
  name: string
  image?: string
  startDate?: string
  endDate?: string
  location?: { name?: string; address?: string }
  organizer?: { name?: string }
}

function extraireSlugs(html: string): string[] {
  const matches = [...html.matchAll(/href="https:\/\/tikerama\.com\/fr\/evenements\/([a-z0-9-]+)"/g)]
  return [...new Set(matches.map(m => m[1]))]
}

function deviverCategorieDepuisTitre(titre: string): string {
  const t = titre.toLowerCase()
  if (t.includes('concert') || t.includes('showcase') || t.includes('spectacle')) return CATEGORIE_MAP['Concert']
  if (t.includes('festival')) return CATEGORIE_MAP['Festival']
  if (t.includes('formation') || t.includes('conférence') || t.includes('conference')) return CATEGORIE_MAP['Formation']
  if (t.includes('salon') || t.includes('expo') || t.includes('summit') || t.includes('business')) return CATEGORIE_MAP['Business']
  if (t.includes('prière') || t.includes('priere') || t.includes('église')) return CATEGORIE_MAP['Religieux']
  if (t.includes('brunch') || t.includes('grillade') || t.includes('chocolat') || t.includes('alloco')) return CATEGORIE_MAP['Gastronomie']
  return 'Célébration communautaire'
}

function parseJsonLd(html: string): EventJsonLd | null {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (!m) return null
  try {
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

async function geocode(address: string): Promise<{ longitude: number; latitude: number } | null> {
  try {
    // country=ci — sans ce biais, une adresse ambiguë/vague peut matcher
    // n'importe où dans le monde (déjà vu historiquement pour Haïti,
    // reproduit ici : événements ivoiriens géolocalisés en Allemagne/Algérie)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=ci&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
    return null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  let doublons = 0
  let errors = 0
  const cacheGeocode = new Map<string, { longitude: number; latitude: number } | null>()

  try {
    // Préchargement des source_id déjà en base pour cette source
    const { data: existants } = await admin
      .from('evenements')
      .select('source_id')
      .eq('source', 'tikerama')
    const setExistants = new Set((existants || []).map(e => e.source_id).filter(Boolean))

    const tousSlugs = new Set<string>()
    for (let page = 1; page <= NB_PAGES; page++) {
      try {
        const url = `https://tikerama.com/fr?tab=events&page=${page}`
        const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
        if (!res.ok) break
        const html = await res.text()
        const slugs = extraireSlugs(html)
        if (slugs.length === 0) break
        slugs.forEach(s => tousSlugs.add(s))
      } catch {
        break
      }
    }

    for (const slug of tousSlugs) {
      const sourceId = `tikerama-${slug}`

      if (setExistants.has(sourceId)) { skipped++; continue }

      try {
        const bloquee = await estSourceBloquee(admin, 'tikerama', sourceId)
        if (bloquee) { skipped++; continue }

        const ficheUrl = `https://tikerama.com/fr/evenements/${slug}`
        const res = await fetch(ficheUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
        if (!res.ok) { skipped++; continue }
        const html = await res.text()
        const data = parseJsonLd(html)
        if (!data || !data.startDate) { skipped++; continue }

        const titre = data.name.replace(/\s*\|\s*TIKERAMA\s*$/, '').trim()
        const extraireDate = (v: string | undefined): string | null => {
          if (!v) return null
          const m = v.match(/^(\d{4}-\d{2}-\d{2})/)
          return m ? m[1] : null
        }
        const dateDebut = extraireDate(data.startDate)
        const dateFin = extraireDate(data.endDate)
        if (!dateDebut) { skipped++; continue }
        const adresse = data.location?.address || data.location?.name || ''
        if (!adresse) { skipped++; continue }

        let coords = cacheGeocode.get(adresse)
        if (coords === undefined) {
          coords = await geocode(adresse)
          cacheGeocode.set(adresse, coords)
        }
        if (!coords) { skipped++; continue }

        const villeBrute = data.location?.name?.split(',')[0]?.trim() || 'Abidjan'
        const ville = normaliserVille(villeBrute)

        const dedup = await verifierDoublon(admin, {
          titre,
          date: dateDebut,
          latitude: coords.latitude,
          longitude: coords.longitude,
          source_id: sourceId,
        })
        if (dedup.estDoublon) { doublons++; continue }

        const { error } = await admin.from('evenements').insert([{
          titre,
          lieu: ville,
          ville,
          pays: "Côte d'Ivoire",
          date: dateDebut,
          date_debut: dateDebut,
          date_fin: dateFin,
          categorie: deviverCategorieDepuisTitre(titre),
          latitude: coords.latitude,
          longitude: coords.longitude,
          image_url: data.image || null,
          organisateur: data.organizer?.name || null,
          prix: 'payant',
          acces: 'public',
          statut: 'approuve',
          visibilite: 'public',
          source: 'tikerama',
          source_id: sourceId,
          lien: ficheUrl,
        }])

        if (error) { errors++ } else { imported++; setExistants.add(sourceId) }
      } catch {
        errors++
      }
    }

    return NextResponse.json({
      success: true, imported, skipped, doublons, errors,
      slugs_trouves: tousSlugs.size,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
