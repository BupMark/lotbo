import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat et lng requis' }, { status: 400 })
  }

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const geoRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place`)
    const geoData = await geoRes.json()
    const villeFeature = geoData.features?.find((f: { place_type: string[] }) => f.place_type.includes('place'))
    const ville = villeFeature?.text || null

    if (!ville) {
      return NextResponse.json({ ville: null, evenements_locaux: 0 })
    }

    const admin = makeAdminClient()
    const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0)
    const finJour = new Date(); finJour.setHours(23, 59, 59, 999)

    const { count } = await admin
      .from('evenements')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'approuve')
      .ilike('ville', ville)
      .gte('date_debut', debutJour.toISOString())
      .lte('date_debut', finJour.toISOString())

    return NextResponse.json({ ville, evenements_locaux: count || 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
