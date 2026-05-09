# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 9 mai 2026
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
| Brevo | API v3 | Newsletter + Notifications |
| Vercel | latest | Hébergement + CI/CD |

---

## 4. IDENTITÉ VISUELLE — brandbook v1.0 (5 mai 2026)

### Palette officielle
| Token | Hex | Rôle |
|---|---|---|
| `--night` | `#1A1410` | Fond principal, texte |
| `--brique` | `#C8431A` | **Couleur d'action, CTA — COULEUR PRIMAIRE** |
| `--or` | `#D4A820` | Accent signature, icône admin |
| `--creme` | `#F7F2E8` | Fond clair, texte sur sombre |
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
- Fond écran principal : Nuit + Crème
- Bouton CTA : Brique sur Nuit ou Crème
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
│   ├── apropos/page.tsx            — Page À propos + fondateur
│   ├── inscription/page.tsx        — Inscription notifications visiteur
│   ├── api/
│   │   ├── newsletter/route.ts     — Newsletter Brevo hebdomadaire
│   │   ├── notify-admin/route.ts   — Notification email admin nouvel événement
│   │   ├── notify-abonnes/route.ts — Notification email abonnés à l'approbation
│   │   └── scrape-eventbrite/route.ts — Scraper Wikimedia
│   ├── evenement/[id]/
│   │   ├── page.tsx                — Server component + generateMetadata
│   │   ├── EvenementClient.tsx     — Client component page détail
│   │   └── opengraph-image.tsx     — og:image dynamique (1200x630)
│   ├── login/page.tsx              — Auth organisateurs + admin
│   ├── profil/page.tsx             — Profil utilisateur
│   ├── globals.css                 — Tokens design + responsive
│   ├── layout.tsx                  — Root layout + polices + theme-color
│   ├── page.tsx                    — App principale (carte + liste + filtres)
│   └── popup.css                   — Styles popups Mapbox
├── lib/
│   ├── supabase.ts                 — Client Supabase (anon)
│   └── i18n.ts                     — Traductions 5 langues
├── middleware.ts                   — Protection route /admin (serveur)
├── tailwind.config.ts              — Palette Tailwind officielle
├── MASTER_CONTEXT.md               — Ce fichier
└── public/
├── manifest.json               — PWA (theme_color: #1A1410)
└── Logomark.png                — Faviconlotbo-landing/                      ← lotbo.app
├── api/
│   └── subscribe.js                — Route API inscription Brevo (clé serveur)
├── index.html                      — Landing page complète
├── package.json                    — Config minimale
└── vercel.json                     — Config Vercel

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
| `lieu` | text | |
| `date` | text | Format libre |
| `date_debut` | date | Format ISO pour filtres |
| `heure_debut` | text | Ajoutée le 9 mai 2026 |
| `heure_fin` | text | |
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
| `source` | text | `wikimedia` / null |
| `source_id` | text | ID source externe |

### Table `abonnements` — notifications visiteurs
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | UNIQUE |
| `ville` | text | Ville de l'abonné |
| `categories` | text[] | Catégories suivies (vide = toutes) |
| `created_at` | timestamptz | |

### Statuts événements
| Statut | Visible public | Description |
|---|---|---|
| `en_attente` | ❌ | Soumis, attend validation |
| `approuve` | ✅ | Validé par admin, visible sur carte |
| `rejete` | ❌ | Refusé par admin |
| `publié` | ❌ | Ancien statut — ne plus utiliser |
| `à compléter` | ❌ | Wikimedia incomplet (coords 0,0) |

**⚠️ Ne jamais utiliser `'publié'` — utiliser `'approuve'` uniquement.**

### RLS Supabase — table `evenements` (6 policies)
| Policy | Cmd | Rôles | Condition |
|---|---|---|---|
| `lecture_publique_evenements_approuves` | SELECT | anon, authenticated | `statut = 'approuve'` |
| `lecture_proprietaire_ses_evenements` | SELECT | authenticated | `auth.uid() = user_id` |
| `insertion_ouverte` | INSERT | anon, authenticated | `statut = 'en_attente'` |
| `modification_proprietaire` | UPDATE | authenticated | `auth.uid() = user_id` |
| `suppression_proprietaire` | DELETE | authenticated | `auth.uid() = user_id` |
| `admin_acces_total` | ALL | authenticated | `role = 'admin'` OU `statut = 'en_attente'` |

### RLS Supabase — table `evenement_themes` (3 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `lecture_publique_themes` | SELECT | anon, authenticated |
| `insertion_ouverte_themes` | INSERT | anon, authenticated |
| `admin_acces_total_themes` | ALL | authenticated (admin) |

### RLS Supabase — table `signalements` (3 policies)
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_signalements_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_signalements` | SELECT | authenticated (admin) |
| `admin_suppression_signalements` | DELETE | authenticated (admin) |

### RLS Supabase — table `abonnements` (3 policies)
| Policy | Cmd | Rôles | Condition |
|---|---|---|---|
| `insertion_abonnements_ouverte` | INSERT | anon, authenticated | true |
| `admin_lecture_abonnements` | SELECT | authenticated (admin) | role = 'admin' |
| `admin_suppression_abonnements` | DELETE | authenticated (admin) | role = 'admin' |

**⚠️ `notify-abonnes/route.ts` utilise `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS et lire les abonnés.**

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
Visiteur anonyme   → voit les événements approuvés
Tout le monde      → peut soumettre un événement (Option A — ouvert)
Tout le monde      → peut signaler un événement
Tout le monde      → peut s'inscrire aux notifications par ville
Admin              → approuve / rejette / supprime tout

---

## 9. TAXONOMIE ÉVÉNEMENTS

### 10 Types principaux (event_type_id)
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

### 17 Thèmes (many-to-many via `evenement_themes`)
Religion · Politique · Business · Culture · Gastronomie · Littérature · Art · Artisanat · Sport · Technologie · Éducation · Social · Musique · Cinéma · Mode · Santé · Environnement

---

## 10. FONCTIONNALITÉS LIVRÉES

### `app/page.tsx` — App principale
- Carte Mapbox dark (`dark-v11`) centrée sur Haïti
- Header `#1A1410` fond solide, flex mobile-first
- **Mobile :** `[☰ Menu]` `[lotbo]` `[+ Ajouter]` + tab bar bas
- **Desktop :** `[À propos]` `[Langue]` `[Connexion/Profil]` `[+ Ajouter]`
- Drawer : langue + connexion + notifications + profil + admin + déconnexion
- Tab bar mobile : switcher Carte/Liste centré
- Popup carte : image + infos + `[Voir →]` + `[🧭 S'y rendre]`
- Filtres : catégorie / accès / prix / dates
- Vue liste : fond `#1A1410`, overflow corrigé

### `app/evenement/[id]/` — Page détail événement
- `page.tsx` — server component + `generateMetadata` og complet
- `EvenementClient.tsx` — client component
  - ❤️ Like anonyme localStorage
  - Barre actions : `[❤️ J'aime]` `[⚠️ Signaler]` `[📱 WA]` `[📘 FB]` `[𝕏 X]`
  - Signalement : modal bottom sheet
  - `[🧭 S'y rendre]` → Google Maps avec coordonnées
  - Événements similaires
- `opengraph-image.tsx` — og:image 1200x630 dynamique
  - Image fond si disponible + overlay gradient
  - Logo + badge catégorie + titre + lieu + date + CTA

### `app/apropos/page.tsx`
- Histoire, mission, valeurs, fondateur
- Handgod Abraham · Fondateur · Petit-Goâve, Haïti
- Accessible depuis drawer mobile + nav desktop

### `app/inscription/page.tsx`
- Email + ville + catégories préférées
- Insertion dans table `abonnements`
- Accessible depuis drawer (connecté et non connecté)

### `app/admin/page.tsx`
- Double vérification rôle
- Actions : Approuver / Rejeter / Supprimer
- Approuver → déclenche `notify-abonnes` automatiquement
- Signalements visibles

### Routes API
| Route | Déclencheur | Action |
|---|---|---|
| `notify-admin` | Soumission événement | Email à `sambayo23@gmail.com` |
| `notify-abonnes` | Approbation événement | Email aux abonnés ville+catégorie |
| `newsletter` | Manuel / CRON | Email hebdomadaire liste Brevo |
| `scrape-eventbrite` | Manuel | Scrape Wikimedia + géocode |

### `lotbo-landing/`
- Formulaire inscription inline → `/api/subscribe` → Brevo liste 3
- Bouton "Voir les événements" → `app.lotbo.app`
- Palette officielle + footer 2026

---

## 11. VARIABLES D'ENVIRONNEMENT

### `app.lotbo.app` (Vercel — projet lotbo)
| Variable | Côté | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Serveur | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Serveur | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement | Admin + notify-abonnes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Client + Serveur | Mapbox geocoding + carte |
| `BREVO_API_KEY` | Serveur uniquement | Toutes les routes email |

### `lotbo.app` (Vercel — projet lotbo-landing)
| Variable | Côté | Usage |
|---|---|---|
| `BREVO_API_KEY` | Serveur uniquement | Inscription liste d'attente |

**⚠️ Règles absolues :**
- `SUPABASE_SERVICE_ROLE_KEY` — jamais exposé côté client
- `BREVO_API_KEY` — jamais exposé côté client
- Ne jamais coller une clé API dans une conversation Claude

---

## 12. RÈGLES DE DÉVELOPPEMENT ABSOLUES

1. **Mobile-first obligatoire** — tester 375px en premier
2. **Jamais `position: absolute` dans le header**
3. **Jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client**
4. **Jamais bypasser RLS Supabase** sauf dans les routes serveur avec `SERVICE_ROLE_KEY`
5. **TypeScript strict** — jamais de `any`
6. **Toujours mettre à jour les 5 fichiers de traduction simultanément**
7. **Toujours livrer des fichiers complets**, jamais des extraits
8. **Jamais instancier Supabase au niveau racine** d'une route API
9. **`statut: 'en_attente'`** pour toute nouvelle soumission
10. **Toute nouvelle colonne DB** doit vérifier si elle existe déjà
11. **Jamais exposer une clé API** dans le code HTML ou dans une conversation
12. **`lotbo.app` est le domaine primary** — pas `www.lotbo.app`
13. **`params` est une Promise** dans Next.js 16 — toujours `await params`

---

## 13. BACKLOG

### 🟡 Important
- Supprimer les `console.log` de debug dans `notify-abonnes/route.ts`
- Page désabonnement `/desinscription` pour les abonnés notifications

### 🟢 Backlog
- Option B soumission (compte requis) — activer quand spam devient problème
- Workflow validation événements Wikimedia
- Commentaires sur les événements
- Notifications push PWA
- SEO — sitemap dynamique

---

## 14. HISTORIQUE DES DÉCISIONS

| Date | Décision | Raison |
|---|---|---|
| 5 mai 2026 | Couleur primaire `#C8431A` (Brique) | Alignement brandbook v1.0 officiel |
| 5 mai 2026 | Suppression `#1D9E75` (vert) | Couleur IA générée avant le vrai logo |
| 8 mai 2026 | RLS activé sur 3 tables | Sécurité — table ouverte = danger |
| 8 mai 2026 | Soumission ouverte (Option A) | Réduire friction, modération admin |
| 8 mai 2026 | Statut Wikimedia `'publié'` → non visible | Données incomplètes (coords 0,0) |
| 8 mai 2026 | Middleware admin serveur | Protection `/admin` côté client insuffisante |
| 8 mai 2026 | Drawer hamburger mobile | Header trop encombré sur 375px |
| 8 mai 2026 | Tab bar mobile Carte/Liste | Navigation native mobile |
| 8 mai 2026 | Sender newsletter `hello@lotbo.app` | Gmail rejeté par Brevo |
| 9 mai 2026 | `lotbo.app` comme domaine primary | Redirection www cassait l'API subscribe |
| 9 mai 2026 | Route `/api/subscribe` serverless | Clé Brevo ne peut pas être dans le HTML |
| 9 mai 2026 | Colonne `heure_debut` ajoutée | Manquait dans le schéma initial |
| 9 mai 2026 | Policy `admin_acces_total` WITH CHECK élargi | Admin ne pouvait pas soumettre |
| 9 mai 2026 | Policy `lecture_proprietaire_ses_evenements` | Profil ne voyait pas ses événements |
| 9 mai 2026 | `params` await Promise Next.js 16 | opengraph-image params.id undefined |
| 9 mai 2026 | `notify-abonnes` utilise SERVICE_ROLE_KEY | RLS bloquait lecture abonnements |
| 9 mai 2026 | Like anonyme localStorage | Zéro friction, pas de compte requis |
| 9 mai 2026 | Navigation Google Maps | Lien coordonnées depuis popup + page event |

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

# Vérifier les policies RLS
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('evenements','evenement_themes','signalements','abonnements')
ORDER BY tablename, cmd;

# Déployer app
cd ~/lotbo && git add . && git commit -m "message" && git push

# Déployer landing
cd ~/lotbo-landing && git add . && git commit -m "message" && git push
```