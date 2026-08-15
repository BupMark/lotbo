import type { SupabaseClient } from '@supabase/supabase-js'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface ResultatGeocodage {
  longitude: number
  latitude: number
}

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// Consulte lieux_connus AVANT tout appel API externe — gratuit,
// instantané, fiabilité garantie (vérifié manuellement)
async function chercherLieuConnu(admin: SupabaseClient, adresse: string): Promise<ResultatGeocodage | null> {
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
// défaut sans ce paramètre, source du regroupement massif observé
// sur Tikerama le 6 août)
async function geocodeMapboxPrecis(address: string, codePays: string): Promise<(ResultatGeocodage & { relevance: number }) | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=${codePays}&types=poi,address&limit=1`
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

// Nominatim OSM — couverture différente de Mapbox pour certains POI
// locaux. Throttling 1.1s obligatoire (limite Nominatim à 1 req/s,
// sans quoi 429 confirmé par test réel le 6 août)
let derniereRequeteNominatim = 0
async function geocodeNominatim(query: string, codePays: string): Promise<ResultatGeocodage | null> {
  const maintenant = Date.now()
  const attente = 1100 - (maintenant - derniereRequeteNominatim)
  if (attente > 0) await new Promise(r => setTimeout(r, attente))
  derniereRequeteNominatim = Date.now()
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=${codePays}`
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
async function geocodeMapboxGenerique(address: string, codePays: string): Promise<ResultatGeocodage | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=${codePays}&limit=1`
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

/**
 * Chaîne de fallback complète pour géocoder une adresse :
 * lieux_connus → Mapbox précis (relevance ≥ 0.5) → Nominatim
 * (nom + ville) → Nominatim (adresse complète) → Mapbox générique (ville)
 *
 * @param admin Client Supabase (service role)
 * @param address Adresse ou nom de lieu à géocoder
 * @param ville Ville associée (fallback générique)
 * @param codePays Code pays ISO 2 lettres (ex: 'ci', 'ht', 'fr') — paramétrable,
 *                  contrairement à la version d'origine codée en dur pour la Côte d'Ivoire
 * @param nomPaysComplet Nom complet du pays, utilisé dans les requêtes Nominatim textuelles
 */
export async function geocode(
  admin: SupabaseClient,
  address: string,
  ville: string,
  codePays: string,
  nomPaysComplet: string
): Promise<ResultatGeocodage | null> {
  const connu = await chercherLieuConnu(admin, address)
  if (connu) return connu

  const precis = await geocodeMapboxPrecis(address, codePays)
  if (precis && precis.relevance >= 0.5) return { longitude: precis.longitude, latitude: precis.latitude }

  const nomLieu = address.split(',')[0]?.trim()
  if (nomLieu) {
    const nominatimSimplifie = await geocodeNominatim(`${nomLieu}, ${ville}, ${nomPaysComplet}`, codePays)
    if (nominatimSimplifie) return nominatimSimplifie
  }

  const nominatimComplet = await geocodeNominatim(`${address}, ${nomPaysComplet}`, codePays)
  if (nominatimComplet) return nominatimComplet

  return geocodeMapboxGenerique(`${ville}, ${nomPaysComplet}`, codePays)
}
