# MASTER_CONTEXT — LOTBO
> Dernière mise à jour : 8 mai 2026
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
| Landing | `lotbo.app` |
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
| Brevo | API v3 | Newsletter |
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
lotbo/
├── app/
│   ├── admin/page.tsx          — Panel admin (protégé middleware)
│   ├── ajouter/page.tsx        — Formulaire ajout événement (ouvert à tous)
│   ├── api/
│   │   ├── newsletter/route.ts — Newsletter Brevo hebdomadaire
│   │   └── scrape-eventbrite/route.ts — Scraper Wikimedia
│   ├── evenement/[id]/page.tsx — Page détail événement
│   ├── login/page.tsx          — Auth organisateurs + admin
│   ├── profil/page.tsx         — Profil utilisateur
│   ├── globals.css             — Tokens design + responsive
│   ├── layout.tsx              — Root layout + polices + theme-color
│   ├── page.tsx                — App principale (carte + liste + filtres)
│   └── popup.css               — Styles popups Mapbox
├── lib/
│   ├── supabase.ts             — Client Supabase (anon)
│   └── i18n.ts                 — Traductions 5 langues
├── middleware.ts               — Protection route /admin (serveur)
├── tailwind.config.ts          — Palette Tailwind officielle
├── MASTER_CONTEXT.md           — Ce fichier
└── public/
├── manifest.json           — PWA
└── Logomark.png            — Favicon

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
| `heure_debut` | text | |
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

### Statuts événements
| Statut | Visible public | Description |
|---|---|---|
| `en_attente` | ❌ | Soumis par un utilisateur, attend validation |
| `approuve` | ✅ | Validé par admin, visible sur carte |
| `rejete` | ❌ | Refusé par admin |
| `publié` | ❌ | Ancien statut Wikimedia — ne plus utiliser |
| `à compléter` | ❌ | Wikimedia incomplet (coords 0,0) |

**⚠️ Ne jamais utiliser `'publié'` — utiliser `'approuve'` uniquement.**

### RLS Supabase — table `evenements`
| Policy | Cmd | Rôles | Condition |
|---|---|---|---|
| `lecture_publique_evenements_approuves` | SELECT | anon, authenticated | `statut = 'approuve'` |
| `insertion_ouverte` | INSERT | anon, authenticated | `statut = 'en_attente'` |
| `modification_proprietaire` | UPDATE | authenticated | `auth.uid() = user_id` |
| `suppression_proprietaire` | DELETE | authenticated | `auth.uid() = user_id` |
| `admin_acces_total` | ALL | authenticated | `role = 'admin'` via JWT |

### RLS Supabase — table `evenement_themes`
| Policy | Cmd | Rôles |
|---|---|---|
| `lecture_publique_themes` | SELECT | anon, authenticated |
| `insertion_ouverte_themes` | INSERT | anon, authenticated |
| `admin_acces_total_themes` | ALL | authenticated (admin) |

### RLS Supabase — table `signalements`
| Policy | Cmd | Rôles |
|---|---|---|
| `insertion_signalements_ouverte` | INSERT | anon, authenticated |
| `admin_lecture_signalements` | SELECT | authenticated (admin) |
| `admin_suppression_signalements` | DELETE | authenticated (admin) |

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

### Modèle d'accès