import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Aide · Lotbo",
  description: "Centre d'aide LOTBO — guide complet pour visiteurs et organisateurs d'événements.",
}

const s = {
  section: { marginBottom: 56 } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #2a2a2a',
    borderRadius: 14, overflow: 'hidden',
  } as React.CSSProperties,
  h2: {
    fontFamily: 'Georgia, serif', fontStyle: 'italic',
    fontSize: 'clamp(20px, 3vw, 26px)',
    fontWeight: 700, color: '#F7F2E8',
    marginBottom: 16,
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '4px 12px', borderRadius: 999,
    fontSize: 12, fontWeight: 600,
    marginBottom: 16,
  } as React.CSSProperties,
}

const VISITEURS = [
  {
    q: "Comment trouver un événement près de moi ?",
    a: "Ouvre l'app sur app.lotbo.app — la carte s'affiche automatiquement centrée sur ta position (si tu autorises la géolocalisation). Tous les événements approuvés apparaissent sous forme de pins rouges. Clique sur un pin pour voir les détails, ou utilise la vue Liste (bouton 📋 en haut).",
  },
  {
    q: "Comment voir les événements en mode liste ?",
    a: "Clique sur le bouton 📋 Liste en haut de la carte. La vue liste affiche tous les événements filtrés avec une image, le titre, la date, le lieu et le prix — ainsi qu'un hero avec les chiffres clés de la plateforme. Tu peux switcher entre carte et liste à tout moment.",
  },
  {
    q: "Comment chercher dans une autre ville ?",
    a: "Dans la barre de recherche en haut, tape le nom d'une ville (ex: \"Port-au-Prince\", \"Paris\", \"Miami\") et appuie sur Entrée. La carte se déplace automatiquement vers cette ville.",
  },
  {
    q: "Comment filtrer les événements ?",
    a: "Clique sur le bouton ⚙️ Filtres pour accéder aux options : catégorie (Festival, Sport, Culture...), accès (public ou privé), prix (gratuit ou payant), et période (date de début et de fin). Des raccourcis rapides sont disponibles : Aujourd'hui, Cette semaine, Ce week-end, Ce mois, et Paris · Juil 2026. Un badge rouge indique le nombre de filtres actifs.",
  },
  {
    q: "Comment utiliser le filtre Paris · Juillet 2026 ?",
    a: "Dans les filtres rapides, clique sur '🗺️ Paris · Juil 2026' pour voir tous les événements autour de la période Wikimania à Paris (18-27 juillet 2026). La carte et la liste se mettent à jour automatiquement avec les concerts, festivals, expositions et fan zones disponibles à Paris.",
  },
  {
    q: "Comment laisser un commentaire sur un événement ?",
    a: "Sur la page détail d'un événement, fais défiler jusqu'à la section Commentaires. Connecte-toi si ce n'est pas déjà fait, puis écris ton commentaire et clique sur Envoyer. Tu peux aussi répondre directement à un commentaire existant — les réponses s'affichent en fil de discussion sur 2 niveaux.",
  },
  {
    q: "Comment réagir à un commentaire ?",
    a: "Sur chaque commentaire, tu verras des boutons de réactions emoji (👍 ❤️ 😂 😮 etc.). Clique sur une réaction pour l'ajouter ou la retirer. Le compteur se met à jour en temps réel.",
  },
  {
    q: "Comment partager un événement ?",
    a: "Sur la page détail d'un événement, tu trouveras des boutons de partage pour WhatsApp, Facebook et X (Twitter). Tu peux aussi copier le lien directement depuis la barre d'adresse de ton navigateur.",
  },
  {
    q: "Comment activer les notifications ?",
    a: "Dans le menu ☰ (hamburger), clique sur 'Activer les notifications' et accepte la demande de permission de ton navigateur. Tu recevras une notification push chaque fois qu'un nouvel événement est approuvé dans ta zone. Tu peux aussi t'inscrire aux alertes par email via 'Recevoir les événements'.",
  },
  {
    q: "Un événement est incorrect ou annulé — que faire ?",
    a: "Sur la page de l'événement, clique sur le bouton ⚠️ Signaler. Choisis la raison (fausse information, événement annulé, doublon, etc.) et envoie. Notre équipe examine chaque signalement sous 24h.",
  },
  {
    q: "Comment voir les événements à la une ?",
    a: "Les événements mis en avant par l'équipe LOTBO apparaissent dans la section 'À la une' en haut de la vue liste. Sur mobile, un carrousel swipeable affiche une carte à la fois. Sur desktop, une grille affiche les événements vedettes côte à côte.",
  },
]

const ORGANISATEURS = [
  {
    q: "Comment soumettre un événement ?",
    a: "Clique sur + Ajouter (en haut à droite sur desktop, ou dans le menu ☰ sur mobile). Remplis le formulaire : titre, organisateur, ville, pays, lieu, date, heure, type d'événement. L'autocomplétion t'aide à trouver l'adresse exacte — une mini-carte te montre le pin avant de valider. Soumets — ton événement sera examiné par notre équipe sous 24h.",
  },
  {
    q: "Qu'est-ce que Scan & Publie ?",
    a: "Scan & Publie est une feature IA de LOTBO propulsée par Claude Vision (Anthropic) : prends une photo d'une affiche dans la rue, télécharge-la dans le formulaire d'ajout, et l'IA extrait automatiquement le titre, la date, le lieu, la ville, la catégorie et la description. Tu n'as plus qu'à vérifier et soumettre. En 10 secondes. Fonctionne avec des affiches en français, anglais, espagnol, portugais et d'autres langues.",
  },
  {
    q: "Scan & Publie détecte-t-il les événements récurrents ?",
    a: "Oui — si l'affiche mentionne une répétition (ex: 'tous les vendredis', 'every Sunday', 'chaque semaine'), Scan & Publie détecte automatiquement la récurrence et pré-remplit le type (hebdomadaire, mensuel...) et les jours concernés dans le formulaire. Tu n'as plus qu'à valider.",
  },
  {
    q: "Comment soumettre un événement récurrent ?",
    a: "Dans le formulaire d'ajout, coche 'Cet événement se répète'. Choisis la fréquence (quotidien, hebdomadaire, mensuel, annuel) et les jours si hebdomadaire. LOTBO génère automatiquement les prochaines occurrences et les affiche sur la carte. Maximum 5 occurrences générées par défaut.",
  },
  {
    q: "Comment soumettre un événement sur toute la journée ?",
    a: "Dans le formulaire d'ajout, coche la case 'Toute la journée' — les champs d'heure de début et de fin disparaissent automatiquement. L'événement s'affiche sans horaire précis sur la carte et dans la liste.",
  },
  {
    q: "Mon événement dure plusieurs jours — comment le saisir ?",
    a: "Dans le formulaire, remplis la Date de début ET la Date de fin. L'affichage montrera automatiquement la période complète (ex: 14–17 juin). Un badge 'Multi-jours' apparaît sur la carte de l'événement.",
  },
  {
    q: "Combien de temps pour que mon événement soit publié ?",
    a: "Notre équipe examine les soumissions manuellement. Le délai est généralement de quelques heures à 24h selon le volume. Vérifie si ton événement apparaît sur la carte — ou contacte-nous à lotbo@bup-mark.com si tu n'as pas de nouvelles après 48h.",
  },
  {
    q: "Mon événement a été refusé — pourquoi ?",
    a: "Les raisons de refus les plus fréquentes : informations incomplètes ou invérifiables, contenu inapproprié, doublon d'un événement déjà listé, ou adresse introuvable sur la carte. Corrige les informations et soumets à nouveau.",
  },
  {
    q: "Puis-je modifier mon événement après soumission ?",
    a: "Tu peux proposer une modification via le bouton 'Proposer une correction' sur la page de l'événement. Remplis le champ à modifier, l'ancienne valeur et la nouvelle valeur — notre équipe examine et applique la correction.",
  },
  {
    q: "Comment créer une organisation sur LOTBO ?",
    a: "Va dans ton profil (icône 👤) et clique sur 'Créer une organisation'. Remplis le nom, le slogan, la ville, le téléphone et upload un logo. Une fois créée, ta vitrine publique est accessible sur app.lotbo.app/organisation/[ton-slug].",
  },
  {
    q: "Comment modifier les informations de mon organisation ?",
    a: "Sur la vitrine de ton organisation, clique sur le bouton ✏️ Modifier (visible uniquement pour le propriétaire). Tu peux mettre à jour le nom, le slogan, la ville, le téléphone et le logo à tout moment.",
  },
  {
    q: "Comment inviter des membres dans mon organisation ?",
    a: "Sur la page de ton organisation, clique sur 'Membres' puis 'Inviter'. Saisis l'email de la personne et son rôle (Admin, Éditeur, Lecteur). Si la personne a déjà un compte LOTBO, elle est ajoutée directement. Sinon, elle reçoit un email d'invitation valable 14 jours. Tu peux voir les invitations en attente et les renvoyer ou les annuler.",
  },
  {
    q: "Comment lier un événement à mon organisation ?",
    a: "Dans le formulaire d'ajout d'événement, un menu déroulant 'Organisation' apparaît si tu es membre d'une organisation. Sélectionne ton organisation — l'événement apparaîtra automatiquement sur ta vitrine publique avec les prochains événements.",
  },
  {
    q: "Comment transférer mes événements existants vers mon organisation ?",
    a: "Dans la page Membres de ton organisation, une section 'Transférer des événements' te permet de sélectionner tes événements existants et de les rattacher à l'organisation en un clic.",
  },
  {
    q: "Comment rejoindre une organisation via une invitation ?",
    a: "Clique sur le lien d'invitation reçu par email. Si tu n'as pas encore de compte LOTBO, tu seras dirigé vers la page d'inscription — ton invitation sera automatiquement acceptée après création de ton compte. Si tu as déjà un compte, connecte-toi et l'invitation est acceptée immédiatement.",
  },
  {
    q: "Puis-je ajouter plusieurs événements à la suite ?",
    a: "Oui — après la soumission d'un événement, l'écran de confirmation affiche un bouton '+ Ajouter un autre événement' qui recharge le formulaire vide.",
  },
]

const GENERAL = [
  {
    q: "Lotbo est-il gratuit ?",
    a: "Oui, Lotbo est entièrement gratuit pour les visiteurs et les organisateurs. Aucun abonnement, aucune commission, aucun frais de publication.",
  },
  {
    q: "Dans quels pays Lotbo est-il disponible ?",
    a: "Lotbo est disponible partout dans le monde. La plateforme est née en Haïti le 5 mai 2026 et couvre actuellement plus de 16 pays et 56 villes. Tu peux chercher des événements dans n'importe quelle ville du monde.",
  },
  {
    q: "Dans quelles langues Lotbo est-il disponible ?",
    a: "Lotbo est disponible en 5 langues : Français, English, Español, Português et Kreyòl haïtien. Change de langue via le sélecteur en bas de l'interface. Toutes les pages de l'app sont traduites dans les 5 langues.",
  },
  {
    q: "Comment gagner des points sur LOTBO ?",
    a: "Tu gagnes des points en contribuant à la communauté : ajouter un événement approuvé, laisser des commentaires utiles, recevoir des réactions sur tes contributions. Tes points déterminent ton niveau : Découvreur → Explorateur → Engagé → Ambassadeur. Consulte le classement complet dans l'onglet 🏆 Ansanm.",
  },
  {
    q: "Qu'est-ce que le classement LOTBO ?",
    a: "Le classement affiche les membres les plus actifs de la communauté LOTBO, triés par points. Tu peux voir le podium Top 3, ta position personnelle et la liste complète. Sur desktop, le podium et la liste s'affichent côte à côte. Accessible via l'onglet 🏆 Ansanm.",
  },
  {
    q: "Puis-je utiliser Lotbo comme une app sur mon téléphone ?",
    a: "Oui — Lotbo est une PWA (Progressive Web App). Sur Android avec Chrome : ouvre app.lotbo.app, clique sur le menu ⋮ puis 'Ajouter à l'écran d'accueil'. Sur iPhone avec Safari : clique sur le bouton Partager puis 'Sur l'écran d'accueil'. L'app fonctionne hors connexion pour les données déjà chargées.",
  },
  {
    q: "Qu'est-ce que la section Ansanm ?",
    a: "Ansanm (qui signifie 'Ensemble' en kreyòl haïtien) est l'espace communautaire de LOTBO : classement des membres, points, niveaux et badges. C'est le cœur de la gamification de la plateforme — plus tu contribues, plus tu montes dans le classement.",
  },
  {
    q: "Comment contacter l'équipe Lotbo ?",
    a: "Envoie un email à lotbo@bup-mark.com — nous répondons dans les 48h ouvrées. Pour les questions légales ou relatives à tes données personnelles, consulte notre Politique de confidentialité et nos CGU.",
  },
]

type FAQ = { q: string; a: string }

function FAQSection({ items }: { items: FAQ[] }) {
  return (
    <div style={s.card}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '18px 20px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ color: '#F7F2E8', fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
            {item.q}
          </p>
          <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.75 }}>
            {item.a}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function Aide() {
  return (
    <main style={{
      minHeight: '100dvh', background: '#1A1410',
      color: '#F7F2E8', fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        .aide-layout {
          display: block;
        }
        .aide-nav {
          display: none;
        }
        .aide-nav-mobile {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
          margin-bottom: 48px;
        }
        @media (min-width: 1024px) {
          .aide-layout {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 48px;
            align-items: start;
          }
          .aide-nav {
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: sticky;
            top: 80px;
          }
          .aide-nav-mobile {
            display: none;
          }
        }
      `}</style>

      {/* Header sticky */}
      <div style={{
        background: '#1A1410', borderBottom: '1px solid #2a2a2a',
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
          ← Retour
        </a>
        <div style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 20, fontWeight: 'bold',
          marginLeft: 'auto', marginRight: 'auto',
        }}>
          <span style={{ color: '#F7F2E8' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Titre hero */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600,
          }}>Support</p>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700, color: '#F7F2E8', lineHeight: 1.15, marginBottom: 16,
          }}>
            Centre d&apos;aide
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>
            Trouve rapidement les réponses à tes questions sur LOTBO.
          </p>

          {/* Nav mobile */}
          <div className="aide-nav-mobile">
            {[
              { href: '#visiteurs', label: '🗺️ Visiteurs' },
              { href: '#organisateurs', label: '📅 Organisateurs' },
              { href: '#general', label: 'ℹ️ Général' },
              { href: '#contact', label: '✉️ Contact' },
            ].map(link => (
              <a key={link.href} href={link.href} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid #2a2a2a',
                borderRadius: 999, padding: '8px 16px',
                color: '#E8E0D0', textDecoration: 'none', fontSize: 13,
              }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Layout 2 colonnes desktop */}
        <div className="aide-layout">

          {/* Colonne gauche — Nav sticky desktop */}
          <nav className="aide-nav">
            <p style={{ color: '#8C5A40', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>
              Navigation
            </p>
            {[
              { href: '#visiteurs', label: '🗺️ Visiteurs', count: VISITEURS.length },
              { href: '#organisateurs', label: '📅 Organisateurs', count: ORGANISATEURS.length },
              { href: '#general', label: 'ℹ️ Général', count: GENERAL.length },
              { href: '#contact', label: '✉️ Contact', count: null },
            ].map(link => (
              <a key={link.href} href={link.href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #2a2a2a',
                borderRadius: 10, padding: '10px 14px',
                color: '#E8E0D0', textDecoration: 'none', fontSize: 13,
                transition: 'background 0.2s',
              }}>
                <span>{link.label}</span>
                {link.count && (
                  <span style={{ background: 'rgba(200,67,26,0.2)', color: '#C8431A', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 'bold' }}>
                    {link.count}
                  </span>
                )}
              </a>
            ))}

            {/* Logo en bas nav */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #2a2a2a' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                <span style={{ color: '#F7F2E8' }}>lot</span>
                <span style={{ color: '#C8431A' }}>bo</span>
              </div>
              <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>
                Né en Haïti 🇭🇹<br/>
                Pour le monde entier.
              </p>
            </div>
          </nav>

          {/* Colonne droite — Contenu */}
          <div>

            {/* Visiteurs */}
            <div style={s.section} id="visiteurs">
              <span style={{ ...s.badge, background: 'rgba(200,67,26,0.15)', color: '#C8431A' }}>
                Pour les visiteurs
              </span>
              <h2 style={s.h2}>Trouver et découvrir des événements</h2>
              <FAQSection items={VISITEURS} />
            </div>

            {/* Organisateurs */}
            <div style={s.section} id="organisateurs">
              <span style={{ ...s.badge, background: 'rgba(212,168,32,0.15)', color: '#D4A820' }}>
                Pour les organisateurs
              </span>
              <h2 style={s.h2}>Publier et gérer vos événements</h2>
              <FAQSection items={ORGANISATEURS} />
            </div>

            {/* Général */}
            <div style={s.section} id="general">
              <span style={{ ...s.badge, background: 'rgba(255,255,255,0.08)', color: '#E8E0D0' }}>
                Général
              </span>
              <h2 style={s.h2}>Questions fréquentes</h2>
              <FAQSection items={GENERAL} />
            </div>

            {/* Contact */}
            <div id="contact" style={{
              background: 'rgba(200,67,26,0.08)',
              border: '1px solid rgba(200,67,26,0.2)',
              borderRadius: 16, padding: '28px 20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 24, marginBottom: 12 }}>🇭🇹</p>
              <p style={{ color: '#F7F2E8', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Tu n&apos;as pas trouvé ta réponse ?
              </p>
              <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Notre équipe répond dans les 48h ouvrées.
              </p>
              <a href="mailto:lotbo@bup-mark.com" style={{
                background: '#C8431A', color: '#F7F2E8',
                padding: '13px 28px', borderRadius: 10,
                fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
                display: 'inline-block', marginBottom: 16,
              }}>
                lotbo@bup-mark.com
              </a>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                <a href="/politique-confidentialite" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>Confidentialité</a>
                <a href="/cgu" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>CGU</a>
                <a href="/apropos" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>À propos</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
