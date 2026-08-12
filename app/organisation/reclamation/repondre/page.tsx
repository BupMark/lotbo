'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { useLangue } from '../../../../lib/useLangue'
import { getTraductions } from '../../../../lib/i18n'

type Statut = 'loading' | 'pret' | 'traite' | 'erreur'

export default function PageRepondreReclamation() {
  return (
    <Suspense fallback={null}>
      <RepondreReclamation />
    </Suspense>
  )
}

function RepondreReclamation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { langue } = useLangue()
  const t = getTraductions(langue)

  const [statut, setStatut] = useState<Statut>('loading')
  const [reponseChoisie, setReponseChoisie] = useState<'accepte' | 'conteste' | null>(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!token) { setStatut('erreur'); setErreur(t.organisation.lien_expire); return }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push(`/login?redirect=${encodeURIComponent(`/organisation/reclamation/repondre?token=${token}`)}`)
        return
      }
      setStatut('pret')
    })
  }, [token])

  const repondre = async (reponse: 'accepte' | 'conteste') => {
    setLoading(true)
    setErreur('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const res = await fetch('/api/organisation/reclamation/repondre', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token, reponse }),
    })

    const json = await res.json() as { error?: string }

    if (res.ok) {
      setReponseChoisie(reponse)
      setStatut('traite')
    } else {
      setErreur(json.error === 'lien_expire' ? t.organisation.lien_expire : (json.error ?? 'Erreur'))
      setStatut('erreur')
    }
    setLoading(false)
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100dvh', background: '#F7F2E8',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', textAlign: 'center',
  }

  if (statut === 'loading') return (
    <main style={containerStyle}><p style={{ color: '#8C5A40' }}>Chargement...</p></main>
  )

  if (statut === 'erreur') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>❌</p>
      <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 16 }}>{erreur}</p>
    </main>
  )

  if (statut === 'traite') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>{reponseChoisie === 'accepte' ? '✅' : '⚠️'}</p>
      <p style={{ color: '#1A1410', fontSize: 16, maxWidth: 400 }}>
        {reponseChoisie === 'accepte' ? t.organisation.transfert_accepte : t.organisation.transfert_conteste}
      </p>
    </main>
  )

  return (
    <main style={containerStyle}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>
        {t.organisation.reclamation_recue_titre}
      </h1>
      <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 28, maxWidth: 400 }}>
        {t.organisation.reclamation_recue_description.replace('{nom}', 'cette organisation')}
      </p>
      {erreur && <p style={{ color: '#e57373', fontSize: 13, marginBottom: 16 }}>{erreur}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => repondre('accepte')}
          disabled={loading}
          style={{ background: '#2D9E6B', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}
        >
          {t.organisation.accepter_transfert}
        </button>
        <button
          onClick={() => repondre('conteste')}
          disabled={loading}
          style={{ background: 'white', color: '#C8431A', border: '1px solid #C8431A', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}
        >
          {t.organisation.contester_transfert}
        </button>
      </div>
    </main>
  )
}
