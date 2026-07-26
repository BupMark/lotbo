'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import CarteVilleCelebration from './CarteVilleCelebration'

interface DonneesCelebration {
  ville: string
  pays: string | null
  nbEvenements: number
}

interface DonneesPhoto {
  image_url: string | null
  auteur: string | null
  licence: string | null
}

const CLE_LOCALSTORAGE = 'lotbo_derniere_celebration_ville_vue'

export default function CelebrationVilleGlobal() {
  const searchParams = useSearchParams()
  const [donnees, setDonnees] = useState<DonneesCelebration | null>(null)
  const [photo, setPhoto] = useState<DonneesPhoto | null>(null)
  const [afficher, setAfficher] = useState(false)

  useEffect(() => {
    const verifier = async () => {
      const forcerOuverture = searchParams.get('celebration') === '1'

      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id

      const url = uid
        ? `/api/classement-villes/celebration-a-voir?user_id=${uid}`
        : `/api/classement-villes/celebration-a-voir`
      const res = await fetch(url)
      const etat = await res.json()

      if (!etat.ville) return

      let doitAfficher = forcerOuverture

      if (!doitAfficher) {
        if (uid) {
          doitAfficher = etat.aVoir
        } else {
          const stocke = localStorage.getItem(CLE_LOCALSTORAGE)
          doitAfficher = !stocke || new Date(stocke) < new Date(etat.devenueTopLe)
        }
      }

      if (!doitAfficher) return

      setDonnees({ ville: etat.ville, pays: etat.pays, nbEvenements: etat.nbEvenements })

      const resPhoto = await fetch(`/api/wikimedia-ville-photo?ville=${encodeURIComponent(etat.ville)}`)
      const dataPhoto = await resPhoto.json()
      setPhoto({
        image_url: dataPhoto.trouve ? dataPhoto.image_url : null,
        auteur: dataPhoto.auteur || null,
        licence: dataPhoto.licence || null,
      })

      setAfficher(true)
    }
    verifier()
  }, [searchParams])

  const fermer = async () => {
    setAfficher(false)
    const maintenant = new Date().toISOString()
    const { data: sessionData } = await supabase.auth.getSession()
    const uid = sessionData.session?.user?.id

    if (uid) {
      await supabase.from('profiles').update({ derniere_celebration_ville_vue: maintenant }).eq('id', uid)
    } else {
      localStorage.setItem(CLE_LOCALSTORAGE, maintenant)
    }
  }

  if (!afficher || !donnees) return null

  return (
    <CarteVilleCelebration
      ville={donnees.ville}
      pays={donnees.pays}
      nbEvenements={donnees.nbEvenements}
      imageUrl={photo?.image_url || null}
      auteur={photo?.auteur || null}
      licence={photo?.licence || null}
      onClose={fermer}
    />
  )
}
