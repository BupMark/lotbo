import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const HEADERS = {
  'User-Agent': 'Lotbo/1.0 (https://lotbo.app; contact@lotbo.app)',
}

interface Attribution {
  auteur: string | null
  licence: string | null
}

interface CommonsPage {
  imageinfo?: {
    extmetadata?: {
      Artist?: { value?: string }
      LicenseShortName?: { value?: string }
    }
  }[]
}

async function recupererAttribution(imageUrl: string): Promise<Attribution> {
  try {
    // Extrait le nom de fichier Commons depuis l'URL du thumbnail
    // (format habituel : .../commons/x/xx/Nom_du_fichier.jpg)
    const match = imageUrl.match(/\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/)
    if (!match) return { auteur: null, licence: null }
    const nomFichier = decodeURIComponent(match[1])

    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + nomFichier)}&prop=imageinfo&iiprop=extmetadata&format=json`,
      { headers: HEADERS }
    )
    const data = await res.json()
    const pages = data.query?.pages || {}
    const page = Object.values(pages)[0] as CommonsPage | undefined
    const meta = page?.imageinfo?.[0]?.extmetadata

    return {
      auteur: meta?.Artist?.value?.replace(/<[^>]+>/g, '') || null,
      licence: meta?.LicenseShortName?.value || null,
    }
  } catch {
    return { auteur: null, licence: null }
  }
}

export async function GET(request: NextRequest) {
  const ville = request.nextUrl.searchParams.get('ville')
  if (!ville) {
    return NextResponse.json({ error: 'Paramètre ville requis' }, { status: 400 })
  }

  // Essaie français d'abord (audience principale), puis anglais en repli
  for (const langue of ['fr', 'en']) {
    try {
      const res = await fetch(
        `https://${langue}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ville)}`,
        { headers: HEADERS, next: { revalidate: 86400 } }
      )
      if (!res.ok) continue

      const data = await res.json()
      const imageUrl = data.originalimage?.source || data.thumbnail?.source
      if (!imageUrl) continue

      const attribution = await recupererAttribution(imageUrl)

      return NextResponse.json({
        trouve: true,
        image_url: imageUrl,
        extrait: data.extract || null,
        page_url: data.content_urls?.desktop?.page || null,
        auteur: attribution.auteur,
        licence: attribution.licence,
      }, {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      })
    } catch {
      continue
    }
  }

  return NextResponse.json({ trouve: false }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
