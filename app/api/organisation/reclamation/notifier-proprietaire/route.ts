import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function ajouterJoursOuvres(date: Date, jours: number): Date {
  const resultat = new Date(date)
  let ajoutes = 0
  while (ajoutes < jours) {
    resultat.setDate(resultat.getDate() + 1)
    const jourSemaine = resultat.getDay()
    if (jourSemaine !== 0 && jourSemaine !== 6) ajoutes++
  }
  return resultat
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const bearerToken = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(bearerToken)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = makeAdminClient()

  // Vérifie que l'appelant est admin
  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profil?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json() as { reclamation_id?: string }
  const { reclamation_id } = body
  if (!reclamation_id) return NextResponse.json({ error: 'reclamation_id manquant' }, { status: 400 })

  const { data: rec } = await admin
    .from('reclamations_organisations')
    .select('id, organisation_id, statut')
    .eq('id', reclamation_id)
    .maybeSingle()

  if (!rec) return NextResponse.json({ error: 'Réclamation introuvable' }, { status: 404 })
  if (rec.statut !== 'en_attente') return NextResponse.json({ error: 'Statut invalide pour cette action' }, { status: 400 })

  const { data: org } = await admin
    .from('organisations')
    .select('id, nom, owner_id')
    .eq('id', rec.organisation_id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })

  const { data: proprietaireUser } = await admin.auth.admin.getUserById(org.owner_id)
  const emailProprietaire = proprietaireUser?.user?.email

  const token = crypto.randomUUID()
  const now = new Date()
  const delaiExpireLe = ajouterJoursOuvres(now, 5)

  await admin.from('reclamations_organisations').update({
    statut: 'proprietaire_notifie',
    proprietaire_notifie_le: now.toISOString(),
    proprietaire_delai_expire_le: delaiExpireLe.toISOString(),
    token,
  }).eq('id', reclamation_id)

  const lienReponse = `https://app.lotbo.app/organisation/reclamation/repondre?token=${token}`

  await admin.from('notifications').insert([{
    user_id: org.owner_id,
    type: 'reclamation_organisation',
    titre: 'Quelqu\'un réclame ton organisation',
    message: `Une demande concernant "${org.nom}" attend ta réponse.`,
    lien: `/organisation/reclamation/repondre?token=${token}`,
    lu: false,
  }])

  if (emailProprietaire) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
        body: JSON.stringify({
          sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
          to: [{ email: emailProprietaire }],
          subject: `Quelqu'un réclame ${org.nom} sur LOTBO`,
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1410;padding:32px;border-radius:12px">
              <div style="margin-bottom:24px">
                <span style="font-family:Georgia,serif;font-style:italic;font-size:24px;font-weight:bold">
                  <span style="color:#F7F2E8">lot</span><span style="color:#C8431A">bo</span>
                </span>
              </div>
              <h1 style="color:#F7F2E8;font-size:18px;margin-bottom:8px">Quelqu'un réclame ${org.nom}</h1>
              <p style="color:#8C5A40;font-size:14px;margin-bottom:24px">Quelqu'un affirme être le représentant réel de ${org.nom}. Tu as 5 jours ouvrés pour répondre — sans réponse, le transfert sera automatique.</p>
              <a href="${lienReponse}"
                 style="background:#C8431A;color:#F7F2E8;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
                Voir la demande →
              </a>
              <p style="color:#2a2a2a;font-size:11px;margin-top:24px">Lotbo · app.lotbo.app</p>
            </div>
          `,
        }),
      })
    } catch (e) {
      console.error('[NotifierProprietaire] Échec envoi email', e)
    }
  }

  return NextResponse.json({ success: true })
}
