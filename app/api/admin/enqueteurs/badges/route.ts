import { NextResponse } from 'next/server'
import { makeAdminClient, verifierAdminOuEnqueteur } from '../../../../../lib/adminAuth'

// GET — liste les enquêteurs ayant demandé un badge physique, pas encore envoyé
export async function GET(request: Request) {
  const auth = await verifierAdminOuEnqueteur(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const admin = makeAdminClient()
    const { data, error } = await admin
      .from('enqueteurs')
      .select('id, nom_affichage, ville, user_id, created_at')
      .eq('badge_physique_demande', true)
      .eq('badge_physique_envoye', false)
      .order('created_at', { ascending: true })
      .limit(2000)
    if (error) throw error

    return NextResponse.json({ badges: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH { id } — marque le badge physique comme envoyé
export async function PATCH(request: Request) {
  const auth = await verifierAdminOuEnqueteur(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { id } = await request.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

    const admin = makeAdminClient()
    const { error } = await admin
      .from('enqueteurs')
      .update({ badge_physique_envoye: true })
      .eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
