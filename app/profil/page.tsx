'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Profil() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/login')
        return
      }
      setUser(data.session.user)

      const { data: evs } = await supabase
        .from('evenements')
        .select('*')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setEvenements(evs || [])
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const statutLabel = (statut: string) => {
    switch (statut) {
      case 'approuve': return { label: '✓ Approuvé', bg: 'rgba(200,67,26,0.15)', color: '#C8431A' }
      case 'rejete': return { label: '✗ Rejeté', bg: 'rgba(180,40,40,0.2)', color: '#e57373' }
      case 'en_attente': return { label: '⏳ En attente', bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
      default: return { label: statut, bg: 'rgba(255,255,255,0.06)', color: '#8C5A40' }
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410' }}
      className="flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  const isAdmin = user?.user_metadata?.role === 'admin'
  const nbApprouves = evenements.filter(ev => ev.statut === 'approuve').length
  const nbEnAttente = evenements.filter(ev => ev.statut === 'en_attente').length
  const nbRejetes = evenements.filter(ev => ev.statut === 'rejete').length

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', color: '#F7F2E8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
            <span style={{ color: '#F7F2E8' }}>lot</span>
            <span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
              ← Carte
            </a>
            {isAdmin && (
              <a href="/admin" style={{
                background: 'rgba(212,168,32,0.15)', color: '#D4A820',
                padding: '6px 12px', borderRadius: 999,
                fontSize: 12, fontWeight: 'bold', textDecoration: 'none'
              }}>⚙️ Admin</a>
            )}
            <button onClick={handleLogout} style={{
              background: 'rgba(180,40,40,0.15)', color: '#e57373',
              border: '1px solid rgba(180,40,40,0.3)',
              borderRadius: 999, padding: '6px 12px',
              fontSize: 12, cursor: 'pointer'
            }}>Déconnexion</button>
          </div>
        </div>

        {/* Carte profil */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #2a2a2a',
          borderRadius: 16, padding: 24, marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56,
              background: '#C8431A',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 'bold', color: '#F7F2E8',
              flexShrink: 0
            }}>
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: 16, color: '#F7F2E8' }}>
                {user?.email}
              </p>
              <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 2 }}>
                {isAdmin ? '⚙️ Administrateur' : 'Organisateur Lotbo'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              borderRadius: 10, padding: '12px 8px', textAlign: 'center'
            }}>
              <p style={{ fontSize: 22, fontWeight: 'bold', color: '#F7F2E8' }}>
                {evenements.length}
              </p>
              <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>Total</p>
            </div>
            <div style={{
              flex: 1, background: 'rgba(200,67,26,0.08)',
              borderRadius: 10, padding: '12px 8px', textAlign: 'center'
            }}>
              <p style={{ fontSize: 22, fontWeight: 'bold', color: '#C8431A' }}>
                {nbApprouves}
              </p>
              <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>Approuvés</p>
            </div>
            <div style={{
              flex: 1, background: 'rgba(212,168,32,0.08)',
              borderRadius: 10, padding: '12px 8px', textAlign: 'center'
            }}>
              <p style={{ fontSize: 22, fontWeight: 'bold', color: '#D4A820' }}>
                {nbEnAttente}
              </p>
              <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>En attente</p>
            </div>
            {nbRejetes > 0 && (
              <div style={{
                flex: 1, background: 'rgba(180,40,40,0.08)',
                borderRadius: 10, padding: '12px 8px', textAlign: 'center'
              }}>
                <p style={{ fontSize: 22, fontWeight: 'bold', color: '#e57373' }}>
                  {nbRejetes}
                </p>
                <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>Rejetés</p>
              </div>
            )}
          </div>
        </div>

        {/* Mes événements */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#F7F2E8' }}>
            Mes événements
          </h2>
          <a href="/ajouter" style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '8px 16px', borderRadius: 999,
            fontSize: 13, fontWeight: 'bold', textDecoration: 'none'
          }}>+ Ajouter</a>
        </div>

        {evenements.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #2a2a2a',
            borderRadius: 16, padding: 48, textAlign: 'center'
          }}>
            <p style={{ color: '#8C5A40', marginBottom: 20, fontSize: 14 }}>
              Tu n'as pas encore soumis d'événement.
            </p>
            <a href="/ajouter" style={{
              background: '#C8431A', color: '#F7F2E8',
              padding: '12px 24px', borderRadius: 999,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none'
            }}>
              Soumettre mon premier événement
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evenements.map(ev => {
              const s = statutLabel(ev.statut)
              return (
                <div key={ev.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12, padding: 14,
                  display: 'flex', gap: 12, alignItems: 'flex-start'
                }}>
                  {ev.image_url && (
                    <img src={ev.image_url} alt={ev.titre} style={{
                      width: 60, height: 60, objectFit: 'cover',
                      borderRadius: 8, flexShrink: 0
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 'bold', fontSize: 14, color: '#F7F2E8',
                      marginBottom: 3, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{ev.titre}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>
                      📍 {ev.lieu}
                    </p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>
                      📅 {ev.date}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(200,67,26,0.15)', color: '#C8431A',
                        padding: '2px 8px', borderRadius: 999, fontSize: 11
                      }}>{ev.categorie}</span>
                      <span style={{
                        background: s.bg, color: s.color,
                        padding: '2px 8px', borderRadius: 999, fontSize: 11
                      }}>{s.label}</span>
                    </div>
                  </div>
                  <a href={'/evenement/' + ev.id} style={{
                    color: '#8C5A40', fontSize: 12,
                    textDecoration: 'none', flexShrink: 0,
                    padding: '4px 8px'
                  }}>Voir →</a>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}