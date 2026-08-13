'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toastAmbiantLoyita } from '../lib/celebrerAction'

interface Props {
  ville: string
  pays?: string | null
}

export default function SuivreVilleBouton({ ville, pays }: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [suivie, setSuivie] = useState(false)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id || null
      setUserId(uid)
      if (uid) {
        const { data: ligne } = await supabase
          .from('villes_suivies')
          .select('id')
          .eq('user_id', uid)
          .eq('ville', ville)
          .maybeSingle()
        setSuivie(!!ligne)
      }
      setChargement(false)
    }
    init()
  }, [ville])

  const toggle = async () => {
    if (!userId) {
      window.location.href = '/inscription'
      return
    }
    if (suivie) {
      const { error } = await supabase.from('villes_suivies').delete().eq('user_id', userId).eq('ville', ville)
      if (error) { console.error('[SuivreVilleBouton] delete error:', error); return }
      setSuivie(false)
    } else {
      const { error } = await supabase.from('villes_suivies').insert([{ user_id: userId, ville, pays: pays || null }])
      if (error) { console.error('[SuivreVilleBouton] insert error:', error); return }
      setSuivie(true)
      toastAmbiantLoyita('ville_suivie_repetee')
    }
  }

  if (chargement) return null

  return (
    <button onClick={toggle} style={{
      background: suivie ? 'white' : '#C8431A',
      color: suivie ? '#C8431A' : 'white',
      border: suivie ? '1px solid #C8431A' : 'none',
      borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 'bold',
      cursor: 'pointer',
    }}>
      {suivie ? '✓ Ville suivie' : '📍 Suivre cette ville'}
    </button>
  )
}
