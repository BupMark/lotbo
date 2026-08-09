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

const CANAUX_VALIDES = ['whatsapp', 'facebook', 'x', 'natif', 'autre']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organisationId } = await params

  try {
    const body = await request.json()
    const sessionId = body.session_id as string | undefined
    const canal = CANAUX_VALIDES.includes(body.canal) ? body.canal : 'autre'

    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const admin = makeAdminClient()
      const { data } = await admin.auth.getUser(token)
      userId = data.user?.id || null
    }

    const admin = makeAdminClient()
    const { error } = await admin.from('partages_organisations').insert([{
      organisation_id: organisationId,
      user_id: userId,
      session_id: userId ? null : sessionId,
      canal,
    }])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
