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

  // Top organisateurs
  const { data: orgs } = await supabase
    .from('evenements')
    .select('organisateur')
    .eq('statut', 'approuve')
    .not('organisateur', 'is', null)

  const orgsCount: Record<string, number> = {}
  orgs?.forEach(e => {
    if (e.organisateur) orgsCount[e.organisateur] = (orgsCount[e.organisateur] || 0) + 1
  })
  const topOrganisateurs = Object.entries(orgsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([organisateur, count]) => ({ organisateur, count }))

  return NextResponse.json({ topVilles, topOrganisateurs }, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
