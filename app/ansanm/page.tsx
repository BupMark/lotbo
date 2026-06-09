'use client'

export default function AnsanmPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: '#F7F2E8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px 96px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 340, width: '100%' }}>

        <div style={{ fontSize: 48, marginBottom: 20 }}>🌍</div>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1A1410',
          marginBottom: 12,
          lineHeight: 1.2,
        }}>
          <span style={{ color: '#C8431A' }}>Ansanm</span> arrive.
        </h1>

        <p style={{
          fontSize: 14,
          color: '#8C5A40',
          lineHeight: 1.7,
          marginBottom: 28,
        }}>
          Ansanm — "ensemble" en kreyòl haïtien — sera l'espace où la communauté LOTBO se voit, se reconnaît et se célèbre.
        </p>

        <div style={{
          background: 'white',
          border: '1px solid #E8E0D0',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'left',
          marginBottom: 28,
        }}>
          <p style={{ fontSize: 12, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Bientôt ici :
          </p>
          {[
            'Votre progression et vos badges',
            'Les contributeurs actifs dans votre ville',
            'Le fil de vie de la communauté',
            'Vos anniversaires et paliers LOTBO célébrés',
            'Votez pour les features que vous voulez voir construire',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: '#C8431A', fontSize: 14, flexShrink: 0, marginTop: 1 }}>·</span>
              <p style={{ fontSize: 14, color: '#1A1410', lineHeight: 1.5, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: 13,
          color: '#8C5A40',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          La communauté façonne LOTBO.<br />
          <strong style={{ color: '#C8431A', fontStyle: 'normal' }}>Ansanm, c'est vous.</strong>
        </p>

      </div>
    </main>
  )
}
