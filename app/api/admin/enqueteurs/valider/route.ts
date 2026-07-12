import { NextResponse } from 'next/server'
import { makeAdminClient, verifierAdmin } from '../../../../../lib/adminAuth'

interface EnqueteurConsentementRow {
  id: string
  nom_complet: string
  ville: string
  email: string
  nom_affichage_type: string
  nom_affichage_valeur: string | null
  consent_publication: boolean
  consent_volontariat: boolean
  consent_age: boolean
  consent_photo: boolean
  consent_photo_at: string | null
  photo_url: string | null
  statut_traitement: string
}

// Calcule le nom d'affichage final — pour 'prenom_initiale', la valeur n'est
// connue qu'à la validation (voir app/enqueteur/consentement/page.tsx, étape 3).
function calculerNomAffichage(row: EnqueteurConsentementRow): string {
  if (row.nom_affichage_type === 'prenom_initiale') {
    const parts   = row.nom_complet.trim().split(/\s+/)
    const prenom  = parts[0] ?? row.nom_complet
    const initiale = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : ''
    return initiale ? `${prenom} ${initiale}.` : prenom
  }
  return row.nom_affichage_valeur || row.nom_complet
}

// POST { consentementId } — valide une candidature : crée la fiche enqueteurs
// publique et marque la candidature comme traitée.
export async function POST(request: Request) {
  const auth = await verifierAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { consentementId } = await request.json() as { consentementId: string }
    if (!consentementId) return NextResponse.json({ error: 'consentementId manquant' }, { status: 400 })

    const admin = makeAdminClient()

    const { data: c, error: fetchErr } = await admin
      .from('enqueteurs_consentements')
      .select('id, nom_complet, ville, email, nom_affichage_type, nom_affichage_valeur, consent_publication, consent_volontariat, consent_age, consent_photo, consent_photo_at, photo_url, statut_traitement')
      .eq('id', consentementId)
      .single()
    if (fetchErr || !c) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

    const row = c as EnqueteurConsentementRow
    if (row.statut_traitement !== 'en_attente') {
      return NextResponse.json({ error: 'Candidature déjà traitée' }, { status: 409 })
    }
    if (!row.consent_publication || !row.consent_volontariat || !row.consent_age) {
      return NextResponse.json({ error: 'Consentements obligatoires manquants' }, { status: 400 })
    }

    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const targetUser = (usersResponse?.users ?? []).find(u => u.email === row.email)
    const profilId = targetUser?.id ?? null

    const now = new Date().toISOString()

    const { error: insertErr } = await admin.from('enqueteurs').insert({
      user_id:                  profilId,
      nom_affichage:            calculerNomAffichage(row),
      type_nom_affichage:       row.nom_affichage_type,
      photo_url:                row.photo_url,
      ville:                    row.ville,
      statut:                   'actif',
      cycle_debut:              now,
      consent_page_publique:    true,
      consent_page_publique_at: now,
      consent_photo:            row.consent_photo,
      consent_photo_at:         row.consent_photo_at,
    })
    if (insertErr) throw insertErr

    const { error: updateErr } = await admin
      .from('enqueteurs_consentements')
      .update({ token_utilise: true, statut_traitement: 'valide', profile_id: profilId })
      .eq('id', consentementId)
    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
