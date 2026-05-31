'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

interface MembreRow {
  user_id: string
  role: string
}

interface ProfileRow {
  id: string
  nom: string | null
}

interface Membre {
  user_id: string
  nom: string | null
  email: string
  role: string
}

interface InvitationEnAttente {
  id: string
  email: string
  role: string
  expire_le: string
}

interface EvenementUser {
  id: string
  titre: string
  date: string
  date_debut: string | null
  statut: string
  organisation_id: string | null
}

const ROLE_CONFIG: Record<string, { label: string; couleur: string }> = {
  owner:   { label: 'Owner',   couleur: '#D4A820' },
  admin:   { label: 'Admin',   couleur: '#C8431A' },
  editeur: { label: 'Éditeur', couleur: '#2D9E6B' },
  lecteur: { label: 'Lecteur', couleur: '#8C5A40' },
}

function initiales(nom: string | null, fallback: string): string {
  if (!nom) return fallback.slice(0, 2).toUpperCase()
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'white', border: '1px solid #E8E0D0',
  borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#1A1410',
  outline: 'none', boxSizing: 'border-box',
}

export default function PageMembres() {
  const params = useParams()
  const slug   = params?.slug as string
  const router = useRouter()

  const [loading, setLoading]           = useState(true)
  const [orgId, setOrgId]               = useState('')
  const [orgNom, setOrgNom]             = useState('')
  const [userRole, setUserRole]         = useState('')
  const [userId, setUserId]             = useState('')
  const [membres, setMembres]           = useState<Membre[]>([])
  const [invitations, setInvitations]   = useState<InvitationEnAttente[]>([])
  const [emailInvit, setEmailInvit]     = useState('')
  const [roleInvit, setRoleInvit]       = useState('lecteur')
  const [invitLoading, setInvitLoading] = useState(false)
  const [invitMsg, setInvitMsg]         = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [mesEvenements, setMesEvenements] = useState<EvenementUser[]>([])
  const [transferLoading, setTransferLoading] = useState<string | null>(null)

  const chargerMembres = async (oid: string) => {
    const { data: membresData } = await supabase
      .from('organisation_membres')
      .select('user_id, role')
      .eq('org_id', oid)

    if (!membresData || membresData.length === 0) { setMembres([]); return }

    const ids = (membresData as MembreRow[]).map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nom')
      .in('id', ids)

    setMembres((membresData as MembreRow[]).map(m => ({
      user_id: m.user_id,
      nom:     (profiles as ProfileRow[] ?? []).find(p => p.id === m.user_id)?.nom ?? null,
      email:   m.user_id.slice(0, 8) + '...',
      role:    m.role,
    })))
  }

  const chargerInvitations = async (oid: string) => {
    const { data } = await supabase
      .from('invitations_org_en_attente')
      .select('id, email, role, expire_le')
      .eq('org_id', oid)
      .eq('statut', 'en_attente')
      .gt('expire_le', new Date().toISOString())
      .order('expire_le', { ascending: true })

    setInvitations((data as InvitationEnAttente[]) ?? [])
  }

  useEffect(() => {
    if (!slug) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const uid = data.session.user.id
      setUserId(uid)

      const { data: org } = await supabase
        .from('organisations')
        .select('id, nom, owner_id')
        .eq('slug', slug)
        .maybeSingle()

      if (!org) { router.push('/'); return }

      const o = org as { id: string; nom: string; owner_id: string }
      setOrgId(o.id)
      setOrgNom(o.nom)

      let role = ''
      if (o.owner_id === uid) {
        role = 'owner'
      } else {
        const { data: membreRow } = await supabase
          .from('organisation_membres')
          .select('role')
          .eq('org_id', o.id)
          .eq('user_id', uid)
          .maybeSingle()
        const r = (membreRow as { role: string } | null)?.role ?? ''
        if (!['owner', 'admin'].includes(r)) { router.push('/'); return }
        role = r
      }

      setUserRole(role)
      setLoading(false)
      await Promise.all([chargerMembres(o.id), chargerInvitations(o.id)])

      const { data: evData } = await supabase
        .from('evenements')
        .select('id, titre, date, date_debut, statut, organisation_id')
        .eq('user_id', uid)
        .is('organisation_id', null)
        .eq('statut', 'approuve')
        .order('date_debut', { ascending: false })
        .limit(50)
      setMesEvenements(evData || [])
    })
  }, [slug])

  const handleInviter = async () => {
    if (!emailInvit.trim()) return
    setInvitLoading(true)
    setInvitMsg(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setInvitLoading(false); return }

    const res = await fetch('/api/organisation/inviter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ org_id: orgId, email: emailInvit.trim(), role: roleInvit }),
    })

    const json = await res.json() as { error?: string; cas?: string }

    if (res.ok) {
      const msg =
        json.cas === 'ajout_direct'        ? 'Membre ajouté — email de confirmation envoyé' :
        json.cas === 'invitation_renvoyee' ? 'Invitation renvoyée' :
        'Invitation envoyée'
      setInvitMsg({ type: 'ok', texte: msg })
      setEmailInvit('')
      await Promise.all([chargerMembres(orgId), chargerInvitations(orgId)])
    } else {
      setInvitMsg({ type: 'err', texte: json.error ?? 'Erreur inconnue' })
    }
    setInvitLoading(false)
  }

  const handleRetirer = async (memberId: string, membreRole: string) => {
    if (userRole !== 'owner' || membreRole === 'owner') return
    const { error } = await supabase
      .from('organisation_membres')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', memberId)
    if (!error) await chargerMembres(orgId)
  }

  const handleAnnulerInvitation = async (invId: string) => {
    await supabase
      .from('invitations_org_en_attente')
      .delete()
      .eq('id', invId)
    await chargerInvitations(orgId)
  }

  const transfererEvenement = async (evenementId: string) => {
    if (!orgId) return
    setTransferLoading(evenementId)
    await supabase
      .from('evenements')
      .update({ organisation_id: orgId })
      .eq('id', evenementId)
    setMesEvenements(prev => prev.filter(e => e.id !== evenementId))
    setTransferLoading(null)
  }

  const waText = encodeURIComponent(`Rejoins ${orgNom} sur LOTBO 👉 https://app.lotbo.app/organisation/${slug}/rejoindre`)

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px 16px 80px' }}>

        <a href={`/organisation/${slug}`} style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Retour à l&apos;organisation
        </a>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', color: '#1A1410', marginBottom: 4 }}>
            👥 Membres
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 14 }}>{orgNom}</p>
        </div>

        {/* ── Liste membres actuels ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {membres.length === 0 && (
            <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Aucun membre enregistré
            </p>
          )}
          {membres.map(m => {
            const cfg = ROLE_CONFIG[m.role] ?? { label: m.role, couleur: '#8C5A40' }
            const ini = initiales(m.nom, m.user_id)
            const isMe = m.user_id === userId
            return (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: cfg.couleur + '22', border: `2px solid ${cfg.couleur}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 'bold', color: cfg.couleur }}>
                  {ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: '#1A1410', fontWeight: 'bold', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.nom ?? '—'}{isMe ? ' (toi)' : ''}
                  </p>
                  <p style={{ fontSize: 11, color: '#8C5A40' }}>{m.email}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 'bold', color: cfg.couleur, background: cfg.couleur + '18', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                  {userRole === 'owner' && m.role !== 'owner' && !isMe && (
                    <button
                      onClick={() => handleRetirer(m.user_id, m.role)}
                      style={{ fontSize: 11, color: '#e57373', background: 'rgba(229,115,115,0.1)', border: '1px solid rgba(229,115,115,0.3)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Invitations en attente ───────────────────────────────────── */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 12, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              ✉️ Invitations en attente
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invitations.map(inv => {
                const cfg = ROLE_CONFIG[inv.role] ?? { label: inv.role, couleur: '#8C5A40' }
                return (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(212,168,32,0.06)', border: '1px solid rgba(212,168,32,0.2)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#1A1410', fontWeight: 'bold', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.email}
                      </p>
                      <p style={{ fontSize: 11, color: '#8C5A40' }}>
                        Expire le {formatExpiry(inv.expire_le)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: cfg.couleur, background: cfg.couleur + '18', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                      <button
                        onClick={() => handleAnnulerInvitation(inv.id)}
                        style={{ fontSize: 11, color: '#8C5A40', background: 'white', border: '1px solid #E8E0D0', borderRadius: 999, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Transférer événements existants ──────────────────────────── */}
        {mesEvenements.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              📅 Rattacher mes événements à cette organisation
            </h2>
            <p style={{ fontSize: 12, color: '#8C5A40', marginBottom: 12 }}>
              Ces événements vous appartiennent et ne sont pas encore liés à une organisation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mesEvenements.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 'bold', fontSize: 13, color: '#1A1410', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.titre}</p>
                    <p style={{ fontSize: 11, color: '#8C5A40' }}>📅 {ev.date_debut || ev.date}</p>
                  </div>
                  <button
                    onClick={() => transfererEvenement(ev.id)}
                    disabled={transferLoading === ev.id}
                    style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', cursor: transferLoading === ev.id ? 'default' : 'pointer', flexShrink: 0, opacity: transferLoading === ev.id ? 0.6 : 1 }}
                  >
                    {transferLoading === ev.id ? '...' : 'Rattacher'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lien partage WhatsApp ─────────────────────────────────────── */}
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#25D366', color: 'white', borderRadius: 12, padding: '12px 16px', textDecoration: 'none', marginBottom: 24 }}
        >
          <span style={{ fontSize: 20 }}>📲</span>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: 13 }}>Partager le lien d&apos;invitation</p>
            <p style={{ fontSize: 11, opacity: 0.85 }}>Envoyer via WhatsApp</p>
          </div>
        </a>

        {/* ── Formulaire invitation ────────────────────────────────────── */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 14 }}>Inviter par email</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              value={emailInvit}
              onChange={e => { setEmailInvit(e.target.value); setInvitMsg(null) }}
              placeholder="email@exemple.com"
              style={inputStyle}
            />
            <select
              value={roleInvit}
              onChange={e => setRoleInvit(e.target.value)}
              style={inputStyle}
            >
              {userRole === 'owner' && <option value="admin">Admin — peut inviter et modifier</option>}
              <option value="editeur">Éditeur — peut ajouter des événements</option>
              <option value="lecteur">Lecteur — suit l&apos;organisation</option>
            </select>
            <button
              onClick={handleInviter}
              disabled={invitLoading || !emailInvit.trim()}
              style={{
                background: emailInvit.trim() ? '#C8431A' : '#E8E0D0',
                color: emailInvit.trim() ? 'white' : '#8C5A40',
                border: 'none', borderRadius: 999, padding: '11px 16px', fontSize: 13, fontWeight: 'bold',
                cursor: emailInvit.trim() && !invitLoading ? 'pointer' : 'default',
              }}
            >
              {invitLoading ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
          {invitMsg && (
            <div style={{
              marginTop: 10,
              background: invitMsg.type === 'ok' ? 'rgba(45,158,107,0.1)' : 'rgba(180,40,40,0.1)',
              border: `1px solid ${invitMsg.type === 'ok' ? 'rgba(45,158,107,0.3)' : 'rgba(180,40,40,0.3)'}`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <p style={{ color: invitMsg.type === 'ok' ? '#2D9E6B' : '#e57373', fontSize: 13 }}>
                {invitMsg.texte}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
