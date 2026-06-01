'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface OrgListe {
  id: string
  slug: string
  nom: string
  slogan: string | null
  ville: string | null
  pays: string | null
  verified: boolean
  logo_url: string | null
  owner_id: string
  nbFollowers: number
  nbEvenements: number
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OR'
}

export default function PageOrganisations() {
  const copieTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [orgs, setOrgs]                       = useState<OrgListe[]>([])
  const [loading, setLoading]                 = useState(true)
  const [userId, setUserId]                   = useState<string | null>(null)
  const [suivisIds, setSuivisIds]             = useState<Set<string>>(new Set())
  const [suiviLoading, setSuiviLoading]       = useState<string | null>(null)
  const [lienCopie, setLienCopie]             = useState<string | null>(null)
  const [isDesktop, setIsDesktop]             = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => {
      subscription.unsubscribe()
      copieTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  useEffect(() => {
    charger()
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('organisation_membres')
      .select('org_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        setSuivisIds(new Set((data ?? []).map((r: { org_id: string }) => r.org_id)))
      })
  }, [userId])

  const charger = async () => {
    setLoading(true)

    const { data: orgData } = await supabase
      .from('organisations')
      .select('id, slug, nom, slogan, ville, pays, verified, logo_url, owner_id')
      .limit(2000)

    if (!orgData || orgData.length === 0) {
      setOrgs([])
      setLoading(false)
      return
    }

    const orgIds = (orgData as OrgListe[]).map(o => o.id)
    const aujourd_hui = new Date().toISOString().split('T')[0]

    const [{ data: membresData }, { data: evData }] = await Promise.all([
      supabase
        .from('organisation_membres')
        .select('org_id')
        .neq('role', 'owner')
        .in('org_id', orgIds)
        .limit(2000),
      supabase
        .from('evenements')
        .select('organisation_id')
        .in('organisation_id', orgIds)
        .gte('date_debut', aujourd_hui)
        .eq('statut', 'approuve')
        .limit(2000),
    ])

    const followMap = new Map<string, number>()
    ;(membresData ?? []).forEach((r: { org_id: string }) => {
      followMap.set(r.org_id, (followMap.get(r.org_id) ?? 0) + 1)
    })

    const evMap = new Map<string, number>()
    ;(evData ?? []).forEach((r: { organisation_id: string }) => {
      evMap.set(r.organisation_id, (evMap.get(r.organisation_id) ?? 0) + 1)
    })

    const liste: OrgListe[] = (orgData as OrgListe[]).map(o => ({
      ...o,
      nbFollowers: followMap.get(o.id) ?? 0,
      nbEvenements: evMap.get(o.id) ?? 0,
    })).sort((a, b) => b.nbFollowers - a.nbFollowers)

    setOrgs(liste)
    setLoading(false)
  }

  const toggleSuivi = async (org: OrgListe) => {
    if (!userId) {
      window.location.href = '/login?redirect=/organisations'
      return
    }
    setSuiviLoading(org.id)
    if (suivisIds.has(org.id)) {
      await supabase.from('organisation_membres').delete()
        .eq('org_id', org.id).eq('user_id', userId)
      setSuivisIds(prev => { const s = new Set(prev); s.delete(org.id); return s })
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, nbFollowers: Math.max(0, o.nbFollowers - 1) } : o))
    } else {
      await supabase.from('organisation_membres').insert({ org_id: org.id, user_id: userId, role: 'lecteur' })
      setSuivisIds(prev => new Set([...prev, org.id]))
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, nbFollowers: o.nbFollowers + 1 } : o))
    }
    setSuiviLoading(null)
  }

  const partager = (org: OrgListe) => {
    const texte = `https://app.lotbo.app/organisation/${org.slug}`
    navigator.clipboard.writeText(texte).then(() => {
      setLienCopie(org.id)
      const prev = copieTimers.current.get(org.id)
      if (prev) clearTimeout(prev)
      copieTimers.current.set(org.id, setTimeout(() => setLienCopie(null), 2000))
    }).catch(() => {})
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <style>{`
        .org-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .org-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1024px) {
          .org-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* ── Lien retour ── */}
        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80)',
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
              🏢 Organisations
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: isDesktop ? 16 : 14, maxWidth: 500, marginBottom: 24 }}>
              Découvrez les organisations qui font vivre les événements sur LOTBO.
            </p>
            <div style={{ display: 'flex', gap: isDesktop ? 32 : 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>{orgs.length}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>organisations actives</p>
              </div>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>
                  {orgs.reduce((sum, o) => sum + o.nbEvenements, 0)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>événements à venir</p>
              </div>
              <div>
                <p style={{ color: '#C8431A', fontSize: isDesktop ? 28 : 22, fontWeight: 'bold' }}>
                  {orgs.reduce((sum, o) => sum + o.nbFollowers, 0)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>membres suiveurs</p>
              </div>
            </div>
          </div>
        </div>

        {orgs.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🏢</p>
            <p style={{ color: '#8C5A40', fontSize: 15 }}>Aucune organisation pour le moment</p>
          </div>
        ) : (
          <>
            {/* ── Org vedette — desktop uniquement ── */}
            {isDesktop && orgs.length > 0 && (() => {
              const vedette      = orgs[0]
              const estOwner     = userId === vedette.owner_id
              const suivi        = suivisIds.has(vedette.id)
              const enChargement = suiviLoading === vedette.id
              const copie        = lienCopie === vedette.id
              return (
                <div style={{
                  background: 'white', border: '2px solid #C8431A',
                  borderRadius: 20, padding: '28px 32px',
                  marginBottom: 32, display: 'flex',
                  gap: 28, alignItems: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 12, right: 16,
                    background: '#C8431A', color: 'white',
                    fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
                    padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase',
                  }}>
                    ⭐ Organisation vedette
                  </div>

                  {vedette.logo_url ? (
                    <img src={vedette.logo_url} alt={vedette.nom}
                      style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #C8431A', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                      {getInitiales(vedette.nom)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 20, color: '#1A1410' }}>{vedette.nom}</span>
                      {vedette.verified && (
                        <span style={{ background: 'rgba(45,158,107,0.12)', color: '#2D9E6B', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>
                          ✅ Vérifié
                        </span>
                      )}
                    </div>
                    {vedette.slogan && (
                      <p style={{ color: '#8C5A40', fontSize: 14, fontStyle: 'italic', marginBottom: 8 }}>{vedette.slogan}</p>
                    )}
                    {(vedette.ville || vedette.pays) && (
                      <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 12 }}>
                        📍 {[vedette.ville, vedette.pays].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                      <span style={{ color: '#8C5A40', fontSize: 13 }}>
                        <strong style={{ color: '#1A1410' }}>{vedette.nbEvenements}</strong> événements
                      </span>
                      <span style={{ color: '#8C5A40', fontSize: 13 }}>
                        <strong style={{ color: '#1A1410' }}>{vedette.nbFollowers}</strong> membres
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!estOwner && (
                        <button onClick={() => toggleSuivi(vedette)} disabled={enChargement}
                          style={{ background: suivi ? 'rgba(200,67,26,0.1)' : '#C8431A', color: suivi ? '#C8431A' : 'white', border: suivi ? '1px solid #C8431A' : 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 'bold', cursor: enChargement ? 'default' : 'pointer' }}>
                          {suivi ? 'Suivi ✓' : 'Suivre'}
                        </button>
                      )}
                      <button onClick={() => partager(vedette)}
                        style={{ background: copie ? 'rgba(45,158,107,0.1)' : 'white', color: copie ? '#2D9E6B' : '#8C5A40', border: copie ? '1px solid #2D9E6B' : '1px solid #E8E0D0', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
                        {copie ? 'Lien copié ✓' : '🔗 Partager'}
                      </button>
                      <a href={`/organisation/${vedette.slug}`}
                        style={{ background: '#1A1410', color: 'white', border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                        Voir l&apos;organisation →
                      </a>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── Label grille — desktop uniquement ── */}
            {isDesktop && orgs.length > 1 && (
              <p style={{ fontWeight: 'bold', fontSize: 14, color: '#8C5A40', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                Toutes les organisations
              </p>
            )}

            {/* ── Grille ── */}
            <div className="org-grid">
              {orgs.map(org => {
                const estOwner = userId === org.owner_id
                const suivi    = suivisIds.has(org.id)
                const loading  = suiviLoading === org.id
                const copie    = lienCopie === org.id

                return (
                  <div key={org.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <a href={`/organisation/${org.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.nom}
                          style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #E8E0D0' }}
                        />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 'bold', color: 'white' }}>
                          {getInitiales(org.nom)}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontWeight: 'bold', fontSize: 15, color: '#1A1410' }}>{org.nom}</span>
                          {org.verified && (
                            <span style={{ background: 'rgba(45,158,107,0.12)', color: '#2D9E6B', padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 'bold', flexShrink: 0 }}>
                              ✅ Vérifié
                            </span>
                          )}
                        </div>
                        {org.slogan && (
                          <p style={{ color: '#8C5A40', fontSize: 12, fontStyle: 'italic', marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {org.slogan}
                          </p>
                        )}
                        {(org.ville || org.pays) && (
                          <p style={{ color: '#8C5A40', fontSize: 12 }}>
                            📍 {[org.ville, org.pays].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </a>

                    <div style={{ display: 'flex', gap: 16, paddingTop: 4, borderTop: '1px solid #F0E8DC' }}>
                      <span style={{ color: '#8C5A40', fontSize: 12 }}>
                        <strong style={{ color: '#1A1410' }}>{org.nbEvenements}</strong> événements
                      </span>
                      <span style={{ color: '#8C5A40', fontSize: 12 }}>
                        <strong style={{ color: '#1A1410' }}>{org.nbFollowers}</strong> membres
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {!estOwner && (
                        <button
                          onClick={() => toggleSuivi(org)}
                          disabled={loading}
                          style={{
                            background: suivi ? 'rgba(200,67,26,0.1)' : '#C8431A',
                            color: suivi ? '#C8431A' : 'white',
                            border: suivi ? '1px solid #C8431A' : 'none',
                            borderRadius: 999, padding: '7px 16px',
                            fontSize: 12, fontWeight: 'bold', cursor: loading ? 'default' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                          }}
                        >
                          {suivi ? 'Suivi ✓' : 'Suivre'}
                        </button>
                      )}
                      <button
                        onClick={() => partager(org)}
                        style={{
                          background: copie ? 'rgba(45,158,107,0.1)' : 'white',
                          color: copie ? '#2D9E6B' : '#8C5A40',
                          border: copie ? '1px solid #2D9E6B' : '1px solid #E8E0D0',
                          borderRadius: 999, padding: '7px 16px',
                          fontSize: 12, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {copie ? 'Lien copié ✓' : '🔗 Partager'}
                      </button>
                      <a
                        href={`/organisation/${org.slug}`}
                        style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '7px 16px', fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}
                      >
                        Voir →
                      </a>
                    </div>

                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
