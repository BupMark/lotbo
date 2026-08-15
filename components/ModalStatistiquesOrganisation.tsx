'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface EvenementStat {
  id: string
  titre: string
  vues: number
  partages: number
  favoris: number
  participations: number
  commentaires: number
}

interface Stats {
  nb_vues_total: number
  nb_partages_total: number
  nb_favoris_total: number
  nb_participations_total: number
  nb_commentaires_total: number
  partages_par_canal: Record<string, number>
  evenements: EvenementStat[]
}

const LABELS_CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  x: 'X',
  natif: 'Partage natif',
  autre: 'Autre',
}

export default function ModalStatistiquesOrganisation({ organisationId, onClose }: { organisationId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setErreur('Non connecté'); setLoading(false); return }

      const res = await fetch(`/api/organisation/${organisationId}/statistiques`, {
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
  }, [organisationId])

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_vues_total}</p>
                <p style={{ fontSize: 10, color: '#8C5A40' }}>👁️ Vues</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_partages_total}</p>
                <p style={{ fontSize: 10, color: '#8C5A40' }}>🔗 Partages</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_favoris_total}</p>
                <p style={{ fontSize: 10, color: '#8C5A40' }}>❤️ Favoris</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_participations_total}</p>
                <p style={{ fontSize: 10, color: '#8C5A40' }}>🙋 Je serai là</p>
              </div>
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', marginBottom: 2 }}>{stats.nb_commentaires_total}</p>
                <p style={{ fontSize: 10, color: '#8C5A40' }}>💬 Commentaires</p>
              </div>
            </div>

            {Object.keys(stats.partages_par_canal).length > 0 && (
              <div style={{ marginBottom: 20 }}>
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

            {stats.evenements.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Par événement</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.evenements.map(ev => (
                    <div key={ev.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#8C5A40' }}>👁️ {ev.vues}</span>
                        <span style={{ fontSize: 11, color: '#8C5A40' }}>🔗 {ev.partages}</span>
                        <span style={{ fontSize: 11, color: '#8C5A40' }}>❤️ {ev.favoris}</span>
                        <span style={{ fontSize: 11, color: '#8C5A40' }}>🙋 {ev.participations}</span>
                        <span style={{ fontSize: 11, color: '#8C5A40' }}>💬 {ev.commentaires}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.evenements.length === 0 && (
              <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun événement approuvé pour l&apos;instant</p>
            )}
          </>
        )}
      </div>
    </>
  )
}
