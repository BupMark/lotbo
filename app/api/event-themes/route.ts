import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('event_themes')
    .select('id, nom, icone, parent_id')
    .order('parent_id', { ascending: true, nullsFirst: true })
    .order('nom', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ themes: data || [] }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
