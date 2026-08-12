'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getSessionId } from '../../../lib/getSessionId'
import ModalSignalerOrganisation from '../../../components/ModalSignalerOrganisation'
import ModalReclamerOrganisation from '../../../components/ModalReclamerOrganisation'
import { useLangue } from '../../../lib/useLangue'
import { getTraductions } from '../../../lib/i18n'
import { celebrerPremiereFois } from '../../../lib/celebrerAction'

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
  email_contact_verifie: boolean
  telephone: string | null
  verified: boolean
  logo_url: string | null
  cover_url?: string | null
  owner_id: string
  suspendue: boolean
}

interface EvenementVitrine {
  id: string
  titre: string
  lieu: string
  date_debut: string | null
  date_fin: string | null
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
  const { langue } = useLangue()
  const t = getTraductions(langue)

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
  const [nbEvenementsTotal, setNbEvenementsTotal] = useState(0)
  const [categoriesOrg, setCategoriesOrg] = useState<string[]>([])
  const [evenementsPasses, setEvenementsPasses]   = useState<EvenementVitrine[]>([])
  const [passesOuvert, setPassesOuvert]           = useState(false)
  const [passesLoading, setPassesLoading]         = useState(false)
  const [passesCharges, setPassesCharges]         = useState(false)
  const [coverPosition, setCoverPosition] = useState<'top' | 'center' | 'bottom'>('center')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [modalSignalerOuvert, setModalSignalerOuvert] = useState(false)
  const [disclaimerOuvert, setDisclaimerOuvert] = useState(false)
  const [modalReclamerOuvert, setModalReclamerOuvert] = useState(false)
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
      .select('id, slug, nom, slogan, description, ville, pays, site_web, email_contact, email_contact_verifie, telephone, verified, logo_url, cover_url, owner_id, suspendue')
      .eq('slug', slug)
      .maybeSingle()

    if (!orgData) {
      setIntrouvable(true)
      setLoading(false)
      return
    }

    setOrg(orgData as Organisation)

    const aujourdhui = new Date().toISOString().split('T')[0]
    const orgSuspendue = !!(orgData as Organisation).suspendue

    const [{ data: evData }, { count: followCount }, { count: totalCount }, { data: categoriesData }] = await Promise.all([
      // Événements futurs masqués si l'organisation est suspendue (litige en cours) — les passés restent visibles ailleurs
      orgSuspendue
        ? Promise.resolve({ data: [] as EvenementVitrine[] })
        : supabase
            .from('evenements')
            .select('id, titre, lieu, date_debut, date_fin, date, categorie, prix, image_url')
            .eq('organisation_id', orgData.id)
            .eq('statut', 'approuve')
            // en cours (date_fin future) OU pas encore commencé (date_debut future)
            .or(`date_fin.gte.${aujourdhui},and(date_fin.is.null,date_debut.gte.${aujourdhui})`)
            .order('date_debut', { ascending: true })
            .limit(20),
      supabase
        .from('organisation_membres')
        .select('user_id', { count: 'exact', head: true })
        .eq('org_id', orgData.id)
        .neq('role', 'owner'),
      supabase
        .from('evenements')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', orgData.id)
        .eq('statut', 'approuve'),
      supabase
        .from('organisation_categories_liees')
        .select('organisation_categories(libelle_fr)')
        .eq('organisation_id', orgData.id),
    ])

    setEvenements((evData as EvenementVitrine[]) ?? [])
    setNbFollowers(followCount ?? 0)
    setNbEvenementsTotal(totalCount ?? 0)
    setCategoriesOrg(
      ((categoriesData ?? []) as unknown as { organisation_categories: { libelle_fr: string } }[])
        .map(c => c.organisation_categories?.libelle_fr)
        .filter(Boolean)
    )
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
      supabase.from('organisation_membres').select('org_id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'lecteur')
        .then(({ count }) => { if (count === 1) celebrerPremiereFois('premiere_organisation_suivie') })
    }
    setSuiviLoading(false)
  }

  const handleTogglePasses = async () => {
    const nouvelEtat = !passesOuvert
    setPassesOuvert(nouvelEtat)
    if (nouvelEtat && !passesCharges && org) {
      setPassesLoading(true)
      const aujourdhui = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('evenements')
        .select('id, titre, lieu, date_debut, date_fin, date, categorie, prix, image_url')
        .eq('organisation_id', org.id)
        .eq('statut', 'approuve')
        .lt('date_debut', aujourdhui)
        .not('id', 'in', `(${evenements.map(e => e.id).join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .order('date_debut', { ascending: false })
        .limit(20)
      setEvenementsPasses((data as EvenementVitrine[]) ?? [])
      setPassesCharges(true)
      setPassesLoading(false)
    }
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

  const trackerPartage = async (canal: string) => {
    if (!org) return
    const { data: { session } } = await supabase.auth.getSession()
    fetch(`/api/organisation/${org.id}/partage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ session_id: getSessionId(), canal }),
    }).catch(() => {})
  }

  const urlOrgPartage = org ? `https://app.lotbo.app/o/${slug}?utm_source=share&utm_medium=social&utm_campaign=org` : ''
  const urlWhatsappOrg = org ? `https://wa.me/?text=${encodeURIComponent(`Suivez ${org.nom} sur Lotbo 👉 ${urlOrgPartage}`)}` : ''
  const urlFacebookOrg = org ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlOrgPartage)}` : ''
  const urlXOrg = org ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Suivez ${org.nom} sur Lotbo`)}&url=${encodeURIComponent(urlOrgPartage)}` : ''

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
      {org.suspendue && (
        <div style={{ background: '#C8431A', color: 'white', padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 'bold' }}>
          ⚠️ {t.organisation.litige_en_cours}
        </div>
      )}

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
              <a href={`/ajouter?organisation_id=${org.id}&organisateur=${encodeURIComponent(org.nom)}`} style={{
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
                  <>
                    <img src="/badge-verifie.svg" width="20" height="20" alt="Organisation vérifiée" style={{ flexShrink: 0 }} />
                    <button
                      onClick={() => setDisclaimerOuvert(!disclaimerOuvert)}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8E0D0', border: 'none', color: '#8C5A40', fontSize: 11, fontWeight: 'bold', fontStyle: 'italic', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
                    >
                      i
                    </button>
                  </>
                )}
              </div>
              {org.verified && disclaimerOuvert && (
                <p style={{ color: '#8C5A40', fontSize: 11, lineHeight: 1.5, marginBottom: 8, background: 'rgba(140,90,64,0.06)', borderRadius: 8, padding: '8px 12px' }}>
                  {t.organisation.verifie_disclaimer}
                </p>
              )}
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
                  <strong style={{ color: '#1A1410' }}>{nbEvenementsTotal}</strong> événements · <strong style={{ color: '#1A1410' }}>{evenements.length}</strong> à venir
                </span>
                <span style={{ color: '#8C5A40', fontSize: 12 }}>
                  <strong style={{ color: '#1A1410' }}>{nbFollowers}</strong> membres
                </span>
              </div>

              {org.description && (
                <p style={{ color: '#4A3830', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{org.description}</p>
              )}
              {categoriesOrg.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {categoriesOrg.map(cat => (
                    <span key={cat} style={{ background: 'rgba(200,67,26,0.08)', color: '#C8431A', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 'bold' }}>
                      {cat}
                    </span>
                  ))}
                </div>
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
                {org.email_contact && org.email_contact_verifie && (
                  <a href={`mailto:${org.email_contact}`} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                    ✉️ Email
                  </a>
                )}
                {org.telephone && (
                  <a href={`tel:${org.telephone}`} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                    📞 Appeler
                  </a>
                )}
                {suivi && (
                  <>
                    <a href={urlWhatsappOrg} target="_blank" rel="noopener noreferrer" onClick={() => trackerPartage('whatsapp')} title="WhatsApp" style={{ width: 38, height: 38, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <a href={urlFacebookOrg} target="_blank" rel="noopener noreferrer" onClick={() => trackerPartage('facebook')} title="Facebook" style={{ width: 38, height: 38, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href={urlXOrg} target="_blank" rel="noopener noreferrer" onClick={() => trackerPartage('x')} title="X" style={{ width: 38, height: 38, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>𝕏</span>
                    </a>
                  </>
                )}
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
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  onClick={() => setModalSignalerOuvert(true)}
                  style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  🚩 Signaler cette organisation
                </button>
                <button
                  onClick={() => setModalReclamerOuvert(true)}
                  style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  🔑 {t.organisation.reclamer_court}
                </button>
              </div>
            </div>
          </div>
          {modalSignalerOuvert && org && (
            <ModalSignalerOrganisation organisationId={org.id} onClose={() => setModalSignalerOuvert(false)} />
          )}
          {modalReclamerOuvert && org && (
            <ModalReclamerOrganisation organisationId={org.id} onClose={() => setModalReclamerOuvert(false)} />
          )}

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
                  return (
                    <a key={ev.id} href={`/evenement/${ev.id}`} style={{ display: 'flex', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, textDecoration: 'none', color: '#1A1410', alignItems: 'flex-start' }}>
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
                      </div>
                    </a>
                  )
                })}
              </div>
            )}

            {/* Section événements passés — repliée par défaut */}
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={handleTogglePasses}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ transform: passesOuvert ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
                Événements passés
              </button>
              {passesOuvert && (
                <div style={{ marginTop: 12 }}>
                  {passesLoading ? (
                    <p style={{ color: '#8C5A40', fontSize: 13 }}>Chargement...</p>
                  ) : evenementsPasses.length === 0 ? (
                    <p style={{ color: '#8C5A40', fontSize: 13 }}>Aucun événement passé</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {evenementsPasses.map(ev => (
                        <a key={ev.id} href={`/evenement/${ev.id}`} style={{ display: 'flex', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, textDecoration: 'none', color: '#1A1410', alignItems: 'flex-start', opacity: 0.7 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F7F2E8', border: '1px solid #E8E0D0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                            {ev.image_url ? <img src={ev.image_url} alt={ev.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📅'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                            <p style={{ color: '#8C5A40', fontSize: 12 }}>📅 {ev.date_debut ?? ev.date}</p>
                          </div>
                          <span style={{ background: 'rgba(140,90,64,0.15)', color: '#8C5A40', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 'bold', flexShrink: 0 }}>
                            Passé
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}