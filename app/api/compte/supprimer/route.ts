import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 })
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: userData, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 })
    }

    const userId = userData.user.id

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: rpcError } = await supabaseAdmin.rpc('supprimer_compte_utilisateur', {
      p_user_id: userId,
    })

    if (rpcError) {
      if (rpcError.message?.startsWith('SOLE_ADMIN_ORG:')) {
        const orgId = rpcError.message.split(':')[1]?.trim()
        return NextResponse.json(
          {
            error: 'SEUL_ADMIN_ORGANISATION',
            orgId,
            message: 'Vous êtes le seul administrateur d\'une organisation. Transférez la propriété ou supprimez l\'organisation avant de supprimer votre compte.',
          },
          { status: 409 }
        )
      }
      console.error('Erreur RPC suppression compte:', rpcError)
      return NextResponse.json({ error: 'ERREUR_SUPPRESSION_DONNEES' }, { status: 500 })
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Erreur suppression Auth:', deleteAuthError)
      return NextResponse.json({ error: 'ERREUR_SUPPRESSION_AUTH' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur inattendue suppression compte:', err)
    return NextResponse.json({ error: 'ERREUR_INATTENDUE' }, { status: 500 })
  }
}
