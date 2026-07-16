import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── total_recu — reçu depuis le début, tous statuts confondus (stratégie mobilisation) ──
  const { count: total_recu } = await supabase
    .from('evenements')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json(
    { total_recu: total_recu || 0 },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
