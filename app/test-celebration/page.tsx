'use client'

import { useEffect, useState } from 'react'
import CarteVilleCelebration from '../../components/CarteVilleCelebration'

export default function TestCelebration() {
  const [donnees, setDonnees] = useState<{
    image_url: string | null
    auteur: string | null
    licence: string | null
  } | null>(null)

  useEffect(() => {
    fetch('/api/wikimedia-ville-photo?ville=New%20Delhi')
      .then(r => r.json())
      .then(setDonnees)
  }, [])

  if (!donnees) return <p style={{ padding: 40 }}>Chargement...</p>

  return (
    <CarteVilleCelebration
      ville="New Delhi"
      pays="Inde"
      nbEvenements={94}
      imageUrl={donnees.image_url}
      auteur={donnees.auteur}
      licence={donnees.licence}
      onClose={() => alert('Fermé (test)')}
    />
  )
}
