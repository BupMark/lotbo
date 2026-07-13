import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data, error } = await admin
      .from('enqueteurs')
      .select('nom_affichage, ville, fiches_total, photo_url')
      .eq('statut', 'actif')
      .eq('fiche_masquee', false)
      .not('nom_affichage', 'is', null)
      .order('fiches_total', { ascending: false })
      .limit(500)

    if (error) throw error

    return NextResponse.json(
      { enqueteurs: data || [] },
      { headers: { 'Access-Control-Allow-Origin': 'https://lotbo.app', 'Cache-Control': 'public, max-age=300' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500, headers: { 'Access-Control-Allow-Origin': 'https://lotbo.app' } })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://lotbo.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
