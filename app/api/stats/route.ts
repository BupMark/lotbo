import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('evenements')
    .select('lieu, longitude, latitude')
    .eq('statut', 'approuve')

  const total = data?.length || 0

  const villes = new Set(
    data?.map(e => e.lieu?.split(',').pop()?.trim()).filter(Boolean)
  ).size

  // Compter les pays via les coordonnées GPS
  const pays = new Set(
    data?.map(e => {
      const lng = parseFloat(e.longitude)
      const lat = parseFloat(e.latitude)
      if (isNaN(lng) || isNaN(lat)) return null
      // Approximation par zones géographiques
      if (lng >= -180 && lng <= -130) return 'Alaska/Pacifique'
      if (lng >= -130 && lng <= -110 && lat >= 45) return 'Canada Ouest'
      if (lng >= -110 && lng <= -85 && lat >= 45) return 'Canada Centre'
      if (lng >= -85 && lng <= -60 && lat >= 45) return 'Canada Est'
      if (lng >= -125 && lng <= -110 && lat < 45) return 'USA Ouest'
      if (lng >= -110 && lng <= -95 && lat < 45) return 'USA Centre'
      if (lng >= -95 && lng <= -75 && lat < 45) return 'USA Est'
      if (lng >= -75 && lng <= -60 && lat < 45) return 'USA NE'
      if (lng >= -120 && lng <= -55 && lat < 25) return 'Mexique'
      if (lng >= -90 && lng <= -55 && lat >= 10 && lat < 25) return 'Caraïbes/Amérique centrale'
      if (lng >= -80 && lng <= -34 && lat >= -60 && lat < 10) return 'Amérique du Sud'
      if (lng >= -30 && lng <= 40 && lat >= 35) return 'Europe'
      if (lng >= -20 && lng <= 60 && lat >= -5 && lat < 35) return 'Afrique du Nord/Moyen-Orient'
      if (lng >= -20 && lng <= 55 && lat < -5) return 'Afrique subsaharienne'
      if (lng >= 60 && lng <= 150 && lat >= 0) return 'Asie'
      if (lng >= 100 && lng <= 180 && lat < 0) return 'Océanie'
      return 'Autre'
    }).filter(Boolean)
  ).size

  return NextResponse.json({ total, villes, pays })
}