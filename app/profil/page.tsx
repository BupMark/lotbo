'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { getEventImage } from '../../lib/fallbackImages'
import { useRouter, useSearchParams } from 'next/navigation'
import CarteBadge from '../../components/CarteBadge'
import { calculerNiveau } from '../../lib/points'
import { identifyUser } from '../../lib/amplitude'
import { type Langue, getTraductions } from '../../lib/i18n'
import { useLangue } from '../../lib/useLangue'

// ── Système de badges ─────────────────────────────────────────────────────────
const BADGES_CONTRIBUTEUR = [
  { id: 'decouvreur',       emoji: '🌱', seuil: 1   },
  { id: 'actif',            emoji: '🔥', seuil: 5   },
  { id: 'contributeur',     emoji: '⭐', seuil: 10  },
  { id: 'top_contributeur', emoji: '🏅', seuil: 25  },
  { id: 'elite',            emoji: '🥇', seuil: 50  },
  { id: 'legende',          emoji: '👑', seuil: 100 },
]

const BADGES_ORGANISATEUR = [
  { id: 'organisateur', emoji: '🎪', seuil: 1  },
  { id: 'regulier',     emoji: '📅', seuil: 3  },
  { id: 'premium',      emoji: '💎', seuil: 10 },
  { id: 'vedette',      emoji: '🌟', seuil: 25 },
  { id: 'champion',     emoji: '🏆', seuil: 50 },
]

const PALIERS_ANCIENNETE = [
  { id: 'mois1',  mois: 1,  badge: '🌱' },
  { id: 'mois3',  mois: 3,  badge: '🔥' },
  { id: 'mois6',  mois: 6,  badge: '⭐' },
  { id: 'mois12', mois: 12, badge: '🏅' },
  { id: 'mois24', mois: 24, badge: '🥇' },
  { id: 'mois60', mois: 60, badge: '👑' },
]

function getBadgeActuel(nb: number, badges: typeof BADGES_CONTRIBUTEUR) {
  const obtenus = badges.filter(b => nb >= b.seuil)
  return obtenus[obtenus.length - 1] || null
}

function getProchainBadge(nb: number, badges: typeof BADGES_CONTRIBUTEUR) {
  return badges.find(b => nb < b.seuil) || null
}

function ProfilInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as 'evenements' | 'badges' | 'favoris' | 'parametres' | null
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editNom, setEditNom] = useState(false)
  const [nomInput, setNomInput] = useState('')
  const [savingNom, setSavingNom] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [badgeSelectionne, setBadgeSelectionne] = useState<{ emoji: string; label: string; desc: string; id: string } | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [onglet, setOnglet]         = useState<'evenements' | 'badges' | 'favoris' | 'parametres'>(tabParam === 'favoris' || tabParam === 'badges' || tabParam === 'parametres' ? tabParam : 'evenements')
  const [favorisEvs, setFavorisEvs] = useState<any[]>([])
  const [rangGlobal, setRangGlobal] = useState<number | null>(null)
  const [pointsReel, setPointsReel] = useState<number>(0)
  const [nbFilleuls, setNbFilleuls] = useState<number>(0)
  const [pointsReferral, setPointsReferral] = useState<number>(0)
  const [lienCopie, setLienCopie] = useState(false)
  const [dateNaissance, setDateNaissance] = useState<string>('')
  const [anniversairePublic, setAnniversairePublic] = useState<boolean>(false)
  const [savingBirthday, setSavingBirthday] = useState(false)
  const [birthdaySaved, setBirthdaySaved]   = useState(false)
  const [genre, setGenre]                           = useState<string>('non_precise')
  const [anniversaireVisibilite, setAnniversaireVisibilite] = useState<string>('mois')
  const [savingParams, setSavingParams]             = useState(false)
  const [paramsSaved, setParamsSaved]               = useState(false)
  const [consentNewsletter, setConsentNewsletter] = useState(false)
  const [consentAlertes, setConsentAlertes]       = useState(false)
  const [consentPush, setConsentPush]             = useState(false)
  const [notifNouveauxEvenements, setNotifNouveauxEvenements] = useState(true)
  const [notifCommentaires, setNotifCommentaires]             = useState(true)
  const [notifCorrections, setNotifCorrections]               = useState(true)
  const [notifOrganisation, setNotifOrganisation]             = useState(true)
  const [notifScanPublie, setNotifScanPublie]                 = useState(true)
  const [notifEvenementModifie, setNotifEvenementModifie]     = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [suppressionDemandeeAt, setSuppressionDemandeeAt] = useState<string | null>(null)
  const [annulantSuppression, setAnnulantSuppression] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [estEnqueteurActif, setEstEnqueteurActif] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const { langue, setLangue } = useLangue()
  const t = getTraductions(langue)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setUser(data.session.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('role, charte_acceptee, points_total, points_utilisateur, points_organisateur, niveau, nom, photo_url, date_naissance, anniversaire_public, genre, anniversaire_visibilite, langue_preference, referral_code, parrain_id, consent_analytics, consent_newsletter, consent_alertes, consent_push, suppression_demandee_at, notif_nouveaux_evenements, notif_commentaires, notif_corrections, notif_organisation, notif_scan_publie, notif_evenement_modifie')
        .eq('id', data.session.user.id)
        .single()
      // roles_actifs optionnel — requiert migration DB
      const { data: raRow, error: raErr } = await supabase
        .from('profiles').select('roles_actifs').eq('id', data.session.user.id).single()

      const { data: enqRow } = await supabase
        .from('enqueteurs')
        .select('statut')
        .eq('user_id', data.session.user.id)
        .eq('statut', 'actif')
        .maybeSingle()
      setEstEnqueteurActif(!!enqRow)

      // Points depuis DB uniquement — le recalcul depuis transactions appartient aux routes API (service role)
      const pointsReel = prof?.points_total || 0
      const niveauReel = calculerNiveau(pointsReel)
      setPointsReel(pointsReel)

      // Rang global depuis /api/classement (source de vérité transactions_points)
      const classementRes = await fetch('/api/classement')
      const classementJson = classementRes.ok ? await classementRes.json() : { membres: [] }
      const membres = classementJson.membres || []
      const posIdx = membres.findIndex((m: { id: string }) => m.id === data.session.user.id)
      setRangGlobal(posIdx !== -1 ? posIdx + 1 : membres.length + 1)

      setProfile({
        ...prof,
        roles_actifs:  raErr ? null : (raRow?.roles_actifs ?? null),
        points_total:  pointsReel,
        niveau:        niveauReel,
      })
      identifyUser(data.session.user.id, prof?.consent_analytics ?? true, {
        role:         prof?.role,
        niveau:       niveauReel,
        points_total: pointsReel,
      })
      if (prof?.nom) setNomInput(prof.nom)
      if (prof?.photo_url) setPhotoUrl(prof.photo_url)
      if (prof?.date_naissance) setDateNaissance(prof.date_naissance)
      setAnniversairePublic(prof?.anniversaire_public ?? false)
      if (prof?.genre) setGenre(prof.genre)
      if (prof?.anniversaire_visibilite) setAnniversaireVisibilite(prof.anniversaire_visibilite)
      setConsentNewsletter(prof?.consent_newsletter ?? false)
      setSuppressionDemandeeAt(prof?.suppression_demandee_at ?? null)
      setConsentAlertes(prof?.consent_alertes ?? false)
      setConsentPush(prof?.consent_push ?? false)
      setNotifNouveauxEvenements(prof?.notif_nouveaux_evenements ?? true)
      setNotifCommentaires(prof?.notif_commentaires ?? true)
      setNotifCorrections(prof?.notif_corrections ?? true)
      setNotifOrganisation(prof?.notif_organisation ?? true)
      setNotifScanPublie(prof?.notif_scan_publie ?? true)
      setNotifEvenementModifie(prof?.notif_evenement_modifie ?? true)

      const { data: evs } = await supabase
        .from('evenements')
        .select('*')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setEvenements(evs || [])

      const { data: favs } = await supabase
        .from('favoris')
        .select('evenements(*)')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
      setFavorisEvs(favs?.map((f: any) => f.evenements).filter(Boolean) || [])

      const { count: filleulsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('parrain_id', data.session.user.id)
      setNbFilleuls(filleulsCount || 0)

      const { data: txsRef } = await supabase
        .from('transactions_points')
        .select('points')
        .eq('user_id', data.session.user.id)
        .eq('type', 'referral')
      setPointsReferral((txsRef || []).reduce((s: number, t: { points: number }) => s + (t.points || 0), 0))

      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveNom = async () => {
    if (!nomInput.trim() || !user) return
    setSavingNom(true)
    await supabase.from('profiles').upsert({ id: user.id, nom: nomInput.trim(), updated_at: new Date().toISOString() })
    setProfile((p: any) => ({ ...p, nom: nomInput.trim() }))
    setEditNom(false)
    setSavingNom(false)
  }

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { alert('Photo max 2MB'); return }
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('evenements').upload(path, file, { upsert: true })
    if (!error && uploadData) {
      const { data: urlData } = supabase.storage.from('evenements').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.from('profiles').upsert({ id: user.id, photo_url: url, updated_at: new Date().toISOString() })
      setPhotoUrl(url)
    }
    setUploadingPhoto(false)
  }

  const handleSaveBirthday = async () => {
    if (!user) return
    setSavingBirthday(true)
    await supabase.from('profiles').update({
      date_naissance: dateNaissance || null,
      anniversaire_public: anniversairePublic,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSavingBirthday(false)
    setBirthdaySaved(true)
    setTimeout(() => setBirthdaySaved(false), 3000)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER' || !user) return
    setDeletingAccount(true)
    setDeleteError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setDeleteError(t.profil.modalSuppression.erreurSession)
        setDeletingAccount(false)
        return
      }
      const res = await fetch('/api/compte/supprimer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error === 'SEUL_ADMIN_ORGANISATION') {
          setDeleteError(t.profil.modalSuppression.erreurSeulAdmin)
        } else {
          setDeleteError(t.profil.modalSuppression.erreurGenerale)
        }
        setDeletingAccount(false)
        return
      }
      if (json.mode === 'soft_delete') {
        setSuppressionDemandeeAt(new Date().toISOString())
        setDeleteConfirmText('')
      } else {
        await supabase.auth.signOut()
        router.push('/')
      }
    } catch (err) {
      setDeleteError(t.profil.modalSuppression.erreurGenerale)
      setDeletingAccount(false)
    }
  }

  const statutLabel = (statut: string) => {
    switch (statut) {
      case 'approuve': return { label: t.profil.evenements.statutApprouve, bg: 'rgba(200,67,26,0.15)', color: '#C8431A' }
      case 'hors_ligne': return { label: t.profil.evenements.statutHorsLigne, bg: 'rgba(100,100,100,0.15)', color: '#888' }
      case 'rejete': return { label: t.profil.evenements.statutRejete, bg: 'rgba(180,40,40,0.2)', color: '#e57373' }
      case 'en_attente': return { label: t.profil.evenements.statutEnAttente, bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
      default: return { label: statut, bg: 'rgba(26,20,16,0.06)', color: '#8C5A40' }
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8' }} className="flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>{t.profil.header.chargement}</p>
    </main>
  )

  const rolesActifs: string[] = profile?.roles_actifs?.length
    ? profile.roles_actifs
    : profile?.role ? [profile.role] : []

  const isAdmin = rolesActifs.includes('admin')
  const nbApprouves = evenements.filter(ev => ev.statut === 'approuve').length
  const nbEnAttente = evenements.filter(ev => ev.statut === 'en_attente').length
  const nbRejetes = evenements.filter(ev => ev.statut === 'rejete').length
  const nbTotal = evenements.length

  // Pays couverts
  const paysCouverts = new Set(evenements.filter(e => e.pays).map(e => e.pays)).size

  // Badges — calculés séparément par rôle de soumission
  const nbContrib = evenements.filter(e => e.soumis_en_tant_que === 'contributeur').length
  const nbOrga    = evenements.filter(e => e.soumis_en_tant_que === 'organisateur').length
  const badgeContribActuel = getBadgeActuel(nbContrib, BADGES_CONTRIBUTEUR)
  const prochainBadgeContrib = getProchainBadge(nbContrib, BADGES_CONTRIBUTEUR)
  const badgeOrgaActuel = getBadgeActuel(nbApprouves, BADGES_ORGANISATEUR)
  const prochainBadgeOrga = getProchainBadge(nbApprouves, BADGES_ORGANISATEUR)
  const hasPioneerScan = evenements.some((e: any) => e.source === 'scan_publie')
  const hasWikiBadge   = evenements.some((e: any) => e.source === 'wikimedia' && e.statut === 'approuve')

  const moisAnciennete = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0

  const nomAffiche = profile?.nom || user?.email?.split('@')[0] || 'Utilisateur'
  const initiales = nomAffiche.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: isDesktop ? 1100 : 680, margin: '0 auto', padding: isDesktop ? '32px 32px 64px' : '32px 16px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>{t.profil.header.retourCarte}</a>
            {isAdmin && <a href="/admin" style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>{t.profil.header.admin}</a>}
            <button onClick={handleLogout} style={{ background: 'rgba(180,40,40,0.15)', color: '#e57373', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>{t.profil.header.deconnexion}</button>
          </div>
        </div>

        {/* ── Layout 2 colonnes desktop ── */}
        <div style={{
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '340px minmax(0, 1fr)' : undefined,
          gap: isDesktop ? 32 : 0,
          alignItems: 'start',
        }}>

          {/* ── COLONNE GAUCHE — Profil + Stats ── */}
          <div style={{ position: isDesktop ? 'sticky' : 'static', top: isDesktop ? 24 : 'auto' }}>

            {/* Carte profil */}
            <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="photo profil" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(200,67,26,0.3)' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, background: '#C8431A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: '#F7F2E8', border: '3px solid rgba(200,67,26,0.3)' }}>
                      {initiales}
                    </div>
                  )}
                  <label style={{ position: 'absolute', bottom: -2, right: -2, background: '#1A1410', border: '1px solid #2a2a2a', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>
                    {uploadingPhoto ? '⏳' : '📷'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPhoto} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Nom modifiable */}
                  {editNom ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <input value={nomInput} onChange={e => setNomInput(e.target.value)} maxLength={40} placeholder="Ton prénom ou pseudo" autoFocus
                        style={{ background: 'white', border: '1px solid #C8431A', borderRadius: 8, padding: '6px 12px', color: '#1A1410', fontSize: 15, outline: 'none', flex: 1 }}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveNom() }} />
                      <button onClick={handleSaveNom} disabled={savingNom} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>{savingNom ? '...' : 'Enregistrer'}</button>
                      <button onClick={() => { setEditNom(false); setNomInput(profile?.nom || '') }} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: 'bold', fontSize: 17, color: '#1A1410' }}>{nomAffiche}</p>
                      <button onClick={() => setEditNom(true)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, textDecoration: 'underline' }}>✏️ Modifier</button>
                    </div>
                  )}
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 4 }}>{user?.email?.replace(/(.{2}).*(@.*)/, '$1***$2')}</p>
                  <p style={{ color: '#8C5A40', fontSize: 13 }}>
                    {profile?.role === 'admin' ? t.profil.roles.administrateur
                      : profile?.role === 'ambassadeur' ? t.profil.roles.ambassadeur
                      : profile?.role === 'organisateur' ? t.profil.roles.organisateur
                      : profile?.role === 'contributeur_terrain' ? t.profil.roles.contributeurTerrain
                      : profile?.role === 'contributeur' ? t.profil.roles.engage
                      : profile?.role === 'membre' ? t.profil.roles.membre
                      : t.profil.roles.membreLotbo}
                  </p>

                  {/* Badges rôles */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {isAdmin && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.admin}</span>}
                    {(rolesActifs.includes('contributeur_terrain')) && <span style={{ background: 'rgba(200,160,32,0.15)', color: '#C8A020', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.contributeurTerrain}</span>}
                    {(rolesActifs.includes('contributeur') && !rolesActifs.includes('contributeur_terrain')) && profile?.charte_acceptee && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.engage}</span>}
                    {rolesActifs.includes('ambassadeur') && <span style={{ background: 'rgba(45,158,107,0.15)', color: '#2D9E6B', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.ambassadeur}</span>}
                    {(rolesActifs.includes('organisateur') || nbOrga > 0) && <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.organisateur}</span>}
                    {badgeContribActuel && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{badgeContribActuel.emoji} {t.profil.badges.contributeur[badgeContribActuel.id as keyof typeof t.profil.badges.contributeur]?.label ?? badgeContribActuel.id}</span>}
                    {estEnqueteurActif && <span style={{ background: 'rgba(139,69,19,0.15)', color: '#8B4513', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{t.profil.badgesRoles.enqueteurTerrain}</span>}
                  </div>
                </div>
              </div>

              {/* Bouton Créer une organisation — visible si organisateur ou nbOrga > 0 */}
              {(rolesActifs.includes('organisateur') || nbOrga > 0) && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href="/organisation/creer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: 'rgba(200,67,26,0.08)', color: '#C8431A',
                      border: '1px solid rgba(200,67,26,0.25)', borderRadius: 999,
                      padding: '8px 16px', fontSize: 13, fontWeight: 'bold',
                      textDecoration: 'none',
                    }}
                  >
                    {t.profil.organisation.creer}
                  </a>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { val: nbTotal, label: t.profil.stats.total, color: '#1A1410', bg: 'rgba(26,20,16,0.04)' },
                  { val: nbApprouves, label: t.profil.stats.approuves, color: '#C8431A', bg: 'rgba(200,67,26,0.08)' },
                  { val: nbEnAttente, label: t.profil.stats.enAttente, color: '#D4A820', bg: 'rgba(212,168,32,0.08)' },
                  { val: paysCouverts, label: t.profil.stats.pays, color: '#2D9E6B', bg: 'rgba(45,158,107,0.08)' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.val}</p>
                    <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 🎂 Anniversaire */}
            <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>{t.anniversaire.titre}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ color: '#8C5A40', fontSize: 12, display: 'block', marginBottom: 4 }}>{t.anniversaire.date_naissance}</label>
                  <input
                    type="date"
                    value={dateNaissance}
                    onChange={e => setDateNaissance(e.target.value)}
                    style={{ width: '100%', background: 'white', border: '1px solid #E8E0D0', borderRadius: 8, padding: '8px 12px', color: '#1A1410', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={anniversairePublic}
                    onChange={e => setAnniversairePublic(e.target.checked)}
                    style={{ accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ color: '#8C5A40', fontSize: 12 }}>{t.anniversaire.anniversaire_public}</span>
                </label>
                <button
                  onClick={handleSaveBirthday}
                  disabled={savingBirthday}
                  style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', opacity: savingBirthday ? 0.7 : 1 }}
                >
                  {savingBirthday ? t.anniversaire.enregistrement : t.anniversaire.enregistrer}
                </button>
                {birthdaySaved && (
                  <p style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold', marginTop: 6 }}>
                    {t.anniversaire.dateEnregistree}
                  </p>
                )}
              </div>
            </div>

            {/* 🔗 Parrainage */}
            {profile?.referral_code && (
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <h3 style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>{t.profil.parrainage.titre}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ color: '#8C5A40', fontSize: 12, display: 'block', marginBottom: 4 }}>{t.profil.parrainage.tonLien}</label>
                    <div style={{ background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1A1410', wordBreak: 'break-all' }}>
                      {`https://app.lotbo.app/login?mode=inscription&ref=${profile.referral_code}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(`https://app.lotbo.app/login?mode=inscription&ref=${profile.referral_code}`)
                        setLienCopie(true)
                        setTimeout(() => setLienCopie(false), 2000)
                      }}
                      style={{ flex: 1, background: lienCopie ? 'rgba(45,158,107,0.15)' : 'rgba(200,67,26,0.08)', color: lienCopie ? '#2D9E6B' : '#C8431A', border: `1px solid ${lienCopie ? 'rgba(45,158,107,0.3)' : 'rgba(200,67,26,0.25)'}`, borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {lienCopie ? t.profil.parrainage.copie : t.profil.parrainage.copierLien}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(t.profil.parrainage.messageWhatsApp + ' https://app.lotbo.app/login?mode=inscription&ref=' + profile.referral_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      {t.profil.parrainage.whatsapp}
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, background: 'rgba(200,67,26,0.06)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 'bold', color: '#C8431A' }}>{nbFilleuls}</p>
                      <p style={{ fontSize: 11, color: '#8C5A40', marginTop: 2 }}>{nbFilleuls > 1 ? t.profil.parrainage.personnesInscrites : t.profil.parrainage.personneInscrite} {nbFilleuls > 1 ? t.profil.parrainage.inscrites : t.profil.parrainage.inscrite}</p>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(212,168,32,0.06)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 'bold', color: '#D4A820' }}>{pointsReferral}</p>
                      <p style={{ fontSize: 11, color: '#8C5A40', marginTop: 2 }}>{t.profil.parrainage.ptsParrainage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── COLONNE DROITE — Onglets + Contenu ── */}
          <div style={{ minWidth: 0 }}>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { id: 'evenements', label: t.profil.onglets.evenements },
                { id: 'badges', label: t.profil.onglets.badges },
                { id: 'favoris', label: t.profil.onglets.favoris },
                { id: 'parametres', label: t.profil.onglets.parametres },
              ].map(o => (
                <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{
                  flex: 'none', minWidth: 80, whiteSpace: 'nowrap', padding: '10px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
                  background: onglet === o.id ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                  border: onglet === o.id ? '1px solid #C8431A' : '1px solid #2a2a2a',
                  color: onglet === o.id ? '#C8431A' : '#8C5A40',
                }}>{o.label}</button>
              ))}
            </div>

            {/* ── Onglet Événements ── */}
            {onglet === 'evenements' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410' }}>{t.profil.evenements.titre}</h2>
                  <a href="/ajouter" style={{ background: '#C8431A', color: '#F7F2E8', padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>{t.profil.evenements.ajouter}</a>
                </div>

                {evenements.length === 0 ? (
                  <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                    <p style={{ color: '#8C5A40', marginBottom: 20, fontSize: 14 }}>{t.profil.evenements.videTitre}</p>
                    <a href="/ajouter" style={{ background: '#C8431A', color: '#F7F2E8', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', textDecoration: 'none' }}>
                      {t.profil.evenements.videBouton}
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {evenements.map(ev => {
                      const s = statutLabel(ev.statut)
                      return (
                        <a key={ev.id} href={'/evenement/' + ev.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}>
                          <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = getEventImage(null, ev.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>📅 {ev.date}</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{ev.categorie}</span>
                              <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{s.label}</span>
                              {ev.soumis_en_tant_que === 'contributeur' && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{t.profil.evenements.repere}</span>}
                            </div>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Onglet Badges & Stats ── */}
            {onglet === 'badges' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Stats détaillées */}
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>📊 Statistiques</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { emoji: '📅', label: 'Événements créés', val: nbTotal },
                      { emoji: '✅', label: 'Approuvés', val: nbApprouves },
                      { emoji: '⭐', label: 'Contributions repérées', val: nbContrib },
                      { emoji: '🌍', label: 'Pays couverts', val: paysCouverts },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 22 }}>{s.emoji}</span>
                        <div>
                          <p style={{ color: '#1A1410', fontSize: 20, fontWeight: 'bold' }}>{s.val}</p>
                          <p style={{ color: '#8C5A40', fontSize: 11 }}>{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges contributeur */}
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{t.profil.badges.titreEngage}</h3>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>{nbContrib} contribution{nbContrib > 1 ? 's' : ''} repérée{nbContrib > 1 ? 's' : ''}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {BADGES_CONTRIBUTEUR.map(b => {
                      const obtenu = nbContrib >= b.seuil
                      return (
                        <div key={b.id} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '12px 16px', borderRadius: 12, minWidth: 80,
                          background: obtenu ? 'rgba(212,168,32,0.12)' : 'rgba(26,20,16,0.03)',
                          border: obtenu ? '1px solid rgba(212,168,32,0.4)' : '1px solid #2a2a2a',
                          opacity: obtenu ? 1 : 0.4,
                        }}>
                          <p style={{ color: obtenu ? '#D4A820' : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{t.profil.badges.contributeur[b.id as keyof typeof t.profil.badges.contributeur]?.label ?? b.id}</p>
<p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{t.profil.badges.contributeur[b.id as keyof typeof t.profil.badges.contributeur]?.desc ?? ''}</p>
{obtenu && (
                            <button onClick={() => setBadgeSelectionne({ id: b.id, emoji: b.emoji, label: t.profil.badges.contributeur[b.id as keyof typeof t.profil.badges.contributeur]?.label ?? b.id, desc: t.profil.badges.contributeur[b.id as keyof typeof t.profil.badges.contributeur]?.desc ?? '' })} style={{ background: 'rgba(200,67,26,0.12)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#C8431A', fontSize: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 2 }}>
                              🎨
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {prochainBadgeContrib && (
                    <div style={{ marginTop: 16, background: 'rgba(212,168,32,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                      <p style={{ color: '#D4A820', fontSize: 12, marginBottom: 6 }}>
                        {t.profil.badges.prochainBadge} : {prochainBadgeContrib.emoji} {t.profil.badges.contributeur[prochainBadgeContrib.id as keyof typeof t.profil.badges.contributeur]?.label ?? prochainBadgeContrib.id}
                      </p>
                      <div style={{ background: 'rgba(26,20,16,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          background: '#D4A820', height: '100%', borderRadius: 999,
                          width: `${Math.min(100, (nbContrib / prochainBadgeContrib.seuil) * 100)}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
                        {nbContrib} / {prochainBadgeContrib.seuil} — {prochainBadgeContrib.seuil - nbContrib > 1 ? t.profil.badges.encoreContributionsPluriel.replace('{n}', String(prochainBadgeContrib.seuil - nbContrib)) : t.profil.badges.encoreContributions.replace('{n}', String(prochainBadgeContrib.seuil - nbContrib))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badges organisateur */}
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{t.profil.badges.titreOrganisateur}</h3>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>{nbApprouves} événement{nbApprouves > 1 ? 's' : ''} approuvé{nbApprouves > 1 ? 's' : ''}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {BADGES_ORGANISATEUR.map(b => {
                      const obtenu = nbApprouves >= b.seuil
                      return (
                        <div key={b.id} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '12px 16px', borderRadius: 12, minWidth: 80,
                          background: obtenu ? 'rgba(200,67,26,0.12)' : 'rgba(26,20,16,0.03)',
                          border: obtenu ? '1px solid rgba(200,67,26,0.4)' : '1px solid #2a2a2a',
                          opacity: obtenu ? 1 : 0.4,
                        }}>
                          <span style={{ fontSize: 28 }}>{b.emoji}</span>
                          <p style={{ color: obtenu ? '#C8431A' : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{t.profil.badges.organisateur[b.id as keyof typeof t.profil.badges.organisateur]?.label ?? b.id}</p>
                          <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{t.profil.badges.organisateur[b.id as keyof typeof t.profil.badges.organisateur]?.desc ?? ''}</p>
                        </div>
                      )
                    })}
                  </div>
                  {prochainBadgeOrga && (
                    <div style={{ marginTop: 16, background: 'rgba(200,67,26,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                      <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 6 }}>
                        {t.profil.badges.prochainBadge} : {prochainBadgeOrga.emoji} {t.profil.badges.organisateur[prochainBadgeOrga.id as keyof typeof t.profil.badges.organisateur]?.label ?? prochainBadgeOrga.id}
                      </p>
                      <div style={{ background: 'rgba(26,20,16,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          background: '#C8431A', height: '100%', borderRadius: 999,
                          width: `${Math.min(100, (nbApprouves / prochainBadgeOrga.seuil) * 100)}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
                        {nbApprouves} / {prochainBadgeOrga.seuil} — {prochainBadgeOrga.seuil - nbApprouves > 1 ? t.profil.badges.encoreEvenementsPluriel.replace('{n}', String(prochainBadgeOrga.seuil - nbApprouves)) : t.profil.badges.encoreEvenements.replace('{n}', String(prochainBadgeOrga.seuil - nbApprouves))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Badges spéciaux */}
                {(hasPioneerScan || hasWikiBadge) && (
                  <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                    <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>{t.profil.badges.titreSpeciaux}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {hasPioneerScan && (() => {
                        const b = { id: 'pioneer_scan', emoji: '📸', label: t.profil.badges.speciaux.pioneerScan.label, desc: t.profil.badges.speciaux.pioneerScan.desc }
                        return (
                          <div key="pioneer_scan" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', borderRadius: 12, minWidth: 80, background: 'rgba(212,168,32,0.12)', border: '1px solid rgba(212,168,32,0.4)' }}>
                            <span style={{ fontSize: 28 }}>{b.emoji}</span>
                            <p style={{ color: '#D4A820', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{b.label}</p>
                            <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{b.desc}</p>
                            <button onClick={() => setBadgeSelectionne(b)} style={{ background: 'rgba(200,67,26,0.12)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#C8431A', fontSize: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 2 }}>🎨</button>
                          </div>
                        )
                      })()}
                      {hasWikiBadge && (() => {
                        const b = { id: 'contributeur_wikimedia', emoji: '🌐', label: t.profil.badges.speciaux.wikiContrib.label, desc: t.profil.badges.speciaux.wikiContrib.desc }
                        return (
                          <div key="contributeur_wikimedia" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', borderRadius: 12, minWidth: 80, background: 'rgba(45,158,107,0.12)', border: '1px solid rgba(45,158,107,0.4)' }}>
                            <span style={{ fontSize: 28 }}>{b.emoji}</span>
                            <p style={{ color: '#2D9E6B', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{b.label}</p>
                            <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{b.desc}</p>
                            <button onClick={() => setBadgeSelectionne(b)} style={{ background: 'rgba(45,158,107,0.12)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#2D9E6B', fontSize: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 2 }}>🎨</button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* 🗓️ Ancienneté */}
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>🗓️ Ancienneté</h3>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16 }}>{moisAnciennete} mois sur LOTBO</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {PALIERS_ANCIENNETE.map(p => {
                      const obtenu = moisAnciennete >= p.mois
                      return (
                        <div key={p.mois} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '12px 16px', borderRadius: 12, minWidth: 80,
                          background: obtenu ? 'rgba(200,67,26,0.12)' : 'rgba(26,20,16,0.03)',
                          border: obtenu ? '1px solid rgba(200,67,26,0.4)' : '1px solid #E8E0D0',
                          opacity: obtenu ? 1 : 0.4,
                        }}>
                          <span style={{ fontSize: 28 }}>{p.badge}</span>
                          <p style={{ color: obtenu ? '#C8431A' : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{t.profil.badges.anciennete[p.id as keyof typeof t.profil.badges.anciennete]?.label ?? p.id}</p>
                          {obtenu && <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{t.profil.badges.anciennete[p.id as keyof typeof t.profil.badges.anciennete]?.message ?? ''}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── GM12 — Mon classement global ── */}
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>🏆 Mon classement</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'rgba(200,67,26,0.06)', borderRadius: 12, border: '1px solid rgba(200,67,26,0.15)' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: '#C8431A', minWidth: 56, textAlign: 'center' }}>
                      {rangGlobal !== null ? `#${rangGlobal}` : '—'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410' }}>Classement global LOTBO</p>
                      <p style={{ color: '#8C5A40', fontSize: 12, marginTop: 2 }}>
                        {pointsReel ?? profile?.points_total ?? 0} pts
                      </p>
                    </div>
                    <span style={{ fontSize: 22 }}>🌍</span>
                  </div>
                  <a href="/classement" style={{ display: 'block', textAlign: 'center', marginTop: 16, background: '#C8431A', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>
                    Voir le classement complet →
                  </a>
                </div>

              </div>
            )}

            {/* ── Onglet Favoris ── */}
            {/* ── Onglet Paramètres ── */}
            {onglet === 'parametres' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Infos perso */}
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>{t.profil.parametres.infosPersoTitre}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 4 }}>{t.profil.parametres.nomAffiche}</label>
                      <input value={nomInput} onChange={e => setNomInput(e.target.value)}
                        style={{ width: '100%', background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1A1410', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 4 }}>{t.profil.parametres.email}</label>
                      <input value={user?.email || ''} disabled
                        style={{ width: '100%', background: '#F0EBE3', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#8C5A40', outline: 'none', cursor: 'not-allowed' }} />
                      <p style={{ fontSize: 11, color: '#8C5A40', marginTop: 4 }}>{t.profil.parametres.emailNonModifiable}</p>
                    </div>
                    <button onClick={async () => {
                      if (!user?.id || !nomInput.trim()) return
                      await supabase.from('profiles').update({ nom: nomInput.trim(), updated_at: new Date().toISOString() }).eq('id', user.id)
                    }} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
                      {t.profil.parametres.enregistrerNom}
                    </button>
                  </div>
                </div>

                {/* Préférences */}
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>{t.profil.parametres.preferencesTitre}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Genre */}
                    <div>
                      <label style={{ fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 8 }}>{t.profil.parametres.genre}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          { val: 'masculin', label: t.profil.parametres.genreMasculin },
                          { val: 'feminin', label: t.profil.parametres.genreFeminin },
                          { val: 'neutre', label: t.profil.parametres.genreNeutre },
                          { val: 'non_precise', label: t.profil.parametres.genreNonPrecise },
                        ].map(g => (
                          <button key={g.val} onClick={() => setGenre(g.val)}
                            style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, border: 'none', cursor: 'pointer', background: genre === g.val ? '#C8431A' : '#F0EBE3', color: genre === g.val ? 'white' : '#8C5A40', fontWeight: genre === g.val ? 'bold' : 'normal' }}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visibilité anniversaire */}
                    <div>
                      <label style={{ fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 8 }}>{t.profil.parametres.afficherAnniversaire}</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { val: 'mois', label: 'Mois uniquement (15 mai)' },
                          { val: 'annee', label: 'Année uniquement (1990)' },
                          { val: 'complet', label: 'Date complète (15 mai 1990)' },
                        ].map(v => (
                          <button key={v.val} onClick={() => setAnniversaireVisibilite(v.val)}
                            style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12, border: 'none', cursor: 'pointer', background: anniversaireVisibilite === v.val ? '#C8431A' : '#F0EBE3', color: anniversaireVisibilite === v.val ? 'white' : '#8C5A40' }}>
                            {v.val === 'mois' ? t.profil.parametres.moisUniquement : v.val === 'annee' ? t.profil.parametres.anneeUniquement : t.profil.parametres.dateComplete}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Langue */}
                    <div>
                      <label style={{ fontSize: 12, color: '#8C5A40', display: 'block', marginBottom: 8 }}>{t.profil.parametres.languePreferee}</label>
                      <select value={langue} onChange={e => setLangue(e.target.value as Langue)}
                        style={{ width: '100%', background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1A1410', outline: 'none' }}>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="pt">🇵🇹 Português</option>
                        <option value="ht">🇭🇹 Kreyòl ayisyen</option>
                      </select>
                    </div>

                    {/* Bouton sauvegarder */}
                    <button onClick={async () => {
                      if (!user?.id) return
                      setSavingParams(true)
                      await supabase.from('profiles').update({
                        genre,
                        anniversaire_visibilite: anniversaireVisibilite,
                        langue_preference: langue,
                        consent_newsletter: consentNewsletter,
                        consent_alertes:    consentAlertes,
                        consent_push:       consentPush,
                        notif_nouveaux_evenements: notifNouveauxEvenements,
                        notif_commentaires:        notifCommentaires,
                        notif_corrections:         notifCorrections,
                        notif_organisation:        notifOrganisation,
                        notif_scan_publie:         notifScanPublie,
                        notif_evenement_modifie:   notifEvenementModifie,
                        updated_at: new Date().toISOString(),
                      }).eq('id', user.id)
                      setSavingParams(false)
                      setParamsSaved(true)
                      setTimeout(() => setParamsSaved(false), 3000)
                    }} disabled={savingParams}
                      style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
                      {savingParams ? t.anniversaire.enregistrement : t.profil.parametres.enregistrerPreferences}
                    </button>
                    {paramsSaved && <p style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{t.profil.parametres.preferencesEnregistrees}</p>}
                  </div>
                </div>

                {/* Confidentialité */}
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>🔒 Confidentialité</h3>
                  <p style={{ fontSize: 12, color: '#8C5A40', marginBottom: 16, lineHeight: 1.5 }}>
                    Contrôle ce que les autres membres peuvent voir de ton profil.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={profile?.anniversaire_public ?? false}
                        onChange={async e => {
                          if (!user?.id) return
                          await supabase.from('profiles').update({ anniversaire_public: e.target.checked, updated_at: new Date().toISOString() }).eq('id', user.id)
                          setProfile((p: any) => p ? { ...p, anniversaire_public: e.target.checked } : p)
                        }}
                        style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 13, color: '#1A1410', lineHeight: 1.5 }}>
                        Afficher mon anniversaire sur mon profil public
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notifications */}
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>🔔 Notifications</h3>
                  <p style={{ fontSize: 12, color: '#8C5A40', marginBottom: 16, lineHeight: 1.5 }}>
                    Choisis ce que LOTBO peut t&apos;envoyer.
                    Les modifications sont sauvegardées avec tes préférences.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {[
                      { key: 'newsletter',           label: t.profil.notifications.newsletter,         desc: t.profil.notifications.newsletterDesc,         checked: consentNewsletter,       set: setConsentNewsletter },
                      { key: 'alertes',              label: t.profil.notifications.alertes,            desc: t.profil.notifications.alertesDesc,            checked: consentAlertes,          set: setConsentAlertes },
                      { key: 'push',                 label: t.profil.notifications.push,               desc: t.profil.notifications.pushDesc,               checked: consentPush,             set: setConsentPush },
                      { key: 'nouveaux_evenements',  label: t.profil.notifications.nouveauxEvenements, desc: t.profil.notifications.nouveauxEvenementsDesc, checked: notifNouveauxEvenements, set: setNotifNouveauxEvenements },
                      { key: 'commentaires',         label: t.profil.notifications.commentaires,       desc: t.profil.notifications.commentairesDesc,       checked: notifCommentaires,       set: setNotifCommentaires },
                      { key: 'corrections',          label: t.profil.notifications.corrections,        desc: t.profil.notifications.correctionsDesc,        checked: notifCorrections,        set: setNotifCorrections },
                      { key: 'organisation',         label: t.profil.notifications.organisation,       desc: t.profil.notifications.organisationDesc,       checked: notifOrganisation,       set: setNotifOrganisation },
                      { key: 'scan_publie',          label: t.profil.notifications.scanPublie,         desc: t.profil.notifications.scanPublieDesc,         checked: notifScanPublie,         set: setNotifScanPublie },
                      { key: 'evenement_modifie',    label: t.profil.notifications.evenementModifie,   desc: t.profil.notifications.evenementModifieDesc,   checked: notifEvenementModifie,   set: setNotifEvenementModifie },
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={e => item.set(e.target.checked)}
                          style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                        />
                        <div>
                          <p style={{ fontSize: 13, color: '#1A1410', fontWeight: 'bold', lineHeight: 1.4 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: '#8C5A40', lineHeight: 1.4 }}>{item.desc}</p>
                        </div>
                      </label>
                    ))}

                    <div style={{ height: 1, background: '#F0E8DC' }} />

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={profile?.consent_analytics ?? true}
                        onChange={async e => {
                          if (!user?.id) return
                          await supabase.from('profiles').update({ consent_analytics: e.target.checked, updated_at: new Date().toISOString() }).eq('id', user.id)
                          setProfile((p: any) => p ? { ...p, consent_analytics: e.target.checked } : p)
                          if (!e.target.checked) {
                            const { resetAmplitudeUser } = await import('../../lib/amplitude')
                            resetAmplitudeUser()
                          }
                        }}
                        style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ fontSize: 13, color: '#1A1410', fontWeight: 'bold', lineHeight: 1.4 }}>Analytics anonymisés</p>
                        <p style={{ fontSize: 11, color: '#8C5A40', lineHeight: 1.4 }}>Aide à améliorer LOTBO · aucun identifiant personnel</p>
                      </div>
                    </label>

                  </div>
                </div>

                {suppressionDemandeeAt && (
                  <div style={{ background: 'rgba(180,40,40,0.08)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 16, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#b42828', marginBottom: 8 }}>
                      ⏳ Suppression de compte en cours
                    </h3>
                    <p style={{ fontSize: 13, color: '#8C5A40', lineHeight: 1.6, marginBottom: 16 }}>
                      Votre demande de suppression a été enregistrée le{' '}
                      {new Date(suppressionDemandeeAt).toLocaleDateString('fr-FR')}.
                      Votre compte sera définitivement supprimé le{' '}
                      {new Date(new Date(suppressionDemandeeAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}.
                    </p>
                    <button
                      onClick={async () => {
                        setAnnulantSuppression(true)
                        const { data: { session } } = await supabase.auth.getSession()
                        const res = await fetch('/api/compte/annuler-suppression', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${session?.access_token}` },
                        })
                        if (res.ok) setSuppressionDemandeeAt(null)
                        setAnnulantSuppression(false)
                      }}
                      disabled={annulantSuppression}
                      style={{ background: 'white', border: '1px solid #b42828', color: '#b42828', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {annulantSuppression ? 'Annulation...' : '↩ Annuler la suppression'}
                    </button>
                  </div>
                )}

                {/* ⚠️ Zone de danger */}
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid rgba(180,40,40,0.3)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#b42828', marginBottom: 8 }}>{t.profil.parametres.zoneDanger}</h3>
                  <p style={{ fontSize: 13, color: '#8C5A40', marginBottom: 16 }}>
                    {t.profil.parametres.zoneDangerTexte}
                  </p>
                  <button
                    onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null) }}
                    style={{ background: 'rgba(180,40,40,0.1)', color: '#b42828', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {t.profil.parametres.supprimerCompte}
                  </button>
                </div>

              </div>
            )}

            {/* ── Onglet Favoris ── */}
            {onglet === 'favoris' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>{t.profil.favoris.titre}</h2>
                {favorisEvs.length === 0 ? (
                  <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>🔖</p>
                    <p style={{ color: '#8C5A40', fontSize: 14 }}>{t.profil.favoris.vide}</p>
                    <a href="/" style={{ display: 'inline-block', marginTop: 20, background: '#C8431A', color: 'white', borderRadius: 999, padding: '10px 24px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>{t.profil.favoris.explorer}</a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {favorisEvs.map((ev: any) => (
                      <div key={ev.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = getEventImage(null, ev.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                          <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                          <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>📅 {ev.date}</p>
                          <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{ev.categorie}</span>
                        </div>
                        <a href={'/evenement/' + ev.id} style={{ color: '#8C5A40', fontSize: 12, textDecoration: 'none', flexShrink: 0, padding: '4px 8px' }}>{t.profil.evenements.voir}</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
      {badgeSelectionne && (
        <CarteBadge
          badge={badgeSelectionne}
          nom={profile?.nom || nomAffiche}
          photoProfil={photoUrl}
          points={profile?.points_total || 0}
          onClose={() => setBadgeSelectionne(null)}
        />
      )}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,20,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#b42828', marginBottom: 12 }}>{t.profil.modalSuppression.titre}</h3>
            <p style={{ fontSize: 13, color: '#8C5A40', marginBottom: 16 }}>
              {t.profil.modalSuppression.texte}
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', fontSize: 14, marginBottom: 12, outline: 'none' }}
            />
            {deleteError && <p style={{ color: '#b42828', fontSize: 12, marginBottom: 12 }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                style={{ flex: 1, background: '#F0EBE3', color: '#1A1410', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t.profil.modalSuppression.annuler}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deletingAccount}
                style={{ flex: 1, background: deleteConfirmText === 'SUPPRIMER' ? '#b42828' : '#e0c0c0', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 'bold', cursor: deleteConfirmText === 'SUPPRIMER' ? 'pointer' : 'not-allowed' }}
              >
                {deletingAccount ? t.profil.modalSuppression.suppression : t.profil.modalSuppression.confirmer}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
export default function Profil() {
  return <Suspense fallback={null}><ProfilInner /></Suspense>
}
