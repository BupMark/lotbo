// IMPORT-PRESEASON-2026 — Matchs amicaux pré-saison 2026/27 · Clubs européens
// Fenêtre : fin juillet – mi-août 2026, post Coupe du Monde 2026 (fin 19 juillet)
// Source : en.billet-de-match.com (mémo Direction Import · 17 juillet 2026)
// ⚠️ Heure de coup d'envoi, prix exact et organisateur non mentionnés dans la source
//    → heure_debut omis, prix par défaut 'payant' (billetterie tierce), lien = domaine source

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau stade
const STADES: Record<string, {
  latitude: number
  longitude: number
  ville: string
  pays: string
}> = {
  'Geodis Park':              { latitude: 36.1311, longitude: -86.7663, ville: 'Nashville', pays: 'USA' },
  'Raymond James Stadium':    { latitude: 27.9759, longitude: -82.5033, ville: 'Tampa', pays: 'USA' },
  'Yankee Stadium':           { latitude: 40.8296, longitude: -73.9262, ville: 'New York', pays: 'USA' },
  'Red Bull Arena':           { latitude: 40.7369, longitude: -74.1503, ville: 'Harrison', pays: 'USA' },
  'Soldier Field':            { latitude: 41.8623, longitude: -87.6167, ville: 'Chicago', pays: 'USA' },
  'Subaru Park':              { latitude: 39.8322, longitude: -75.3789, ville: 'Chester', pays: 'USA' },
  'Estadio Algarve':          { latitude: 37.1494, longitude: -8.1039, ville: 'Faro', pays: 'Portugal' },
  'Helsinki Olympic Stadium': { latitude: 60.1867, longitude: 24.9256, ville: 'Helsinki', pays: 'Finlande' },
  'Lerkendal Stadion':        { latitude: 63.4128, longitude: 10.3708, ville: 'Trondheim', pays: 'Norvège' },
  'Stade Maurice Dufrasne':   { latitude: 50.6014, longitude: 5.5511, ville: 'Liège', pays: 'Belgique' },
  'Celtic Park':              { latitude: 55.8497, longitude: -4.2058, ville: 'Glasgow', pays: 'Écosse' },
  'Aviva Stadium':            { latitude: 53.3350, longitude: -6.2286, ville: 'Dublin', pays: 'Irlande' },
  'Croke Park':                { latitude: 53.3607, longitude: -6.2512, ville: 'Dublin', pays: 'Irlande' },
  'Strawberry Arena':         { latitude: 59.3739, longitude: 17.9995, ville: 'Stockholm', pays: 'Suède' },
  'Gamla Ullevi':              { latitude: 57.7075, longitude: 11.9847, ville: 'Göteborg', pays: 'Suède' },
  'Eden Park':                 { latitude: -36.8748, longitude: 174.7448, ville: 'Auckland', pays: 'Nouvelle-Zélande' },
  'ANZ Stadium':               { latitude: -33.8470, longitude: 151.0634, ville: 'Sydney', pays: 'Australie' },
  'Allianz Stadium':           { latitude: -33.8913, longitude: 151.2249, ville: 'Sydney', pays: 'Australie' },
  'Optus Stadium':             { latitude: -31.9513, longitude: 115.8891, ville: 'Perth', pays: 'Australie' },
  'Kai Tak Sports Park':       { latitude: 22.3224, longitude: 114.1972, ville: 'Hong Kong', pays: 'Hong Kong' },
  'Jeju World Cup Stadium':    { latitude: 33.2462, longitude: 126.5093, ville: 'Jeju', pays: 'Corée du Sud' },
  'Gelora Bung Karno Stadium': { latitude: -6.2188, longitude: 106.8021, ville: 'Jakarta', pays: 'Indonésie' },
}

interface MatchPreseason {
  source_id: string
  domicile: string
  exterieur: string
  stade: keyof typeof STADES
  date: string
  note?: string
}

const MATCHS: MatchPreseason[] = [
  // ── ÉTATS-UNIS ──────────────────────────────────────────────────────────
  { source_id: 'preseason2026-liverpool-sunderland-nashville',   domicile: 'Liverpool FC',        exterieur: 'Sunderland',              stade: 'Geodis Park',           date: '2026-07-25' },
  { source_id: 'preseason2026-wrexham-leeds-tampa',              domicile: 'Wrexham FC',           exterieur: 'Leeds United',            stade: 'Raymond James Stadium', date: '2026-07-25' },
  { source_id: 'preseason2026-liverpool-wrexham-nyc',            domicile: 'Liverpool FC',         exterieur: 'Wrexham FC',               stade: 'Yankee Stadium',        date: '2026-07-29' },
  { source_id: 'preseason2026-sunderland-leeds-harrison',        domicile: 'Sunderland',           exterieur: 'Leeds United',            stade: 'Red Bull Arena',        date: '2026-07-30' },
  { source_id: 'preseason2026-liverpool-leeds-chicago',          domicile: 'Liverpool FC',         exterieur: 'Leeds United',            stade: 'Soldier Field',         date: '2026-08-02' },
  { source_id: 'preseason2026-wrexham-sunderland-chester',       domicile: 'Wrexham FC',           exterieur: 'Sunderland',              stade: 'Subaru Park',           date: '2026-08-02' },

  // ── PORTUGAL — Faro ─────────────────────────────────────────────────────
  { source_id: 'preseason2026-sporting-nottingham-faro',         domicile: 'Sporting CP',          exterieur: 'Nottingham Forest',        stade: 'Estadio Algarve',       date: '2026-07-31' },

  // ── FINLANDE ────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-manutd-wrexham-helsinki',          domicile: 'Manchester United',    exterieur: 'Wrexham',                  stade: 'Helsinki Olympic Stadium', date: '2026-07-18' },

  // ── NORVÈGE ─────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-rosenborg-manutd-trondheim',       domicile: 'Rosenborg',            exterieur: 'Manchester United',        stade: 'Lerkendal Stadion',     date: '2026-07-24' },

  // ── BELGIQUE ────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-standard-juventus-liege',          domicile: 'Standard Liège',        exterieur: 'Juventus Turin',            stade: 'Stade Maurice Dufrasne', date: '2026-07-25' },

  // ── ÉCOSSE ──────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-celtic-milan-glasgow',             domicile: 'Celtic FC',            exterieur: 'AC Milan',                  stade: 'Celtic Park',           date: '2026-07-25' },

  // ── IRLANDE ─────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-arsenal-betis-dublin',             domicile: 'Arsenal',              exterieur: 'Real Betis',                stade: 'Aviva Stadium',         date: '2026-08-05' },
  { source_id: 'preseason2026-manutd-leeds-dublin',              domicile: 'Manchester United',    exterieur: 'Leeds United',             stade: 'Croke Park',            date: '2026-08-12' },

  // ── SUÈDE ───────────────────────────────────────────────────────────────
  { source_id: 'preseason2026-manutd-atletico-stockholm',        domicile: 'Manchester United',    exterieur: 'Atlético Madrid',           stade: 'Strawberry Arena',      date: '2026-08-01' },
  { source_id: 'preseason2026-manutd-psg-goteborg',              domicile: 'Manchester United',    exterieur: 'Paris PSG',                 stade: 'Gamla Ullevi',          date: '2026-08-08' },

  // ── NOUVELLE-ZÉLANDE ────────────────────────────────────────────────────
  { source_id: 'preseason2026-tottenham-aucklandfc-auckland',    domicile: 'Tottenham Hotspur',    exterieur: 'Auckland FC',               stade: 'Eden Park',             date: '2026-07-26' },

  // ── AUSTRALIE — Sydney Super Cup 2026 ───────────────────────────────────
  { source_id: 'preseason2026-chelsea-wsw-sydney',               domicile: 'Chelsea',              exterieur: 'Western Sydney Wanderers',  stade: 'ANZ Stadium',           date: '2026-07-28' },
  { source_id: 'preseason2026-tottenham-sydneyfc-sydney',        domicile: 'Tottenham Hotspur',    exterieur: 'Sydney FC',                 stade: 'Allianz Stadium',       date: '2026-07-29' },
  { source_id: 'preseason2026-chelsea-tottenham-sydney-finale',  domicile: 'Chelsea',              exterieur: 'Tottenham Hotspur',          stade: 'ANZ Stadium',           date: '2026-08-01', note: 'Finale Sydney Super Cup 2026' },

  // ── AUSTRALIE — Perth ───────────────────────────────────────────────────
  { source_id: 'preseason2026-inter-milan-perth',                domicile: 'Inter Milan',          exterieur: 'AC Milan',                  stade: 'Optus Stadium',         date: '2026-08-05' },
  { source_id: 'preseason2026-inter-juventus-perth',             domicile: 'Inter Milan',          exterieur: 'Juventus Turin',            stade: 'Optus Stadium',         date: '2026-08-08' },

  // ── HONG KONG ───────────────────────────────────────────────────────────
  { source_id: 'preseason2026-mancity-inter-hongkong',           domicile: 'Manchester City',      exterieur: 'Inter Milan',               stade: 'Kai Tak Sports Park',   date: '2026-08-01' },
  { source_id: 'preseason2026-chelsea-juventus-hongkong',        domicile: 'Chelsea',              exterieur: 'Juventus Turin',            stade: 'Kai Tak Sports Park',   date: '2026-08-05' },

  // ── CORÉE DU SUD ────────────────────────────────────────────────────────
  { source_id: 'preseason2026-jeju-bayern-jeju',                 domicile: 'Jeju SK FC',           exterieur: 'Bayern Munich',             stade: 'Jeju World Cup Stadium', date: '2026-08-04' },

  // ── INDONÉSIE ───────────────────────────────────────────────────────────
  { source_id: 'preseason2026-chelsea-milan-jakarta',            domicile: 'Chelsea',              exterieur: 'AC Milan',                  stade: 'Gelora Bung Karno Stadium', date: '2026-08-08' },
]

export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const m of MATCHS) {
      const titre = `⚽ ${m.domicile} vs ${m.exterieur}`

      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source', 'preseason2026')
        .eq('source_id', m.source_id)
        .maybeSingle()

      if (existing) {
        skipped++
        results.push({ titre, statut: 'ignoré', raison: 'déjà importé' })
        continue
      }

      const stadeData = STADES[m.stade]
      if (!stadeData) {
        skipped++
        results.push({ titre, statut: 'ignoré', raison: 'stade inconnu' })
        continue
      }

      const description = `Match amical de pré-saison 2026/27 · ${m.domicile} vs ${m.exterieur} · ${m.stade}, ${stadeData.ville}${m.note ? ' · ' + m.note : ''}`

      const { error } = await supabase.from('evenements').insert([{
        titre,
        lieu: `${m.stade}, ${stadeData.ville}`,
        ville: stadeData.ville,
        pays: stadeData.pays,
        latitude: stadeData.latitude,
        longitude: stadeData.longitude,
        date: m.date,
        date_debut: m.date,
        description,
        categorie: 'Sport',
        acces: 'public',
        prix: 'payant',
        statut: 'publié',
        source: 'preseason2026',
        source_id: m.source_id,
        lien: 'https://en.billet-de-match.com',
      }])

      if (error) {
        skipped++
        results.push({ titre, statut: 'erreur', raison: error.message })
      } else {
        imported++
        results.push({ titre, statut: 'importé' })
      }
    }

    return NextResponse.json({
      success: true,
      total: MATCHS.length,
      imported,
      skipped,
      note: 'Matchs amicaux pré-saison 2026/27 — clubs européens en tournée internationale',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
