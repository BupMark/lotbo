'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useLangue } from '../../../lib/useLangue'
import { getTraductions } from '../../../lib/i18n'

function genererSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
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

export default function CreerOrganisation() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { langue } = useLangue()
  const t = getTraductions(langue)

  const [loading, setLoading]           = useState(true)
  const [userId, setUserId]             = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [erreur, setErreur]             = useState<string | null>(null)

  const [nom, setNom]                   = useState('')
  const [slogan, setSlogan]             = useState('')
  const [description, setDescription]   = useState('')
  const [telephone, setTelephone]       = useState('')
  const [ville, setVille]               = useState('')
  const [pays, setPays]                 = useState('')
  const [siteWeb, setSiteWeb]           = useState('')
  const [emailContact, setEmailContact] = useState('')
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [categoriesDisponibles, setCategoriesDisponibles] = useState<{ id: number; libelle_fr: string }[]>([])
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<number[]>([])

  const slug = genererSlug(nom)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setUserId(data.session.user.id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    supabase
      .from('organisation_categories')
      .select('id, libelle_fr')
      .order('id', { ascending: true })
      .then(({ data }) => setCategoriesDisponibles(data ?? []))
  }, [])

  const toggleCategorie = (id: number) => {
    setCategoriesSelectionnees(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

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
    if (!userId || !nom.trim()) return
    setSubmitting(true)
    setErreur(null)

    let logoUrl: string | null = null

    if (logoFile) {
      const ext  = logoFile.name.split('.').pop() ?? 'jpg'
      const path = `org-${slug}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos-organisations')
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('logos-organisations').getPublicUrl(path)
        logoUrl = urlData.publicUrl
      }
    }

    const { data: orgData, error } = await supabase.from('organisations').insert({
      nom:           nom.trim(),
      slug,
      slogan:        slogan.trim() || null,
      description:   description.trim() || null,
      telephone:     telephone.trim() || null,
      ville:         ville.trim() || null,
      pays:          pays.trim() || null,
      site_web:      siteWeb.trim() || null,
      email_contact: emailContact.trim() || null,
      logo_url:      logoUrl,
      owner_id:      userId,
      verified:      false,
    }).select('id').single()

    if (error) {
      setErreur(
        error.message.includes('slug') || error.message.includes('unique')
          ? t.organisation.erreur_nom_deja_utilise
          : error.message
      )
      setSubmitting(false)
      return
    }

    if (orgData) {
      await supabase.from('organisation_membres').insert({
        org_id:    orgData.id,
        user_id:   userId,
        role:      'owner',
        joined_at: new Date().toISOString(),
      })

      if (categoriesSelectionnees.length > 0) {
        await supabase.from('organisation_categories_liees').insert(
          categoriesSelectionnees.map(categorie_id => ({ organisation_id: orgData.id, categorie_id }))
        )
      }
    }

    router.push(`/organisation/${slug}`)
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px 16px 80px' }}>

        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← {t.evenement.retour}
        </a>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', color: '#1A1410', marginBottom: 6 }}>
            {t.organisation.creer_titre}
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Crée ta page publique sur Lotbo</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nom */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_nom} *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              required
              maxLength={80}
              placeholder={t.organisation.creer_nom_placeholder}
              style={inputStyle}
            />
            {nom && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(200,67,26,0.06)', borderRadius: 8, border: '1px solid rgba(200,67,26,0.15)' }}>
                <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 2 }}>{t.organisation.slug_label}</p>
                <p style={{ color: '#C8431A', fontSize: 13 }}>
                  app.lotbo.app/organisation/<strong>{slug}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Logo */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_logo}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Aperçu logo" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E0D0', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8E0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🏢</div>
              )}
              <div style={{ flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 999, padding: '8px 16px', fontSize: 13, color: '#8C5A40', cursor: 'pointer', fontWeight: 'bold' }}>
                  {logoFile ? t.organisation.creer_logo_changer : t.organisation.creer_logo_choisir}
                </button>
                {logoFile && <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>{logoFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_description}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder={t.organisation.creer_description_placeholder}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Catégories d'activité */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_categories}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categoriesDisponibles.map(cat => {
                const selectionne = categoriesSelectionnees.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategorie(cat.id)}
                    style={{
                      background: selectionne ? '#C8431A' : 'white',
                      color: selectionne ? 'white' : '#8C5A40',
                      border: selectionne ? 'none' : '1px solid #E8E0D0',
                      borderRadius: 999, padding: '7px 14px',
                      fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                    }}
                  >
                    {cat.libelle_fr}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_slogan}</label>
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
            <label style={labelStyle}>{t.organisation.creer_telephone}</label>
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
              <label style={labelStyle}>{t.organisation.creer_ville}</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)} maxLength={60} placeholder="Port-au-Prince" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t.organisation.creer_pays}</label>
              <input type="text" value={pays} onChange={e => setPays(e.target.value)} maxLength={60} placeholder="Haïti" style={inputStyle} />
            </div>
          </div>

          {/* Site web */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_site}</label>
            <input type="url" value={siteWeb} onChange={e => setSiteWeb(e.target.value)} placeholder="https://monsite.com" style={inputStyle} />
          </div>

          {/* Email de contact */}
          <div>
            <label style={labelStyle}>{t.organisation.creer_email}</label>
            <input type="email" value={emailContact} onChange={e => setEmailContact(e.target.value)} placeholder="contact@monorg.com" style={inputStyle} />
          </div>

          {erreur && (
            <div style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#e57373', fontSize: 13 }}>❌ {erreur}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !nom.trim()}
            style={{
              background: nom.trim() ? '#C8431A' : '#E8E0D0',
              color: nom.trim() ? 'white' : '#8C5A40',
              border: 'none', borderRadius: 999, padding: '14px', fontSize: 15, fontWeight: 'bold',
              cursor: nom.trim() && !submitting ? 'pointer' : 'default', transition: 'background 0.15s',
            }}
          >
            {submitting ? t.organisation.creer_creation_en_cours : t.organisation.creer_publier}
          </button>

        </form>
      </div>
    </main>
  )
}
