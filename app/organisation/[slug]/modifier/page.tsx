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

          <div>
            <label style={labelStyle}>Nom de l&apos;organisation *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} required maxLength={80} style={inputStyle} />
          </div>

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

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={400} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>Slogan</label>
            <input type="text" value={slogan} onChange={e => setSlogan(e.target.value)} maxLength={120} placeholder="Ex : Tous les événements, un seul endroit" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Téléphone</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} maxLength={30} placeholder="+509 XXXX XXXX" style={inputStyle} />
          </div>

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

          <div>
            <label style={labelStyle}>Site web</label>
            <input type="url" value={siteWeb} onChange={e => setSiteWeb(e.target.value)} style={inputStyle} />
          </div>

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
            <a href={`/organisation/${slug}`} style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 999, padding: '14px', fontSize: 14, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>
              Annuler
            </a>
            <button
              type="submit"
              disabled={submitting || !nom.trim()}
              style={{ flex: 2, background: nom.trim() ? '#C8431A' : '#E8E0D0', color: nom.trim() ? 'white' : '#8C5A40', border: 'none', borderRadius: 999, padding: '14px', fontSize: 14, fontWeight: 'bold', cursor: nom.trim() && !submitting ? 'pointer' : 'default' }}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>

        </form>

        {/* ── Gérer les membres ─────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <a
            href={`/organisation/${slug}/membres`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '14px 18px', textDecoration: 'none', color: '#1A1410' }}
          >
            <div>
              <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>👥 Gérer les membres</p>
              <p style={{ color: '#8C5A40', fontSize: 12 }}>Inviter, retirer, gérer les rôles</p>
            </div>
            <span style={{ color: '#8C5A40', fontSize: 18 }}>→</span>
          </a>
        </div>

        {/* ── Supprimer l'organisation (owner uniquement) ─────────────── */}
        {userRole === 'owner' && (
          <div style={{ marginTop: 16 }}>
            <a
              href={`/organisation/${slug}/modifier`}
              style={{ display: 'block', textAlign: 'center', color: '#e57373', fontSize: 12, textDecoration: 'none', padding: '8px' }}
            >
              Zone dangereuse — contacter le support pour supprimer
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
