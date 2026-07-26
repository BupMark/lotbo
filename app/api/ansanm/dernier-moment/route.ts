import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Types d'activité comptant comme "moment" pour le badge nav Ansanm
// (liste extensible — ajouter ici tout futur déclencheur similaire)
const TYPES_MOMENT = ['ville_top_changee']

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('activite_communautaire')
    .select('created_at')
    .in('type', TYPES_MOMENT)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ derniere_activite: null }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  return NextResponse.json({ derniere_activite: data.created_at }, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
