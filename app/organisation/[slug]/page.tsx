'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

interface Organisation {
  id: string
  slug: string
  nom: string
  slogan: string | null
  description: string | null
  ville: string | null
  pays: string | null
  site_web: string | null
  email_contact: string | null
  telephone: string | null
  verified: boolean
  logo_url: string | null
  cover_url?: string | null
  owner_id: string
}

interface EvenementVitrine {
  id: string
  titre: string
  lieu: string
  date_debut: string | null
  date: string
  categorie: string
  prix: string
  image_url: string | null
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OR'
}

export default function PageOrganisation() {
  const params     = useParams()
  const slug       = params?.slug as string
  const copieTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [org, setOrg]                   = useState<Organisation | null>(null)
  const [evenements, setEvenements]     = useState<EvenementVitrine[]>([])
  const [nbFollowers, setNbFollowers]   = useState(0)
  const [loading, setLoading]           = useState(true)
  const [introuvable, setIntrouvable]   = useState(false)
  const [userId, setUserId]             = useState<string | null>(null)
  const [suivi, setSuivi]               = useState(false)
  const [suiviLoading, setSuiviLoading] = useState(false)
  const [lienCopie, setLienCopie]       = useState(false)
  const [canManage, setCanManage]       = useState(false)
  const [monRole, setMonRole]           = useState<string | null>(null)
  const [isDesktop, setIsDesktop]       = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverUrl, setCoverUrl]         = useState<string | null>(null)
  const [coverPosition, setCoverPosition] = useState<'top' | 'center' | 'bottom'>('center')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)

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
      if (copieTimer.current) clearTimeout(copieTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!slug) return
    charger()
  }, [slug])

  useEffect(() => {
    if (org?.cover_url) setCoverUrl(org.cover_url)
    if (org?.logo_url) setLogoUrl(org.logo_url)
  }, [org])

  useEffect(() => {
    if (!userId || !org) return
    supabase
      .from('organisation_membres')
      .select('user_id, role')
      .eq('org_id', org.id)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setSuivi(!!data)
        const r = (data as { role?: string } | null)?.role ?? ''
        setCanManage(['owner', 'admin'].includes(r))
        setMonRole(r || null)
      })
  }, [userId, org])

  const charger = async () => {
    setLoading(true)

    const { data: orgData } = await supabase
      .from('organisations')
      .select('id, slug, nom, slogan, description, ville, pays, site_web, email_contact, telephone, verified, logo_url, cover_url, owner_id')
      .eq('slug', slug)
      .maybeSingle()

    if (!orgData) {
      setIntrouvable(true)
      setLoading(false)
      return
    }

    setOrg(orgData as Organisation)

    const [{ data: evData }, { count: followCount }] = await Promise.all([
      supabase
        .from('evenements')
        .select('id, titre, lieu, date_debut, date, categorie, prix, image_url')
        .eq('organisation_id', orgData.id)
        .gte('date_debut', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('statut', 'approuve')
        .order('date_debut', { ascending: true })
        .limit(10),
      supabase
        .from('organisation_membres')
        .select('user_id', { count: 'exact', head: true })
        .eq('org_id', orgData.id)
        .neq('role', 'owner'),
    ])

    setEvenements((evData as EvenementVitrine[]) ?? [])
    setNbFollowers(followCount ?? 0)
    setLoading(false)
  }

  const toggleSuivi = async () => {
    if (!userId) {
      window.location.href = '/login?redirect=/organisation/' + slug
      return
    }
    if (!org) return
    setSuiviLoading(true)
    if (suivi) {
      await supabase.from('organisation_membres').delete()
        .eq('org_id', org.id).eq('user_id', userId)
      setSuivi(false)
      setNbFollowers(prev => Math.max(0, prev - 1))
    } else {
      await supabase.from('organisation_membres')
        .insert({ org_id: org.id, user_id: userId, role: 'lecteur' })
      setSuivi(true)
      setNbFollowers(prev => prev + 1)
    }
    setSuiviLoading(false)
  }

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !org) return
    setUploadingCover(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${org.id}/cover.${ext}`
      const { error: upErr } = await supabase.storage
        .from('covers-organisations')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage
        .from('covers-organisations')
        .getPublicUrl(path)
      await supabase
        .from('organisations')
        .update({ cover_url: publicUrl })
        .eq('id', org.id)
      setCoverUrl(publicUrl)
      setOrg(prev => (prev ? { ...prev, cover_url: publicUrl } : prev))
    } catch (err) {
      console.error('Erreur upload cover:', err)
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !org) return
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${org.id}/logo.${ext}`
      const { error: upErr } = await supabase.storage
        .from('logos-organisations')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage
        .from('logos-organisations')
        .getPublicUrl(path)
      await supabase
        .from('organisations')
        .update({ logo_url: publicUrl })
        .eq('id', org.id)
      setLogoUrl(publicUrl)
      setOrg(prev => (prev ? { ...prev, logo_url: publicUrl } : prev))
    } catch (err) {
      console.error('Erreur upload logo:', err)
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const partager = () => {
    const texte = `Suivez nos événements sur Lotbo 👉 https://app.lotbo.app/o/${slug}?utm_source=share&utm_medium=whatsapp&utm_campaign=org`
    navigator.clipboard.writeText(texte).then(() => {
      setLienCopie(true)
      if (copieTimer.current) clearTimeout(copieTimer.current)
      copieTimer.current = setTimeout(() => setLienCopie(false), 2000)
    }).catch(() => {})
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  if (introuvable) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <p style={{ fontSize: 40 }}>🏢</p>
      <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 18 }}>Organisation introuvable</p>
      <a href="/" style={{ color: '#C8431A', fontSize: 14, textDecoration: 'none' }}>← Retour à la carte</a>
    </main>
  )

  if (!org) return null

  const isOwner = userId === org.owner_id || monRole === 'owner'
  const peutGerer = isOwner || monRole === 'admin' || monRole === 'editeur'
  const avatarSize = isDesktop ? 112 : 84
  const coverHeight = isDesktop ? 220 : 140

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>

      {/* Cover + logo — bloc unique, style Facebook (le logo chevauche le cover) */}
      <div style={{ position: 'relative', marginBottom: avatarSize / 2 + 16 }}>

        <div style={{
          width: '100%',
          height: coverHeight,
          background: 'linear-gradient(135deg, #1A1410 0%, #2C1810 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'url(https://images.unsplash.com/photo-1511578314322-379afb476865?w=1400&q=80)',
            backgroundSize: 'cover', backgroundPosition: coverPosition,
            opacity: coverUrl ? 0.85 : 0.2,
          }} />

          {isOwner && (
            <label style={{
              position: 'absolute', top: 12, right: 12, zIndex: 3,
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(26,20,16,0.55)', backdropFilter: 'blur(4px)',
              border: '1.5px solid rgba(247,242,232,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploadingCover ? 'default' : 'pointer', fontSize: 15,
            }}>
              {uploadingCover ? '⏳' : '🖼️'}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUploadCover} disabled={uploadingCover} />
            </label>
          )}

          {isOwner && coverUrl && (
            <select
              value={coverPosition}
              onChange={e => setCoverPosition(e.target.value as 'top' | 'center' | 'bottom')}
              style={{
                position: 'absolute', top: 12, right: 54, zIndex: 3,
                background: 'rgba(26,20,16,0.55)', backdropFilter: 'blur(4px)',
                color: 'rgba(247,242,232,0.85)',
                border: '1.5px solid rgba(247,242,232,0.4)',
                borderRadius: 999, padding: '7px 10px',
                fontSize: 11, cursor: 'pointer',
              }}
            >
              <option value="top">Haut</option>
              <option value="center">Centre</option>
              <option value="bottom">Bas</option>
            </select>
          )}
        </div>

        {/* Avatar chevauchant le bas du cover — visible mobile + desktop */}
        <div style={{
          position: 'absolute', left: isDesktop ? 32 : 16, bottom: -avatarSize / 2,
          width: avatarSize, height: avatarSize, zIndex: 4,
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            border: '4px solid #F7F2E8', overflow: 'hidden',
            background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt={org.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: avatarSize * 0.32, fontWeight: 'bold', color: 'white', background: '#C8431A', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getInitiales(org.nom)}
              </span>
            )}
          </div>

          {isOwner && (
            <label style={{
              position: 'absolute', bottom: 0, right: 0, zIndex: 5,
              width: 30, height: 30, borderRadius: '50%',
              background: '#C8431A', border: '2.5px solid #F7F2E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploadingLogo ? 'default' : 'pointer', fontSize: 13,
            }}>
              {uploadingLogo ? '⏳' : '📷'}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUploadLogo} disabled={uploadingLogo} />
            </label>
          )}
        </div>
      </div>

      <div style={{ maxWidth: isDesktop ? 1100 : 640, margin: '0 auto', padding: isDesktop ? '0 32px 80px' : '0 16px 80px' }}>

        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Retour à la carte
        </a>

        {peutGerer && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 20,
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #1A1410 0%, #2C1A10 100%)',
            border: '1px solid rgba(232,98,10,0.3)',
            borderRadius: 14,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            {isOwner && (
              <a href={`/organisation/${slug}/parametres`} style={{
                background: 'rgba(212,168,32,0.15)',
                color: '#D4A820',
                border: '1px solid rgba(212,168,32,0.4)',
                borderRadius: 999, padding: '7px 16px',
                fontSize: 12, fontWeight: 'bold', textDecoration: 'none',
              }}>
                ⚙️ Paramètres
              </a>
            )}
            {peutGerer && (
              <a href="/ajouter" style={{
                background: '#C8431A',
                color: 'white',
                border: 'none',
                borderRadius: 999, padding: '7px 16px',
                fontSize: 12, fontWeight: 'bold', textDecoration: 'none',
              }}>
                ➕ Ajouter un événement
              </a>
            )}
          </div>
        )}

        <div style={{
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '340px 1fr' : undefined,
          gap: isDesktop ? 32 : 0,
          alignItems: 'start',
        }}>

          {/* Colonne gauche — Infos org (sticky) */}
          <div style={{ position: isDesktop ? 'sticky' : 'static', top: 24 }}>

            {/* Carte organisation */}
            <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 24, marginBottom: 24 }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', margin: 0 }}>{org.nom}</h1>
                {org.verified && (
                  <span style={{ background: 'rgba(45,158,107,0.12)', color: '#2D9E6B', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>
                    ✅ Organisation vérifiée
                  </span>
                )}
              </div>
              {org.slogan && (
                <p style={{ color: '#8C5A40', fontSize: 13, fontStyle: 'italic', marginBottom: 6 }}>{org.slogan}</p>
              )}
              {(org.ville || org.pays) && (
                <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 6 }}>
                  📍 {[org.ville, org.pays].filter(Boolean).join(', ')}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <span style={{ color: '#8C5A40', fontSize: 12 }}>
                  <strong style={{ color: '#1A1410' }}>{evenements.length}</strong> événements à venir
                </span>
                <span style={{ color: '#8C5A40', fontSize: 12 }}>
                  <strong style={{ color: '#1A1410' }}>{nbFollowers}</strong> membres
                </span>
              </div>

              {org.description && (
                <p style={{ color: '#4A3830', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{org.description}</p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {!peutGerer && (
                  <button
                    onClick={toggleSuivi}
                    disabled={suiviLoading}
                    style={{
                      background: suivi ? 'rgba(200,67,26,0.1)' : '#C8431A',
                      color: suivi ? '#C8431A' : 'white',
                      border: suivi ? '1px solid #C8431A' : 'none',
                      borderRadius: 999, padding: '9px 20px',
                      fontSize: 13, fontWeight: 'bold', cursor: suiviLoading ? 'default' : 'pointer',
                    }}
                  >
                    {suivi ? 'Suivi ✓' : 'Suivre'}
                  </button>
                )}
                {org.email_contact && (
                  <a href={`mailto:${org.email_contact}`} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                    ✉️ Email
                  </a>
                )}
                {org.telephone && (
                  <a href={`tel:${org.telephone}`} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                    📞 Appeler
                  </a>
                )}
                <button
                  onClick={partager}
                  style={{
                    background: lienCopie ? 'rgba(45,158,107,0.1)' : 'white',
                    color: lienCopie ? '#2D9E6B' : '#8C5A40',
                    border: lienCopie ? '1px solid #2D9E6B' : '1px solid #E8E0D0',
                    borderRadius: 999, padding: '9px 20px',
                    fontSize: 13, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {lienCopie ? 'Lien copié ✓' : '🔗 Partager'}
                </button>
                {org.site_web && (
                  <a
                    href={org.site_web.startsWith('http') ? org.site_web : `https://${org.site_web}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, textDecoration: 'none' }}
                  >
                    🌐 Site web
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Colonne droite — Événements */}
          <div>

            <h2 style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Événements à venir
            </h2>

            {evenements.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ color: '#8C5A40', fontSize: 14 }}>Aucun événement récent</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {evenements.map(ev => {
                  const estPasse = (ev.date_debut ?? ev.date) < new Date().toISOString().split('T')[0]
                  return (
                    <a key={ev.id} href={`/evenement/${ev.id}`} style={{ display: 'flex', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, textDecoration: 'none', color: '#1A1410', alignItems: 'flex-start', opacity: estPasse ? 0.7 : 1 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F7F2E8', border: '1px solid #E8E0D0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {ev.image_url ? <img src={ev.image_url} alt={ev.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📅'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                        <p style={{ color: '#8C5A40', fontSize: 12 }}>📅 {ev.date_debut ?? ev.date}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                        <span style={{ background: '#C8431A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>
                          {ev.categorie}
                        </span>
                        {estPasse && (
                          <span style={{ background: 'rgba(140,90,64,0.15)', color: '#8C5A40', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 'bold' }}>
                            Passé
                          </span>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  )
}