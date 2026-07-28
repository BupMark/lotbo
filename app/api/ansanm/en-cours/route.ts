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

  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' })
  const dateIl7j = new Date()
  dateIl7j.setDate(dateIl7j.getDate() - 7)
  const il7j = dateIl7j.toLocaleDateString('en-CA', { timeZone: 'America/Port-au-Prince' })

  // date_debut/date_fin sont des colonnes DATE (pas de composante heure) — "en cours" est donc
  // approximé par "événements du jour". Le plancher il7j évite qu'un vieil événement sans
  // date_fin (92% des cas) reste indéfiniment considéré comme actif.
  const { data, error } = await admin
    .from('evenements')
    .select('ville, pays')
    .eq('statut', 'approuve')
    .gte('date_debut', il7j)
    .lte('date_debut', aujourdhui)
    .or(`date_fin.gte.${aujourdhui},date_fin.is.null`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const villes = new Set((data || []).map(e => e.ville?.trim().toLowerCase()).filter(Boolean))
  const pays = new Set((data || []).map(e => e.pays?.trim().toLowerCase()).filter(Boolean))

  return NextResponse.json(
    { evenements_du_jour: (data || []).length, villes: villes.size, pays: pays.size },
    { headers: { 'Cache-Control': 'public, max-age=600' } }
  )
}
