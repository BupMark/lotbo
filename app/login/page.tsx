'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [mode, setMode]                 = useState<'connexion' | 'inscription'>('connexion')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [prenom, setPrenom]             = useState('')
  const [accepteCGU, setAccepteCGU]     = useState(false)
  const [newsletter, setNewsletter]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [message, setMessage]           = useState('')
  const [messageType, setMessageType]   = useState<'erreur' | 'succes'>('erreur')

  const resetForm = () => {
    setMessage('')
    setEmail('')
    setPassword('')
    setPrenom('')
    setAccepteCGU(false)
    setNewsletter(false)
  }

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
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
      const msg = error.message.includes('Anonymous') ? t.anonymous : error.message.includes('Invalid') ? t.invalid : t.default
      setMessage(msg)
      setMessageType('erreur')
      return
    }
    const role = data.session?.user?.user_metadata?.role
    if (role === 'admin') router.push('/admin')
    else router.push('/ajouter')
  }

  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!prenom.trim()) { setMessage('Entre ton prénom pour continuer.'); setMessageType('erreur'); return }
    if (password.length < 6) { setMessage('Le mot de passe doit contenir au moins 6 caractères.'); setMessageType('erreur'); return }
    if (!accepteCGU) { setMessage("Tu dois accepter les conditions d'utilisation pour continuer."); setMessageType('erreur'); return }

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom: prenom.trim() } }
    })

    if (error) {
      setLoading(false)
      setMessage('Erreur : ' + error.message)
      setMessageType('erreur')
      return
    }

    // Créer le profil
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nom: prenom.trim(),
        role: 'membre',
        created_at: new Date().toISOString(),
      })

      // Newsletter si coché
      if (newsletter) {
        await supabase.from('abonnements').upsert([{ email }], { onConflict: 'email' }).catch(() => {})
      }
    }

    setLoading(false)
    setMessage('✓ Vérifie ton email pour confirmer ton compte LOTBO !')
    setMessageType('succes')
  }

  const inputStyle = {
    background: 'white',
    border: '1px solid #E8E0D0',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#1A1410',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 36, fontWeight: 'bold' }}>
              <span style={{ color: '#1A1410' }}>lot</span>
              <span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </a>
          <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 6 }}>Tous les événements, un seul endroit.</p>
        </div>

        {/* Sélecteur mode */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 4, marginBottom: 28, gap: 4 }}>
          <button type="button" onClick={() => { setMode('connexion'); resetForm() }} style={{ flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'connexion' ? '#C8431A' : 'transparent', color: mode === 'connexion' ? 'white' : '#8C5A40' }}>
            J'ai un compte
          </button>
          <button type="button" onClick={() => { setMode('inscription'); resetForm() }} style={{ flex: 1, padding: '10px', borderRadius: 9, fontSize: 14, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'inscription' ? '#C8431A' : 'transparent', color: mode === 'inscription' ? 'white' : '#8C5A40' }}>
            Créer un compte
          </button>
        </div>

        {/* Titre contextuel */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#1A1410', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
            {mode === 'connexion' ? 'Bon retour ! 👋' : 'Rejoins LOTBO 🌍'}
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.6 }}>
            {mode === 'connexion'
              ? 'Connecte-toi pour accéder à ton espace.'
              : 'Crée ton compte gratuitement et rejoins la communauté mondiale.'}
          </p>
        </div>

        {/* Formulaire */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Prénom — uniquement inscription */}
          {mode === 'inscription' && (
            <input
              type="text"
              placeholder="Ton prénom *"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              style={inputStyle}
              required
            />
          )}

          <input
            type="email"
            placeholder="Ton email *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'inscription' ? 'Crée un mot de passe (6 car. min.) *' : 'Ton mot de passe'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: 48 }}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8C5A40', fontSize: 18, lineHeight: 1 }}>
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {/* Checkboxes inscription */}
          {mode === 'inscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '16px' }}>

              {/* CGU — obligatoire */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={accepteCGU}
                  onChange={e => setAccepteCGU(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>
                  J'accepte les{' '}
                  <a href="/cgu" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>conditions d'utilisation</a>
                  {' '}et la{' '}
                  <a href="/politique-confidentialite" target="_blank" style={{ color: '#C8431A', textDecoration: 'underline' }}>politique de confidentialité</a>
                  {' '}<span style={{ color: '#C8431A' }}>*</span>
                </span>
              </label>

              <div style={{ height: 1, background: '#E8E0D0' }} />

              {/* Newsletter — optionnelle */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={e => setNewsletter(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#C8431A', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>
                  Je souhaite recevoir la newsletter LOTBO — événements, nouveautés et top de la semaine.{' '}
                  <span style={{ opacity: 0.6 }}>(optionnel)</span>
                </span>
              </label>

            </div>
          )}

          {/* Message */}
          {message && (
            <p style={{ color: messageType === 'succes' ? '#2D9E6B' : '#C8431A', fontSize: 13, textAlign: 'center', background: messageType === 'succes' ? 'rgba(45,158,107,0.08)' : 'rgba(200,67,26,0.08)', padding: '10px 14px', borderRadius: 8, lineHeight: 1.5 }}>
              {message}
            </p>
          )}

          {/* Bouton principal */}
          {mode === 'connexion' ? (
            <button onClick={handleLogin} disabled={loading} style={{ background: loading ? '#8C5A40' : '#C8431A', color: 'white', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          ) : (
            <button onClick={handleSignup} disabled={loading || !accepteCGU} style={{ background: loading ? '#8C5A40' : !accepteCGU ? '#E8E0D0' : '#C8431A', color: !accepteCGU ? '#8C5A40' : 'white', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading || !accepteCGU ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Création du compte...' : 'Créer mon compte →'}
            </button>
          )}

          {/* Switcher bas */}
          <p style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
            {mode === 'connexion' ? (
              <>Pas encore de compte ?{' '}
                <button type="button" onClick={() => { setMode('inscription'); resetForm() }} style={{ background: 'none', border: 'none', color: '#C8431A', fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                  Créer un compte
                </button>
              </>
            ) : (
              <>Déjà un compte ?{' '}
                <button type="button" onClick={() => { setMode('connexion'); resetForm() }} style={{ background: 'none', border: 'none', color: '#C8431A', fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                  Se connecter
                </button>
              </>
            )}
          </p>

          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textAlign: 'center', textDecoration: 'none', marginTop: 4 }}>
            ← Retour à la carte
          </a>

        </form>
      </div>
    </main>
  )
}