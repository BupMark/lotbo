'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Desinscription() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [statut, setStatut] = useState<'idle' | 'succes' | 'introuvable' | 'erreur'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    const { data, error } = await supabase
      .from('abonnements')
      .delete()
      .eq('email', email.trim().toLowerCase())
      .select()

    setLoading(false)

    if (error) {
      setStatut('erreur')
    } else if (!data || data.length === 0) {
      setStatut('introuvable')
    } else {
      setStatut('succes')
    }
  }

  return (
    <main style={{
      minHeight: '100dvh', background: '#F7F2E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: 420, width: '100%' }}>

        {/* Logo */}
        <div style={{
          textAlign: 'center', marginBottom: 32,
          fontFamily: 'serif', fontStyle: 'italic',
          fontSize: 28, fontWeight: 'bold'
        }}>
          <span style={{ color: '#1A1410' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>

        {statut === 'succes' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#1A1410', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              Désinscription confirmée
            </h2>
            <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Tu ne recevras plus de notifications d'événements Lotbo.
            </p>
            <a href="/" style={{
              background: '#C8431A', color: '#F7F2E8',
              padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
              display: 'inline-block'
            }}>Retour à la carte →</a>
          </div>

        ) : (
          <>
            <h1 style={{
              color: '#1A1410', fontSize: 22, fontWeight: 'bold',
              marginBottom: 8, textAlign: 'center'
            }}>
              Se désinscrire des notifications
            </h1>
            <p style={{
              color: '#8C5A40', fontSize: 14, lineHeight: 1.6,
              marginBottom: 32, textAlign: 'center'
            }}>
              Entre ton adresse email pour arrêter de recevoir les alertes d'événements Lotbo.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  background: 'white',
                  border: '1px solid #E8E0D0',
                  borderRadius: 10, padding: '13px 16px',
                  fontSize: 14, color: '#1A1410',
                  outline: 'none', width: '100%'
                }}
              />

              {statut === 'introuvable' && (
                <p style={{ color: '#e57373', fontSize: 13, textAlign: 'center' }}>
                  Aucun abonnement trouvé pour cet email.
                </p>
              )}

              {statut === 'erreur' && (
                <p style={{ color: '#e57373', fontSize: 13, textAlign: 'center' }}>
                  Une erreur est survenue. Réessaie dans un instant.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#E8E0D0' : '#1A1410',
                  color: '#F7F2E8', fontWeight: 'bold',
                  padding: '13px', borderRadius: 10,
                  border: 'none', fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                {loading ? 'Traitement...' : 'Se désinscrire'}
              </button>
            </form>

            <p style={{ color: '#8C5A40', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
              Tu peux te réinscrire à tout moment sur{' '}
              <a href="/inscription" style={{ color: '#C8431A', textDecoration: 'none' }}>
                lotbo.app/inscription
              </a>
            </p>
          </>
        )}

      </div>
    </main>
  )
}