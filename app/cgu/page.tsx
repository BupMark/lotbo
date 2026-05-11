import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation · Lotbo",
  description: "Conditions générales d'utilisation de la plateforme Lotbo, un produit de Bup Mark Ltd.",
}

const s = {
  section: { marginBottom: 40 } as React.CSSProperties,
  numBadge: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(200,67,26,0.15)',
    border: '1px solid rgba(200,67,26,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C8431A', fontSize: 13, fontWeight: 700,
  } as React.CSSProperties,
  h2: {
    fontFamily: 'Georgia, serif', fontStyle: 'italic',
    fontSize: 'clamp(18px, 3vw, 22px)',
    fontWeight: 700, color: '#F7F2E8', lineHeight: 1.3, marginTop: 4,
  } as React.CSSProperties,
  body: { color: '#E8E0D0', fontSize: 14, lineHeight: 1.7 } as React.CSSProperties,
  divider: { height: 1, background: '#2a2a2a', marginTop: 40 } as React.CSSProperties,
  list: { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
}

const SECTIONS = [
  {
    num: '1',
    titre: 'Présentation de Lotbo',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          Lotbo est une plateforme mondiale de découverte d&apos;événements locaux, accessible via{' '}
          <strong>lotbo.app</strong> et <strong>app.lotbo.app</strong>.
        </p>
        <p style={s.body}>
          Lotbo est un produit de <strong style={{ color: '#F7F2E8' }}>Bup Mark Ltd</strong>,
          société enregistrée en Angleterre et au Pays de Galles sous le numéro{' '}
          <strong style={{ color: '#F7F2E8' }}>15840780</strong>, dont le siège social est situé au :
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a2a',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <p style={{ color: '#F7F2E8', fontSize: 14, lineHeight: 1.8 }}>
            Office 12, Initial Business Centre<br />
            Wilson Business Park<br />
            Manchester, M40 8WN<br />
            Royaume-Uni
          </p>
        </div>
      </div>
    )
  },
  {
    num: '2',
    titre: 'Acceptation des conditions',
    contenu: (
      <p style={s.body}>
        En accédant à Lotbo ou en utilisant ses services, vous acceptez sans réserve les présentes
        Conditions Générales d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions,
        vous devez cesser d&apos;utiliser la plateforme. Bup Mark Ltd se réserve le droit de
        modifier ces CGU à tout moment — la date de dernière mise à jour est indiquée en haut de cette page.
      </p>
    )
  },
  {
    num: '3',
    titre: 'Description du service',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>Lotbo permet de :</p>
        <ul style={s.list}>
          <li style={s.body}>Découvrir des événements locaux via une carte interactive</li>
          <li style={s.body}>Soumettre des événements pour publication après validation</li>
          <li style={s.body}>S&apos;inscrire à des alertes par ville et catégorie</li>
          <li style={s.body}>Commenter et interagir avec les événements publiés</li>
          <li style={s.body}>Recevoir des notifications push pour les nouveaux événements</li>
        </ul>
        <p style={s.body}>
          Lotbo se réserve le droit de modifier, suspendre ou interrompre tout ou partie
          du service à tout moment, sans préavis ni responsabilité.
        </p>
      </div>
    )
  },
  {
    num: '4',
    titre: 'Soumission d&apos;événements',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          Tout utilisateur peut soumettre un événement. En soumettant un événement, vous déclarez et garantissez que :
        </p>
        <ul style={s.list}>
          <li style={s.body}>Les informations fournies sont exactes, complètes et à jour</li>
          <li style={s.body}>Vous êtes autorisé à publier cet événement</li>
          <li style={s.body}>Le contenu ne viole aucun droit de tiers (droits d&apos;auteur, marques, vie privée)</li>
          <li style={s.body}>L&apos;événement est réel et n&apos;est pas du spam ou du contenu frauduleux</li>
          <li style={s.body}>Vous acceptez que Lotbo modère et puisse rejeter ou supprimer votre soumission</li>
        </ul>
        <p style={s.body}>
          Bup Mark Ltd se réserve le droit de refuser ou supprimer tout événement sans justification,
          notamment en cas de contenu inapproprié, inexact, illégal ou contraire aux valeurs de la plateforme.
        </p>
      </div>
    )
  },
  {
    num: '5',
    titre: 'Contenu interdit',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>Il est strictement interdit de publier ou soumettre du contenu :</p>
        <ul style={s.list}>
          <li style={s.body}>Illégal, frauduleux ou trompeur</li>
          <li style={s.body}>Haineux, discriminatoire, raciste ou incitant à la violence</li>
          <li style={s.body}>Pornographique ou sexuellement explicite</li>
          <li style={s.body}>Portant atteinte à la vie privée ou aux droits de tiers</li>
          <li style={s.body}>Constituant du spam, de la publicité non sollicitée ou du phishing</li>
          <li style={s.body}>Contenant des logiciels malveillants ou du code nuisible</li>
        </ul>
      </div>
    )
  },
  {
    num: '6',
    titre: 'Propriété intellectuelle',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          La marque <strong style={{ color: '#F7F2E8' }}>Lotbo</strong>, le logo, le design
          et l&apos;ensemble du contenu éditorial de la plateforme sont la propriété exclusive
          de Bup Mark Ltd et sont protégés par les lois sur la propriété intellectuelle.
        </p>
        <p style={s.body}>
          En soumettant du contenu (texte, photos, descriptions), vous accordez à Bup Mark Ltd
          une licence mondiale, non exclusive et gratuite pour afficher, reproduire et distribuer
          ce contenu dans le cadre du service Lotbo.
        </p>
        <p style={s.body}>
          Vous conservez tous vos droits sur le contenu que vous soumettez.
        </p>
      </div>
    )
  },
  {
    num: '7',
    titre: 'Limitation de responsabilité',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          Lotbo est une plateforme d&apos;agrégation et de découverte. Bup Mark Ltd n&apos;organise
          pas les événements listés et ne peut être tenu responsable de :
        </p>
        <ul style={s.list}>
          <li style={s.body}>L&apos;exactitude des informations soumises par les utilisateurs</li>
          <li style={s.body}>L&apos;annulation, la modification ou la non-tenue d&apos;un événement</li>
          <li style={s.body}>Tout dommage résultant de la participation à un événement listé</li>
          <li style={s.body}>L&apos;indisponibilité temporaire ou permanente du service</li>
          <li style={s.body}>La perte de données en cas de panne technique</li>
        </ul>
        <p style={s.body}>
          Dans les limites autorisées par la loi applicable, la responsabilité totale de Bup Mark Ltd
          ne pourra excéder le montant payé par l&apos;utilisateur pour le service au cours
          des 12 derniers mois (ou £0 si le service est gratuit).
        </p>
      </div>
    )
  },
  {
    num: '8',
    titre: 'Comptes utilisateurs',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          La création d&apos;un compte organisateur est optionnelle. Si vous créez un compte, vous êtes
          responsable de la confidentialité de vos identifiants et de toutes les actions
          effectuées depuis votre compte.
        </p>
        <p style={s.body}>
          Bup Mark Ltd se réserve le droit de suspendre ou supprimer tout compte en cas
          de violation des présentes CGU, sans préavis.
        </p>
      </div>
    )
  },
  {
    num: '9',
    titre: 'Droit applicable et juridiction',
    contenu: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={s.body}>
          Les présentes CGU sont régies par le droit anglais et gallois.
          Tout litige relatif à l&apos;utilisation de Lotbo sera soumis à la compétence exclusive
          des tribunaux d&apos;Angleterre et du Pays de Galles.
        </p>
        <p style={s.body}>
          Si vous résidez dans l&apos;Union Européenne, vous bénéficiez également des protections
          prévues par le droit de votre pays de résidence.
        </p>
      </div>
    )
  },
  {
    num: '10',
    titre: 'Contact',
    contenu: (
      <p style={s.body}>
        Pour toute question relative aux présentes CGU, contactez Bup Mark Ltd à l&apos;adresse :{' '}
        <a href="mailto:hello@lotbo.app" style={{ color: '#C8431A' }}>hello@lotbo.app</a>
        {' '}ou par courrier à l&apos;adresse du siège social indiquée à l&apos;article 1.
      </p>
    )
  },
]

export default function CGU() {
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

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>

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
            Conditions Générales d&apos;Utilisation
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Dernière mise à jour : <strong style={{ color: '#F7F2E8' }}>11 mai 2026</strong>
            <br />
            Ces conditions régissent l&apos;utilisation de la plateforme{' '}
            <strong style={{ color: '#F7F2E8' }}>Lotbo</strong>, un produit de{' '}
            <strong style={{ color: '#F7F2E8' }}>Bup Mark Ltd</strong>{' '}
            (n° 15840780, Angleterre et Pays de Galles).
          </p>
        </div>

        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 40 }} />

        {SECTIONS.map(section => (
          <div key={section.num} style={s.section}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={s.numBadge}>{section.num}</div>
              <h2 style={s.h2} dangerouslySetInnerHTML={{ __html: section.titre.replace(/&apos;/g, "'") }} />
            </div>
            <div style={{ paddingLeft: 48 }}>
              {section.contenu}
            </div>
            <div style={s.divider} />
          </div>
        ))}

        {/* Contact final */}
        <div style={{
          background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)',
          borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginTop: 8,
        }}>
          <p style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Une question juridique ?
          </p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>
            Bup Mark Ltd · Office 12, Initial Business Centre, Manchester M40 8WN, UK
          </p>
          <a href="mailto:hello@lotbo.app" style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '12px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
            display: 'inline-block',
          }}>
            hello@lotbo.app
          </a>
        </div>

      </div>
    </main>
  )
}
