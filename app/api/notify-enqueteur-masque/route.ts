import { NextResponse } from 'next/server'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { email, prenom, enqueteurId, dateLimite, langue } = await request.json()
    if (!email || !enqueteurId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const langueFinale = langue === 'ht' ? 'ht' : 'fr'
    const nomAffiche = prenom || email.split('@')[0]
    const lienRenouveler = `https://app.lotbo.app/api/enqueteur/renouveler?id=${enqueteurId}`
    const dateFormatee = new Date(dateLimite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const contenuFr = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Ta fiche enquêteur LOTBO a été masquée</h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjour ${nomAffiche},</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Ta fiche a été masquée automatiquement, faute de réponse. Tes statistiques restent conservées.</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Tu peux la réactiver jusqu'au ${dateFormatee} :</p>
      <a href="${lienRenouveler}" style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-weight:500">Réactiver ma fiche →</a>
      <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">Passé ce délai, tes données personnelles seront anonymisées (seules les statistiques agrégées seront conservées).</p>
    `

    const contenuHt = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Fich ankètè LOTBO ou a maske</h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjou ${nomAffiche},</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Fich ou a maske otomatikman, paske pa gen repons. Estatistik ou yo rete konsève.</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Ou ka reaktive li jiska ${dateFormatee} :</p>
      <a href="${lienRenouveler}" style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-weight:500">Reaktive fich mwen →</a>
      <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">Apre dat sa a, done pèsonèl ou yo ap anonimize (se sèlman estatistik total yo ki ap konsève).</p>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email, name: nomAffiche }],
        subject: langueFinale === 'ht' ? 'Fich ankètè LOTBO ou a maske' : 'Ta fiche enquêteur LOTBO a été masquée',
        htmlContent: langueFinale === 'ht' ? contenuHt : contenuFr,
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
