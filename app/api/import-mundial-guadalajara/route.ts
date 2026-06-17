// SC-MUNDIAL-FIFA-2 S5 — Eventos alrededor de la Copa del Mundo 2026 · Guadalajara, Mexico
// ⚠️ FORMULACION: "Eventos en Guadalajara durante el periodo FIFA World Cup 2026"
//    Los partidos ya estan importados — este archivo cubre UNICAMENTE los eventos alrededor
//
// Arquitectura: datos curados (fuentes verificadas: guadalajarafwc26.com,
//   visita.guadalajara.gob.mx, teatrodegollado.com, mercadosanjuandedios.mx)
// Periodo cubierto: 11 junio -> 5 julio 2026 (5 partidos Estadio Akron)
// Actualizacion: 31 mayo 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordenadas GPS nivel edificio — Guadalajara, Jalisco, Mexico
const LIEUX_GDL: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Estadio Akron — Guadalajara':         { latitude: 20.6817, longitude: -103.4642, adresse: 'Av. de las Rosas 3476, Zapopan', ville: 'Guadalajara', pays: 'Mexico' },
  'Centro Historico Guadalajara':        { latitude: 20.6597, longitude: -103.3496, adresse: 'Plaza de la Liberacion', ville: 'Guadalajara', pays: 'Mexico' },
  'Plaza Pedro Loza — Fan Festival':     { latitude: 20.6723, longitude: -103.3476, adresse: 'C. Pedro Loza 27A, Zona Centro', ville: 'Guadalajara', pays: 'Mexico' },
  'Mercado San Juan de Dios':            { latitude: 20.6598, longitude: -103.3383, adresse: 'Calz. Independencia Sur 46', ville: 'Guadalajara', pays: 'Mexico' },
  'Tlaquepaque — Artesanias':            { latitude: 20.6411, longitude: -103.3127, adresse: 'Independencia 56, San Pedro Tlaquepaque', ville: 'Tlaquepaque', pays: 'Mexico' },
  'Tonala — Mercado de Artesanias':      { latitude: 20.6250, longitude: -103.2361, adresse: 'Av. Tonaltecas 140', ville: 'Tonala', pays: 'Mexico' },
  'Guadalajara Centro — Teatro Degollado': { latitude: 20.6591, longitude: -103.3451, adresse: 'Degollado s/n', ville: 'Guadalajara', pays: 'Mexico' },
  'Parque Metropolitano Guadalajara':    { latitude: 20.7043, longitude: -103.4139, adresse: 'Av. Valle de los Arcos 2000, Zapopan', ville: 'Guadalajara', pays: 'Mexico' },
  'Tlajomulco — Fan Zone':              { latitude: 20.4730, longitude: -103.4440, adresse: 'Plaza Principal, Tlajomulco de Zuniga', ville: 'Tlajomulco de Zuniga', pays: 'Mexico' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_GDL
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS VERIFICADOS — GUADALAJARA · FIFA WORLD CUP 2026 PERIOD
// Fuentes: guadalajarafwc26.com · visita.guadalajara.gob.mx
//          teatrodegollado.com · mercadosanjuandedios.mx · tlaquepaque.gob.mx
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_GDL_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFICIAL ──────────────────────────────────────────────────

  {
    source_id: 'mundial2026-gdl-plaza-pedro-loza-fan-festival',
    titre: 'FIFA Fan Festival™ Guadalajara — Plaza Pedro Loza, Zona Centro',
    description: 'Festival oficial de la FIFA en el corazon del Centro Historico de Guadalajara. Transmisiones de partidos, musica en vivo con mariachi y musica regional jaliscience, gastronomia tipica y actividades culturales. La ciudad natal del mariachi recibe al mundo con su sonido mas autentico. Acceso gratuito.',
    lieu_key: 'Plaza Pedro Loza — Fan Festival',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.guadalajarafwc26.com',
  },

  // ── CENTRO HISTORICO & BARRIOS ─────────────────────────────────────────────

  {
    source_id: 'mundial2026-gdl-centro-historico-worldcup',
    titre: 'Centro Historico de Guadalajara — Viviendo el Mundial',
    description: 'El Centro Historico de Guadalajara — con su Catedral, el Palacio de Gobierno, la Plaza de la Liberacion y el Teatro Degollado — programa actividades especiales durante el Mundial. Watch parties al aire libre, performances de mariachi, gastronomia tapatia y la arquitectura colonial mas hermosa de Mexico como escenario.',
    lieu_key: 'Centro Historico Guadalajara',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-05T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://visita.guadalajara.gob.mx',
  },
  {
    source_id: 'mundial2026-gdl-tlaquepaque-artesanias',
    titre: 'San Pedro Tlaquepaque — Artesanias y Ambiente Mundial',
    description: 'Tlaquepaque, el pueblo magico de artesanias y galerias de arte a 10 minutos de Guadalajara, se anima durante el Mundial con exposiciones de arte popular mexicano, watch parties en sus cantinas y restaurantes con mariachi en vivo. El lugar mas pintoresco del Area Metropolitana de Guadalajara.',
    lieu_key: 'Tlaquepaque — Artesanias',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.tlaquepaque.gob.mx',
  },

  // ── MERCADOS & GASTRONOMIA ────────────────────────────────────────────────

  {
    source_id: 'mundial2026-gdl-mercado-san-juan-worldcup',
    titre: 'Mercado San Juan de Dios — Gastronomia y Mundial 2026',
    description: 'El mercado cubierto mas grande de America Latina, con 3 niveles y mas de 3 000 locales, vibra durante el Mundial con gastronomia jalisciense, productos artesanales y la energia de los aficionados. Birria, tortas ahogadas, tejuino y pozole para alimentar a los fans del mundo entero.',
    lieu_key: 'Mercado San Juan de Dios',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-05T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://mercadosanjuandedios.mx',
  },

  // ── CULTURA ───────────────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-gdl-teatro-degollado-cultura',
    titre: 'Teatro Degollado — Temporada Cultural y Mundial 2026',
    description: 'El Teatro Degollado, joya neoclasica del siglo XIX y sede de la Orquesta Filarmonica de Jalisco, programa su temporada de verano durante el Mundial. Conciertos sinfonicos, ballet y opera en el recinto cultural mas importante de la Perla Tapatia. Una experiencia cultural unica durante la Copa del Mundo.',
    lieu_key: 'Guadalajara Centro — Teatro Degollado',
    date_debut: '2026-06-11T19:00:00',
    date_fin: '2026-07-05T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.teatrodegollado.com',
  },

  // ── PARQUES & DEPORTES ────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-gdl-parque-metropolitano',
    titre: 'Parque Metropolitano de Guadalajara — Fan Zone y Deportes',
    description: 'El parque urbano mas grande de la Region Centro-Occidente de Mexico instala una Fan Zone con pantallas gigantes, actividades deportivas, ciclismo, futbol y espacio familiar durante el Mundial. Acceso gratuito y rutas ciclistas que conectan con el resto de la ciudad.',
    lieu_key: 'Parque Metropolitano Guadalajara',
    date_debut: '2026-06-11T07:00:00',
    date_fin: '2026-07-05T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.parquemetropolitano.org',
  },
  {
    source_id: 'mundial2026-gdl-tonala-mercado-artesanias',
    titre: 'Tonala — Capital del Mueble y Artesanias durante el Mundial',
    description: 'Tonala, la capital mexicana del mueble y las artesanias, recibe a los visitantes internacionales del Mundial con sus miles de talleres, mercados y tiendas de artesanias abiertas. Una experiencia de compras artesanales unica para los turistas de la Copa del Mundo que pasan por Guadalajara.',
    lieu_key: 'Tonala — Mercado de Artesanias',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-05T19:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.tonala.gob.mx',
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
    for (const evt of EVENEMENTS_GDL_MUNDIAL) {
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

      const lieuData = LIEUX_GDL[evt.lieu_key]
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
      ville: 'Guadalajara',
      total: EVENEMENTS_GDL_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 junio – 5 julio 2026 (5 partidos Estadio Akron)',
      note: 'Eventos alrededor de la Copa del Mundo — no los partidos en si mismos',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
