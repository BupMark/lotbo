import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import EvenementClient from './EvenementClient'

// ── Image de fallback générique LOTBO ─────────────────────────────────────────
const FALLBACK_IMAGE = 'https://lotbo.app/og-default.png'

// ── Mapping catégorie → query Unsplash ────────────────────────────────────────
const CATEGORIE_QUERIES: Record<string, string> = {
  'Concert / Spectacle':          'concert music live',
  'Festival':                     'festival crowd celebration',
  'Conférence / Sommet':          'conference business meeting',
  'Foire / Exposition':           'exhibition fair expo',
  'Tournoi / Compétition':        'sports competition tournament',
  'Inauguration / Lancement':     'launch event celebration',
  'Assemblée / Réunion':          'meeting assembly community',
  'Formation / Séminaire':        'seminar training workshop',
  'Célébration communautaire':    'community celebration culture',
  'Culte / Cérémonie religieuse': 'ceremony church spiritual',
  'Droit / Juridique':            'law justice legal',
  'Loisir':                       'leisure fun activity',
}

// ── Récupérer une image Unsplash côté serveur ─────────────────────────────────
async function getUnsplashImage(categorie: string, titre: string): Promise<string | null> {
  try {
    const query = CATEGORIE_QUERIES[categorie] || titre.slice(0, 40)
    const res   = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
      {
        headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
        next: { revalidate: 3600 }, // cache 1h — même image pour le même événement
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.urls?.regular || null
  } catch {
    return null
  }
}

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: ev } = await supabase
    .from('evenements')
    .select('titre, lieu, date, description, image_url, categorie, ville, pays')
    .eq('id', id)
    .eq('statut', 'approuve')
    .single()

  const titre      = ev?.titre       || 'Événement sur Lotbo'
  const lieu       = ev?.lieu        || ev?.ville || ''
  const date       = ev?.date        || ''
  const categorie  = ev?.categorie   || ''
  const description = ev?.description
    ? ev.description.slice(0, 160)
    : `${lieu ? lieu : ''}${date ? ' · ' + date : ''} · Découvre cet événement sur Lotbo`

  const url = `https://app.lotbo.app/evenement/${id}`

  // ── Résolution de l'image OG ──────────────────────────────────────────────
  // Priorité : image_url de l'événement > Unsplash > fallback LOTBO
  let ogImage = FALLBACK_IMAGE

  if (ev?.image_url) {
    ogImage = ev.image_url
  } else if (ev) {
    const unsplashUrl = await getUnsplashImage(categorie, titre)
    if (unsplashUrl) ogImage = unsplashUrl
  }

  // ── Titre enrichi pour le partage ─────────────────────────────────────────
  const titreOG      = titre
  const descriptionOG = description
    ? description.slice(0, 160)
    : `${lieu ? lieu : ''}${date ? ' · ' + date : ''} · Découvre cet événement sur Lotbo`

  return {
    title: `${titre} · Lotbo`,
    description,
    openGraph: {
      title:       titreOG,
      description: descriptionOG,
      url,
      siteName:    'Lotbo',
      type:        'article',
      images: [
        {
          url:    ogImage,
          width:  1200,
          height: 630,
          alt:    titre,
        },
      ],
    },
    twitter: {
      card:        'summary_large_image',
      title:       titreOG,
      description: descriptionOG,
      images:      [ogImage],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EvenementClient />
}