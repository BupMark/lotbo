import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const admin = makeAdminClient()

  const { data, error } = await admin
    .from('enqueteurs')
    .select('id, nom_affichage, ville, zone_description, fiches_total, objectif_fiches, photo_url')
    .eq('statut', 'actif')
    .eq('consent_page_publique', true)
    .eq('fiche_masquee', false)
    .not('nom_affichage', 'is', null)
    .order('fiches_total', { ascending: false })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { enqueteurs: data || [] },
    { headers: { 'Cache-Control': 'public, max-age=600' } }
  )
}
