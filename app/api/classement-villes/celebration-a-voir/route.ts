import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')

  const admin = makeAdminClient()

  const { data: derniereLigne } = await admin
    .from('classement_villes_historique')
    .select('ville, pays, nb_evenements, devenue_top_le')
    .order('devenue_top_le', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!derniereLigne) {
    return NextResponse.json({ aVoir: false })
  }

  let dernierVu: string | null = null
  if (userId) {
    const { data: prof } = await admin
      .from('profiles')
      .select('derniere_celebration_ville_vue')
      .eq('id', userId)
      .single()
    dernierVu = prof?.derniere_celebration_ville_vue || null
  }

  const aVoir = userId
    ? (!dernierVu || new Date(dernierVu) < new Date(derniereLigne.devenue_top_le))
    : true // pour anonymes, le check se fait côté client via localStorage

  return NextResponse.json({
    aVoir,
    ville: derniereLigne.ville,
    pays: derniereLigne.pays,
    nbEvenements: derniereLigne.nb_evenements,
    devenueTopLe: derniereLigne.devenue_top_le,
  })
}
