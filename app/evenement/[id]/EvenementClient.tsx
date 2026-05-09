'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function EvenementPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ev, setEv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [similaires, setSimilaires] = useState<any[]>([])
  const [signalementModal, setSignalementModal] = useState(false)
  const [raisonSignalement, setRaisonSignalement] = useState('')
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const [liked, setLiked] = useState(false)
  const [nbLikes, setNbLikes] = useState(0)

  useEffect(() => {
    supabase
      .from('evenements')
      .select('*')
      .eq('id', id)
      .eq('statut', 'approuve')
      .single()
      .then(async ({ data }) => {
        setEv(data)
        if (data) {
          const { data: sims } = await supabase
            .from('evenements')
            .select('*')
            .eq('categorie', data.categorie)
            .eq('statut', 'approuve')
            .neq('id', id)
            .limit(3)
          setSimilaires(sims || [])
        }
        setLoading(false)
      })
  }, [id])

  // Like — localStorage
  useEffect(() => {
    if (!id) return
    const likes = JSON.parse(localStorage.getItem('lotbo_likes') || '{}')
    const count = JSON.parse(localStorage.getItem('lotbo_likes_count') || '{}')
    setLiked(!!likes[id as string])
    setNbLikes(count[id as string] || 0)
  }, [id])

  const handleLike = () => {
    if (!id) return
    const likes = JSON.parse(localStorage.getItem('lotbo_likes') || '{}')
    const count = JSON.parse(localStorage.getItem('lotbo_likes_count') || '{}')
    if (liked) {
      delete likes[id as string]
      count[id as string] = Math.max(0, (count[id as string] || 1) - 1)
    } else {
      likes[id as string] = true
      count[id as string] = (count[id as string] || 0) + 1
    }
    localStorage.setItem('lotbo_likes', JSON.stringify(likes))
    localStorage.setItem('lotbo_likes_count', JSON.stringify(count))
    setLiked(!liked)
    setNbLikes(count[id as string])
  }

  const handleSignalement = async () => {
    if (!raisonSignalement) return
    await supabase.from('signalements').insert([{
      evenement_id: ev.id,
      raison: raisonSignalement
    }])
    setSignalementEnvoye(true)
    setSignalementModal(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410' }}
      className="flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  if (!ev) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410' }}
      className="flex items-center justify-center">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#8C5A40', marginBottom: 16 }}>Événement introuvable.</p>
        <button
          onClick={() => router.push('/')}
          style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '10px 20px', borderRadius: 999,
            border: 'none', cursor: 'pointer', fontSize: 14
          }}>
          Retour à la carte
        </button>
      </div>
    </main>
  )

  const urlEvenement = 'https://app.lotbo.app/evenement/' + ev.id
  const texteWhatsapp = 'Découvre cet événement sur Lotbo : ' + ev.titre + ' — ' + urlEvenement
  const urlWhatsapp = 'https://wa.me/?text=' + encodeURIComponent(texteWhatsapp)
  const urlFacebook = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(urlEvenement)

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', color: '#F7F2E8' }}>

      {/* Modal signalement */}
      {signalementModal && (
        <>
          <div
            onClick={() => setSignalementModal(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)'
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            background: '#1A1410', borderTop: '1px solid #2a2a2a',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px'
          }}>
            <h3 style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
              Signaler cet événement
            </h3>
            {signalementEnvoye ? (
              <p style={{ color: '#D4A820', fontSize: 14 }}>✓ Signalement envoyé, merci !</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {['Fausse information', 'Contenu inapproprié', 'Événement annulé', 'Spam', 'Autre'].map(raison => (
                    <button
                      key={raison}
                      onClick={() => setRaisonSignalement(raison)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, fontSize: 14,
                        textAlign: 'left', cursor: 'pointer',
                        background: raisonSignalement === raison ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                        border: raisonSignalement === raison ? '1px solid #C8431A' : '1px solid #2a2a2a',
                        color: raisonSignalement === raison ? '#F7F2E8' : '#8C5A40',
                      }}>
                      {raison}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSignalement}
                  disabled={!raisonSignalement}
                  style={{
                    width: '100%', padding: '13px',
                    background: raisonSignalement ? '#C8431A' : 'rgba(255,255,255,0.04)',
                    color: raisonSignalement ? '#F7F2E8' : '#555',
                    border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 'bold', cursor: raisonSignalement ? 'pointer' : 'not-allowed'
                  }}>
                  Envoyer le signalement
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Image hero */}
      {ev.image_url && (
        <div style={{ width: '100%', height: 280, overflow: 'hidden' }}>
          <img src={ev.image_url} alt={ev.titre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 64px' }}>

        {/* Retour */}
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none', border: 'none', color: '#8C5A40',
            fontSize: 13, cursor: 'pointer', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6, padding: 0
          }}>
          ← Retour à la carte
        </button>

        {/* Titre + Like */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 'bold',
            fontFamily: 'serif', fontStyle: 'italic',
            color: '#F7F2E8', lineHeight: 1.2, flex: 1
          }}>{ev.titre}</h1>
          <button
            onClick={handleLike}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, background: 'none', border: 'none',
              cursor: 'pointer', flexShrink: 0, padding: '4px 8px'
            }}>
            <span style={{ fontSize: 24, transition: 'transform 0.15s' }}>
              {liked ? '❤️' : '🤍'}
            </span>
            {nbLikes > 0 && (
              <span style={{ fontSize: 11, color: '#8C5A40' }}>{nbLikes}</span>
            )}
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <span style={{
            background: 'rgba(200,67,26,0.15)', color: '#C8431A',
            padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 'bold'
          }}>{ev.categorie}</span>
          <span style={{
            background: 'rgba(255,255,255,0.06)', color: '#8C5A40',
            padding: '4px 12px', borderRadius: 999, fontSize: 13
          }}>{ev.acces || 'public'}</span>
          <span style={{
            background: 'rgba(255,255,255,0.06)', color: '#8C5A40',
            padding: '4px 12px', borderRadius: 999, fontSize: 13
          }}>{ev.prix || 'gratuit'}</span>
        </div>

        {/* Infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <p style={{ color: '#E8E0D0', fontSize: 15 }}>
            📍 <span style={{ color: '#F7F2E8', fontWeight: 'bold' }}>{ev.lieu}</span>
          </p>
          <p style={{ color: '#E8E0D0', fontSize: 15 }}>
            📅 <span style={{ color: '#F7F2E8' }}>{ev.date}</span>
          </p>
          {ev.heure_debut && (
            <p style={{ color: '#E8E0D0', fontSize: 15 }}>
              🕐 <span style={{ color: '#F7F2E8' }}>
                {ev.heure_debut}{ev.heure_fin ? ` → ${ev.heure_fin}` : ''}
              </span>
            </p>
          )}
        </div>

        {/* Description */}
        {ev.description && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #2a2a2a',
            borderRadius: 16, padding: 24, marginBottom: 24
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#F7F2E8' }}>
              À propos
            </h2>
            <p style={{ color: '#E8E0D0', lineHeight: 1.7, fontSize: 14 }}>
              {ev.description}
            </p>
          </div>
        )}

        {/* CTA principal */}
        {ev.lien && (
          <a href={ev.lien} target="_blank" style={{
            display: 'block', width: '100%', textAlign: 'center',
            background: '#C8431A', color: '#F7F2E8',
            fontWeight: 'bold', padding: '14px',
            borderRadius: 12, marginBottom: 12,
            textDecoration: 'none', fontSize: 15
          }}>
            Plus de détails →
          </a>
        )}

        {/* Partage + Signalement */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, alignItems: 'center' }}>
          <a href={urlWhatsapp} target="_blank" style={{
            flex: 1, textAlign: 'center',
            background: '#25D366', color: 'white',
            fontWeight: 'bold', padding: '12px',
            borderRadius: 12, textDecoration: 'none', fontSize: 14
          }}>
            📱 WhatsApp
          </a>
          <a href={urlFacebook} target="_blank" style={{
            flex: 1, textAlign: 'center',
            background: '#1877F2', color: 'white',
            fontWeight: 'bold', padding: '12px',
            borderRadius: 12, textDecoration: 'none', fontSize: 14
          }}>
            📘 Facebook
          </a>
          {/* Signalement — icône discret */}
          <button
            onClick={() => setSignalementModal(true)}
            title="Signaler cet événement"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #2a2a2a',
              color: '#555', borderRadius: 12,
              padding: '12px 14px', cursor: 'pointer',
              fontSize: 13, display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 2,
              flexShrink: 0
            }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 10 }}>Signaler</span>
          </button>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 32 }} />

        {/* Événements similaires */}
        {similaires.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#F7F2E8' }}>
              Événements similaires
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {similaires.map(sim => (
                <a href={'/evenement/' + sim.id} key={sim.id} style={{
                  display: 'flex', gap: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12, padding: 12,
                  textDecoration: 'none', color: '#F7F2E8'
                }}>
                  {sim.image_url && (
                    <img src={sim.image_url} alt={sim.titre} style={{
                      width: 64, height: 64, objectFit: 'cover',
                      borderRadius: 8, flexShrink: 0
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 'bold', fontSize: 14, marginBottom: 4,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>{sim.titre}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {sim.lieu}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6 }}>📅 {sim.date}</p>
                    <span style={{
                      background: 'rgba(200,67,26,0.15)', color: '#C8431A',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11
                    }}>{sim.categorie}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}