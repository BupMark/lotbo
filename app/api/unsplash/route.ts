import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CATEGORIE_QUERIES: Record<string, string> = {
  'Concert / Spectacle':          'concert music live',
  'Festival':                     'festival crowd celebration',
  'Conférence / Sommet':          'conference business meeting',
  'Foire / Exposition':           'exhibition fair expo',
  'Tournoi / Compétition':        'sports competition tournament',
  'Inauguration / Lancement':     'launch event celebration',
  'Assemblée / Réunion':          'meeting assembly community',
  'Formation / Séminaire':        'seminar training workshop',
  'Célébration communautaire':    'community celebration culture',
  'Culte / Cérémonie religieuse': 'ceremony church spiritual',
  'Droit / Juridique':            'law justice legal',
  'Loisir':                       'leisure fun activity',
}

const THEME_QUERIES: Record<string, string> = {
  // Religion
  'Célébration islamique':          'islamic celebration mosque',
  'Cérémonie vodou/traditionnelle': 'traditional ceremony ritual',
  'Croisade/Réveil':                'christian revival crusade',
  'Louange/Adoration':              'worship praise church',
  'Messe/Culte':                    'church mass service',
  'Pèlerinage':                     'pilgrimage religious journey',
  // Business
  'Conférence entrepreneuriale':    'entrepreneur conference business',
  'Forum emploi/Recrutement':       'job fair recruitment',
  'Investissement/Pitch':           'startup pitch investors',
  'Lancement de produit':           'product launch event',
  'Promotions/Soldes':              'sale shopping retail',
  'Réseautage':                     'business networking event',
  'Salon professionnel':            'trade show professional',
  // Culture
  'Artisanat traditionnel':         'traditional craft handmade',
  'Comédie/Stand-up':               'stand up comedy show',
  'Danse':                          'dance performance',
  'Fête/Carnaval':                  'carnival street festival',
  'Littérature/Poésie':             'poetry literature reading',
  'Musique traditionnelle':         'traditional music instruments',
  'Patrimoine/Histoire':            'heritage history museum',
  'Théâtre':                        'theater stage performance',
  // Gastronomie
  'Cours de cuisine':               'cooking class kitchen',
  'Dégustation':                    'food tasting wine',
  'Food truck/Street food':         'food truck street food',
  'Marché/Foire':                   'market fair stalls',
  // Art
  'Exposition/Vernissage':          'art exhibition gallery',
  'Graffiti/Art urbain':            'street art graffiti',
  'Performance artistique':         'art performance live',
  // Sport
  'Basketball':                     'basketball game court',
  'Boxe/Arts martiaux':             'boxing martial arts',
  'Course/Marathon/Athlétisme':     'marathon running race',
  'Cyclisme':                       'cycling bike race',
  'Football':                       'soccer football match',
  'Natation':                       'swimming pool competition',
  'Tennis':                         'tennis court match',
  'Tournoi/Compétition':            'sports tournament competition',
  'Volleyball':                     'volleyball game court',
  // Technologie
  'Cybersécurité':                  'cybersecurity technology',
  'Développement/Code':             'coding programming developer',
  'Intelligence artificielle':      'artificial intelligence technology',
  'Jeu vidéo':                      'video game esports',
  'Startup/Innovation':             'startup innovation tech',
  // Éducation
  'Atelier/Formation':              'workshop training education',
  "Bourse d'études":                'scholarship graduation students',
  'Cérémonie/Remise de prix':       'award ceremony trophy',
  'Concours scientifique':          'science fair competition',
  'Conférence académique':          'academic conference lecture',
  'Débat':                          'debate discussion panel',
  // Social
  'Bénévolat':                      'volunteering community service',
  'Cérémonie/Rite':                 'ceremony ritual gathering',
  'Collecte de fonds':              'fundraising charity event',
  'Communautaire de quartier':      'neighborhood community gathering',
  'Rencontre communautaire/Diaspora':'diaspora community gathering',
  'Rencontre/Networking social':    'social meetup networking',
  // Musique
  'Concert':                        'concert live music stage',
  'DJ set/Électro':                 'dj electronic music party',
  'Gospel/Louange':                 'gospel choir worship music',
  'Karaoké':                        'karaoke singing night',
  'Musique live/Acoustique':        'acoustic live music',
  // Cinéma
  'Festival de film':               'film festival cinema',
  'Projection':                     'movie screening cinema',
  'Web série/Court-métrage':        'short film indie',
  // Mode
  'Défilé/Fashion show':            'fashion show runway',
  'Pop-up boutique':                'pop up shop boutique',
  // Santé
  'Bien-être/Yoga':                 'yoga wellness meditation',
  'Sensibilisation médicale':       'health awareness medical',
  'Sport-santé':                    'fitness health sport',
  // Environnement
  'Nettoyage/Reboisement':          'reforestation cleanup nature',
  'Sensibilisation écologique':     'environmental awareness ecology',
}

interface UnsplashPhoto {
  url: string
  thumb: string
  author: string
  authorLink: string
}

export async function GET(request: NextRequest) {
  const q         = request.nextUrl.searchParams.get('q')         || 'event'
  const categorie = request.nextUrl.searchParams.get('categorie') || ''
  const theme     = request.nextUrl.searchParams.get('theme')     || ''
  const count     = Math.min(parseInt(request.nextUrl.searchParams.get('count') || '3'), 6)

  // Priorité : thème (le plus précis) > catégorie > mot-clé libre (titre)
  const searchQuery = THEME_QUERIES[theme] || CATEGORIE_QUERIES[categorie] || q

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high&count=${count}`,
      {
        headers: { 'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
        next: { revalidate: 0 },
      }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash error', photos: [] }, { status: 500 })
    }
    const data = await res.json()
    const items: UnsplashPhoto[] = (Array.isArray(data) ? data : [data]).map((item: {
      urls?: { regular?: string; thumb?: string }
      user?: { name?: string; links?: { html?: string } }
    }) => ({
      url:        item.urls?.regular   || '',
      thumb:      item.urls?.thumb     || '',
      author:     item.user?.name      || '',
      authorLink: item.user?.links?.html || '',
    }))
    return NextResponse.json({ photos: items }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch {
    return NextResponse.json({ error: 'Fetch failed', photos: [] }, { status: 500 })
  }
}
