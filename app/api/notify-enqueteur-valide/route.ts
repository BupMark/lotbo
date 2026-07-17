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
    const { email, prenom, ville, enqueteurId, langue } = await request.json()
    if (!email || !enqueteurId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const langueFinale = langue === 'ht' ? 'ht' : 'fr'
    const nomAffiche = prenom || email.split('@')[0]
    const lienCompte = `https://app.lotbo.app/login?email=${encodeURIComponent(email)}&source=enqueteur&ref=${enqueteurId}&utm_source=email&utm_medium=validation&utm_campaign=enqueteur`

    const contenuFr = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">
        Bravo ${nomAffiche}, ta candidature est acceptée !
      </h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">
        Tu fais maintenant partie du programme enquêteur LOTBO à ${ville}.
      </p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">
        Pour suivre ta progression, recevoir ton badge et accéder à ton tableau de bord enquêteur,
        crée ton compte LOTBO — ou connecte-toi si tu en as déjà un.
      </p>
      <a href="${lienCompte}"
         style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-weight:500">
        Créer mon compte →
      </a>
      <div style="background:#F7F2E8;border-radius:8px;padding:16px 20px;margin-top:24px">
        <p style="color:#1A1410;font-family:Arial,sans-serif;font-weight:bold;margin:0 0 10px">Voici comment continuer :</p>
        <ol style="color:#1A1410;font-family:Arial,sans-serif;padding-left:20px;margin:0">
          <li style="margin-bottom:6px">Connecte-toi avec le lien ci-dessus (ou crée ton compte si tu n'en as pas encore).</li>
          <li style="margin-bottom:6px">Sur ton profil, tu verras ton badge Enquêteur Terrain et ta barre de progression.</li>
          <li style="margin-bottom:6px">Pour chaque fiche terrain collectée, utilise le formulaire dédié : <a href="https://lotbo.app/terrain" style="color:#C8431A">lotbo.app/terrain</a></li>
          <li>Tu peux fixer et modifier ton propre objectif de fiches à tout moment, directement depuis ton profil.</li>
        </ol>
      </div>
      <p style="color:#8C5A40;font-size:12px;margin-top:16px;font-family:Arial,sans-serif">
        Besoin d'aide ou une question ? Écris à Gaetchens : <a href="mailto:gaetchens@lotbo.app" style="color:#8C5A40">gaetchens@lotbo.app</a>
      </p>
      <p style="color:#8C5A40;font-size:12px;margin-top:8px;font-family:Arial,sans-serif">
        Le lien reste valide tant que ta fiche enquêteur existe — pas de contrainte de temps.
      </p>
    `

    const contenuHt = `
      <h1 style="color:#C8431A;font-family:Georgia,serif;font-style:italic">
        Bravo ${nomAffiche}, kandidati ou aksepte !
      </h1>
      <p style="color:#1A1410;font-family:Arial,sans-serif">
        Ou fè pati pwogram ankètè LOTBO nan ${ville} kounye a.
      </p>
      <p style="color:#1A1410;font-family:Arial,sans-serif">
        Pou swiv pwogrè ou, resevwa badj ou epi jwenn tablo bò ou kòm ankètè,
        kreye kont LOTBO ou — oswa konekte si ou gen youn deja.
      </p>
      <a href="${lienCompte}"
         style="background:#C8431A;color:#F7F2E8;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-weight:500">
        Kreye kont mwen →
      </a>
      <div style="background:#F7F2E8;border-radius:8px;padding:16px 20px;margin-top:24px">
        <p style="color:#1A1410;font-family:Arial,sans-serif;font-weight:bold;margin:0 0 10px">Men kijan pou kontinye :</p>
        <ol style="color:#1A1410;font-family:Arial,sans-serif;padding-left:20px;margin:0">
          <li style="margin-bottom:6px">Konekte ak lyen ki anwo a (oswa kreye kont ou si ou poko genyen).</li>
          <li style="margin-bottom:6px">Sou pwofil ou, w ap wè badj Ankètè Tèren ou ak ba pwogrè ou.</li>
          <li style="margin-bottom:6px">Pou chak fich tèren ou ranmase, itilize fòmilè espesyal la : <a href="https://lotbo.app/terrain" style="color:#C8431A">lotbo.app/terrain</a></li>
          <li>Ou ka fikse epi modifye objektif fich ou a nenpòt lè, dirèkteman sou pwofil ou.</li>
        </ol>
      </div>
      <p style="color:#8C5A40;font-size:12px;margin-top:16px;font-family:Arial,sans-serif">
        Ou bezwen èd oswa ou gen yon kesyon ? Ekri Gaetchens : <a href="mailto:gaetchens@lotbo.app" style="color:#8C5A40">gaetchens@lotbo.app</a>
      </p>
      <p style="color:#8C5A40;font-size:12px;margin-top:8px;font-family:Arial,sans-serif">
        Lyen sa a ap toujou valab toutan fich ankètè ou egziste — pa gen limit tan.
      </p>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY! },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to: [{ email, name: nomAffiche }],
        subject: langueFinale === 'ht' ? 'Kandidati ou pou vin ankètè LOTBO aksepte 🎉' : 'Ta candidature enquêteur LOTBO est acceptée 🎉',
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
