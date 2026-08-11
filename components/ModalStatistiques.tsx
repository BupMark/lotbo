'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
  nb_vues: number
  nb_partages_total: number
  partages_par_canal: Record<string, number>
}

const LABELS_CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  x: 'X',
  natif: 'Partage natif',
  autre: 'Autre',
}

export default function ModalStatistiques({ evenementId, onClose }: { evenementId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setErreur('Non connecté'); setLoading(false); return }

      const res = await fetch(`/api/evenement/${evenementId}/statistiques`, {
        headers: { 'Authorization': `Bearer ${data.session.access_token}` },
      })
      const json = await res.json() as Stats & { error?: string }

      if (res.ok) {
        setStats(json)
      } else {
        setErreur(json.error ?? 'Erreur de chargement')
      }
      setLoading(false)
    })
  }, [evenementId])

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61, background: '#F7F2E8', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 'bold', color: '#1A1410', margin: 0 }}>📊 Statistiques</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#8C5A40', cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Chargement...</p>
        ) : erreur ? (
          <p style={{ color: '#e57373', fontSize: 14 }}>{erreur}</p>
        ) : stats && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_vues}</p>
                <p style={{ fontSize: 11, color: '#8C5A40' }}>👁️ Vues</p>
              </div>
              <div style={{ flex: 1, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_partages_total}</p>
                <p style={{ fontSize: 11, color: '#8C5A40' }}>🔗 Partages</p>
              </div>
            </div>

            {Object.keys(stats.partages_par_canal).length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Répartition des partages</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(stats.partages_par_canal).map(([canal, count]) => (
                    <div key={canal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13, color: '#1A1410' }}>{LABELS_CANAL[canal] ?? canal}</span>
                      <span style={{ fontSize: 13, fontWeight: 'bold', color: '#C8431A' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
