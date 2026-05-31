'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { track } from '../../lib/amplitude'

export default function Login() {
  const router = useRouter()
  const [mode, setMode]                         = useState<'connexion' | 'inscription'>('connexion')
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [prenom, setPrenom]                     = useState('')
  const [accepteCGU, setAccepteCGU]             = useState(false)
  const [newsletter, setNewsletter]             = useState(false)
  const [showPassword, setShowPassword]         = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [loadingGoogle, setLoadingGoogle]       = useState(false)
  const [loadingFacebook, setLoadingFacebook]   = useState(false)
  const [message, setMessage]                   = useState('')
  const [messageType, setMessageType]           = useState<'erreur' | 'succes'>('erreur')
  const [emailEnvoye, setEmailEnvoye]           = useState(false)
  const [emailInscription, setEmailInscription] = useState('')
  const [invitationToken, setInvitationToken]   = useState<string | null>(null)

  const resetForm = () => {
    setMessage(''); setEmail(''); setPassword(''); setPrenom('')
    setAccepteCGU(false); setNewsletter(false); setEmailEnvoye(false)
  }

  const getRedirect = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('redirect') || '/'
  }

  // ── Lire les params URL ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const inv = p.get('invitation')
    const modeParam = p.get('mode')
    if (inv) {
      setInvitationToken(inv)
      localStorage.setItem('lotbo_invitation_token', inv)
    }
    if (modeParam === 'inscription') {
      setMode('inscription')
    }
  }, [])

  // ── Intercepter le token OAuth dans le hash (flux implicite Supabase) ──────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.includes('access_token=')) return
    const params        = new URLSearchParams(hash.replace('#', ''))
    const access_token  = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
        if (!error && data.session) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          const role = data.session.user?.user_metadata?.role
          if (role === 'admin') window.location.href = '/admin'
          else window.location.href = getRedirect()
        }
      })
    }
  }, [])

  // ── Accepter invitation en attente si token présent ────────────────────────
  const accepterInvitationSiPresente = async (accessToken: string) => {
    const stored = localStorage.getItem('lotbo_invitation_token')
    if (!stored) return
    try {
      await fetch('/api/organisation/accepter-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ token: stored }),
      })
    } catch {}
    localStorage.removeItem('lotbo_invitation_token')
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoadingGoogle(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(getRedirect())}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { setMessage('Erreur Google : ' + error.message); setMessageType('erreur'); setLoadingGoogle(false) }
  }

  // ── Facebook OAuth ─────────────────────────────────────────────────────────
  const handleFacebook = async () => {
    setLoadingFacebook(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(getRedirect())}`,
      },
    })
    if (error) { setMessage('Erreur Facebook : ' + error.message); setMessageType('erreur'); setLoadingFacebook(false) }
  }

  // ── Connexion email ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true); setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      const lang = navigator.language.slice(0, 2)
      const msgs: Record<string, Record<string, string>> = {
        fr: { anonymous: 'Veuillez entrer votre email et mot de passe.', invalid: 'Email ou mot de passe incorrect.', default: 'Erreur de connexion. Veuillez réessayer.' },
        en: { anonymous: 'Please enter your email and password.', invalid: 'Invalid email or password.', default: 'Login error. Please try again.' },
        es: { anonymous: 'Por favor ingresa tu email y contraseña.', invalid: 'Email o contraseña incorrectos.', default: 'Error de inicio de sesión.' },
        pt: { anonymous: 'Por favor insira seu email e senha.', invalid: 'Email ou senha incorretos.', default: 'Erro de login. Tente novamente.' },
      }
      const t = msgs[lang] || msgs['fr']
      setMessage(error.message.includes('Anonymous') ? t.anonymous : error.message.includes('Invalid') ? t.invalid : t.default)
      setMessageType('erreur'); return
    }
    // Accepter invitation en attente si présente
    if (data.session) await accepterInvitationSiPresente(data.session.access_token)
    track('user_logged_in', { user_id: data.session?.user?.id })
    const role = data.session?.user?.user_metadata?.role
    if (role === 'admin') window.location.href = '/admin'
    else window.location.href = getRedirect()
  }

  // ── Inscription email ──────────────────────────────────────────────────────
  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!prenom.trim())      { setMessage('Entre ton prénom pour continuer.'); setMessageType('erreur'); return }
    if (password.length < 6) { setMessage('Le mot de passe doit contenir au moins 6 caractères.'); setMessageType('erreur'); return }
    if (!accepteCGU)         { setMessage("Tu dois accepter les conditions d'utilisation pour continuer."); setMessageType('erreur'); return }
    setLoading(true); setMessage('')

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nom: prenom.trim() } } })
    if (error) { setLoading(false); setMessage('Erreur : ' + error.message); setMessageType('erreur'); return }

    if (data.user) {
      // Créer le profil
      await supabase.from('profiles').upsert({
        id:         data.user.id,
        nom:        prenom.trim(),
        role:       'membre',
        created_at: new Date().toISOString(),
      })

      // Vérifier si c'est un supporter fondateur
      try {
        const { data: supporter } = await supabase
          .from('supporters')
          .select('id, palier, badge_attribue')
          .eq('email', email.toLowerCase().trim())
          .eq('badge_attribue', false)
          .single()

        if (supporter) {
          await supabase.from('profiles').update({ badge: supporter.palier }).eq('id', data.user.id)
          await supabase.from('supporters').update({ badge_attribue: true, user_id: data.user.id }).eq('id', supporter.id)
        }
      } catch {
        // Pas de supporter trouvé — normal pour la plupart des inscriptions
      }

      // Newsletter optionnelle
      if (newsletter) {
        try { await supabase.from('abonnements').upsert([{ email }], { onConflict: 'email' }) } catch {}
      }

      // Accepter invitation si session disponible (auto-confirm activé)
      if (data.session) await accepterInvitationSiPresente(data.session.access_token)
    }

    track('user_signed_up', { user_id: data.user?.id })
    setLoading(false); setEmailInscription(email); setEmailEnvoye(true)
  }

  // ── Renvoi email ───────────────────────────────────────────────────────────
  const handleRenvoyerEmail = async () => {
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email: emailInscription })
    setLoading(false); setMessage('Email renvoyé !'); setMessageType('succes')
  }

  const inputStyle = {
    background: 'white', border: '1px solid #E8E0D0', borderRadius: 10,
    padding: '12px 16px', color: '#1A1410', fontSize: 14, outline: 'none', width: '100%',
  }

  // ── Écran post-inscription ─────────────────────────────────────────────────
  if (emailEnvoye) {
    return (
      <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 36, fontWeight: 'bold', marginBottom: 32 }}>
              <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </a>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
          <h1 style={{ color: '#1A1410', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Vérifie ta boîte mail</h1>
          <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '24px 20px', marginBottom: 20, textAlign: 'left' }}>
            <p style={{ color: '#1A1410', fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>On a envoyé un lien de confirmation à :</p>
            <p style={{ color: '#C8431A', fontSize: 15, fontWeight: 'bold', marginBottom: 16, wordBreak: 'break-all' }}>{emailInscription}</p>
            <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.7 }}>Clique sur le lien dans l&apos;email pour activer ton compte. Tu seras automatiquement redirigé vers LOTBO.</p>
          </div>
          {invitationToken && (
            <div style={{ background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ color: '#C8431A', fontSize: 12, lineHeight: 1.6 }}>
                🏢 <strong>Ton invitation est enregistrée.</strong> Elle sera acceptée automatiquement à ta première connexion.
              </p>
            </div>
          )}
          <div style={{ background: 'rgba(212,168,32,0.08)', border: '1px solid rgba(212,168,32,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.6 }}>
              💡 <strong>Tu ne vois pas l&apos;email ?</strong> Vérifie ton dossier spam. L&apos;expéditeur est <strong>hello@lotbo.app</strong>.
            </p>
          </div>
          {message && (
            <p style={{ color: messageType === 'succes' ? '#2D9E6B' : '#C8431A', fontSize: 13, marginBottom: 16, background: messageType === 'succes' ? 'rgba(45,158,107,0.08)' : 'rgba(200,67,26,0.08)', padding: '10px 14px', borderRadius: 8 }}>
              {message}
            </p>
          )}
          <button onClick={handleRenvoyerEmail} disabled={loading} style={{ background: 'white', border: '1px solid #E8E0D0', color: '#1A1410', fontWeight: 'bold', padding: '12px', borderRadius: 10, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginBottom: 12 }}>
            {loading ? 'Envoi...' : '🔄 Renvoyer l\'email de confirmation'}
          </button>
          <button onClick={() => { setEmailEnvoye(false); setMode('connexion'); resetForm() }} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Retour à la connexion
          </button>
        </div>
      </main>
    )
  }

  // ── Formulaire principal ───────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 36, fontWeight: 'bold' }}>
              <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </a>
          <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 6 }}>Tous les événements, un seul endroit.</p>
        </div>

        {/* Sélecteur mode */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
          <button type="button" onClick={() => { setMode('connexion'); resetForm() }} style={{ flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'connexion' ? '#C8431A' : 'transparent', color: mode === 'connexion' ? 'white' : '#8C5A40' }}>
            J&apos;ai un compte
          </button>
          <button type="button" onClick={() => { setMode('inscription'); resetForm() }} style={{ flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'inscription' ? '#C8431A' : 'transparent', color: mode === 'inscription' ? 'white' : '#8C5A40' }}>
            Créer un compte
          </button>
        </div>

        {/* Bandeau invitation */}
        {invitationToken && mode === 'inscription' && (
          <div style={{ background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>🏢 Tu as été invité à rejoindre une organisation</p>
            <p style={{ color: '#8C5A40', fontSize: 12 }}>Crée ton compte pour accepter.</p>
          </div>
        )}

        {/* Titre */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#1A1410', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {mode === 'connexion' ? 'Bon retour ! 👋' : 'Rejoins LOTBO 🌍'}
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            {mode === 'connexion' ? 'Connecte-toi pour accéder à ton espace.' : 'Crée ton compte gratuitement et rejoins la communauté mondiale.'}
          </p>
        </div>

        {/* ── Bouton Google ── */}
        <button type="button" onClick={handleGoogle} disabled={loadingGoogle || loadingFacebook}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, fontSize: 14, fontWeight: 'bold', color: '#1A1410', cursor: loadingGoogle ? 'not-allowed' : 'pointer', marginBottom: 10, opacity: loadingGoogle ? 0.7 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          {loadingGoogle ? <span style={{ color: '#8C5A40' }}>Redirection vers Google...</span> : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {mode === 'connexion' ? 'Continuer avec Google' : 'S\'inscrire avec Google'}
            </>
          )}
        </button>

        {/* ── Bouton Facebook ── */}
        <button type="button" onClick={handleFacebook} disabled={loadingGoogle || loadingFacebook}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 16px', background: '#1877F2', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 'bold', color: 'white', cursor: loadingFacebook ? 'not-allowed' : 'pointer', marginBottom: 16, opacity: loadingFacebook ? 0.7 : 1 }}
        >
          {loadingFacebook ? <span>Redirection vers Facebook...</span> : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              {mode === 'connexion' ? 'Continuer avec Facebook' : 'S\'inscrire avec Facebook'}
            </>
          )}
        </button>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
          <span style={{ color: '#8C5A40', fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
        </div>

        {/* Formulaire email */}
        <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {mode === 'inscription' && (
            <input type="text" placeholder="Ton prénom *" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle} required />
          )}

          <input type="email" placeholder="Ton email *" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />

          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder={mode === 'inscription' ? 'Crée un mot de passe (6 car. min.) *' : 'Ton mot de passe'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 48 }} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8C5A40', fontSize: 18, lineHeight: 1 }}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {mode === 'inscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={accepteCGU} onChange={e => setAccepteCGU(e.target.checked)} style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>
                  J&apos;accepte les{' '}
                  <a href="/cgu" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>conditions d&apos;utilisation</a>
                  {' '}et la{' '}
                  <a href="/politique-confidentialite" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>politique de confidentialité</a>
                  {' '}<span style={{ color: '#C8431A' }}>*</span>
                </span>
              </label>
              <div style={{ height: 1, background: '#E8E0D0' }} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>Je souhaite recevoir la newsletter LOTBO. <span style={{ opacity: 0.6 }}>(optionnel)</span></span>
              </label>
            </div>
          )}

          {message && (
            <p style={{ color: messageType === 'succes' ? '#2D9E6B' : '#C8431A', fontSize: 13, textAlign: 'center', background: messageType === 'succes' ? 'rgba(45,158,107,0.08)' : 'rgba(200,67,26,0.08)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.5 }}>
              {message}
            </p>
          )}

          {mode === 'connexion' ? (
            <button type="button" onClick={handleLogin} disabled={loading} style={{ background: loading ? '#8C5A40' : '#C8431A', color: 'white', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          ) : (
            <button onClick={handleSignup} disabled={loading || !accepteCGU} style={{ background: loading ? '#8C5A40' : !accepteCGU ? '#E8E0D0' : '#C8431A', color: !accepteCGU ? '#8C5A40' : 'white', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading || !accepteCGU ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Création du compte...' : 'Créer mon compte →'}
            </button>
          )}

          <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
            {mode === 'connexion' ? (
              <>Pas encore de compte ?{' '}
                <button type="button" onClick={() => { setMode('inscription'); resetForm() }} style={{ background: 'none', border: 'none', color: '#C8431A', fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0 }}>Créer un compte</button>
              </>
            ) : (
              <>Déjà un compte ?{' '}
                <button type="button" onClick={() => { setMode('connexion'); resetForm() }} style={{ background: 'none', border: 'none', color: '#C8431A', fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0 }}>Se connecter</button>
              </>
            )}
          </p>

          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', textDecoration: 'none', marginTop: 4 }}>← Retour à la carte</a>

        </form>
      </div>
    </main>
  )
}
