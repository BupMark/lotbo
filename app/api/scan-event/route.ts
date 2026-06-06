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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
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
                text: `Tu es un assistant qui extrait les informations d'événements depuis des affiches, flyers ou calendriers.

Analyse cette image et détermine si elle contient UN ou PLUSIEURS événements DISTINCTS.

RÈGLE CRITIQUE — Distinguer event multi-jours vs events distincts :
- Un événement qui dure plusieurs jours consécutifs (ex: "du 10 au 15 juin") = UN SEUL événement avec date_debut + date_fin → mode "single"
- Un événement récurrent (ex: "tous les dimanches", "chaque semaine") = UN SEUL événement avec est_recurrent: true → mode "single"
- Plusieurs événements avec des TITRES DIFFÉRENTS = mode "multi"
- Un programme/calendrier avec des activités DIFFÉRENTES à des dates différentes = mode "multi"
- Si tu hésites entre single et multi → choisis TOUJOURS single

Si UN seul événement (ou event multi-jours ou récurrent), retourne :
{
  "mode": "single",
  "events": [{ ...champs habituels... }]
}

Si PLUSIEURS événements DISTINCTS avec titres différents, retourne :
{
  "mode": "multi",
  "events": [
    { ...champs event 1... },
    { ...champs event 2... }
  ]
}

Chaque événement dans le tableau "events" contient :
{
  "titre": string | null,
  "organisateur": string | null,
  "date_debut": string | null,
  "date_fin": string | null,
  "heure_debut": string | null,
  "heure_fin": string | null,
  "lieu": string | null,
  "adresse": string | null,
  "ville": string | null,
  "pays": string | null,
  "description": string | null,
  "categorie": string | null,
  "prix": "gratuit" | "payant" | null,
  "lien_officiel": string | null,
  "est_recurrent": boolean,
  "type_recurrence": "quotidien" | "hebdomadaire" | "mensuel" | "annuel" | null,
  "jours_semaine": string[] | null
}

Instructions :
- Pour les dates, utilise le format YYYY-MM-DD
- Pour les heures, utilise le format HH:MM
- Pour "categorie" : Concert, Festival, Conférence, Exposition, Formation, Tournoi, Culte, Assemblée, Inauguration, Célébration
- Pour "lieu" : nom exact du bâtiment ou espace
- Si plusieurs événements partagent le même lieu/organisateur, répète l'info dans chaque événement
- Maximum 20 événements par document
- Réponds UNIQUEMENT avec le JSON — aucun texte autour`,
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
      const events: unknown[] = parsed.events || []
      const firstEvent = events[0] as Record<string, unknown> | undefined
      return NextResponse.json({
        success: true,
        mode: parsed.mode || 'single',
        data: firstEvent || parsed,
        events,
        occurrences_max: firstEvent && firstEvent.est_recurrent && !firstEvent.date_fin ? 5 : null,
      })
    } catch {
      console.error('[scan-event] JSON parse error:', text)
      return NextResponse.json({ success: true, mode: 'single', data: {}, events: [], occurrences_max: null })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
