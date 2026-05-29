'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { calculerNiveau } from '../../lib/points'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Membre {
  id: string
  nom: string | null
  photo_url: string | null
  points_total: number
  points_utilisateur: number
  points_organisateur: number
  niveau: string
  nb_evenements?: number
  pays?: string | null
  ville?: string | null
}

// ── Niveaux GM4 ───────────────────────────────────────────────────────────────
const NIVEAUX: Record<string, { emoji: string; label: string; couleur: string }> = {
  'decouvreur':       { emoji: '🌱', label: 'Découvreur',       couleur: '#8C5A40' },
  'actif':            { emoji: '🔥', label: 'Actif',            couleur: '#D4A820' },
  'contributeur':     { emoji: '⭐', label: 'Contributeur',     couleur: '#D4A820' },
  'top_contributeur': { emoji: '🏅', label: 'Top Contributeur', couleur: '#C8431A' },
  'elite':            { emoji: '🥇', label: 'Élite',            couleur: '#C8431A' },
  'legende':          { emoji: '👑', label: 'Légende LOTBO',    couleur: '#C8431A' },
}

type Filtre = 'global' | 'contributeur' | 'organisateur'
type Periode = 'tout' | 'mois' | 'semaine'

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
  const [membres, setMembres]       = useState<Membre[]>([])
  const [loading, setLoading]       = useState(true)
  const [filtre, setFiltre]         = useState<Filtre>('global')
  const [moi, setMoi]               = useState<{ position: number; total: number; membre: Membre } | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null)
    })
  }, [])

  useEffect(() => {
    charger()
  }, [filtre])

  const charger = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/classement?filtre=${filtre}`)
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
    const colonne = filtre === 'contributeur'
      ? 'points_utilisateur'
      : filtre === 'organisateur'
        ? 'points_organisateur'
        : 'points_total'

    const pos = membres.findIndex(m => m.id === userId)
    if (pos !== -1) {
      setMoi({ position: pos + 1, total: membres.length, membre: membres[pos] })
    } else {
      // Chercher hors top 100
      supabase.from('profiles')
        .select('id, nom, photo_url, points_total, points_utilisateur, points_organisateur, niveau')
        .eq('id', userId)
        .single()
        .then(({ data }) => {
          if (data) {
            // Compter combien ont plus de points
            const pts = (data as Membre)[colonne as keyof Membre] as number || 0
            supabase.from('profiles')
              .select('id', { count: 'exact', head: true })
              .gt(colonne, pts)
              .then(({ count }) => {
                setMoi({ position: (count || 0) + 1, total: membres.length, membre: data as Membre })
              })
          }
        })
    }
  }, [userId, membres, filtre])

  const top3   = membres.slice(0, 3)
  const reste  = membres.slice(3)

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', marginTop: 8, color: '#1A1410' }}>
              🏆 Classement
            </h1>
            <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 4 }}>
              Les membres les plus actifs de LOTBO
            </p>
          </div>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {([
            { key: 'global',        label: '🌍 Global'        },
            { key: 'contributeur',  label: '⭐ Contributeurs' },
            { key: 'organisateur',  label: '🎪 Organisateurs' },
          ] as { key: Filtre; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold',
                border: 'none', cursor: 'pointer',
                background: filtre === f.key ? '#C8431A' : 'white',
                color:      filtre === f.key ? 'white'   : '#8C5A40',
                boxShadow: '0 1px 4px rgba(26,20,16,0.08)',
              }}
            >{f.label}</button>
          ))}
        </div>
        {filtre === 'global' && (
          <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20 }}>
            Score = points contributeur + organisateur cumulés
          </p>
        )}

        {/* Ma position — si connecté */}
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
                {moi.position}e sur {moi.total}+ membres · {moi.membre.points_total} pts
              </p>
            </div>
            <span style={{ fontSize: 20 }}>{NIVEAUX[calculerNiveau(moi.membre.points_total)]?.emoji || '🌱'}</span>
          </div>
        )}

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
          <>
            {/* ── Podium Top 3 ── */}
            {top3.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                  {/* Réorganiser : 2e - 1er - 3e */}
                  {[top3[1], top3[0], top3[2]].map((membre, i) => {
                    if (!membre) return null
                    const pos   = i === 0 ? 2 : i === 1 ? 1 : 3
                    const haut  = pos === 1 ? 140 : pos === 2 ? 110 : 90
                    const colonne = filtre === 'contributeur'
                      ? membre.points_utilisateur
                      : filtre === 'organisateur'
                        ? membre.points_organisateur
                        : membre.points_total

                    return (
                      <div key={membre.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: pos === 1 ? 1.2 : 1 }}>
                        {/* Avatar */}
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

                        {/* Nom */}
                        <p style={{ fontWeight: 'bold', fontSize: pos === 1 ? 14 : 12, color: '#1A1410', textAlign: 'center', marginBottom: 2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {membre.nom || 'Membre LOTBO'}
                        </p>
                        <p style={{ color: '#C8431A', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{colonne} pts</p>

                        {/* Barre podium */}
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

            {/* ── Liste 4e et plus ── */}
            {reste.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reste.map((membre, i) => {
                  const pos     = i + 4
                  const colonne = filtre === 'contributeur'
                    ? membre.points_utilisateur
                    : filtre === 'organisateur'
                      ? membre.points_organisateur
                      : membre.points_total
                  const estMoi  = membre.id === userId
                  const niveau  = NIVEAUX[calculerNiveau(membre.points_total)] || NIVEAUX['decouvreur']

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
                        {colonne} pts
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}