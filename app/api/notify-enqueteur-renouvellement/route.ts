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
    const { email, prenom, ville, fichesTotal, enqueteurId, dateExpiration, langue } = await request.json()
    if (!email || !enqueteurId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const langueFinale = langue === 'ht' ? 'ht' : 'fr'
    const nomAffiche = prenom || email.split('@')[0]
    const lienRenouveler = `https://app.lotbo.app/api/enqueteur/renouveler?id=${enqueteurId}`
    const lienMasquer = `https://app.lotbo.app/api/enqueteur/masquer-fiche?id=${enqueteurId}`
    const dateFormatee = new Date(dateExpiration).toLocaleDateString(langueFinale === 'ht' ? 'fr-FR' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    const contenuFr = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Confirme ta participation au programme enquêteur LOTBO</h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjour ${nomAffiche},</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Ça fait presque un an que tu contribues au programme enquêteur LOTBO à ${ville} — ${fichesTotal} fiches au compteur, merci !</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Pour rester enquêteur actif et visible sur lotbo.app/enqueteurs, confirme ta participation avant le ${dateFormatee}.</p>
      <a href="${lienRenouveler}" style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;margin-right:10px;font-family:Arial,sans-serif;font-weight:500">Je continue à contribuer →</a>
      <a href="${lienMasquer}" style="background:transparent;color:#8C5A40;padding:10px 20px;border:1px solid #8C5A40;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif">Masquer ma fiche</a>
      <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">Sans réponse de ta part, ton profil sera simplement masqué de la page publique — aucune suppression, tu pourras le réactiver à tout moment.</p>
    `

    const contenuHt = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">Konfime patisipasyon ou nan pwogram ankètè LOTBO a</h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Bonjou ${nomAffiche},</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Sa fè prèske yon ane w ap kontribye nan pwogram ankètè LOTBO nan ${ville} — ${fichesTotal} fich, mèsi anpil !</p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">Pou rete yon ankètè aktif ki vizib sou lotbo.app/enqueteurs, konfime patisipasyon ou anvan ${dateFormatee}.</p>
      <a href="${lienRenouveler}" style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;margin-right:10px;font-family:Arial,sans-serif;font-weight:500">Mwen kontinye kontribye →</a>
      <a href="${lienMasquer}" style="background:transparent;color:#8C5A40;padding:10px 20px;border:1px solid #8C5A40;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif">Maske fich mwen</a>
      <p style="color:#8C5A40;font-size:12px;margin-top:24px;font-family:Arial,sans-serif">San repons ou, pwofil ou ap senpleman maske sou paj piblik la — pa gen anyen ki efase, ou ka reaktive li nenpòt lè.</p>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email, name: nomAffiche }],
        subject: langueFinale === 'ht' ? 'Konfime patisipasyon ou nan pwogram ankètè LOTBO a' : 'Confirme ta participation au programme enquêteur LOTBO',
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
