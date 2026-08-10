'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Statut = 'loading' | 'ok' | 'erreur'

export default function PageAccepterCoOrganisation() {
  return (
    <Suspense fallback={null}>
      <AccepterCoOrganisation />
    </Suspense>
  )
}

function AccepterCoOrganisation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [statut, setStatut] = useState<Statut>('loading')
  const [message, setMessage] = useState('')
  const [evenementId, setEvenementId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setStatut('erreur'); setMessage('Lien invalide.'); return }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push(`/inscription?redirect=${encodeURIComponent(`/evenement/co-organisation/accepter?token=${token}`)}`)
        return
      }

      const res = await fetch('/api/evenement/co-organisation/accepter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ token }),
      })

      const json = await res.json() as { error?: string; evenement_id?: string }

      if (res.ok) {
        setStatut('ok')
        setEvenementId(json.evenement_id ?? null)
      } else {
        setStatut('erreur')
        setMessage(json.error ?? 'Une erreur est survenue.')
      }
    })
  }, [token])

  const containerStyle: React.CSSProperties = {
    minHeight: '100dvh', background: '#F7F2E8',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', textAlign: 'center',
  }

  if (statut === 'loading') return (
    <main style={containerStyle}>
      <p style={{ color: '#8C5A40', fontSize: 14 }}>Chargement...</p>
    </main>
  )

  if (statut === 'erreur') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>❌</p>
      <p style={{ fontWeight: 'bold', fontSize: 16, color: '#1A1410', marginBottom: 8 }}>{message}</p>
      <a href="/" style={{ color: '#C8431A', fontSize: 14, textDecoration: 'none' }}>← Retour à la carte</a>
    </main>
  )

  return (
    <main style={containerStyle}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
      <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>
        Tu es maintenant co-organisateur !
      </h1>
      {evenementId && (
        <a
          href={`/evenement/${evenementId}`}
          style={{ background: '#C8431A', color: 'white', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}
        >
          Voir l&apos;événement →
        </a>
      )}
    </main>
  )
}
