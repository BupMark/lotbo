import { SupabaseClient } from '@supabase/supabase-js'

// ── Distance entre deux points GPS en km (formule Haversine) ─────────────────
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Similarité entre deux titres (0 à 1) ────────────────────────────────────
// Algorithme : Dice coefficient sur bigrammes — rapide et efficace
function similariteTitre(a: string, b: string): number {
  const normaliser = (s: string) =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s]/g, '')
     .replace(/\s+/g, ' ')
     .trim()

  const na = normaliser(a)
  const nb = normaliser(b)

  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return 0

  const bigrammes = (s: string): Set<string> => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
    return set
  }

  const ba = bigrammes(na)
  const bb = bigrammes(nb)
  let intersection = 0
  ba.forEach(b => { if (bb.has(b)) intersection++ })

  return (2 * intersection) / (ba.size + bb.size)
}

// ── Vérifier si un doublon cross-source existe ───────────────────────────────
export interface CandidatEvenement {
  titre: string
  date: string        // YYYY-MM-DD
  latitude: number
  longitude: number
  source_id: string
}

export interface ResultatDedup {
  estDoublon: boolean
  doublon_id?: string
  doublon_source?: string
  similarite?: number
}

export async function verifierDoublon(
  supabase: SupabaseClient,
  candidat: CandidatEvenement,
  options?: {
    seuilSimilarite?: number  // défaut 0.75
    rayonKm?: number          // défaut 1km
    fenetreJours?: number     // défaut 3 jours
  }
): Promise<ResultatDedup> {
  const seuil      = options?.seuilSimilarite ?? 0.75
  const rayonKm    = options?.rayonKm         ?? 1
  const fenetreJ   = options?.fenetreJours    ?? 3

  // Fenêtre de dates autour de la date candidate
  const dateRef  = new Date(candidat.date)
  const dateMin  = new Date(dateRef.getTime() - fenetreJ * 86400000).toISOString().split('T')[0]
  const dateMax  = new Date(dateRef.getTime() + fenetreJ * 86400000).toISOString().split('T')[0]

  // Récupérer les événements proches dans la fenêtre temporelle
  // On filtre par bbox approximative pour limiter les résultats
  const deltaLat = rayonKm / 111   // ~111km par degré de latitude
  const deltaLon = rayonKm / (111 * Math.cos(candidat.latitude * Math.PI / 180))

  const { data: candidats } = await supabase
    .from('evenements')
    .select('id, titre, date, latitude, longitude, source, source_id')
    .gte('date', dateMin)
    .lte('date', dateMax)
    .gte('latitude',  candidat.latitude  - deltaLat)
    .lte('latitude',  candidat.latitude  + deltaLat)
    .gte('longitude', candidat.longitude - deltaLon)
    .lte('longitude', candidat.longitude + deltaLon)
    .neq('source_id', candidat.source_id) // ignorer lui-même
    .limit(50)

  if (!candidats || candidats.length === 0) {
    return { estDoublon: false }
  }

  for (const ev of candidats) {
    // Vérifier distance GPS réelle
    const dist = distanceKm(candidat.latitude, candidat.longitude, ev.latitude, ev.longitude)
    if (dist > rayonKm) continue

    // Vérifier similarité titre
    const sim = similariteTitre(candidat.titre, ev.titre)
    if (sim >= seuil) {
      return {
        estDoublon:      true,
        doublon_id:      ev.id,
        doublon_source:  ev.source,
        similarite:      Math.round(sim * 100),
      }
    }
  }

  return { estDoublon: false }
}