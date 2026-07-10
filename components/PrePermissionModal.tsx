'use client'

interface Props {
  onActiver: () => void
  onPasMaintenant: () => void
  contexte?: string
}

export default function PrePermissionModal({ onActiver, onPasMaintenant, contexte }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,20,16,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#F7F2E8', borderRadius: '20px 20px 0 0',
        padding: '28px 24px 32px', maxWidth: 420, width: '100%',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>🔔</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#1A1410', textAlign: 'center', marginBottom: 12 }}>
          Ne rate plus rien près de toi
        </h2>
        {contexte && (
          <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' }}>
            {contexte}
          </p>
        )}
        <p style={{ color: '#4A3830', fontSize: 14, lineHeight: 1.7, marginBottom: 24, textAlign: 'center' }}>
          Active les notifications pour recevoir :<br/>
          · Les nouveaux événements dans ta ville<br/>
          · Un rappel avant tes événements favoris<br/>
          · Tes badges et récompenses LOTBO
        </p>
        <button
          onClick={onActiver}
          style={{ width: '100%', padding: '14px', background: '#C8431A', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginBottom: 10 }}
        >
          Activer les notifications →
        </button>
        <button
          onClick={onPasMaintenant}
          style={{ width: '100%', padding: '12px', background: 'transparent', color: '#8C5A40', border: 'none', fontSize: 14, cursor: 'pointer' }}
        >
          Pas maintenant
        </button>
      </div>
    </div>
  )
}
