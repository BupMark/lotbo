'use client'

import { useState } from 'react'

const SECTIONS = [
  { id: 'ansanm-stats', emoji: '📊', label: 'Stats' },
  { id: 'ansanm-autour-de-moi', emoji: '🌍', label: 'Autour de moi' },
  { id: 'ansanm-progression', emoji: '⭐', label: 'Progression' },
  { id: 'ansanm-classement', emoji: '🏆', label: 'Classement' },
  { id: 'ansanm-enqueteurs', emoji: '👤', label: 'Enquêteurs' },
  { id: 'ansanm-fil', emoji: '💬', label: 'Fil' },
  { id: 'ansanm-paliers', emoji: '🎖️', label: 'Paliers' },
]

export default function MenuLateralAnsanm() {
  const [ouvert, setOuvert] = useState(false)

  const allerVers = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOuvert(false)
  }

  return (
    <>
      <button
        onClick={() => setOuvert(!ouvert)}
        aria-label="Ouvrir le menu de navigation Ansanm"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 51,
          width: 36, height: 36, borderRadius: '50%',
          background: '#C8431A', border: 'none', color: 'white', fontSize: 16,
          boxShadow: '0 2px 8px rgba(200,67,26,0.35)', cursor: 'pointer',
        }}
      >
        ☰
      </button>

      {ouvert && (
        <>
          <style>{`
            @keyframes lotboMenuSlide {
              from { transform: translateX(-100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .lotbo-menu-slide { animation: lotboMenuSlide 0.25s ease-out; }
          `}</style>

          <div
            onClick={() => setOuvert(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }}
          />

          <div
            className="lotbo-menu-slide"
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
              background: '#1A1410', zIndex: 50, padding: '16px 14px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOuvert(false)}
                aria-label="Fermer le menu"
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => allerVers(section.id)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 13,
                  padding: '9px 10px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span>{section.emoji}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
