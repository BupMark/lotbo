export default function SupprimerDonnees() {
  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 36, fontWeight: 'bold' }}>
              <span style={{ color: '#1A1410' }}>lot</span>
              <span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </a>
        </div>

        <h1 style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Suppression de vos données
        </h1>

        <p style={{ color: '#8C5A40', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et aux politiques de Meta, vous pouvez demander la suppression de toutes vos données personnelles sur LOTBO.
        </p>

        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <h2 style={{ color: '#1A1410', fontSize: 17, fontWeight: 'bold', marginBottom: 12 }}>
            Comment supprimer vos données ?
          </h2>
          <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
            Envoyez un email à l'adresse suivante avec pour objet <strong>"Suppression de mes données LOTBO"</strong> :
          </p>
          <a href="mailto:lotbo@bup-mark.com" style={{ display: 'inline-block', background: '#C8431A', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none' }}>
            lotbo@bup-mark.com
          </a>
        </div>

        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <h2 style={{ color: '#1A1410', fontSize: 17, fontWeight: 'bold', marginBottom: 12 }}>
            Quelles données sont concernées ?
          </h2>
          <ul style={{ color: '#8C5A40', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
            <li>Votre profil et informations personnelles</li>
            <li>Les événements que vous avez soumis</li>
            <li>Vos commentaires et réactions</li>
            <li>Votre historique de points et badges</li>
            <li>Votre abonnement à la newsletter</li>
          </ul>
        </div>

        <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.7 }}>
          Votre demande sera traitée dans un délai de <strong>30 jours</strong>. Vous recevrez une confirmation par email.
        </p>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a href="/" style={{ color: '#C8431A', fontSize: 13, textDecoration: 'none', fontWeight: 'bold' }}>
            ← Retour à la carte
          </a>
        </div>

      </div>
    </main>
  )
}