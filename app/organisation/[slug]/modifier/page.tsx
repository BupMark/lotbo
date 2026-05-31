'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

interface OrgRow {
  id: string
  nom: string
  slogan: string | null
  description: string | null
  ville: string | null
  pays: string | null
  site_web: string | null
  email_contact: string | null
  telephone: string | null
  logo_url: string | null
  owner_id: string
}

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

const ROLE_LABELS: Record<string, { label: string; couleur: string }> = {
  owner:   { label: 'Owner',   couleur: '#C8431A' },
  admin:   { label: 'Admin',   couleur: '#1D6A9E' },
  editeur: { label: 'Éditeur', couleur: '#1D9E75' },
  lecteur: { label: 'Lecteur', couleur: '#8C5A40' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'white', border: '1px solid #E8E0D0',
  borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1A1410',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  color: '#8C5A40', fontSize: 11, fontWeight: 'bold',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block',
}

export default function ModifierOrganisation() {
  const params  = useParams()
  const slug    = params?.slug as string
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [erreur, setErreur]             = useState<string | null>(null)
  const [orgId, setOrgId]               = useState<string>('')
  const [userRole, setUserRole]         = useState<string>('')

  const [nom, setNom]                   = useState('')
  const [slogan, setSlogan]             = useState('')
  const [description, setDescription]   = useState('')
  const [telephone, setTelephone]       = useState('')
  const [ville, setVille]               = useState('')
  const [pays, setPays]                 = useState('')
  const [siteWeb, setSiteWeb]           = useState('')
  const [emailContact, setEmailContact] = useState('')
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)

  const [membres, setMembres]           = useState<Membre[]>([])
  const [emailInvit, setEmailInvit]     = useState('')
  const [roleInvit, setRoleInvit]       = useState('editeur')
  const [invitLoading, setInvitLoading] = useState(false)
  const [invitMsg, setInvitMsg]         = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  const chargerMembres = async (oid: string) => {
    const { data: membresData } = await supabase
      .from('organisation_membres')
      .select('user_id, role')
      .eq('org_id', oid)

    if (!membresData || membresData.length === 0) { setMembres([]); return }

    const userIds = (membresData as MembreRow[]).map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nom')
      .in('id', userIds)

    setMembres((membresData as MembreRow[]).map(m => ({
      user_id: m.user_id,
      nom:     (profiles as ProfileRow[] ?? []).find(p => p.id === m.user_id)?.nom ?? null,
      email:   m.user_id.slice(0, 8) + '...',
      role:    m.role,
    })))
  }

  useEffect(() => {
    if (!slug) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const userId = data.session.user.id

      const { data: org } = await supabase
        .from('organisations')
        .select('id, nom, slogan, description, ville, pays, site_web, email_contact, telephone, logo_url, owner_id')
        .eq('slug', slug)
        .maybeSingle()

      if (!org) { router.push('/'); return }

      const o = org as OrgRow

      // Accès : owner direct ou admin via organisation_membres
      let role = ''
      if (o.owner_id === userId) {
        role = 'owner'
      } else {
        const { data: membreRow } = await supabase
          .from('organisation_membres')
          .select('role')
          .eq('org_id', o.id)
          .eq('user_id', userId)
          .maybeSingle()
        const r = (membreRow as { role: string } | null)?.role ?? ''
        if (!['owner', 'admin'].includes(r)) { router.push('/'); return }
        role = r
      }

      setUserRole(role)
      setOrgId(o.id)
      setNom(o.nom ?? '')
      setSlogan(o.slogan ?? '')
      setDescription(o.description ?? '')
      setTelephone(o.telephone ?? '')
      setVille(o.ville ?? '')
      setPays(o.pays ?? '')
      setSiteWeb(o.site_web ?? '')
      setEmailContact(o.email_contact ?? '')
      setLogoUrl(o.logo_url)
      setLoading(false)

      await chargerMembres(o.id)
    })
  }, [slug])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || !orgId) return
    setSubmitting(true)
    setErreur(null)

    let newLogoUrl = logoUrl

    if (logoFile) {
      const ext  = logoFile.name.split('.').pop() ?? 'jpg'
      const path = `org-${slug}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos-organisations')
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('logos-organisations').getPublicUrl(path)
        newLogoUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase
      .from('organisations')
      .update({
        nom:           nom.trim(),
        slogan:        slogan.trim() || null,
        description:   description.trim() || null,
        telephone:     telephone.trim() || null,
        ville:         ville.trim() || null,
        pays:          pays.trim() || null,
        site_web:      siteWeb.trim() || null,
        email_contact: emailContact.trim() || null,
        logo_url:      newLogoUrl,
      })
      .eq('id', orgId)

    if (error) {
      setErreur(error.message)
      setSubmitting(false)
      return
    }

    router.push(`/organisation/${slug}`)
  }

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

    const json = await res.json() as { error?: string }

    if (res.ok) {
      setInvitMsg({ type: 'ok', texte: `${emailInvit} ajouté comme ${ROLE_LABELS[roleInvit]?.label ?? roleInvit}` })
      setEmailInvit('')
      await chargerMembres(orgId)
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

  const previewSrc = logoPreview ?? logoUrl ?? null

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px 16px 80px' }}>

        <a href={`/organisation/${slug}`} style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Retour à la page
        </a>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', color: '#1A1410', marginBottom: 6 }}>
            Modifier l&apos;organisation
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Mets à jour les informations de ta page</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nom */}
          <div>
            <label style={labelStyle}>Nom de l&apos;organisation *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              required
              maxLength={80}
              style={inputStyle}
            />
          </div>

          {/* Logo */}
          <div>
            <label style={labelStyle}>Logo (optionnel)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {previewSrc ? (
                <img src={previewSrc} alt="Logo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E0D0', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E8E0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>🏢</div>
              )}
              <div style={{ flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 999, padding: '8px 16px', fontSize: 13, color: '#8C5A40', cursor: 'pointer', fontWeight: 'bold' }}>
                  {logoFile ? '📷 Changer' : previewSrc ? '📷 Remplacer' : '📷 Choisir une image'}
                </button>
                {logoFile && <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>{logoFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={400}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Slogan */}
          <div>
            <label style={labelStyle}>Slogan</label>
            <input
              type="text"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              maxLength={120}
              placeholder="Ex : Tous les événements, un seul endroit"
              style={inputStyle}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              maxLength={30}
              placeholder="+509 XXXX XXXX"
              style={inputStyle}
            />
          </div>

          {/* Ville / Pays */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ville</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)} maxLength={60} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <input type="text" value={pays} onChange={e => setPays(e.target.value)} maxLength={60} style={inputStyle} />
            </div>
          </div>

          {/* Site web */}
          <div>
            <label style={labelStyle}>Site web</label>
            <input type="url" value={siteWeb} onChange={e => setSiteWeb(e.target.value)} style={inputStyle} />
          </div>

          {/* Email de contact */}
          <div>
            <label style={labelStyle}>Email de contact</label>
            <input type="email" value={emailContact} onChange={e => setEmailContact(e.target.value)} style={inputStyle} />
          </div>

          {erreur && (
            <div style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#e57373', fontSize: 13 }}>❌ {erreur}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href={`/organisation/${slug}`}
              style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 999, padding: '14px', fontSize: 14, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}
            >
              Annuler
            </a>
            <button
              type="submit"
              disabled={submitting || !nom.trim()}
              style={{
                flex: 2, background: nom.trim() ? '#C8431A' : '#E8E0D0',
                color: nom.trim() ? 'white' : '#8C5A40',
                border: 'none', borderRadius: 999, padding: '14px', fontSize: 14, fontWeight: 'bold',
                cursor: nom.trim() && !submitting ? 'pointer' : 'default',
              }}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>

        </form>

        {/* ── Section Membres ──────────────────────────────────────────────── */}
        <div style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1410', marginBottom: 16 }}>
            👥 Membres de l&apos;organisation
          </h2>

          {/* Liste membres actuels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {membres.length === 0 ? (
              <p style={{ color: '#8C5A40', fontSize: 13 }}>Aucun membre enregistré.</p>
            ) : membres.map(m => {
              const rl = ROLE_LABELS[m.role] ?? { label: m.role, couleur: '#8C5A40' }
              return (
                <div
                  key={m.user_id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', gap: 8 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: '#1A1410', fontWeight: 'bold', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.nom ?? '—'}
                    </p>
                    <p style={{ fontSize: 11, color: '#8C5A40' }}>{m.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 'bold', color: rl.couleur,
                      background: rl.couleur + '18', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap',
                    }}>
                      {rl.label}
                    </span>
                    {userRole === 'owner' && m.role !== 'owner' && (
                      <button
                        onClick={() => handleRetirer(m.user_id, m.role)}
                        style={{ fontSize: 11, color: '#e57373', background: 'rgba(229,115,115,0.1)', border: '1px solid rgba(229,115,115,0.3)', borderRadius: 999, padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formulaire invitation */}
          <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410', marginBottom: 12 }}>Inviter un membre</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                value={emailInvit}
                onChange={e => { setEmailInvit(e.target.value); setInvitMsg(null) }}
                placeholder="email@exemple.com"
                style={{ ...inputStyle, padding: '10px 12px' }}
              />
              <select
                value={roleInvit}
                onChange={e => setRoleInvit(e.target.value)}
                style={{ ...inputStyle, padding: '10px 12px' }}
              >
                {userRole === 'owner' && <option value="admin">Admin</option>}
                <option value="editeur">Éditeur</option>
                <option value="lecteur">Lecteur</option>
              </select>
              <button
                onClick={handleInviter}
                disabled={invitLoading || !emailInvit.trim()}
                style={{
                  background: emailInvit.trim() ? '#C8431A' : '#E8E0D0',
                  color: emailInvit.trim() ? 'white' : '#8C5A40',
                  border: 'none', borderRadius: 999, padding: '10px 16px', fontSize: 13, fontWeight: 'bold',
                  cursor: emailInvit.trim() && !invitLoading ? 'pointer' : 'default',
                }}
              >
                {invitLoading ? 'Invitation...' : 'Inviter'}
              </button>
            </div>
            {invitMsg && (
              <div style={{
                marginTop: 10,
                background: invitMsg.type === 'ok' ? 'rgba(29,158,117,0.1)' : 'rgba(180,40,40,0.1)',
                border: `1px solid ${invitMsg.type === 'ok' ? 'rgba(29,158,117,0.3)' : 'rgba(180,40,40,0.3)'}`,
                borderRadius: 8, padding: '8px 12px',
              }}>
                <p style={{ color: invitMsg.type === 'ok' ? '#1D9E75' : '#e57373', fontSize: 13 }}>
                  {invitMsg.texte}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
