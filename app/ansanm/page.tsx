export default function AnsanmPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      background: '#F7F2E8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px 96px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 52, marginBottom: 24 }}>🤝</div>

      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1A1410',
        marginBottom: 16,
        lineHeight: 1.2,
      }}>
        <span style={{ color: '#C8431A' }}>Ansanm</span>
      </h1>

      <p style={{
        fontSize: 15,
        color: '#8C5A40',
        lineHeight: 1.7,
        maxWidth: 300,
        marginBottom: 8,
      }}>
        Communauté LOTBO
      </p>

      <p style={{
        fontSize: 13,
        color: 'rgba(140,90,64,0.6)',
        lineHeight: 1.6,
        maxWidth: 260,
      }}>
        bientôt disponible
      </p>
    </main>
  )
}
