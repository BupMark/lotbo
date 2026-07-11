// TECH-WIKI-3 bis — Import agenda jds.fr, fenêtre Wikimania Paris (18-27 juillet 2026)
// ⚠️ FORMULATION : "Événements à Paris et proche périphérie pendant la période Wikimania"
//    jds.fr/paris/agenda/ couvre en réalité toute l'Île-de-France (vérifié : Saint-Denis,
//    Clermont-Oise sont apparus dans le catalogue) — d'où le double filtre ville + fenêtre date.
//
// Architecture en 2 temps :
//   1. Fetch la page liste (?page=2, seule page couvrant la fenêtre 18-27 juillet — vérifié
//      manuellement, la séquence chronologique est continue sans trou ni doublon de pages)
//   2. Pré-filtre sur la date affichée en liste (évite de fetcher les fiches hors fenêtre)
//   3. Fetch la page détail des seuls candidats retenus → JSON-LD complet (geo précis si
//      location.@type === "Place", sinon fallback centroïde Paris)
//
// Périmètre géographique : Paris intra-muros + proche banlieue notable (Stade de France,
// La Défense, etc.) — décision Conseiller Stratégique du 11 juillet 2026, à la demande
// de Direction Partenariats (contexte Wikimania Paris 21-25 juillet).
//
// ⚠️ Si cette route doit être réutilisée pour une autre fenêtre de dates dans le futur,
//    il faut d'abord revalider manuellement quelle(s) page(s) de jds.fr/paris/agenda/
//    couvrent cette fenêtre — la pagination n'est pas fiable au-delà de ~page 400
//    (boucle silencieusement sur page 1, toujours HTTP 200).

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../lib/deduplication'
import { normaliserVille } from '../../../lib/normalisation'

const LIST_URL = 'https://www.jds.fr/paris/agenda/?&page=2'

// Fenêtre demandée par Direction Partenariats (mémo 11 juillet 2026)
const WINDOW_START = '2026-07-18'
const WINDOW_END   = '2026-07-27'

// Paris intra-muros + proche banlieue notable — décision validée le 11 juillet 2026
const VILLES_AUTORISEES = new Set([
  'paris',
  'saint-denis',
  'puteaux',
  'courbevoie',
  'nanterre',        // La Défense s'étend sur ces 3 communes
  'boulogne-billancourt',
  'levallois-perret',
  'neuilly-sur-seine',
  'issy-les-moulineaux',
  'vincennes',
  'saint-ouen',
])

// Centroïde Paris — fallback uniquement si location.@type n'est pas "Place"
const CENTROIDE_PARIS = { latitude: 48.8589, longitude: 2.347 }

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
}

export const maxDuration = 60

const CATEGORIE_MAP: Record<string, string> = {
  'MusicEvent':      'Concert / Spectacle',
  'TheaterEvent':     'Concert / Spectacle',
  'DanceEvent':       'Concert / Spectacle',
  'ComedyEvent':      'Concert / Spectacle',
  'Festival':         'Festival',
  'ChildrensEvent':   'Célébration communautaire',
  'SportsEvent':      'Tournoi / Compétition',
  'ExhibitionEvent':  'Foire / Exposition',
  'VisualArtsEvent':  'Foire / Exposition',
  'Event':            'Célébration communautaire',
}

interface CandidatListe {
  dataViewId: string
  href:       string
  dateDebut:  string   // YYYY-MM-DD, extrait du texte de la liste
}

// Convertit DD/MM/YYYY → YYYY-MM-DD
function convertirDate(ddmmyyyy: string): string | null {
  const m = ddmmyyyy.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, '’')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
}

// Parse la page liste et pré-filtre sur la date affichée — évite de fetcher
// la page détail des ~15 événements hors fenêtre sur les 25 de la page.
function parseListePage(html: string): CandidatListe[] {
  const candidats: CandidatListe[] = []
  const blocs = [...html.matchAll(/<li[^>]*class="liste-article-v2-item[^"]*"[^>]*data-view-id="(\d+)"[\s\S]*?<\/li>/g)]

  for (const bloc of blocs) {
    const dataViewId = bloc[1]
    const blocHtml   = bloc[0]

    const hrefMatch = blocHtml.match(/href="(https:\/\/www\.jds\.fr\/paris\/[^"]+_A)"/)
    if (!hrefMatch) continue
    const href = decodeEntities(hrefMatch[1])

    const dateMatch = blocHtml.match(/bi-calendar[^>]*><\/i>\s*([^<]+)</)
    if (!dateMatch) continue
    const premiereDate = dateMatch[1].match(/\d{2}\/\d{2}\/\d{4}/)
    if (!premiereDate) continue
    const dateDebut = convertirDate(premiereDate[0])
    if (!dateDebut) continue

    if (dateDebut < WINDOW_START || dateDebut > WINDOW_END) continue

    candidats.push({ dataViewId, href, dateDebut })
  }

  return candidats
}

interface EventDetail {
  titre:            string
  description:      string | null
  startDate:        string
  endDate:          string | null
  addressLocality:  string | null
  lieuNom:          string | null
  latitude:         number
  longitude:        number
  categorie:        string
  imageUrl:         string | null
}

// Cherche, parmi tous les blocs JSON-LD de la page, celui qui a un startDate
// (jds.fr utilise des sous-types schema.org variés : MusicEvent, TheaterEvent...
// pas toujours "@type": "Event" strict — filtrer sur la présence de startDate).
function parseDetailPage(html: string): EventDetail | null {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]

  for (const s of scripts) {
    let parsed: any
    try { parsed = JSON.parse(s[1]) } catch { continue }
    // jds.fr enveloppe parfois le JSON-LD dans un tableau : [{"@type":"MusicEvent",...}]
    const items = Array.isArray(parsed) ? parsed : [parsed]

    for (const data of items) {
      if (!data?.startDate) continue

      const location = data.location
      const isPlace  = location?.['@type'] === 'Place'

      const latitude  = isPlace && location.geo?.latitude  ? parseFloat(location.geo.latitude)  : CENTROIDE_PARIS.latitude
      const longitude = isPlace && location.geo?.longitude ? parseFloat(location.geo.longitude) : CENTROIDE_PARIS.longitude

      return {
        titre:           decodeEntities(data.name || ''),
        description:     data.description ? decodeEntities(data.description) : null,
        startDate:       String(data.startDate).slice(0, 10),
        endDate:         data.endDate ? String(data.endDate).slice(0, 10) : null,
        addressLocality: location?.address?.addressLocality || (location?.['@type'] === 'City' ? location.name : null),
        lieuNom:         isPlace ? location.name : null,
        latitude,
        longitude,
        categorie:       CATEGORIE_MAP[data['@type']] ?? 'Célébration communautaire',
        imageUrl:        typeof data.image === 'string' ? data.image : (data.image?.url ?? null),
      }
    }
  }

  return null
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported        = 0
  let skipped         = 0
  let doublons        = 0
  let errors          = 0
  let hors_perimetre   = 0
  const details: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    const resListe = await fetch(LIST_URL, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)
    if (!resListe.ok) {
      return NextResponse.json({ success: false, error: `Fetch liste a échoué (HTTP ${resListe.status})` }, { status: 502 })
    }

    const htmlListe = await resListe.text()
    const candidats = parseListePage(htmlListe)

    for (const cand of candidats) {
      const sourceId = `jds-paris-${cand.dataViewId}`

      // T-1 — Filtre anti-réimport suppression
      const bloquee = await estSourceBloquee(supabase, 'jds_paris', sourceId)
      if (bloquee) { skipped++; continue }

      const { data: existing } = await supabase
        .from('evenements').select('id').eq('source_id', sourceId).maybeSingle()
      if (existing) { skipped++; continue }

      const resDetail = await fetch(cand.href, { headers: HEADERS, redirect: 'follow', cache: 'no-store' } as RequestInit)
      if (!resDetail.ok) { errors++; continue }

      const htmlDetail = await resDetail.text()
      const detail      = parseDetailPage(htmlDetail)

      if (!detail) {
        errors++
        details.push({ titre: cand.href, statut: 'erreur', raison: 'JSON-LD introuvable' })
        continue
      }

      // Double vérification date (le texte liste peut différer légèrement du JSON-LD)
      if (detail.startDate < WINDOW_START || detail.startDate > WINDOW_END) {
        hors_perimetre++
        continue
      }

      // Filtre géographique — Paris + proche banlieue notable uniquement
      const villeBrute = detail.addressLocality || 'Paris'
      const villeNorm   = normaliserVille(villeBrute)
      const villeClef    = villeBrute.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (!VILLES_AUTORISEES.has(villeClef)) {
        hors_perimetre++
        details.push({ titre: detail.titre, statut: 'ignoré', raison: `hors périmètre: ${villeBrute}` })
        continue
      }

      // Anti-doublon cross-sources
      const dedup = await verifierDoublon(supabase, {
        titre:     detail.titre,
        date:      detail.startDate,
        latitude:  detail.latitude,
        longitude: detail.longitude,
        source_id: sourceId,
      })
      if (dedup.estDoublon) { doublons++; continue }

      const { error } = await supabase.from('evenements').insert([{
        titre:       detail.titre,
        lieu:        detail.lieuNom || villeNorm,
        ville:       villeNorm,
        pays:        'France',
        date:        detail.startDate,
        date_debut:  detail.startDate,
        date_fin:    detail.endDate,
        description: detail.description,
        latitude:    detail.latitude,
        longitude:   detail.longitude,
        categorie:   detail.categorie,
        image_url:   detail.imageUrl,
        prix:        'payant',
        acces:       'public',
        statut:      'approuve',
        visibilite:  'public',
        source:      'jds_paris',
        source_id:   sourceId,
        lien:        cand.href,
      }])

      if (error) {
        errors++
        details.push({ titre: detail.titre, statut: 'erreur', raison: error.message })
      } else {
        imported++
        details.push({ titre: detail.titre, statut: 'importé' })
      }

      await new Promise(r => setTimeout(r, 300))
    }

    return NextResponse.json({
      success: true,
      candidats_pre_filtres: candidats.length,
      imported,
      skipped,
      doublons,
      errors,
      hors_perimetre,
      fenetre: `${WINDOW_START} → ${WINDOW_END}`,
      evenements: details,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
