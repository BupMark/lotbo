'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import BadgeProgression, { type BadgeDef } from '../../components/BadgeProgression'

const BADGES_CONTRIBUTEUR: BadgeDef[] = [
  { id: 'decouvreur',       emoji: '🌱', seuil: 1,   label: 'Découvreur' },
  { id: 'actif',            emoji: '🔥', seuil: 5,   label: 'Actif' },
  { id: 'contributeur',     emoji: '⭐', seuil: 10,  label: 'Contributeur' },
  { id: 'top_contributeur', emoji: '🏅', seuil: 25,  label: 'Top contributeur' },
  { id: 'elite',            emoji: '🥇', seuil: 50,  label: 'Élite' },
  { id: 'legende',          emoji: '👑', seuil: 100, label: 'Légende' },
]

const BADGES_ORGANISATEUR: BadgeDef[] = [
  { id: 'organisateur', emoji: '🎪', seuil: 1,  label: 'Organisateur' },
  { id: 'regulier',     emoji: '📅', seuil: 3,  label: 'Régulier' },
  { id: 'premium',      emoji: '💎', seuil: 10, label: 'Premium' },
  { id: 'vedette',      emoji: '🌟', seuil: 25, label: 'Vedette' },
  { id: 'champion',     emoji: '🏆', seuil: 50, label: 'Champion' },
]

interface StatsGlobales {
  total: number
  villes: number
  pays: number
}

interface EntreeFil {
  type: string
  ville: string | null
  count: number
  libelle: string
  highlight: boolean
  derniere_activite: string
}

export default function AnsanmPage() {
  const [isDesktop, setIsDesktop] = useState(false)

  // ── Stats globales (publiques, pas d'auth requise) ──
  const [stats, setStats] = useState<StatsGlobales | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // ── Session ──
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // ── Progression personnelle ──
  const [nbContrib, setNbContrib] = useState(0)
  const [nbApprouves, setNbApprouves] = useState(0)
  const [loadingProgression, setLoadingProgression] = useState(true)

  // ── Toggle confidentialité ──
  const [visibleAnsanm, setVisibleAnsanm] = useState(true)
  const [savingToggle, setSavingToggle] = useState(false)

  // ── Fil d'activité communautaire ──
  const [fil, setFil] = useState<EntreeFil[] | null>(null)
  const [loadingFil, setLoadingFil] = useState(true)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Stats globales
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }, [])

  // Session + données personnelles
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        setLoadingSession(false)
        setLoadingProgression(false)
        setLoadingFil(false)
        return
      }

      setUserId(session.user.id)
      setAccessToken(session.access_token)
      setLoadingSession(false)

      // Progression — comptage direct des événements, même pattern que /profil
      const [{ count: nbContribCount }, { count: nbApprouvesCount }, { data: prof }] = await Promise.all([
        supabase.from('evenements').select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id).eq('soumis_en_tant_que', 'contributeur'),
        supabase.from('evenements').select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id).eq('statut', 'approuve'),
        supabase.from('profiles').select('visible_ansanm').eq('id', session.user.id).single(),
      ])
      setNbContrib(nbContribCount || 0)
      setNbApprouves(nbApprouvesCount || 0)
      setVisibleAnsanm(prof?.visible_ansanm ?? true)
      setLoadingProgression(false)

      // Fil communautaire
      try {
        const res = await fetch('/api/activite-communautaire/fil', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const filData = await res.json()
        setFil(filData.fil || [])
      } catch {
        setFil([])
      } finally {
        setLoadingFil(false)
      }
    })
  }, [])

  const toggleVisibleAnsanm = async () => {
    if (!userId || savingToggle) return
    const nouveauEtat = !visibleAnsanm
    setVisibleAnsanm(nouveauEtat) // optimiste
    setSavingToggle(true)
    const { error } = await supabase.from('profiles').update({ visible_ansanm: nouveauEtat }).eq('id', userId)
    if (error) setVisibleAnsanm(!nouveauEtat) // rollback si échec
    setSavingToggle(false)
  }

  const carte = {
    background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, marginBottom: 16,
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', paddingBottom: 96 }}>
      <div style={{ margin: '0 auto', padding: isDesktop ? '32px 32px 64px' : '24px 16px 64px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🌍</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>
            <span style={{ color: '#C8431A' }}>Ansanm</span>
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>La communauté LOTBO, ensemble.</p>
        </div>

        <div style={{
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '340px minmax(0, 1fr)' : undefined,
          gap: isDesktop ? 32 : 0,
          alignItems: 'start',
        }}>

          {/* ── COLONNE GAUCHE — Stats + Toggle ── */}
          <div style={{ position: isDesktop ? 'sticky' : 'static', top: isDesktop ? 24 : 'auto' }}>

            {/* 1. Stats globales */}
            <div style={carte}>
              {loadingStats ? (
                <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Chargement des statistiques…</p>
              ) : stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 'bold', color: '#C8431A', margin: 0 }}>{stats.total.toLocaleString('fr-FR')}</p>
                    <p style={{ fontSize: 11, color: '#8C5A40', margin: 0 }}>événements</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 'bold', color: '#C8431A', margin: 0 }}>{stats.villes.toLocaleString('fr-FR')}</p>
                    <p style={{ fontSize: 11, color: '#8C5A40', margin: 0 }}>villes</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 'bold', color: '#C8431A', margin: 0 }}>{stats.pays.toLocaleString('fr-FR')}</p>
                    <p style={{ fontSize: 11, color: '#8C5A40', margin: 0 }}>pays</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Statistiques indisponibles pour l'instant.</p>
              )}
            </div>

            {/* 3. Toggle visible_ansanm — seulement si connecté */}
            {userId && (
              <div style={carte}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold', margin: 0 }}>Apparaître dans le fil communautaire</p>
                    <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4, marginBottom: 0 }}>Tu restes anonyme si désactivé.</p>
                  </div>
                  <button
                    onClick={toggleVisibleAnsanm}
                    disabled={savingToggle}
                    aria-pressed={visibleAnsanm}
                    aria-label="Apparaître dans le fil communautaire"
                    style={{
                      flexShrink: 0, width: 46, height: 26, borderRadius: 999, border: 'none',
                      background: visibleAnsanm ? '#C8431A' : '#E8E0D0',
                      position: 'relative', cursor: savingToggle ? 'default' : 'pointer',
                      opacity: savingToggle ? 0.6 : 1, transition: 'background 0.2s ease',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: visibleAnsanm ? 23 : 3,
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── COLONNE DROITE — Progression + Fil ── */}
          <div style={{ minWidth: 0 }}>

            {/* 2. Progression personnelle */}
            {loadingSession ? (
              <div style={carte}>
                <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Chargement…</p>
              </div>
            ) : !userId ? (
              <div style={carte}>
                <p style={{ color: '#1A1410', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
                  Connecte-toi pour voir ta progression et le fil communautaire.
                </p>
                <a href="/login" style={{ display: 'block', textAlign: 'center', background: '#C8431A', color: 'white', padding: '10px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                  Se connecter
                </a>
              </div>
            ) : (
              <>
                {loadingProgression ? (
                  <div style={carte}>
                    <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Chargement de ta progression…</p>
                  </div>
                ) : (
                  <BadgeProgression
                    nbContrib={nbContrib}
                    nbApprouves={nbApprouves}
                    badgesContributeur={BADGES_CONTRIBUTEUR}
                    badgesOrganisateur={BADGES_ORGANISATEUR}
                    titreContributeur={(b) => `Niveau actuel — ${b ? `${b.emoji} ${b.label}` : 'Pas encore de badge'}`}
                    titreOrganisateur={(b) => `Organisateur — ${b ? `${b.emoji} ${b.label}` : 'Pas encore de badge'}`}
                    labelProchainBadge="Prochain badge"
                  />
                )}

                {/* Fil d'activité communautaire */}
                <div style={carte}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 14 }}>Ce qui se passe en ce moment</h3>
                  {loadingFil ? (
                    <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Chargement du fil…</p>
                  ) : !fil || fil.length === 0 ? (
                    <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', margin: 0 }}>Rien à afficher pour l'instant.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {fil.map((entree, i) => (
                        <div
                          key={`${entree.type}-${entree.ville}-${i}`}
                          style={{
                            padding: '10px 12px', borderRadius: 10, fontSize: 13, color: '#1A1410',
                            background: entree.highlight ? 'rgba(200,67,26,0.08)' : 'rgba(26,20,16,0.02)',
                            border: entree.highlight ? '1px solid rgba(200,67,26,0.35)' : '1px solid #F0E8DC',
                          }}
                        >
                          {entree.libelle}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </main>
  )
}
