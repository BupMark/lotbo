import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Aide · Lotbo",
  description: "Comment utiliser Lotbo — guide pour les visiteurs et les organisateurs d'événements.",
}

const s = {
  section: { marginBottom: 48 } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #2a2a2a',
    borderRadius: 14, overflow: 'hidden',
  } as React.CSSProperties,
  questionBtn: {
    width: '100%', textAlign: 'left' as const,
    padding: '16px 20px',
    background: 'transparent', border: 'none',
    borderBottom: '1px solid #2a2a2a',
    color: '#F7F2E8', fontSize: 15, fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  } as React.CSSProperties,
  answer: {
    padding: '16px 20px',
    color: '#E8E0D0', fontSize: 14, lineHeight: 1.75,
    borderBottom: '1px solid #2a2a2a',
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
    q: "Comment chercher dans une autre ville ?",
    a: "Dans la barre de recherche en haut, tape le nom d'une ville (ex: \"Port-au-Prince\", \"Paris\", \"Miami\") et appuie sur Entrée. La carte se déplace automatiquement vers cette ville.",
  },
  {
    q: "Comment filtrer les événements ?",
    a: "Clique sur le bouton ⚙️ Filtres pour accéder aux options : catégorie (Festival, Sport, Culture...), accès (public ou privé), prix (gratuit ou payant), et période (date de début et de fin). Un badge rouge indique le nombre de filtres actifs.",
  },
  {
    q: "Comment partager un événement ?",
    a: "Sur la page détail d'un événement, tu trouveras des boutons de partage pour WhatsApp, Facebook et X (Twitter). Tu peux aussi copier le lien directement depuis la barre d'adresse de ton navigateur.",
  },
  {
    q: "Comment activer les notifications ?",
    a: "Dans le menu ☰ (hamburger), clique sur \"Activer les notifications\" et accepte la demande de permission de ton navigateur. Tu recevras une notification push chaque fois qu'un nouvel événement est approuvé dans ta zone. Tu peux aussi t'inscrire aux alertes par email via \"Recevoir les événements\".",
  },
  {
    q: "Un événement est incorrect ou annulé — que faire ?",
    a: "Sur la page de l'événement, clique sur le bouton ⚠️ Signaler. Choisis la raison (fausse information, événement annulé, etc.) et envoie. Notre équipe examine chaque signalement.",
  },
]

const ORGANISATEURS = [
  {
    q: "Comment soumettre un événement ?",
    a: "Clique sur + Ajouter (en haut à droite sur desktop, ou dans le menu ☰ sur mobile). Remplis le formulaire : titre, organisateur, ville, pays, lieu, date, heure, type d'événement. L'autocomplétion t'aide à trouver l'adresse exacte — une mini-carte te montre le pin avant de valider. Soumets — ton événement sera examiné par notre équipe.",
  },
  {
    q: "Combien de temps pour que mon événement soit publié ?",
    a: "Notre équipe examine les soumissions manuellement. Le délai est généralement de quelques heures à 24h selon le volume. Tu ne recevras pas de notification de confirmation pour l'instant — vérifie simplement si ton événement apparaît sur la carte.",
  },
  {
    q: "Mon événement a été refusé — pourquoi ?",
    a: "Les raisons de refus les plus fréquentes : informations incomplètes ou invérifiables, contenu inapproprié, doublon d'un événement déjà listé, ou adresse introuvable sur la carte. Corrige les informations et soumets à nouveau.",
  },
  {
    q: "Puis-je modifier mon événement après soumission ?",
    a: "Pas encore via l'interface — cette fonctionnalité est en développement. En attendant, contacte-nous à lotbo@bup-mark.com avec l'URL de l'événement et les corrections à apporter.",
  },
  {
    q: "Mon événement dure plusieurs jours — comment le saisir ?",
    a: "Dans le formulaire, coche la case \"Événement sur plusieurs jours\". Deux champs de date apparaissent : Date de début et Date de fin. Ex: Festival du 14 au 17 juin — saisis ces deux dates et l'affichage montrera automatiquement la période complète.",
  },
  {
    q: "Puis-je ajouter plusieurs événements à la suite ?",
    a: "Oui — après la soumission d'un événement, l'écran de confirmation affiche un bouton \"+ Ajouter un autre événement\" qui recharge le formulaire vide.",
  },
]

const GENERAL = [
  {
    q: "Lotbo est-il gratuit ?",
    a: "Oui, Lotbo est entièrement gratuit pour les visiteurs et les organisateurs. Aucun abonnement, aucun frais de publication.",
  },
  {
    q: "Dans quels pays Lotbo est-il disponible ?",
    a: "Lotbo est disponible partout dans le monde. La plateforme est née en Haïti et couvre actuellement plus de 12 pays. Tu peux chercher des événements dans n'importe quelle ville du monde.",
  },
  {
    q: "Puis-je utiliser Lotbo comme une app sur mon téléphone ?",
    a: "Oui — Lotbo est une PWA (Progressive Web App). Sur Android avec Chrome : ouvre app.lotbo.app, clique sur le menu ⋮ puis \"Ajouter à l'écran d'accueil\". Sur iPhone avec Safari : clique sur le bouton Partager puis \"Sur l'écran d'accueil\".",
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
        <div key={i}>
          <div style={{
            padding: '16px 20px',
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Titre */}
        <div style={{ marginBottom: 48 }}>
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
          <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6 }}>
            Trouve rapidement les réponses à tes questions sur Lotbo.
          </p>

          {/* Liens rapides */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
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

        {/* ── Visiteurs ── */}
        <div style={s.section} id="visiteurs">
          <span style={{ ...s.badge, background: 'rgba(200,67,26,0.15)', color: '#C8431A' }}>
            Pour les visiteurs
          </span>
          <h2 style={s.h2}>Trouver et découvrir des événements</h2>
          <FAQSection items={VISITEURS} />
        </div>

        {/* ── Organisateurs ── */}
        <div style={s.section} id="organisateurs">
          <span style={{ ...s.badge, background: 'rgba(212,168,32,0.15)', color: '#D4A820' }}>
            Pour les organisateurs
          </span>
          <h2 style={s.h2}>Publier et gérer vos événements</h2>
          <FAQSection items={ORGANISATEURS} />
        </div>

        {/* ── Général ── */}
        <div style={s.section} id="general">
          <span style={{ ...s.badge, background: 'rgba(255,255,255,0.08)', color: '#E8E0D0' }}>
            Général
          </span>
          <h2 style={s.h2}>Questions fréquentes</h2>
          <FAQSection items={GENERAL} />
        </div>

        {/* ── Contact ── */}
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
            <a href="/politique-confidentialite" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
              Confidentialité
            </a>
            <a href="/cgu" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
              CGU
            </a>
            <a href="/apropos" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
              À propos
            </a>
          </div>
        </div>

      </div>
    </main>
  )
}
