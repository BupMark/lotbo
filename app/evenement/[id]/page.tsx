import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import EvenementClient from './EvenementClient'

// ── OG image : priorité absolue à la photo du contributeur/organisateur.
// Si absente, on ne force AUCUNE image ici — Next.js bascule automatiquement
// sur le fichier de convention opengraph-image.tsx (carte brandée avec
// titre/lieu/date en overlay), plutôt qu'une photo Unsplash générique sans
// rapport avec l'événement réel.

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
      // Pas de "images" ici si aucune photo réelle n'existe — opengraph-image.tsx
      // prend le relais automatiquement dans ce cas (voir commentaire en tête de fichier)
      ...(ev?.image_url ? {
        images: [{ url: ev.image_url, width: 1200, height: 630, alt: titre }],
      } : {}),
    },
    twitter: {
      card:        'summary_large_image',
      title:       titreOG,
      description: descriptionOG,
      ...(ev?.image_url ? { images: [ev.image_url] } : {}),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EvenementClient />
}