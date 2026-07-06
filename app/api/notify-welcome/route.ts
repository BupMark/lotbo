import { NextResponse } from 'next/server'

function verifierSecret(request: Request): boolean {
  const secret = request.headers.get('x-internal-secret')
  return secret === process.env.INTERNAL_API_SECRET
}

const TEMPLATE_IDS: Record<string, number> = {
  fr: 17,
  en: 18,
  es: 19,
  pt: 20,
  ht: 21,
}

export async function POST(request: Request) {
  if (!verifierSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { email, nom, langue } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const languesValides = ['fr', 'en', 'es', 'pt', 'ht']
    const langueFinale   = languesValides.includes(langue) ? langue : 'fr'
    const templateId     = TEMPLATE_IDS[langueFinale]
    const nomAffiche      = nom || email.split('@')[0]

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: { name: 'Lotbo', email: 'hello@lotbo.app' },
        to:     [{ email, name: nomAffiche }],
        templateId,
        params: {
          PRENOM: nomAffiche,
        },
      }),
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
