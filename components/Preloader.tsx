'use client'

import { useEffect, useState } from 'react'

export default function Preloader() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 500)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes lotbo-dot-glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 6px 3px rgba(200,67,26,0.55), 0 0 12px 5px rgba(200,67,26,0.25);
          }
          50% {
            opacity: 0.3;
            box-shadow: 0 0 2px 1px rgba(200,67,26,0.15);
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position:       'fixed',
          inset:          0,
          background:     '#F7F2E8',
          zIndex:         9999,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            20,
          opacity:        fading ? 0 : 1,
          transition:     'opacity 0.5s ease',
          pointerEvents:  fading ? 'none' : 'auto',
        }}
      >
        {/* ── L en CSS pur ── */}
        <div style={{ position: 'relative', width: 26, height: 36 }}>
          {/* Barre verticale */}
          <div style={{
            position:     'absolute',
            top:          0,
            left:         0,
            width:        4,
            height:       28,
            borderRadius: 4,
            background:   '#1A1410',
          }} />
          {/* Barre horizontale */}
          <div style={{
            position:     'absolute',
            top:          24,
            left:         0,
            width:        18,
            height:       4,
            borderRadius: 4,
            background:   '#1A1410',
          }} />
          {/* Point orange — bas à droite de la barre verticale */}
          <div style={{
            position:     'absolute',
            top:          18,
            left:         4,
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   '#C8431A',
            animation:    'lotbo-dot-glow 1.5s ease-in-out infinite',
          }} />
        </div>

        {/* Texte "lotbo" */}
        <p style={{
          margin:        0,
          fontFamily:    'var(--font-playfair), Georgia, serif',
          fontStyle:     'italic',
          fontWeight:    700,
          fontSize:      26,
          letterSpacing: '0.03em',
          userSelect:    'none',
        }}>
          <span style={{ color: '#1A1410' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </p>
      </div>
    </>
  )
}
