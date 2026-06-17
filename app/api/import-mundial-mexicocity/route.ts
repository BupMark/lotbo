// SC-MUNDIAL-FIFA-2 S5 — Eventos alrededor de la Copa del Mundo 2026 · Ciudad de Mexico
// ⚠️ FORMULACION: "Eventos en la Ciudad de Mexico durante el periodo FIFA World Cup 2026"
//    Los partidos ya estan importados — este archivo cubre UNICAMENTE los eventos alrededor
//
// Arquitectura: datos curados (fuentes verificadas: mexicocityfwc26.com.mx,
//   auditorionacional.com.mx, mna.inah.gob.mx, museopalaciodebellasartes.gob.mx)
// Periodo cubierto: 11 junio -> 19 julio 2026 (39 dias completos — partido inaugural + 5 partidos)
// Actualizacion: 31 mayo 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordenadas GPS nivel edificio — Ciudad de Mexico, Mexico
const LIEUX_CDMX: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  'Zocalo — Plaza de la Constitucion':  { latitude: 19.4326, longitude: -99.1332, adresse: 'Plaza de la Constitucion, Centro Historico', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Estadio Azteca (Ciudad de Mexico Stadium)': { latitude: 19.3029, longitude: -99.1505, adresse: 'Calzada de Tlalpan 3465', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Auditorio Nacional':                 { latitude: 19.4327, longitude: -99.2000, adresse: 'Paseo de la Reforma 50, Bosque de Chapultepec', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Museo Nacional de Antropologia':     { latitude: 19.4260, longitude: -99.1864, adresse: 'Av. Paseo de la Reforma s/n, Bosque de Chapultepec', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Paseo de la Reforma':                { latitude: 19.4270, longitude: -99.1760, adresse: 'Paseo de la Reforma', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Bosque de Chapultepec':              { latitude: 19.4204, longitude: -99.1963, adresse: 'Bosque de Chapultepec', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Palacio de Bellas Artes':            { latitude: 19.4353, longitude: -99.1412, adresse: 'Av. Juarez s/n, Centro Historico', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Xochimilco — Canales':              { latitude: 19.2571, longitude: -99.1043, adresse: 'Embarcadero Belem de las Flores, Xochimilco', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Mercado de La Merced':              { latitude: 19.4254, longitude: -99.1254, adresse: 'Calle Rosario 136, Centro Historico', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Arena Ciudad de Mexico':             { latitude: 19.4011, longitude: -99.1426, adresse: 'Av. de las Granjas 695, Azcapotzalco', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Museo Soumaya':                      { latitude: 19.4407, longitude: -99.2062, adresse: 'Blvd. Miguel de Cervantes Saavedra 303', ville: 'Ciudad de Mexico', pays: 'Mexico' },
  'Parque Lincoln — Polanco':           { latitude: 19.4346, longitude: -99.1945, adresse: 'Av. Emilio Castelar, Polanco', ville: 'Ciudad de Mexico', pays: 'Mexico' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_CDMX
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS VERIFICADOS — CIUDAD DE MEXICO · FIFA WORLD CUP 2026 PERIOD
// Fuentes: mexicocityfwc26.com.mx · auditorionacional.com.mx
//          mna.inah.gob.mx · museopalaciodebellasartes.gob.mx
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_CDMX_MUNDIAL: EvenementMundial[] = [

  // ── FAN FESTIVAL OFICIAL ──────────────────────────────────────────────────

  {
    source_id: 'mundial2026-cdmx-zocalo-fan-festival',
    titre: 'FIFA Fan Festival™ Ciudad de Mexico — Zocalo (39 dias · pantalla LED mas grande del mundo)',
    description: 'El Zocalo, la plaza mas emblematica de Mexico y una de las mas grandes del mundo, acoge el FIFA Fan Festival durante los 39 dias del torneo. Pantalla LED de 510 metros cuadrados — la mas grande entre todas las ciudades sede del Mundial. Transmision en vivo de los 104 partidos. Conciertos, gastronomia mexicana, zonas culturales y actividades familiares. Acceso gratuito sin venta de alcohol. Hasta 60 000 asistentes por jornada — estimacion de 2.2 millones en total. 11 junio – 19 julio 2026.',
    lieu_key: 'Zocalo — Plaza de la Constitucion',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://mexicocityfwc26.com.mx',
  },

  // ── CONCIERTOS ────────────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-cdmx-concierto-mexico-vibra-alejandro',
    titre: 'Mexico Vibra — Alejandro Fernandez y Carin Leon · Auditorio Nacional',
    description: 'Concierto inaugural del proyecto Mexico Vibra, antesala oficial del Mundial 2026 en la capital. Alejandro Fernandez y Carin Leon encabezan la noche junto a Emmanuel, Mijares, Lucero, Banda El Recodo, Carla Morrison y Timbiriche. El evento mas esperado del pre-Mundial en la Ciudad de Mexico. 9 junio 2026.',
    lieu_key: 'Auditorio Nacional',
    date_debut: '2026-06-09T20:00:00',
    date_fin: '2026-06-09T23:59:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.auditorionacional.com.mx',
  },
  {
    source_id: 'mundial2026-cdmx-concierto-mexico-vibra-dia2',
    titre: 'Mexico Vibra — Noche 2 · Auditorio Nacional (pre-Mundial CDMX)',
    description: 'Segunda noche del proyecto Mexico Vibra en el Auditorio Nacional, vispera del partido inaugural Mexico vs. Sudafrica en el Estadio Azteca. Artistas del cartel original con actuaciones sorpresa. El ambiente mundialista llega a su punto mas alto en la CDMX. 10 junio 2026.',
    lieu_key: 'Auditorio Nacional',
    date_debut: '2026-06-10T20:00:00',
    date_fin: '2026-06-11T00:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.auditorionacional.com.mx',
  },

  // ── CULTURA & MUSEOS ──────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-cdmx-corredor-cultural-museos',
    titre: 'Corredor Cultural Mundial 2026 — 17 Museos de la CDMX',
    description: 'Mas de una docena de museos capitalinos participan con exposiciones y actividades especiales durante el Mundial: Museo Nacional de Antropologia, MUAC (UNAM), Museo Memoria y Tolerancia, Museo Franz Mayer, Museo Universum, Papalote Museo del Nino, Museo Jumex, Museo Tamayo, Museo Dolores Olmedo y Museo Yancuic. 19 exposiciones en 17 recintos. Algunas entradas gratuitas. 11 junio – 19 julio 2026.',
    lieu_key: 'Museo Nacional de Antropologia',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-19T18:00:00',
    categorie: 'Foire/Exposition',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.mna.inah.gob.mx',
  },
  {
    source_id: 'mundial2026-cdmx-reforma-album-mundial',
    titre: 'Album del Mundial 2026 — Estampas Gigantes en Paseo de la Reforma',
    description: 'El Paseo de la Reforma, la avenida mas iconica de Mexico, se transforma con estampas gigantes del Album oficial del Mundial 2026. Una exposicion urbana y gratuita a lo largo del bulevar historico que recorre desde el Bosque de Chapultepec hasta el Centro Historico. Fotografia ideal para visitantes internacionales.',
    lieu_key: 'Paseo de la Reforma',
    date_debut: '2026-06-11T00:00:00',
    date_fin: '2026-07-19T23:59:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://mexicocityfwc26.com.mx',
  },

  // ── PARQUES & ESPACIOS PUBLICOS ────────────────────────────────────────────

  {
    source_id: 'mundial2026-cdmx-chapultepec-verano',
    titre: 'Bosque de Chapultepec — Temporada de Verano y Mundial 2026',
    description: 'El pulmon verde mas grande de la Ciudad de Mexico programa actividades de verano durante el Mundial: zoologico, museos (Castillo de Chapultepec, Museo de Arte Moderno), lagos, deportes y espacios de recreacion familiar. Chapultepec recibe a los aficionados internacionales con lo mejor de Mexico al aire libre. Gratuito para zonas publicas.',
    lieu_key: 'Bosque de Chapultepec',
    date_debut: '2026-06-11T06:00:00',
    date_fin: '2026-07-19T20:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.chapultepec.cdmx.gob.mx',
  },
  {
    source_id: 'mundial2026-cdmx-xochimilco-trajineras',
    titre: 'Xochimilco — Trajineras y Festividad Mundial',
    description: 'Los canales de Xochimilco, Patrimonio de la Humanidad UNESCO, se animan durante el Mundial con recorridos en trajinera, musica de mariachi, gastronomia local y celebraciones futboleras. Una experiencia tipicamente mexicana que los visitantes internacionales de la Copa del Mundo podran disfrutar a 30 minutos del centro. Precio segun duracion del recorrido.',
    lieu_key: 'Xochimilco — Canales',
    date_debut: '2026-06-11T09:00:00',
    date_fin: '2026-07-19T20:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://xochimilco.cdmx.gob.mx',
  },
  {
    source_id: 'mundial2026-cdmx-bellas-artes-verano',
    titre: 'Palacio de Bellas Artes — Temporada Cultural Verano 2026',
    description: 'El Palacio de Bellas Artes, el recinto cultural mas importante de Mexico, programa su temporada de verano durante el Mundial: opera, ballet folklorico, exposiciones y conciertos sinfonicos. Un contraste magnifico entre la alta cultura y la fiebre del futbol en el Centro Historico de CDMX.',
    lieu_key: 'Palacio de Bellas Artes',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://museopalaciodebellasartes.gob.mx',
  },
  {
    source_id: 'mundial2026-cdmx-festivales-alcaldias',
    titre: 'Festivales Futboleros — 16 Alcaldias de la CDMX',
    description: 'Las 16 alcaldias de la Ciudad de Mexico (Gustavo A. Madero, Iztapalapa, Cuauhtemoc, Xochimilco, etc.) cuentan con espacios de transmision de partidos y actividades culturales durante el Mundial. Festivales comunitarios gratuitos repartidos por toda la ciudad para que nadie se quede sin vivir la Copa del Mundo. Alcaldias con transmision de partidos de la Seleccion Mexicana, semifinales y final.',
    lieu_key: 'Zocalo — Plaza de la Constitucion',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://mexicocityfwc26.com.mx',
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
    for (const evt of EVENEMENTS_CDMX_MUNDIAL) {
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

      const lieuData = LIEUX_CDMX[evt.lieu_key]
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
      ville: 'Ciudad de Mexico',
      total: EVENEMENTS_CDMX_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 junio – 19 julio 2026 (39 dias completos — partido inaugural + 5 partidos)',
      note: 'Eventos alrededor de la Copa del Mundo — no los partidos en si mismos',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
