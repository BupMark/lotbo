# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 22 mai 2026
> Architecte technique : Claude (Anthropic) via Claude Code
> Fondateur : Handgod Abraham
> Progression globale : 67%

---

## 📊 PROGRESSION GLOBALE — 22 mai 2026

```
Global                   ███████░░░  67%

Technique (produit)      ████████░░  72%
Marketing & Communauté   ███░░░░░░░  35%
Financement              ███░░░░░░░  35%
Partenariats             █░░░░░░░░░  15%
Opérations terrain       ██░░░░░░░░  20%
Vision Produit (PV1)     ██████████  100% rédigé · 0% validé équipe
```

---

## 1. VISION & IDENTITÉ
**Nom :** LOTBO — du kreyòl haïtien "lòt bò" (là-bas)
**Tagline principale :** "Tous les événements, un seul endroit."
**Née en Haïti le 5 mai 2026**
**Mission :** Plateforme mondiale de découverte d'événements locaux
**Entité légale :** Bup Mark Ltd · n° 15840780 · Manchester M40 8WN, UK
**Email :** lotbo@bup-mark.com · handgod@bup-mark.com

---

## 2. URLS DE PRODUCTION
| Surface | URL |
|---|---|
| Landing | `lotbo.app` |
| App | `app.lotbo.app` |
| Admin | `app.lotbo.app/admin` |
| Charte contributeur | `app.lotbo.app/contributeur/charte` |
| Classement | `app.lotbo.app/classement` |
| Login/Inscription | `app.lotbo.app/login` |
| Enquête Jacmel | `lotbo.app/enquete-jacmel` (à créer) |

---

## 3. STACK TECHNIQUE
| Technologie | Version | Usage |
|---|---|---|
| Next.js | 16.2.5 | App Router, SSR |
| TypeScript | strict | Typage complet |
| Supabase | latest | DB + Auth + Storage + RLS |
| @supabase/ssr | 0.10.3 | Middleware auth SSR |
| Mapbox GL JS | latest | Carte interactive |
| Google Places API | latest | Autocomplétion adresses formulaire |
| next-intl | latest | Internationalisation 5 langues |
| Brevo | API v3 | Newsletter + Notifications email + SMTP auth |
| Vercel Analytics | latest | Analytics production |
| Vercel | latest | Hébergement + CI/CD |
| GitHub Actions | latest | CRON scraping automatique |
| Claude Code | latest | Outil principal Directeur Technique |

---

## 4. IDENTITÉ VISUELLE

### Palette officielle APP
| Token | Hex | Rôle |
|---|---|---|
| `--night` | `#1A1410` | Texte principal, header |
| `--brique` | `#C8431A` | **Couleur primaire, CTA** |
| `--or` | `#D4A820` | Badges contributeur |
| `--creme` | `#F7F2E8` | **Fond principal toutes les pages** |
| `--terre` | `#8C5A40` | Textes secondaires |
| `--vert` | `#2D9E6B` | Confirmations, pays |

### Palette officielle LANDING
| Token | Hex | Rôle |
|---|---|---|
| `--night` | `#0B0603` | Fond principal |
| `--brique` | `#C8431A` | Accent principal |
| `--brique2` | `#FF5A1F` | Gradient accent |
| `--or` | `#D4A820` | Accent secondaire |

### Règles design
- **App — Fond toutes les pages : `#F7F2E8`** — jamais `#1A1410` sauf header/nav
- **Landing — Fond : `#0B0603`** — sombre premium avec blobs lumineux animés
- Couleur primaire app : `#C8431A`
- Vert `#1D9E75` BANNI — non validé par le fondateur

---

## 5. COMPTES & ACCÈS
| Service | Compte |
|---|---|
| Supabase | sambayo23@gmail.com — 4 mois Pro actifs + $100 crédits |
| Vercel | lotboapp-8362 |
| GitHub | BupMark/lotbo + BupMark/lotbo-landing |
| Google Cloud | bup-mark (Places API + Maps JS API) — agencebupmark@gmail.com |
| Unsplash | LOTBO app |
| PredictHQ | compte actif |
| Brevo | compte actif — SMTP configuré pour Supabase auth |
| Microsoft Azure | contact@bup-mark.com — $1,000 actifs (expire 17 août 2026) |
| AWS Activate | bup-mark.com — $1,000 approuvés |
| Google Cloud Startup | agencebupmark@gmail.com — soumis en évaluation |
| Anthropic Startup | soumis — réponse 2-4 semaines |
| Facebook Page | créée ✅ |
| Instagram | créé ✅ |
| X/Twitter | créé ✅ |

### Variables d'environnement requises
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_GOOGLE_PLACES_KEY
NEXT_PUBLIC_INTERNAL_API_SECRET  ← même valeur que INTERNAL_API_SECRET
INTERNAL_API_SECRET
PREDICTHQ_API_KEY
UNSPLASH_ACCESS_KEY
BREVO_API_KEY
VAPID_EMAIL
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

### ⚠️ Règles variables d'environnement
- `INTERNAL_API_SECRET` et `NEXT_PUBLIC_INTERNAL_API_SECRET` = **même valeur**
- Une seule ligne par variable dans `.env.local` — jamais de doublons
- Ne jamais utiliser de placeholder

---

## 6. ORGANISATION ÉQUIPE LOTBO

### Structure 7 directeurs
| Rôle | Conversation Claude |
|---|---|
| 🧠 Conseiller Stratégique | Conseiller Stratégique LOTBO |
| 👨‍💻 Directeur Technique | Directeur Technique LOTBO |
| 📈 Directeur Marketing & Croissance | Directeur Marketing & Croissance LOTBO |
| 💰 Directeur Financier & Subventions | Directeur Financier & Subventions LOTBO |
| 🌍 Directeur Produit | Directeur Produit LOTBO |
| 🤝 Directeur des Partenariats | Directeur des Partenariats LOTBO |
| 📋 Responsable Contenu & Import | Responsable Contenu & Import LOTBO |

### Protocole de travail
- Toute idée → Conseiller Stratégique d'abord
- MASTER_CONTEXT.md = backlog officiel unique
- PV1 = source de vérité vision produit
- Mise à jour MASTER_CONTEXT.md chaque vendredi minimum
- En fin de session noter : ✅ LIVRÉ · 🆕 DÉCOUVERT · 📊 PROGRESSION

---

## 7. HIÉRARCHIE DES RÔLES (figée — toute évolution = révision formelle PV1)
```
👁️ Visiteur          → sans compte
👤 Membre            → compte créé
⭐ Contributeur      → automatique au premier ajout validé
🎪 Organisateur      → choisi à l'inscription ou via soumission "Mon événement"
🌟 Contributeur Terrain → assigné par admin (mérite ou confiance)
🌍 Ambassadeur       → assigné par admin — zone géographique exclusive
🛡️ Admin Standard    → modération événements + gestion utilisateurs
👑 Super Admin       → accès total — Handgod Abraham
```

---

## 8. BASE DE DONNÉES — État colonnes

### Table `evenements`
```
id, titre, lieu, nom_lieu, adresse, ville, pays,
date, date_debut, date_fin, heure_debut, heure_fin,
fuseau_organisateur, categorie, event_type_id,
description, lien, image_url,
longitude, latitude,
statut (approuve/en_attente/hors_ligne/rejete),
visibilite (public/discret/prive),
lien_secret, code_acces, invites_emails, lieu_type,
acces, prix, organisateur, user_id,
nb_participants, source, source_id,
soumis_en_tant_que (organisateur/contributeur),
est_recurrent (boolean),
recurrence_regle (jsonb),
parent_id (uuid FK evenements.id),
personnalisee (boolean),
conferencier (text),
archive_le (timestamptz),
archive_par (uuid FK auth.users),
archive_raison (text),
created_at, updated_at
```

### Table `profiles`
```
id (uuid FK auth.users),
role (admin/ambassadeur/contributeur/organisateur/visiteur/membre),
charte_acceptee (boolean),
charte_acceptee_le (timestamptz),
badge (text),
points (integer),
points_utilisateur (integer),
points_organisateur (integer),
points_total (integer),
niveau (text — decouvreur/actif/contributeur/top_contributeur/elite/legende),
nom (text),
photo_url (text),
score_fiabilite (integer),
nb_evenements_approuves (integer),
nb_evenements_rejetes (integer),
nb_signalements_recus (integer),
eligible_contributeur_terrain (boolean),
created_at, updated_at
```

### Table `commentaires`
```
id, evenement_id, auteur, contenu, nb_likes,
parent_id (uuid FK commentaires.id),
created_at
```

### Table `reactions`
```
id, commentaire_id (FK), session_id, emoji, created_at
UNIQUE(commentaire_id, session_id, emoji) · RLS activé
```

### Table `push_subscriptions`
```
id, endpoint, p256dh, auth,
user_id (uuid FK auth.users),
created_at
```

### Table `import_logs`
```
id, source, statut, nb_importes, nb_doublons,
nb_erreurs, message_erreur, duree_ms, created_at
```

### Table `transactions_points`
```
id, user_id (FK auth.users), points, type, description,
evenement_id (FK evenements), created_at
```

### Table `abonnements`
```
id, email (unique), ville, categories (array), created_at
```

### Table `journees_speciales` (à créer)
```
id, mois, jour, nom_fr, nom_en, nom_es, nom_pt, nom_kw,
emoji, type (nationale/mondiale/culturelle/sport),
pays_code, filtre_categorie, actif, notifier_48h
```

### Table `notifications` (à créer)
```
id, user_id, type, titre, message, lien,
lu (boolean), cree_le, lu_le
```

### Table `modifications_evenements` (à créer)
```
id, evenement_id, propose_par, champ_modifie,
ancienne_valeur, nouvelle_valeur,
statut (en_attente/approuve/rejete),
propose_le, traite_le, traite_par, visible_publique
```

---

## 9. ADMIN
**Compte admin :** sambayo23@gmail.com
**UUID :** ff21f2e0-135d-4996-9713-4a0e20c38fe1

### Configuration Supabase Auth
- **Site URL :** `https://app.lotbo.app`
- **Redirect URLs :** `https://app.lotbo.app/auth/callback` · `https://app.lotbo.app/**`
- **SMTP custom :** Brevo · smtp-relay.brevo.com:587
- **Expéditeur :** LOTBO · hello@lotbo.app
- **Confirmation email :** désactivée (friction réduite)

---

## 10. FONCTIONNALITÉS LIVRÉES (au 22 mai 2026)

### Carte & Filtres
- ✅ Carte Mapbox interactive avec clusters
- ✅ Filtres catégorie/prix/date/accès
- ✅ Recherche full-text
- ✅ UX4 — Grille desktop 2/3/4 colonnes
- ✅ Filtre événements passés automatique

### Formulaire ajout événement
- ✅ MAP1/2/3 — Nom lieu + Carte Mapbox + Google Places autocomplete
- ✅ F4-F6 — Visibilité 3 niveaux + code_acces + lien_secret
- ✅ ROLE4 — Question "Mon événement / Je l'ai repéré" double rôle
- ✅ ENG1 — Page remerciement personnalisée
- ✅ F8 — Événements récurrents + génération occurrences + lien série
- ✅ F10 — Message incitatif image + 3 suggestions Unsplash 5 langues
- ✅ AUTH-FLUX1 — Redirect login si non connecté → retour formulaire
- ⚠️ GM1/GM2 attributerPoints commenté dans ajouter/page.tsx — à réactiver

### Auth & Profil
- ✅ AUTH-BUG1 — Page login séparée connexion/inscription
- ✅ AUTH-BUG2 — Email vérification branded LOTBO via Brevo SMTP
- ✅ AUTH-BUG3 — URL Supabase → app.lotbo.app
- ✅ AUTH-BUG4 — Titre "Rejoins LOTBO"
- ✅ Formulaire inscription : prénom + CGU + newsletter checkbox
- ✅ UX11 — Nom utilisateur modifiable
- ✅ UX6 — Upload photo profil
- ✅ ROLE6 — Double badge (Admin + Contributeur + Organisateur)
- ✅ ENG2 — Onglet Badges & Stats avec progression
- ✅ Google OAuth fonctionnel
- ✅ Facebook OAuth fonctionnel
- ✅ AUTH-BUG6/7 — Écran post-inscription amélioré
- ✅ Page RGPD /supprimer-donnees

### Admin
- ✅ Panel admin fond clair #F7F2E8
- ✅ ADMIN1 — Filtres temporels
- ✅ ADMIN2 — Navigation onglets scrollables mobile
- ✅ SC7 — Dashboard import
- ✅ Middleware admin — protection /admin via @supabase/ssr
- ✅ Hors ligne occurrences récurrentes — popup choix

### Engagement
- ✅ E1 — Bouton "Je serai là" + compteur
- ✅ E3b/E3c — CarteVisuelle fond clair + 3 dispositions
- ✅ E11 — Réponses commentaires 2 niveaux
- ✅ E12 — 6 réactions emoji
- ✅ ENG3-B/C/D — Badge débloqué : confetti + push PWA + email Brevo

### Gamification
- ✅ GM1/GM2 — Points utilisateur/organisateur (actifs sur EvenementClient)
- ✅ GM4 — Niveaux automatiques
- ✅ GM5 — Leaderboard public /classement
- ✅ GM12 — Classement personnel dans profil
- ✅ GM13 — CarteBadge partageable 3 formats · 5 langues · 6 fonds

### SEO
- ✅ SEO dynamique /evenement/[id]

### Scraping & Import
- ✅ SC1 — PredictHQ (1,633+ événements)
- ✅ SC5 — GitHub Actions CRON
- ✅ SC6 — Déduplication cross-sources
- ✅ SC7 — Dashboard import admin
- ✅ SC-PAMEVENT — Scraper pamevent.com (31 événements haïtiens)
- ✅ SC-PARIS — 11 événements Paris juillet 2026 (semaine Wikimania)
- ✅ 13 événements manuels importés

### Landing lotbo.app
- ✅ Design premium sombre #0B0603 + blobs animés
- ✅ LANDING-FEAT3 — CTAs distincts compte + newsletter
- ✅ Stats temps réel + Top villes/catégories dynamiques

### PWA
- ✅ manifest.json + sw.js — exclut /api/ et supabase.co

### Marketing & Communauté
- ✅ Facebook Page créée
- ✅ Instagram créé
- ✅ X/Twitter créé
- ✅ Couverture Facebook créée via Claude Design (à corriger EST.2024→2026)
- ✅ Premiers posts rédigés par plateforme
- ✅ Questionnaire enquête Jacmel — 10 questions FR/KW
- ✅ 2 formulaires HTML enquête (public + enquêteur)
- ✅ Répertoire 13 contacts établissements Haïti vérifiés
- ✅ Groupe WhatsApp "LOTBO Jacmel 🗺️🇭🇹" créé

### Vision Produit
- ✅ PV1 v2.0 rédigé — Document Vision Produit complet (7 sections)
- ✅ Hiérarchie rôles formalisée à 8 niveaux
- ✅ Journal décisions produit initialisé (6 entrées)
- ✅ Vision 2028 rédigée : 5M+ événements · 180+ pays · 50M+ utilisateurs

---

## 11. ROUTES API
| Route | Usage |
|---|---|
| `/api/stats` | Compteurs événements/villes/pays (CORS *) |
| `/api/top` | Top villes + catégories (CORS *) |
| `/api/scrape-predicthq` | Import PredictHQ + SC6 |
| `/api/scrape-ticketmaster` | Import Ticketmaster + SC6 |
| `/api/scrape-worldcup` | Import World Cup |
| `/api/scrape-liguehaitienne` | Import Ligue Haïtienne |
| `/api/scrape-pamevent` | Import pamevent.com |
| `/api/places-autocomplete` | Proxy Google Places |
| `/api/places-details` | Proxy Google Places coords |
| `/api/unsplash` | Image auto par catégorie |
| `/api/notify-admin` | Email admin Brevo |
| `/api/notify-badge` | Email badge débloqué |
| `/api/push-notify` | Push PWA broadcast |
| `/api/push-notify-badge` | Push PWA ciblé user_id |
| `/api/push-subscribe` | Enregistrement push + user_id |
| `/api/points` | Attribution points GM1/GM2/GM4 |
| `/api/generer-occurrences` | Génération occurrences récurrentes |

---

## 12. FICHIERS CLÉS
| Fichier | Usage |
|---|---|
| `lib/supabase.js` | Client Supabase — rester sur createClient standard |
| `lib/i18n.ts` | Traductions 5 langues |
| `lib/deduplication.ts` | Algorithme SC6 |
| `lib/points.ts` | Helper points GM1/GM2 — supabase importé dynamiquement |
| `middleware.ts` | Protection /admin via @supabase/ssr |
| `public/sw.js` | Service Worker PWA |
| `components/CarteVisuelle.tsx` | Carte visuelle — fond clair |
| `components/CarteBadge.tsx` | Carte badge GM13 |
| `app/login/page.tsx` | Connexion + inscription unifiée |
| `app/classement/page.tsx` | Leaderboard GM5 |
| `app/ajouter/page.tsx` | Formulaire — mapboxgl via require() — CarteBadge via dynamicImport |
| `app/evenement/[id]/EvenementClient.tsx` | Page événement — E11/E12/GM1 |

---

## 13. RÈGLES ABSOLUES

### Développement
- Mobile-first — tester 375px en premier
- Jamais `SUPABASE_SERVICE_ROLE_KEY` côté client
- `params` est une Promise Next.js 16 — toujours `await params`
- TypeScript strict — jamais de `any`
- Jamais `position: absolute` dans le header
- Toujours livrer des fichiers complets, jamais des extraits
- Route API : double auth — secret interne OU token Supabase
- `lib/points.ts` — supabase importé dynamiquement (pas au niveau racine)
- `app/ajouter/page.tsx` — mapboxgl via `require()` dans useEffect
- `CarteBadge` dans `ajouter/page.tsx` — via `dynamicImport` (ssr:false)
- Limite Supabase 1000 lignes → toujours utiliser `.limit(2000)` ou `count: exact`
- Ne jamais ré-imbriquer les addEventListener('fetch') dans sw.js
- Ne jamais activer AWS Organizations
- Facebook app — ne pas repasser en dev sans prévenir

### Design
- **App — Fond : `#F7F2E8`**
- **Landing — Fond : `#0B0603`**
- Primaire : `#C8431A`
- Vert `#1D9E75` BANNI

### Multilingue
- 5 langues : FR/EN/ES/PT/KW
- Toujours mettre à jour les 5 fichiers JSON simultanément

---

## 14. BACKLOG (au 22 mai 2026)

### 🔴 URGENT — Cette semaine

**Technique :**
- Header mobile — position:absolute → flex (375px)
- BUG2 — Changement nom profil cassé (texte invisible + pas de bouton Valider)
- BUG3 — Admin bouton "événements rejetés" ne filtre pas correctement
- BUG5 — Images événements non affichées (upload + stockage + affichage)
- E11 mobile — bouton "Mettre hors ligne" non visible mobile
- Filtres date mobile — composant dédié
- Cartes liste mobile — overflow non corrigé
- GM1 — Réactiver attributerPoints dans app/ajouter/page.tsx

**Marketing :**
- Corriger "EST. 2024" → "EST. 2026" couverture Facebook
- Publier couverture Facebook + premier post
- Recruter 2-3 co-enquêteurs pour Gaetchens
- Envoyer emails outreach établissements (Institut Français · Karibe Hotel · Galerie Monnin)
- Lancer enquête Jacmel lundi prochain
- Mettre en ligne formulaire lotbo.app/enquete-jacmel

**Financement :**
- AWS Offers Hub — chercher Supabase + autres partenaires
- AWS Startup Showcase — créer page LOTBO
- Supabase — confirmer crédits $100 avec Sean
- Product Hunt — lancer mardi/mercredi (4h01 heure Haïti)
- Mobiliser 20-30 contacts pour voter Product Hunt
- Vercel Startup Program — soumettre avec URL Product Hunt

**Produit :**
- Synchronisation PV1 ↔ MASTER_CONTEXT.md
- 6 décisions journal PV1 à ajouter au MASTER_CONTEXT.md
- PV1 à faire valider par tous les directeurs

### 🟡 IMPORTANT — Ce mois

**Technique :**
- FEAT-NAV1/2/3/4 — Navigation globale (landing + hamburger + bottom nav)
- BUG1 — Stats pays Haïti incohérentes (HT vs Haïti)
- BUG4 — Compteurs admin non cliquables → redirection sections
- UX-BUG1 — Choix type contribution peu visible dans formulaire /ajouter
- ADMIN3 — Traçabilité complète événements (soumis_par, approuve_par, modifie_par)
- ADMIN4 — Espace archivés + remise en ligne + filtres avancés
- F2 — Admin tableau utilisateurs enrichi (statut, rôle, activité, contributions)
- F3 — Invitation créer compte visiteurs non connectés
- F4 — Profil section "Mes contributions" (proposés/approuvés/en ligne)
- F5 — Raisons rejet/mise hors ligne — liste déroulante + email Brevo
- F6 — Notifications contextualisées par rôle
- F7 — Retour aux utilisateurs signaleurs
- F8 CRON — Régénération automatique occurrences récurrentes
- F9 — Admin accès complet événements privés avant approbation
- F8 PINS — Pins dynamiques événements en cours (pulse orange logomark)
- AUTH-BUG5 — Choix rôle inscription (Membre / Organisateur)
- AUTH-FEAT1 — Écran bienvenue post-inscription
- AUTH-FEAT2 — CGU pour connexions sociales
- NOTIF-APP — Système notifications in-app icône cloche
- SC-PAMEVENT — Géocodage automatique (variable Google Places)
- JACMEL2 — Formulaire enquête connecté Brevo/Supabase (après liste enquêteurs)
- GM6 — Score événements + Trending
- GM7 — Score réputation organisateurs
- GM8 — Section Trending temps réel
- GM9 — Newsletter hebdomadaire Brevo gamifiée
- GM11 — Notifications classement
- GM14 — Bouton favori 🔖
- HOME1 — Mise en avant automatique personnalisée
- UX3 — Pages desktop trop étroites
- S7 — Footer "Un produit de Bup Mark · Propulsé par Claude AI"
- FEAT-SPECIAL1 — Journées mondiales + fêtes nationales (table DB + notifications 48h)
- LIVE1 — Feature Live événement sur LOTBO

**Marketing :**
- Script radio Métronome Jacmel — segment hebdomadaire + spot JACMEL3
- Document mission officiel Gaetchens (stage 2 mois)
- Prompts Claude Design Instagram · TikTok · LinkedIn
- Créer TikTok LOTBO + LinkedIn LOTBO
- Créer chaîne YouTube LOTBO
- Ajouter événements Paris Wikimania avant juillet
- Contacter coordinateurs Wikimania personnellement
- Premier envoi newsletter Brevo liste existante

**Financement :**
- Google Search Console — indexer app.lotbo.app avec lotbo@bup-mark.com
- Google Analytics 4 — connecter avec lotbo@bup-mark.com
- LinkedIn profil — mettre à jour compétences LOTBO
- XRaise.ai — inscrire LOTBO crédits marketing
- Meta Ads — réclamer $600 crédits publicitaires
- Google Ads — réclamer $500 crédits publicitaires
- TikTok Ads — réclamer $300 crédits publicitaires

### 🟢 GROWTH — Quand possible

**Technique :**
- F1 — Carte "Je serai là" suppression arrière-plan photo (remove.bg)
- GM15 — Ligues hebdomadaires style Duolingo
- GM16 — Graphique activité personnelle 30 jours
- GR1 — Système referral — inviter des amis
- GRP1-GRP4 — Groupes discussion par événement
- HOME1 scraping — paris.fr open data scraper
- SEO1 — Schema.org Event JSON-LD structured data
- ANALYTICS2 — Google Analytics 4 tag layout.tsx
- SC2/SC3 — Meetup / Bandsintown API
- WIKI1 — Modèle éditorial collaboratif Wikipedia
- MAP6 — Clustering intelligent pins même lieu même jour
- ROLE9 — Éligibilité automatique Contributeur Terrain
- ROLE10 — Bannissement — niveaux et processus
- ROLE11 — Multi-admin (Super Admin / Standard / Modérateur)
- ADMIN2-ONGLETS — Ajouter onglet Boîte à idées public
- FEEDBACK1 — Boîte à idées publique communautaire
- JACMEL-LIVE — Feature live événement (idée Gaetchens)

**Marketing :**
- Modèle reproductible Jacmel → Cap-Haïtien · Gonaïves · Les Cayes
- Campagne diaspora Miami + Montréal
- Partenariats médias haïtiens en ligne
- Tutoriels IA automatiques (HeyGen/CapCut)

**Financement :**
- PAPEJ MCI Haïti — recandidater 6ème cohorte 2027
- CIIF — candidater "Solution numérique registres culturels" $150,000
- IDB Lab CARIBEquity — dossier complexe
- Innovate UK — surveiller 2027
- SILJ Jacmel — explorer partenariat

**Marques & Légal :**
- S4 — Dépôt marque Haïti (MCI) — documents générés, à soumettre
- S5 — Dépôt marque UK (IPO ~£170) — documents générés, à soumettre
- Trademark UK — document généré, à soumettre

**Partenariats :**
- Wikimania 2027 Santiago — contacter Wikimedia Foundation sept. 2026
- Eventbrite / Meetup / Bandsintown / Songkick — après PWA validée + utilisateurs
- Play Store (25 USD) si budget disponible

---

## 15. POINTS D'ATTENTION CRITIQUES

```
→ Microsoft Azure expire 17 août 2026 — utiliser avant
→ Claude Code limite hebdomadaire — reset jeudi 22 mai 20h Haïti
→ AWS — ne jamais activer AWS Organizations
→ Supabase — vérifier crédits $100 sur dashboard avec Sean
→ Product Hunt — lancer mardi/mercredi à 4h01 heure Haïti
→ Facebook app en mode live — ne pas repasser en dev sans prévenir
→ Phishing — deux tentatives détectées sur emails Bup Mark — rester vigilant
→ Formulaires HTML Jacmel = maquettes visuelles — pas encore connectés Brevo/Supabase
→ "EST. 2024" sur couverture Facebook — corriger avant publication
→ Wikimania Paris = fenêtre courte — ajouter événements maintenant
→ PV1 doit être validé par tous les directeurs avant onboarding
→ lib/supabase.js — rester sur createClient standard
→ middleware.ts — dépréché dans Next.js 16 (warning "use proxy") — à migrer
→ SW public/sw.js — ne jamais ré-imbriquer les addEventListener('fetch')
→ NEXT_PUBLIC_GOOGLE_PLACES_KEY — nom exact de la variable Google Places
→ Limite Supabase 1000 lignes — toujours utiliser .limit(2000) ou count: exact
→ Chiffres évoluent vite — mettre à jour à chaque session
```

---

## 16. CHIFFRES CLÉS (22 mai 2026)
- **1,633 événements approuvés**
- **32 villes · 14 pays**
- 3 organisateurs · 1 admin
- Système de points actif
- Déduplication cross-sources active
- Middleware admin actif
- Landing premium déployée
- Auth Supabase configurée → app.lotbo.app
- Google + Facebook OAuth actifs
- Réseaux sociaux : Facebook · Instagram · X créés
- Financement actif confirmé : $2,100 USD
- Financement en attente : $3,000–$7,000 USD
- Potentiel total identifié : ~$187,000+

---

## 17. DÉCISIONS OFFICIELLES (journal)

```
22 mai 2026 — Organisation
→ Structure 7 directeurs — chaque conversation Claude = un rôle
→ MASTER_CONTEXT.md = backlog officiel unique
→ PV1 = source de vérité vision produit
→ Boîte à idées = centre de coordination

22 mai 2026 — Produit
→ Hiérarchie rôles figée à 8 niveaux
→ Contributeur = automatique au premier ajout validé
→ Kreyòl haïtien = langue de première classe
→ IA LOTBO propulsée par Claude = composant stratégique central
→ Promotion automatique Contributeur Terrain = mérite + validation admin

22 mai 2026 — Technique
→ createClient standard — ne pas repasser à createBrowserClient
→ Mapbox via import() dynamique — compatible Turbopack Next.js 16
→ Confirmation email Supabase désactivée (friction réduite)
→ Claude Code = outil principal Directeur Technique (plus de copier-coller)
→ Redirection post-login → / (carte) par défaut

22 mai 2026 — Financement
→ bup-mark.com = domaine principal pour AWS
→ lotbo@bup-mark.com = email business principal tous programmes
→ $1,000 Azure en réserve — ne pas migrer stack actuelle
→ Ne pas candidater PAPEJ cette année

22 mai 2026 — Marketing
→ Formulation officielle : "Aucune commission. Aucun abonnement."
→ Gaetchens = future première Ambassadrice officielle LOTBO Jacmel
→ 2 formulaires distincts enquête : public + terrain
→ Angle communautaire toujours — jamais commercial agressif
→ Chiffres officiels : 1,633 événements · 32 villes · 14 pays

18 mai 2026 — Technique
→ Couleur primaire #C8431A · Fond #F7F2E8 · Vert #1D9E75 BANNI
→ Source pamevent → scraper quotidien recommandé
```