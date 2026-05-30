import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Tu es un assistant qui extrait les informations d'événements depuis des affiches ou flyers.
Analyse cette image et extrais UNIQUEMENT les informations suivantes en JSON :
{
  "titre": string | null,
  "date_debut": string | null,
  "date_fin": string | null,
  "heure_debut": string | null,
  "heure_fin": string | null,
  "lieu": string | null,
  "ville": string | null,
  "pays": string | null,
  "description": string | null,
  "prix": "gratuit" | "payant" | null,
  "lien_officiel": string | null
}
Pour les dates, utilise le format YYYY-MM-DD.
Pour les heures, utilise le format HH:MM.
Si une information n'est pas visible sur l'image, retourne null pour ce champ.
Réponds UNIQUEMENT avec le JSON — aucun texte autour.`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[scan-event] Anthropic error:', err)
      return NextResponse.json({ error: 'Service temporairement indisponible' }, { status: 503 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return NextResponse.json({ success: true, data: parsed })
    } catch {
      console.error('[scan-event] JSON parse error:', text)
      return NextResponse.json({ success: true, data: {} })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
