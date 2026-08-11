'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'

type TypePreuve = 'email_domaine' | 'lien_page_officielle' | 'document'

export default function ModalReclamerOrganisation({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const { langue } = useLangue()
  const t = getTraductions(langue)

  const [checking, setChecking] = useState(true)
  const [dejaEnAttente, setDejaEnAttente] = useState(false)
  const [typePreuve, setTypePreuve] = useState<TypePreuve>('email_domaine')
  const [preuveTexte, setPreuveTexte] = useState('')
  const [messageLibre, setMessageLibre] = useState('')
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setChecking(false); return }
      const { data: existante } = await supabase
        .from('reclamations_organisations')
        .select('id')
        .eq('organisation_id', organisationId)
        .eq('reclamant_id', data.session.user.id)
        .eq('statut', 'en_attente')
        .maybeSingle()
      setDejaEnAttente(!!existante)
      setChecking(false)
    })
  }, [organisationId])

  const TYPES: { code: TypePreuve; label: string }[] = [
    { code: 'email_domaine', label: t.organisation.type_preuve_email },
    { code: 'lien_page_officielle', label: t.organisation.type_preuve_lien },
    { code: 'document', label: t.organisation.type_preuve_document },
  ]

  const envoyer = async () => {
    if (!preuveTexte.trim()) return
    setErreur('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErreur('Non connecté'); setLoading(false); return }

    const { data: recData, error } = await supabase.from('reclamations_organisations').insert([{
      organisation_id: organisationId,
      reclamant_id: session.user.id,
      type_preuve: typePreuve,
      preuve_texte: preuveTexte.trim(),
      message: messageLibre.trim() || null,
      statut: 'en_attente',
    }]).select('id').single()

    if (error || !recData) {
      setErreur('Une erreur est survenue. Réessaie plus tard.')
      setLoading(false)
      return
    }

    fetch('/api/notifier-admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ kind: 'claim_organisation', record_id: recData.id }),
    }).catch(() => {})

    setEnvoye(true)
    setLoading(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61, background: '#F7F2E8', borderTop: '1px solid #E8E0D0', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{t.organisation.reclamer_titre}</h3>

        {checking ? (
          <p style={{ color: '#8C5A40', fontSize: 13, padding: '16px 0' }}>...</p>
        ) : dejaEnAttente ? (
          <p style={{ color: '#8C5A40', fontSize: 14, padding: '16px 0' }}>{t.organisation.deja_reclamee}</p>
        ) : envoye ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
            <p style={{ color: '#1A1410', fontSize: 14, marginBottom: 20 }}>{t.organisation.reclamation_envoyee}</p>
            <button onClick={onClose} style={{ background: '#C8431A', color: '#F7F2E8', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>{t.organisation.reclamer_description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {TYPES.map(ty => (
                <button key={ty.code} onClick={() => setTypePreuve(ty.code)} style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer',
                  background: typePreuve === ty.code ? 'rgba(200,67,26,0.15)' : 'white',
                  border: typePreuve === ty.code ? '1px solid #C8431A' : '1px solid #E8E0D0',
                  color: '#1A1410',
                }}>{ty.label}</button>
              ))}
            </div>

            <textarea
              value={preuveTexte}
              onChange={e => setPreuveTexte(e.target.value)}
              placeholder={t.organisation.preuve_placeholder}
              rows={2}
              maxLength={300}
              style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }}
            />

            <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>{t.organisation.reclamer_message_label}</label>
            <textarea
              value={messageLibre}
              onChange={e => setMessageLibre(e.target.value)}
              rows={2}
              maxLength={300}
              style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }}
            />

            {erreur && <p style={{ color: '#e57373', fontSize: 13, marginBottom: 12 }}>{erreur}</p>}

            <button
              onClick={envoyer}
              disabled={loading || !preuveTexte.trim()}
              style={{ width: '100%', padding: '13px', background: preuveTexte.trim() ? '#C8431A' : '#E8E0D0', color: preuveTexte.trim() ? 'white' : '#8C5A40', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold', cursor: preuveTexte.trim() ? 'pointer' : 'not-allowed' }}
            >
              {loading ? '...' : t.organisation.envoyer_reclamation}
            </button>
          </>
        )}
      </div>
    </>
  )
}
