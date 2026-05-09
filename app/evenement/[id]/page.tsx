import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import EvenementClient from './EvenementClient'

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
    .select('titre, lieu, date, description')
    .eq('id', id)
    .eq('statut', 'approuve')
    .single()

  const titre = ev?.titre || 'Événement sur Lotbo'
  const description = ev?.description
    ? ev.description.slice(0, 160)
    : `${ev?.lieu || ''} · ${ev?.date || ''} · Découvre cet événement sur Lotbo`
  const url = `https://app.lotbo.app/evenement/${id}`

  return {
    title: `${titre} · Lotbo`,
    description,
    openGraph: {
      title: titre,
      description,
      url,
      siteName: 'Lotbo',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: titre,
      description,
    },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EvenementClient />
}