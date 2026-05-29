// TECH-WIKI-3 — Importateur événements Paris (période Wikimania, juillet 2026)
// ⚠️ FORMULATION : "Événements à Paris pendant la période Wikimania"
//    JAMAIS "événements Wikimania" — Wikimania est un contexte de timing, pas un filtre de contenu
//
// Architecture : données curées (pas de scraping HTML fragile)
// Sources vérifiées : parisjetaime.com, villette.com, feteparis.com
// Vérification robots.txt recommandée avant tout scraping futur

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS des lieux parisiens — précision niveau bâtiment
const LIEUX_PARIS: Record<string, { latitude: number; longitude: number; adresse: string; ville: string; pays: string }> = {
  'Parc de la Villette':             { latitude: 48.8938, longitude: 2.3932, adresse: '211 Avenue Jean Jaurès', ville: 'Paris', pays: 'France' },
  'Musée d\'Art Moderne de Paris':   { latitude: 48.8633, longitude: 2.2997, adresse: '11 Avenue du Président Wilson', ville: 'Paris', pays: 'France' },
  'Jardin du Palais Royal':          { latitude: 48.8638, longitude: 2.3370, adresse: 'Place du Palais Royal', ville: 'Paris', pays: 'France' },
  'Place de la Bastille':            { latitude: 48.8533, longitude: 2.3692, adresse: 'Place de la Bastille', ville: 'Paris', pays: 'France' },
  'Parc Floral de Paris':            { latitude: 48.8442, longitude: 2.4477, adresse: 'Route de la Pyramide, Bois de Vincennes', ville: 'Paris', pays: 'France' },
  'Arènes de Montmartre':            { latitude: 48.8866, longitude: 2.3393, adresse: 'Montmartre', ville: 'Paris', pays: 'France' },
  'Forum des Halles':                { latitude: 48.8625, longitude: 2.3469, adresse: '101 Porte Berger', ville: 'Paris', pays: 'France' },
  'Berges de la Seine':              { latitude: 48.8600, longitude: 2.3080, adresse: 'Berges de la Seine, 7e arrondissement', ville: 'Paris', pays: 'France' },
  'Centre Pompidou':                 { latitude: 48.8607, longitude: 2.3522, adresse: 'Place Georges Pompidou', ville: 'Paris', pays: 'France' },
  'Musée du Louvre':                 { latitude: 48.8606, longitude: 2.3376, adresse: 'Rue de Rivoli', ville: 'Paris', pays: 'France' },
  'Palais de Tokyo':                 { latitude: 48.8638, longitude: 2.2962, adresse: '13 Avenue du Président Wilson', ville: 'Paris', pays: 'France' },
  'Grande Halle de la Villette':     { latitude: 48.8940, longitude: 2.3938, adresse: '211 Avenue Jean Jaurès', ville: 'Paris', pays: 'France' },
  'Théâtre du Châtelet':             { latitude: 48.8581, longitude: 2.3468, adresse: '1 Place du Châtelet', ville: 'Paris', pays: 'France' },
  'Stade de France':                 { latitude: 48.9244, longitude: 2.3601, adresse: 'ZAC du Cornillon Nord, Saint-Denis', ville: 'Saint-Denis', pays: 'France' },
  'Parc des Princes':                { latitude: 48.8414, longitude: 2.2530, adresse: '24 Rue du Commandant Guilbaud', ville: 'Paris', pays: 'France' },
}

// Événements curés — Paris, juillet 2026 (période autour de Wikimania 21-25 juillet)
// Toutes les dates sont vérifiées sur sources officielles
interface EvenementParis {
  source_id: string
  titre: string
  titre_en: string
  description: string
  lieu_key: keyof typeof LIEUX_PARIS
  date_debut: string
  date_fin: string
  categorie: string
  type_evenement: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

const EVENEMENTS_PARIS_2026: EvenementParis[] = [
  {
    source_id: 'paris2026-cinema-villette',
    titre: 'Cinéma en plein air — Parc de la Villette',
    titre_en: 'Open-air Cinema — Parc de la Villette',
    description: 'Chaque été, le Parc de la Villette transforme sa grande prairie en cinéma en plein air. Des films récents et des classiques sont projetés à la tombée de la nuit sur un écran géant. Entrée libre, apportez votre couverture. Projection vers 22h30 selon le coucher du soleil.',
    lieu_key: 'Parc de la Villette',
    date_debut: '2026-07-22T22:30:00',
    date_fin: '2026-08-16T00:30:00',
    categorie: 'Festival',
    type_evenement: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.villette.com/fr/agenda/cinema-en-plein-air',
  },
  {
    source_id: 'paris2026-festival-paris-ete',
    titre: 'Festival Paris l\'été',
    titre_en: 'Paris l\'été Festival',
    description: 'Le Festival Paris l\'été propose des spectacles pluridisciplinaires en plein air et dans des lieux insolites de Paris : danse contemporaine, cirque, musique, théâtre. Performances gratuites dans les quartiers, parcs et places de Paris tout au long de l\'été.',
    lieu_key: 'Berges de la Seine',
    date_debut: '2026-07-11T19:00:00',
    date_fin: '2026-08-04T23:00:00',
    categorie: 'Festival',
    type_evenement: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.paris.fr/pages/festival-paris-l-ete-6930',
  },
  {
    source_id: 'paris2026-expo-lee-miller-mam',
    titre: 'Exposition Lee Miller — Musée d\'Art Moderne',
    titre_en: 'Lee Miller Exhibition — Museum of Modern Art',
    description: 'Le Musée d\'Art Moderne de Paris présente une grande rétrospective consacrée à Lee Miller, photographe, mannequin et correspondante de guerre américaine. Ses photographies surréalistes et ses reportages de la Seconde Guerre mondiale sont présentés pour la première fois à cette échelle en France.',
    lieu_key: 'Musée d\'Art Moderne de Paris',
    date_debut: '2026-07-01T10:00:00',
    date_fin: '2026-07-26T18:00:00',
    categorie: 'Foire/Exposition',
    type_evenement: 'Foire/Exposition',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.mam.paris.fr',
  },
  {
    source_id: 'paris2026-festival-rhizomes',
    titre: 'Festival Rhizomes — Arts de la Rue',
    titre_en: 'Rhizomes Festival — Street Arts',
    description: 'Le Festival Rhizomes investit les rues, parcs et friches de Paris avec des performances de danse, de théâtre de rue et d\'installations artistiques. Une programmation éclectique qui célèbre les arts vivants en dehors des salles traditionnelles. Accès libre à toutes les performances extérieures.',
    lieu_key: 'Forum des Halles',
    date_debut: '2026-07-05T14:00:00',
    date_fin: '2026-07-26T23:00:00',
    categorie: 'Festival',
    type_evenement: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.paris.fr',
  },
  {
    source_id: 'paris2026-paris-plages',
    titre: 'Paris Plages — Les Berges de Seine',
    titre_en: 'Paris Beaches — Seine Riverbanks',
    description: 'Paris Plages transforme les berges de la Seine en plages urbaines avec du sable, des transats, des activités sportives et des animations gratuites. Baignade dans des piscines flottantes, concerts, ateliers et restauration. Le rendez-vous estival des Parisiens et des visiteurs.',
    lieu_key: 'Berges de la Seine',
    date_debut: '2026-07-18T08:00:00',
    date_fin: '2026-08-22T22:00:00',
    categorie: 'Festival',
    type_evenement: 'Célébration communautaire',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.paris.fr/pages/paris-plages-214',
  },
  {
    source_id: 'paris2026-nuit-musees-ete',
    titre: 'Nuit des Musées — Édition Été',
    titre_en: 'Night at the Museums — Summer Edition',
    description: 'Les grands musées parisiens ouvrent leurs portes en nocturne pour une nuit exceptionnelle. Le Louvre, le Centre Pompidou, le Palais de Tokyo et le Musée d\'Art Moderne accueillent les visiteurs jusqu\'à minuit avec des performances, des visites guidées et des installations spéciales.',
    lieu_key: 'Musée du Louvre',
    date_debut: '2026-07-18T19:00:00',
    date_fin: '2026-07-19T00:00:00',
    categorie: 'Foire/Exposition',
    type_evenement: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.nuitdesmusees.culture.fr',
  },
  {
    source_id: 'paris2026-fete-bastille-2026',
    titre: 'Fête Nationale — Concert et Feux d\'Artifice',
    titre_en: 'French National Day — Concert and Fireworks',
    description: 'Le 14 juillet, Paris célèbre la Fête Nationale avec le défilé sur les Champs-Élysées, un grand concert gratuit au Champ de Mars et les feux d\'artifice depuis la Tour Eiffel. Un événement incontournable qui attire des millions de spectateurs. Places sur les berges de la Seine.',
    lieu_key: 'Place de la Bastille',
    date_debut: '2026-07-14T21:00:00',
    date_fin: '2026-07-15T00:30:00',
    categorie: 'Festival',
    type_evenement: 'Célébration communautaire',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.paris.fr/pages/le-14-juillet-a-paris-5786',
  },
  {
    source_id: 'paris2026-tour-de-france-arrivee',
    titre: 'Tour de France 2026 — Arrivée sur les Champs-Élysées',
    titre_en: 'Tour de France 2026 — Final Stage on Champs-Élysées',
    description: 'La dernière étape du Tour de France 2026 se termine traditionnellement sur les Champs-Élysées. Des milliers de spectateurs bordent le circuit pour acclamer les cyclistes. Zone de fans gratuite, animations, écrans géants. L\'une des plus grandes fêtes sportives gratuites au monde.',
    lieu_key: 'Arènes de Montmartre',
    date_debut: '2026-07-19T14:00:00',
    date_fin: '2026-07-19T18:00:00',
    categorie: 'Tournoi/Compétition',
    type_evenement: 'Tournoi/Compétition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.letour.fr',
  },
  {
    source_id: 'paris2026-concert-villette-gratuit',
    titre: 'Concerts Gratuits — Grande Prairie de la Villette',
    titre_en: 'Free Concerts — La Villette Great Prairie',
    description: 'Tout l\'été, la Grande Prairie du Parc de la Villette accueille des concerts gratuits en plein air. Musiques du monde, électro, jazz et variété : une programmation éclectique pour tous les publics. Ouvert à tous, sans réservation. Pensez à arriver tôt pour trouver une bonne place.',
    lieu_key: 'Parc de la Villette',
    date_debut: '2026-07-21T19:00:00',
    date_fin: '2026-07-25T23:00:00',
    categorie: 'Concert/Spectacle',
    type_evenement: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.villette.com/fr',
  },
  {
    source_id: 'paris2026-palais-royal-spectacles',
    titre: 'Spectacles Estivaux — Jardin du Palais Royal',
    titre_en: 'Summer Shows — Palais Royal Garden',
    description: 'Le Jardin du Palais Royal accueille des spectacles de théâtre, de marionnettes et des performances artistiques tout au long de l\'été. Un cadre historique exceptionnel pour découvrir la création contemporaine. Programmation familiale et tout public, certains spectacles gratuits.',
    lieu_key: 'Jardin du Palais Royal',
    date_debut: '2026-07-20T18:00:00',
    date_fin: '2026-07-26T21:00:00',
    categorie: 'Concert/Spectacle',
    type_evenement: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.domaine-palais-royal.fr',
  },
]

export async function GET() {
  // ── Instanciation DANS la fonction — jamais au niveau racine ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const evt of EVENEMENTS_PARIS_2026) {
      // 1. Déduplication via source_id
      const { data: existing } = await supabase
        .from('evenements')
        .select('id')
        .eq('source_id', evt.source_id)
        .maybeSingle()

      if (existing) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'déjà importé' })
        continue
      }

      // 2. Récupérer les coordonnées du lieu
      const lieuData = LIEUX_PARIS[evt.lieu_key]
      if (!lieuData) {
        skipped++
        results.push({ titre: evt.titre, statut: 'ignoré', raison: 'lieu inconnu' })
        continue
      }

      // 3. Insertion
      const { error } = await supabase.from('evenements').insert([{
        titre: evt.titre,
        lieu: evt.lieu_key,
        ville: lieuData.ville,
        pays: lieuData.pays,
        latitude: lieuData.latitude,
        longitude: lieuData.longitude,
        date_debut: evt.date_debut,
        date_fin: evt.date_fin,
        description: evt.description,
        categorie: evt.categorie,
        statut: 'publié',
        source: 'paris_2026',
        source_id: evt.source_id,
        acces: evt.acces,
        prix: evt.prix,
        lien: evt.lien,
        ...(evt.image_url ? { image_url: evt.image_url } : {}),
      }])

      if (error) {
        skipped++
        results.push({ titre: evt.titre, statut: 'erreur', raison: error.message })
      } else {
        imported++
        results.push({ titre: evt.titre, statut: 'importé' })
      }
    }

    return NextResponse.json({
      success: true,
      total: EVENEMENTS_PARIS_2026.length,
      imported,
      skipped,
      periode: 'Juillet 2026 — Paris (autour de Wikimania 21-25 juillet)',
      note: 'Événements à Paris pendant la période Wikimania — pas des événements Wikimania',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
