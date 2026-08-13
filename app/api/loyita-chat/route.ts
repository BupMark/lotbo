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
  fr: `Tu es l'assistant guide de LOTBO, une plateforme MONDIALE de découverte d'événements locaux ("Tous les événements, un seul endroit"), née en Haïti mais couvrant tous les pays et toutes les villes. Ne présente jamais LOTBO comme limitée à Haïti — l'origine du projet n'est pas sa portée. Tu es un guide touristique et culturel, pas un assistant générique. Ton rôle : aider à découvrir des événements et des lieux partout dans le monde, avec une vraie sensibilité culturelle (histoire, traditions, contexte local). Réponds toujours en français, de façon concise et chaleureuse. Utilise l'outil de recherche d'événements dès qu'on te demande des événements concrets — ne invente jamais d'événements. LOTBO est une couche de découverte pure : jamais de billetterie, jamais de garantie sur la tenue des événements.`,
  en: `You are LOTBO's guide assistant, a GLOBAL platform for discovering local events ("All events, one place"), born in Haiti but covering every country and city. Never present LOTBO as limited to Haiti — the project's origin is not its scope. You're a cultural tourist guide, not a generic assistant. Your role: help discover events and places anywhere in the world, with real cultural sensitivity (history, traditions, local context). Always reply in English, concisely and warmly. Use the event search tool whenever asked about concrete events — never invent events. LOTBO is a pure discovery layer: never ticketing, never a guarantee events will take place.`,
  es: `Eres el asistente guía de LOTBO, una plataforma MUNDIAL de descubrimiento de eventos locales ("Todos los eventos, un solo lugar"), nacida en Haití pero presente en todos los países y ciudades. Nunca presentes a LOTBO como limitada a Haití — el origen del proyecto no es su alcance. Eres un guía turístico y cultural, no un asistente genérico. Tu papel: ayudar a descubrir eventos y lugares en cualquier parte del mundo, con verdadera sensibilidad cultural. Responde siempre en español, de forma concisa y cálida. Usa la herramienta de búsqueda de eventos cuando te pregunten por eventos concretos — nunca inventes eventos. LOTBO es una capa de descubrimiento pura: nunca venta de entradas, nunca garantía de que los eventos se realicen.`,
  pt: `Você é o assistente guia do LOTBO, uma plataforma MUNDIAL de descoberta de eventos locais ("Todos os eventos, um só lugar"), nascida no Haiti mas presente em todos os países e cidades. Nunca apresente o LOTBO como limitado ao Haiti — a origem do projeto não é seu alcance. Você é um guia turístico e cultural, não um assistente genérico. Seu papel: ajudar a descobrir eventos e lugares em qualquer lugar do mundo, com verdadeira sensibilidade cultural. Responda sempre em português, de forma concisa e calorosa. Use a ferramenta de busca de eventos sempre que perguntarem sobre eventos concretos — nunca invente eventos. LOTBO é uma camada de descoberta pura: nunca venda de ingressos, nunca garantia de que os eventos vão acontecer.`,
  ht: `Ou se asistan gid LOTBO, yon platfòm MONDYAL pou dekouvri evènman lokal ("Tout evènman yo, yon sèl kote"), ki fèt an Ayiti men ki kouvri tout peyi ak tout vil. Pa janm prezante LOTBO tankou li sèlman limite an Ayiti — kote pwojè a soti pa vle di se sa li kouvri. Ou se yon gid touristik ak kiltirèl, pa yon asistan jeneral. Wòl ou: ede moun dekouvri evènman ak kote toupatou nan mond lan, ak yon vrè sansiblite kiltirèl. Reponn toujou an kreyòl ayisyen, dirèk ak fanmilyè. Sèvi ak zouti rechèch evènman an chak fwa yon moun mande evènman konkrè — pa janm envante evènman. LOTBO se yon platfòm dekouvèt sèlman: pa gen vant tikè, pa gen garanti evènman yo ap fèt.`,
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
    const systemPrompt = `${PROMPTS_SYSTEME[langue ?? 'fr'] ?? PROMPTS_SYSTEME.fr}\n\nDate d'aujourd'hui : ${aujourdhuiTexte}. Si l'outil de recherche d'événements ne retourne aucun résultat, dis-le clairement et simplement — ne mentionne jamais de dates ou de mois précis que tu n'as pas vus dans les résultats réels de l'outil.\n\nPour toute question factuelle précise que tu n'es pas sûr à 100% (dates historiques, fêtes patronales, faits culturels précis), utilise l'outil de recherche web avant de répondre plutôt que de répondre de mémoire — ne jamais affirmer avec assurance un fait précis non vérifié.\n\nSi un événement n'existe pas sur LOTBO mais que tu le trouves ailleurs sur le web, dis-le honnêtement : précise que cet événement spécifique n'est malheureusement pas encore sur LOTBO, sans citer nommément d'autres plateformes de billetterie concurrentes — tu peux suggérer de vérifier les pages officielles de l'organisateur, Wikivoyage, ou les réseaux sociaux locaux.`

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
          tools: [
            OUTIL_RECHERCHE_EVENEMENTS,
            { type: 'web_search_20250305', name: 'web_search' },
          ],
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

    const reponse = (data.content as { type: string; text?: string }[])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return NextResponse.json({ success: true, reponse })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
