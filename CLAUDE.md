# LOTBO — Contexte Claude Code

## Identité du projet
- Plateforme mondiale de découverte d'événements locaux
- Née le 5 mai 2026 à Petit-Goâve, Haïti 🇭🇹
- Fondateur : Handgod Abraham (Bup Mark Ltd, Manchester UK)
- Tagline : "Tous les événements, un seul endroit."
- Nom : du kreyòl haïtien "lòt bò" (là-bas, de l'autre côté)

## URLs production
- Landing : https://lotbo.app (repo: /Users/handgod/lotbo-landing/)
- App : https://app.lotbo.app (repo: /Users/handgod/lotbo/)
- Admin : https://app.lotbo.app/admin

## Stack technique
- Next.js 16.2.5 (App Router) · TypeScript strict
- Supabase (PostgreSQL + Auth + Storage)
- Mapbox GL JS · Google Places API
- next-intl (FR/EN/ES/PT/Kreyòl haïtien)
- Brevo (emails) · Vercel (déploiement)
- GitHub Actions (scrapers automatiques)

## Règles absolues — JAMAIS violer
- Fond toutes pages : #F7F2E8 (crème) — admin inclus
- Couleur brand : #C8431A uniquement
- #1D9E75 (vert) : BANNI de toute l'app
- Header/nav : #1A1410 autorisé
- TypeScript strict — zéro `any`
- Mobile-first 375px en priorité
- Jamais position: absolute dans le header
- Jamais SUPABASE_SERVICE_ROLE_KEY côté client
- Jamais Supabase instancié à la racine d'une API route
- params Next.js 16 = Promise — toujours await
- Toujours livrer des fichiers complets — jamais d'extraits

## Conventions de développement
- Scrapers : vérifier source + source_id avant insert (dédup)
- Soumissions manuelles : statut 'en_attente'
- Scrapers automatiques : statut 'approuve'
- Images événements : bucket Supabase 'evenements'
- Images logos orgs : bucket 'logos-organisations'
- Images covers orgs : bucket 'covers-organisations'
- Noms de fichiers upload : `${Date.now()}-${random}.${ext}`
- Déploiement : git add → git commit → git push → npx vercel --prod

## Structure clé du repo /lotbo
- app/page.tsx — homepage carte + vue liste + clustering
- app/evenement/[id]/ — page détail événement
- app/ajouter/page.tsx — formulaire ajout événement (Scan & Publie)
- app/profil/page.tsx — profil utilisateur
- app/classement/page.tsx — classement Ansanm
- app/organisations/page.tsx — liste organisations
- app/organisation/[slug]/page.tsx — vitrine organisation
- app/admin/page.tsx — panel administration
- app/api/ — routes API (scrapers, stats, auth, points)
- components/CarteVisuelle.tsx — cartes sociales (7 templates)
- public/sw.js — Service Worker PWA
- public/manifest.json — manifest PWA
- .github/workflows/ — scrapers GitHub Actions

## Supabase
- Project URL : cwshefnimydmycttzish.supabase.co
- Tables principales : evenements, organisations, organisation_membres,
  profiles, commentaires, notifications, propositions_modifications,
  participations, favoris, reactions, signalements, supporters
- Buckets Storage : evenements · logos-organisations · covers-organisations

## Multilinguisme
- 5 langues : FR · EN · ES · PT · KW (Kreyòl haïtien)
- Toute nouvelle chaîne → 5 fichiers JSON à synchroniser
- Dossier : messages/ (fr.json, en.json, es.json, pt.json, kw.json)

## GitHub Actions — scrapers
- scraping.yml : PredictHQ + Ticketmaster + WorldCup (toutes les 6h)
- scraping-asie.yml : Peatix Asie (2h UTC quotidien)

## Session structure (règle 70/20/10)
- 70% : tâche principale
- 20% : bug ou amélioration secondaire  
- 10% : scraper ou feature background

## DevExpo 6 juin 2026
- PWA score estimé 92/100
- Play Store TWA : semaine du 9 juin ($25 USD)

## Contacts
- Email : lotbo@bup-mark.com
- Réseaux : x.com/Lotboapp · facebook.com/lotboapp · instagram.com/lotboapp
