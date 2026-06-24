/**
 * lib/amplitude.ts — FEAT-ONBOARDING-CONSENT-1
 *
 * Modifications vs version précédente :
 * - identifyUser() vérifie consent_analytics avant de transmettre userId
 * - Nouveau : setAnonymousMode() pour les utilisateurs ayant refusé l'analytics
 * - track() reste inchangé (events anonymes toujours envoyés)
 */

import * as amplitude from '@amplitude/analytics-browser'

let initialized = false

export function initAmplitude() {
  if (typeof window === 'undefined' || initialized) return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return
  amplitude.init(apiKey, { defaultTracking: false })
  initialized = true
}

export function track(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  amplitude.track(eventName, properties)
}

/**
 * Associe un userId UNIQUEMENT si l'utilisateur a consenti aux analytics.
 * Sans consentement → Amplitude reçoit des events anonymes sans identifiant.
 */
export function identifyUser(
  userId: string,
  consentAnalytics: boolean,
  userProperties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return

  if (!consentAnalytics) {
    // Pas de consentement → reset userId, mode anonyme
    amplitude.reset()
    return
  }

  amplitude.setUserId(userId)

  if (userProperties) {
    const identifyEvent = new amplitude.Identify()
    for (const [key, value] of Object.entries(userProperties)) {
      identifyEvent.set(key, value as amplitude.Types.ValidPropertyType)
    }
    amplitude.identify(identifyEvent)
  }
}

/**
 * Réinitialise l'identité Amplitude (déconnexion ou refus analytics).
 */
export function resetAmplitudeUser() {
  if (typeof window === 'undefined') return
  amplitude.reset()
}
