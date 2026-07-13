import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifierAdmin } from '../../../../lib/adminAuth'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Body {
  user_id: string
  type: string
  titre: string
  message: string
  lien?: string | null
}

export async function POST(request: Request) {
  const acces = await verifierAdmin(request)
  if (!acces.ok) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { user_id, type, titre, message, lien } = await request.json() as Body
    if (!user_id || !type || !titre || !message) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const admin = makeAdminClient()
    const { error } = await admin.from('notifications').insert([{
      user_id, type, titre, message,
      lien: lien ?? null,
      lu: false,
    }])
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
