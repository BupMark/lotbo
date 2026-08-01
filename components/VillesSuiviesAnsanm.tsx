'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface VilleSuivie {
  id: string
  ville: string
  pays: string | null
}

export default function VillesSuiviesAnsanm({ userId }: { userId: string }) {
  const [suivies, setSuivies] = useState<VilleSuivie[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from('villes_suivies')
        .select('id, ville, pays')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setSuivies(data || [])
      setChargement(false)
    }
    charger()
  }, [userId])

  if (chargement) return null

  return (
    <div id="ansanm-villes-suivies" style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 20, marginTop: 16 }}>
      <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold', marginBottom: 14 }}>📍 Tes villes suivies</p>
      {suivies.length === 0 && (
        <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 4 }}>
          Suis une ville pour recevoir un résumé quotidien de ses nouveaux événements.
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {suivies.map(v => (
          <a key={v.id} href={`/ville/${encodeURIComponent(v.ville)}`} style={{
            background: 'rgba(200,67,26,0.08)', color: '#1A1410', textDecoration: 'none',
            borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 500,
            border: '1px solid rgba(200,67,26,0.2)',
          }}>
            {v.ville}
          </a>
        ))}
      </div>
      <a href="/profil?onglet=favoris" style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', marginTop: 14, display: 'inline-block' }}>
        + Suivre une nouvelle ville
      </a>
    </div>
  )
}
