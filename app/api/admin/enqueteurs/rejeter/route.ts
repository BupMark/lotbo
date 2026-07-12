import { NextResponse } from 'next/server'
import { makeAdminClient, verifierAdmin } from '../../../../../lib/adminAuth'

// POST { consentementId } — rejette une candidature : aucune fiche enqueteurs
// n'est créée, la candidature est simplement marquée comme traitée.
export async function POST(request: Request) {
  const auth = await verifierAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { consentementId } = await request.json() as { consentementId: string }
    if (!consentementId) return NextResponse.json({ error: 'consentementId manquant' }, { status: 400 })

    const admin = makeAdminClient()
    const { error } = await admin
      .from('enqueteurs_consentements')
      .update({ token_utilise: true, statut_traitement: 'rejete' })
      .eq('id', consentementId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
