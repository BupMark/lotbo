# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 16 mai 2026
> Architecte technique : Claude (Anthropic)
> Fondateur : Handgod Abraham

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

---

## 3. STACK TECHNIQUE
| Technologie | Version | Usage |
|---|---|---|
| Next.js | 16.2.5 | App Router, SSR |
| TypeScript | strict | Typage complet |
| Supabase | latest | DB + Auth + Storage + RLS |
| Mapbox GL JS | latest | Carte interactive |
| Google Places API | latest | Autocomplétion adresses formulaire |
| next-intl | latest | Internationalisation 5 langues |
| Brevo | API v3 | Newsletter + Notifications email |
| Vercel Analytics | latest | Analytics production |
| Vercel | latest | Hébergement + CI/CD |
| GitHub Actions | latest | CRON scraping automatique |

---

## 4. IDENTITÉ VISUELLE

### Palette officielle
| Token | Hex | Rôle |
|---|---|---|
| `--night` | `#1A1410` | Texte principal, header |
| `--brique` | `#C8431A` | **Couleur primaire, CTA** |
| `--or` | `#D4A820` | Badges contributeur |
| `--creme` | `#F7F2E8` | **Fond principal toutes les pages** |
| `--terre` | `#8C5A40` | Textes secondaires |
| `--vert` | `#2D9E6B` | Confirmations, pays |

### Règle design (établie 16 mai 2026)
- **Fond toutes les pages : `#F7F2E8`** — jamais `#1A1410` sauf header/nav
- Textes principaux : `#1A1410`
- Textes secondaires : `#8C5A40`
- Accents : `#C8431A`

---

## 5. COMPTES & ACCÈS
| Service | Compte |
|---|---|
| Supabase | sambayo23@gmail.com |
| Vercel | lotboapp-8362 |
| GitHub | BupMark/lotbo + BupMark/lotbo-landing |
| Google Cloud | bup-mark (Places API + Maps JS API) |
| Unsplash | LOTBO app |
| PredictHQ | compte actif |
| Brevo | compte actif |

### Variables d'environnement requises
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_GOOGLE_PLACES_KEY
NEXT_PUBLIC_INTERNAL_API_SECRET
INTERNAL_API_SECRET
PREDICTHQ_API_KEY
UNSPLASH_ACCESS_KEY
BREVO_API_KEY
```

---

## 6. BASE DE DONNÉES — État colonnes

### Table `evenements` (colonnes principales)
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
created_at, updated_at
```

### Table `profiles`
```
id (uuid, FK auth.users),
role (admin/ambassadeur/contributeur/organisateur/visiteur),
charte_acceptee (boolean),
charte_acceptee_le (timestamptz),
badge (text),
points (integer),
nom (text),
photo_url (text),
created_at, updated_at
```

### RLS policies `evenements` (8 policies)
- `admin_acces_total` — ALL pour admins
- `admin_update_evenements` — UPDATE pour admins
- `insert_evenement` — INSERT authenticated
- `lecture_publique_evenements_approuves` — SELECT public statut=approuve visibilite=public
- `lecture_evenements_discrets` — SELECT statut=approuve visibilite=discret
- `lecture_par_lien_secret` — SELECT via lien_secret
- `lecture_proprietaire_ses_evenements` — SELECT own
- `modification_proprietaire` — UPDATE own
- `suppression_proprietaire` — DELETE own

### Storage bucket `evenements`
- Public, 50MB max
- Policy INSERT/UPDATE: `upload_avatar_authentifie` → `avatars/%`

---

## 7. ADMIN
**Compte admin :** sambayo23@gmail.com
**UUID :** ff21f2e0-135d-4996-9713-4a0e20c38fe1
**Profil DB :** INSERT fait manuellement (role=admin, charte_acceptee=true)

---

## 8. FONCTIONNALITÉS LIVRÉES (au 16 mai 2026)

### Carte & Filtres
- ✅ Carte Mapbox interactive avec clusters
- ✅ Filtres catégorie/prix/date/accès
- ✅ Recherche full-text
- ✅ Filtre événements passés (date_debut >= aujourd'hui)

### Formulaire ajout événement
- ✅ MAP1 — Champ "Nom du lieu" (texte libre) + "Adresse" (texte libre)
- ✅ MAP2 — Carte interactive Mapbox drag pin pour localisation
- ✅ MAP3 — Google Places API autocomplétion (proxy `/api/places-autocomplete` + `/api/places-details`)
- ✅ F4-F6 — Visibilité 3 niveaux (public/discret/privé) + code_acces + lien_secret
- ✅ ROLE4 — Question "Mon événement / Je l'ai repéré" si double rôle détecté
- ✅ ENG1 — Page remerciement personnalisée (contributeur vs organisateur + ordinal)

### Auth & Profil
- ✅ Auth organisateurs (email/password)
- ✅ Messages erreur login multilingues (FR/EN/ES/PT)
- ✅ Page profil fond clair
- ✅ UX11 — Nom utilisateur modifiable
- ✅ UX6 — Upload photo profil (Storage bucket avatars/)
- ✅ Email masqué sur profil
- ✅ ROLE6 — Double badge (Admin + Contributeur + Organisateur)
- ✅ ENG2 — Onglet Badges & Stats avec progression

### Rôles
- ✅ ROLE4 — Détection double rôle à la soumission
- ✅ ROLE6 — Double badge dashboard
- ✅ Item 6 — Rôle Contributeur + charte `/contributeur/charte`
- ✅ Table profiles avec charte_acceptee
- ✅ Contributeur → statut approuve direct si charte acceptée

### Admin
- ✅ Panel admin `/admin`
- ✅ Item 5 — Bouton "Mettre hors ligne" sur pages événements
- ✅ Policy RLS UPDATE admin

### Engagement (carte visuelle)
- ✅ E1 — Bouton "Je serai là" + compteur
- ✅ E3b/E3c — CarteVisuelle 3 dispositions + expressions + upload photo
- ✅ UX13 — Photo profil en fond paysage automatiquement
- ✅ UX14 — Drag/zoom photo fond + upload photo dédiée

### Scraping & Import
- ✅ SC1 — PredictHQ (423+ événements, 11 zones, 7 catégories)
- ✅ SC5 — GitHub Actions CRON toutes les 6h
- ✅ Scraper Ticketmaster, World Cup, Wikimedia
- ✅ vercel.json `{}` (crons Vercel supprimés — plan Hobby)

### Landing lotbo.app
- ✅ Item 8 — Compteurs temps réel via `/api/stats` (CORS header)
- ✅ Item 7 — Section Top villes + Top catégories dynamiques
- ✅ Navigation hamburger mobile

### Pages légales
- ✅ `/politique-confidentialite` · `/cgu` · `/aide` · `/apropos`

### Image automatique
- ✅ F9 — Image Unsplash automatique si pas de photo (par catégorie)
- ✅ Crédit auteur affiché

### Analytics
- ✅ Item 22 — Vercel Analytics actif

### PWA
- ✅ manifest.json + sw.js configurés

---

## 9. ROUTES API
| Route | Usage |
|---|---|
| `/api/stats` | Compteurs événements/villes/pays (CORS *) |
| `/api/top` | Top villes + catégories (CORS *) |
| `/api/scrape-predicthq` | Import PredictHQ |
| `/api/scrape-ticketmaster` | Import Ticketmaster |
| `/api/scrape-worldcup` | Import World Cup |
| `/api/places-autocomplete` | Proxy Google Places autocomplétion |
| `/api/places-details` | Proxy Google Places coordonnées |
| `/api/unsplash` | Image automatique par catégorie |
| `/api/notify-admin` | Notification email admin Brevo |

---

## 10. RÈGLES ABSOLUES

### Développement
- Mobile-first — tester 375px en premier
- Jamais `SUPABASE_SERVICE_ROLE_KEY` côté client
- Jamais instancier Supabase à la racine d'une route API
- `params` est une Promise Next.js 16 — toujours `await params`
- TypeScript strict — jamais de `any`
- Jamais `position: absolute` dans le header
- Toujours livrer des fichiers complets, jamais des extraits

### Design
- **Fond toutes les pages : `#F7F2E8`** — règle établie 16 mai 2026
- Couleur primaire : `#C8431A`
- Vert `#1D9E75` BANNI — non validé par le fondateur

### Multilingue
- 5 langues : FR/EN/ES/PT/KW
- Toujours mettre à jour les 5 fichiers JSON simultanément

---

## 11. BACKLOG PRIORITAIRE (au 16 mai 2026)

### 🔴 URGENT
- ADMIN1 — Filtres temporels panel admin
- ADMIN2 — Navigation onglets panel admin (6 onglets)

### 🟡 IMPORTANT
- ENG3 — Notification badge débloqué (confetti + push)
- F10 — Message incitatif image avant soumission (5 langues)
- ROLE5 — IA vérification soumission
- E11 — Réponses commentaires 2 niveaux
- E12 — 6 réactions commentaires
- F8 — Événements récurrents
- SC6 — Déduplication cross-sources
- SC7 — Dashboard import admin
- UX3 — Pages desktop trop étroites
- UX4 — Grille événements desktop 2-3 colonnes

### 🟢 GROWTH
- GR1 — Système referral
- S4 — Dépôt marque MCI Haïti
- S5 — Dépôt marque IPO UK (~£170)
- GM1-GM10 — Gamification complète
- GRP1-GRP4 — Groupes discussion
- SC2 — Meetup API
- SC3 — Bandsintown API

---

## 12. CHIFFRES CLÉS (16 mai 2026)
- 572+ événements approuvés
- 58+ villes
- 9+ pays
- 3 organisateurs inscrits
- 1 admin (Handgod Abraham)
