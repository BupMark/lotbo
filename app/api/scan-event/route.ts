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
- Pour les dates, utilise le format YYYY-MM-DD.
- Pour les heures, utilise le format HH:MM.
- Pour "organisateur" : nom de l'organisation, association, artiste ou personne qui organise.
- Pour "categorie" : type d'événement parmi — Concert, Festival, Conférence, Exposition, Formation, Tournoi, Culte, Assemblée, Inauguration, Célébration.
- Pour "est_recurrent" : true si l'affiche mentionne une répétition (ex: "tous les vendredis", "chaque semaine", "every Sunday", "chaque mois", "tous les dimanches", "hebdomadaire", "weekly", "monthly", "każdy piątek" etc.). false si c'est un événement unique.
- Pour "type_recurrence" : "quotidien" si chaque jour, "hebdomadaire" si chaque semaine, "mensuel" si chaque mois, "annuel" si chaque année. null si est_recurrent = false.
- Pour "jours_semaine" : tableau des jours concernés si hebdomadaire (ex: ["vendredi"], ["lundi", "mercredi"], ["sunday"]). null si pas hebdomadaire ou pas précisé.
- Pour "lieu" : nom exact du bâtiment, salle ou espace (ex: "Hôtel Karibe", "Stade Sylvio Cator").
- Pour "adresse" : numéro et rue uniquement, pas la ville.
- Pour "description" : résume l'événement en 2-3 phrases si pas de texte explicite.
- Si une information n'est pas visible sur l'image, retourne null pour ce champ.
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
      // Limiter à 5 occurrences si récurrent sans date de fin
      if (parsed.est_recurrent && !parsed.date_fin) {
        parsed.occurrences_max = 5
      } else {
        parsed.occurrences_max = null
      }
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
