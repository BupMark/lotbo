'use client'

/**
 * FEAT-ONBOARDING-CONSENT-1 — Interstitiel OAuth
 * Route : /consent
 *
 * Affiché APRÈS le retour OAuth (Google / Facebook / Apple)
 * uniquement si le profil n'a pas encore consent_cgu = true.
 *
 * Le callback auth/callback/route.ts redirige vers :
 *   /consent?redirect=/
 * au lieu de / directement, quand onboarding_complete = false.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { track } from '../../lib/amplitude'

const CGU_VERSION = 'v2-23juin2026'

export default function ConsentPage() {
  const [accepteCGU, setAccepteCGU]             = useState(false)
  const [accepteCharte, setAccepteCharte]       = useState(false)
  const [newsletter, setNewsletter]             = useState(false)
  const [alertes, setAlertes]                   = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(true)
  const [loading, setLoading]                   = useState(false)
  const [message, setMessage]                   = useState('')
  const [provider, setProvider]                 = useState('oauth')
  const [userName, setUserName]                 = useState('')
  const [sessionReady, setSessionReady]         = useState(false)

  const formulaireValide = accepteCGU && accepteCharte

  const getRedirect = () => {
    if (typeof window === 'undefined') return '/'
    const params = new URLSearchParams(window.location.search)
    return params.get('redirect') || '/'
  }

  // ── Charger la session et les infos utilisateur ────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Pas de session — renvoyer au login
        window.location.href = '/login'
        return
      }

      // Récupérer le profil pour vérifier si déjà consenti
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete, consent_cgu, auth_provider, nom')
        .eq('id', session.user.id)
        .single()

      if (profile?.onboarding_complete && profile?.consent_cgu) {
        // Déjà consenti — rediriger directement
        window.location.href = getRedirect()
        return
      }

      // Récupérer le provider depuis sessionStorage (stocké avant le redirect OAuth)
      const storedProvider = sessionStorage.getItem('lotbo_oauth_provider') || 'oauth'
      setProvider(storedProvider)
      sessionStorage.removeItem('lotbo_oauth_provider')

      // Nom depuis metadata ou profil
      const nom = profile?.nom || session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
      if (nom) setUserName(nom.split(' ')[0]) // Prénom seulement

      setSessionReady(true)
    }
    init()
  }, [])

  // ── Valider le consentement ────────────────────────────────────────────────
  const handleConsent = async () => {
    if (!formulaireValide) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage('Session expirée. Merci de te reconnecter.')
      setLoading(false)
      return
    }

    const now = new Date().toISOString()

    const { error } = await supabase.from('profiles').update({
      consent_cgu:         true,
      consent_cgu_at:      now,
      consent_cgu_version: CGU_VERSION,
      charte_membres:      true,
      charte_membres_at:   now,
      consent_newsletter:  newsletter,
      consent_alertes:     alertes,
      consent_analytics:   analyticsConsent,
      auth_provider:       provider,
      onboarding_complete: true,
    }).eq('id', session.user.id)

    if (error) {
      setMessage('Une erreur est survenue. Réessaie.')
      setLoading(false)
      return
    }

    // Fil d'activité communautaire — nouveau_membre (session déjà disponible ci-dessus)
    fetch('/api/activite-communautaire/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type: 'nouveau_membre', ville: null, contenu: {} }),
    }).catch(() => {})

    // Newsletter si opt-in
    if (newsletter) {
      try {
        await supabase.from('abonnements').upsert(
          [{ email: session.user.email }],
          { onConflict: 'email' }
        )
      } catch {}
    }

    track('user_consent_completed', {
      user_id:    session.user.id,
      provider,
      newsletter,
      alertes,
      analytics:  analyticsConsent,
    })

    window.location.href = getRedirect()
  }

  // ── Icône provider ─────────────────────────────────────────────────────────
  const providerLabel: Record<string, string> = {
    google:   'Google',
    facebook: 'Facebook',
    apple:    'Apple',
    oauth:    'ton compte',
  }

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
  }

  const checkboxLabelStyle: React.CSSProperties = {
    color: '#8C5A40', fontSize: 12, lineHeight: 1.5,
  }

  // ── Chargement ─────────────────────────────────────────────────────────────
  if (!sessionReady) {
    return (
      <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 32, fontWeight: 'bold', marginBottom: 24 }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <p style={{ color: '#8C5A40', fontSize: 14 }}>Chargement...</p>
        </div>
      </main>
    )
  }

  // ── Interstitiel consentement ──────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 36, fontWeight: 'bold' }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
          </div>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#1A1410', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            {userName ? `Bienvenue ${userName} 🌍` : 'Bienvenue sur LOTBO 🌍'}
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            Tu as rejoint LOTBO via {providerLabel[provider]}. Avant de commencer, lis et accepte nos engagements.
          </p>
        </div>

        {/* Bloc consentements */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>

          {/* Section obligatoire */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0E8DC' }}>
            <p style={{ color: '#1A1410', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12, opacity: 0.5 }}>
              Requis
            </p>

            {/* CGU */}
            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={accepteCGU}
                onChange={e => setAccepteCGU(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={checkboxLabelStyle}>
                J&apos;accepte les{' '}
                <a href="/cgu" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>CGU</a>
                {' '}et la{' '}
                <a href="/politique-confidentialite" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>Politique de confidentialité</a>
                {' '}<span style={{ color: '#C8431A' }}>*</span>
              </span>
            </label>

            {/* Charte membres */}
            <label style={{ ...checkboxRowStyle, marginTop: 10 }}>
              <input
                type="checkbox"
                checked={accepteCharte}
                onChange={e => setAccepteCharte(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={checkboxLabelStyle}>
                J&apos;accepte la{' '}
                <a href="/charte-membres" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>Charte des membres</a>
                {' '}<span style={{ color: '#C8431A' }}>*</span>
              </span>
            </label>
          </div>

          {/* Section optionnelle */}
          <div style={{ padding: '14px 16px' }}>
            <p style={{ color: '#1A1410', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12, opacity: 0.5 }}>
              Facultatif
            </p>

            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={newsletter}
                onChange={e => setNewsletter(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={checkboxLabelStyle}>Recevoir la newsletter LOTBO</span>
            </label>

            <label style={{ ...checkboxRowStyle, marginTop: 10 }}>
              <input
                type="checkbox"
                checked={alertes}
                onChange={e => setAlertes(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={checkboxLabelStyle}>Recevoir des alertes sur mes favoris</span>
            </label>

            <label style={{ ...checkboxRowStyle, marginTop: 10 }}>
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={e => setAnalyticsConsent(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={checkboxLabelStyle}>
                Analytics anonymisés pour améliorer LOTBO{' '}
                <span style={{ opacity: 0.6 }}>(pré-coché, aucun identifiant personnel)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Message erreur */}
        {message && (
          <p style={{ color: '#C8431A', fontSize: 13, textAlign: 'center', background: 'rgba(200,67,26,0.08)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.5, marginBottom: 12 }}>
            {message}
          </p>
        )}

        {/* Bouton */}
        <button
          onClick={handleConsent}
          disabled={loading || !formulaireValide}
          style={{
            width: '100%',
            background: loading ? '#8C5A40' : !formulaireValide ? '#E8E0D0' : '#C8431A',
            color: !formulaireValide ? '#8C5A40' : 'white',
            fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none',
            fontSize: 15, cursor: loading || !formulaireValide ? 'not-allowed' : 'pointer',
          }}>
          {loading ? 'Enregistrement...' : 'C\'est parti →'}
        </button>

        <p style={{ color: '#8C5A40', fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Ces préférences sont modifiables à tout moment dans ton profil.
        </p>

      </div>
    </main>
  )
}
