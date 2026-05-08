'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      router.push('/ajouter')
    }
  }

  const handleSignup = async (e: any) => {
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
    <main style={{minHeight: '100dvh'}} className="bg-black text-white p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Lotbo</h1>
        <p className="text-gray-400 text-center mb-8">Espace organisateurs</p>

        <form className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          {message && <p className="text-yellow-400 text-sm text-center">{message}</p>}

          <button onClick={handleLogin} disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <button onClick={handleSignup} disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg">
            {loading ? '...' : 'Créer un compte'}
          </button>

          <a href="/" className="text-gray-500 text-sm text-center hover:text-white">← Retour à la carte</a>
        </form>
      </div>
    </main>
  )
}