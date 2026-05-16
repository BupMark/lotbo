'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      const lang = navigator.language.slice(0, 2)
      const msgs: Record<string, Record<string, string>> = {
        fr: {
          anonymous: 'Veuillez entrer votre email et mot de passe.',
          invalid: 'Email ou mot de passe incorrect.',
          default: 'Erreur de connexion. Veuillez réessayer.'
        },
        en: {
          anonymous: 'Please enter your email and password.',
          invalid: 'Invalid email or password.',
          default: 'Login error. Please try again.'
        },
        es: {
          anonymous: 'Por favor ingresa tu email y contraseña.',
          invalid: 'Email o contraseña incorrectos.',
          default: 'Error de inicio de sesión.'
        },
        pt: {
          anonymous: 'Por favor insira seu email e senha.',
          invalid: 'Email ou senha incorretos.',
          default: 'Erro de login. Tente novamente.'
        },
      }
      const t = msgs[lang] || msgs['fr']
      const msg = error.message.includes('Anonymous') ? t.anonymous
        : error.message.includes('Invalid') ? t.invalid
        : t.default
      setMessage(msg)
      return
    }
    const role = data.session?.user?.user_metadata?.role
    if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/ajouter')
    }
  }

  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Vérifie ton email pour confirmer ton compte !')
    }
  }

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#F7F2E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 32, fontWeight: 'bold' }}>
            <span style={{ color: '#1A1410' }}>lot</span>
            <span style={{ color: '#C8431A' }}>bo</span>
          </div>
          <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 6 }}>Espace organisateurs</p>
        </div>

        {/* Formulaire */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              background: 'white',
              border: '1px solid #E8E0D0',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#1A1410',
              fontSize: 14,
              outline: 'none'
            }}
            required
          />

          {/* Champ mot de passe avec bouton 👁 */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                background: 'white',
                border: '1px solid #E8E0D0',
                borderRadius: 10,
                padding: '12px 48px 12px 16px',
                color: '#1A1410',
                fontSize: 14,
                outline: 'none',
                width: '100%',
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
                color: '#8C5A40', fontSize: 18,
                lineHeight: 1,
              }}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          {message && (
            <p style={{ color: '#D4A820', fontSize: 13, textAlign: 'center' }}>
              {message}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: loading ? '#8C5A40' : '#C8431A',
              color: '#1A1410',
              fontWeight: 'bold',
              padding: '13px',
              borderRadius: 10,
              border: 'none',
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4
            }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              background: 'white',
              color: '#1A1410',
              fontWeight: 'bold',
              padding: '13px',
              borderRadius: 10,
              border: '1px solid #E8E0D0',
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
            {loading ? '...' : 'Créer un compte'}
          </button>

          <a href="/" style={{
            color: '#8C5A40', fontSize: 13,
            textAlign: 'center', textDecoration: 'none',
            marginTop: 8
          }}>
            ← Retour à la carte
          </a>
        </form>
      </div>
    </main>
  )
}
