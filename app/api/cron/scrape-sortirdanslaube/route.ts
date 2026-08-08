import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { verifierDoublon, estSourceBloquee } from '../../../../lib/deduplication'
import { normaliserVille } from '../../../../lib/normalisation'

export const maxDuration = 60

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

const NB_PAGES = 2
// Nombre d'événements traités en parallèle par lot — équilibre entre
// vitesse (éviter le séquentiel qui cause les 504) et politesse envers
// le site source (éviter de le marteler avec trop de requêtes simultanées)
const CONCURRENCE = 10

const CATEGORIE_MAP: Record<string, string> = {
  cine_spectacle_theatre: 'Concert / Spectacle',
  concert_soiree_the_dansant: 'Concert / Spectacle',
  ecologie_sortie_nature: 'Loisir',
  exposition_conference_porte_ouverte: 'Foire / Exposition',
  fete_rassemblement: 'Célébration communautaire',
  jeune_public_famille: 'Célébration communautaire',
  jeux_concours: 'Loisir',
  marche_foire_vide_grenier_salon: 'Foire / Exposition',
  randonnee_visite_guidee: 'Loisir',
  sports_activites_sportives: 'Tournoi / Compétition',
  stage_atelier: 'Formation / Séminaire',
}

const MOIS_FR: Record<string, number> = {
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
}

interface EventBrut {
  slug: string
  titre: string
  dateTexte: string
  lieuSlug: string
  lieuNom: string
  categories: string[]
  ficheUrl: string
}

function parseDateTexte(dateTexte: string, anneePubli: number): { debut: string; fin: string | null } | null {
  const nettoye = dateTexte.trim().replace(/1er/g, '1')

  let m = nettoye.match(/Du (\d{1,2}) ([a-zàâäéèêëîïôöùûüÿçœ]+) au (\d{1,2}) ([a-zàâäéèêëîïôöùûüÿçœ]+)/i)
  if (m) {
    const [, j1, mo1, j2, mo2] = m
    const mois1 = MOIS_FR[mo1.toLowerCase()]
    const mois2 = MOIS_FR[mo2.toLowerCase()]
    if (mois1 && mois2) {
      let annee = anneePubli
      if (mois1 < 3 && anneePubli && new Date().getMonth() + 1 > 9) annee += 1
      return {
        debut: `${annee}-${String(mois1).padStart(2, '0')}-${j1.padStart(2, '0')}`,
        fin: `${annee}-${String(mois2).padStart(2, '0')}-${j2.padStart(2, '0')}`,
      }
    }
  }

  m = nettoye.match(/Du (\d{1,2}) au (\d{1,2}) ([a-zàâäéèêëîïôöùûüÿçœ]+)/i)
  if (m) {
    const [, j1, j2, mo] = m
    const mois = MOIS_FR[mo.toLowerCase()]
    if (mois) {
      return {
        debut: `${anneePubli}-${String(mois).padStart(2, '0')}-${j1.padStart(2, '0')}`,
        fin: `${anneePubli}-${String(mois).padStart(2, '0')}-${j2.padStart(2, '0')}`,
      }
    }
  }

  m = nettoye.match(/Le (\d{1,2}) ([a-zàâäéèêëîïôöùûüÿçœ]+)/i)
  if (m) {
    const [, j, mo] = m
    const mois = MOIS_FR[mo.toLowerCase()]
    if (mois) {
      return {
        debut: `${anneePubli}-${String(mois).padStart(2, '0')}-${j.padStart(2, '0')}`,
        fin: null,
      }
    }
  }

  return null
}

function parseListePage(html: string): EventBrut[] {
  const events: EventBrut[] = []
  const blocs = html.split('class="event-wrapper"').slice(1)

  for (const bloc of blocs) {
    const ficheMatch = bloc.match(/evenements\/([a-z0-9-]+)\/"/)
    const titreMatch = bloc.match(/<h3><a[^>]*>([^<]+)<\/a>/)
    const dateMatch = bloc.match(/class="date">([^<]+)</)
    const lieuMatch = bloc.match(/lieux\/([a-z0-9-]+)\/"[^>]*>([^<]+)</)
    const catMatches = [...bloc.matchAll(/activites\/([a-z_]+)\//g)]

    if (!ficheMatch || !titreMatch || !dateMatch || !lieuMatch) continue

    events.push({
      slug: ficheMatch[1],
      titre: titreMatch[1]
        .replace(/&rsquo;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&eacute;/g, 'é')
        .replace(/&egrave;/g, 'è')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&agrave;/g, 'à')
        .replace(/&ocirc;/g, 'ô')
        .trim(),
      dateTexte: dateMatch[1].trim(),
      lieuSlug: lieuMatch[1],
      lieuNom: lieuMatch[2].trim(),
      categories: [...new Set(catMatches.map(m => m[1]))],
      ficheUrl: `https://sortirdanslaube.com/evenements/${ficheMatch[1]}/`,
    })
  }
  return events
}

async function recupererAnneePublication(ficheUrl: string): Promise<number> {
  try {
    const res = await fetch(ficheUrl, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const html = await res.text()
    const m = html.match(/"datePublished":"(\d{4})-/)
    return m ? parseInt(m[1]) : new Date().getFullYear()
  } catch {
    return new Date().getFullYear()
  }
}

async function recupererCoordonnees(lieuSlug: string, cache: Map<string, { lat: number; lng: number } | null>): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(lieuSlug)) return cache.get(lieuSlug) || null
  try {
    const res = await fetch(`https://sortirdanslaube.com/lieux/${lieuSlug}/`, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    const html = await res.text()
    const m = html.match(/"lat":"([\d.]+)","lng":"([\d.]+)"/)
    const coords = m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null
    cache.set(lieuSlug, coords)
    return coords
  } catch {
    cache.set(lieuSlug, null)
    return null
  }
}

interface Compteurs {
  imported: number
  skipped: number
  skipRapide: number
  skipDate: number
  skipCoords: number
  doublons: number
  errors: number
  tempsAnneePubli: number
  nbAnneePubli: number
  tempsCoords: number
  nbCoords: number
}

async function traiterEvenement(
  ev: EventBrut,
  admin: SupabaseClient,
  setExistants: Set<string>,
  cacheLieux: Map<string, { lat: number; lng: number } | null>,
  compteurs: Compteurs,
  anomaliesAnnee: string[]
): Promise<void> {
  const sourceId = `sortirdanslaube-${ev.slug}`

  if (setExistants.has(sourceId)) { compteurs.skipped++; compteurs.skipRapide++; return }

  const bloquee = await estSourceBloquee(admin, 'sortirdanslaube', sourceId)
  if (bloquee) { compteurs.skipped++; return }

  // recupererAnneePublication et recupererCoordonnees sont deux fetchs
  // indépendants (l'un ne dépend pas du résultat de l'autre) — lancés
  // en parallèle plutôt qu'en séquence, ça divise leur coût combiné
  // par ~2 pour cet événement précis
  const t1 = Date.now()
  const [anneePubli, coords] = await Promise.all([
    recupererAnneePublication(ev.ficheUrl),
    recupererCoordonnees(ev.lieuSlug, cacheLieux),
  ])
  const dt = Date.now() - t1
  compteurs.tempsAnneePubli += dt
  compteurs.nbAnneePubli++
  compteurs.tempsCoords += dt
  compteurs.nbCoords++

  const dates = parseDateTexte(ev.dateTexte, anneePubli)
  if (!dates) { compteurs.skipped++; compteurs.skipDate++; return }

  const moisEvenement = parseInt(dates.debut.split('-')[1])
  const moisPubli = new Date().getMonth() + 1
  if (Math.abs(moisEvenement - moisPubli) > 5) {
    anomaliesAnnee.push(`${ev.titre} (${dates.debut})`)
  }

  if (!coords) { compteurs.skipped++; compteurs.skipCoords++; return }

  const ville = normaliserVille(ev.lieuNom)

  const dedup = await verifierDoublon(admin, {
    titre: ev.titre,
    date: dates.debut,
    latitude: coords.lat,
    longitude: coords.lng,
    source_id: sourceId,
  })
  if (dedup.estDoublon) { compteurs.doublons++; return }

  const categoriePrincipale = ev.categories[0]
    ? (CATEGORIE_MAP[ev.categories[0]] || 'Célébration communautaire')
    : 'Célébration communautaire'

  const { error } = await admin.from('evenements').insert([{
    titre: ev.titre,
    lieu: ville,
    ville,
    pays: 'France',
    date: dates.debut,
    date_debut: dates.debut,
    date_fin: dates.fin,
    categorie: categoriePrincipale,
    latitude: coords.lat,
    longitude: coords.lng,
    prix: 'payant',
    acces: 'public',
    statut: 'approuve',
    visibilite: 'public',
    source: 'sortirdanslaube',
    source_id: sourceId,
    lien: ev.ficheUrl,
  }])

  if (error) {
    console.error('[SortirDansLAube] insert error:', error.message, '—', ev.titre, '—', sourceId)
    compteurs.errors++
  } else {
    compteurs.imported++
    setExistants.add(sourceId)
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

  const compteurs: Compteurs = {
    imported: 0, skipped: 0, skipRapide: 0, skipDate: 0, skipCoords: 0,
    doublons: 0, errors: 0,
    tempsAnneePubli: 0, nbAnneePubli: 0, tempsCoords: 0, nbCoords: 0,
  }
  const anomaliesAnnee: string[] = []
  const cacheLieux = new Map<string, { lat: number; lng: number } | null>()

  try {
    const { data: existants } = await admin
      .from('evenements')
      .select('source_id')
      .eq('source', 'sortirdanslaube')
    const setExistants = new Set((existants || []).map(e => e.source_id).filter(Boolean))

    for (let page = 1; page <= NB_PAGES; page++) {
      const url = page === 1
        ? 'https://sortirdanslaube.com/evenements/'
        : `https://sortirdanslaube.com/evenements/page/${page}/`

      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
      if (!res.ok) break
      const html = await res.text()
      const events = parseListePage(html)
      if (events.length === 0) break

      // Traitement par lots de CONCURRENCE événements en parallèle,
      // plutôt qu'un par un — c'est ce qui règle le dépassement du
      // maxDuration=60s observé en production
      for (let i = 0; i < events.length; i += CONCURRENCE) {
        const lot = events.slice(i, i + CONCURRENCE)
        await Promise.all(lot.map(ev => traiterEvenement(ev, admin, setExistants, cacheLieux, compteurs, anomaliesAnnee)))
      }
    }

    console.log('[SortirDansLAube] INSTRUMENTATION', JSON.stringify(compteurs))
    return NextResponse.json({
      success: true,
      imported: compteurs.imported,
      skipped: compteurs.skipped,
      skipRapide: compteurs.skipRapide,
      skipDate: compteurs.skipDate,
      skipCoords: compteurs.skipCoords,
      doublons: compteurs.doublons,
      errors: compteurs.errors,
      anomalies_annee: anomaliesAnnee,
      instrumentation: {
        tempsAnneePubliMs: compteurs.tempsAnneePubli, nbAnneePubli: compteurs.nbAnneePubli,
        tempsCoordsMs: compteurs.tempsCoords, nbCoords: compteurs.nbCoords,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
