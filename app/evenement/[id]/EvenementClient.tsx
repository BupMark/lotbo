'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import CarteVisuelle from '../../../components/CarteVisuelle'
import { attributerPoints } from '../../../lib/points'
import { getEventImage } from '../../../lib/fallbackImages'


// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return dateStr
  const [year, month, day] = dateStr.split('-')
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${parseInt(day)} ${mois[parseInt(month) - 1]} ${year}`
}

function afficherPeriode(ev: { date?: string; date_fin?: string | null }): string {
  if (ev.date_fin && ev.date_fin !== ev.date) return `${formatDate(ev.date || '')} → ${formatDate(ev.date_fin)}`
  return formatDate(ev.date || '') || ev.date || ''
}

function estEnLigne(lieu: string): boolean {
  if (!lieu) return false
  const mots = ['en ligne', 'online', 'zoom', 'teams', 'meet', 'webinar', 'webinaire', 'virtuel', 'distanciel']
  return mots.some(m => lieu.toLowerCase().includes(m))
}

function adresseIncomplete(ev: { latitude?: number | null; longitude?: number | null }): boolean {
  return !ev.latitude || !ev.longitude
}

function afficherHeureFuseau(heure: string, fuseauOrganisateur: string): string {
  if (!heure) return heure
  try {
    const [h, m] = heure.split(':').map(Number)
    const now = new Date()
    const dateRef = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), h, m))
    const heureOrga = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: fuseauOrganisateur, hour12: false }).format(dateRef)
    const fuseauVisiteur = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (fuseauVisiteur === fuseauOrganisateur) return heureOrga
    const heureVisiteur = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: fuseauVisiteur, hour12: false }).format(dateRef)
    if (heureOrga === heureVisiteur) return heureOrga
    return `${heureOrga} (heure locale) · Chez vous : ${heureVisiteur}`
  } catch { return heure }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Commentaire {
  id: string
  evenement_id: string
  auteur: string
  contenu: string
  created_at: string
  nb_likes: number
  parent_id: string | null
  user_id: string | null
  photo_url: string | null
  reponses?: Commentaire[]
  reactions?: Record<string, number>
}

interface UserProfile {
  id: string
  nom: string
  photo_url: string | null
}

interface Evenement {
  id: string
  titre: string
  lieu: string
  date: string
  date_fin: string | null
  heure_debut: string | null
  heure_fin: string | null
  fuseau_organisateur: string | null
  categorie: string
  acces: string
  prix: string
  statut: string
  image_url: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  lien: string | null
  organisateur: string | null
  parent_id: string | null
  user_id: string | null
  organisation_id: string | null
}

// ── E12 — 6 réactions ────────────────────────────────────────────────────────
const REACTIONS_DISPONIBLES = ['👍', '❤️', '😂', '😮', '🙏', '🔥']

const COMMENTS_PER_PAGE = 10

// ── Obtenir ou créer session_id ───────────────────────────────────────────────
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem('lotbo_session_id')
  if (existing) return existing
  const newId = Math.random().toString(36).slice(2)
  localStorage.setItem('lotbo_session_id', newId)
  return newId
}

// ── Composant Réactions ───────────────────────────────────────────────────────
function ReactionBar({ commentaireId, reactionsInitiales }: {
  commentaireId: string
  reactionsInitiales: Record<string, number>
}) {
  const [reactions, setReactions]   = useState<Record<string, number>>(reactionsInitiales)
  const [mesReactions, setMesReactions] = useState<string[]>([])
  const sessionId = getSessionId()

  useEffect(() => {
    // Charger les réactions de cet utilisateur
    supabase.from('reactions')
      .select('emoji')
      .eq('commentaire_id', commentaireId)
      .eq('session_id', sessionId)
      .then(({ data }) => {
        setMesReactions((data || []).map((r: { emoji: string }) => r.emoji))
      })
  }, [commentaireId])

  const toggleReaction = async (emoji: string) => {
    const aReagi = mesReactions.includes(emoji)
    if (aReagi) {
      // Supprimer
      await supabase.from('reactions')
        .delete()
        .eq('commentaire_id', commentaireId)
        .eq('session_id', sessionId)
        .eq('emoji', emoji)
      setMesReactions(prev => prev.filter(e => e !== emoji))
      setReactions(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 1) - 1) }))
    } else {
      // Ajouter
      await supabase.from('reactions')
        .insert([{ commentaire_id: commentaireId, session_id: sessionId, emoji }])
      setMesReactions(prev => [...prev, emoji])
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
      {REACTIONS_DISPONIBLES.map(emoji => {
        const count   = reactions[emoji] || 0
        const aReagi  = mesReactions.includes(emoji)
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 999, fontSize: 13,
              border: aReagi ? '1px solid #C8431A' : '1px solid #E8E0D0',
              background: aReagi ? 'rgba(200,67,26,0.1)' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.15s',
              color: aReagi ? '#C8431A' : '#8C5A40',
            }}
          >
            <span>{emoji}</span>
            {count > 0 && <span style={{ fontSize: 11, fontWeight: 'bold' }}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Formulaire commentaire / réponse ─────────────────────────────────────────
const ADMIN_UUID = 'ff21f2e0-135d-4996-9713-4a0e20c38fe1'

function CommentaireForm({
  evenementId,
  parentId,
  onNouveau,
  onCancel,
  placeholder,
  compact,
  userProfile,
  parentAuthorUserId,
  evenementTitre,
}: {
  evenementId: string
  parentId?: string
  onNouveau: (c: Commentaire) => void
  onCancel?: () => void
  placeholder?: string
  compact?: boolean
  userProfile: UserProfile | null
  parentAuthorUserId?: string | null
  evenementTitre?: string
}) {
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye]   = useState(false)

  if (!userProfile) {
    return (
      <div style={{
        background: 'rgba(200,67,26,0.04)', border: '1px solid rgba(200,67,26,0.15)',
        borderRadius: 12, padding: compact ? '12px 16px' : '16px 20px',
        marginBottom: compact ? 0 : 24, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ color: '#8C5A40', fontSize: 13 }}>
          {parentId ? 'Connecte-toi pour répondre.' : 'Connecte-toi pour laisser un commentaire.'}
        </span>
        <a href="/login" style={{
          background: '#C8431A', color: 'white', padding: '8px 16px',
          borderRadius: 8, fontSize: 13, fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Se connecter
        </a>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contenu.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('commentaires')
      .insert([{
        evenement_id: evenementId,
        auteur: userProfile.nom,
        contenu: contenu.trim(),
        parent_id: parentId || null,
        user_id: userProfile.id,
      }])
      .select().single()
    setLoading(false)
    if (!error && data) {
      const nouveau = { ...data as Commentaire, photo_url: userProfile.photo_url }
      onNouveau(nouveau)
      attributerPoints({
        user_id: userProfile.id,
        action: parentId ? 'repondre' : 'commenter',
        evenement_id: evenementId,
        type_role: 'utilisateur',
      })

      // Notification à l'auteur du commentaire parent (si réponse + pas soi-même)
      if (parentId && parentAuthorUserId && parentAuthorUserId !== userProfile.id) {
        const extrait = contenu.trim().slice(0, 80) + (contenu.trim().length > 80 ? '…' : '')
        supabase.from('notifications').insert([{
          user_id: parentAuthorUserId,
          type: 'nouveau_commentaire',
          titre: `${userProfile.nom} a répondu à votre commentaire`,
          message: extrait,
          lien: `/evenement/${evenementId}`,
          lu: false,
        }]).then(() => {})
      }

      // Notification admin pour tout nouveau commentaire racine (modération)
      if (!parentId && userProfile.id !== ADMIN_UUID) {
        const extrait = contenu.trim().slice(0, 80) + (contenu.trim().length > 80 ? '…' : '')
        const titreEv = evenementTitre ? ` sur "${evenementTitre}"` : ''
        supabase.from('notifications').insert([{
          user_id: ADMIN_UUID,
          type: 'nouveau_commentaire',
          titre: `Nouveau commentaire${titreEv}`,
          message: `${userProfile.nom} : ${extrait}`,
          lien: `/evenement/${evenementId}`,
          lu: false,
        }]).then(() => {})
      }

      setContenu('')
      setEnvoye(true)
      setTimeout(() => { setEnvoye(false); if (onCancel) onCancel() }, 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: compact ? 0 : 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Identité connectée — lecture seule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {userProfile.photo_url
            ? <img src={userProfile.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                {userProfile.nom[0]?.toUpperCase()}
              </div>
          }
          <span style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410' }}>{userProfile.nom}</span>
        </div>
        <textarea
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder={placeholder || 'Laisse un commentaire...'}
          maxLength={500}
          rows={compact ? 2 : 3}
          required
          style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: compact ? '8px 12px' : '10px 14px', fontSize: 13, color: '#1A1410', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          {envoye
            ? <p style={{ color: '#2D9E6B', fontSize: 13 }}>✓ {parentId ? 'Réponse ajoutée !' : 'Commentaire ajouté !'}</p>
            : <div />
          }
          <div style={{ display: 'flex', gap: 8 }}>
            {onCancel && (
              <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 13, cursor: 'pointer', padding: '8px 12px' }}>
                Annuler
              </button>
            )}
            <button type="submit" disabled={loading} style={{
              background: loading ? '#E8E0D0' : '#C8431A',
              color: '#F7F2E8', fontWeight: 'bold',
              padding: compact ? '8px 16px' : '10px 20px',
              borderRadius: 10, border: 'none', fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '...' : parentId ? 'Répondre →' : 'Commenter →'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ── Carte commentaire individuel ──────────────────────────────────────────────
function CarteCommentaire({
  commentaire,
  evenementId,
  onNouvelleReponse,
  estReponse,
  userProfile,
  evenementTitre,
}: {
  commentaire: Commentaire
  evenementId: string
  onNouvelleReponse: (parentId: string, reponse: Commentaire) => void
  estReponse?: boolean
  userProfile: UserProfile | null
  evenementTitre?: string
}) {
  const [showRepondre, setShowRepondre] = useState(false)

  return (
    <div style={{
      background: estReponse ? 'rgba(26,20,16,0.02)' : 'white',
      border: '1px solid #E8E0D0',
      borderRadius: 12,
      padding: '14px 16px',
      marginLeft: estReponse ? 20 : 0,
      borderLeft: estReponse ? '3px solid rgba(200,67,26,0.3)' : '1px solid #E8E0D0',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {commentaire.photo_url
            ? <img src={commentaire.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                {commentaire.auteur[0]?.toUpperCase()}
              </div>
          }
          <span style={{ fontWeight: 'bold', fontSize: 13, color: '#1A1410' }}>{commentaire.auteur}</span>
        </div>
        <span style={{ fontSize: 11, color: '#8C5A40' }}>
          {new Date(commentaire.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Contenu */}
      <p style={{ fontSize: 13, color: '#3D2B1F', lineHeight: 1.6, marginBottom: 8 }}>{commentaire.contenu}</p>

      {/* E12 — Réactions */}
      <ReactionBar
        commentaireId={commentaire.id}
        reactionsInitiales={commentaire.reactions || {}}
      />

      {/* E11 — Bouton répondre (uniquement sur commentaires racine) */}
      {!estReponse && (
        <div style={{ marginTop: 8 }}>
          {!showRepondre ? (
            <button
              onClick={() => setShowRepondre(true)}
              style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              💬 Répondre
              {commentaire.reponses && commentaire.reponses.length > 0 && (
                <span style={{ background: 'rgba(200,67,26,0.1)', color: '#C8431A', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 'bold' }}>
                  {commentaire.reponses.length}
                </span>
              )}
            </button>
          ) : (
            <div style={{ marginTop: 10 }}>
              <CommentaireForm
                evenementId={evenementId}
                parentId={commentaire.id}
                userProfile={userProfile}
                parentAuthorUserId={commentaire.user_id}
                evenementTitre={evenementTitre}
                onNouveau={(reponse) => {
                  onNouvelleReponse(commentaire.id, reponse)
                  setShowRepondre(false)
                }}
                onCancel={() => setShowRepondre(false)}
                placeholder={`Répondre à ${commentaire.auteur}...`}
                compact
              />
            </div>
          )}
        </div>
      )}

      {/* E11 — Réponses imbriquées */}
      {!estReponse && commentaire.reponses && commentaire.reponses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {commentaire.reponses.map(rep => (
            <CarteCommentaire
              key={rep.id}
              commentaire={rep}
              evenementId={evenementId}
              onNouvelleReponse={onNouvelleReponse}
              userProfile={userProfile}
              evenementTitre={evenementTitre}
              estReponse
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Liste commentaires ────────────────────────────────────────────────────────
function CommentairesList({
  commentaires,
  evenementId,
  onNouvelleReponse,
  userProfile,
  evenementTitre,
}: {
  commentaires: Commentaire[]
  evenementId: string
  onNouvelleReponse: (parentId: string, reponse: Commentaire) => void
  userProfile: UserProfile | null
  evenementTitre?: string
}) {
  const [tri, setTri]         = useState<'recent' | 'likes'>('recent')
  const [nbVisible, setNbVisible] = useState(COMMENTS_PER_PAGE)

  // Uniquement les commentaires racine (pas de parent_id)
  const racines = commentaires.filter(c => !c.parent_id)

  const tries = [...racines].sort((a, b) => {
    if (tri === 'likes') return (b.nb_likes || 0) - (a.nb_likes || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const visibles = tries.slice(0, nbVisible)

  if (racines.length === 0) {
    return <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Aucun commentaire. Sois le premier à commenter !</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ key: 'recent', label: '🕐 Plus récents' }, { key: 'likes', label: '❤️ Plus likés' }].map(t => (
          <button key={t.key} onClick={() => setTri(t.key as 'recent' | 'likes')} style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
            border: 'none', cursor: 'pointer',
            background: tri === t.key ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
            color: tri === t.key ? '#C8431A' : '#8C5A40',
          }}>{t.label}</button>
        ))}
        <span style={{ color: '#555', fontSize: 12, marginLeft: 'auto', alignSelf: 'center' }}>
          {racines.length} commentaire{racines.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibles.map(c => (
          <CarteCommentaire
            key={c.id}
            commentaire={c}
            evenementId={evenementId}
            onNouvelleReponse={onNouvelleReponse}
            userProfile={userProfile}
            evenementTitre={evenementTitre}
          />
        ))}
      </div>

      {nbVisible < racines.length && (
        <button onClick={() => setNbVisible(n => n + COMMENTS_PER_PAGE)} style={{
          width: '100%', marginTop: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #E8E0D0', borderRadius: 10,
          padding: '12px', fontSize: 13, color: '#8C5A40',
          cursor: 'pointer', fontWeight: 'bold',
        }}>
          Voir plus ({racines.length - nbVisible} restants)
        </button>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EvenementPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [ev, setEv]                         = useState<Evenement | null>(null)
  const [loading, setLoading]               = useState(true)
  const [similaires, setSimilaires]         = useState<Evenement[]>([])
  const [occurrences, setOccurrences] = useState<Evenement[]>([])
  const [signalementModal, setSignalementModal] = useState(false)
  const [raisonSignalement, setRaisonSignalement] = useState('')
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const [signalementConfirmation, setSignalementConfirmation] = useState(false)
  const [erreurSignalement, setErreurSignalement] = useState('')
  const [liked, setLiked]                   = useState(false)
  const [nbLikes, setNbLikes]               = useState(0)
  const [commentaires, setCommentaires]     = useState<Commentaire[]>([])
  const [isAdmin, setIsAdmin]               = useState(false)
  const [imageAuto, setImageAuto]           = useState<string | null>(null)
  const [imageAuteur, setImageAuteur]       = useState<string | null>(null)
  const [seraiLa, setSeraiLa]               = useState(false)
  const [nbParticipants, setNbParticipants] = useState(0)
  const [loadingParticipation, setLoadingParticipation] = useState(false)
  const [carteVisuelleouverte, setCarteVisuelleouverte] = useState(false)
  const [expressionChoisie, setExpressionChoisie]       = useState('🙋 Je serai là')
  const [isConnected, setIsConnected]                   = useState(false)
  const [userProfile, setUserProfile]                   = useState<UserProfile | null>(null)
  const [propositionModal, setPropositionModal]         = useState(false)
  const [propositionEnvoyee, setPropositionEnvoyee]     = useState(false)
  const [propositionForm, setPropositionForm]           = useState({ champ_modifie: 'titre', ancienne_valeur: '', nouvelle_valeur: '' })
  const [claimModal, setClaimModal]                     = useState(false)
  const [claimMessage, setClaimMessage]                 = useState('')
  const [claimEnvoye, setClaimEnvoye]                   = useState(false)
  const [claimLoading, setClaimLoading]                 = useState(false)
  const [roleOrg, setRoleOrg]                           = useState<string | null>(null)

  useEffect(() => {
    supabase.from('evenements').select('*').eq('id', id).eq('statut', 'approuve').single()
      .then(async ({ data }) => {
        setEv(data as Evenement)
        if (data && !data.image_url?.trim() && data.categorie) {
          fetch(`/api/unsplash?categorie=${encodeURIComponent(data.categorie)}&q=${encodeURIComponent(data.titre)}`)
            .then(r => r.json())
            .then(img => { if (img.url) { setImageAuto(img.url); setImageAuteur(img.author) } })
            .catch(() => {})
        }
        if (data) {
          const { data: sims } = await supabase.from('evenements').select('*')
            .eq('categorie', data.categorie).eq('statut', 'approuve').neq('id', id).limit(3)
          setSimilaires((sims as Evenement[]) || [])
          // F8 — Charger occurrences futures si événement récurrent
if (data?.est_recurrent) {
  const aujourd_hui = new Date().toISOString().split('T')[0]
  const { data: occ } = await supabase.from('evenements')
    .select('id, titre, date, heure_debut, statut')
    .eq('parent_id', data.id)
    .eq('statut', 'approuve')
    .gte('date', aujourd_hui)
    .order('date', { ascending: true })
    .limit(8)
  setOccurrences((occ as Evenement[]) || [])
}

// F8 — Si c'est une occurrence, charger le parent
if (data?.parent_id) {
  const { data: parent } = await supabase.from('evenements')
  .select('id, titre, lieu, date, categorie, image_url')
    .eq('id', data.parent_id)
    .single()
  if (parent) setSimilaires([parent as Evenement])
}
          const { count } = await supabase.from('participations')
            .select('*', { count: 'exact', head: true }).eq('evenement_id', id)
          setNbParticipants(count || 0)
        }

        // Charger commentaires + réponses + réactions
        const { data: comms } = await supabase.from('commentaires').select('*')
          .eq('evenement_id', id).order('created_at', { ascending: false })

        if (comms) {
          // Charger les réactions pour tous les commentaires
          const ids = comms.map((c: Commentaire) => c.id)
          const { data: reactions } = await supabase.from('reactions')
            .select('commentaire_id, emoji').in('commentaire_id', ids)

          // Agréger réactions par commentaire
          const reactionsMap: Record<string, Record<string, number>> = {}
          if (reactions) {
            for (const r of reactions as { commentaire_id: string; emoji: string }[]) {
              if (!reactionsMap[r.commentaire_id]) reactionsMap[r.commentaire_id] = {}
              reactionsMap[r.commentaire_id][r.emoji] = (reactionsMap[r.commentaire_id][r.emoji] || 0) + 1
            }
          }

          // Charger les photos de profil des auteurs
          const userIds = [...new Set(
            comms.map((c: Commentaire) => c.user_id).filter(Boolean) as string[]
          )]
          const photosMap: Record<string, string | null> = {}
          if (userIds.length > 0) {
            const { data: profils } = await supabase
              .from('profiles').select('id, photo_url').in('id', userIds)
            for (const p of (profils || []) as { id: string; photo_url: string | null }[]) {
              photosMap[p.id] = p.photo_url
            }
          }

          // Construire arbre parent/enfants
          const tousLesCommentaires: Commentaire[] = comms.map((c: Commentaire) => ({
            ...c,
            reactions: reactionsMap[c.id] || {},
            photo_url: c.user_id ? (photosMap[c.user_id] ?? null) : null,
            reponses: [],
          }))

          const racines: Commentaire[] = []
          const map: Record<string, Commentaire> = {}
          tousLesCommentaires.forEach(c => { map[c.id] = c })
          tousLesCommentaires.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
              map[c.parent_id].reponses = map[c.parent_id].reponses || []
              map[c.parent_id].reponses!.push(c)
            } else if (!c.parent_id) {
              racines.push(c)
            }
          })

          setCommentaires(tousLesCommentaires)
        }

        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!id) return
    const likes = JSON.parse(localStorage.getItem('lotbo_likes') || '{}')
    const count = JSON.parse(localStorage.getItem('lotbo_likes_count') || '{}')
    setLiked(!!likes[id as string])
    setNbLikes(count[id as string] || 0)
    const participations = JSON.parse(localStorage.getItem('lotbo_participations') || '{}')
    setSeraiLa(!!participations[id as string])
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.user_metadata?.role === 'admin') setIsAdmin(true)
      setIsConnected(!!session?.user)
      if (session?.user?.id) {
        const { data: profil } = await supabase
          .from('profiles').select('id, nom, photo_url').eq('id', session.user.id).single()
        if (profil) {
          setUserProfile({
            id: profil.id,
            nom: profil.nom || session.user.user_metadata?.full_name || session.user.email || 'Anonyme',
            photo_url: profil.photo_url ?? null,
          })
        }
        // Charger rôle org si événement lié à une organisation
        const { data: evOrg } = await supabase
          .from('evenements').select('organisation_id').eq('id', id).single()
        if (evOrg?.organisation_id) {
          const { data: membre } = await supabase
            .from('organisation_membres')
            .select('role')
            .eq('org_id', evOrg.organisation_id)
            .eq('user_id', session.user.id)
            .maybeSingle()
          setRoleOrg(membre?.role ?? null)
        }
      }
    })
    const expressions = JSON.parse(localStorage.getItem('lotbo_expressions') || '{}')
    if (expressions[id as string]) setExpressionChoisie(expressions[id as string])
  }, [id])

  const handleLike = () => {
  if (!id) return
  const likes = JSON.parse(localStorage.getItem('lotbo_likes') || '{}')
  const count = JSON.parse(localStorage.getItem('lotbo_likes_count') || '{}')
  if (liked) { delete likes[id as string]; count[id as string] = Math.max(0, (count[id as string] || 1) - 1) }
  else {
    likes[id as string] = true
    count[id as string] = (count[id as string] || 0) + 1
    // GM1 — Points like
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        attributerPoints({ user_id: session.user.id, action: 'liker', evenement_id: id as string, type_role: 'utilisateur' })
      }
    })
  }
  localStorage.setItem('lotbo_likes', JSON.stringify(likes))
  localStorage.setItem('lotbo_likes_count', JSON.stringify(count))
  setLiked(!liked); setNbLikes(count[id as string])
}

  const handleSeraiLa = async () => {
    if (!id || loadingParticipation) return
    setLoadingParticipation(true)
    const participations = JSON.parse(localStorage.getItem('lotbo_participations') || '{}')
    const sessionId = getSessionId()
    if (seraiLa) {
      await supabase.from('participations').delete().eq('evenement_id', id).eq('session_id', sessionId)
      delete participations[id as string]
      setNbParticipants(n => Math.max(0, n - 1))
      setSeraiLa(false)
    } else {
      await supabase.from('participations').insert([{ evenement_id: id, session_id: sessionId }])
      participations[id as string] = true
      setNbParticipants(n => n + 1)
      setSeraiLa(true)
      // GM1 — Points "Je serai là"
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user?.id) {
    attributerPoints({ user_id: session.user.id, action: 'serai_la', evenement_id: id as string, type_role: 'utilisateur' })
  }
})
      setCarteVisuelleouverte(true)
    }
    localStorage.setItem('lotbo_participations', JSON.stringify(participations))
    setLoadingParticipation(false)
  }

  const handleSignalement = async () => {
    if (!raisonSignalement || !ev) return
    setErreurSignalement('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('signalements').insert([{
      evenement_id: ev.id,
      raison: raisonSignalement,
      user_id: session?.user?.id ?? null,
    }])
    if (error) {
      setErreurSignalement('Une erreur est survenue. Réessaie plus tard.')
      return
    }
    setSignalementEnvoye(true)
    setSignalementModal(false)
  }

  // E11 — Ajouter une réponse à l'arbre local
  const handleNouvelleReponse = (parentId: string, reponse: Commentaire) => {
    setCommentaires(prev => prev.map(c => {
      if (c.id === parentId) {
        return { ...c, reponses: [...(c.reponses || []), reponse] }
      }
      return c
    }))
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8' }} className="flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  if (!ev) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8' }} className="flex items-center justify-center">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8C5A40', marginBottom: 16 }}>Événement introuvable.</p>
        <button onClick={() => router.push('/')} style={{ background: '#C8431A', color: '#F7F2E8', padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14 }}>Retour à la carte</button>
      </div>
    </main>
  )

  const urlEvenement  = 'https://app.lotbo.app/evenement/' + ev.id
  const texteWhatsapp = 'Découvre cet événement sur Lotbo : ' + ev.titre + ' — ' + urlEvenement
  const urlWhatsapp   = 'https://wa.me/?text=' + encodeURIComponent(texteWhatsapp)
  const urlFacebook   = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(urlEvenement)
  const urlGoogleMaps = 'https://www.google.com/maps/dir/?api=1&destination=' + ev.latitude + ',' + ev.longitude
  const periodeAffichee = afficherPeriode(ev)
  const estMultiJours   = ev.date_fin && ev.date_fin !== ev.date
  const enLigne         = estEnLigne(ev.lieu || '')
  const sansCoordonnes  = adresseIncomplete(ev)

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>

      {carteVisuelleouverte && (
        <CarteVisuelle
          evenement={{ titre: ev.titre, lieu: ev.lieu, date: ev.date, date_fin: ev.date_fin ?? undefined, image_url: ev.image_url ?? undefined }}
          expression={expressionChoisie}
          onClose={() => setCarteVisuelleouverte(false)}
        />
      )}

      {propositionModal && (
        <>
          <div
            onClick={() => { setPropositionModal(false); setPropositionEnvoyee(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51, background: '#F7F2E8', borderTop: '1px solid #E8E0D0', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>Proposer une correction</h3>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
              Ta proposition sera examinée avant publication. Merci de contribuer à la qualité des informations.
            </p>
            {propositionEnvoyee ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
                <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Proposition envoyée !</p>
                <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 20 }}>Elle sera examinée par notre équipe. Merci !</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => {
                      setPropositionEnvoyee(false)
                      setPropositionForm({ champ_modifie: 'titre', ancienne_valeur: ev?.titre || '', nouvelle_valeur: '' })
                    }}
                    style={{
                      background: '#C8431A', color: '#F7F2E8', border: 'none',
                      borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 'bold',
                      cursor: 'pointer', width: '100%',
                    }}
                  >
                    ✏️ Proposer une autre correction
                  </button>
                  <button
                    onClick={() => { setPropositionModal(false); setPropositionEnvoyee(false) }}
                    style={{
                      background: 'transparent', color: '#8C5A40', border: 'none',
                      fontSize: 13, cursor: 'pointer', padding: '6px',
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Champ à modifier</label>
                  <select
                    value={propositionForm.champ_modifie}
                    onChange={e => {
                      const champ = e.target.value
                      const valeurs: Record<string, string> = {
                        titre:       ev?.titre || '',
                        lieu:        ev?.lieu || '',
                        date:        ev?.date || '',
                        description: ev?.description || '',
                        lien:        ev?.lien || '',
                      }
                      setPropositionForm(f => ({ ...f, champ_modifie: champ, ancienne_valeur: valeurs[champ] || '', nouvelle_valeur: '' }))
                    }}
                    style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%' }}
                  >
                    <option value="titre">Titre</option>
                    <option value="lieu">Lieu</option>
                    <option value="date">Date</option>
                    <option value="description">Description</option>
                    <option value="lien">Lien officiel</option>
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Valeur actuelle</label>
                  <div style={{ background: 'rgba(26,20,16,0.04)', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#8C5A40', fontSize: 13 }}>
                    {propositionForm.ancienne_valeur || '(vide)'}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Valeur corrigée *</label>
                  {propositionForm.champ_modifie === 'description' ? (
                    <textarea
                      value={propositionForm.nouvelle_valeur}
                      onChange={e => setPropositionForm(f => ({ ...f, nouvelle_valeur: e.target.value }))}
                      placeholder="Nouvelle valeur..."
                      rows={4}
                      style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <input
                      type={propositionForm.champ_modifie === 'date' ? 'date' : 'text'}
                      value={propositionForm.nouvelle_valeur}
                      onChange={e => setPropositionForm(f => ({ ...f, nouvelle_valeur: e.target.value }))}
                      placeholder="Nouvelle valeur..."
                      style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%' }}
                    />
                  )}
                </div>
                <button
                  disabled={!propositionForm.nouvelle_valeur.trim()}
                  onClick={async () => {
                    if (!ev || !userProfile) return
                    const { error } = await supabase.from('propositions_modifications').insert([{
                      evenement_id:    ev.id,
                      proposant_id:    userProfile.id,
                      champ_modifie:   propositionForm.champ_modifie,
                      ancienne_valeur: propositionForm.ancienne_valeur || null,
                      nouvelle_valeur: propositionForm.nouvelle_valeur.trim(),
                      statut:          'en_attente',
                    }])
                    if (!error) {
                      setPropositionEnvoyee(true)
                      supabase.from('notifications').insert([{
                        user_id: 'ff21f2e0-135d-4996-9713-4a0e20c38fe1',
                        type:    'proposition_modification',
                        titre:   `Correction proposée — ${ev.titre}`,
                        message: `${userProfile.nom} propose de corriger "${propositionForm.champ_modifie}"`,
                        lien:    '/admin',
                        lu:      false,
                      }]).then(() => {})
                      setTimeout(() => { setPropositionModal(false); setPropositionEnvoyee(false) }, 3000)
                    }
                  }}
                  style={{
                    width: '100%', padding: '13px',
                    background: propositionForm.nouvelle_valeur.trim() ? '#C8431A' : 'rgba(26,20,16,0.1)',
                    color: propositionForm.nouvelle_valeur.trim() ? '#F7F2E8' : '#8C5A40',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold',
                    cursor: propositionForm.nouvelle_valeur.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Envoyer la proposition →
                </button>
              </>
            )}
          </div>
        </>
      )}

      {signalementModal && (
        <>
          <div onClick={() => { setSignalementModal(false); setSignalementConfirmation(false); setRaisonSignalement(''); setErreurSignalement('') }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51, background: '#F7F2E8', borderTop: '1px solid #E8E0D0', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Signaler cet événement</h3>

            {!signalementConfirmation ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {[
                    'Information incorrecte ou fausse date',
                    'Événement annulé non mis à jour',
                    'Contenu dangereux ou illégal',
                    'Spam ou doublon',
                  ].map(raison => (
                    <button key={raison} onClick={() => setRaisonSignalement(raison)} style={{
                      padding: '12px 16px', borderRadius: 10, fontSize: 14, textAlign: 'left', cursor: 'pointer',
                      background: raisonSignalement === raison ? 'rgba(200,67,26,0.15)' : 'white',
                      border: raisonSignalement === raison ? '1px solid #C8431A' : '1px solid #E8E0D0',
                      color: '#1A1410',
                    }}>{raison}</button>
                  ))}
                </div>
                <button
                  onClick={() => setSignalementConfirmation(true)}
                  disabled={!raisonSignalement}
                  style={{
                    width: '100%', padding: '13px',
                    background: raisonSignalement ? '#C8431A' : 'rgba(255,255,255,0.04)',
                    color: raisonSignalement ? '#F7F2E8' : '#555',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold',
                    cursor: raisonSignalement ? 'pointer' : 'not-allowed',
                  }}
                >Envoyer le signalement</button>
              </>
            ) : (
              <>
                <p style={{ color: '#1A1410', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  Confirmer le signalement pour :{' '}
                  <strong style={{ color: '#C8431A' }}>{raisonSignalement}</strong> ?
                </p>
                {erreurSignalement && (
                  <p style={{ color: '#C8431A', fontSize: 13, background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                    {erreurSignalement}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setSignalementConfirmation(false); setErreurSignalement('') }}
                    style={{ flex: 1, background: 'white', border: '1px solid #E8E0D0', color: '#8C5A40', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 'bold' }}
                  >Annuler</button>
                  <button
                    onClick={handleSignalement}
                    style={{ flex: 2, background: '#C8431A', color: '#F7F2E8', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 'bold' }}
                  >Confirmer le signalement</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {claimModal && (
        <>
          <div onClick={() => { setClaimModal(false); setClaimEnvoye(false); setClaimMessage('') }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51, background: '#F7F2E8', borderTop: '1px solid #E8E0D0', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <h3 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>C'est mon événement</h3>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
              Ta demande sera examinée par notre équipe. Si validée, tu deviendras propriétaire de cet événement.
            </p>
            {claimEnvoye ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
                <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Demande envoyée !</p>
                <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 20 }}>Notre équipe va examiner ta réclamation. Merci !</p>
                <button onClick={() => { setClaimModal(false); setClaimEnvoye(false) }} style={{ background: '#C8431A', color: '#F7F2E8', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Explique pourquoi cet événement t'appartient (optionnel)</label>
                  <textarea
                    value={claimMessage}
                    onChange={e => setClaimMessage(e.target.value)}
                    placeholder="Ex: Je suis l'organisateur, mon nom est dans la description..."
                    rows={3}
                    maxLength={300}
                    style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: '#1A1410', fontSize: 14, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <button
                  disabled={claimLoading}
                  onClick={async () => {
                    if (!userProfile) return
                    setClaimLoading(true)
                    const { error } = await supabase.from('reclamations_evenements').insert([{
                      evenement_id: ev.id,
                      reclamant_id: userProfile.id,
                      message: claimMessage.trim() || null,
                      statut: 'en_attente',
                    }])
                    if (!error) {
                      supabase.from('notifications').insert([{
                        user_id: 'ff21f2e0-135d-4996-9713-4a0e20c38fe1',
                        type: 'reclamation',
                        titre: `Réclamation — ${ev.titre}`,
                        message: `${userProfile.nom} réclame la propriété de "${ev.titre}"`,
                        lien: '/admin',
                        lu: false,
                      }]).then(() => {})
                      setClaimEnvoye(true)
                    }
                    setClaimLoading(false)
                  }}
                  style={{
                    width: '100%', padding: '13px',
                    background: claimLoading ? 'rgba(26,20,16,0.1)' : '#C8431A',
                    color: claimLoading ? '#8C5A40' : '#F7F2E8',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold',
                    cursor: claimLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {claimLoading ? '...' : 'Envoyer ma réclamation →'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      <div style={{ width: '100%', height: 280, overflow: 'hidden', position: 'relative' }}>
        <img src={ev.image_url || imageAuto || getEventImage(null, ev.categorie)} alt={ev.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {!ev.image_url && imageAuteur && (
          <p style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            Photo: {imageAuteur} / Unsplash
          </p>
        )}
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 64px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            ← Retour à la carte
          </button>
          {isAdmin && (
  <button onClick={async () => {
    // Si l'événement a un parent_id (occurrence récurrente)
    if (ev.parent_id) {
      const choix = window.confirm(
        'Mettre hors ligne toutes les occurrences futures ?\n\nOK = Toutes les occurrences\nAnnuler = Seulement cet événement'
      )
      if (choix) {
        // Toutes les occurrences du même parent
        await supabase.from('evenements')
          .update({ statut: 'hors_ligne' })
          .eq('parent_id', ev.parent_id)
        await supabase.from('evenements')
          .update({ statut: 'hors_ligne' })
          .eq('id', ev.parent_id)
      } else {
        // Seulement cet événement
        await supabase.from('evenements')
          .update({ statut: 'hors_ligne' })
          .eq('id', ev.id)
      }
    } else {
      if (!confirm('Mettre cet événement hors ligne ?')) return
      await supabase.from('evenements')
        .update({ statut: 'hors_ligne' })
        .eq('id', ev.id)
    }
    alert('Événement(s) mis hors ligne ✓')
    router.push('/')
  }} style={{ background: 'rgba(212,168,32,0.15)', border: '1px solid rgba(212,168,32,0.4)', color: '#D4A820', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
    ⚠️ Mettre hors ligne
  </button>
)}
        </div>

        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 'bold', marginBottom: 16, fontFamily: 'serif', fontStyle: 'italic', color: '#1A1410', lineHeight: 1.2 }}>{ev.titre}</h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>{ev.categorie}</span>
          {enLigne && <span style={{ background: 'rgba(45,158,107,0.15)', color: '#2D9E6B', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>🌐 En ligne</span>}
          {estMultiJours && <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>🗓️ Multi-jours</span>}
          <span style={{ background: 'rgba(26,20,16,0.04)', color: '#8C5A40', padding: '4px 12px', borderRadius: 999, fontSize: 13 }}>{ev.acces || 'public'}</span>
          <span style={{ background: 'rgba(26,20,16,0.04)', color: '#8C5A40', padding: '4px 12px', borderRadius: 999, fontSize: 13 }}>{ev.prix || 'gratuit'}</span>
          {nbParticipants > 0 && (
            <span style={{ background: 'rgba(200,67,26,0.1)', color: '#C8431A', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>
              🙋 {nbParticipants} {nbParticipants === 1 ? 'personne' : 'personnes'} seront là
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {enLigne ? (
            <p style={{ color: '#8C5A40', fontSize: 15 }}>🌐 <span style={{ color: '#1A1410', fontWeight: 'bold' }}>{ev.lieu}</span></p>
          ) : sansCoordonnes ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <p style={{ color: '#8C5A40', fontSize: 15 }}>📍 <span style={{ color: '#1A1410', fontWeight: 'bold' }}>{ev.lieu || 'Lieu à confirmer'}</span></p>
              <span style={{ background: 'rgba(212,168,32,0.12)', color: '#D4A820', border: '1px solid rgba(212,168,32,0.3)', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>📍 Adresse non communiquée</span>
            </div>
          ) : (
            <p style={{ color: '#8C5A40', fontSize: 15 }}>📍 <span style={{ color: '#1A1410', fontWeight: 'bold' }}>{ev.lieu}</span></p>
          )}
          <p style={{ color: '#8C5A40', fontSize: 15 }}>📅 <span style={{ color: '#1A1410' }}>{periodeAffichee}</span></p>
          {ev.heure_debut && (
            <p style={{ color: '#8C5A40', fontSize: 15 }}>
              🕐 <span style={{ color: '#1A1410' }}>
                {afficherHeureFuseau(ev.heure_debut, ev.fuseau_organisateur || 'America/Port-au-Prince')}
                {ev.heure_fin ? ` → ${afficherHeureFuseau(ev.heure_fin, ev.fuseau_organisateur || 'America/Port-au-Prince')}` : ''}
              </span>
            </p>
          )}
          {ev.organisateur && <p style={{ color: '#8C5A40', fontSize: 15 }}>👤 <span style={{ color: '#1A1410' }}>{ev.organisateur}</span></p>}
          {!enLigne && !sansCoordonnes && ev.latitude && ev.longitude && (
            <a href={urlGoogleMaps} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: '#1A1410', fontSize: 14, fontWeight: 'bold' }}>
              <span style={{ fontSize: 20 }}>🧭</span>S'y rendre · Ouvrir dans Google Maps
            </a>
          )}
          {enLigne && ev.lien && (
            <a href={ev.lien} target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(45,158,107,0.1)', border: '1px solid rgba(45,158,107,0.3)', borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: '#2D9E6B', fontSize: 14, fontWeight: 'bold' }}>
              <span style={{ fontSize: 20 }}>🌐</span>Rejoindre l'événement en ligne →
            </a>
          )}
        </div>

        {ev.description && (
          <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#1A1410' }}>À propos</h2>
            <p style={{ color: '#3D2B1F', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>{ev.description}</p>
          </div>
        )}

        {ev.lien && !enLigne && (
          <a href={ev.lien} target="_blank" style={{ display: 'block', width: '100%', textAlign: 'center', background: '#C8431A', color: '#F7F2E8', fontWeight: 'bold', padding: '14px', borderRadius: 12, marginBottom: 12, textDecoration: 'none', fontSize: 15 }}>
            Plus de détails →
          </a>
        )}

        <div style={{ marginBottom: 16 }}>
          <button onClick={handleSeraiLa} disabled={loadingParticipation} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            border: seraiLa ? '2px solid #C8431A' : '2px solid rgba(26,20,16,0.2)',
            background: seraiLa ? 'rgba(200,67,26,0.15)' : 'rgba(26,20,16,0.04)',
            color: seraiLa ? '#C8431A' : '#1A1410',
            fontSize: 16, fontWeight: 'bold', cursor: loadingParticipation ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 20 }}>{seraiLa ? '✅' : '🙋'}</span>
            <span>{seraiLa ? `${expressionChoisie} ✓` : 'Je serai là · M ap la'}</span>
            {nbParticipants > 0 && (
              <span style={{ background: seraiLa ? '#C8431A' : 'rgba(255,255,255,0.1)', color: seraiLa ? 'white' : '#8C5A40', padding: '2px 10px', borderRadius: 999, fontSize: 13 }}>
                {nbParticipants}
              </span>
            )}
          </button>
          {seraiLa && (
            <button onClick={() => setCarteVisuelleouverte(true)} style={{
              width: '100%', marginTop: 8, padding: '11px',
              background: 'white', border: '1px solid #E8E0D0',
              borderRadius: 10, color: '#8C5A40', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              🎨 Créer ma carte visuelle
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          {/* Ligne 1 — Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleLike} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: liked ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
              border: liked ? '1px solid #C8431A' : '1px solid #E8E0D0',
              borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
              color: liked ? '#C8431A' : '#8C5A40', fontSize: 13, fontWeight: 'bold', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</span>
              <span>J'aime{nbLikes > 0 ? ` ${nbLikes}` : ''}</span>
            </button>
            <button onClick={() => setSignalementModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'white', border: '1px solid #E8E0D0',
              borderRadius: 999, padding: '8px 12px', cursor: 'pointer', color: '#555', fontSize: 12,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span><span>Signaler</span>
            </button>
            {userProfile && (
              <button
                onClick={() => {
                  setPropositionForm({ champ_modifie: 'titre', ancienne_valeur: ev?.titre || '', nouvelle_valeur: '' })
                  setPropositionModal(true)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'white', border: '1px solid #E8E0D0',
                  borderRadius: 999, padding: '8px 12px', cursor: 'pointer', color: '#555', fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14 }}>✏️</span><span>Corriger</span>
              </button>
            )}
            {ev.user_id !== userProfile?.id && (
              <button
                onClick={() => {
                  if (!userProfile) {
                    window.location.href = '/login?redirect=/evenement/' + ev.id
                    return
                  }
                  setClaimModal(true)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'white', border: '1px solid #E8E0D0',
                  borderRadius: 999, padding: '8px 12px', cursor: 'pointer', color: '#555', fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14 }}>🔑</span><span>C'est mon événement</span>
              </button>
            )}
          </div>
          {/* Ligne 2 — Modifier (auteur ou membre org autorisé) */}
          {ev && (userProfile?.id === ev.user_id || roleOrg === 'owner' || roleOrg === 'admin' || roleOrg === 'editeur') && (
            <div style={{ marginBottom: 8 }}>
              <a href={`/evenement/${ev.id}/modifier`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(200,67,26,0.1)', color: '#C8431A',
                border: '1px solid rgba(200,67,26,0.3)',
                borderRadius: 999, padding: '8px 18px',
                fontSize: 13, fontWeight: 'bold', textDecoration: 'none',
              }}>
                ✏️ Modifier cet événement
              </a>
            </div>
          )}
          {/* Ligne 3 — Partage */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8C5A40', marginRight: 4 }}>Partager :</span>
            <a href={urlWhatsapp} target="_blank" title="WhatsApp" style={{ width: 38, height: 38, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href={urlFacebook} target="_blank" title="Facebook" style={{ width: 38, height: 38, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Découvre cet événement sur Lotbo : ' + ev.titre) + '&url=' + encodeURIComponent(urlEvenement)} target="_blank" title="X" style={{ width: 38, height: 38, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>𝕏</span>
            </a>
          </div>
        </div>

        <div style={{ height: 1, background: '#E8E0D0', marginBottom: 32 }} />

        {/* ── Commentaires E11 + E12 ── */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#1A1410' }}>
            Commentaires
          </h2>
          <CommentaireForm
            evenementId={ev.id}
            userProfile={userProfile}
            evenementTitre={ev.titre}
            onNouveau={(c) => setCommentaires(prev => [{ ...c, reponses: [], reactions: {} }, ...prev])}
          />
          <CommentairesList
            commentaires={commentaires}
            evenementId={ev.id}
            onNouvelleReponse={handleNouvelleReponse}
            userProfile={userProfile}
            evenementTitre={ev.titre}
          />
        </div>
{/* ── F8 — Lien vers série si occurrence ── */}
{ev.parent_id && similaires.length > 0 && (
  <div style={{ marginBottom: 24 }}>
    <a href={'/evenement/' + similaires[0].id} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)',
      borderRadius: 12, padding: '12px 16px', textDecoration: 'none', color: '#C8431A',
      fontSize: 13, fontWeight: 'bold',
    }}>
      🔄 ↑ Voir la série complète — {similaires[0].titre}
    </a>
  </div>
)}

{/* ── F8 — Occurrences futures si événement récurrent ── */}
{occurrences.length > 0 && (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1A1410' }}>
      🔄 Prochaines occurrences
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {occurrences.map(occ => (
        <a key={occ.id} href={'/evenement/' + occ.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', border: '1px solid #E8E0D0',
          borderRadius: 10, padding: '12px 16px',
          textDecoration: 'none', color: '#1A1410',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: 13, color: '#1A1410' }}>
                {new Date(occ.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {occ.heure_debut && (
                <p style={{ color: '#8C5A40', fontSize: 12 }}>🕐 {occ.heure_debut}</p>
              )}
            </div>
          </div>
          <span style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold' }}>→</span>
        </a>
      ))}
    </div>
  </div>
)}
        {/* F3 — Invitation connexion (non connecté) */}
        {!isConnected && (
          <div style={{ background: '#1A1410', borderRadius: 16, padding: '20px 16px', marginBottom: 24 }}>
            <p style={{ color: '#F7F2E8', fontSize: 15, fontWeight: 'bold', marginBottom: 6 }}>Vous aimez cet événement ?</p>
            <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Connectez-vous pour dire <strong style={{ color: '#F7F2E8' }}>Je serai là</strong> et partager cet événement avec vos amis.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/login"
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#F7F2E8', borderRadius: 999, padding: '10px 0', fontSize: 13, fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                Se connecter
              </a>
              <a href="/login?mode=inscription"
                style={{ flex: 1, background: '#C8431A', color: '#F7F2E8', borderRadius: 999, padding: '10px 0', fontSize: 13, fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                Créer un compte
              </a>
            </div>
          </div>
        )}

        {similaires.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1A1410' }}>Événements similaires</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {similaires.map(sim => (
                <a href={'/evenement/' + sim.id} key={sim.id} style={{ display: 'flex', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 12, textDecoration: 'none', color: '#1A1410' }}>
                  <img src={getEventImage(sim.image_url, sim.categorie)} alt={sim.titre} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { if (sim.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = getEventImage(null, sim.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sim.titre}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>{estEnLigne(sim.lieu || '') ? '🌐' : '📍'} {sim.lieu}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6 }}>📅 {afficherPeriode(sim)}</p>
                    <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{sim.categorie}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}