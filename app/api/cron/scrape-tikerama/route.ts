import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
  description?: string
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

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// Consulte lieux_connus AVANT tout appel API externe — gratuit,
// instantané, fiabilité garantie (vérifié manuellement)
async function chercherLieuConnu(admin: SupabaseClient, adresse: string): Promise<{ latitude: number; longitude: number } | null> {
  const { data: lieux } = await admin.from('lieux_connus').select('nom_normalise, latitude, longitude')
  if (!lieux) return null
  const adresseNorm = normaliser(adresse)
  for (const lieu of lieux) {
    if (adresseNorm.includes(lieu.nom_normalise)) {
      return { latitude: Number(lieu.latitude), longitude: Number(lieu.longitude) }
    }
  }
  return null
}

// Mapbox avec types=poi,address — restreint aux résultats précis
// (lieux/adresses), plutôt que de retomber silencieusement sur le
// centre-ville quand le POI est inconnu de Mapbox (comportement par
// défaut sans ce paramètre, source du regroupement massif observé)
async function geocodeMapboxPrecis(address: string): Promise<{ longitude: number; latitude: number; relevance: number } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=ci&types=poi,address&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude, relevance: data.features[0].relevance }
    }
    return null
  } catch {
    return null
  }
}

// Nominatim OSM — a une couverture différente de Mapbox pour certains
// POI locaux (confirmé : "Palais de la Culture d'Abidjan" trouvé par
// Nominatim, absent de Mapbox). Throttling 1.1s obligatoire — la
// politique d'usage Nominatim limite à 1 req/s, sans quoi les appels
// échouent en 429 (confirmé par test réel)
let derniereRequeteNominatim = 0
async function geocodeNominatim(query: string): Promise<{ longitude: number; latitude: number } | null> {
  const maintenant = Date.now()
  const attente = 1100 - (maintenant - derniereRequeteNominatim)
  if (attente > 0) await new Promise(r => setTimeout(r, attente))
  derniereRequeteNominatim = Date.now()
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ci`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LOTBO/1.0 (lotbo@bup-mark.com)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// Mapbox générique (dernier recours) — accepte un résultat au niveau
// ville/région si rien de plus précis n'a été trouvé ailleurs
async function geocodeMapboxGenerique(address: string): Promise<{ longitude: number; latitude: number } | null> {
  try {
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

// Chaîne de fallback : lieux_connus → Mapbox précis (relevance ≥ 0.5)
// → Nominatim (nom + ville, prioritaire — formulation la plus fiable
// testée) → Nominatim (adresse complète) → Mapbox générique (ville)
async function geocode(admin: SupabaseClient, address: string, ville: string): Promise<{ longitude: number; latitude: number } | null> {
  const connu = await chercherLieuConnu(admin, address)
  if (connu) return connu

  const precis = await geocodeMapboxPrecis(address)
  if (precis && precis.relevance >= 0.5) return { longitude: precis.longitude, latitude: precis.latitude }

  const nomLieu = address.split(',')[0]?.trim()
  if (nomLieu) {
    const nominatimSimplifie = await geocodeNominatim(`${nomLieu}, ${ville}, Côte d'Ivoire`)
    if (nominatimSimplifie) return nominatimSimplifie
  }

  const nominatimComplet = await geocodeNominatim(`${address}, Côte d'Ivoire`)
  if (nominatimComplet) return nominatimComplet

  return geocodeMapboxGenerique(`${ville}, Côte d'Ivoire`)
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

        const villeBrute = data.location?.name?.split(',')[0]?.trim() || 'Abidjan'
        const ville = normaliserVille(villeBrute)

        let coords = cacheGeocode.get(adresse)
        if (coords === undefined) {
          coords = await geocode(admin, adresse, ville)
          cacheGeocode.set(adresse, coords)
        }
        if (!coords) { skipped++; continue }

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
          description: data.description || null,
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
