'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { id: 'Festival', icone: '🎉' },
  { id: 'Musique', icone: '🎵' },
  { id: 'Art', icone: '🎨' },
  { id: 'Culture', icone: '🎭' },
  { id: 'Sport', icone: '⚽' },
  { id: 'Gastronomie', icone: '🍽️' },
  { id: 'Conference', icone: '🎤' },
  { id: 'Littérature', icone: '📖' },
  { id: 'Technologie', icone: '💻' },
  { id: 'Autre', icone: '🌍' },
]

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid #333',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#F7F2E8',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const labelStyle = {
  color: '#8C5A40',
  fontSize: 12,
  marginBottom: 6,
  display: 'block' as const,
}

export default function Inscription() {
  const [email, setEmail]                       = useState('')
  const [ville, setVille]                       = useState('')
  const [categories, setCategories]             = useState<string[]>([])
  const [loading, setLoading]                   = useState(false)
  const [succes, setSucces]                     = useState(false)
  const [erreur, setErreur]                     = useState('')
  const [invitationToken, setInvitationToken]   = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const inv = p.get('invitation')
    if (inv) {
      setInvitationToken(inv)
      localStorage.setItem('lotbo_invitation_token', inv)
    }
  }, [])

  const toggleCategorie = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !ville) return
    setLoading(true)
    setErreur('')

    const { error } = await supabase.from('abonnements').insert([{ email, ville, categories }])

    if (error) {
      setLoading(false)
      if (error.code === '23505') {
        setErreur('Cet email est déjà inscrit.')
      } else {
        setErreur('Erreur : ' + error.message)
      }
      return
    }

    // Tenter d'accepter une invitation en attente si l'utilisateur est connecté
    const token = localStorage.getItem('lotbo_invitation_token')
    if (token) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/api/organisation/accepter-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        })
        localStorage.removeItem('lotbo_invitation_token')
      }
    }

    setLoading(false)
    setSucces(true)
  }

  if (succes) {
    return (
      <main style={{ minHeight: '100dvh', background: '#1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#F7F2E8', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>Tu es inscrit !</h2>
          <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
            Tu recevras un email dès qu'un événement près de <strong style={{ color: '#F7F2E8' }}>{ville}</strong> est disponible.
          </p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Catégories suivies : {categories.length > 0 ? categories.join(', ') : 'Toutes'}
          </p>
          <a href="/" style={{ background: '#C8431A', color: '#F7F2E8', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>
            Voir la carte →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', padding: '32px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Bandeau invitation */}
        {invitationToken && (
          <div style={{ background: 'rgba(200,67,26,0.12)', border: '1px solid rgba(200,67,26,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>🏢 Tu as été invité à rejoindre une organisation</p>
            <p style={{ color: '#8C5A40', fontSize: 12 }}>Crée ton compte pour accepter</p>
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 4 }}>
            <span style={{ color: '#F7F2E8' }}>lot</span>
            <span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <h1 style={{ color: '#F7F2E8', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            Recevoir les événements près de toi
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Inscris-toi pour recevoir un email dès qu'un nouvel événement dans ta ville est disponible sur Lotbo.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>Ta ville *</label>
            <input type="text" placeholder="Ex: Port-au-Prince, Paris, Montréal..." value={ville} onChange={e => setVille(e.target.value)} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>
              Catégories qui t&apos;intéressent
              <span style={{ color: '#555', marginLeft: 6 }}>(optionnel — toutes par défaut)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategorie(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 999, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: categories.includes(cat.id) ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: categories.includes(cat.id) ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    color: categories.includes(cat.id) ? '#F7F2E8' : '#8C5A40',
                  }}
                >
                  <span>{cat.icone}</span>
                  <span>{cat.id}</span>
                </button>
              ))}
            </div>
          </div>

          {erreur && <p style={{ color: '#e57373', fontSize: 13 }}>{erreur}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: loading ? '#8C5A40' : '#C8431A', color: '#F7F2E8', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}
          >
            {loading ? 'Inscription...' : "M'inscrire aux notifications →"}
          </button>

          <p style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>
            Aucun spam. Tu peux te désinscrire à tout moment.
          </p>

        </form>
      </div>
    </main>
  )
}
