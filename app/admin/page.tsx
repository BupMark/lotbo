'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements] = useState<any[]>([])
  const [signalements, setSignalements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filtreStatut, setFiltreStatut] = useState<'en_attente' | 'approuve' | 'rejete' | 'tous'>('en_attente')
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const role = data.session.user.user_metadata?.role
      if (role !== 'admin') { router.push('/'); return }
      setUser(data.session.user)
      chargerEvenements()
    })
  }, [])

  const chargerEvenements = async () => {
    const { data } = await supabase
      .from('evenements')
      .select('*')
      .order('created_at', { ascending: false })
    setEvenements(data || [])

    const { data: sigs } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })
    setSignalements(sigs || [])
    setLoading(false)
  }

  const approuver = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'approuve' }).eq('id', id)
    setEvenements(evenements.map(ev => ev.id === id ? { ...ev, statut: 'approuve' } : ev))
    const ev = evenements.find(e => e.id === id)
    if (ev) {
      fetch('/api/notify-abonnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ev.id, titre: ev.titre, lieu: ev.lieu, date: ev.date, categorie: ev.categorie })
      }).catch(() => {})
    }
    // Push notification
    fetch('/api/push-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: ev.titre,
        lieu: ev.lieu,
        url: `https://app.lotbo.app/evenement/${ev.id}`
      })
    }).catch(() => {})
  }

  const rejeter = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'rejete' }).eq('id', id)
    setEvenements(evenements.map(ev => ev.id === id ? { ...ev, statut: 'rejete' } : ev))
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(evenements.filter(ev => ev.id !== id))
  }

  // Compteurs
  const nbTotal = evenements.length
  const nbApprouves = evenements.filter(e => e.statut === 'approuve').length
  const nbEnAttente = evenements.filter(e => e.statut === 'en_attente').length
  const nbRejetes = evenements.filter(e => e.statut === 'rejete').length
  const nbVilles = new Set(evenements.filter(e => e.statut === 'approuve').map(e => e.lieu?.split(',').pop()?.trim()).filter(Boolean)).size
  const nbPays = new Set(evenements.filter(e => e.statut === 'approuve' && e.longitude && e.latitude).map(e => {
    if (e.longitude < -30) return 'Amériques'
    if (e.longitude < 60) return 'Europe/Afrique'
    return 'Asie/Pacifique'
  })).size

  // Filtres
  const evenementsFiltres = evenements.filter(ev => {
    const matchStatut = filtreStatut === 'tous' ? true : ev.statut === filtreStatut
    const matchRecherche = recherche === '' ||
      ev.titre?.toLowerCase().includes(recherche.toLowerCase()) ||
      ev.lieu?.toLowerCase().includes(recherche.toLowerCase()) ||
      ev.organisateur?.toLowerCase().includes(recherche.toLowerCase())
    return matchStatut && matchRecherche
  })

  const couleurStatut = (statut: string) => {
    if (statut === 'approuve') return { bg: 'rgba(45,158,107,0.15)', color: '#2D9E6B' }
    if (statut === 'rejete') return { bg: 'rgba(180,40,40,0.2)', color: '#e57373' }
    return { bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
  }

  const labelStatut = (statut: string) => {
    if (statut === 'approuve') return '✓ Approuvé'
    if (statut === 'rejete') return '✗ Rejeté'
    if (statut === 'en_attente') return '⏳ En attente'
    return statut
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', color: '#F7F2E8', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            <span style={{ color: '#F7F2E8', fontSize: 24, fontWeight: 'bold' }}>lot</span>
            <span style={{ color: '#C8431A', fontSize: 24, fontWeight: 'bold' }}>bo</span>
            <span style={{ color: '#8C5A40', fontSize: 14, marginLeft: 12 }}>admin</span>
          </div>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
            ← Retour à la carte
          </a>
        </div>

        {/* Compteurs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', valeur: nbTotal, couleur: '#F7F2E8' },
            { label: 'En attente', valeur: nbEnAttente, couleur: '#D4A820' },
            { label: 'Approuvés', valeur: nbApprouves, couleur: '#2D9E6B' },
            { label: 'Rejetés', valeur: nbRejetes, couleur: '#e57373' },
            { label: 'Villes', valeur: nbVilles, couleur: '#C8431A' },
            { label: 'Régions', valeur: nbPays, couleur: '#8C5A40' },
          ].map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #2a2a2a',
              borderRadius: 12, padding: '16px 12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: c.couleur, marginBottom: 4 }}>{c.valeur}</p>
              <p style={{ fontSize: 11, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Info admin */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #333', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>
            Connecté en tant que <span style={{ color: '#C8431A' }}>{user?.email}</span>
          </p>
        </div>

        {/* Filtres onglets + recherche */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'en_attente', label: `⏳ En attente (${nbEnAttente})` },
            { key: 'approuve', label: `✓ Approuvés (${nbApprouves})` },
            { key: 'rejete', label: `✗ Rejetés (${nbRejetes})` },
            { key: 'tous', label: `Tous (${nbTotal})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltreStatut(f.key as any)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
                border: 'none', cursor: 'pointer',
                background: filtreStatut === f.key ? '#C8431A' : 'rgba(255,255,255,0.06)',
                color: filtreStatut === f.key ? 'white' : '#8C5A40'
              }}>
              {f.label}
            </button>
          ))}
          <input
            type="text"
            placeholder="Rechercher..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{
              flex: 1, minWidth: 160,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid #333', borderRadius: 999,
              padding: '7px 14px', fontSize: 12,
              color: '#F7F2E8', outline: 'none'
            }}
          />
        </div>

        {/* Liste événements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          {evenementsFiltres.length === 0 && (
            <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>
              Aucun événement dans cette catégorie.
            </p>
          )}
          {evenementsFiltres.map(ev => (
            <div key={ev.id} style={{
              background: 'rgba(255,255,255,0.04)',
              border: ev.statut === 'en_attente' ? '1px solid rgba(212,168,32,0.3)' : '1px solid #2a2a2a',
              borderRadius: 12, padding: 16,
              display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              {ev.image_url && (
                <img src={ev.image_url} alt={ev.titre}
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ color: '#F7F2E8', fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>{ev.titre}</h2>
                {ev.organisateur && (
                  <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 4 }}>👤 {ev.organisateur}</p>
                )}
                <p style={{ color: '#8C5A40', fontSize: 12 }}>📍 {ev.lieu}</p>
                <p style={{ color: '#8C5A40', fontSize: 12 }}>📅 {ev.date}{ev.heure_debut ? ` · ${ev.heure_debut}` : ''}</p>
                {ev.source && (
                  <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                    Source : {ev.source}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                    {ev.categorie}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                    {ev.acces}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                    {ev.prix}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11,
                    background: couleurStatut(ev.statut).bg,
                    color: couleurStatut(ev.statut).color
                  }}>
                    {labelStatut(ev.statut)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <a href={'/evenement/' + ev.id} target="_blank" style={{
                  background: 'rgba(255,255,255,0.06)', color: '#F7F2E8',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  textAlign: 'center', textDecoration: 'none'
                }}>Voir</a>
                {ev.statut !== 'approuve' && (
                  <button onClick={() => approuver(ev.id)} style={{
                    background: 'rgba(45,158,107,0.15)', color: '#2D9E6B',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12,
                    border: 'none', cursor: 'pointer'
                  }}>Approuver</button>
                )}
                {ev.statut !== 'rejete' && (
                  <button onClick={() => rejeter(ev.id)} style={{
                    background: 'rgba(212,168,32,0.15)', color: '#D4A820',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12,
                    border: 'none', cursor: 'pointer'
                  }}>Rejeter</button>
                )}
                <button onClick={() => supprimer(ev.id)} style={{
                  background: 'rgba(180,40,40,0.2)', color: '#e57373',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  border: 'none', cursor: 'pointer'
                }}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        {/* Signalements */}
        <div>
          <h2 style={{ color: '#C8431A', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Signalements ({signalements.length})
          </h2>
          {signalements.length === 0 ? (
            <p style={{ color: '#8C5A40' }}>Aucun signalement</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {signalements.map(sig => (
                <div key={sig.id} style={{
                  background: 'rgba(180,40,40,0.1)',
                  border: '1px solid rgba(180,40,40,0.3)',
                  borderRadius: 12, padding: 16
                }}>
                  <p style={{ color: '#8C5A40', fontSize: 11 }}>ID: {sig.evenement_id}</p>
                  <p style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{sig.raison}</p>
                  <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                    {new Date(sig.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}