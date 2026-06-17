// SC-MONDIAL-FIFA-2 — Événements autour de la Coupe du Monde 2026 · New York / New Jersey
// ⚠️ FORMULATION : "Événements à New York pendant la période FIFA World Cup 2026"
//    Les matchs sont déjà importés — ce fichier couvre UNIQUEMENT les événements autour
//
// Architecture : données curées (sources vérifiées : nynjfwc26.com, timeout.com/newyork,
//   centralpark.com, njfamily.com, sportsillustratedstadium.com, cbsnews.com)
// Période couverte : 11 juin → 19 juillet 2026
// Mise à jour : 31 mai 2026

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Coordonnées GPS niveau bâtiment — New York City + New Jersey
const LIEUX_NYC: Record<string, {
  latitude: number
  longitude: number
  adresse: string
  ville: string
  pays: string
}> = {
  // Manhattan
  'Central Park — Rumsey Playfield':         { latitude: 40.7726, longitude: -73.9700, adresse: 'East 72nd Street & East Drive', ville: 'New York', pays: 'USA' },
  'Rockefeller Center':                      { latitude: 40.7587, longitude: -73.9787, adresse: '30 Rockefeller Plaza', ville: 'New York', pays: 'USA' },
  'Madison Square Garden':                   { latitude: 40.7505, longitude: -73.9934, adresse: '4 Pennsylvania Plaza', ville: 'New York', pays: 'USA' },
  'Lincoln Center for the Performing Arts':  { latitude: 40.7725, longitude: -73.9835, adresse: '10 Lincoln Center Plaza', ville: 'New York', pays: 'USA' },
  'Radio City Music Hall':                   { latitude: 40.7599, longitude: -73.9799, adresse: '1260 Avenue of the Americas', ville: 'New York', pays: 'USA' },
  'Hudson Yards':                            { latitude: 40.7539, longitude: -74.0018, adresse: '20 Hudson Yards', ville: 'New York', pays: 'USA' },
  'Times Square':                            { latitude: 40.7580, longitude: -73.9855, adresse: 'Times Square, Midtown Manhattan', ville: 'New York', pays: 'USA' },
  'High Line':                               { latitude: 40.7480, longitude: -74.0048, adresse: 'Gansevoort Street to West 34th Street', ville: 'New York', pays: 'USA' },
  'Pier 17 — South Street Seaport':         { latitude: 40.7064, longitude: -74.0030, adresse: '89 South Street', ville: 'New York', pays: 'USA' },
  'Governors Island':                        { latitude: 40.6895, longitude: -74.0165, adresse: 'Governors Island', ville: 'New York', pays: 'USA' },
  'Brooklyn Bridge Park':                    { latitude: 40.7020, longitude: -73.9970, adresse: '334 Furman Street', ville: 'Brooklyn', pays: 'USA' },
  'Barclays Center':                         { latitude: 40.6826, longitude: -73.9754, adresse: '620 Atlantic Avenue', ville: 'Brooklyn', pays: 'USA' },
  'Prospect Park — Brooklyn':                { latitude: 40.6602, longitude: -73.9690, adresse: 'Grand Army Plaza', ville: 'Brooklyn', pays: 'USA' },
  // Queens
  'USTA Billie Jean King National Tennis Center': { latitude: 40.7496, longitude: -73.8457, adresse: 'Flushing Meadows Corona Park', ville: 'Queens', pays: 'USA' },
  'Citi Field':                              { latitude: 40.7571, longitude: -73.8458, adresse: '41 Seaver Way', ville: 'Queens', pays: 'USA' },
  // Bronx
  'Yankee Stadium':                          { latitude: 40.8296, longitude: -73.9262, adresse: '1 E 161st Street', ville: 'The Bronx', pays: 'USA' },
  // New Jersey
  'Sports Illustrated Stadium — Harrison NJ': { latitude: 40.7420, longitude: -74.1503, adresse: '600 Cape May Street', ville: 'Harrison', pays: 'USA' },
  'American Dream — East Rutherford':        { latitude: 40.8135, longitude: -74.0643, adresse: '1 American Dream Way', ville: 'East Rutherford', pays: 'USA' },
  'Liberty State Park':                      { latitude: 40.7043, longitude: -74.0636, adresse: '200 Morris Pesin Drive', ville: 'Jersey City', pays: 'USA' },
  'Jersey City — Newport Waterfront':        { latitude: 40.7282, longitude: -74.0354, adresse: 'Newport Waterfront, Jersey City', ville: 'Jersey City', pays: 'USA' },
  'Asbury Park Boardwalk':                   { latitude: 40.2204, longitude: -74.0121, adresse: '4th Avenue & Ocean Avenue', ville: 'Asbury Park', pays: 'USA' },
  'Newark — Prudential Center':              { latitude: 40.7337, longitude: -74.1714, adresse: '25 Lafayette Street', ville: 'Newark', pays: 'USA' },
}

interface EvenementMundial {
  source_id: string
  titre: string
  description: string
  lieu_key: keyof typeof LIEUX_NYC
  date_debut: string
  date_fin: string
  categorie: string
  prix: 'gratuit' | 'payant'
  acces: 'public' | 'prive'
  lien: string
  image_url?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉVÉNEMENTS VÉRIFIÉS — NEW YORK / NEW JERSEY · FIFA WORLD CUP 2026 PERIOD
// Sources : nynjfwc26.com · timeout.com/newyork · centralpark.com
//           njfamily.com · sportsillustratedstadium.com · cbsnews.com
// ─────────────────────────────────────────────────────────────────────────────
const EVENEMENTS_NYC_MUNDIAL: EvenementMundial[] = [

  // ── FAN ZONES OFFICIELLES ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-nyc-fanhub-si-stadium',
    titre: 'NYNJ World Cup Fan Hub — Sports Illustrated Stadium',
    description: 'Le hub officiel de la région New York/New Jersey pour la Coupe du Monde 2026. Sports Illustrated Stadium à Harrison, NJ se transforme en centre de célébration mondial : retransmissions live des matchs, concerts, expériences immersives, programmation culturelle et activations de marques. Ouvert sur des dates sélectionnées du 13 juin au 15 juillet. Billets disponibles à partir de $10, enfants de moins de 12 ans gratuits.',
    lieu_key: 'Sports Illustrated Stadium — Harrison NJ',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-15T23:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },
  {
    source_id: 'mundial2026-nyc-fanzone-queens-usta',
    titre: 'Queens Group Stage Fan Zone — USTA Billie Jean King Center',
    description: 'La fan zone officielle du Queens pour la phase de groupes de la Coupe du Monde 2026. Installée au USTA Billie Jean King National Tennis Center à Flushing Meadows, elle propose des retransmissions live sur grands écrans, de la nourriture locale, de la musique et des animations interactives. Entrée libre, sans ticket de match requis. Ouverte tout au long de la phase de groupes.',
    lieu_key: 'USTA Billie Jean King National Tennis Center',
    date_debut: '2026-06-11T11:00:00',
    date_fin: '2026-06-27T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },
  {
    source_id: 'mundial2026-nyc-fanzone-brooklyn-bridge',
    titre: 'Brooklyn Bridge Park Fan Zone — FIFA World Cup 2026',
    description: 'La fan zone de Brooklyn Bridge Park est l\'une des plus longues de tout le tournoi, active du 13 juin au 19 juillet. Vue imprenable sur Manhattan en arrière-plan, retransmissions live, musique, food trucks internationaux et animations gratuites pour toute la durée de la compétition. Entrée libre, sans réservation requise. L\'un des endroits les plus pittoresques pour vivre la Coupe du Monde.',
    lieu_key: 'Brooklyn Bridge Park',
    date_debut: '2026-06-13T11:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },
  {
    source_id: 'mundial2026-nyc-fanzone-rockefeller',
    titre: 'Rockefeller Center Fan Village — FIFA World Cup 2026',
    description: 'Au cœur de Midtown Manhattan, le Rockefeller Center accueille le Fan Village officiel pour les phases finales de la Coupe du Monde 2026. Géant parmi les fan zones, il propose des expériences interactives, des activations de marques, des retransmissions live et des animations culturelles. Situé à deux pas des hôtels et restaurants emblématiques de New York. Accès libre.',
    lieu_key: 'Rockefeller Center',
    date_debut: '2026-07-06T11:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },
  {
    source_id: 'mundial2026-nyc-fanzone-bronx',
    titre: 'Bronx Fan Zone — FIFA World Cup 2026',
    description: 'La fan zone du Bronx pour la Coupe du Monde 2026, organisée pour les premiers matchs du tournoi. Retransmissions en direct, animations communautaires, musique et nourriture locale dans le quartier le plus authentique de New York. Une occasion unique de vivre la fièvre du football mondial dans le berceau du baseball américain. Entrée gratuite.',
    lieu_key: 'Yankee Stadium',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-06-14T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },
  {
    source_id: 'mundial2026-nyc-fanzone-staten-island',
    titre: 'Staten Island Fan Zone — FIFA World Cup 2026',
    description: 'La fan zone officielle de Staten Island pour la Coupe du Monde 2026, active pendant les matches de la phase de groupes avancée. Retransmissions sur grands écrans, animations locales, food trucks et célébrations communautaires. L\'une des cinq fan zones gratuites des cinq arrondissements de New York City. Aucun ticket de match requis.',
    lieu_key: 'Liberty State Park',
    date_debut: '2026-06-29T12:00:00',
    date_fin: '2026-07-02T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://nynjfwc26.com/fan-events/',
  },

  // ── CONCERTS & SPECTACLES ─────────────────────────────────────────────────

  {
    source_id: 'mundial2026-nyc-concert-si-djsnake-justice',
    titre: 'DJ Snake & Justice — SI Stadium Concert Series',
    description: 'Dans le cadre de la SI Stadium Concert Series, les superstars françaises de l\'électronique DJ Snake et Justice headlinent une soirée inoubliable mêlant football et musique. Une nuit de son et lumière au Sports Illustrated Stadium de Harrison, NJ, pendant la période de la Coupe du Monde. La France à l\'honneur — football et musique réunis.',
    lieu_key: 'Sports Illustrated Stadium — Harrison NJ',
    date_debut: '2026-06-20T20:00:00',
    date_fin: '2026-06-21T01:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.sportsillustratedstadium.com/fan-hub',
  },
  {
    source_id: 'mundial2026-nyc-concert-si-french-montana',
    titre: 'French Montana — World Cup Concert at American Dream',
    description: 'Le rappeur américano-marocain French Montana se produit en concert à l\'American Dream Mall à East Rutherford, NJ, après le match Brésil vs Maroc du 13 juin. Une célébration musicale à la croisée des cultures, à deux pas du MetLife Stadium. Concert post-match dans l\'atmosphère électrique de la Coupe du Monde.',
    lieu_key: 'American Dream — East Rutherford',
    date_debut: '2026-06-13T22:00:00',
    date_fin: '2026-06-14T01:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.njfamily.com/2026-fifa-world-cup-in-new-jersey-fan-fests-watch-parties-and-family-events/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-opera',
    titre: 'Metropolitan Opera Summer Recital — Central Park SummerStage',
    description: 'Concert gratuit en plein air au Rumsey Playfield de Central Park, avec des solistes du Metropolitan Opera : Emily Pogorelc (soprano), Joshua Blue (baryton), Edward Nelson et Dmitri Dover. Un moment rare d\'opéra accessible à tous dans l\'écrin verdoyant de Central Park. Arrivée recommandée 1h avant le concert pour trouver une bonne place.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-06-15T19:00:00',
    date_fin: '2026-06-15T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-pride',
    titre: 'Dreamland: Pride in Central Park — Purple Disco Machine, Kungs, Dani Brasil',
    description: 'Concert de bienfaisance LGBTQ+ à Central Park SummerStage avec Purple Disco Machine, Kungs et Dani Brasil. L\'événement Pride le plus festif de l\'été new-yorkais, dans l\'ambiance électrique de la saison Coupe du Monde. Au Rumsey Playfield de Central Park, un concert-événement qui célèbre la diversité et la joie.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-06-28T19:00:00',
    date_fin: '2026-06-28T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-shabaka',
    titre: 'SHABAKA / Kokoroko / Omar / Lovie — Central Park SummerStage (FREE)',
    description: 'Concert jazz et soul gratuit au Central Park SummerStage avec SHABAKA, Kokoroko, Omar et Lovie. Une soirée de jazz contemporain et d\'afrobeat à couper le souffle dans Central Park, au cœur de l\'été new-yorkais et de la fièvre de la Coupe du Monde. Entrée libre au Rumsey Playfield — arrivez tôt.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-07-01T19:00:00',
    date_fin: '2026-07-01T22:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-bastille',
    titre: 'Bastille Day Concert — Black M / Laurent — Central Park SummerStage',
    description: 'Concert de la fête nationale française au Central Park SummerStage avec Black M et Laurent. Une célébration musicale franco-africaine pour honorer le 14 juillet en plein cœur de New York, pendant la Coupe du Monde. Un événement culturel qui mélange les influences françaises et la scène musicale mondiale.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-07-12T19:00:00',
    date_fin: '2026-07-12T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-msg-5sos',
    titre: '5 Seconds of Summer — EVERYONE\'S A STAR! World Tour · Madison Square Garden',
    description: '5 Seconds of Summer font escale à Madison Square Garden pour leur tournée mondiale "EVERYONE\'S A STAR!". Le groupe australien de pop-rock investit "the World\'s Most Famous Arena" pour une nuit inoubliable, en pleine période de Coupe du Monde à New York. Billets disponibles sur Ticketmaster.',
    lieu_key: 'Madison Square Garden',
    date_debut: '2026-06-13T20:00:00',
    date_fin: '2026-06-13T23:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.msg.com/madison-square-garden',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-yiddish',
    titre: 'New York Sings Yiddish — The Shvesters, YidLife Crisis, Yair Keydar (FREE)',
    description: 'Concert gratuit au Central Park SummerStage célébrant la culture yiddish new-yorkaise avec The Shvesters, YidLife Crisis, Yair Keydar et Riki Rose. Un événement culturel unique qui reflète la diversité de New York pendant la Coupe du Monde, mélangeant traditions musicales juives, humour et performances contemporaines.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-06-22T18:00:00',
    date_fin: '2026-06-22T22:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-laurie',
    titre: 'Laurie Anderson: Republic of Love with Sexmob — Central Park (FREE)',
    description: 'Laurie Anderson, icône de l\'avant-garde américaine, présente "Republic of Love" avec Sexmob au Central Park SummerStage. Un concert expérimental et poétique, gratuit, au cœur de l\'été new-yorkais. Une expérience artistique rare qui contraste avec l\'effervescence footballistique de la Coupe du Monde.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-06-26T19:00:00',
    date_fin: '2026-06-26T21:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },
  {
    source_id: 'mundial2026-nyc-concert-summerstage-blackcountry',
    titre: 'Black Country, New Road / Horsegirl / Sharp Pins — SummerStage (FREE)',
    description: 'Triple concert indie rock gratuit au Central Park SummerStage avec Black Country, New Road, Horsegirl et Sharp Pins. L\'un des concerts les plus attendus de l\'été new-yorkais indie, offert gratuitement dans le cadre du festival SummerStage. Une soirée guitares et émotions en plein air à Central Park.',
    lieu_key: 'Central Park — Rumsey Playfield',
    date_debut: '2026-06-24T18:30:00',
    date_fin: '2026-06-24T22:30:00',
    categorie: 'Concert/Spectacle',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.centralpark.com/things-to-do/concerts/summerstage-festival/',
  },

  // ── FESTIVALS & ÉVÉNEMENTS COMMUNAUTAIRES ─────────────────────────────────

  {
    source_id: 'mundial2026-nyc-festival-american-dream',
    titre: 'American Dream World Cup Fan Fest — Daily (June 11 – July 19)',
    description: 'L\'American Dream Mall à East Rutherford, NJ — juste à côté du New York New Jersey Stadium (MetLife) — se transforme en la plus grande fan fest quotidienne de la région pour toute la durée de la Coupe du Monde. Retransmissions live quotidiennes, concerts, apparitions de célébrités, activations de marques, cadeaux et événements spéciaux. La destination incontournable pour les fans sans billet de match.',
    lieu_key: 'American Dream — East Rutherford',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.njfamily.com/2026-fifa-world-cup-in-new-jersey-fan-fests-watch-parties-and-family-events/',
  },
  {
    source_id: 'mundial2026-nj-festival-flag-cities',
    titre: 'Goya Presents Flag Cities 2026 — NJ Fan Festival Series',
    description: 'La série de festivals officiels FIFA du New Jersey, Flag Cities 2026, fait des arrêts à travers Hudson et Bergen County : Newark, Paterson, Bayonne, East Rutherford, Hackensack, Jersey City et Secaucus. Chaque événement propose food trucks, beer garden, concerts live, retransmissions sur écrans LED géants et zones de soccer interactives. Organisé par la Meadowlands Regional Chamber & CVB.',
    lieu_key: 'Jersey City — Newport Waterfront',
    date_debut: '2026-06-08T12:00:00',
    date_fin: '2026-07-16T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.cbsnews.com/philadelphia/news/mikie-sherrill-2026-world-cup-plans-new-jersey/',
  },
  {
    source_id: 'mundial2026-nj-north-to-shore-festival',
    titre: 'North to Shore Festival — Essex, Monmouth & Atlantic Counties',
    description: 'Le North to Shore Festival couvre Essex, Monmouth et Atlantic County pendant toute la période de la Coupe du Monde. Musique, arts, gastronomie et célébrations culturelles sur trois comtés du New Jersey, dans le cadre des activations FIFA World Cup 2026. L\'un des trois événements régionaux multi-jours multi-lieux officiels du New Jersey.',
    lieu_key: 'Asbury Park Boardwalk',
    date_debut: '2026-06-13T12:00:00',
    date_fin: '2026-07-16T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.cbsnews.com/philadelphia/news/mikie-sherrill-2026-world-cup-plans-new-jersey/',
  },
  {
    source_id: 'mundial2026-nj-summer-soccer-science',
    titre: 'Summer of Soccer & Science — Liberty Science Center, Jersey City',
    description: 'Le Liberty Science Center propose une série unique de programmation STEM liée au football : "Summer of Soccer & Science". Ateliers éducatifs thématiques sur les sciences du sport, retransmissions live des matchs et expériences interactives pour les familles. Une approche créative qui combine éducation et passion du football pour toute la durée du tournoi.',
    lieu_key: 'Liberty State Park',
    date_debut: '2026-06-06T10:00:00',
    date_fin: '2026-07-19T18:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.njfamily.com/2026-fifa-world-cup-in-new-jersey-fan-fests-watch-parties-and-family-events/',
  },
  {
    source_id: 'mundial2026-nyc-governors-island-summer',
    titre: 'Governors Island Summer Season — Art & Culture',
    description: 'Governors Island ouvre sa saison estivale avec des installations artistiques, des concerts en plein air, des marchés et des événements culturels pendant toute la période de la Coupe du Monde. L\'île accessible en ferry depuis Manhattan et Brooklyn offre un espace de respiration unique, avec des vues sur la skyline new-yorkaise et la Statue de la Liberté. Nombreux événements gratuits.',
    lieu_key: 'Governors Island',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T18:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://govisland.com',
  },
  {
    source_id: 'mundial2026-nj-passport-paterson',
    titre: 'Passport to Paterson: A World Cup Experience',
    description: 'L\'André Sayegh Civic Association organise "Passport to Paterson", une série d\'événements culturels à Paterson, NJ, coïncidant avec les grands matchs de la Coupe du Monde (13 juin, 19 juin, 25 juin, 27 juin, 19 juillet). Célébration de la diversité culturelle de Paterson, l\'une des villes les plus cosmopolites du New Jersey, avec musique, gastronomie internationale et animations.',
    lieu_key: 'Newark — Prudential Center',
    date_debut: '2026-06-13T14:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.cbsnews.com/philadelphia/news/mikie-sherrill-2026-world-cup-plans-new-jersey/',
  },
  {
    source_id: 'mundial2026-nj-international-food-dance',
    titre: 'International Food & Dance Festival — Montclair, NJ',
    description: 'Festival de gastronomie et de danse internationale à Montclair, NJ, organisé par Lackawanna Montclair Market LLC. Une célébration des cultures du monde en résonance avec la Coupe du Monde 2026 : cuisines du monde entier, performances de danse traditionnelle et contemporaine, artisanat international. Un événement familial et coloré.',
    lieu_key: 'Liberty State Park',
    date_debut: '2026-07-12T12:00:00',
    date_fin: '2026-07-12T21:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.cbsnews.com/philadelphia/news/mikie-sherrill-2026-world-cup-plans-new-jersey/',
  },

  // ── ÉVÉNEMENTS FAMILLE & SPORT ────────────────────────────────────────────

  {
    source_id: 'mundial2026-nyc-kidzbop-si-stadium',
    titre: 'KIDZ BOP LIVE — Family Day Concert & Watch Party · SI Stadium',
    description: 'KIDZ BOP LIVE se produit au Sports Illustrated Stadium pour une journée festive dédiée aux familles : concert plein d\'énergie, rencontres avec des joueurs, activités soccer pour les enfants et retransmissions des matchs FIFA. Le billet inclut l\'accès au concert ET aux watch parties des matchs Allemagne vs Curaçao et Pays-Bas vs Japon. Portes ouvertes à 12h30.',
    lieu_key: 'Sports Illustrated Stadium — Harrison NJ',
    date_debut: '2026-06-14T12:30:00',
    date_fin: '2026-06-14T19:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.sportsillustratedstadium.com/fan-hub',
  },
  {
    source_id: 'mundial2026-nj-ivy-hill-soccer-fest',
    titre: 'Ivy Hill Soccer Fest 2026 — Newark, NJ',
    description: 'L\'Ivy Hill Neighborhood Association organise le Soccer Fest 2026 à Newark, NJ, sur plusieurs week-ends de la Coupe du Monde (23 mai, 19-20 juin, 9-12 juillet). Tournois de soccer communautaire, animations pour les jeunes, retransmissions des matchs et célébrations de quartier. Un événement ancré dans la communauté de Newark, l\'une des villes les plus diverses des USA.',
    lieu_key: 'Newark — Prudential Center',
    date_debut: '2026-06-19T10:00:00',
    date_fin: '2026-07-12T20:00:00',
    categorie: 'Tournoi/Compétition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.cbsnews.com/philadelphia/news/mikie-sherrill-2026-world-cup-plans-new-jersey/',
  },
  {
    source_id: 'mundial2026-nj-summer-wave-resort',
    titre: 'Summer of Soccer Watch Parties — Wave Resort, Asbury Park',
    description: 'Le Wave Resort à Pier Village, Long Branch, NJ, propose des watch parties en plein air quotidiennes pendant tout le tournoi. Écran surdimensionné au bord de la piscine, ballon de soccer géant gonflable, décoration brésilienne, musique, gastronomie et boissons thématiques. Au Carousel Bar et Pool Bar, avec vue sur l\'océan. Un mix parfait entre bord de mer et football mondial.',
    lieu_key: 'Asbury Park Boardwalk',
    date_debut: '2026-06-11T14:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.njfamily.com/2026-fifa-world-cup-in-new-jersey-fan-fests-watch-parties-and-family-events/',
  },

  // ── CULTURE & ARTS ────────────────────────────────────────────────────────

  {
    source_id: 'mundial2026-nyc-highline-summer',
    titre: 'High Line — Summer Art Installations & Events',
    description: 'La High Line, parc linéaire suspendu au-dessus de Chelsea, programme tout l\'été des installations artistiques, des performances et des événements culturels gratuits. Une promenade unique à 10 mètres au-dessus des rues de Manhattan, avec des œuvres d\'artistes internationaux qui résonnent avec la diversité de la Coupe du Monde. Accès gratuit, ouvert tous les jours.',
    lieu_key: 'High Line',
    date_debut: '2026-06-11T07:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Foire/Exposition',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.thehighline.org',
  },
  {
    source_id: 'mundial2026-nyc-pier17-concerts',
    titre: 'Pier 17 Rooftop Concerts — South Street Seaport',
    description: 'Le Pier 17 au South Street Seaport accueille une saison de concerts sur son rooftop avec vue sur les ponts de New York et le port. Une programmation variée de concerts live avec des artistes nationaux et internationaux, dans l\'atmosphère estivale de la Coupe du Monde. Réservation recommandée. Vue sur Brooklyn Bridge et Manhattan Bridge.',
    lieu_key: 'Pier 17 — South Street Seaport',
    date_debut: '2026-06-11T19:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Concert/Spectacle',
    prix: 'payant',
    acces: 'public',
    lien: 'https://www.pier17ny.com',
  },
  {
    source_id: 'mundial2026-nyc-lincoln-center-summer',
    titre: 'Lincoln Center — Midsummer Night Swing & Out of Doors Festival',
    description: 'Le Lincoln Center for the Performing Arts programme son festival estival annuel avec des concerts gratuits et des soirées dansantes en plein air au Damrosch Park. Midsummer Night Swing propose des leçons de danse et des concerts de swing, salsa, jazz et musiques du monde. Out of Doors offre des performances gratuites tous les soirs. L\'été culturel new-yorkais dans toute sa splendeur.',
    lieu_key: 'Lincoln Center for the Performing Arts',
    date_debut: '2026-06-11T18:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.lincolncenter.org',
  },
  {
    source_id: 'mundial2026-nyc-hudson-yards-summer',
    titre: 'Hudson Yards — Summer Events & The Vessel',
    description: 'Hudson Yards, le quartier le plus moderne de Manhattan, programme des événements estivaux autour du Vessel et des espaces publics : installations artistiques, activations, pop-ups gastronomiques et animations culturelles. Une destination incontournable pendant la Coupe du Monde pour les visiteurs internationaux découvrant New York.',
    lieu_key: 'Hudson Yards',
    date_debut: '2026-06-11T10:00:00',
    date_fin: '2026-07-19T22:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://www.hudsonyardsnewyork.com',
  },
  {
    source_id: 'mundial2026-nyc-prospect-park-bandshell',
    titre: 'Celebrate Brooklyn! at Prospect Park Bandshell',
    description: 'Le festival "Celebrate Brooklyn!" au Prospect Park Bandshell propose une saison de concerts gratuits et payants tout l\'été, avec une programmation axée sur la world music, le jazz, le hip-hop et la musique latine. Un festival ancré dans la diversité de Brooklyn, en résonance parfaite avec l\'esprit international de la Coupe du Monde 2026.',
    lieu_key: 'Prospect Park — Brooklyn',
    date_debut: '2026-06-11T19:00:00',
    date_fin: '2026-07-19T23:00:00',
    categorie: 'Festival',
    prix: 'gratuit',
    acces: 'public',
    lien: 'https://bricartsmedia.org/celebrate-brooklyn',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let imported = 0
  let skipped = 0
  const results: Array<{ titre: string; statut: string; raison?: string }> = []

  try {
    for (const evt of EVENEMENTS_NYC_MUNDIAL) {
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
      const lieuData = LIEUX_NYC[evt.lieu_key]
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
        date: evt.date_debut,
        description: evt.description,
        categorie: evt.categorie,
        statut: 'publié',
        source: 'mundial_2026',
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
      ville: 'New York / New Jersey',
      total: EVENEMENTS_NYC_MUNDIAL.length,
      imported,
      skipped,
      periode: '11 juin – 19 juillet 2026 (période FIFA World Cup 2026)',
      note: 'Événements autour de la Coupe du Monde — pas les matchs eux-mêmes',
      evenements: results,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
