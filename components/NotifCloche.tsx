'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Notif {
  id: string
  user_id: string
  type: string
  titre: string
  message: string
  lien: string | null
  lu: boolean
  cree_le: string
  lu_le: string | null
}

function icone(type: string): string {
  switch (type) {
    case 'evenement_approuve':   return '✅'
    case 'evenement_rejete':     return '❌'
    case 'badge_debloque':       return '🏅'
    case 'nouveau_commentaire':  return '💬'
    case 'classement':           return '📈'
    default:                     return '🔔'
  }
}

function tempsRelatif(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const j    = Math.floor(diff / 86400000)
  if (min < 1)  return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  if (h < 24)   return `Il y a ${h} h`
  if (j < 7)    return `Il y a ${j} j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotifCloche({ userId }: { userId?: string }) {
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [ouvert, setOuvert]   = useState(false)
  const panelRef              = useRef<HTMLDivElement>(null)

  const nonLues = notifs.filter(n => !n.lu).length

  // Chargement initial + abonnement temps réel
  useEffect(() => {
    if (!userId) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('cree_le', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifs((data as Notif[]) || []))

    const channel = supabase
      .channel('notifs-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifs(prev => [payload.new as Notif, ...prev])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Fermer au clic hors du panel
  useEffect(() => {
    if (!ouvert) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ouvert])

  const marquerLu = async (id: string) => {
    await supabase.from('notifications')
      .update({ lu: true, lu_le: new Date().toISOString() })
      .eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  const toutMarquerLu = async () => {
    const ids = notifs.filter(n => !n.lu).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications')
      .update({ lu: true, lu_le: new Date().toISOString() })
      .in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
  }

  if (!userId) return null

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>

      {/* ── Bouton cloche ── */}
      <button
        onClick={() => setOuvert(o => !o)}
        aria-label="Notifications"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 16V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
            fill={nonLues > 0 ? '#C8431A' : '#8C5A40'}
          />
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill={nonLues > 0 ? '#C8431A' : '#8C5A40'} />
        </svg>
        {nonLues > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#C8431A', color: 'white',
            fontSize: 9, fontWeight: 'bold', borderRadius: 999,
            minWidth: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}>
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {/* ── Panel dropdown ── */}
      {ouvert && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320, maxWidth: 'calc(100vw - 24px)',
          background: '#F7F2E8', border: '1px solid #E8E0D0',
          borderRadius: 16, boxShadow: '0 8px 32px rgba(26,20,16,0.16)',
          zIndex: 100, overflow: 'hidden',
        }}>

          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E8E0D0' }}>
            <span style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410' }}>
              Notifications {nonLues > 0 && <span style={{ color: '#C8431A' }}>({nonLues})</span>}
            </span>
            {nonLues > 0 && (
              <button onClick={toutMarquerLu} style={{ background: 'none', border: 'none', color: '#C8431A', fontSize: 12, cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>
                Tout lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🔔</p>
                <p style={{ color: '#8C5A40', fontSize: 13 }}>Aucune notification pour l'instant</p>
              </div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => { marquerLu(n.id); if (n.lien) window.location.href = n.lien }}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 16px',
                  background: n.lu ? 'transparent' : 'rgba(200,67,26,0.05)',
                  borderBottom: '1px solid #E8E0D0',
                  cursor: n.lien ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{icone(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 'bold', fontSize: 13, color: '#1A1410', marginBottom: 2 }}>{n.titre}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.4, marginBottom: 4 }}>{n.message}</p>
                  <p style={{ color: '#B0977A', fontSize: 11 }}>{tempsRelatif(n.cree_le)}</p>
                </div>
                {!n.lu && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8431A', flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
