import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin
    .from('admin_engagements')
    .select('nom_complet, email, ville, fiches_total_initial, token_expire_at, token_utilise')
    .eq('token', token)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'introuvable' }, { status: 404 })
  }
  if (data.token_utilise) {
    return NextResponse.json({ valid: false, reason: 'deja_utilise' }, { status: 410 })
  }
  if (new Date(data.token_expire_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'expire' }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    nom_complet: data.nom_complet,
    email: data.email,
    ville: data.ville,
    fiches_total_initial: data.fiches_total_initial,
  })
}
