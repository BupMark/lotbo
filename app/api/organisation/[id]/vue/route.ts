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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organisationId } = await params
  try {
    const body = await request.json()
    const sessionId = body.session_id as string | undefined
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const admin = makeAdminClient()
      const { data } = await admin.auth.getUser(token)
      userId = data.user?.id || null
    }
    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'user_id ou session_id requis' }, { status: 400 })
    }
    const admin = makeAdminClient()
    const { error } = await admin.from('vues_organisations').insert([{
      organisation_id: organisationId,
      user_id: userId,
      session_id: userId ? null : sessionId,
    }])
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, deja_vu: error?.code === '23505' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
