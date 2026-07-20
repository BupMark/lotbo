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
    .from('ansanm_contextes')
    .select('type, nom, date_debut, date_fin, heure_debut, heure_fin, mois_debut, mois_fin, priorite, illustrations, messages')
    .eq('actif', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { contextes: data || [] },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  )
}
