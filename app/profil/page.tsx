'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { getEventImage } from '../../lib/fallbackImages'
import { useRouter, useSearchParams } from 'next/navigation'
import CarteBadge from '../../components/CarteBadge'
import { syncUserPoints, calculerNiveau } from '../../lib/points'
import { identifyUser } from '../../lib/amplitude'

// ── Système de badges ─────────────────────────────────────────────────────────
const BADGES_CONTRIBUTEUR = [
  { id: 'decouvreur', emoji: '🌱', label: 'Découvreur', seuil: 1, desc: '1re contribution' },
  { id: 'actif', emoji: '🔥', label: 'Actif', seuil: 5, desc: '5 contributions' },
  { id: 'contributeur', emoji: '⭐', label: 'Contributeur', seuil: 10, desc: '10 contributions' },
  { id: 'top_contributeur', emoji: '🏅', label: 'Top Contributeur', seuil: 25, desc: '25 contributions' },
  { id: 'elite', emoji: '🥇', label: 'Élite', seuil: 50, desc: '50 contributions' },
  { id: 'legende', emoji: '👑', label: 'Légende LOTBO', seuil: 100, desc: '100 contributions' },
]

const BADGES_ORGANISATEUR = [
  { id: 'organisateur', emoji: '🎪', label: 'Organisateur', seuil: 1, desc: '1er événement' },
  { id: 'regulier', emoji: '📅', label: 'Régulier', seuil: 3, desc: '3 événements' },
  { id: 'premium', emoji: '💎', label: 'Premium', seuil: 10, desc: '10 événements' },
  { id: 'vedette', emoji: '🌟', label: 'Vedette', seuil: 25, desc: '25 événements' },
  { id: 'champion', emoji: '🏆', label: 'Champion', seuil: 50, desc: '50 événements' },
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
  const tabParam = searchParams.get('tab') as 'evenements' | 'badges' | 'favoris' | null
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
  const [onglet, setOnglet]         = useState<'evenements' | 'badges' | 'favoris'>(tabParam === 'favoris' || tabParam === 'badges' ? tabParam : 'evenements')
  const [favorisEvs, setFavorisEvs] = useState<any[]>([])
  const [rangGlobal, setRangGlobal] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setUser(data.session.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('role, charte_acceptee, points_total, points_utilisateur, points_organisateur, niveau, nom, photo_url')
        .eq('id', data.session.user.id)
        .single()
      // roles_actifs optionnel — requiert migration DB
      const { data: raRow, error: raErr } = await supabase
        .from('profiles').select('roles_actifs').eq('id', data.session.user.id).single()

      // Sync points depuis transactions_points — recalcule si désynchronisé
      const { data: txs } = await supabase
        .from('transactions_points').select('points').eq('user_id', data.session.user.id)
      const pointsReel = Math.max(0, (txs || []).reduce((s: number, t: any) => s + (t.points || 0), 0))
      const niveauReel = calculerNiveau(pointsReel)
      if (prof && pointsReel !== (prof.points_total || 0)) {
        supabase.from('profiles').update({
          points_total: pointsReel, niveau: niveauReel, updated_at: new Date().toISOString(),
        }).eq('id', data.session.user.id).then(() => {})
      }

      // Rang global : combien de profils ont plus de points_total ?
      const { count: rangCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('points_total', pointsReel)
      setRangGlobal((rangCount || 0) + 1)

      setProfile({
        ...prof,
        roles_actifs:  raErr ? null : (raRow?.roles_actifs ?? null),
        points_total:  pointsReel,
        niveau:        niveauReel,
      })
      identifyUser(data.session.user.id, {
        role:         prof?.role,
        niveau:       niveauReel,
        points_total: pointsReel,
      })
      if (prof?.nom) setNomInput(prof.nom)
      if (prof?.photo_url) setPhotoUrl(prof.photo_url)

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

  const statutLabel = (statut: string) => {
    switch (statut) {
      case 'approuve': return { label: '✓ Approuvé', bg: 'rgba(200,67,26,0.15)', color: '#C8431A' }
      case 'hors_ligne': return { label: '⊘ Hors ligne', bg: 'rgba(100,100,100,0.15)', color: '#888' }
      case 'rejete': return { label: '✗ Rejeté', bg: 'rgba(180,40,40,0.2)', color: '#e57373' }
      case 'en_attente': return { label: '⏳ En attente', bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
      default: return { label: statut, bg: 'rgba(26,20,16,0.06)', color: '#8C5A40' }
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8' }} className="flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
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

  const nomAffiche = profile?.nom || user?.email?.split('@')[0] || 'Utilisateur'
  const initiales = nomAffiche.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Carte</a>
            {isAdmin && <a href="/admin" style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>⚙️ Admin</a>}
            <button onClick={handleLogout} style={{ background: 'rgba(180,40,40,0.15)', color: '#e57373', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Déconnexion</button>
          </div>
        </div>

        {/* Carte profil */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 24, marginBottom: 24 }}>
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
                {profile?.role === 'admin' ? '⚙️ Administrateur'
                  : profile?.role === 'ambassadeur' ? '🤝 Ambassadeur'
                  : profile?.role === 'organisateur' ? '🎪 Organisateur'
                  : profile?.role === 'contributeur_terrain' ? '⭐ Contributeur Terrain'
                  : profile?.role === 'contributeur' ? '⭐ Contributeur'
                  : profile?.role === 'membre' ? '👤 Membre'
                  : '👤 Membre LOTBO'}
              </p>

              {/* Badges rôles */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {isAdmin && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>⚙️ Admin</span>}
                {(rolesActifs.includes('contributeur_terrain')) && <span style={{ background: 'rgba(200,160,32,0.15)', color: '#C8A020', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>⭐ Contributeur Terrain</span>}
                {(rolesActifs.includes('contributeur') && !rolesActifs.includes('contributeur_terrain')) && profile?.charte_acceptee && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>⭐ Contributeur</span>}
                {rolesActifs.includes('ambassadeur') && <span style={{ background: 'rgba(45,158,107,0.15)', color: '#2D9E6B', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>🤝 Ambassadeur</span>}
                {(rolesActifs.includes('organisateur') || nbOrga > 0) && <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>🎪 Organisateur</span>}
                {badgeContribActuel && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>{badgeContribActuel.emoji} {badgeContribActuel.label}</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { val: nbTotal, label: 'Total', color: '#1A1410', bg: 'rgba(26,20,16,0.04)' },
              { val: nbApprouves, label: 'Approuvés', color: '#C8431A', bg: 'rgba(200,67,26,0.08)' },
              { val: nbEnAttente, label: 'En attente', color: '#D4A820', bg: 'rgba(212,168,32,0.08)' },
              { val: paysCouverts, label: 'Pays', color: '#2D9E6B', bg: 'rgba(45,158,107,0.08)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.val}</p>
                <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'evenements', label: '📅 Événements' },
            { id: 'badges', label: '🏅 Badges' },
            { id: 'favoris', label: '🔖 Favoris' },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id as any)} style={{
              flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
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
              <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410' }}>Mes événements</h2>
              <a href="/ajouter" style={{ background: '#C8431A', color: '#F7F2E8', padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>+ Ajouter</a>
            </div>

            {evenements.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                <p style={{ color: '#8C5A40', marginBottom: 20, fontSize: 14 }}>Tu n'as pas encore soumis d'événement.</p>
                <a href="/ajouter" style={{ background: '#C8431A', color: '#F7F2E8', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', textDecoration: 'none' }}>
                  Soumettre mon premier événement
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {evenements.map(ev => {
                  const s = statutLabel(ev.statut)
                  return (
                    <div key={ev.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { const img = e.target as HTMLImageElement; const fb = getEventImage(null, ev.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                        <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>📅 {ev.date}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{ev.categorie}</span>
                          <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{s.label}</span>
                          {ev.soumis_en_tant_que === 'contributeur' && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>⭐ Repéré</span>}
                        </div>
                      </div>
                      <a href={'/evenement/' + ev.id} style={{ color: '#8C5A40', fontSize: 12, textDecoration: 'none', flexShrink: 0, padding: '4px 8px' }}>Voir →</a>
                    </div>
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
              <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>⭐ Badges Contributeur</h3>
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
                      <p style={{ color: obtenu ? '#D4A820' : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{b.label}</p>
<p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{b.desc}</p>
{obtenu && (
                        <button onClick={() => setBadgeSelectionne(b)} style={{ background: 'rgba(200,67,26,0.12)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#C8431A', fontSize: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 2 }}>
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
                    Prochain badge : {prochainBadgeContrib.emoji} {prochainBadgeContrib.label}
                  </p>
                  <div style={{ background: 'rgba(26,20,16,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      background: '#D4A820', height: '100%', borderRadius: 999,
                      width: `${Math.min(100, (nbContrib / prochainBadgeContrib.seuil) * 100)}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
                    {nbContrib} / {prochainBadgeContrib.seuil} — encore {prochainBadgeContrib.seuil - nbContrib} contribution{prochainBadgeContrib.seuil - nbContrib > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Badges organisateur */}
            <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>🎪 Badges Organisateur</h3>
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
                      <p style={{ color: obtenu ? '#C8431A' : '#8C5A40', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>{b.label}</p>
                      <p style={{ color: '#8C5A40', fontSize: 10, textAlign: 'center' }}>{b.desc}</p>
                    </div>
                  )
                })}
              </div>
              {prochainBadgeOrga && (
                <div style={{ marginTop: 16, background: 'rgba(200,67,26,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 6 }}>
                    Prochain badge : {prochainBadgeOrga.emoji} {prochainBadgeOrga.label}
                  </p>
                  <div style={{ background: 'rgba(26,20,16,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      background: '#C8431A', height: '100%', borderRadius: 999,
                      width: `${Math.min(100, (nbApprouves / prochainBadgeOrga.seuil) * 100)}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
                    {nbApprouves} / {prochainBadgeOrga.seuil} — encore {prochainBadgeOrga.seuil - nbApprouves} événement{prochainBadgeOrga.seuil - nbApprouves > 1 ? 's' : ''}
                  </p>
                </div>
            )}

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
                    {profile?.points_total ?? 0} pts · contributeur + organisateur cumulés
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
        {onglet === 'favoris' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>Mes favoris</h2>
            {favorisEvs.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🔖</p>
                <p style={{ color: '#8C5A40', fontSize: 14 }}>Aucun événement sauvegardé pour l'instant.</p>
                <a href="/" style={{ display: 'inline-block', marginTop: 20, background: '#C8431A', color: 'white', borderRadius: 999, padding: '10px 24px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}>Explorer les événements</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorisEvs.map((ev: any) => (
                  <div key={ev.id} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { const img = e.target as HTMLImageElement; const fb = getEventImage(null, ev.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                      <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                      <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>📅 {ev.date}</p>
                      <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{ev.categorie}</span>
                    </div>
                    <a href={'/evenement/' + ev.id} style={{ color: '#8C5A40', fontSize: 12, textDecoration: 'none', flexShrink: 0, padding: '4px 8px' }}>Voir →</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
    </main>
  )
}
export default function Profil() {
  return <Suspense fallback={null}><ProfilInner /></Suspense>
}
