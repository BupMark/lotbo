'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface VilleSuivie {
  id: string
  ville: string
  pays: string | null
}

export default function RechercheVilleSuivre({ userId }: { userId: string }) {
  const [toutesVilles, setToutesVilles] = useState<string[]>([])
  const [suivies, setSuivies] = useState<VilleSuivie[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const charger = async () => {
      const [{ data: evs }, { data: mesVilles }] = await Promise.all([
        supabase.from('evenements').select('ville').eq('statut', 'approuve').not('ville', 'is', null).limit(5000),
        supabase.from('villes_suivies').select('id, ville, pays').eq('user_id', userId),
      ])
      const uniques = Array.from(new Set((evs || []).map(e => e.ville).filter(Boolean))) as string[]
      setToutesVilles(uniques.sort())
      setSuivies(mesVilles || [])
      setChargement(false)
    }
    charger()
  }, [userId])

  const suivre = async (ville: string) => {
    await supabase.from('villes_suivies').insert([{ user_id: userId, ville }])
    setSuivies(s => [...s, { id: crypto.randomUUID(), ville, pays: null }])
    setRecherche('')
  }

  const arreter = async (ville: string) => {
    await supabase.from('villes_suivies').delete().eq('user_id', userId).eq('ville', ville)
    setSuivies(s => s.filter(v => v.ville !== ville))
  }

  const dejaSuivie = (v: string) => suivies.some(s => s.ville === v)
  const resultats = recherche.trim().length > 0
    ? toutesVilles.filter(v => v.toLowerCase().includes(recherche.trim().toLowerCase()) && !dejaSuivie(v)).slice(0, 8)
    : []
  const aucuneCorrespondance = recherche.trim().length > 1 && resultats.length === 0

  if (chargement) return null

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #E8E0D0' }}>
      <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#1A1410', marginBottom: 4 }}>📍 Mes villes suivies</h3>
      <p style={{ fontSize: 12, color: '#8C5A40', marginBottom: 16, lineHeight: 1.5 }}>
        Reçois un résumé quotidien des nouveaux événements dans les villes que tu suis.
      </p>

      <input
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        placeholder="Chercher une ville à suivre..."
        style={{ width: '100%', background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1A1410', outline: 'none', marginBottom: 8 }}
      />

      {resultats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {resultats.map(v => (
            <button key={v} onClick={() => suivre(v)} style={{
              textAlign: 'left', background: '#F7F2E8', border: '1px solid #E8E0D0',
              borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#1A1410', cursor: 'pointer',
            }}>
              + {v}
            </button>
          ))}
        </div>
      )}

      {aucuneCorrespondance && (
        <p style={{ fontSize: 12, color: '#8C5A40', marginBottom: 16, lineHeight: 1.5 }}>
          Cette ville n&apos;est pas encore présente sur LOTBO. Tu y connais un événement ?{' '}
          <a href="/ajouter" style={{ color: '#C8431A', fontWeight: 'bold', textDecoration: 'none' }}>Ajoute-le →</a>
        </p>
      )}

      {suivies.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suivies.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(200,67,26,0.06)', borderRadius: 10, border: '1px solid rgba(200,67,26,0.15)' }}>
              <a href={`/ville/${encodeURIComponent(v.ville)}`} style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410', textDecoration: 'none' }}>{v.ville}</a>
              <button onClick={() => arreter(v.ville)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer' }}>
                Ne plus suivre
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#8C5A40' }}>Aucune ville suivie pour l&apos;instant.</p>
      )}
    </div>
  )
}
