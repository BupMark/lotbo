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

    // T-1 — Vérification sole-admin avant de marquer la demande
    // On appelle la RPC uniquement pour la vérification, pas pour supprimer
    // On vérifie manuellement si l'utilisateur est seul admin d'une organisation
    const { data: orgAdminRows } = await supabaseAdmin
      .from('organisation_membres')
      .select('org_id')
      .eq('user_id', userId)
      .eq('role', 'admin')

    for (const row of orgAdminRows || []) {
      const { count } = await supabaseAdmin
        .from('organisation_membres')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', row.org_id)
        .eq('role', 'admin')
        .neq('user_id', userId)

      if ((count ?? 0) === 0) {
        return NextResponse.json(
          {
            error: 'SEUL_ADMIN_ORGANISATION',
            orgId: row.org_id,
            message: "Vous êtes le seul administrateur d'une organisation. Transférez la propriété ou supprimez l'organisation avant de supprimer votre compte.",
          },
          { status: 409 }
        )
      }
    }

    // T-1 Sujet A — Soft-delete : marquer la demande avec timestamp
    // La suppression effective interviendra après 30 jours via CRON
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ suppression_demandee_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Erreur marquage suppression:', updateError)
      return NextResponse.json({ error: 'ERREUR_SUPPRESSION_DONNEES' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mode: 'soft_delete',
      message: 'Votre demande de suppression a été enregistrée. Votre compte sera définitivement supprimé dans 30 jours.',
    })

  } catch (err) {
    console.error('Erreur inattendue suppression compte:', err)
    return NextResponse.json({ error: 'ERREUR_INATTENDUE' }, { status: 500 })
  }
}
