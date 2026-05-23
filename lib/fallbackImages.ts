const FALLBACK_DEFAULT = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80'

export const FALLBACK_IMAGES: Record<string, string> = {
  'Festival':              'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
  'Concert / Spectacle':  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  'Musique':               'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
  'Tournoi / Compétition':'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  'Sport':                 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80',
  'Gastronomie':           'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  'Art':                   'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80',
  'Conférence / Sommet':  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  'Conference':            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  'Formation / Séminaire':'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80',
  'Culture':               'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80',
  'Autre':                 FALLBACK_DEFAULT,
}

export function getEventImage(imageUrl: string | null | undefined, categorie: string): string {
  return imageUrl || FALLBACK_IMAGES[categorie] || FALLBACK_DEFAULT
}
