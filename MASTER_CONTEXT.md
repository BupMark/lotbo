# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 10 mai 2026
> Architecte technique : Claude (Anthropic)
> Fondateur : Handgod Abraham

---

## 1. VISION & IDENTITÉ

**Nom :** LOTBO — du kreyòl haïtien "lòt bò" (là-bas)
**Tagline principale :** "Chaque lieu a une histoire à raconter."
**Tagline courte :** "L'adresse juste."
**Tagline app :** "Tous les événements, un seul endroit."
**Née en Haïti le 5 mai 2026**
**Mission :** Plateforme mondiale de découverte d'événements locaux

---

## 2. URLS DE PRODUCTION

| Surface | URL |
|---|---|
| Landing | `lotbo.app` (primary — pas www) |
| App | `app.lotbo.app` |
| Admin | `app.lotbo.app/admin` |

---

## 3. STACK TECHNIQUE

| Technologie | Version | Usage |
|---|---|---|
| Next.js | 16.2.5 | App Router, SSR |
| TypeScript | strict | Typage complet |
| Supabase | latest | DB + Auth + Storage + RLS |
| Mapbox GL JS | latest | Carte interactive |
| next-intl | latest | Internationalisation |
| Brevo | API v3 | Newsletter + Notifications email |
| web-push | 3.6.7 | Notifications push PWA |
| Vercel | latest | Hébergement + CI/CD |

---

## 4. IDENTITÉ VISUELLE — brandbook v1.0 (5 mai 2026)

### Palette officielle
| Token | Hex | Rôle |
|---|---|---|
| `--night` | `#1A1410` | Fond principal, texte |
| `--brique` | `#C8431A` | **Couleur d'action, CTA — COULEUR PRIMAIRE** |
| `--or` | `#D4A820` | Accent signature, icône admin |
| `--creme` | `#F7F2E8` | Fond clair, header, tab bar |
| `--terre` | `#8C5A40` | Texte secondaire |
| `--brume` | `#E8E0D0` | Borders, séparateurs |

**⚠️ Le vert `#1D9E75` est SUPPRIMÉ — ne jamais réutiliser.**
**`#C8431A` est la seule couleur d'action (CTA, liens actifs, boutons).**

### Typographie
| Police | Usage |
|---|---|
| Playfair Display Italic Bold | H1, titres, logo wordmark |
| DM Serif Display Italic | H2, sous-titres, citations |
| DM Sans 300/400/500 | Corps, interface, navigation |

### Règles d'usage (brandbook)
- Fond écran principal : Crème (`#F7F2E8`) — thème clair
- Header : fond `#F7F2E8`, logo `#1A1410` + `#C8431A`
- Bouton CTA : Brique sur Crème
- Accent : Or — jamais seul
- Texte sur fond clair : `#1A1410` uniquement
- Texte sur fond sombre : `#F7F2E8` uniquement
- Logo sur fond Nuit ou Crème uniquement
- Ne jamais utiliser Brique comme fond principal

### Ratios WCAG
- Crème sur Nuit : 15.3:1 (AAA)
- Crème sur Brique : 4.6:1 (AA)
- Nuit sur Or : 8.1:1 (AAA)

---

## 5. ARCHITECTURE FICHIERS
lotbo/                              ← app.lotbo.app
├── app/
│   ├── admin/page.tsx              — Panel admin (protégé middleware)
│   ├── ajouter/page.tsx            — Formulaire ajout événement (ouvert à tous)
│   ├── apropos/page.tsx            — Page À propos + fondateur + photo
│   ├── desinscription/page.tsx     — Désinscription notifications email
│   ├── inscription/page.tsx        — Inscription notifications visiteur
│   ├── api/
│   │   ├── newsletter/route.ts         — Newsletter Brevo hebdomadaire
│   │   ├── notify-admin/route.ts       — Notification email admin nouvel événement
│   │   ├── notify-abonnes/route.ts     — Notification email abonnés à l'approbation
│   │   ├── push-subscribe/route.ts     — Enregistrement subscriptions push PWA
│   │   ├── push-notify/route.ts        — Envoi notifications push PWA
│   │   ├── scrape-sports/route.ts      — Scraper TheSportsDB (13 ligues + FIFA WC)
│   │   ├── scrape-ticketmaster/route.ts — Scraper Ticketmaster
│   │   ├── scrape-worldcup/route.ts    — Scraper FIFA World Cup 2026 (72 matchs)
│   │   ├── scrape-liguehaitienne/route.ts — Scraper Ligue Haïtienne Football
│   │   ├── scrape-eventbrite/route.ts  — Scraper Wikimedia
│   │   └── stats/route.ts              — API stats publiques (événements/villes/pays)
│   ├── evenement/[id]/
│   │   ├── page.tsx                — Server component + generateMetadata
│   │   ├── EvenementClient.tsx     — Client component page détail + commentaires
│   │   └── opengraph-image.tsx     — og:image dynamique (1200x630)
│   ├── login/page.tsx              — Auth organisateurs + admin
│   ├── profil/page.tsx             — Profil utilisateur
│   ├── sitemap.ts                  — Sitemap SEO dynamique
│   ├── globals.css                 — Tokens design + responsive + tab bar 5 onglets
│   ├── layout.tsx                  — Root layout + polices + theme-color
│   ├── page.tsx                    — App principale (carte + liste + filtres)
│   └── popup.css                   — Styles popups Mapbox
├── lib/
│   ├── supabase.ts                 — Client Supabase (anon)
│   └── i18n.ts                     — Traductions 5 langues
├── middleware.ts                   — Protection route /admin (serveur)
├── tailwind.config.ts              — Palette Tailwind officielle
├── vercel.json                     — CRONs : newsletter, sports, ticketmaster, liguehaitienne, worldcup
├── MASTER_CONTEXT.md               — Ce fichier
└── public/
├── manifest.json               — PWA (theme_color: #1A1410)
├── sw.js                       — Service Worker PWA + push notifications
├── hero-fondateur.jpg          — Photo fondateur (page apropos)
└── Logomark.png                — Faviconlotbo-landing/                      ← lotbo.app
├── api/
│   └── subscribe.js                — Route API inscription Brevo (clé serveur)
├── hero-femme.jpg                  — Photo hero landing
├── index.html                      — Landing page complète + compteurs dynamiques
├── package.json                    — Config minimale
└── vercel.json                     — Config Vercel + routes statiques

---

## 6. INTERNATIONALISATION

**5 langues :** FR · EN · ES · PT · KW (kreyòl)
**Règle absolue :** toute nouvelle chaîne de texte doit être ajoutée aux 5 fichiers JSON simultanément.

---

## 7. BASE DE DONNÉES SUPABASE

### Table `evenements` — colonnes principales
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `titre` | text | |
| `organisateur` | text | Ajouté le 10 mai 2026 |
| `lieu` | text | |
| `date` | text | Format libre |
| `date_debut` | date | Format ISO pour filtres |
| `heure_debut` | text | |
| `heure_fin` | text | Non obligatoire |
| `categorie` | text | Voir taxonomie |
| `event_type_id` | int | FK → types |
| `description` | text | |
| `lien` | text | |
| `longitude` | float | |
| `latitude` | float | |
| `acces` | text | `public` / `prive` |
| `prix` | text | `gratuit` / `payant` |
| `image_url` | text | Storage Supabase |
| `statut` | text | Voir statuts |
| `user_id` | uuid | null si anonyme |
| `source` | text | `wikimedia` / `sports` / `ticketmaster` / `worldcup2026` / `liguehaitienne` / null |
| `source_id` | text | ID source externe (anti-doublon) |

### Table `abonnements` — notifications email visiteurs
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | UNIQUE |
| `ville` | text | Ville de l'abonné |
| `categories` | text[] | Catégories suivies (vide = toutes) |
| `created_at` | timestamptz | |

### Table `commentaires` — commentaires événements
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `evenement_id` | uuid | FK → evenements (CASCADE DELETE) |
| `auteur` | text | Prénom ou pseudo |
| `contenu` | text | Max 500 chars |
| `created_at` | timestamptz | |

### Table `push_subscriptions` — notifications push PWA
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `endpoint` | text | UNIQUE |
| `p256dh` | text | Clé publique |
| `auth` | text | Auth secret |
| `created_at` | timestamptz | |

### Statuts événements
| Statut | Visible public | Description |
|---|---|---|
| `en_attente` | ❌ | Soumis, attend validation |
| `approuve` | ✅ | Validé par admin, visible sur carte |
| `rejete` | ❌ | Refusé par admin |
| `publié` | ❌ | Ancien statut — ne plus utiliser |
| `à compléter` | ❌ | Wikimedia incomplet (coords 0,0) |

### RLS — table `evenements` (6 policies)
| Policy | Cmd | Rôles | Condition |
|---|---|---|---|
| `lecture_publique_evenements_approuves` | SELECT | anon, authenticated | `statut = 'approuve'` |
| `lecture_proprietaire_ses_evenements` | SELECT | authenticated | `auth.uid() = user_id` |
| `insertion_ouverte` | INSERT | anon, authenticated | `statut = 'en_attente'` |
| `modification_proprietaire` | UPDATE | authenticated | `auth.uid() = user_id` |
| `suppression_proprietaire` | DELETE | authenticated | `auth.uid() = user_id` |
| `admin_acces_total` | ALL | authenticated | `role = 'admin'` |

### RLS — table `commentaires` (3 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `lecture_publique_commentaires` | SELECT | anon, authenticated |
| `insertion_ouverte_commentaires` | INSERT | anon, authenticated |
| `admin_suppression_commentaires` | DELETE | authenticated (admin) |

### RLS — table `push_subscriptions` (2 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_push_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_push` | SELECT | authenticated (admin) |

### RLS — table `abonnements` (4 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_abonnements_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_abonnements` | SELECT | authenticated (admin) |
| `admin_suppression_abonnements` | DELETE | authenticated (admin) |
| `desinscription_par_email` | DELETE | anon, authenticated |

---

## 8. AUTHENTIFICATION & RÔLES

### Utilisateurs
| Email | Rôle | user_id |
|---|---|---|
| `sambayo23@gmail.com` | `admin` | `ff21f2e0-135d-4996-9713-4a0e20c38fe1` |

### Système de rôles
- Rôle stocké dans `auth.users.raw_user_meta_data.role`
- Valeur : `"admin"` pour l'admin
- Lu via `auth.jwt() -> 'user_metadata' ->> 'role'`
- Middleware vérifie le rôle côté serveur avant d'accéder à `/admin`
- Login → redirect `/admin` si admin, `/ajouter` sinon

### Modèle d'accès
---

## 6. INTERNATIONALISATION

**5 langues :** FR · EN · ES · PT · KW (kreyòl)
**Règle absolue :** toute nouvelle chaîne de texte doit être ajoutée aux 5 fichiers JSON simultanément.

---

## 7. BASE DE DONNÉES SUPABASE

### Table `evenements` — colonnes principales
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `titre` | text | |
| `organisateur` | text | Ajouté le 10 mai 2026 |
| `lieu` | text | |
| `date` | text | Format libre |
| `date_debut` | date | Format ISO pour filtres |
| `heure_debut` | text | |
| `heure_fin` | text | Non obligatoire |
| `categorie` | text | Voir taxonomie |
| `event_type_id` | int | FK → types |
| `description` | text | |
| `lien` | text | |
| `longitude` | float | |
| `latitude` | float | |
| `acces` | text | `public` / `prive` |
| `prix` | text | `gratuit` / `payant` |
| `image_url` | text | Storage Supabase |
| `statut` | text | Voir statuts |
| `user_id` | uuid | null si anonyme |
| `source` | text | `wikimedia` / `sports` / `ticketmaster` / `worldcup2026` / `liguehaitienne` / null |
| `source_id` | text | ID source externe (anti-doublon) |

### Table `abonnements` — notifications email visiteurs
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | UNIQUE |
| `ville` | text | Ville de l'abonné |
| `categories` | text[] | Catégories suivies (vide = toutes) |
| `created_at` | timestamptz | |

### Table `commentaires` — commentaires événements
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `evenement_id` | uuid | FK → evenements (CASCADE DELETE) |
| `auteur` | text | Prénom ou pseudo |
| `contenu` | text | Max 500 chars |
| `created_at` | timestamptz | |

### Table `push_subscriptions` — notifications push PWA
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `endpoint` | text | UNIQUE |
| `p256dh` | text | Clé publique |
| `auth` | text | Auth secret |
| `created_at` | timestamptz | |

### Statuts événements
| Statut | Visible public | Description |
|---|---|---|
| `en_attente` | ❌ | Soumis, attend validation |
| `approuve` | ✅ | Validé par admin, visible sur carte |
| `rejete` | ❌ | Refusé par admin |
| `publié` | ❌ | Ancien statut — ne plus utiliser |
| `à compléter` | ❌ | Wikimedia incomplet (coords 0,0) |

### RLS — table `evenements` (6 policies)
| Policy | Cmd | Rôles | Condition |
|---|---|---|---|
| `lecture_publique_evenements_approuves` | SELECT | anon, authenticated | `statut = 'approuve'` |
| `lecture_proprietaire_ses_evenements` | SELECT | authenticated | `auth.uid() = user_id` |
| `insertion_ouverte` | INSERT | anon, authenticated | `statut = 'en_attente'` |
| `modification_proprietaire` | UPDATE | authenticated | `auth.uid() = user_id` |
| `suppression_proprietaire` | DELETE | authenticated | `auth.uid() = user_id` |
| `admin_acces_total` | ALL | authenticated | `role = 'admin'` |

### RLS — table `commentaires` (3 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `lecture_publique_commentaires` | SELECT | anon, authenticated |
| `insertion_ouverte_commentaires` | INSERT | anon, authenticated |
| `admin_suppression_commentaires` | DELETE | authenticated (admin) |

### RLS — table `push_subscriptions` (2 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_push_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_push` | SELECT | authenticated (admin) |

### RLS — table `abonnements` (4 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_abonnements_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_abonnements` | SELECT | authenticated (admin) |
| `admin_suppression_abonnements` | DELETE | authenticated (admin) |
| `desinscription_par_email` | DELETE | anon, authenticated |

---

## 8. AUTHENTIFICATION & RÔLES

### Utilisateurs
| Email | Rôle | user_id |
|---|---|---|
| `sambayo23@gmail.com` | `admin` | `ff21f2e0-135d-4996-9713-4a0e20c38fe1` |

### Système de rôles
- Rôle stocké dans `auth.users.raw_user_meta_data.role`
- Valeur : `"admin"` pour l'admin
- Lu via `auth.jwt() -> 'user_metadata' ->> 'role'`
- Middleware vérifie le rôle côté serveur avant d'accéder à `/admin`
- Login → redirect `/admin` si admin, `/ajouter` sinon

### Modèle d'accès

---

## 9. TAXONOMIE ÉVÉNEMENTS

### 12 Types principaux (event_type_id)
1. Conférence / Sommet 🎤
2. Concert / Spectacle 🎶
3. Foire / Exposition 🏪
4. Culte / Cérémonie religieuse ⛪
5. Festival 🎉
6. Tournoi / Compétition 🏆
7. Inauguration / Lancement 🎊
8. Assemblée / Réunion 🤝
9. Formation / Séminaire 📚
10. Célébration communautaire 🌍
11. Droit / Juridique ⚖️
12. Loisir 🎯

### 17 Thèmes (many-to-many via `evenement_themes`)
Religion · Politique · Business · Culture · Gastronomie · Littérature · Art · Artisanat · Sport · Technologie · Éducation · Social · Musique · Cinéma · Mode · Santé · Environnement

---

## 10. FONCTIONNALITÉS LIVRÉES

### `app/page.tsx` — App principale
- Carte Mapbox `streets-v12` (warm/clair) centrée sur Haïti
- Header `#F7F2E8` fond clair, logo `#1A1410` + `#C8431A`
- **Mobile :** `[☰ Menu]` `[lotbo]` `[+ Ajouter]` + tab bar 5 onglets bas
- **Desktop :** `[À propos]` `[Langue]` `[Connexion/Profil]` `[+ Ajouter]`
- Drawer : langue + connexion + notifications email + push + profil + admin
- Tab bar 5 onglets : Home · Événements · Carte (centrer GPS) · Alertes · Profil
- Popup carte : image + infos + `[Voir →]` + `[🧭 S'y rendre]`
- Filtres : catégorie / accès / prix / dates
- Vue liste : fond `#F7F2E8`, cartes blanches

### `app/evenement/[id]/EvenementClient.tsx`
- ❤️ Like anonyme localStorage
- 👤 Organisateur affiché si disponible
- 🧭 S'y rendre → Google Maps
- Barre actions : `[❤️ J'aime]` `[⚠️ Signaler]` `[📱 WA]` `[📘 FB]` `[𝕏 X]`
- Signalement : modal bottom sheet
- 💬 Commentaires — form + liste (anonyme, auteur + contenu)
- Événements similaires

### `app/admin/page.tsx`
- Compteurs : Total / En attente / Approuvés / Rejetés / Villes / Pays
- Filtres onglets : En attente · Approuvés · Rejetés · Tous
- Recherche par titre / lieu / organisateur
- Organisateur affiché dans chaque carte
- Source affichée (scraper / manuel)
- Approuver → notify-abonnes + push-notify

### Routes API
| Route | Déclencheur | Action |
|---|---|---|
| `notify-admin` | Soumission événement | Email à `sambayo23@gmail.com` |
| `notify-abonnes` | Approbation événement | Email abonnés ville+catégorie |
| `push-subscribe` | Bouton drawer | Enregistre subscription push |
| `push-notify` | Approbation événement | Push PWA à tous les abonnés |
| `newsletter` | CRON lundi 9h UTC | Email hebdomadaire liste Brevo |
| `scrape-sports` | CRON nuit 2h UTC | TheSportsDB 13 ligues |
| `scrape-ticketmaster` | CRON nuit 3h UTC | Ticketmaster 4 segments |
| `scrape-worldcup` | CRON nuit 5h UTC | FIFA World Cup 2026 — 72 matchs |
| `scrape-liguehaitienne` | CRON nuit 4h UTC | Ligue Haïtienne Football |
| `scrape-eventbrite` | Manuel | Scrape Wikimedia + géocode |
| `stats` | Landing toutes 5min | Compteurs événements/villes/pays |

### Scrapers automatiques
| Source | Contenu | CRON |
|---|---|---|
| TheSportsDB | Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, NBA, MLB, NHL, NFL, F1, UFC, Rugby | 2h UTC |
| Ticketmaster | Musique, Sports, Arts & Theatre, Family | 3h UTC |
| FIFA World Cup | 72 matchs — tous les rounds (groupes + finale) | 5h UTC |
| Ligue Haïtienne | Matchs Championnat National (stades géocodés) | 4h UTC |
| Wikimedia | Événements culturels | Manuel |

**IDs TheSportsDB :** Premier League `4328` · La Liga `4335` · Bundesliga `4331` · Serie A `4332` · Ligue 1 `4334` · Champions League `4480` · NBA `4387` · MLB `4424` · NHL `4380` · NFL `4391` · F1 `4370` · UFC `4443` · Rugby `4462` · **FIFA World Cup 2026 `4429`**

### `lotbo-landing/index.html`
- Hero 2 colonnes desktop : texte gauche + photo femme droite (pleine hauteur)
- Compteurs dynamiques animés : **185+ événements · 55+ villes · 12+ pays**
- Refresh automatique toutes les 5 minutes
- Map mockup + pills filtres
- Section "Comment ça marche" avec mockup téléphone LOTBO
- Formulaire inscription → Brevo liste 3
- CTA final + footer

---

## 11. VARIABLES D'ENVIRONNEMENT

### `app.lotbo.app` (Vercel — projet lotbo)
| Variable | Côté | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Serveur | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Serveur | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement | Admin + scrapers + push |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client + Serveur | Mapbox geocoding + carte |
| `BREVO_API_KEY` | Serveur uniquement | Toutes les routes email |
| `TICKETMASTER_API_KEY` | Serveur uniquement | Scraper Ticketmaster |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client + Serveur | Notifications push PWA |
| `VAPID_PRIVATE_KEY` | Serveur uniquement | Notifications push PWA |
| `VAPID_EMAIL` | Serveur uniquement | `mailto:hello@lotbo.app` |

### `lotbo.app` (Vercel — projet lotbo-landing)
| Variable | Côté | Usage |
|---|---|---|
| `BREVO_API_KEY` | Serveur uniquement | Inscription liste d'attente |

**⚠️ Règles absolues :**
- `SUPABASE_SERVICE_ROLE_KEY` — jamais exposé côté client
- `BREVO_API_KEY` — jamais exposé côté client
- `VAPID_PRIVATE_KEY` — jamais exposé côté client
- Ne jamais coller une clé API dans une conversation Claude

---

## 12. RÈGLES DE DÉVELOPPEMENT ABSOLUES

1. **Mobile-first obligatoire** — tester 375px en premier
2. **Jamais `position: absolute` dans le header**
3. **Jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client**
4. **Jamais bypasser RLS Supabase** sauf routes serveur avec `SERVICE_ROLE_KEY`
5. **TypeScript strict** — jamais de `any`
6. **Toujours mettre à jour les 5 fichiers de traduction simultanément**
7. **Toujours livrer des fichiers complets**, jamais des extraits
8. **Jamais instancier Supabase au niveau racine** d'une route API
9. **`statut: 'en_attente'`** pour toute nouvelle soumission manuelle
10. **`statut: 'approuve'`** pour les événements scrapés (source fiable)
11. **Toute nouvelle colonne DB** doit vérifier si elle existe déjà
12. **Jamais exposer une clé API** dans le code ou dans une conversation
13. **`lotbo.app` est le domaine primary** — pas `www.lotbo.app`
14. **`params` est une Promise** dans Next.js 16 — toujours `await params`
15. **Anti-doublon scrapers** — vérifier `source` + `source_id` avant insertion
16. **Push subscriptions expirées** — supprimer automatiquement si sendNotification échoue

---

## 13. BACKLOG

### 🟢 Backlog
- Option B soumission (compte requis) — activer quand spam devient problème
- Workflow validation événements Wikimedia
- SEO — soumettre sitemap à Google Search Console
- Coupe du Monde 2026 — scraper tourne, matchs en DB jusqu'à la finale
- Ligue Haïtienne — scraper actif, prochaine saison à venir

---

## 14. HISTORIQUE DES DÉCISIONS

| Date | Décision | Raison |
|---|---|---|
| 5 mai 2026 | Couleur primaire `#C8431A` (Brique) | Alignement brandbook v1.0 officiel |
| 5 mai 2026 | Suppression `#1D9E75` (vert) | Couleur IA générée avant le vrai logo |
| 8 mai 2026 | RLS activé sur 4 tables | Sécurité — table ouverte = danger |
| 8 mai 2026 | Soumission ouverte (Option A) | Réduire friction, modération admin |
| 8 mai 2026 | Middleware admin serveur | Protection `/admin` côté client insuffisante |
| 8 mai 2026 | Drawer hamburger mobile | Header trop encombré sur 375px |
| 8 mai 2026 | Tab bar mobile Carte/Liste | Navigation native mobile |
| 9 mai 2026 | Thème clair `#F7F2E8` adopté | Demande fondateur — interface chaleureuse |
| 9 mai 2026 | Carte `streets-v12` (warm) | Plus lisible que dark-v11 |
| 9 mai 2026 | Tab bar 5 onglets natifs | Inspiration maquette mobile |
| 9 mai 2026 | Like anonyme localStorage | Zéro friction, pas de compte requis |
| 9 mai 2026 | Navigation Google Maps | Lien coordonnées popup + page event |
| 9 mai 2026 | Scraper TheSportsDB 13 ligues | Source gratuite, données riches |
| 9 mai 2026 | Scraper Ticketmaster 4 segments | 318k+ événements mondiaux |
| 9 mai 2026 | notify-abonnes SERVICE_ROLE_KEY | RLS bloquait lecture abonnements |
| 10 mai 2026 | FIFA World Cup 2026 — 72 matchs | TheSportsDB ID 4429 disponible |
| 10 mai 2026 | Ligue Haïtienne scraper | Stades géocodés par ville |
| 10 mai 2026 | Commentaires anonymes | Engagement communauté sans friction |
| 10 mai 2026 | Notifications push PWA VAPID | Alertes natives sans app store |
| 10 mai 2026 | Sitemap dynamique 185+ pages | SEO — indexation Google |
| 10 mai 2026 | Compteurs dynamiques landing | Preuve sociale — 185+/55+/12+ |
| 10 mai 2026 | Champ organisateur | Barreau de Petit-Goâve use case |
| 10 mai 2026 | TMDB abandonné | Plan commercial $149/mois |

---

## 15. COMMANDES UTILES

```bash
# Développement local
cd ~/lotbo && npm run dev

# Tuer un process bloquant
kill PID && npm run dev

# Nettoyer le cache Turbopack
rm -rf .next && npm run dev

# Tester notify-abonnes en local
curl -X POST http://localhost:3000/api/notify-abonnes \
  -H "Content-Type: application/json" \
  -d '{"titre":"Test","lieu":"Petit-Goâve","date":"2026-05-28","categorie":"Culture","id":"UUID"}'

# Tester scrapers en production
curl https://app.lotbo.app/api/scrape-sports
curl https://app.lotbo.app/api/scrape-ticketmaster
curl https://app.lotbo.app/api/scrape-worldcup
curl https://app.lotbo.app/api/scrape-liguehaitienne

# Tester stats
curl https://app.lotbo.app/api/stats

# Vérifier les policies RLS
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('evenements','abonnements','commentaires','push_subscriptions')
ORDER BY tablename, cmd;

# Vérifier événements par source
SELECT source, COUNT(*) FROM evenements GROUP BY source ORDER BY count DESC;

# Vérifier matchs Mondial
SELECT titre, lieu, date FROM evenements
WHERE source = 'worldcup2026' ORDER BY date ASC LIMIT 10;

# Déployer app
cd ~/lotbo && git add . && git commit -m "message" && git push

# Déployer landing
cd ~/lotbo-landing && git add . && git commit -m "message" && git push
```