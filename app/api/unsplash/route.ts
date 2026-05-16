import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CATEGORIE_QUERIES: Record<string, string> = {
  'Concert / Spectacle': 'concert music live',
  'Festival': 'festival crowd celebration',
  'Conférence / Sommet': 'conference business meeting',
  'Foire / Exposition': 'exhibition fair expo',
  'Tournoi / Compétition': 'sports competition tournament',
  'Inauguration / Lancement': 'launch event celebration',
  'Assemblée / Réunion': 'meeting assembly community',
  'Formation / Séminaire': 'seminar training workshop',
  'Célébration communautaire': 'community celebration culture',
  'Culte / Cérémonie religieuse': 'ceremony church spiritual',
  'Droit / Juridique': 'law justice legal',
  'Loisir': 'leisure fun activity',
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || 'event'
  const categorie = request.nextUrl.searchParams.get('categorie') || ''

  const searchQuery = CATEGORIE_QUERIES[categorie] || query

  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high`,
    {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      }
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Unsplash error' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({
    url: data.urls?.regular || null,
    thumb: data.urls?.thumb || null,
    author: data.user?.name || null,
    authorLink: data.user?.links?.html || null,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}
