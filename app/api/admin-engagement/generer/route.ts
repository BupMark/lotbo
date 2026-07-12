import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { nom_complet, email, ville, fiches_total_initial } = await request.json()
    if (!nom_complet || !email) {
      return NextResponse.json({ error: 'nom_complet et email requis' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const token = crypto.randomUUID()
    const tokenExpireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await admin.from('admin_engagements').insert({
      token,
      nom_complet,
      email,
      ville: ville || null,
      fiches_total_initial: fiches_total_initial || 0,
      role_assigne: 'admin_enqueteur',
      token_expire_at: tokenExpireAt,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      url: `https://app.lotbo.app/admin/engagement?token=${token}`,
      token_expire_at: tokenExpireAt,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
