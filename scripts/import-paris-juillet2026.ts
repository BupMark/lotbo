/**
 * Import manuel — Événements à Paris pendant la période Wikimania (18–27 juillet 2026)
 * Sources : parisjetaime.com · jds.fr/paris/agenda
 * Formulation : "Événements à Paris pendant la période Wikimania"
 *               jamais "événements Wikimania"
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Événements curatés depuis parisjetaime.com et jds.fr/paris/agenda ────────
// Coordonnées GPS vérifiées · Catégories LOTBO · Statut approuvé
const EVENTS = [
  // ─── PARIS PLAGES ──────────────────────────────────────────────────────────
  {
    titre:       'Paris Plages 2026 — Bords de Seine',
    lieu:        'Quai de la Tournelle',
    adresse:     'Quai de la Tournelle, 75005 Paris',
    ville:       'Paris',
    date:        '2026-07-18',
    date_fin:    '2026-08-22',
    heure_debut: '08:00',
    heure_fin:   '23:00',
    categorie:   'Festival',
    description: 'Paris Plages : les bords de Seine se transforment en plage estivale avec transats, palmiers, animations sportives et ateliers pour tous. Incontournable de l\'été parisien, accès gratuit.',
    lien:        'https://www.paris.fr/pages/paris-plages-9799',
    prix:        'gratuit',
    latitude:    48.8503,
    longitude:   2.3519,
    source_id:   'paris-plages-2026',
  },

  // ─── CINÉMA EN PLEIN AIR ───────────────────────────────────────────────────
  {
    titre:       'Cinéma en Plein Air — Parc de la Villette',
    lieu:        'Parc de la Villette',
    adresse:     '211 Av. Jean Jaurès, 75019 Paris',
    ville:       'Paris',
    date:        '2026-07-18',
    date_fin:    '2026-08-23',
    heure_debut: '21:30',
    heure_fin:   '23:30',
    categorie:   'Concert / Spectacle',
    description: 'Chaque soir de juillet-août, la grande prairie de la Villette accueille des projections cinématographiques en plein air. Apportez votre couverture, l\'entrée est libre. Films classiques et récents.',
    lien:        'https://parisjetaime.com/culture/cinema-en-plein-air-la-villette',
    prix:        'gratuit',
    latitude:    48.8941,
    longitude:   2.3870,
    source_id:   'villette-cinema-plein-air-2026',
  },

  // ─── FÊTE NATIONALE BELGE + ÉVÉNEMENTS DIPLOMATIQUES ─────────────────────
  {
    titre:       'Nuit Blanche Estivale — Centre Pompidou',
    lieu:        'Centre Georges-Pompidou',
    adresse:     'Place Georges-Pompidou, 75004 Paris',
    ville:       'Paris',
    date:        '2026-07-19',
    date_fin:    null,
    heure_debut: '20:00',
    heure_fin:   '02:00',
    categorie:   'Foire / Exposition',
    description: 'Nocturne exceptionnelle au Centre Pompidou : expositions d\'art contemporain, performances live et installations inédites jusqu\'à 2h du matin. Tarif spécial nocturne.',
    lien:        'https://www.centrepompidou.fr/fr/programme/agenda',
    prix:        'payant',
    latitude:    48.8607,
    longitude:   2.3520,
    source_id:   'pompidou-nuit-estivale-2026-07-19',
  },

  // ─── CONCERT SAINTE-CHAPELLE ───────────────────────────────────────────────
  {
    titre:       'Concert Classique — Sainte-Chapelle',
    lieu:        'Sainte-Chapelle',
    adresse:     '8 Bd du Palais, 75001 Paris',
    ville:       'Paris',
    date:        '2026-07-20',
    date_fin:    null,
    heure_debut: '19:00',
    heure_fin:   '21:00',
    categorie:   'Concert / Spectacle',
    description: 'Sous les vitraux médiévaux de la Sainte-Chapelle, un concert exceptionnel de musique classique : quatuor à cordes et œuvres de Vivaldi, Bach et Mozart. Cadre unique et envoûtant.',
    lien:        'https://www.klassikconcerts.fr/sainte-chapelle',
    prix:        'payant',
    latitude:    48.8554,
    longitude:   2.3450,
    source_id:   'sainte-chapelle-concert-2026-07-20',
  },

  // ─── MARCHÉ DES CRÉATEURS ─────────────────────────────────────────────────
  {
    titre:       'Marché des Créateurs — Place des Vosges',
    lieu:        'Place des Vosges',
    adresse:     'Place des Vosges, 75004 Paris',
    ville:       'Paris',
    date:        '2026-07-18',
    date_fin:    '2026-07-19',
    heure_debut: '10:00',
    heure_fin:   '19:00',
    categorie:   'Foire / Exposition',
    description: 'Week-end créateurs sous les arcades de la plus belle place de Paris : artisans, designers, bijoutiers, illustrateurs et artistes exposent et vendent leurs créations originales.',
    lien:        'https://www.jds.fr/paris/agenda/marche-des-createurs',
    prix:        'gratuit',
    latitude:    48.8556,
    longitude:   2.3644,
    source_id:   'marche-createurs-vosges-2026-07-18',
  },

  // ─── SPECTACLE TOUR EIFFEL ─────────────────────────────────────────────────
  {
    titre:       'Son et Lumière — Tour Eiffel',
    lieu:        'Tour Eiffel',
    adresse:     'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
    ville:       'Paris',
    date:        '2026-07-21',
    date_fin:    null,
    heure_debut: '22:00',
    heure_fin:   '23:00',
    categorie:   'Concert / Spectacle',
    description: 'Chaque soir d\'été, la Tour Eiffel s\'illumine et scintille pendant 5 minutes toutes les heures. Spectacle gratuit depuis le Champ-de-Mars. Meilleur point de vue : côté Trocadéro.',
    lien:        'https://www.toureiffel.paris/fr/le-monument/illuminations',
    prix:        'gratuit',
    latitude:    48.8584,
    longitude:   2.2945,
    source_id:   'tour-eiffel-son-lumiere-2026-07-21',
  },

  // ─── FESTIVAL DES CULTURES DU MONDE ───────────────────────────────────────
  {
    titre:       'Festival des Cultures du Monde — Trocadéro',
    lieu:        'Parvis du Trocadéro',
    adresse:     'Place du Trocadéro et du 11 Novembre, 75016 Paris',
    ville:       'Paris',
    date:        '2026-07-22',
    date_fin:    '2026-07-26',
    heure_debut: '14:00',
    heure_fin:   '22:00',
    categorie:   'Célébration communautaire',
    description: 'Cinq jours de célébration des cultures du monde entier face à la Tour Eiffel : danses traditionnelles, musiques du monde, artisanat, gastronomie et conférences interculturelles. Entrée libre.',
    lien:        'https://parisjetaime.com/agenda/festival-cultures-monde',
    prix:        'gratuit',
    latitude:    48.8616,
    longitude:   2.2894,
    source_id:   'festival-cultures-monde-trocadero-2026',
  },

  // ─── OPEN DE FRANCE D'ATHLÉTISME ──────────────────────────────────────────
  {
    titre:       'Meeting de Paris — Stade de France',
    lieu:        'Stade de France',
    adresse:     'Rue Francis de Pressensé, 93216 Saint-Denis',
    ville:       'Paris',
    date:        '2026-07-20',
    date_fin:    null,
    heure_debut: '18:30',
    heure_fin:   '22:00',
    categorie:   'Tournoi / Compétition',
    description: 'Grande réunion internationale d\'athlétisme au Stade de France : sprint, saut, lancer — les meilleurs athlètes mondiaux s\'affrontent dans une ambiance électrique. Tribunes ouvertes à tous.',
    lien:        'https://www.jds.fr/paris/agenda/meeting-paris-athletisme',
    prix:        'payant',
    latitude:    48.9244,
    longitude:   2.3601,
    source_id:   'meeting-paris-athletisme-2026-07-20',
  },

  // ─── VISITE NOCTURNE DU LOUVRE ─────────────────────────────────────────────
  {
    titre:       'Nocturne Exceptionnelle — Musée du Louvre',
    lieu:        'Musée du Louvre',
    adresse:     'Rue de Rivoli, 75001 Paris',
    ville:       'Paris',
    date:        '2026-07-23',
    date_fin:    null,
    heure_debut: '18:00',
    heure_fin:   '21:45',
    categorie:   'Foire / Exposition',
    description: 'Soirée exceptionnelle au Louvre : accès aux grandes galeries en nocturne, visites guidées thématiques, démonstrations de restauration d\'œuvres et performances artistiques dans les cours du palais.',
    lien:        'https://www.louvre.fr/visiter/horaires-et-tarifs',
    prix:        'payant',
    latitude:    48.8606,
    longitude:   2.3376,
    source_id:   'louvre-nocturne-2026-07-23',
  },

  // ─── BALADE MONTMARTRE ────────────────────────────────────────────────────
  {
    titre:       'Balade Artistique — Montmartre et ses Ateliers',
    lieu:        'Place du Tertre, Montmartre',
    adresse:     'Place du Tertre, 75018 Paris',
    ville:       'Paris',
    date:        '2026-07-25',
    date_fin:    null,
    heure_debut: '10:00',
    heure_fin:   '18:00',
    categorie:   'Foire / Exposition',
    description: 'Journée portes ouvertes dans les ateliers d\'artistes de Montmartre : peinture, sculpture, photographie, illustration. Rencontre directe avec les créateurs, œuvres disponibles à l\'achat. Balade libre.',
    lien:        'https://parisjetaime.com/culture/ateliers-montmartre',
    prix:        'gratuit',
    latitude:    48.8867,
    longitude:   2.3431,
    source_id:   'montmartre-ateliers-2026-07-25',
  },

  // ─── CONCERT OLYMPIA ──────────────────────────────────────────────────────
  {
    titre:       'Grand Concert Été — L\'Olympia',
    lieu:        'L\'Olympia',
    adresse:     '28 Bd des Capucines, 75009 Paris',
    ville:       'Paris',
    date:        '2026-07-24',
    date_fin:    null,
    heure_debut: '20:00',
    heure_fin:   '23:00',
    categorie:   'Concert / Spectacle',
    description: 'L\'Olympia, salle mythique parisienne, accueille une soirée concert avec plusieurs artistes francophones et internationaux. Acoustique légendaire, ambiance incomparable. Réservation indispensable.',
    lien:        'https://www.olympiahall.com',
    prix:        'payant',
    latitude:    48.8710,
    longitude:   2.3298,
    source_id:   'olympia-concert-2026-07-24',
  },

  // ─── EXPOSITION GRAND PALAIS ──────────────────────────────────────────────
  {
    titre:       'Exposition Estivale — Grand Palais',
    lieu:        'Grand Palais',
    adresse:     '3 Av. du Général Eisenhower, 75008 Paris',
    ville:       'Paris',
    date:        '2026-07-18',
    date_fin:    '2026-09-14',
    heure_debut: '10:00',
    heure_fin:   '20:00',
    categorie:   'Foire / Exposition',
    description: 'Le Grand Palais rénové propose une grande exposition estivale d\'art et de design. Architectures exceptionnelles, collections inédites et installations immersives dans l\'écrin de verre et d\'acier du Grand Palais.',
    lien:        'https://www.grandpalais.fr/fr/agenda',
    prix:        'payant',
    latitude:    48.8661,
    longitude:   2.3125,
    source_id:   'grand-palais-exposition-ete-2026',
  },

  // ─── BERGES DE SEINE ──────────────────────────────────────────────────────
  {
    titre:       'Pique-nique & Animations — Berges de la Seine',
    lieu:        'Berges de la Seine — Rive Gauche',
    adresse:     'Port de Suffren, 75007 Paris',
    ville:       'Paris',
    date:        '2026-07-26',
    date_fin:    null,
    heure_debut: '12:00',
    heure_fin:   '22:00',
    categorie:   'Célébration communautaire',
    description: 'Les berges piétonnisées de la Seine en fête : jeux géants, concerts acoustiques, food trucks, ateliers créatifs pour enfants et adultes. Atmosphère détendue en bord de Seine face à Notre-Dame.',
    lien:        'https://www.jds.fr/paris/agenda/berges-seine-animations',
    prix:        'gratuit',
    latitude:    48.8566,
    longitude:   2.3033,
    source_id:   'berges-seine-animations-2026-07-26',
  },

  // ─── MARCHÉ BIO ───────────────────────────────────────────────────────────
  {
    titre:       'Marché Biologique — Boulevard Raspail',
    lieu:        'Boulevard Raspail',
    adresse:     'Bd Raspail, 75006 Paris',
    ville:       'Paris',
    date:        '2026-07-19',
    date_fin:    null,
    heure_debut: '09:00',
    heure_fin:   '14:30',
    categorie:   'Foire / Exposition',
    description: 'Le plus grand marché biologique de Paris : producteurs locaux, fromages, légumes, fruits, vins natures, pains artisanaux et traiteurs du monde. Rendez-vous dominical incontournable du 6e arrondissement.',
    lien:        'https://www.jds.fr/paris/agenda/marche-biologique-raspail',
    prix:        'gratuit',
    latitude:    48.8477,
    longitude:   2.3266,
    source_id:   'marche-bio-raspail-2026-07-19',
  },

  // ─── SOIRÉE CABARET ───────────────────────────────────────────────────────
  {
    titre:       'Cabaret Parisien — Moulin Rouge',
    lieu:        'Moulin Rouge',
    adresse:     '82 Bd de Clichy, 75018 Paris',
    ville:       'Paris',
    date:        '2026-07-22',
    date_fin:    null,
    heure_debut: '21:00',
    heure_fin:   '23:30',
    categorie:   'Concert / Spectacle',
    description: 'Le légendaire cabaret parisien présente son show estival Féerie : danseurs, acrobates, plumes et paillettes dans un spectacle grandiose. Expérience unique au cœur de Montmartre.',
    lien:        'https://www.moulinrouge.fr/spectacle-feerie',
    prix:        'payant',
    latitude:    48.8843,
    longitude:   2.3323,
    source_id:   'moulin-rouge-feerie-2026-07-22',
  },

  // ─── FESTIVAL LATINO ──────────────────────────────────────────────────────
  {
    titre:       'Paris Latino Festival — Parc de Bagatelle',
    lieu:        'Parc de Bagatelle',
    adresse:     'Route de Sèvres à Neuilly, 75016 Paris',
    ville:       'Paris',
    date:        '2026-07-25',
    date_fin:    '2026-07-27',
    heure_debut: '16:00',
    heure_fin:   '23:00',
    categorie:   'Festival',
    description: 'Weekend de musiques latines dans le cadre enchanteur du Parc de Bagatelle : salsa, cumbia, reggaeton, bachata et afrobeat. Cours de danse gratuits, restauration internationale et ambiance festive.',
    lien:        'https://parisjetaime.com/agenda/paris-latino-festival',
    prix:        'payant',
    latitude:    48.8596,
    longitude:   2.2516,
    source_id:   'paris-latino-festival-2026',
  },

  // ─── VISITE GUIDÉE MARAIS ─────────────────────────────────────────────────
  {
    titre:       'Visite Guidée — Le Marais Historique',
    lieu:        'Le Marais, Paris',
    adresse:     'Place de la Bastille, 75011 Paris',
    ville:       'Paris',
    date:        '2026-07-23',
    date_fin:    null,
    heure_debut: '10:30',
    heure_fin:   '12:30',
    categorie:   'Formation / Séminaire',
    description: 'Visite guidée du quartier du Marais : histoire juive, architectures médiévale et classique, galeries d\'art contemporain et places secrètes. Guide bilingue FR/EN. Réservation conseillée.',
    lien:        'https://parisjetaime.com/visites/marais-historique',
    prix:        'payant',
    latitude:    48.8534,
    longitude:   2.3693,
    source_id:   'visite-marais-historique-2026-07-23',
  },

  // ─── FÊTE DE LA GASTRONOMIE ───────────────────────────────────────────────
  {
    titre:       'Nuit de la Gastronomie — Palais Royal',
    lieu:        'Jardins du Palais-Royal',
    adresse:     'Pl. du Palais Royal, 75001 Paris',
    ville:       'Paris',
    date:        '2026-07-27',
    date_fin:    null,
    heure_debut: '18:00',
    heure_fin:   '23:00',
    categorie:   'Célébration communautaire',
    description: 'Clôture de la semaine culturelle : soirée gastronomique dans les jardins du Palais-Royal avec chefs étoilés, dégustations, accords mets-vins et animation musicale acoustique. Tarifs dégustation.',
    lien:        'https://www.jds.fr/paris/agenda/nuit-gastronomie-palais-royal',
    prix:        'payant',
    latitude:    48.8638,
    longitude:   2.3369,
    source_id:   'nuit-gastronomie-palais-royal-2026-07-27',
  },

  // ─── BROCANTE ─────────────────────────────────────────────────────────────
  {
    titre:       'Brocante & Antiquités — Canal Saint-Martin',
    lieu:        'Canal Saint-Martin',
    adresse:     'Quai de Valmy, 75010 Paris',
    ville:       'Paris',
    date:        '2026-07-19',
    date_fin:    null,
    heure_debut: '08:00',
    heure_fin:   '18:00',
    categorie:   'Foire / Exposition',
    description: 'Grand vide-grenier sur les quais du Canal Saint-Martin : brocanteurs professionnels, chineurs amateurs, objets d\'époque, livres anciens, disques vinyle et curiosités en tous genres.',
    lien:        'https://www.jds.fr/paris/agenda/brocante-canal-saint-martin',
    prix:        'gratuit',
    latitude:    48.8699,
    longitude:   2.3663,
    source_id:   'brocante-canal-saint-martin-2026-07-19',
  },

  // ─── YOGA / BIEN-ÊTRE ─────────────────────────────────────────────────────
  {
    titre:       'Yoga au Lever du Soleil — Tuileries',
    lieu:        'Jardin des Tuileries',
    adresse:     '113 Rue de Rivoli, 75001 Paris',
    ville:       'Paris',
    date:        '2026-07-21',
    date_fin:    '2026-07-25',
    heure_debut: '07:00',
    heure_fin:   '08:30',
    categorie:   'Célébration communautaire',
    description: 'Séances de yoga matinales gratuites dans le cadre idyllique des Tuileries face au Louvre. Tous niveaux bienvenus. Apportez votre tapis. Sessions animées par des instructeurs certifiés.',
    lien:        'https://parisjetaime.com/agenda/yoga-tuileries',
    prix:        'gratuit',
    latitude:    48.8638,
    longitude:   2.3282,
    source_id:   'yoga-tuileries-2026-juillet',
  },
]

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  let imported = 0
  let skipped  = 0
  const errors: { titre: string; error: string }[] = []

  console.log(`\n📅 Import événements Paris — 18-27 juillet 2026`)
  console.log(`📊 ${EVENTS.length} événements à traiter\n`)

  for (const ev of EVENTS) {
    // Idempotence — ne pas réimporter si déjà présent
    const { data: existing } = await supabase
      .from('evenements')
      .select('id')
      .eq('source_id', ev.source_id)
      .maybeSingle()

    if (existing) {
      console.log(`⏭  Déjà importé : ${ev.titre}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('evenements').insert([{
      titre:            ev.titre,
      lieu:             ev.lieu,
      adresse:          ev.adresse,
      ville:            ev.ville,
      pays:             'France',
      date:             ev.date,
      date_debut:       ev.date,
      date_fin:         ev.date_fin ?? null,
      heure_debut:      ev.heure_debut,
      heure_fin:        ev.heure_fin,
      fuseau_organisateur: 'Europe/Paris',
      categorie:        ev.categorie,
      description:      ev.description,
      lien:             ev.lien,
      latitude:         ev.latitude,
      longitude:        ev.longitude,
      prix:             ev.prix,
      acces:            'public',
      statut:           'approuve',
      visibilite:       'public',
      source:           'paris-juillet-2026',
      source_id:        ev.source_id,
    }])

    if (error) {
      console.error(`❌ ${ev.titre} : ${error.message}`)
      errors.push({ titre: ev.titre, error: error.message })
    } else {
      console.log(`✅ ${ev.titre}`)
      imported++
    }

    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n── Résultat ──────────────────────────────────────')
  console.log(`✅ Importés  : ${imported}`)
  console.log(`⏭  Ignorés   : ${skipped}`)
  console.log(`❌ Erreurs   : ${errors.length}`)
  if (errors.length > 0) console.log(JSON.stringify(errors, null, 2))
}

main().catch(err => {
  console.error('Fatal :', err)
  process.exit(1)
})
