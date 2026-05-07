'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AjouterEvenement() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titre: '',
    lieu: '',
    ville: '',
    pays: '',
    date: '',
    heure_debut: '',
    heure_fin: '',
    categorie: '',
    description: '',
    lien: '',
    acces: 'public',
    prix: 'gratuit'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const geocoder = async () => {
    const adresseComplete = `${form.lieu}, ${form.ville}, ${form.pays}`
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(adresseComplete)}.json?access_token=${token}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const coords = await geocoder()

    if (!coords) {
      alert('Adresse introuvable. Vérifie le lieu, la ville et le pays.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('evenements').insert([{
      titre: form.titre,
      lieu: `${form.lieu}, ${form.ville}`,
      date: form.date,
      heure_fin: form.heure_fin,
      categorie: form.categorie,
      description: form.description,
      lien: form.lien,
      longitude: coords.longitude,
      latitude: coords.latitude,
      acces: form.acces,
      prix: form.prix
    }])

    setLoading(false)

    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      alert('Événement ajouté avec succès !')
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-2">Ajouter un événement</h1>
        <p className="text-gray-400 mb-8">Partage un événement avec la communauté Lotbo</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input name="titre" placeholder="Titre de l'événement" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          <input name="lieu" placeholder="Nom du lieu (ex: El Rancho Convention Center)" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          <input name="ville" placeholder="Ville (ex: Pétion-Ville)" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          <input name="pays" placeholder="Pays (ex: Haiti)" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Date</label>
            <input type="date" name="date" onChange={handleChange}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col w-1/2 gap-1">
              <label className="text-gray-400 text-sm">Début</label>
              <input type="time" name="heure_debut" onChange={handleChange}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />
            </div>
            <div className="flex flex-col w-1/2 gap-1">
              <label className="text-gray-400 text-sm">Fin</label>
              <input type="time" name="heure_fin" onChange={handleChange}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required />
            </div>
          </div>

          <select name="categorie" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" required>
            <option value="">Catégorie</option>
            <option value="Festival">Festival</option>
            <option value="Musique">Musique</option>
            <option value="Art">Art</option>
            <option value="Sport">Sport</option>
            <option value="Gastronomie">Gastronomie</option>
            <option value="Culture">Culture</option>
            <option value="Conférence">Conférence</option>
            <option value="Autre">Autre</option>
          </select>

          <div className="flex gap-4">
            <div className="flex flex-col w-1/2 gap-1">
              <label className="text-gray-400 text-sm">Accès</label>
              <select name="acces" onChange={handleChange}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="public">Public</option>
                <option value="prive">Privé</option>
              </select>
            </div>
            <div className="flex flex-col w-1/2 gap-1">
              <label className="text-gray-400 text-sm">Prix</label>
              <select name="prix" onChange={handleChange}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="gratuit">Gratuit</option>
                <option value="payant">Payant</option>
              </select>
            </div>
          </div>

          <textarea name="description" placeholder="Description de l'événement" onChange={handleChange} rows={4}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" />

          <input name="lien" placeholder="Lien pour plus de détails (optionnel)" onChange={handleChange}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" />

          <button type="submit" disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-2">
            {loading ? 'Recherche de l\'adresse...' : 'Publier l\'événement'}
          </button>

        </form>
      </div>
    </main>
  )
}