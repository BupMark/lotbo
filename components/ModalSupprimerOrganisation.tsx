'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'

type Option = 'transferer' | 'supprimer_tout'

export default function ModalSupprimerOrganisation({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const { langue } = useLangue()
  const t = getTraductions(langue)
  const [option, setOption] = useState<Option | null>(null)
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const confirmer = async () => {
    if (!option) return
    setLoading(true)
    setErreur('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErreur('Non connecté'); setLoading(false); return }

    const res = await fetch(`/api/organisation/${organisationId}/demander-suppression`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ option }),
    })

    const json = await res.json() as { error?: string }

    if (res.ok) {
      setSucces(true)
    } else {
      setErreur(json.error ?? 'Erreur inconnue')
    }
    setLoading(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61, background: '#F7F2E8', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{t.organisation.suppression_titre}</h3>

        {succes ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
            <p style={{ color: '#1A1410', fontSize: 14, marginBottom: 12 }}>{t.organisation.suppression_succes}</p>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20 }}>{t.organisation.suppression_delai}</p>
            <button onClick={onClose} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>{t.organisation.suppression_description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <button onClick={() => setOption('transferer')} style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                background: option === 'transferer' ? 'rgba(200,67,26,0.1)' : 'white',
                border: option === 'transferer' ? '1px solid #C8431A' : '1px solid #E8E0D0',
              }}>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>{t.organisation.suppression_option_transferer}</p>
                <p style={{ fontSize: 11, color: '#8C5A40' }}>{t.organisation.suppression_option_transferer_desc}</p>
              </button>
              <button onClick={() => setOption('supprimer_tout')} style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                background: option === 'supprimer_tout' ? 'rgba(229,115,115,0.1)' : 'white',
                border: option === 'supprimer_tout' ? '1px solid #e57373' : '1px solid #E8E0D0',
              }}>
                <p style={{ fontSize: 13, fontWeight: 'bold', color: '#e57373', marginBottom: 4 }}>{t.organisation.suppression_option_tout}</p>
                <p style={{ fontSize: 11, color: '#8C5A40' }}>{t.organisation.suppression_option_tout_desc}</p>
              </button>
            </div>

            {erreur && <p style={{ color: '#e57373', fontSize: 13, marginBottom: 12 }}>{erreur}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
                {t.organisation.suppression_annuler}
              </button>
              <button onClick={confirmer} disabled={!option || loading} style={{ flex: 1, background: option ? '#e57373' : '#E8E0D0', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 'bold', cursor: option ? 'pointer' : 'default' }}>
                {loading ? t.organisation.suppression_envoi : t.organisation.suppression_confirmer}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
