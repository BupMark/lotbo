// SC-MONDIAL-FIFA-2 S5 — Eventos alrededor de la Copa del Mundo 2026 · Monterrey, Mexico
// ⚠️ FORMULACION: "Eventos en Monterrey durante el periodo FIFA World Cup 2026"
//    Los partidos ya estan importados — este archivo cubre UNICAMENTE los eventos alrededor
//
// Arquitectura: datos curados (fuentes verificadas: ticketmaster.com.mx/fifa-fan-festival-monterrey,
//   monterrey.gob.mx, barrioantiguomty.com)
// Nota: Monterrey = lineup de conciertos mas impresionante de TODO el torneo mundial
// Periodo cubierto: 11 junio -> 19 julio 2026 (39 dias — 4 partidos Estadio Monterrey + conciertos)
// Actualizacion: 31 mayo 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordenadas GPS nivel edificio — Monterrey, Nuevo Leon, Mexico
const LIEUX_MTY: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Parque Fundidora — Fan Festival':        { latitude: 25.6716, longitude: -100.2855, adresse: 'Av. Fundidora y Adolfo Prieto S/N, Col. Obrera', ville: 'Monterrey', pays: 'Mexico' },
  'Estadio Monterrey (BBVA)':               { latitude: 25.6694, longitude: -100.3089, adresse: 'Av. Fundidora 315', ville: 'Monterrey', pays: 'Mexico' },
  'Macroplaza — Gran Plaza Monterrey':      { latitude: 25.6701, longitude: -100.3108, adresse: 'Zaragoza s/n, Centro', ville: 'Monterrey', pays: 'Mexico' },
  'Barrio Antiguo Monterrey':               { latitude: 25.6662, longitude: -100.3076, adresse: 'Calle Morelos, Barrio Antiguo', ville: 'Monterrey', pays: 'Mexico' },
  'Paseo Santa Lucia':                      { latitude: 25.6715, longitude: -100.3075, adresse: 'Av. Constitucion 110', ville: 'Monterrey', pays: 'Mexico' },
  'Parque Espana — Monterrey':              { latitude: 25.6611, longitude: -100.3236, adresse: 'Av. Venustiano Carranza', ville: 'Monterrey', pays: 'Mexico' },
  'Plaza Zaragoza — Guadalupe':             { latitude: 25.6788, longitude: -100.2567, adresse: 'Plaza Principal, Guadalupe NL', ville: 'Guadalupe', pays: 'Mexico' },
  'Paseo San Pedro — San Pedro Garza Garcia': { latitude: 25.6571, longitude: -100.3731, adresse: 'Av. Vasconcelos, San Pedro Garza Garcia', ville: 'San Pedro Garza Garcia', pays: 'Mexico' },
  'Cintermex — Centro de Convenciones':     { latitude: 25.6756, longitude: -100.2840, adresse: 'Av. Fundidora 501', ville: 'Monterrey', pays: 'Mexico' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_MTY
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS VERIFICADOS — MONTERREY · FIFA WORLD CUP 2026 PERIOD
// Fuentes: ticketmaster.com.mx/fifa-fan-festival-monterrey · monterrey.gob.mx
//          barrioantiguomty.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_MTY_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFICIAL ──────────────────────────────────────────────────

  {
    source_id: 'mundial2026-mty-fundidora-fan-festival',
    titre: 'FIFA Fan Festival™ Monterrey — Parque Fundidora (39 dias · 21 conciertos)',
    description: 'El Parque Fundidora, construido sobre las antiguas instalaciones de la Fundidora de Fierro y Acero de Monterrey, acoge el FIFA Fan Festival durante los 39 dias del Mundial. Acceso general gratuito. Pantallas gigantes para los 104 partidos, 21 noches de conciertos en vivo (Chayanne, Imagine Dragons, Enrique Iglesias, Grupo Firme y mas), gastronomia regiomontana, zonas interactivas y areas familiares. Con la silueta del Cerro de la Silla de fondo. Mas de 2 millones de visitantes esperados.',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },

  // ── CONCIERTOS — PARQUE FUNDIDORA ─────────────────────────────────────────

  {
    source_id: 'mundial2026-mty-concert-imagine-dragons',
    titre: 'Imagine Dragons — FIFA Fan Festival · Parque Fundidora, Monterrey',
    description: 'Imagine Dragons, uno de los grupos de rock alternativo mas exitosos del mundo con hits como Believer, Thunder y Enemy, se presenta en el FIFA Fan Festival de Monterrey. Zona preferente con costo ($2,950 MXN), acceso general gratuito sujeto a capacidad. Parque Fundidora.',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-06-20T21:00:00',
    date_fin: '2026-06-20T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },
  {
    source_id: 'mundial2026-mty-concert-chayanne',
    titre: 'Chayanne — FIFA Fan Festival · Parque Fundidora, Monterrey',
    description: 'El eterno Chayanne, idolo latinoamericano de varias generaciones, se presenta en el FIFA Fan Festival de Monterrey durante la Copa del Mundo. Una noche de musica latina y romance con el Cerro de la Silla de fondo. Zona preferente ($2,450 MXN), acceso general gratuito sujeto a capacidad.',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-06-27T21:00:00',
    date_fin: '2026-06-27T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },
  {
    source_id: 'mundial2026-mty-concert-enrique-iglesias',
    titre: 'Enrique Iglesias — FIFA Fan Festival · Parque Fundidora, Monterrey',
    description: 'El rey de la musica latina y uno de los artistas mas vendidos de la historia se presenta en Monterrey durante la Copa del Mundo. Enrique Iglesias lleva su King of the Night Tour al FIFA Fan Festival con sus mayores exitos. Zona preferente ($2,450 MXN), general gratuito.',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-07-04T21:00:00',
    date_fin: '2026-07-04T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },
  {
    source_id: 'mundial2026-mty-concert-grupo-firme',
    titre: 'Grupo Firme — FIFA Fan Festival · Parque Fundidora, Monterrey',
    description: 'El grupo de musica regional mexicana mas popular del momento, Grupo Firme, se presenta en el Fan Festival de Monterrey. Norteno, banda y movimiento alterado en la capital del noreste mexicano. Una celebracion de la cultura musical de Mexico durante la Copa del Mundo. Zona preferente ($2,450 MXN).',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-06-14T21:00:00',
    date_fin: '2026-06-14T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },
  {
    source_id: 'mundial2026-mty-concert-genitallica-gran-silencio',
    titre: 'Genitallica + El Gran Silencio — Musica Regia en el Fan Festival',
    description: 'La escena musical de Monterrey en su maximo esplendor: Genitallica y El Gran Silencio, dos de las bandas regias mas queridas, se presentan en el FIFA Fan Festival de Fundidora. Rock en espanol y cumbia electronica ante el publico local e internacional del Mundial.',
    lieu_key: 'Parque Fundidora — Fan Festival',
    date_debut: '2026-06-17T20:00:00',
    date_fin: '2026-06-17T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.ticketmaster.com.mx/fifa-fan-festival-monterrey-boletos/artist/4444364',
  },

  // ── ESPACIOS PUBLICOS & BARRIOS ────────────────────────────────────────────

  {
    source_id: 'mundial2026-mty-macroplaza-fanzone',
    titre: 'Macroplaza — Gran Plaza de Monterrey · Fan Zone y Transmisiones',
    description: 'La Macroplaza de Monterrey, una de las plazas publicas mas grandes del mundo (40 hectareas), instala pantallas y actividades durante el Mundial. Con el Palacio de Gobierno, el Obispado y el Cerro de la Silla como telones de fondo, es el corazon civico de Monterrey durante el torneo.',
    lieu_key: 'Macroplaza — Gran Plaza Monterrey',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.monterrey.gob.mx',
  },
  {
    source_id: 'mundial2026-mty-barrio-antiguo-nightlife',
    titre: 'Barrio Antiguo — Nightlife y Watch Parties durante el Mundial',
    description: 'El Barrio Antiguo de Monterrey, el corazon bohemio y nocturno de la ciudad, programa watch parties en sus bares, cantinas y restaurantes durante todo el Mundial. Calle Morelos llena de vida, musica en vivo, cerveza local y la pasion regia por el futbol en cada rincon.',
    lieu_key: 'Barrio Antiguo Monterrey',
    date_debut: '2026-06-11T18:00:00',
    date_fin: '2026-07-19T03:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://barrioantiguomty.com',
  },
  {
    source_id: 'mundial2026-mty-paseo-santa-lucia-worldcup',
    titre: 'Paseo Santa Lucia — Actividades y Recorridos en Canoa · Mundial 2026',
    description: 'El Paseo Santa Lucia, canal urbano de 2.5 km que conecta la Macroplaza con el Parque Fundidora, se convierte en el recorrido mundialista mas unico de Mexico. Recorridos en canoa, actividades al aire libre, restaurantes y terrazas animadas durante todo el torneo.',
    lieu_key: 'Paseo Santa Lucia',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-19T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.monterrey.gob.mx/paseo-santa-lucia',
  },
  {
    source_id: 'mundial2026-mty-fan-zones-guadalupe-municipios',
    titre: 'Fan Zones Metropolitanas Monterrey — Guadalupe y Municipios',
    description: 'El Estado de Nuevo Leon instala Fan Zones en multiples puntos del Area Metropolitana de Monterrey: Plaza Zaragoza (Guadalupe), Parque del Agua, Parque Rio La Silla, Plaza Principal Guadalupe y Corredor Verde Zaragoza. Todas con acceso gratuito y transmision de partidos en pantalla gigante.',
    lieu_key: 'Plaza Zaragoza — Guadalupe',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.monterrey.gob.mx',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
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
    for (const evt of EVENEMENTS_MTY_MUNDIAL) {
      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source_id', evt.source_id)
        .maybeSingle()

      if (existing) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'déjà importé' })
        continue
      }

      const lieuData = LIEUX_MTY[evt.lieu_key]
      if (!lieuData) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'lieu inconnu' })
        continue
      }

      const { error } = await supabase.from('evenements').insert([{
        titre: evt.titre,
        lieu: evt.lieu_key,
        ville: lieuData.ville,
        pays: lieuData.pays,
        latitude: lieuData.latitude,
        longitude: lieuData.longitude,
        date_debut: evt.date_debut,
        date_fin: evt.date_fin,
        date: evt.date_debut,
        description: evt.description,
        categorie: evt.categorie,
        statut: 'publié',
        source: 'mundial_2026',
        source_id: evt.source_id,
        acces: evt.acces,
        prix: evt.prix,
        lien: evt.lien,
        ...(evt.image_url ? { image_url: evt.image_url } : {}),
      }])

      if (error) {
        skipped++
        results.push({ titre: evt.titre, statut: 'erreur', raison: error.message })
      } else {
        imported++
        results.push({ titre: evt.titre, statut: 'importé' })
      }
    }

    return NextResponse.json({
      success: true,
      ville: 'Monterrey',
      total: EVENEMENTS_MTY_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 junio – 19 julio 2026 (39 dias — 4 partidos + 21 conciertos)',
      note: 'Eventos alrededor de la Copa del Mundo — no los partidos en si mismos',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
