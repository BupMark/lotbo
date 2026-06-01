'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { calculerNiveau } from '../../lib/points'

interface Membre {
  id: string
  nom: string | null
  photo_url: string | null
  points_total: number
  niveau: string
}

const NIVEAUX: Record<string, { emoji: string; label: string; couleur: string }> = {
  'decouvreur':       { emoji: '🌱', label: 'Découvreur',       couleur: '#8C5A40' },
  'actif':            { emoji: '🔥', label: 'Actif',            couleur: '#D4A820' },
  'contributeur':     { emoji: '⭐', label: 'Engagé',           couleur: '#D4A820' },
  'top_contributeur': { emoji: '🏅', label: 'Top Contributeur', couleur: '#C8431A' },
  'elite':            { emoji: '🥇', label: 'Élite',            couleur: '#C8431A' },
  'legende':          { emoji: '👑', label: 'Légende LOTBO',    couleur: '#C8431A' },
}

function getInitiales(nom: string | null): string {
  if (!nom) return 'LB'
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function medallePosition(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return String(pos)
}

export default function Classement() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [moi, setMoi]         = useState<{ position: number; total: number; membre: Membre } | null>(null)
  const [userId, setUserId]   = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null)
    })
  }, [])

  useEffect(() => {
    charger()
  }, [])

  const charger = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/classement')
      const json = res.ok ? await res.json() : { membres: [] }
      setMembres((json.membres || []) as Membre[])
    } catch {
      setMembres([])
    }
    setLoading(false)
  }

  // Position de l'utilisateur connecté
  useEffect(() => {
    if (!userId || membres.length === 0) return

    const pos = membres.findIndex(m => m.id === userId)
    if (pos !== -1) {
      setMoi({ position: pos + 1, total: membres.length, membre: membres[pos] })
    } else {
      // Hors top 100 : construire une entrée minimale depuis la session
      supabase.auth.getSession().then(({ data }) => {
        const user = data.session?.user
        if (!user) return
        supabase.from('profiles')
          .select('id, nom, photo_url, points_total')
          .eq('id', userId)
          .single()
          .then(({ data: prof }) => {
            if (!prof) return
            const membre: Membre = {
              id:           prof.id,
              nom:          prof.nom || user.email?.split('@')[0] || null,
              photo_url:    prof.photo_url,
              points_total: prof.points_total || 0,
              niveau:       calculerNiveau(prof.points_total || 0),
            }
            const position = membres.filter(m => m.points_total > (prof.points_total || 0)).length + 1
            setMoi({ position, total: membres.length, membre })
          })
      })
    }
  }, [userId, membres])

  const top3  = membres.slice(0, 3)
  const reste = membres.slice(3)

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: isDesktop ? 1100 : 680, margin: '0 auto', padding: isDesktop ? '40px 32px 80px' : '24px 16px 80px' }}>

        {/* ── Lien retour ── */}
        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
          ← Retour à la carte
        </a>

        {/* ── Hero ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1410 0%, #2C1810 100%)',
          borderRadius: 16,
          padding: isDesktop ? '48px 48px' : '28px 20px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.15, borderRadius: 16,
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
              Communauté LOTBO
            </p>
            <h1 style={{
              fontSize: isDesktop ? 42 : 28, fontWeight: 'bold',
              fontFamily: 'serif', fontStyle: 'italic',
              color: 'white', marginBottom: 12,
            }}>
              🏆 Classement
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isDesktop ? 16 : 14, maxWidth: 500 }}>
              Les membres les plus actifs de LOTBO — chaque contribution compte.
            </p>
            <div style={{ display: 'flex', gap: isDesktop ? 32 : 16, marginTop: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>{membres.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>membres actifs</p>
              </div>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>
                  {membres.reduce((sum, m) => sum + (m.points_total || 0), 0).toLocaleString()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>points distribués</p>
              </div>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>
                  {membres[0]?.points_total?.toLocaleString() || 0}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>record du leader</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ma position — si connecté ── */}
        {moi && (
          <div style={{
            background: 'rgba(200,67,26,0.08)',
            border: '1px solid rgba(200,67,26,0.25)',
            borderRadius: 14, padding: '14px 18px',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 'bold', color: '#C8431A', minWidth: 32 }}>
              #{moi.position}
            </span>
            {moi.membre.photo_url ? (
              <img src={moi.membre.photo_url} alt="moi" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C8431A' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                {getInitiales(moi.membre.nom)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410' }}>Ma position</p>
              <p style={{ color: '#8C5A40', fontSize: 12 }}>
                #{moi.position} · {moi.membre.points_total} pts
              </p>
            </div>
            <span style={{ fontSize: 20 }}>{NIVEAUX[calculerNiveau(moi.membre.points_total)]?.emoji || '🌱'}</span>
          </div>
        )}

        {/* ── Contenu principal ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#8C5A40' }}>Chargement du classement…</p>
          </div>
        ) : membres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏆</p>
            <p style={{ color: '#8C5A40', fontSize: 14 }}>Aucun membre dans ce classement pour l'instant.</p>
            <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 8 }}>Sois le premier à contribuer !</p>
          </div>
        ) : (
          <div style={{
            display: isDesktop ? 'grid' : 'block',
            gridTemplateColumns: isDesktop ? '1fr 1.4fr' : undefined,
            gap: isDesktop ? 32 : 0,
            alignItems: 'start',
          }}>

            {/* ── Colonne gauche — Podium Top 3 ── */}
            {top3.length > 0 && (
              <div style={{
                background: 'white', borderRadius: 16,
                padding: isDesktop ? '24px' : '0',
                border: isDesktop ? '1px solid #E8E0D0' : 'none',
                marginBottom: isDesktop ? 0 : 24,
              }}>
                {isDesktop && (
                  <p style={{ fontWeight: 'bold', fontSize: 14, color: '#8C5A40', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                    🥇 Top 3
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                  {[top3[1], top3[0], top3[2]].map((membre, i) => {
                    if (!membre) return null
                    const pos  = i === 0 ? 2 : i === 1 ? 1 : 3
                    const haut = pos === 1 ? 140 : pos === 2 ? 110 : 90

                    return (
                      <div key={membre.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: pos === 1 ? 1.2 : 1 }}>
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          {membre.photo_url ? (
                            <img src={membre.photo_url} alt={membre.nom || ''} style={{
                              width: pos === 1 ? 72 : 56, height: pos === 1 ? 72 : 56,
                              borderRadius: '50%', objectFit: 'cover',
                              border: `3px solid ${pos === 1 ? '#D4A820' : pos === 2 ? '#8C8C8C' : '#C8431A'}`,
                            }} />
                          ) : (
                            <div style={{
                              width: pos === 1 ? 72 : 56, height: pos === 1 ? 72 : 56,
                              borderRadius: '50%', background: '#C8431A',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 'bold', fontSize: pos === 1 ? 24 : 18,
                              border: `3px solid ${pos === 1 ? '#D4A820' : pos === 2 ? '#8C8C8C' : '#C8431A'}`,
                            }}>
                              {getInitiales(membre.nom)}
                            </div>
                          )}
                          <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 18 }}>
                            {medallePosition(pos)}
                          </span>
                        </div>

                        <p style={{ fontWeight: 'bold', fontSize: pos === 1 ? 14 : 12, color: '#1A1410', textAlign: 'center', marginBottom: 2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {membre.nom || 'Membre LOTBO'}
                        </p>
                        <p style={{ color: '#C8431A', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{membre.points_total} pts</p>

                        <div style={{
                          width: '100%', height: haut,
                          background: pos === 1 ? 'rgba(212,168,32,0.2)' : pos === 2 ? 'rgba(140,140,140,0.15)' : 'rgba(200,67,26,0.15)',
                          borderRadius: '8px 8px 0 0',
                          border: `2px solid ${pos === 1 ? 'rgba(212,168,32,0.4)' : pos === 2 ? 'rgba(140,140,140,0.3)' : 'rgba(200,67,26,0.3)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 28, opacity: 0.6 }}>
                            {NIVEAUX[calculerNiveau(membre.points_total)]?.emoji || '🌱'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Colonne droite — Liste 4e+ ── */}
            <div>
              {isDesktop && (
                <p style={{ fontWeight: 'bold', fontSize: 14, color: '#8C5A40', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                  📋 Classement complet
                </p>
              )}
              {reste.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reste.map((membre, i) => {
                    const pos    = i + 4
                    const estMoi = membre.id === userId
                    const niveau = NIVEAUX[calculerNiveau(membre.points_total)] || NIVEAUX['decouvreur']

                    return (
                      <div key={membre.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: estMoi ? 'rgba(200,67,26,0.08)' : 'white',
                        border: estMoi ? '1px solid rgba(200,67,26,0.3)' : '1px solid #E8E0D0',
                        borderRadius: 12, padding: '12px 16px',
                      }}>
                        <span style={{ color: '#8C5A40', fontSize: 13, fontWeight: 'bold', minWidth: 28, textAlign: 'right' }}>
                          {pos}
                        </span>
                        {membre.photo_url ? (
                          <img src={membre.photo_url} alt={membre.nom || ''} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E0D0', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 14, flexShrink: 0 }}>
                            {getInitiales(membre.nom)}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {membre.nom || 'Membre LOTBO'} {estMoi && <span style={{ color: '#C8431A', fontSize: 12 }}>← Toi</span>}
                          </p>
                          <p style={{ color: '#8C5A40', fontSize: 12 }}>
                            {niveau.emoji} {niveau.label}
                          </p>
                        </div>
                        <span style={{ color: '#C8431A', fontWeight: 'bold', fontSize: 14, flexShrink: 0 }}>
                          {membre.points_total} pts
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  )
}
