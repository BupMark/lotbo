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

export function identifyUser(userId: string, userProperties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  amplitude.setUserId(userId)
  if (userProperties) {
    const identifyEvent = new amplitude.Identify()
    for (const [key, value] of Object.entries(userProperties)) {
      identifyEvent.set(key, value as amplitude.Types.ValidPropertyType)
    }
    amplitude.identify(identifyEvent)
  }
}
