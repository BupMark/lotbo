import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const OUTIL_RECHERCHE_EVENEMENTS = {
  name: 'rechercher_evenements',
  description: "Recherche des événements réels sur LOTBO par ville, catégorie et/ou période. Utilise cet outil dès que l'utilisateur demande des événements concrets (ex: 'quoi faire à Jacmel ce soir', 'des concerts cette semaine').",
  input_schema: {
    type: 'object' as const,
    properties: {
      ville: { type: 'string', description: 'Nom de la ville, optionnel' },
      categorie: { type: 'string', description: 'Catégorie (Concert / Spectacle, Festival, Sport, etc.), optionnel' },
      limite: { type: 'number', description: 'Nombre max de résultats, défaut 8' },
    },
  },
}

async function executerRechercheEvenements(input: { ville?: string; categorie?: string; limite?: number }) {
  const admin = makeAdminClient()
  const aujourdhui = new Date().toISOString().split('T')[0]

  let requete = admin
    .from('evenements')
    .select('titre, date_debut, date, lieu, ville, categorie')
    .eq('statut', 'approuve')
    .or(`date_fin.gte.${aujourdhui},and(date_fin.is.null,date_debut.gte.${aujourdhui})`)
    .order('date_debut', { ascending: true })
    .limit(input.limite ?? 8)

  if (input.ville) requete = requete.ilike('ville', `%${input.ville}%`)
  if (input.categorie) requete = requete.ilike('categorie', `%${input.categorie}%`)

  const { data } = await requete
  return data ?? []
}

const PROMPTS_SYSTEME: Record<string, string> = {
  fr: `Tu es l'assistant guide de LOTBO, une plateforme de découverte d'événements ("Tous les événements, un seul endroit"). Tu es un guide touristique et culturel, pas un assistant générique. Ton rôle : aider à découvrir des événements et des lieux, avec une vraie sensibilité culturelle (histoire, traditions, contexte local). Réponds toujours en français, de façon concise et chaleureuse. Utilise l'outil de recherche d'événements dès qu'on te demande des événements concrets — ne invente jamais d'événements. LOTBO est une couche de découverte pure : jamais de billetterie, jamais de garantie sur la tenue des événements.`,
  en: `You are LOTBO's guide assistant, an event discovery platform ("All events, one place"). You're a cultural tourist guide, not a generic assistant. Your role: help discover events and places, with real cultural sensitivity (history, traditions, local context). Always reply in English, concisely and warmly. Use the event search tool whenever asked about concrete events — never invent events. LOTBO is a pure discovery layer: never ticketing, never a guarantee events will take place.`,
  es: `Eres el asistente guía de LOTBO, una plataforma de descubrimiento de eventos ("Todos los eventos, un solo lugar"). Eres un guía turístico y cultural, no un asistente genérico. Tu papel: ayudar a descubrir eventos y lugares, con verdadera sensibilidad cultural. Responde siempre en español, de forma concisa y cálida. Usa la herramienta de búsqueda de eventos cuando te pregunten por eventos concretos — nunca inventes eventos. LOTBO es una capa de descubrimiento pura: nunca venta de entradas, nunca garantía de que los eventos se realicen.`,
  pt: `Você é o assistente guia do LOTBO, uma plataforma de descoberta de eventos ("Todos os eventos, um só lugar"). Você é um guia turístico e cultural, não um assistente genérico. Seu papel: ajudar a descobrir eventos e lugares, com verdadeira sensibilidade cultural. Responda sempre em português, de forma concisa e calorosa. Use a ferramenta de busca de eventos sempre que perguntarem sobre eventos concretos — nunca invente eventos. LOTBO é uma camada de descoberta pura: nunca venda de ingressos, nunca garantia de que os eventos vão acontecer.`,
  ht: `Ou se asistan gid LOTBO, yon platfòm pou dekouvri evènman ("Tout evènman yo, yon sèl kote"). Ou se yon gid touristik ak kiltirèl, pa yon asistan jeneral. Wòl ou: ede moun dekouvri evènman ak kote, ak yon vrè sansiblite kiltirèl. Reponn toujou an kreyòl ayisyen, dirèk ak fanmilyè. Sèvi ak zouti rechèch evènman an chak fwa yon moun mande evènman konkrè — pa janm envante evènman. LOTBO se yon platfòm dekouvèt sèlman: pa gen vant tikè, pa gen garanti evènman yo ap fèt.`,
}

export async function POST(request: Request) {
  try {
    const { messages, langue } = await request.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      langue?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }

    const aujourdhuiTexte = new Date().toISOString().split('T')[0]
    const systemPrompt = `${PROMPTS_SYSTEME[langue ?? 'fr'] ?? PROMPTS_SYSTEME.fr}\n\nDate d'aujourd'hui : ${aujourdhuiTexte}. Si l'outil de recherche ne retourne aucun résultat, dis-le clairement et simplement — ne mentionne jamais de dates ou de mois précis que tu n'as pas vus dans les résultats réels de l'outil.`

    const appelClaude = async (msgs: unknown[]) => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt,
          tools: [OUTIL_RECHERCHE_EVENEMENTS],
          messages: msgs,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('[loyita-chat] Anthropic error:', err)
        throw new Error('Service temporairement indisponible')
      }
      return res.json()
    }

    let conversationMessages: unknown[] = messages.map(m => ({ role: m.role, content: m.content }))
    let data = await appelClaude(conversationMessages)

    // Boucle tool_use — un seul aller-retour suffit pour ce cas d'usage
    if (data.stop_reason === 'tool_use') {
      const toolUseBlock = (data.content as { type: string; id: string; name: string; input: Record<string, unknown> }[])
        .find(b => b.type === 'tool_use')

      if (toolUseBlock) {
        const resultats = await executerRechercheEvenements(toolUseBlock.input as { ville?: string; categorie?: string; limite?: number })

        conversationMessages = [
          ...conversationMessages,
          { role: 'assistant', content: data.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(resultats),
            }],
          },
        ]

        data = await appelClaude(conversationMessages)
      }
    }

    const texteBlock = (data.content as { type: string; text?: string }[]).find(b => b.type === 'text')
    const reponse = texteBlock?.text ?? ''

    return NextResponse.json({ success: true, reponse })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
