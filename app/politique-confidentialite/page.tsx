import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité · Lotbo',
  description: 'Comment Lotbo collecte, utilise et protège vos données personnelles.',
}

export default function PolitiqueConfidentialite() {
  const derniereMaj = '11 mai 2026'

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#1A1410',
      color: '#F7F2E8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        background: '#1A1410',
        borderBottom: '1px solid #2a2a2a',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <a href="/" style={{
          color: '#8C5A40', fontSize: 13,
          textDecoration: 'none', display: 'flex',
          alignItems: 'center', gap: 6
        }}>
          ← Retour
        </a>
        <div style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 20, fontWeight: 'bold', marginLeft: 'auto', marginRight: 'auto',
        }}>
          <span style={{ color: '#F7F2E8' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <div style={{ width: 48 }} /> {/* spacer pour centrer le logo */}
      </div>

      {/* Contenu */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '40px 20px 80px',
      }}>

        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            color: '#C8431A', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 12, fontWeight: 600
          }}>Légal</p>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700, color: '#F7F2E8',
            lineHeight: 1.15, marginBottom: 16
          }}>
            Politique de confidentialité
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Dernière mise à jour : <strong style={{ color: '#F7F2E8' }}>{derniereMaj}</strong>
            <br />
            Cette politique décrit comment <strong style={{ color: '#F7F2E8' }}>Lotbo</strong> collecte,
            utilise et protège vos données personnelles lorsque vous utilisez notre plateforme.
          </p>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 40 }} />

        {/* Sections */}
        {[
          {
            num: '1',
            titre: 'Qui sommes-nous ?',
            contenu: (
              <p>
                Lotbo est une plateforme mondiale de découverte d'événements locaux, née en Haïti le 5 mai 2026.
                Accessible via <strong>lotbo.app</strong> et <strong>app.lotbo.app</strong>.
                Pour toute question relative à vos données, contactez-nous à{' '}
                <a href="mailto:privacy@lotbo.app" style={{ color: '#C8431A' }}>privacy@lotbo.app</a>.
              </p>
            )
          },
          {
            num: '2',
            titre: 'Données que nous collectons',
            contenu: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    cat: 'Adresse email',
                    desc: 'Collectée lorsque vous vous inscrivez à notre newsletter ou à nos alertes d'événements par ville et catégorie. Stockée via notre partenaire Brevo.'
                  },
                  {
                    cat: 'Données de soumission d'événement',
                    desc: 'Titre, lieu, ville, pays, date, description, organisateur et photo — fournis volontairement lors de l'ajout d'un événement. Ces données sont visibles publiquement après validation.'
                  },
                  {
                    cat: 'Commentaires',
                    desc: 'Pseudo et texte saisis lors d'un commentaire sur une page événement. Ces données sont publiques.'
                  },
                  {
                    cat: 'Abonnements push',
                    desc: 'Endpoint, clé publique et clé d'authentification de votre navigateur, collectés si vous activez les notifications push. Utilisés uniquement pour l'envoi de notifications Lotbo.'
                  },
                  {
                    cat: 'Compte organisateur',
                    desc: 'Email et mot de passe (chiffré) si vous créez un compte organisateur via Supabase Auth.'
                  },
                  {
                    cat: 'Données techniques',
                    desc: 'Logs de connexion standards (adresse IP, navigateur, pages visitées) conservés par nos hébergeurs Vercel et Supabase selon leurs propres politiques.'
                  },
                ].map(item => (
                  <div key={item.cat} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #2a2a2a',
                    borderRadius: 12, padding: '16px 18px'
                  }}>
                    <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      {item.cat}
                    </p>
                    <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            )
          },
          {
            num: '3',
            titre: 'Ce que nous ne collectons pas',
            contenu: (
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Aucun cookie de tracking tiers (Google Analytics, Meta Pixel, etc.)',
                  'Aucune donnée de paiement — Lotbo est gratuit',
                  'Les likes sont stockés uniquement dans votre navigateur (localStorage) et ne nous sont jamais transmis',
                  'Aucune donnée de localisation GPS sans votre consentement explicite — et uniquement pour centrer la carte',
                ].map((item, i) => (
                  <li key={i} style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )
          },
          {
            num: '4',
            titre: 'Comment nous utilisons vos données',
            contenu: (
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Envoyer la newsletter hebdomadaire des événements (si inscrit)',
                  'Envoyer des alertes push pour les nouveaux événements approuvés (si activé)',
                  'Afficher publiquement les événements soumis après validation par notre équipe',
                  'Modérer les contenus signalés par la communauté',
                  'Améliorer la plateforme via les logs techniques anonymisés',
                ].map((item, i) => (
                  <li key={i} style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )
          },
          {
            num: '5',
            titre: 'Partage de vos données',
            contenu: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                  Nous ne vendons jamais vos données. Nous les partageons uniquement avec nos prestataires techniques nécessaires au fonctionnement de Lotbo :
                </p>
                {[
                  { nom: 'Supabase', role: 'Base de données et authentification', lien: 'https://supabase.com/privacy' },
                  { nom: 'Vercel', role: 'Hébergement et déploiement', lien: 'https://vercel.com/legal/privacy-policy' },
                  { nom: 'Brevo', role: 'Envoi d'emails et newsletter', lien: 'https://www.brevo.com/legal/privacypolicy/' },
                  { nom: 'Mapbox', role: 'Cartographie interactive', lien: 'https://www.mapbox.com/legal/privacy' },
                ].map(p => (
                  <div key={p.nom} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10, padding: '12px 16px', gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <p style={{ color: '#F7F2E8', fontSize: 14, fontWeight: 600 }}>{p.nom}</p>
                      <p style={{ color: '#8C5A40', fontSize: 12 }}>{p.role}</p>
                    </div>
                    <a href={p.lien} target="_blank" style={{
                      color: '#C8431A', fontSize: 12, textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}>
                      Leur politique →
                    </a>
                  </div>
                ))}
              </div>
            )
          },
          {
            num: '6',
            titre: 'Conservation des données',
            contenu: (
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Emails newsletter : conservés jusqu'à désinscription via le lien dans chaque email',
                  'Abonnements push : supprimés automatiquement si votre navigateur révoque l'autorisation',
                  'Événements soumis : conservés indéfiniment sauf suppression par l'admin ou sur demande',
                  'Commentaires : conservés indéfiniment sauf signalement justifié',
                  'Comptes organisateurs : conservés jusqu'à suppression du compte sur demande',
                ].map((item, i) => (
                  <li key={i} style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )
          },
          {
            num: '7',
            titre: 'Vos droits',
            contenu: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                  Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :
                </p>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Droit d'accès à vos données personnelles',
                    'Droit de rectification de données inexactes',
                    'Droit à l'effacement ("droit à l'oubli")',
                    'Droit d'opposition au traitement',
                    'Droit à la portabilité de vos données',
                    'Droit de vous désinscrire à tout moment de la newsletter',
                  ].map((item, i) => (
                    <li key={i} style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                      {item}
                    </li>
                  ))}
                </ul>
                <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                  Pour exercer ces droits, contactez-nous à{' '}
                  <a href="mailto:privacy@lotbo.app" style={{ color: '#C8431A' }}>privacy@lotbo.app</a>.
                  Nous répondons dans un délai de 30 jours.
                </p>
              </div>
            )
          },
          {
            num: '8',
            titre: 'Cookies',
            contenu: (
              <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                Lotbo n'utilise pas de cookies de tracking tiers. Seuls des cookies techniques essentiels
                au fonctionnement de l'authentification (session Supabase) peuvent être déposés si vous
                créez un compte organisateur. Ces cookies sont strictement nécessaires et ne nécessitent
                pas votre consentement selon la directive ePrivacy.
              </p>
            )
          },
          {
            num: '9',
            titre: 'Sécurité',
            contenu: (
              <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                Vos données sont hébergées sur des infrastructures sécurisées (Supabase + Vercel),
                avec chiffrement en transit (HTTPS/TLS) et au repos. Les mots de passe sont chiffrés
                et jamais stockés en clair. L'accès aux données est restreint via des politiques RLS
                (Row Level Security) dans notre base de données.
              </p>
            )
          },
          {
            num: '10',
            titre: 'Modifications',
            contenu: (
              <p style={{ color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 }}>
                Nous pouvons mettre à jour cette politique à tout moment. La date de dernière
                modification est indiquée en haut de cette page. En continuant à utiliser Lotbo
                après une modification, vous acceptez la nouvelle politique.
              </p>
            )
          },
        ].map(section => (
          <div key={section.num} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(200,67,26,0.15)',
                border: '1px solid rgba(200,67,26,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#C8431A', fontSize: 13, fontWeight: 700,
              }}>
                {section.num}
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 'clamp(18px, 3vw, 22px)',
                fontWeight: 700, color: '#F7F2E8',
                lineHeight: 1.3, marginTop: 4
              }}>
                {section.titre}
              </h2>
            </div>
            <div style={{ paddingLeft: 48 }}>
              {section.contenu}
            </div>
            <div style={{ height: 1, background: '#2a2a2a', marginTop: 40 }} />
          </div>
        ))}

        {/* Contact final */}
        <div style={{
          background: 'rgba(200,67,26,0.08)',
          border: '1px solid rgba(200,67,26,0.2)',
          borderRadius: 16, padding: '24px 20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Une question sur vos données ?
          </p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>
            Notre équipe répond dans les 30 jours.
          </p>
          <a href="mailto:privacy@lotbo.app" style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '12px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
            display: 'inline-block'
          }}>
            privacy@lotbo.app
          </a>
        </div>

      </div>
    </main>
  )
}