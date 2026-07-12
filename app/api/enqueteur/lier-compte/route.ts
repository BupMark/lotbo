import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { lierEnqueteurSiEmailCorrespond } from '../../../../lib/enqueteurLink'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user || !user.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const resultat = await lierEnqueteurSiEmailCorrespond(admin, user.id, user.email)
  return NextResponse.json(resultat)
}
