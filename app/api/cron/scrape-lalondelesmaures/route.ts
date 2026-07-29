import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normaliserVille } from '../../../../lib/normalisation'

export const maxDuration = 60

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

const BASE_URL = 'https://www.ville-lalondelesmaures.fr'
const VILLE = 'La Londe-les-Maures'
const PAYS = 'France'
const MAX_PAGES = 8

function normaliserTitre(titre: string): string {
  return titre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

interface EventBrut {
  titre: string
  ficheUrl: string
  lieuUrl: string | null
}

function parseListePage(html: string): EventBrut[] {
  const events: EventBrut[] = []
  const titreRegex = /<a class="eb-event-title" href="([^"]+)">([^<]+)<\/a>/g
  let match: RegExpExecArray | null

  while ((match = titreRegex.exec(html)) !== null) {
    const [, href, titreBrut] = match
    const ficheUrl = href.startsWith('http') ? href : BASE_URL + href
    const titre = titreBrut
      .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
      .trim()

    // Cherche le lien lieu (view-map.html) dans les ~1000 caractères
    // suivant ce titre, avant le prochain eb-event-title
    const zoneApres = html.slice(match.index, match.index + 1000)
    const lieuMatch = zoneApres.match(/href="([^"]*view-map\.html[^"]*)"/)
    const lieuUrl = lieuMatch
      ? (lieuMatch[1].startsWith('http') ? lieuMatch[1] : BASE_URL + lieuMatch[1])
      : null

    events.push({ titre, ficheUrl, lieuUrl })
  }

  return events
}

async function recupererDetailFiche(ficheUrl: string): Promise<{
  dateDebut: string | null
  heureDebut: string | null
  prix: string
} | null> {
  try {
    const res = await fetch(ficheUrl, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const html = await res.text()

    // Date exacte via le lien Google Calendar (format ISO fiable,
    // pas de parsing de texte français fragile)
    const dateMatch = html.match(/dates=(\d{8})T(\d{6})Z/)
    if (!dateMatch) return null

    const [, dateBrute, heureBrute] = dateMatch
    const dateDebut = `${dateBrute.slice(0, 4)}-${dateBrute.slice(4, 6)}-${dateBrute.slice(6, 8)}`
    const heureDebut = `${heureBrute.slice(0, 2)}:${heureBrute.slice(2, 4)}`

    const prixMatch = html.match(/Prix individuel\s*\|\s*([^\|]+)\s*\|/)
    const prixTexte = prixMatch ? prixMatch[1].trim().toLowerCase() : ''
    const prix = prixTexte.includes('gratuit') ? 'gratuit' : 'payant'

    return { dateDebut, heureDebut, prix }
  } catch {
    return null
  }
}

async function recupererCoordonnees(
  lieuUrl: string,
  cache: Map<string, { lat: number; lng: number } | null>
): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(lieuUrl)) return cache.get(lieuUrl) || null
  try {
    const res = await fetch(lieuUrl, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const html = await res.text()
    const m = html.match(/"lat":"([\d.\-]+)","long":"([\d.\-]+)"/)
    const coords = m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null
    cache.set(lieuUrl, coords)
    return coords
  } catch {
    cache.set(lieuUrl, null)
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
  const cacheLieux = new Map<string, { lat: number; lng: number } | null>()

  try {
    // Précharge les titres déjà en base pour cette ville (dédoublonnage
    // par titre normalisé + date, pas de source_id externe disponible
    // puisque ces événements sont aussi saisis manuellement via Scan & Publie)
    const { data: existants } = await admin
      .from('evenements')
      .select('titre, date_debut')
      .ilike('ville', '%Londe%')
      .limit(2000)

    const dejaVus = new Set(
      (existants || []).map(e => `${normaliserTitre(e.titre)}|${e.date_debut}`)
    )

    let dernierePremiereFicheUrl: string | null = null

    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * 12
      const url = `${BASE_URL}/culture-et-sport/agenda.html?start=${start}`
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
      if (!res.ok) break
      const html = await res.text()
      const events = parseListePage(html)
      if (events.length === 0) break
      if (page > 0 && events[0]?.ficheUrl === dernierePremiereFicheUrl) break
      dernierePremiereFicheUrl = events[0]?.ficheUrl || null

      for (const ev of events) {
        try {
          const detail = await recupererDetailFiche(ev.ficheUrl)
          if (!detail || !detail.dateDebut) { skipped++; continue }

          const cleDedoublonnage = `${normaliserTitre(ev.titre)}|${detail.dateDebut}`
          if (dejaVus.has(cleDedoublonnage)) { doublons++; continue }

          let coords: { lat: number; lng: number } | null = null
          if (ev.lieuUrl) {
            coords = await recupererCoordonnees(ev.lieuUrl, cacheLieux)
          }
          if (!coords) { skipped++; continue }

          const { error } = await admin.from('evenements').insert([{
            titre: ev.titre,
            lieu: VILLE,
            ville: normaliserVille(VILLE),
            pays: PAYS,
            date: detail.dateDebut,
            date_debut: detail.dateDebut,
            heure_debut: detail.heureDebut,
            categorie: 'Célébration communautaire',
            latitude: coords.lat,
            longitude: coords.lng,
            prix: detail.prix,
            acces: 'public',
            statut: 'approuve',
            visibilite: 'public',
            source: 'lalondelesmaures',
            lien: ev.ficheUrl,
          }])

          if (error) { errors++ } else { imported++; dejaVus.add(cleDedoublonnage) }

          await new Promise(r => setTimeout(r, 150))
        } catch {
          errors++
        }
      }
    }

    return NextResponse.json({ success: true, imported, skipped, doublons, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
