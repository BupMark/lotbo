'use client'

import { useEffect, useState } from 'react'

export default function Preloader() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    let done = false
    const hide = () => {
      if (done) return
      done = true
      setFading(true)
      setTimeout(() => setVisible(false), 500)
    }

    if (document.readyState === 'complete') {
      hide()
    } else {
      window.addEventListener('load', hide, { once: true })
    }
    const timer = setTimeout(hide, 1500)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', hide)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes lotbo-pulse {
          0%   { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(3); opacity: 0;    }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position:       'fixed',
          inset:          0,
          background:     '#1A1410',
          zIndex:         9999,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          opacity:        fading ? 0 : 1,
          transition:     'opacity 0.5s ease',
          pointerEvents:  fading ? 'none' : 'auto',
        }}
      >
        {/* Logomark — L blanc + point orange pulsé */}
        <div style={{ position: 'relative', width: 80, height: 84, marginBottom: 18 }}>
          <span style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       78,
            fontWeight:     700,
            color:          'white',
            fontFamily:     'var(--font-playfair), Georgia, serif',
            fontStyle:      'italic',
            lineHeight:     1,
            userSelect:     'none',
          }}>
            L
          </span>
          {/* Point orange */}
          <div style={{ position: 'absolute', bottom: 10, left: 50, width: 17, height: 17 }}>
            <div style={{
              position:   'absolute',
              inset:      0,
              borderRadius: '50%',
              background: '#E8620A',
              animation:  'lotbo-pulse 1.5s ease-out infinite',
            }} />
            <div style={{
              position:   'absolute',
              inset:      0,
              borderRadius: '50%',
              background: '#E8620A',
            }} />
          </div>
        </div>

        {/* Texte "lotbo" */}
        <p style={{
          margin:     0,
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontStyle:  'italic',
          fontWeight: 700,
          fontSize:   30,
          letterSpacing: '0.03em',
          userSelect: 'none',
        }}>
          <span style={{ color: '#F7F2E8' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </p>
      </div>
    </>
  )
}
