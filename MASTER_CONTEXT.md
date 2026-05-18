# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 17 mai 2026
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
NEXT_PUBLIC_INTERNAL_API_SECRET  ← doit avoir même valeur que INTERNAL_API_SECRET
INTERNAL_API_SECRET
PREDICTHQ_API_KEY
UNSPLASH_ACCESS_KEY
BREVO_API_KEY
VAPID_EMAIL
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

### ⚠️ Règle variables d'environnement (établie 17 mai 2026)
- `INTERNAL_API_SECRET` et `NEXT_PUBLIC_INTERNAL_API_SECRET` doivent avoir la **même valeur**
- Une seule ligne par variable dans `.env.local` — jamais de doublons
- Ne jamais utiliser de placeholder comme `lotbo_2026_[même valeur]`

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
est_recurrent (boolean),
recurrence_regle (jsonb),
parent_id (uuid FK evenements.id),
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
points_utilisateur (integer),
points_organisateur (integer),
points_total (integer),
niveau (text — decouvreur/actif/contributeur/top_contributeur/elite/legende),
nom (text),
photo_url (text),
created_at, updated_at
```

### Table `commentaires`
```
id, evenement_id, auteur, contenu, nb_likes,
parent_id (uuid FK commentaires.id — E11 réponses),
created_at
```

### Table `reactions` (créée 17 mai 2026)
```
id, commentaire_id (FK), session_id, emoji, created_at
UNIQUE(commentaire_id, session_id, emoji)
RLS activé
```

### Table `push_subscriptions`
```
id, endpoint, p256dh, auth,
user_id (uuid FK auth.users — ajouté 17 mai 2026),
created_at
```

### Table `import_logs` (créée 17 mai 2026)
```
id, source, statut, nb_importes, nb_doublons,
nb_erreurs, message_erreur, duree_ms, created_at
```

### Table `transactions_points` (créée 17 mai 2026)
```
id, user_id (FK auth.users), points, type, description,
evenement_id (FK evenements), created_at
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

## 8. FONCTIONNALITÉS LIVRÉES (au 17 mai 2026)

### Carte & Filtres
- ✅ Carte Mapbox interactive avec clusters
- ✅ Filtres catégorie/prix/date/accès
- ✅ Recherche full-text
- ✅ Filtre événements passés (date_debut >= aujourd'hui)
- ✅ UX4 — Grille desktop 2/3/4 colonnes selon breakpoint (17 mai 2026)

### Formulaire ajout événement
- ✅ MAP1 — Champ "Nom du lieu" (texte libre) + "Adresse" (texte libre)
- ✅ MAP2 — Carte interactive Mapbox drag pin pour localisation
- ✅ MAP3 — Google Places API autocomplétion (proxy `/api/places-autocomplete` + `/api/places-details`)
- ✅ F4-F6 — Visibilité 3 niveaux (public/discret/privé) + code_acces + lien_secret
- ✅ ROLE4 — Question "Mon événement / Je l'ai repéré" si double rôle détecté
- ✅ ENG1 — Page remerciement personnalisée (contributeur vs organisateur + ordinal)
- ✅ F8 — Événements récurrents (quotidien/hebdo/mensuel/annuel) + génération occurrences (17 mai 2026)
- ✅ F10 — Message incitatif image + 3 suggestions Unsplash automatiques 5 langues (17 mai 2026)

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
- ✅ ADMIN1 — Filtres temporels (Aujourd'hui/Cette semaine/Ce mois/Toutes dates) (17 mai 2026)
- ✅ ADMIN2 — Navigation onglets (Événements/Signalements/Import) (17 mai 2026)
- ✅ SC7 — Dashboard import admin avec stats par source + top pays + boutons relance (17 mai 2026)
- ✅ Item 5 — Bouton "Mettre hors ligne" sur pages événements
- ✅ Hors ligne occurrences récurrentes — popup choix (cet événement / toutes occurrences) (17 mai 2026)
- ✅ Policy RLS UPDATE admin

### Engagement (carte visuelle)
- ✅ E1 — Bouton "Je serai là" + compteur
- ✅ E3b/E3c — CarteVisuelle 3 dispositions + expressions + upload photo
- ✅ UX13 — Photo profil en fond paysage automatiquement
- ✅ UX14 — Drag/zoom photo fond + upload photo dédiée
- ✅ E11 — Réponses commentaires 2 niveaux avec indentation (17 mai 2026)
- ✅ E12 — 6 réactions emoji (👍❤️😂😮🙏🔥) sur commentaires (17 mai 2026)

### Badges & Gamification
- ✅ ENG3-B — Popup confetti badge débloqué après soumission (17 mai 2026)
- ✅ ENG3-C — Push PWA badge débloqué ciblé par user_id (17 mai 2026)
- ✅ ENG3-D — Email Brevo badge débloqué aux couleurs LOTBO (17 mai 2026)
- ✅ GM1 — Points utilisateur (like+1, serai_la+5, commenter+2, repondre+1, partager+3, referral+10) (17 mai 2026)
- ✅ GM2 — Points organisateur (approuve+10, trending+5, commentaire_recu+2, like_recu+1) (17 mai 2026)
- ✅ GM4 — Niveaux automatiques (Découvreur→Actif→Contributeur→Top→Élite→Légende) (17 mai 2026)

### SEO
- ✅ SEO dynamique `/evenement/[id]` — og:image, og:title, og:description (17 mai 2026)
- ✅ Image OG : photo événement > Unsplash catégorie > og-default.png

### Scraping & Import
- ✅ SC1 — PredictHQ (572+ événements, 11 zones, 7 catégories)
- ✅ SC5 — GitHub Actions CRON toutes les 6h
- ✅ Scraper Ticketmaster, World Cup, Wikimedia, Ligue Haïtienne, Eventbrite
- ✅ SC6 — Déduplication cross-sources (algorithme Dice coefficient + Haversine) (17 mai 2026)
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
- ✅ Route `/api/unsplash` retourne 3 photos (count param ajouté 17 mai 2026)

### Analytics
- ✅ Item 22 — Vercel Analytics actif

### PWA
- ✅ manifest.json + sw.js configurés
- ✅ SW corrigé — exclut `/api/` et `supabase.co` des requêtes interceptées (17 mai 2026)

---

## 9. ROUTES API
| Route | Usage |
|---|---|
| `/api/stats` | Compteurs événements/villes/pays (CORS *) |
| `/api/top` | Top villes + catégories (CORS *) |
| `/api/scrape-predicthq` | Import PredictHQ + déduplication SC6 |
| `/api/scrape-ticketmaster` | Import Ticketmaster + déduplication SC6 |
| `/api/scrape-worldcup` | Import World Cup |
| `/api/scrape-liguehaitienne` | Import Ligue Haïtienne |
| `/api/scrape-eventbrite` | Import Wikimedia (ancien nom — à renommer) |
| `/api/places-autocomplete` | Proxy Google Places autocomplétion |
| `/api/places-details` | Proxy Google Places coordonnées |
| `/api/unsplash` | Image automatique par catégorie (1 ou 3 photos) |
| `/api/notify-admin` | Notification email admin Brevo |
| `/api/notify-badge` | Email Brevo badge débloqué utilisateur (ENG3-D) |
| `/api/push-notify` | Push PWA broadcast tous abonnés |
| `/api/push-notify-badge` | Push PWA ciblé badge utilisateur (ENG3-C) |
| `/api/push-subscribe` | Enregistrement abonnement push + user_id |
| `/api/notify-abonnes` | Notification abonnés newsletter |
| `/api/points` | Attribution points gamification GM1/GM2/GM4 |
| `/api/generer-occurrences` | Génération occurrences événements récurrents F8 |

---

## 10. FICHIERS CLÉS
| Fichier | Usage |
|---|---|
| `lib/supabase.js` | Client Supabase |
| `lib/i18n.ts` | Traductions 5 langues |
| `lib/deduplication.ts` | Algorithme déduplication SC6 |
| `lib/points.ts` | Helper attribution points GM1/GM2 |
| `public/sw.js` | Service Worker PWA |
| `public/og-default.png` | Image OG fallback (logo LOTBO) |

---

## 11. RÈGLES ABSOLUES

### Développement
- Mobile-first — tester 375px en premier
- Jamais `SUPABASE_SERVICE_ROLE_KEY` côté client
- Jamais instancier Supabase à la racine d'une route API
- `params` est une Promise Next.js 16 — toujours `await params`
- TypeScript strict — jamais de `any`
- Jamais `position: absolute` dans le header
- Toujours livrer des fichiers complets, jamais des extraits
- Route API : double auth acceptée — secret interne OU token Supabase utilisateur

### Design
- **Fond toutes les pages : `#F7F2E8`** — règle établie 16 mai 2026
- Couleur primaire : `#C8431A`
- Vert `#1D9E75` BANNI — non validé par le fondateur

### Multilingue
- 5 langues : FR/EN/ES/PT/KW
- Toujours mettre à jour les 5 fichiers JSON simultanément

---

## 12. BACKLOG PRIORITAIRE (au 17 mai 2026)

### 🔴 URGENT
- Middleware admin — protéger `/admin` côté serveur (jamais fait)
- Header mobile — `position: absolute` à corriger sur 375px
- E11 mobile — bouton "Mettre hors ligne" non visible sur mobile

### 🟡 IMPORTANT
- GM5 — Leaderboard public (filtres global/pays/ville/semaine/mois)
- GM6 — Score événements + section Trending
- GM8 — Section Trending temps réel page accueil
- GM9 — Newsletter hebdomadaire Brevo gamifiée
- GM11 — Notifications classement (push + email)
- GM12 — Classement personnel dans profil
- GM13 — Carte badge partageable (WhatsApp/Facebook/Instagram/TikTok)
- GM7 — Score réputation organisateurs
- ROLE5 — IA vérification soumission (nécessite budget Anthropic Console)
- S7 — Footer "Un produit de Bup Mark · Propulsé par Claude AI"
- UX3 — Pages desktop trop étroites
- F8 CRON — Régénération automatique occurrences récurrentes
- SC7 — Intégration `import_logs` dans les scrapers (table créée, pas encore utilisée)

### 🟢 GROWTH
- GR1 — Système referral
- GM10 — Équilibre organique/sponsorisé
- SC2 — Meetup API (nécessite abonnement Pro)
- SC3 — Bandsintown API
- GRP1-GRP4 — Groupes discussion
- S4 — Dépôt marque MCI Haïti
- S5 — Dépôt marque IPO UK (~£170)

---

## 13. CHIFFRES CLÉS (17 mai 2026)
- 572+ événements approuvés
- 58+ villes
- 9+ pays
- 3 organisateurs inscrits
- 1 admin (Handgod Abraham)
- Système de points actif (GM1/GM2/GM4)
- Déduplication cross-sources active (SC6)