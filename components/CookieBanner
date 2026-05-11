'use client'

import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // N'affiche le bandeau que si l'utilisateur ne l'a pas encore fermé
    const accepted = localStorage.getItem('lotbo_cookies_accepted')
    if (!accepted) {
      // Petit délai pour éviter le flash au chargement
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const accepter = () => {
    localStorage.setItem('lotbo_cookies_accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop flou léger sur mobile */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 998,
        background: 'rgba(26,20,16,0.4)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        // Cliquer sur le backdrop = accepter aussi
        cursor: 'pointer',
      }}
        onClick={accepter}
      />

      {/* Bandeau */}
      <div
        role="dialog"
        aria-label="Informations sur les cookies"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background: '#1A1410',
          borderTop: '1px solid #2a2a2a',
          borderRadius: '20px 20px 0 0',
          padding: '20px 16px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          // Animation slide-up
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Drag handle visuel */}
        <div style={{
          width: 40, height: 4,
          background: '#2a2a2a',
          borderRadius: 2,
          margin: '0 auto 16px',
        }} />

        <div style={{
          maxWidth: 560,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>

          {/* Icône + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍪</span>
            <p style={{
              color: '#F7F2E8',
              fontSize: 15,
              fontWeight: 'bold',
            }}>
              Cookies & confidentialité
            </p>
          </div>

          {/* Texte */}
          <p style={{
            color: '#8C5A40',
            fontSize: 13,
            lineHeight: 1.65,
          }}>
            Lotbo utilise uniquement des cookies techniques essentiels au fonctionnement
            de la plateforme (session de connexion). Aucun cookie publicitaire ni tracker tiers.{' '}
            <a
              href="/politique-confidentialite"
              style={{ color: '#C8431A', textDecoration: 'underline' }}
            >
              En savoir plus
            </a>
          </p>

          {/* Bouton */}
          <button
            onClick={accepter}
            style={{
              background: '#C8431A',
              color: '#F7F2E8',
              border: 'none',
              borderRadius: 12,
              padding: '13px',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              marginTop: 4,
            }}
          >
            J&apos;ai compris
          </button>

        </div>
      </div>
    </>
  )
}