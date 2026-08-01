'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import SuivreVilleBouton from '../../../components/SuivreVilleBouton'

interface EvenementLigne {
  id: string
  titre: string
  date_debut: string
  lieu: string | null
  pays: string | null
}

export default function FicheVillePage() {
  const params = useParams()
  const ville = decodeURIComponent(String(params.nom || ''))
  const [evenements, setEvenements] = useState<EvenementLigne[]>([])
  const [pays, setPays] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const charger = async () => {
      const aujourdhui = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('evenements')
        .select('id, titre, date_debut, lieu, pays')
        .eq('statut', 'approuve')
        .eq('ville', ville)
        .gte('date_debut', aujourdhui)
        .order('date_debut', { ascending: true })
        .limit(200)
      setEvenements(data || [])
      if (data && data[0]) setPays(data[0].pays)
      setChargement(false)
    }
    if (ville) charger()
  }, [ville])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F2E8', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>{ville}</h1>
        {pays && <p style={{ fontSize: 13, color: '#8C5A40', marginBottom: 16 }}>{pays}</p>}

        <div style={{ marginBottom: 20 }}>
          <SuivreVilleBouton ville={ville} pays={pays} />
        </div>

        {chargement ? (
          <p style={{ color: '#8C5A40', fontSize: 13 }}>Chargement…</p>
        ) : evenements.length === 0 ? (
          <p style={{ color: '#8C5A40', fontSize: 13 }}>Aucun événement à venir pour l&apos;instant à {ville}.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evenements.map(ev => (
              <a key={ev.id} href={`/evenement/${ev.id}`} style={{
                display: 'block', background: 'white', border: '1px solid #E8E0D0',
                borderRadius: 12, padding: '14px 16px', textDecoration: 'none',
              }}>
                <p style={{ fontWeight: 'bold', fontSize: 14, color: '#1A1410', marginBottom: 4 }}>{ev.titre}</p>
                <p style={{ fontSize: 12, color: '#8C5A40' }}>{ev.date_debut}{ev.lieu ? ` · ${ev.lieu}` : ''}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
