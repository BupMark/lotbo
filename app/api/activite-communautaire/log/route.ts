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
  type: 'badge_debloque' | 'palier_anciennete' | 'nouveau_membre' | 'evenement_approuve' | 'objectif_enqueteur' | 'anniversaire'
  user_id: string | null
  ville: string | null
  contenu: Record<string, unknown>
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  const secretValide = secret === process.env.INTERNAL_API_SECRET
  if (!secretValide) {
    const acces = await verifierAdmin(request)
    if (!acces.ok) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  try {
    const { type, user_id, ville, contenu } = await request.json() as Body
    if (!type) {
      return NextResponse.json({ error: 'type requis' }, { status: 400 })
    }

    const admin = makeAdminClient()

    // Respect du toggle de confidentialité — sauf nouveau_membre, qui reste
    // toujours inséré (mais affiché anonymisé côté lecture si visible_ansanm = false)
    if (user_id && type !== 'nouveau_membre') {
      const { data: profil } = await admin
        .from('profiles')
        .select('visible_ansanm')
        .eq('id', user_id)
        .single()
      if (profil && profil.visible_ansanm === false) {
        return NextResponse.json({ success: true, skipped: true, raison: 'visible_ansanm = false' })
      }
    }

    const { error } = await admin.from('activite_communautaire').insert([{
      type, user_id, ville, contenu,
    }])
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[ActiviteCommunautaire] Erreur:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
