'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: ev } = await supabase
    .from('evenements')
    .select('titre, lieu, date, description, image_url')
    .eq('id', params.id)
    .eq('statut', 'approuve')
    .single()

  const titre = ev?.titre || 'Événement sur Lotbo'
  const description = ev?.description
    ? ev.description.slice(0, 160)
    : `${ev?.lieu || ''} · ${ev?.date || ''} · Découvre cet événement sur Lotbo`
  const url = `https://app.lotbo.app/evenement/${params.id}`

  return {
    title: `${titre} · Lotbo`,
    description,
    openGraph: {
      title: titre,
      description,
      url,
      siteName: 'Lotbo',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: titre,
      description,
    },
  }
}

export default function EvenementPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ev, setEv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [similaires, setSimilaires] = useState<any[]>([])
  const [raisonSignalement, setRaisonSignalement] = useState('')
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)

  useEffect(() => {
    supabase
      .from('evenements')
      .select('*')
      .eq('id', id)
      .eq('statut', 'approuve')   // ← RLS : ne jamais afficher un événement non approuvé
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

  const handleSignalement = async () => {
    if (!raisonSignalement) { alert('Choisis une raison'); return }
    await supabase.from('signalements').insert([{
      evenement_id: ev.id,
      raison: raisonSignalement
    }])
    setSignalementEnvoye(true)
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
            <h2 style={{
              fontSize: 16, fontWeight: 'bold', marginBottom: 12,
              color: '#F7F2E8'
            }}>À propos</h2>
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

        {/* Partage */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
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
        </div>

        {/* Signalement */}
        <div style={{
          borderTop: '1px solid #2a2a2a',
          paddingTop: 24, marginBottom: 48
        }}>
          <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 12 }}>
            Un problème avec cet événement ?
          </p>
          {signalementEnvoye ? (
            <p style={{ color: '#D4A820', fontSize: 13 }}>
              ✓ Signalement envoyé, merci !
            </p>
          ) : (
            <>
              <select
                value={raisonSignalement}
                onChange={e => setRaisonSignalement(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #333',
                  borderRadius: 10, color: '#F7F2E8',
                  padding: '10px 14px', fontSize: 13,
                  marginBottom: 10, outline: 'none', cursor: 'pointer'
                }}>
                <option value="">Choisir une raison...</option>
                <option value="Fausse information">Fausse information</option>
                <option value="Contenu inapproprié">Contenu inapproprié</option>
                <option value="Événement annulé">Événement annulé</option>
                <option value="Spam">Spam</option>
                <option value="Autre">Autre</option>
              </select>
              <button
                onClick={handleSignalement}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #333',
                  color: '#8C5A40', fontWeight: 'bold',
                  padding: '12px', borderRadius: 10,
                  fontSize: 13, cursor: 'pointer'
                }}>
                Signaler cet événement
              </button>
            </>
          )}
        </div>

        {/* Événements similaires */}
        {similaires.length > 0 && (
          <div>
            <h2 style={{
              fontSize: 18, fontWeight: 'bold', marginBottom: 16,
              color: '#F7F2E8'
            }}>Événements similaires</h2>
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