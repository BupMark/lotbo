'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
    case 'evenement_approuve':  return '✅'
    case 'evenement_rejete':    return '❌'
    case 'badge_debloque':      return '🏅'
    case 'nouveau_commentaire': return '💬'
    case 'classement':          return '📈'
    default:                    return '🔔'
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
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const router                    = useRouter()
  const [notifs, setNotifs]       = useState<Notif[]>([])
  const [userId, setUserId]       = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [marquant, setMarquant]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      if (!uid) { router.replace('/login'); return }
      setUserId(uid)

      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('cree_le', { ascending: false })
        .limit(50)
        .then(({ data: rows }) => {
          setNotifs((rows as Notif[]) || [])
          setLoading(false)
        })
    })
  }, [router])

  // Abonnement temps réel
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notifs-page-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifs(prev => [payload.new as Notif, ...prev])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const marquerLu = async (id: string) => {
    await supabase.from('notifications')
      .update({ lu: true, lu_le: new Date().toISOString() })
      .eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  const toutMarquerLu = async () => {
    const ids = notifs.filter(n => !n.lu).map(n => n.id)
    if (!ids.length) return
    setMarquant(true)
    await supabase.from('notifications')
      .update({ lu: true, lu_le: new Date().toISOString() })
      .in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    setMarquant(false)
  }

  const handleClick = (n: Notif) => {
    if (!n.lu) marquerLu(n.id)
    if (n.lien) router.push(n.lien)
  }

  const nonLues = notifs.filter(n => !n.lu).length

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#F7F2E8', borderBottom: '1px solid #E8E0D0',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← Retour
        </button>

        <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: '#1A1410', margin: 0 }}>
          Notifications {nonLues > 0 && <span style={{ color: '#C8431A' }}>({nonLues})</span>}
        </h1>

        {nonLues > 0 ? (
          <button
            onClick={toutMarquerLu}
            disabled={marquant}
            style={{ background: 'none', border: 'none', color: '#C8431A', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
          >
            {marquant ? '…' : 'Tout lu'}
          </button>
        ) : (
          <div style={{ width: 48 }} />
        )}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
          <div style={{ color: '#8C5A40', fontSize: 13 }}>Chargement…</div>
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔔</p>
          <p style={{ fontWeight: 'bold', fontSize: 16, color: '#1A1410', marginBottom: 8 }}>Aucune notification</p>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Tu recevras ici les réponses à tes commentaires<br />et les mises à jour de tes événements.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Non lues */}
          {nonLues > 0 && (
            <div>
              <p style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C5A40' }}>
                Non lues
              </p>
              {notifs.filter(n => !n.lu).map(n => (
                <NotifItem key={n.id} n={n} onClick={() => handleClick(n)} />
              ))}
            </div>
          )}

          {/* Lues */}
          {notifs.filter(n => n.lu).length > 0 && (
            <div>
              <p style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8C5A40' }}>
                {nonLues > 0 ? 'Déjà lues' : 'Toutes les notifications'}
              </p>
              {notifs.filter(n => n.lu).map(n => (
                <NotifItem key={n.id} n={n} onClick={() => handleClick(n)} />
              ))}
            </div>
          )}

        </div>
      )}
    </main>
  )
}

function NotifItem({ n, onClick }: { n: Notif; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '14px 16px',
        background: n.lu ? 'transparent' : 'rgba(200,67,26,0.05)',
        borderBottom: '1px solid #E8E0D0',
        cursor: n.lien ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2, marginTop: 1 }}>
        {icone(n.type)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 3, lineHeight: 1.3 }}>
          {n.titre}
        </p>
        {n.message && (
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
            {n.message}
          </p>
        )}
        <p style={{ color: '#B0977A', fontSize: 11 }}>
          {tempsRelatif(n.cree_le)}
        </p>
      </div>
      {!n.lu && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8431A', flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  )
}
