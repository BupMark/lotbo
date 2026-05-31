MASTER_CONTEXT.md — Version 30 mai 2026

1. IDENTITÉ & VISION
LOTBO — plateforme mondiale de découverte d'événements locaux.

Né à Petit-Goâve, Haïti le 5 mai 2026
Fondateur : Handgod Abraham — Petit-Goâve, Haïti 🇭🇹
Entité légale : Bup Mark Ltd — Company number 15840780 — Manchester, UK 🇬🇧
Tagline : "Tous les événements, un seul endroit"
Slogan kreyòl : "Kisa k'ap pase lotbo?"
Positionnement : "Né en Haïti, pour le monde entier"
Contact officiel : lotbo@bup-mark.com
Angle communication IA : haïtien en premier, technologie en conséquence
Formulation officielle : "Aucune commission. Aucun abonnement."
Scan & Publie : "Tu prends une photo d'une affiche dans la rue à Jacmel — LOTBO la lit, la traduit, et l'ajoute à la carte. En 10 secondes."


2. CHIFFRES OFFICIELS — 30 mai 2026
MétriqueValeurÉvénements total2 940Approuvés2 781En attente0Rejetés7Membres26Villes56Pays16Régions3Supporters confirmés3 (Graine · Bouquet · Lotbo Fam)Financement confirmé~$53,100 USDFinancement potentiel~$454,600 USDProgression globale~96%

3. URLS DE PRODUCTION
URLDescriptionhttps://lotbo.appLanding statiquehttps://app.lotbo.appApplication Next.jshttps://app.lotbo.app/adminPanel adminhttps://lotbo.app/supportersListe supportershttps://lotbo.app/supporter-fondateurCampagne (deadline 31 mai)https://lotbo.app/partenariatsPage partenariatshttps://lotbo.app/enquete-jacmelEnquête public (à déployer)https://lotbo.app/enquete-jacmel/terrainEnquête terrain (à déployer)

4. STACK TECHNIQUE
Frontend     : Next.js 16.2.5 (App Router) + TypeScript
Carte        : Mapbox GL JS
Base données : Supabase (PostgreSQL)
Auth         : Supabase Auth
Email        : Brevo
i18n         : next-intl (FR/EN/ES/PT/KW)
Déploiement  : Vercel
Paiements    : Stripe
Réservations : TidyCal (tidycal.com/bup-mark/fondateur-lotbo)
Analytics    : Amplitude (Growth $50k actif jusqu'en mai 2027)
CRM          : HubSpot Startup 90% off (à configurer)
Tâches       : Asana Starter 90% off
Signatures   : DocuSign (3/mois) ou Sign.plus (5/mois)

5. FINANCEMENT CONFIRMÉ
ProgrammeMontantStatutAmplitude Growth$50,000✅ Actif jusqu'en mai 2027HubSpot Startup 90% off~$1,800✅ ActifAsana Starter 90% off~$300✅ ActifAnthropic StartupsTBD⏳ Réponse 2-4 semainesGoogle CloudTBD⏳ Réponse 3-5 joursVercel StartupTBD⏳ Après Product HuntCIIF Caribbean Bank$150,000 potentiel⏳ En cours

6. LIVRAISONS COMPLÈTES — 30 mai 2026
Direction Technique

✅ BUG-ALUNE-SAVE-1 — Épinglage "À la une" avec feedback visuel
✅ BUG-STATS-TOTAL-1 — Stats réelles partout
✅ BUG-DESCRIPTION-SAUTS-1 — Sauts de ligne préservés
✅ BUG-UNSPLASH-PRIORITY-1 — Image contributeur prioritaire
✅ BUG-PRELOAD-LOGO-1 — L.png fond transparent + point orange scintillant
✅ BUG-TABBAR-DESKTOP-2 — Tab bar visible desktop + mobile
✅ BUG-SEARCH-EVENT-NAME-1 — Recherche par titre événement
✅ BUG-CLASSEMENT-1 — Classement corrigé
✅ BUG-CLASSEMENT-ANONYME-1 — Noms vrais affichés
✅ BUG-MEMBRES-COUNT-1 — Compteur membres correct
✅ GM-ROLES-REFONTE-1 — Visiteur supprimé, rôles cumulatifs
✅ UX-ALUNE-ACCORDEON-1 — Bottom sheet accordéon ▼▲
✅ UX-NAV-GLOBAL-1 — Tab bar sur toutes les pages
✅ UX-NAV-RESTRUCTURE-1 — Ansanm + fond sombre tab bar
✅ TECH-SUPPORTER-1 — Campagne supporter fondateur complète
✅ Points rétro-attribués tous membres en DB

Session 30 mai 2026

✅ UX-SIDEBAR-1 — Sidebar desktop À la une + Top villes (mode carte ≥ 1024px)
✅ Fix récurrents en double dans À la une (déduplication par parent_id)
✅ Fix Top Villes — exclusion pays + limite 5 villes
✅ GM-ROLES-REFONTE-2 — Niveau "Contributeur" renommé "Engagé" (profil, classement, CarteBadge)
✅ ORG-1 Sprint 1 — Espaces Organisation :
   · /organisation/[slug] — vitrine publique (logo circulaire, slogan italic, infos, événements à venir, followers)
   · /organisation/creer — formulaire création avec upload logo
   · /organisation/[slug]/modifier — édition réservée au owner
   · Boutons : Suivre · ✉️ Email · 📞 Appeler · 🔗 Partager · ✏️ Modifier (owner seulement)
   · Upload logo → bucket Supabase logos-organisations
✅ ORG-1 DB : tables organisations + organisation_membres (org_id, user_id, role) + colonnes slogan/telephone
✅ RLS policies organisations + organisation_membres
✅ Cache CDN Vercel désactivé (Cache-Control: no-store + force-dynamic profil/classement)
✅ Import 20 événements Paris juillet 2026 (scripts/import-paris-juillet2026.ts)

Direction Financière & Subventions

✅ Webhook Stripe corrigé — opérationnel 200
✅ Variables Vercel lotbo-landing complètes
✅ Badge supporter attribué automatiquement
✅ Contrainte UNIQUE stripe_payment_id
✅ Email bienvenue supporter mis à jour
✅ Réponse Google Cloud envoyée
✅ 2 dossiers ministériels générés (.docx)

Direction Marketing & Croissance

✅ Stratégie marketing zéro budget — 4 piliers 30/60/90 jours
✅ 13 emails établissements Haïti vérifiés
✅ Scripts WhatsApp diaspora (kreyòl)
✅ Calendrier éditorial 4 posts/semaine
✅ Stratégie Wikimania Paris 2026 — messages EN + FR prêts
✅ Badge "Contributeur Wikimedia" — spec complète
✅ Questionnaire enquête Jacmel bilingue KR/FR
✅ Maquettes HTML formulaires Jacmel public + terrain
✅ Document mission Gaetchens Pierre Louis (.docx)
✅ Réseaux sociaux X · Facebook · Instagram créés
✅ Couverture Facebook validée
✅ Candidature DevExpo 2026 soumise ✅
✅ Guide démo live DevExpo 6 juin

Conseiller Stratégique

✅ Modèle freemium complet documenté (3 plans)
✅ Narrative trio OSM + Wikimedia + LOTBO officielle
✅ 5 dossiers partenariats structurés
✅ Plan 60 jours Wikimania Paris documenté
✅ Politiques éditoriales 4 niveaux documentées
✅ Vision investisseurs documentée (SAFE · phase 2027)
✅ Formule Q3O / 4W / 4K adoptée officiellement
✅ Process signature officiel sans budget

Direction Partenariats

✅ Projet Asana "LOTBO — Partenariats Stratégiques" créé
✅ WhatsApp campagne supporter envoyé


7. EN ATTENTE — PAR DIRECTION
🔴 Urgent

⏳ TECH-WIKI-3 — Paris période Wikimania (bloque contacts WMF)
⏳ TECH-WIKI-1 — OSM fallback (bloque contacts WMF)
⏳ TECH-WIKI-2 — Proposition modification événement (bloque contacts WMF)
⏳ JACMEL2 — Formulaires enquête Jacmel en ligne
⏳ Campagne supporter — LinkedIn + Email Brevo avant 31 mai
⏳ Azure — plan utilisation avant 17 août ⚠️

🟡 Important

✅ GM-ROLES-REFONTE-2 — livré 30 mai
⏳ Filtre "Paris · Juillet 2026" dans l'app
⏳ Badge "Contributeur Wikimedia" — gamification
⏳ Photo récente Handgod pour LinkedIn
⏳ Correction "EST. 2024" → "EST. 2026" couverture Facebook
⏳ Outreach 13 établissements Haïti
⏳ Blog /actualites — premier article
⏳ Product Hunt — date à confirmer
⏳ HubSpot CRM à configurer
⏳ Dépôt marque Haïti (MCI) + UK (IPO)
⏳ Révision dossiers ministériels avec Handgod

🔴 Prochaine session — par priorité

🔴 GM-REFONTE-TOTALE-1 — Refonte architecture gamification (session dédiée avant lancement)
🟡 FEAT-ORG-UPGRADE-1 — Bouton "Créer une organisation" dans /profil
🟡 FEAT-ORG-LIST-1 — Page /organisations (liste complète)
🟡 UX-FORM-ALLDAY-1 — Checkbox "Toute la journée" dans le formulaire d'ajout
🟡 FEAT-SCAN-RECURRENT-1 — Détection récurrence dans Scan & Publie

⚪ Phase 2

⏳ TikTok + LinkedIn + YouTube LOTBO
⏳ Pitch deck investisseurs Q3 2026
⏳ Mapathon OSM × LOTBO Jacmel
⏳ CGU complètes + guide modération
⏳ SC-MONDIAL — Scrapers Sympla · Peatix · agenda.be
⏳ FEAT-PROFIL-PUBLIC-1 · FEAT-FOLLOW-1 · FEAT-COMMUNITY-1


8. BACKLOG FEATURES — PAR PRIORITÉ
🔴 Priorité haute
CodeFeatureTECH-WIKI-1Intégration OSM fallback Google PlacesTECH-WIKI-2Proposition de modification événementTECH-WIKI-3Couverture Paris période WikimaniaJACMEL2Formulaires enquête JacmelTECH-FILTER-WIKI-1Filtre Paris · Juillet 2026
🟡 Priorité moyenne
CodeFeatureGM-ROLES-REFONTE-2Simplifier classement rôlesGM-BADGE-WIKI1Badge Contributeur WikimediaGM-BADGE-SCAN1Badge Pioneer Scan & PublieUX-SIDEBAR-1Sidebar desktop À la une + Top villesFEAT-CARTE-SOCIALE-1Cartes personnalisées utilisateurCLAIM-1Réclamation événementORG-1Espace Organisation
⚪ Phase 2
CodeFeatureLOTBO-IAScan & Publie + AUTO-MOD1BIZ-FREEMIUM-1Architecture plans freemiumGM-BOOST1Boost événement par pointsFEAT-LIVE-PRESENCEPrésence temps réelFEAT-CAMERACapture photo directeSC-MONDIALScrapers Sympla · Peatix · agenda.be

9. RÈGLES ABSOLUES
→ Mobile-first 375px en priorité absolue
→ Jamais position:absolute dans le header
→ Toute nouvelle chaîne → 5 fichiers JSON (fr/en/es/pt/ht)
→ Jamais exposer SUPABASE_SERVICE_ROLE_KEY côté client
→ Jamais exposer clés Stripe côté client
→ Jamais bypasser RLS Supabase
→ TypeScript strict — jamais de any
→ Fichiers complets — jamais des extraits
→ Supabase .limit(2000) minimum
→ Fond #F7F2E8 sur toutes les pages
→ Brand #C8431A · #1D9E75 DÉFINITIVEMENT BANNI
→ SQL soumis pour validation — jamais exécuté directement
→ Jamais supprimer un compte Supabase automatiquement
→ Supabase GRANT explicite sur toutes nouvelles tables
→ Newsletter désinscription = Brevo uniquement
→ Supporters table = conserver même sans badge actif
→ Aucun contact WMF avant TECH-WIKI-1+2+3 déployés
→ Règle d'or freemium : une feature gratuite reste gratuite
→ Statut Supporter Fondateur = permanent tous paliers
→ Asana obligatoire pour chaque direction
→ MASTER_CONTEXT.md = vision + décisions uniquement
→ Mise à jour MASTER_CONTEXT.md : chaque vendredi

10. PROTOCOLE SQL

Générer le SQL propre et complet
Soumettre pour validation à Handgod
Handgod exécute dans Supabase Dashboard
Jamais exécuter directement
Jamais afficher les clés secrètes
Toujours ajouter GRANT après CREATE TABLE


11. DÉCISIONS OFFICIELLES — 30 mai 2026

📌 Fondateur basé à Petit-Goâve — corriger partout
📌 Partenariat LOTBO + Krepisaj officialisé
📌 Deux cibles ministérielles : Culture + Diaspora
📌 Asana obligatoire toutes directions
📌 Enquêteurs Jacmel : Gaetchens (directrice) + Nancy Gilot + 3 postes ouverts
📌 linktr.ee ou QR code direct (bio.link abandonné)
📌 DevExpo 6 juin — présence confirmée
📌 Amplitude + Vercel Analytics en parallèle
📌 Formule Q3O / 4W / 4K obligatoire tout événement LOTBO
📌 Contributions Supporter = paiements commerciaux (pas des dons)
📌 Narrative officielle : OSM + Wikimedia + LOTBO = trio communautaire ouvert


12. SUPPORTERS FONDATEURS — PALIERS OFFICIELS
PalierMontantAvantages clés🌱 Graine$7Badge · mention /supporters · email🥉 Bouquet$15+ Accès anticipé · newsletter coulisses🥈 Lotbo Fam$35+ Organisateur premium 1 an · vote features🥇 Bâtisseur$75+ Organisateur À VIE · appel 15 min TidyCal💎 Platine$150+ Roadmap privée · co-crédité lancement
Deadline campagne : 31 mai 2026 à minuit
Statut : permanent pour tous les paliers

MASTER_CONTEXT.md — Version 30 mai 2026
Compilé par : Direction Technique + toutes directions
Prochaine mise à jour : vendredi 5 juin 2026
Session 30 mai 2026 : UX-SIDEBAR-1 · GM-ROLES-REFONTE-2 · ORG-1 Sprint 1 — 53 pages · build propre