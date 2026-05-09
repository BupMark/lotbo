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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login')
        return
      }
      const role = data.session.user.user_metadata?.role
      if (role !== 'admin') {
        router.push('/')
        return
      }
      setUser(data.session.user)
      chargerEvenements()
    })
  }, [])

  const chargerEvenements = async () => {
    // Admin voit tout — la policy "admin_acces_total" autorise ça
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

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet evenement ?')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(evenements.filter(ev => ev.id !== id))
  }


  const approuver = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'approuve' }).eq('id', id)
    setEvenements(evenements.map(ev => ev.id === id ? { ...ev, statut: 'approuve' } : ev))

    // Notifier les abonnés
    const ev = evenements.find(e => e.id === id)
    if (ev) {
      fetch('/api/notify-abonnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ev.id,
          titre: ev.titre,
          lieu: ev.lieu,
          date: ev.date,
          categorie: ev.categorie
        })
      }).catch(() => {})
    }
  }
  const rejeter = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'rejete' }).eq('id', id)
    setEvenements(evenements.map(ev => ev.id === id ? { ...ev, statut: 'rejete' } : ev))
  }

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410' }} className="text-white p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            <span style={{ color: '#F7F2E8', fontSize: 24, fontWeight: 'bold' }}>lot</span>
            <span style={{ color: '#C8431A', fontSize: 24, fontWeight: 'bold' }}>bo</span>
            <span style={{ color: '#8C5A40', fontSize: 14, marginLeft: 12 }}>admin</span>
          </div>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13 }}
            className="hover:text-white transition-colors">
            ← Retour à la carte
          </a>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #333', borderRadius: 12 }}
          className="p-4 mb-6">
          <p style={{ color: '#8C5A40', fontSize: 13 }}>
            Connecté en tant que <span style={{ color: '#C8431A' }}>{user?.email}</span>
          </p>
          <p style={{ color: '#8C5A40', fontSize: 13, marginTop: 4 }}>
            Total : <span style={{ color: '#F7F2E8', fontWeight: 'bold' }}>{evenements.length} événements</span>
            {' · '}
            <span style={{ color: '#C8431A' }}>
              {evenements.filter(e => e.statut !== 'approuve' && e.statut !== 'rejete').length} en attente
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-12">
          {evenements.map(ev => (
            <div key={ev.id}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12 }}
              className="p-4 flex gap-4 items-start">

              {ev.image_url && (
                <img src={ev.image_url} alt={ev.titre}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              )}

              <div className="flex-1">
                <h2 className="font-bold text-lg" style={{ color: '#F7F2E8' }}>{ev.titre}</h2>
                <p style={{ color: '#8C5A40', fontSize: 13 }}>📍 {ev.lieu}</p>
                <p style={{ color: '#8C5A40', fontSize: 13 }}>📅 {ev.date}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
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
                    background: ev.statut === 'approuve' ? 'rgba(200,67,26,0.15)' :
                      ev.statut === 'rejete' ? 'rgba(180,40,40,0.2)' : 'rgba(212,168,32,0.15)',
                    color: ev.statut === 'approuve' ? '#C8431A' :
                      ev.statut === 'rejete' ? '#e57373' : '#D4A820'
                  }}>
                    {ev.statut === 'approuve' ? '✓ Approuvé' :
                      ev.statut === 'rejete' ? '✗ Rejeté' : '⏳ En attente'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a href={'/evenement/' + ev.id} target="_blank"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#F7F2E8', padding: '6px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>
                  Voir
                </a>
                {ev.statut !== 'approuve' && (
                  <button onClick={() => approuver(ev.id)}
                    style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                    Approuver
                  </button>
                )}
                {ev.statut !== 'rejete' && (
                  <button onClick={() => rejeter(ev.id)}
                    style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                    Rejeter
                  </button>
                )}
                <button onClick={() => supprimer(ev.id)}
                  style={{ background: 'rgba(180,40,40,0.2)', color: '#e57373', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                  Supprimer
                </button>
              </div>

            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 style={{ color: '#C8431A', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Signalements ({signalements.length})
          </h2>
          {signalements.length === 0 ? (
            <p style={{ color: '#8C5A40' }}>Aucun signalement</p>
          ) : (
            <div className="flex flex-col gap-3">
              {signalements.map(sig => (
                <div key={sig.id}
                  style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 12, padding: 16 }}>
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