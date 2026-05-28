import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normaliserPays } from '../../../lib/normalisation'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const admin = makeAdminClient()

  // ── Total événements soumis — toutes statuts confondus ────────────────────
  const { count: total } = await admin
    .from('evenements')
    .select('*', { count: 'exact', head: true })

  // ── Villes distinctes — depuis les événements approuvés ───────────────────
  const { data: villesData } = await admin
    .from('evenements')
    .select('ville')
    .eq('statut', 'approuve')
    .not('ville', 'is', null)
    .limit(2000)

  const villes = new Set(
    villesData?.map(e => e.ville?.trim()).filter(Boolean)
  ).size

  // ── Pays distincts — depuis les événements approuvés ──────────────────────
  const { data: paysData } = await admin
    .from('evenements')
    .select('pays')
    .eq('statut', 'approuve')
    .not('pays', 'is', null)
    .limit(2000)

  const pays = new Set(
    paysData?.map(e => e.pays?.trim()).filter(Boolean).map(p => normaliserPays(p))
  ).size

  return NextResponse.json(
    { total: total || 0, villes, pays },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
