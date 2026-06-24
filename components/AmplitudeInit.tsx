'use client'

/**
 * AmplitudeInit.tsx — FEAT-ONBOARDING-CONSENT-4
 *
 * Modifications vs version précédente :
 * - initAmplitude() et track('page_view') conditionnés au consentement analytics
 * - Écoute l'événement custom 'lotbo:analytics_consent' pour activer Amplitude
 *   sans rechargement de page quand l'utilisateur accepte depuis le bandeau
 * - localStorage key : 'lotbo_analytics_consent' = 'true' | 'false'
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAmplitude, track, resetAmplitudeUser } from '../lib/amplitude'

const STORAGE_KEY = 'lotbo_analytics_consent'

function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_KEY)
  // Si jamais défini → ni oui ni non → on n'initialise pas
  if (stored === null) return false
  return stored === 'true'
}

export default function AmplitudeInit() {
  const pathname = usePathname()

  // Initialisation au montage — uniquement si consentement explicite
  useEffect(() => {
    if (getAnalyticsConsent()) {
      initAmplitude()
    }
  }, [])

  // Page view — uniquement si consentement
  useEffect(() => {
    if (getAnalyticsConsent()) {
      track('page_view', { path: pathname })
    }
  }, [pathname])

  // Écouter l'événement custom émis par AnalyticsBanner quand l'utilisateur accepte
  useEffect(() => {
    const handleConsentGranted = () => {
      initAmplitude()
      track('page_view', { path: pathname })
      track('analytics_consent_granted')
    }

    const handleConsentRefused = () => {
      resetAmplitudeUser()
    }

    window.addEventListener('lotbo:analytics_consent_granted', handleConsentGranted)
    window.addEventListener('lotbo:analytics_consent_refused', handleConsentRefused)

    return () => {
      window.removeEventListener('lotbo:analytics_consent_granted', handleConsentGranted)
      window.removeEventListener('lotbo:analytics_consent_refused', handleConsentRefused)
    }
  }, [pathname])

  return null
}
