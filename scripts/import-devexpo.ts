import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY!

const EVENTS = [
  { departement: 'Ouest',      lieu: 'Karibe Convention Center',   ville: 'Pétion-ville, Haïti' },
  { departement: 'Artibonite', lieu: 'Royal Decameron Indigo',     ville: 'Gonaïves, Haïti'     },
  { departement: 'Nord',       lieu: 'Habitation Jouissant',       ville: 'Cap-Haïtien, Haïti'  },
  { departement: 'Nord-Est',   lieu: 'Hotel Imperial',             ville: 'Fort-Liberté, Haïti' },
  { departement: 'Nord-Ouest', lieu: 'Port-de-Paix Beach Hotel',   ville: 'Port-de-Paix, Haïti' },
  { departement: 'Centre',     lieu: 'Le Montcel',                 ville: 'Hinche, Haïti'       },
  { departement: 'Sud',        lieu: 'Auberge du Rayon Vert',      ville: 'Les Cayes, Haïti'    },
  { departement: 'Sud-Est',    lieu: 'Coterelle Breeze',           ville: 'Jacmel, Haïti'       },
  { departement: 'Grand\'Anse',lieu: 'Chez Mémère',                ville: 'Jérémie, Haïti'      },
  { departement: 'Nippes',     lieu: 'Hotel Fort Royal',           ville: 'Miragoâne, Haïti'    },
]

const DESCRIPTION =
  "DevExpo 2026 — L'innovation technologique dans les 10 départements d'Haïti. " +
  'Événement simultané avec diffusion en direct sur Zoom.'

async function geocode(query: string): Promise<{ lat: number; lng: number }> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_KEY}`
  const res  = await fetch(url)
  const data = await res.json()
  if (data.results?.[0]) {
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  }
  // Fallback : centre d'Haïti
  return { lat: 18.9712, lng: -72.2852 }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  let imported = 0
  const errors: { departement: string; error: string }[] = []

  for (const ev of EVENTS) {
    const sourceId = `devexpo-2026-${ev.departement.toLowerCase().replace(/['\s]+/g, '-')}`
    const titre    = `DevExpo 2026 — ${ev.departement}`

    // Idempotence
    const { data: existing } = await supabase
      .from('evenements')
      .select('id')
      .eq('source_id', sourceId)
      .maybeSingle()

    if (existing) {
      console.log(`⏭  Déjà importé : ${titre}`)
      continue
    }

    // Géocodage
    const query = `${ev.lieu}, ${ev.ville}`
    let lat: number, lng: number
    try {
      ;({ lat, lng } = await geocode(query))
      console.log(`📍 ${titre} → ${lat}, ${lng}`)
    } catch (e) {
      console.warn(`⚠️  Géocodage échoué pour ${titre}, fallback utilisé`)
      lat = 18.9712
      lng = -72.2852
    }

    const { error } = await supabase.from('evenements').insert([{
      titre,
      lieu:        ev.lieu,
      ville:       ev.ville.split(',')[0].trim(),
      pays:        'HT',
      date:        '2026-06-06',
      date_debut:  '2026-06-06T08:00:00',
      date_fin:    '2026-06-06T17:00:00',
      heure_debut: '08:00',
      heure_fin:   '17:00',
      description: DESCRIPTION,
      latitude:    lat,
      longitude:   lng,
      categorie:   'Conférence / Sommet',
      lien:        'https://devexpo.ht',
      prix:        'gratuit',
      acces:       'public',
      statut:      'approuve',
      visibilite:  'public',
      source:      'devexpo',
      source_id:   sourceId,
    }])

    if (error) {
      console.error(`❌ ${titre} : ${error.message}`)
      errors.push({ departement: ev.departement, error: error.message })
    } else {
      console.log(`✅ ${titre}`)
      imported++
    }
  }

  console.log('\n── Résultat ──────────────────────')
  console.log(JSON.stringify({ imported, errors }, null, 2))
}

main().catch(err => {
  console.error('Fatal :', err)
  process.exit(1)
})
