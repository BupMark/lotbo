import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Top villes
  const { data: evs } = await supabase
    .from('evenements')
    .select('ville, pays')
    .eq('statut', 'approuve')
    .not('ville', 'is', null)

  const villesCount: Record<string, number> = {}
  evs?.forEach(e => {
    if (e.ville) villesCount[e.ville] = (villesCount[e.ville] || 0) + 1
  })
  const topVilles = Object.entries(villesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ville, count]) => ({ ville, count }))

  // Top catégories
  const { data: cats } = await supabase
    .from('evenements')
    .select('categorie')
    .eq('statut', 'approuve')
    .not('categorie', 'is', null)

  const catsCount: Record<string, number> = {}
  cats?.forEach(e => {
    if (e.categorie) catsCount[e.categorie] = (catsCount[e.categorie] || 0) + 1
  })
  const topCategories = Object.entries(catsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categorie, count]) => ({ categorie, count }))

  return NextResponse.json({ topVilles, topCategories }, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
