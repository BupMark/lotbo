'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Invitation {
  id: string
  type_cible: string
  cible: string
  expire_le: string
}

interface CoOrganisateur {
  id: string
  type_cible: string
  nom: string
  accepted_at: string
}

export default function ModalCoOrganisateurs({ evenementId, onClose }: { evenementId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [coOrganisateurs, setCoOrganisateurs] = useState<CoOrganisateur[]>([])
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErreur('Non connecté'); setLoading(false); return }

    const res = await fetch(`/api/evenement/${evenementId}/co-organisateurs`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    const json = await res.json() as { invitations?: Invitation[]; coOrganisateurs?: CoOrganisateur[]; error?: string }

    if (res.ok) {
      setInvitations(json.invitations ?? [])
      setCoOrganisateurs(json.coOrganisateurs ?? [])
    } else {
      setErreur(json.error ?? 'Erreur de chargement')
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [evenementId])

  const retirer = async (cible_id: string, type: 'invitation' | 'co_organisateur') => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`/api/evenement/${evenementId}/co-organisateurs`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ cible_id, type }),
    })
    await charger()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61, background: '#F7F2E8', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 'bold', color: '#1A1410', margin: 0 }}>🤝 Co-organisateurs</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#8C5A40', cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Chargement...</p>
        ) : erreur ? (
          <p style={{ color: '#e57373', fontSize: 14 }}>{erreur}</p>
        ) : (
          <>
            {coOrganisateurs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Confirmés</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coOrganisateurs.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13, color: '#1A1410', fontWeight: 'bold' }}>{c.type_cible === 'organisation' ? '🏢' : '👤'} {c.nom}</span>
                      <button onClick={() => retirer(c.id, 'co_organisateur')} style={{ fontSize: 11, color: '#e57373', background: 'rgba(229,115,115,0.1)', border: '1px solid rgba(229,115,115,0.3)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>En attente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {invitations.map(i => (
                    <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(212,168,32,0.06)', border: '1px solid rgba(212,168,32,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13, color: '#1A1410' }}>{i.type_cible === 'organisation' ? '🏢' : '📧'} {i.cible}</span>
                      <button onClick={() => retirer(i.id, 'invitation')} style={{ fontSize: 11, color: '#8C5A40', background: 'white', border: '1px solid #E8E0D0', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                        Annuler
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {coOrganisateurs.length === 0 && invitations.length === 0 && (
              <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun co-organisateur pour l&apos;instant</p>
            )}
          </>
        )}
      </div>
    </>
  )
}
