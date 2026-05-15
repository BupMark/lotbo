import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ predictions: [] })

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${key}&language=fr&types=geocode|establishment`

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
