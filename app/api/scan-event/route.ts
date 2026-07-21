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

RÈGLE RGPD OBLIGATOIRE — Protection des données personnelles :
Après extraction du texte de l'image, analyse le contenu extrait et :

1. Détecte les données personnelles de contact potentielles :
   - Numéros de téléphone (formats internationaux variés : +509, 09, 07, etc.)
   - Adresses email personnelles (ex: jean.dupont@gmail.com)
   - Adresses postales personnelles

2. Pour chaque donnée détectée :
   - Masque-la dans les champs texte avec [CONTACT MASQUÉ]
   - Signale-la dans le champ "donnees_masquees"

3. Distingue :
   - Email/téléphone personnel → MASQUER
   - Site web officiel d'un événement ou organisation → CONSERVER dans lien_officiel
   - Page réseau social officielle (Facebook, Instagram) → CONSERVER dans lien_officiel
   - Numéro de téléphone d'un lieu public (restaurant, salle de spectacle) → CONSERVER
   - Email institutionnel d'une organisation → CONSERVER

4. En cas de doute → MASQUER. Principe : protection par défaut.

Analyse cette image et détermine si elle contient UN ou PLUSIEURS événements DISTINCTS.

RÈGLE CRITIQUE — Distinguer event multi-jours vs events distincts :
- Un événement qui dure plusieurs jours consécutifs (ex: "du 10 au 15 juin") = UN SEUL événement avec date_debut + date_fin → mode "single"
- Un événement récurrent (ex: "tous les dimanches", "chaque semaine") = UN SEUL événement avec est_recurrent: true → mode "single"
- Plusieurs événements avec des TITRES DIFFÉRENTS = mode "multi"
- Un programme/calendrier avec des activités DIFFÉRENTES à des dates différentes = mode "multi"
- Si tu hésites entre single et multi → choisis TOUJOURS single

Retourne UNIQUEMENT ce JSON :
{
  "mode": "single" | "multi",
  "alerte_rgpd": boolean,
  "donnees_masquees": [
    {
      "type": "telephone" | "email" | "adresse",
      "position": string
    }
  ],
  "events": [
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
  ]
}

Instructions :
- Nous sommes aujourd'hui le ${new Date().toISOString().slice(0, 10)}.
- Pour les dates, utilise le format YYYY-MM-DD.
- Si l'année n'est pas explicitement visible sur l'affiche, déduis l'année la PLUS PROCHE dans le futur par rapport à aujourd'hui (jamais une date déjà passée), sauf si le contexte de l'affiche indique clairement une date passée (ex: compte-rendu d'un événement déjà tenu).
- Si le jour de la semaine et la date du mois semblent incohérents entre eux, privilégie la date explicite du mois plutôt que le jour de la semaine.
- Pour les heures, utilise le format HH:MM
- Pour "categorie" : Concert, Festival, Conférence, Exposition, Formation, Tournoi, Culte, Assemblée, Inauguration, Célébration
- Pour "lieu" : nom exact du bâtiment ou espace
- Si plusieurs événements partagent le même lieu/organisateur, répète l'info dans chaque événement
- Maximum 20 événements par document
- alerte_rgpd: true si au moins une donnée a été masquée, false sinon
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
      const events: Record<string, unknown>[] = Array.isArray(parsed.events) ? parsed.events : []

      // Correction date passée — probable erreur d'extraction (année manquante sur l'affiche)
      const aujourdhui = new Date().toISOString().slice(0, 10)
      for (const ev of events) {
        const dateDebut = ev.date_debut
        if (typeof dateDebut === 'string') {
          let d = dateDebut
          while (d < aujourdhui) {
            const [annee, mois, jour] = d.split('-')
            d = `${parseInt(annee, 10) + 1}-${mois}-${jour}`
          }
          ev.date_debut = d
        }
        const dateFin = ev.date_fin
        if (typeof dateFin === 'string') {
          let f = dateFin
          while (f < aujourdhui) {
            const [anneeFin, moisFin, jourFin] = f.split('-')
            f = `${parseInt(anneeFin, 10) + 1}-${moisFin}-${jourFin}`
          }
          ev.date_fin = f
        }
      }

      const firstEvent = events[0] as Record<string, unknown> | undefined
      return NextResponse.json({
        success:         true,
        mode:            parsed.mode || 'single',
        alerte_rgpd:     parsed.alerte_rgpd ?? false,
        donnees_masquees: parsed.donnees_masquees ?? [],
        data:            firstEvent || parsed,
        events,
        occurrences_max: firstEvent && firstEvent.est_recurrent && !firstEvent.date_fin ? 5 : null,
      })
    } catch {
      console.error('[scan-event] JSON parse error:', text)
      return NextResponse.json({ success: true, mode: 'single', alerte_rgpd: false, donnees_masquees: [], data: {}, events: [], occurrences_max: null })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
