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

{/* Titre */}
<h1 style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 'bold', marginBottom: 16,
          fontFamily: 'serif', fontStyle: 'italic',
          color: '#F7F2E8', lineHeight: 1.2
        }}>{ev.titre}</h1>

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

        {/* Barre d'actions */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32, gap: 12
        }}>
          {/* Gauche : Like + Signaler */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Like */}
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: liked ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                border: liked ? '1px solid #C8431A' : '1px solid #2a2a2a',
                borderRadius: 999, padding: '8px 14px',
                cursor: 'pointer', color: liked ? '#C8431A' : '#8C5A40',
                fontSize: 13, fontWeight: 'bold', transition: 'all 0.15s'
              }}>
              <span style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</span>
              <span>J'aime{nbLikes > 0 ? ` ${nbLikes}` : ''}</span>
            </button>

            {/* Signaler */}
            <button
              onClick={() => setSignalementModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #2a2a2a',
                borderRadius: 999, padding: '8px 12px',
                cursor: 'pointer', color: '#555', fontSize: 12
              }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span>Signaler</span>
            </button>
          </div>

          {/* Droite : Réseaux sociaux */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* WhatsApp */}
            <a href={urlWhatsapp} target="_blank" title="Partager sur WhatsApp" style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a href={urlFacebook} target="_blank" title="Partager sur Facebook" style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#1877F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

           {/* X (Twitter) */}
           <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent('Découvre cet événement sur Lotbo : ' + ev.titre) + '&url=' + encodeURIComponent(urlEvenement)} target="_blank" title="Partager sur X" style={{ width: 38, height: 38, borderRadius: '50%', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>𝕏</span>
            </a>
          </div>
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