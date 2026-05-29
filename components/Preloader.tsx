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
            box-shadow: 0 0 8px 4px rgba(200,67,26,0.6), 0 0 16px 6px rgba(200,67,26,0.25);
          }
          50% {
            opacity: 0.4;
            box-shadow: 0 0 3px 1px rgba(200,67,26,0.2);
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
        {/* ── L.jpg + point orange ── */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/L.png"
            alt=""
            style={{ width: 48, height: 'auto', display: 'block' }}
          />
          {/* Point orange — haut à droite du L */}
          <div style={{
            position:     'absolute',
            top:          2,
            right:        -4,
            width:        14,
            height:       14,
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
