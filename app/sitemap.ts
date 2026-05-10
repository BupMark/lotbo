import { createClient } from '@supabase/supabase-js'

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: evenements } = await supabase
    .from('evenements')
    .select('id, updated_at')
    .eq('statut', 'approuve')

  const pagesStatiques = [
    {
      url: 'https://app.lotbo.app',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://app.lotbo.app/ajouter',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: 'https://app.lotbo.app/apropos',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: 'https://app.lotbo.app/inscription',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  const pagesEvenements = (evenements || []).map(ev => ({
    url: `https://app.lotbo.app/evenement/${ev.id}`,
    lastModified: new Date(ev.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...pagesStatiques, ...pagesEvenements]
}