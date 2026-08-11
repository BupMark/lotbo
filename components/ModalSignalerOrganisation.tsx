'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'

const MOTIFS = ['usurpation', 'infos_fausses', 'inactive', 'contenu_illegal'] as const

export default function ModalSignalerOrganisation({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const { langue } = useLangue()
  const t = getTraductions(langue)
  const [raison, setRaison] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  const labels: Record<typeof MOTIFS[number], string> = {
    usurpation: t.organisation.raison_usurpation,
    infos_fausses: t.organisation.raison_infos_fausses,
    inactive: t.organisation.raison_inactive,
    contenu_illegal: t.organisation.raison_contenu_illegal,
  }

  const envoyer = async () => {
    if (!raison) return
    setErreur('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('signalements').insert([{
      organisation_id: organisationId,
      raison,
      user_id: session?.user?.id ?? null,
    }])
    if (error) { setErreur('Une erreur est survenue. Réessaie plus tard.'); return }
    setEnvoye(true)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61, background: '#F7F2E8', borderTop: '1px solid #E8E0D0', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>{t.organisation.signaler}</h3>

        {envoye ? (
          <p style={{ color: '#2D9E6B', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>{t.organisation.signalement_envoye}</p>
        ) : !confirmation ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {MOTIFS.map(m => (
                <button key={m} onClick={() => setRaison(m)} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: 14, textAlign: 'left', cursor: 'pointer',
                  background: raison === m ? 'rgba(200,67,26,0.15)' : 'white',
                  border: raison === m ? '1px solid #C8431A' : '1px solid #E8E0D0',
                  color: '#1A1410',
                }}>{labels[m]}</button>
              ))}
            </div>
            <button onClick={() => setConfirmation(true)} disabled={!raison}
              style={{ width: '100%', padding: '13px', background: raison ? '#C8431A' : '#E8E0D0', color: raison ? 'white' : '#8C5A40', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold', cursor: raison ? 'pointer' : 'not-allowed' }}>
              {t.organisation.envoyer_signalement}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 16 }}>{t.organisation.confirmer_signalement} {raison && labels[raison as typeof MOTIFS[number]]}</p>
            {erreur && <p style={{ color: '#e57373', fontSize: 13, marginBottom: 12 }}>{erreur}</p>}
            <button onClick={envoyer} style={{ width: '100%', padding: '13px', background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              {t.organisation.envoyer_signalement}
            </button>
          </>
        )}
      </div>
    </>
  )
}
