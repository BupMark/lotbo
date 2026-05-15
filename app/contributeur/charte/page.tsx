'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CharteContributeur() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dejaAcceptee, setDejaAcceptee] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      // Vérifier si charte déjà acceptée
      const { data: profile } = await supabase
        .from('profiles')
        .select('charte_acceptee, role')
        .eq('id', session.user.id)
        .single()

      if (profile?.charte_acceptee) setDejaAcceptee(true)
    })
  }, [])

  const handleAccepter = async () => {
    if (!accepted || !user) return
    setLoading(true)

    // Upsert profil avec charte acceptée
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      role: 'contributeur',
      charte_acceptee: true,
      charte_acceptee_le: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    setLoading(false)
    if (!error) {
      router.push('/ajouter?contributeur=1')
    } else {
      alert('Erreur: ' + error.message)
    }
  }

  if (dejaAcceptee) {
    return (
      <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ color: '#1A1410', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>Charte déjà acceptée</h1>
          <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24 }}>Tu es déjà Contributeur LOTBO. Tu peux publier des événements directement.</p>
          <a href="/ajouter" style={{ background: '#C8431A', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none' }}>
            + Ajouter un événement
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>⭐</span>
            <h1 style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold' }}>Charte Contributeur LOTBO</h1>
          </div>
          <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6 }}>
            En tant que Contributeur, tu peux publier des événements directement sur la carte sans validation préalable. Cette responsabilité exige le respect de la présente charte.
          </p>
        </div>

        {/* Badge */}
        <div style={{ background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🏅</span>
          <div>
            <p style={{ color: '#C8431A', fontWeight: 'bold', fontSize: 14 }}>Badge Contributeur LOTBO</p>
            <p style={{ color: '#8C5A40', fontSize: 12 }}>Visible sur ton profil public après acceptation</p>
          </div>
        </div>

        {/* Charte */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: '24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <section>
            <h2 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>1. Engagement qualité</h2>
            <ul style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Je publie uniquement des événements réels, vérifiables et à venir</li>
              <li>Les informations (lieu, date, heure) sont exactes au moment de la publication</li>
              <li>Je mets à jour ou supprime les événements annulés dès que possible</li>
              <li>Les photos utilisées respectent les droits d'auteur</li>
            </ul>
          </section>

          <div style={{ height: 1, background: '#E8E0D0' }} />

          <section>
            <h2 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>2. Contenus interdits</h2>
            <ul style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Contenu adulte, violent, haineux ou discriminatoire</li>
              <li>Publicité déguisée ou spam</li>
              <li>Événements fictifs ou trompeurs</li>
              <li>Contenu portant atteinte à des droits d'auteur</li>
              <li>Activités illégales ou non autorisées</li>
            </ul>
          </section>

          <div style={{ height: 1, background: '#E8E0D0' }} />

          <section>
            <h2 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>3. Non-représentation officielle</h2>
            <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.7 }}>
              Le statut de Contributeur ne constitue <strong>pas</strong> un emploi, un mandat ou une représentation officielle de LOTBO ou de Bup Mark Ltd. Le Contributeur agit en son nom propre et assume la responsabilité exclusive des événements qu'il publie.
            </p>
          </section>

          <div style={{ height: 1, background: '#E8E0D0' }} />

          <section>
            <h2 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>4. Sanctions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { niveau: '1', label: 'Avertissement', desc: 'Notification + correction demandée', color: '#D4A820' },
                { niveau: '2', label: 'Suspension 7 jours', desc: 'Après 2 avertissements ou violation grave', color: '#C8431A' },
                { niveau: '3', label: 'Bannissement définitif', desc: 'Violation répétée ou fraude avérée', color: '#8C5A40' },
              ].map(s => (
                <div key={s.niveau} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: '#F7F2E8', borderRadius: 8 }}>
                  <span style={{ color: s.color, fontWeight: 'bold', fontSize: 13, flexShrink: 0 }}>Niveau {s.niveau}</span>
                  <div>
                    <p style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold' }}>{s.label}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: '#E8E0D0' }} />

          <section>
            <h2 style={{ color: '#1A1410', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>5. Droits LOTBO</h2>
            <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.7 }}>
              LOTBO se réserve le droit de modifier, masquer ou supprimer tout événement sans préavis, et de révoquer le statut Contributeur à tout moment en cas de non-respect de cette charte.
            </p>
          </section>

        </div>

        {/* Acceptation */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
          <button type="button" onClick={() => setAccepted(!accepted)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%'
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
              border: accepted ? 'none' : '2px solid #E8E0D0',
              background: accepted ? '#C8431A' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {accepted && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
            </div>
            <p style={{ color: '#1A1410', fontSize: 14, lineHeight: 1.6 }}>
              J'ai lu et j'accepte la Charte Contributeur LOTBO. Je comprends que je ne suis pas employé ni représentant officiel de LOTBO ou Bup Mark Ltd, et que je suis seul responsable des événements que je publie.
            </p>
          </button>
        </div>

        {/* Bouton */}
        <button
          onClick={handleAccepter}
          disabled={!accepted || loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 10,
            background: accepted ? '#C8431A' : '#E8E0D0',
            color: accepted ? 'white' : '#8C5A40',
            border: 'none', fontSize: 15, fontWeight: 'bold',
            cursor: accepted ? 'pointer' : 'not-allowed'
          }}>
          {loading ? 'Activation...' : '⭐ Devenir Contributeur LOTBO'}
        </button>

        <p style={{ color: '#8C5A40', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
          Entité légale : Bup Mark Ltd · n° 15840780 · Manchester, UK
        </p>

      </div>
    </main>
  )
}
