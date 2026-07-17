import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ predictions: [] })

  // ── Tentative 1 : Google Places Autocomplete ──────────────────────────────
  const key = process.env.GOOGLE_PLACES_KEY
  if (key) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${key}&language=fr&types=geocode|establishment`
      const res  = await fetch(url)
      const data = await res.json()
      if (data.predictions && data.predictions.length > 0) {
        return NextResponse.json(data)
      }
    } catch {
      // Google a échoué → fallback OSM
    }
  }

  // ── Fallback : OSM Nominatim ──────────────────────────────────────────────
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`
    const nomRes  = await fetch(nomUrl, {
      headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app; hello@lotbo.app)' },
    })
    const nomData = await nomRes.json()

    // Convertir format Nominatim → format Google Places (predictions[])
    const predictions = (nomData as Array<{
      place_id: number
      display_name: string
      name?: string
      lon: string
      lat: string
    }>).map(item => ({
      place_id:              String(item.place_id),
      description:           item.display_name,
      structured_formatting: {
        main_text:      item.name || item.display_name.split(',')[0],
        secondary_text: item.display_name.split(',').slice(1).join(',').trim(),
      },
      // Coordonnées embarquées pour éviter un 2e appel places-details
      _osm_lat: item.lat,
      _osm_lon: item.lon,
    }))

    return NextResponse.json({ predictions, source: 'osm' })
  } catch {
    return NextResponse.json({ predictions: [] })
  }
}
