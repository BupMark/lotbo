import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/organisation?erreur=token_manquant', url.origin))
  }

  const admin = makeAdminClient()

  const { data: org, error } = await admin
    .from('organisations')
    .select('id, slug, email_contact_verifie_token, email_contact_verifie_token_expire_le')
    .eq('email_contact_verifie_token', token)
    .maybeSingle()

  if (error || !org) {
    return NextResponse.redirect(new URL('/organisation?erreur=token_invalide', url.origin))
  }

  const expire = org.email_contact_verifie_token_expire_le
    ? new Date(org.email_contact_verifie_token_expire_le)
    : null

  if (!expire || expire.getTime() < Date.now()) {
    return NextResponse.redirect(new URL(`/organisation/${org.slug}/modifier?erreur=token_expire`, url.origin))
  }

  await admin
    .from('organisations')
    .update({
      email_contact_verifie: true,
      email_contact_verifie_le: new Date().toISOString(),
      email_contact_verifie_token: null,
      email_contact_verifie_token_expire_le: null,
    })
    .eq('id', org.id)

  return NextResponse.redirect(new URL(`/organisation/${org.slug}/modifier?email_valide=1`, url.origin))
}
