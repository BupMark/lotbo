'use client'

import { useEffect, useState } from 'react'

export default function StoreBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const estAppInstallee =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    const dismissed = localStorage.getItem('lotbo_stores_banner_dismissed')
    const clicked = localStorage.getItem('lotbo_stores_banner_clicked')

    if (!estAppInstallee && !dismissed && !clicked) {
      setVisible(true)
    }
  }, [])

  const fermer = () => {
    localStorage.setItem('lotbo_stores_banner_dismissed', '1')
    setVisible(false)
  }

  const clicBadge = () => {
    localStorage.setItem('lotbo_stores_banner_clicked', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 500,
      background: '#1A1410', color: '#F7F2E8',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 16, flexWrap: 'wrap',
      fontSize: 13, textAlign: 'center',
      borderBottom: '1px solid rgba(247,242,232,0.08)',
    }}>
      <span>📱 LOTBO est maintenant sur App Store et Google Play</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <a
          href="https://apps.apple.com/us/app/lotbo-local-events/id6779059022"
          target="_blank" rel="noopener noreferrer"
          onClick={clicBadge}
          style={{ color: '#C8431A', fontWeight: 'bold', textDecoration: 'none', fontSize: 13 }}
        >
          App Store →
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=app.lotbo.app.twa"
          target="_blank" rel="noopener noreferrer"
          onClick={clicBadge}
          style={{ color: '#C8431A', fontWeight: 'bold', textDecoration: 'none', fontSize: 13 }}
        >
          Google Play →
        </a>
      </div>
      <button
        onClick={fermer}
        aria-label="Fermer"
        style={{
          background: 'none', border: 'none', color: 'rgba(247,242,232,0.4)',
          fontSize: 16, cursor: 'pointer', padding: 4, lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
