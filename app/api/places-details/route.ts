import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const place_id = request.nextUrl.searchParams.get('place_id')
  if (!place_id) return NextResponse.json({ error: 'place_id requis' })

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,formatted_address,address_components&key=${key}&language=fr`

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
