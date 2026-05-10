import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('evenements')
    .select('lieu, longitude')
    .eq('statut', 'approuve')

  const total = data?.length || 0

  const villes = new Set(
    data?.map(e => e.lieu?.split(',').pop()?.trim()).filter(Boolean)
  ).size

  const pays = new Set(
    data?.map(e => {
      const lng = e.longitude
      if (!lng) return null
      if (lng < -30) return 'Amériques'
      if (lng < 60) return 'Europe/Afrique'
      return 'Asie/Pacifique'
    }).filter(Boolean)
  ).size

  return NextResponse.json({ total, villes, pays })
}