'use client'

/**
 * AnalyticsBanner.tsx — FEAT-ONBOARDING-CONSENT-4
 *
 * Bandeau analytics pour visiteurs anonymes (Niveau 0).
 * Affiché uniquement si lotbo_analytics_consent n'est pas encore défini.
 *
 * Exigences CNIL 2023 :
 * - 3 boutons à égalité visuelle (Refuser ne peut pas être en gris pâle ou taille réduite)
 * - Base légale : intérêt légitime (Amplitude anonymisé, pas de userId)
 * - Choix stocké dans localStorage 'lotbo_analytics_consent' = 'true' | 'false'
 *
 * NE PAS CONFONDRE avec CookieBanner (cookies techniques) — deux composants distincts.
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'lotbo_analytics_consent'

export default function AnalyticsBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    // Afficher uniquement si jamais défini (ni accepté ni refusé)
    if (stored === null) {
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const accepter = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    window.dispatchEvent(new Event('lotbo:analytics_consent_granted'))
  }

  const refuser = () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    setVisible(false)
    window.dispatchEvent(new Event('lotbo:analytics_consent_refused'))
  }

  const enSavoirPlus = () => {
    window.open('/politique-confidentialite', '_blank')
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement analytics"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 997,
        background: '#F7F2E8',
        borderTop: '1px solid #E8E0D0',
        borderRadius: '16px 16px 0 0',
        padding: '16px 16px 32px',
        boxShadow: '0 -4px 24px rgba(26,20,16,0.10)',
        animation: 'analyticsBannerUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes analyticsBannerUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Texte */}
        <p style={{
          color: '#1A1410',
          fontSize: 13,
          lineHeight: 1.65,
          marginBottom: 14,
        }}>
          LOTBO utilise des analytics <strong>anonymisés</strong> pour améliorer l&apos;expérience.
          Aucun identifiant personnel n&apos;est collecté.
        </p>

        {/* 3 boutons à égalité visuelle — exigence CNIL 2023 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
        }}>

          {/* Refuser — même poids visuel que Accepter */}
          <button
            onClick={refuser}
            style={{
              background: 'white',
              border: '1px solid #E8E0D0',
              color: '#1A1410',
              borderRadius: 10,
              padding: '11px 8px',
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
          >
            Refuser
          </button>

          {/* En savoir plus */}
          <button
            onClick={enSavoirPlus}
            style={{
              background: 'white',
              border: '1px solid #E8E0D0',
              color: '#8C5A40',
              borderRadius: 10,
              padding: '11px 8px',
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
          >
            En savoir plus
          </button>

          {/* Accepter */}
          <button
            onClick={accepter}
            style={{
              background: '#C8431A',
              border: '1px solid #C8431A',
              color: 'white',
              borderRadius: 10,
              padding: '11px 8px',
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
          >
            OK
          </button>

        </div>
      </div>
    </div>
  )
}
