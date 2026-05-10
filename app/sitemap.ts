export default async function sitemap() {
    let evenements: { id: string }[] = []
  
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL + 
        '/rest/v1/evenements?statut=eq.approuve&select=id&limit=500'
      
      const res = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          'Authorization': 'Bearer ' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''),
        },
        next: { revalidate: 3600 }
      })
  
      if (res.ok) {
        evenements = await res.json()
      }
    } catch {
      evenements = []
    }
  
    const pagesStatiques = [
      { url: 'https://app.lotbo.app', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
      { url: 'https://app.lotbo.app/ajouter', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
      { url: 'https://app.lotbo.app/apropos', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: 'https://app.lotbo.app/inscription', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    ]
  
    const pagesEvenements = Array.isArray(evenements) ? evenements.map(ev => ({
      url: `https://app.lotbo.app/evenement/${ev.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) : []
  
    return [...pagesStatiques, ...pagesEvenements]
  }