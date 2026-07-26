import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DUREE_CELEBRATION_MS = 48 * 60 * 60 * 1000

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('classement_villes_historique')
    .select('ville, pays, nb_evenements, devenue_top_le')
    .order('devenue_top_le', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ active: false }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  const active = Date.now() - new Date(data.devenue_top_le).getTime() < DUREE_CELEBRATION_MS

  return NextResponse.json({
    active,
    ville: data.ville,
    pays: data.pays,
    nb_evenements: data.nb_evenements,
    devenue_top_le: data.devenue_top_le,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
