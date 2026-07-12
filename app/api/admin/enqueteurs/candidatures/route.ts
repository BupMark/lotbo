import { NextResponse } from 'next/server'
import { makeAdminClient, verifierAdmin } from '../../../../../lib/adminAuth'

// GET — liste les candidatures enquêteur en attente de traitement (token_utilise = false)
export async function GET(request: Request) {
  const auth = await verifierAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const admin = makeAdminClient()
    const { data, error } = await admin
      .from('enqueteurs_consentements')
      .select('id, nom_complet, ville, email, whatsapp, nom_affichage_type, nom_affichage_valeur, consent_publication, consent_volontariat, consent_age, consent_photo, photo_url, langue, signature_at, token_expire_at')
      .eq('statut_traitement', 'en_attente')
      .order('signature_at', { ascending: true })
      .limit(2000)
    if (error) throw error

    return NextResponse.json({ candidatures: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
