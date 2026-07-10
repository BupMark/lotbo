'use client'

import { useState, useCallback } from 'react'
import { supabase } from './supabase'

const CLE_COMPTEUR = 'lotbo_push_refus_count'
const CLE_DERNIER_REFUS = 'lotbo_push_dernier_refus_at'
const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export function peutProposerPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'default') return false
  const compteur = parseInt(localStorage.getItem(CLE_COMPTEUR) || '0', 10)
  if (compteur >= 2) return false
  const dernierRefus = localStorage.getItem(CLE_DERNIER_REFUS)
  if (dernierRefus && Date.now() - parseInt(dernierRefus, 10) < SEPT_JOURS_MS) return false
  return true
}

export function usePushPermission(userId: string | null) {
  const [modalOuvert, setModalOuvert] = useState(false)
  const [contexteModal, setContexteModal] = useState<string | undefined>(undefined)

  const proposerPermission = useCallback((contexte?: string) => {
    if (!peutProposerPermission()) return
    setContexteModal(contexte)
    setModalOuvert(true)
  }, [])

  const enregistrerRefusModal = useCallback(() => {
    const compteur = parseInt(localStorage.getItem(CLE_COMPTEUR) || '0', 10)
    localStorage.setItem(CLE_COMPTEUR, String(compteur + 1))
    localStorage.setItem(CLE_DERNIER_REFUS, String(Date.now()))
    setModalOuvert(false)
  }, [])

  const activerPermission = useCallback(async () => {
    setModalOuvert(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        if (userId) await supabase.from('profiles').update({ consent_push: false }).eq('id', userId)
        return { statut: 'refuse' as const }
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const json = subscription.toJSON()
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          user_id: userId,
        }),
      })

      if (userId) await supabase.from('profiles').update({ consent_push: true }).eq('id', userId)
      return { statut: 'accorde' as const }
    } catch (err) {
      console.error('[Push] Erreur activation:', err)
      return { statut: 'erreur' as const }
    }
  }, [userId])

  return { modalOuvert, contexteModal, proposerPermission, activerPermission, enregistrerRefusModal, fermerModal: () => setModalOuvert(false) }
}
