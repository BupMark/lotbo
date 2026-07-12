import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface Body {
  token: string
  piece_type: string
  piece_numero: string
  piece_pays: string
  nom_affichage_type: string
  nom_affichage_valeur: string
  consent_photo: boolean
  engagement_conf: boolean[]
  engagement_admin: boolean[]
}

function calculerNomAffichage(type: string, valeur: string, nomComplet: string): string {
  if (valeur && valeur.trim()) return valeur.trim()
  if (type === 'prenom_initiale') {
    const parts = nomComplet.trim().split(/\s+/)
    const prenom = parts[0] ?? nomComplet
    const initiale = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : ''
    return initiale ? `${prenom} ${initiale}.` : prenom
  }
  return nomComplet
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Body
    const { token, piece_type, piece_numero, piece_pays, nom_affichage_type, nom_affichage_valeur, consent_photo, engagement_conf, engagement_admin } = body

    if (!token || !piece_type || !piece_numero || !nom_affichage_type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    if (engagement_conf.length !== 6 || engagement_conf.some(v => !v)) {
      return NextResponse.json({ error: 'Tous les engagements de confidentialité sont obligatoires' }, { status: 400 })
    }
    if (engagement_admin.length !== 4 || engagement_admin.some(v => !v)) {
      return NextResponse.json({ error: 'Tous les engagements admin sont obligatoires' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: eng, error: fetchErr } = await admin
      .from('admin_engagements')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (fetchErr || !eng) {
      return NextResponse.json({ error: 'Lien invalide ou introuvable' }, { status: 404 })
    }
    if (eng.token_utilise) {
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 410 })
    }
    if (new Date(eng.token_expire_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 })
    }

    const now = new Date().toISOString()
    const dansUnAn = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    // Chercher un compte existant par email
    const { data: usersResponse } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const targetUser = (usersResponse?.users ?? []).find(u => u.email === eng.email)
    const profilId = targetUser?.id ?? null

    // Créer la fiche enqueteurs directement (statut actif — pas de passage par enqueteur/consentement)
    const { data: nouvelEnqueteur, error: insertErr } = await admin.from('enqueteurs').insert({
      user_id: profilId,
      email: eng.email,
      nom_affichage: calculerNomAffichage(nom_affichage_type, nom_affichage_valeur, eng.nom_complet),
      type_nom_affichage: nom_affichage_type,
      ville: eng.ville,
      statut: 'actif',
      fiches_total: eng.fiches_total_initial || 0,
      cycle_debut: now,
      consent_page_publique: true,
      consent_page_publique_at: now,
      consent_photo: consent_photo,
      consent_photo_at: consent_photo ? now : null,
      consent_revue_at: now,
      consent_revue_due: dansUnAn,
    }).select('id').single()

    if (insertErr) throw insertErr

    // Mettre à jour la ligne admin_engagements
    const confTimestamps = Object.fromEntries(engagement_conf.map((_, i) => [`engagement_conf_${i + 1}`, true]))
    const confAtTimestamps = Object.fromEntries(engagement_conf.map((_, i) => [`engagement_conf_${i + 1}_at`, now]))
    const adminTimestamps = Object.fromEntries(engagement_admin.map((_, i) => [`engagement_admin_${i + 1}`, true]))
    const adminAtTimestamps = Object.fromEntries(engagement_admin.map((_, i) => [`engagement_admin_${i + 1}_at`, now]))

    const { error: updateErr } = await admin.from('admin_engagements').update({
      piece_type,
      piece_numero,
      piece_pays: piece_pays || 'HT',
      nom_affichage_type,
      nom_affichage_valeur,
      consent_photo,
      consent_photo_at: consent_photo ? now : null,
      consent_profil: true,
      consent_profil_at: now,
      consent_profil_version: 'v1-11juillet2026',
      consent_revue_due: dansUnAn,
      ...confTimestamps,
      ...confAtTimestamps,
      ...adminTimestamps,
      ...adminAtTimestamps,
      ip_address: ipAddress,
      user_agent: userAgent,
      token_utilise: true,
      soumis_at: now,
      profile_id: profilId,
      enqueteur_id: nouvelEnqueteur.id,
    }).eq('token', token)

    if (updateErr) throw updateErr

    // Email de confirmation — non bloquant
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
          to: [{ email: eng.email, name: eng.nom_complet }],
          subject: 'Engagement LOTBO enregistré',
          htmlContent: `
            <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Engagement enregistré</h1>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjour ${eng.nom_complet.split(' ')[0]},</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Votre engagement LOTBO a été enregistré avec succès. Vous faites maintenant partie de l'équipe de coordination du programme enquêteur.</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Votre accès administrateur (rôle admin_enqueteur) sera activé par Handgod dans les prochaines heures. Il couvre uniquement la validation des candidatures enquêteur — aucun autre accès à la plateforme.</p>
            <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">Pour toute question : handgod@lotbo.app</p>
          `,
        })
      })
    } catch (emailErr) {
      console.error('[AdminEngagement] Email confirmation échoué (non bloquant):', emailErr)
    }

    // Notification Handgod — non bloquant
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
          to: [{ email: 'handgod@lotbo.app', name: 'Handgod' }],
          subject: `✅ Engagement signé — ${eng.nom_complet}`,
          htmlContent: `
            <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Engagement signé</h1>
            <p style="color:#1A1410;font-family:Arial,sans-serif"><strong>${eng.nom_complet}</strong> vient de soumettre son engagement LOTBO.</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Email : ${eng.email}<br/>Ville : ${eng.ville || '—'}<br/>Rôle assigné : ${eng.role_assigne}</p>
            <p style="color:#1A1410;font-family:Arial,sans-serif">Fiche enquêteur créée automatiquement (statut actif). Il reste à activer son rôle admin manuellement :</p>
            <p style="background:#F7F2E8;padding:10px 14px;border-radius:6px;font-family:monospace;font-size:12px;color:#1A1410">UPDATE profiles SET role = '${eng.role_assigne}' WHERE id = (SELECT id FROM auth.users WHERE email = '${eng.email}');</p>
            <p style="color:#8C5A40;font-size:12px;margin-top:16px;font-family:Arial,sans-serif">Si aucun compte n'existe encore avec cet email, il faudra que la personne en crée un d'abord.</p>
          `,
        })
      })
    } catch (notifErr) {
      console.error('[AdminEngagement] Notification Handgod échouée (non bloquant):', notifErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
