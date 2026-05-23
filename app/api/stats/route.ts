import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normaliserPays } from '../../../lib/normalisation'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── Total événements approuvés — count exact, pas de limite 1000 ──────────
  const { count: total } = await supabase
    .from('evenements')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'approuve')

  // ── Villes distinctes ─────────────────────────────────────────────────────
  const { data: villesData } = await supabase
    .from('evenements')
    .select('ville')
    .eq('statut', 'approuve')
    .not('ville', 'is', null)

  const villes = new Set(
    villesData?.map(e => e.ville?.trim()).filter(Boolean)
  ).size

  // ── Pays distincts ────────────────────────────────────────────────────────
  const { data: paysData } = await supabase
    .from('evenements')
    .select('pays')
    .eq('statut', 'approuve')
    .not('pays', 'is', null)

  const pays = new Set(
    paysData?.map(e => e.pays?.trim()).filter(Boolean).map(p => normaliserPays(p))
  ).size

  return NextResponse.json(
    { total: total || 0, villes, pays },
    {
      headers: {
        // Cache 60s seulement — les stats doivent rester fraîches
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
