import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CATEGORIE_QUERIES: Record<string, string> = {
  'Concert / Spectacle':          'concert music live',
  'Festival':                     'festival crowd celebration',
  'Conférence / Sommet':          'conference business meeting',
  'Foire / Exposition':           'exhibition fair expo',
  'Tournoi / Compétition':        'sports competition tournament',
  'Inauguration / Lancement':     'launch event celebration',
  'Assemblée / Réunion':          'meeting assembly community',
  'Formation / Séminaire':        'seminar training workshop',
  'Célébration communautaire':    'community celebration culture',
  'Culte / Cérémonie religieuse': 'ceremony church spiritual',
  'Droit / Juridique':            'law justice legal',
  'Loisir':                       'leisure fun activity',
}

interface UnsplashPhoto {
  url: string
  thumb: string
  author: string
  authorLink: string
}

export async function GET(request: NextRequest) {
  const q         = request.nextUrl.searchParams.get('q')         || 'event'
  const categorie = request.nextUrl.searchParams.get('categorie') || ''
  const count     = Math.min(parseInt(request.nextUrl.searchParams.get('count') || '3'), 6)

  const searchQuery = CATEGORIE_QUERIES[categorie] || q

  try {
    // Unsplash /photos/random supporte count=1..30
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high&count=${count}`,
      {
        headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
        next: { revalidate: 0 }, // toujours fresh
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash error', photos: [] }, { status: 500 })
    }

    const data = await res.json()

    // Quand count=1 Unsplash retourne un objet, pas un tableau
    const items: UnsplashPhoto[] = (Array.isArray(data) ? data : [data]).map((item: {
      urls?: { regular?: string; thumb?: string }
      user?: { name?: string; links?: { html?: string } }
    }) => ({
      url:        item.urls?.regular   || '',
      thumb:      item.urls?.thumb     || '',
      author:     item.user?.name      || '',
      authorLink: item.user?.links?.html || '',
    }))

    return NextResponse.json({ photos: items }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })

  } catch {
    return NextResponse.json({ error: 'Fetch failed', photos: [] }, { status: 500 })
  }
}