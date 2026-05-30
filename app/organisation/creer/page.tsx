'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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
  const router = useRouter()

  const [loading, setLoading]         = useState(true)
  const [userId, setUserId]           = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [erreur, setErreur]           = useState<string | null>(null)

  const [nom, setNom]                 = useState('')
  const [description, setDescription] = useState('')
  const [ville, setVille]             = useState('')
  const [pays, setPays]               = useState('')
  const [siteWeb, setSiteWeb]         = useState('')
  const [emailContact, setEmailContact] = useState('')

  const slug = genererSlug(nom)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      setUserId(data.session.user.id)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !nom.trim()) return
    setSubmitting(true)
    setErreur(null)

    const { error } = await supabase.from('organisations').insert({
      nom:           nom.trim(),
      slug,
      description:   description.trim() || null,
      ville:         ville.trim() || null,
      pays:          pays.trim() || null,
      site_web:      siteWeb.trim() || null,
      email_contact: emailContact.trim() || null,
      owner_id:      userId,
      verified:      false,
    })

    if (error) {
      setErreur(
        error.message.includes('slug') || error.message.includes('unique')
          ? 'Ce nom est déjà utilisé, essaie un autre.'
          : error.message
      )
      setSubmitting(false)
      return
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
          ← Retour à la carte
        </a>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', color: '#1A1410', marginBottom: 6 }}>
            Créer une organisation
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Crée ta page publique sur Lotbo</p>
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
              placeholder="Ex : Festival Kreyòl"
              style={inputStyle}
            />
            {nom && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(200,67,26,0.06)', borderRadius: 8, border: '1px solid rgba(200,67,26,0.15)' }}>
                <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 2 }}>URL de votre page</p>
                <p style={{ color: '#C8431A', fontSize: 13 }}>
                  app.lotbo.app/organisation/<strong>{slug}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Décris ton organisation en quelques lignes"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Ville / Pays */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ville</label>
              <input
                type="text"
                value={ville}
                onChange={e => setVille(e.target.value)}
                maxLength={60}
                placeholder="Port-au-Prince"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <input
                type="text"
                value={pays}
                onChange={e => setPays(e.target.value)}
                maxLength={60}
                placeholder="Haïti"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Site web */}
          <div>
            <label style={labelStyle}>Site web</label>
            <input
              type="url"
              value={siteWeb}
              onChange={e => setSiteWeb(e.target.value)}
              placeholder="https://monsite.com"
              style={inputStyle}
            />
          </div>

          {/* Email de contact */}
          <div>
            <label style={labelStyle}>Email de contact</label>
            <input
              type="email"
              value={emailContact}
              onChange={e => setEmailContact(e.target.value)}
              placeholder="contact@monorg.com"
              style={inputStyle}
            />
          </div>

          {/* Erreur */}
          {erreur && (
            <div style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#e57373', fontSize: 13 }}>❌ {erreur}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !nom.trim()}
            style={{
              background: nom.trim() ? '#C8431A' : '#E8E0D0',
              color: nom.trim() ? 'white' : '#8C5A40',
              border: 'none', borderRadius: 999,
              padding: '14px', fontSize: 15, fontWeight: 'bold',
              cursor: nom.trim() && !submitting ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Création...' : "Créer l'organisation"}
          </button>

        </form>
      </div>
    </main>
  )
}
