import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité · Lotbo',
  description: 'Comment Lotbo collecte, utilise et protège vos données personnelles.',
}

const DONNEES_COLLECTEES = [
  {
    cat: "Adresse email",
    desc: "Collectée lorsque vous vous inscrivez à notre newsletter ou à nos alertes d'événements par ville et catégorie. Stockée via notre partenaire Brevo.",
  },
  {
    cat: "Données de soumission d'événement",
    desc: "Titre, lieu, ville, pays, date, description, organisateur et photo — fournis volontairement lors de l'ajout d'un événement. Ces données sont visibles publiquement après validation.",
  },
  {
    cat: "Commentaires",
    desc: "Pseudo et texte saisis lors d'un commentaire sur une page événement. Ces données sont publiques.",
  },
  {
    cat: "Abonnements push",
    desc: "Endpoint, clé publique et clé d'authentification de votre navigateur, collectés si vous activez les notifications push. Utilisés uniquement pour l'envoi de notifications Lotbo.",
  },
  {
    cat: "Compte organisateur",
    desc: "Email et mot de passe (chiffré) si vous créez un compte organisateur via Supabase Auth.",
  },
  {
    cat: "Données techniques",
    desc: "Logs de connexion standards (adresse IP, navigateur, pages visitées) conservés par nos hébergeurs Vercel et Supabase selon leurs propres politiques.",
  },
]

const NON_COLLECTES = [
  "Aucun cookie de tracking tiers (Google Analytics, Meta Pixel, etc.)",
  "Aucune donnée de paiement — Lotbo est gratuit",
  "Les likes sont stockés uniquement dans votre navigateur (localStorage) et ne nous sont jamais transmis",
  "Aucune donnée de localisation GPS sans votre consentement explicite — et uniquement pour centrer la carte",
]

const USAGES = [
  "Envoyer la newsletter hebdomadaire des événements (si inscrit)",
  "Envoyer des alertes push pour les nouveaux événements approuvés (si activé)",
  "Afficher publiquement les événements soumis après validation par notre équipe",
  "Modérer les contenus signalés par la communauté",
  "Améliorer la plateforme via les logs techniques anonymisés",
]

const PARTENAIRES = [
  { nom: "Supabase", role: "Base de données et authentification", lien: "https://supabase.com/privacy" },
  { nom: "Vercel", role: "Hébergement et déploiement", lien: "https://vercel.com/legal/privacy-policy" },
  { nom: "Brevo", role: "Envoi d'emails et newsletter", lien: "https://www.brevo.com/legal/privacypolicy/" },
  { nom: "Mapbox", role: "Cartographie interactive", lien: "https://www.mapbox.com/legal/privacy" },
]

const CONSERVATION = [
  "Emails newsletter : conservés jusqu'à désinscription via le lien dans chaque email",
  "Abonnements push : supprimés automatiquement si votre navigateur révoque l'autorisation",
  "Événements soumis : conservés indéfiniment sauf suppression par l'admin ou sur demande",
  "Commentaires : conservés indéfiniment sauf signalement justifié",
  "Comptes organisateurs : conservés jusqu'à suppression du compte sur demande",
]

const DROITS = [
  "Droit d'accès à vos données personnelles",
  "Droit de rectification de données inexactes",
  "Droit à l'effacement (\"droit à l'oubli\")",
  "Droit d'opposition au traitement",
  "Droit à la portabilité de vos données",
  "Droit de vous désinscrire à tout moment de la newsletter",
]

const s = {
  section: { marginBottom: 40 } as React.CSSProperties,
  numBadge: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(200,67,26,0.15)', border: '1px solid rgba(200,67,26,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C8431A', fontSize: 13, fontWeight: 700,
  } as React.CSSProperties,
  h2: {
    fontFamily: 'Georgia, serif', fontStyle: 'italic',
    fontSize: 'clamp(18px, 3vw, 22px)',
    fontWeight: 700, color: '#F7F2E8', lineHeight: 1.3, marginTop: 4,
  } as React.CSSProperties,
  body: { color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a',
    borderRadius: 12, padding: '16px 18px',
  } as React.CSSProperties,
  divider: { height: 1, background: '#2a2a2a', marginTop: 40 } as React.CSSProperties,
  list: { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
}

export default function PolitiqueConfidentialite() {
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
          fontSize: 20, fontWeight: 'bold', marginLeft: 'auto', marginRight: 'auto',
        }}>
          <span style={{ color: '#F7F2E8' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600,
          }}>Légal</p>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700, color: '#F7F2E8', lineHeight: 1.15, marginBottom: 16,
          }}>
            Politique de confidentialité
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Dernière mise à jour : <strong style={{ color: '#F7F2E8' }}>11 mai 2026</strong>
            <br />
            Cette politique décrit comment <strong style={{ color: '#F7F2E8' }}>Lotbo</strong>,
            un produit de <strong style={{ color: '#F7F2E8' }}>Bup Mark Ltd</strong>{' '}
            (société enregistrée en Angleterre et au Pays de Galles, n° 15840780),
            collecte, utilise et protège vos données personnelles.
          </p>
        </div>

        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 40 }} />

        {/* ── Section 1 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>1</div>
            <h2 style={s.h2}>Qui sommes-nous ?</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={s.body}>
              Lotbo est une plateforme mondiale de découverte d&apos;événements locaux,
              née en Haïti le 5 mai 2026. Accessible via{' '}
              <strong>lotbo.app</strong> et <strong>app.lotbo.app</strong>.
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a',
              borderRadius: 10, padding: '14px 16px',
            }}>
              <p style={{ color: '#C8431A', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Responsable du traitement
              </p>
              <p style={{ color: '#F7F2E8', fontSize: 14, lineHeight: 1.8 }}>
                <strong>Bup Mark Ltd</strong><br />
                Numéro d&apos;entreprise : 15840780<br />
                Office 12, Initial Business Centre<br />
                Wilson Business Park, Manchester, M40 8WN<br />
                Royaume-Uni
              </p>
            </div>
            <p style={s.body}>
              Pour toute question relative à vos données, contactez-nous à{' '}
              <a href="mailto:lotbo@bup-mark.com" style={{ color: '#C8431A' }}>lotbo@bup-mark.com</a>.
            </p>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 2 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>2</div>
            <h2 style={s.h2}>Données que nous collectons</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DONNEES_COLLECTEES.map(item => (
              <div key={item.cat} style={s.card}>
                <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.cat}</p>
                <p style={s.body}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 3 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>3</div>
            <h2 style={s.h2}>Ce que nous ne collectons pas</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={s.list}>
              {NON_COLLECTES.map((item, i) => <li key={i} style={s.body}>{item}</li>)}
            </ul>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 4 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>4</div>
            <h2 style={s.h2}>Comment nous utilisons vos données</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={s.list}>
              {USAGES.map((item, i) => <li key={i} style={s.body}>{item}</li>)}
            </ul>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 5 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>5</div>
            <h2 style={s.h2}>Partage de vos données</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={s.body}>
              Nous ne vendons jamais vos données. Nous les partageons uniquement avec nos
              prestataires techniques nécessaires au fonctionnement de Lotbo :
            </p>
            {PARTENAIRES.map(p => (
              <div key={p.nom} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a',
                borderRadius: 10, padding: '12px 16px', gap: 12, flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ color: '#F7F2E8', fontSize: 14, fontWeight: 600 }}>{p.nom}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12 }}>{p.role}</p>
                </div>
                <a href={p.lien} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#C8431A', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Leur politique →
                </a>
              </div>
            ))}
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 6 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>6</div>
            <h2 style={s.h2}>Conservation des données</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <ul style={s.list}>
              {CONSERVATION.map((item, i) => <li key={i} style={s.body}>{item}</li>)}
            </ul>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 7 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>7</div>
            <h2 style={s.h2}>Vos droits</h2>
          </div>
          <div style={{ paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={s.body}>
              Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :
            </p>
            <ul style={s.list}>
              {DROITS.map((item, i) => <li key={i} style={s.body}>{item}</li>)}
            </ul>
            <p style={s.body}>
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:lotbo@bup-mark.com" style={{ color: '#C8431A' }}>lotbo@bup-mark.com</a>.
              Nous répondons dans un délai de 30 jours.
            </p>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 8 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>8</div>
            <h2 style={s.h2}>Cookies</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>
              Lotbo n&apos;utilise pas de cookies de tracking tiers. Seuls des cookies techniques
              essentiels au fonctionnement de l&apos;authentification (session Supabase) peuvent
              être déposés si vous créez un compte organisateur. Ces cookies sont strictement
              nécessaires et ne nécessitent pas votre consentement selon la directive ePrivacy.
            </p>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 9 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>9</div>
            <h2 style={s.h2}>Sécurité</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>
              Vos données sont hébergées sur des infrastructures sécurisées (Supabase + Vercel),
              avec chiffrement en transit (HTTPS/TLS) et au repos. Les mots de passe sont chiffrés
              et jamais stockés en clair. L&apos;accès aux données est restreint via des politiques
              RLS (Row Level Security) dans notre base de données.
            </p>
          </div>
          <div style={s.divider} />
        </div>

        {/* ── Section 10 ── */}
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={s.numBadge}>10</div>
            <h2 style={s.h2}>Droit applicable</h2>
          </div>
          <div style={{ paddingLeft: 48 }}>
            <p style={s.body}>
              La présente politique est régie par le droit anglais et gallois, conformément
              au siège social de Bup Mark Ltd au Royaume-Uni. Elle est également conforme
              au Règlement Général sur la Protection des Données (RGPD) de l&apos;Union Européenne.
              Nous pouvons mettre à jour cette politique à tout moment — la date de dernière
              modification est indiquée en haut de cette page.
            </p>
          </div>
          <div style={s.divider} />
        </div>

        {/* Contact final */}
        <div style={{
          background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)',
          borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginTop: 8,
        }}>
          <p style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Une question sur vos données ?
          </p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>
            Bup Mark Ltd · Office 12, Initial Business Centre, Manchester M40 8WN, UK
          </p>
          <a href="mailto:lotbo@bup-mark.com" style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '12px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
            display: 'inline-block',
          }}>
            lotbo@bup-mark.com
          </a>
        </div>

      </div>
    </main>
  )
}
