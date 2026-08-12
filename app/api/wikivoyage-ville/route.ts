import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const ville = url.searchParams.get('ville')

  if (!ville) {
    return NextResponse.json({ error: 'Paramètre ville manquant' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(ville)}`,
      { headers: { 'User-Agent': 'LOTBO/1.0 (hello@lotbo.app)' } }
    )

    if (!res.ok) {
      return NextResponse.json({ trouve: false })
    }

    const data = await res.json()

    return NextResponse.json({
      trouve: true,
      titre: data.title || ville,
      extrait: data.extract || null,
      image_url: data.thumbnail?.source || null,
      lien: data.content_urls?.desktop?.page || null,
    })
  } catch (e) {
    console.error('[WikivoyageVille] Échec', e)
    return NextResponse.json({ trouve: false })
  }
}
