'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const EVENT_TYPES = [
  { id: 1, nom: 'Conférence / Sommet', icone: '🎤' },
  { id: 2, nom: 'Concert / Spectacle', icone: '🎶' },
  { id: 3, nom: 'Foire / Exposition', icone: '🏪' },
  { id: 4, nom: 'Culte / Cérémonie religieuse', icone: '⛪' },
  { id: 5, nom: 'Festival', icone: '🎉' },
  { id: 6, nom: 'Tournoi / Compétition', icone: '🏆' },
  { id: 7, nom: 'Inauguration / Lancement', icone: '🎊' },
  { id: 8, nom: 'Assemblée / Réunion', icone: '🤝' },
  { id: 9, nom: 'Formation / Séminaire', icone: '📚' },
  { id: 10, nom: 'Célébration communautaire', icone: '🌍' },
]

const EVENT_THEMES = [
  { id: 1, nom: 'Religion', icone: '✝️' },
  { id: 2, nom: 'Politique', icone: '🏛️' },
  { id: 3, nom: 'Business', icone: '💼' },
  { id: 4, nom: 'Culture', icone: '🎭' },
  { id: 5, nom: 'Gastronomie', icone: '🍽️' },
  { id: 6, nom: 'Littérature', icone: '📖' },
  { id: 7, nom: 'Art', icone: '🎨' },
  { id: 8, nom: 'Artisanat', icone: '🪡' },
  { id: 9, nom: 'Sport', icone: '⚽' },
  { id: 10, nom: 'Technologie', icone: '💻' },
  { id: 11, nom: 'Éducation', icone: '🎓' },
  { id: 12, nom: 'Social', icone: '👥' },
  { id: 13, nom: 'Musique', icone: '🎵' },
  { id: 14, nom: 'Cinéma', icone: '🎬' },
  { id: 15, nom: 'Mode', icone: '👗' },
  { id: 16, nom: 'Santé', icone: '❤️' },
  { id: 17, nom: 'Environnement', icone: '🌿' },
]

export default function AjouterEvenement() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [selectedThemes, setSelectedThemes] = useState<number[]>([])
  const [form, setForm] = useState({
    titre: '',
    lieu: '',
    ville: '',
    pays: '',
    date: '',
    heure_debut: '',
    heure_fin: '',
    description: '',
    lien: '',
    acces: 'public',
    prix: 'gratuit'
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
    })
  }, [])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleTheme = (id: number) => {
    setSelectedThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
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

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!selectedType) {
      alert('Choisis un type d\'événement.')
      return
    }
    setLoading(true)

    const coords = await geocoder()
    if (!coords) {
      alert('Adresse introuvable. Vérifie le lieu, la ville et le pays.')
      setLoading(false)
      return
    }

    let image_url = ''
    if (image) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evenements')
        .upload(`${Date.now()}-${image.name}`, image)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('evenements')
          .getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }
    }

    const { data: { session } } = await supabase.auth.getSession()

    const { data: newEvent, error } = await supabase.from('evenements').insert([{
      titre: form.titre,
      user_id: session?.user.id,
      lieu: `${form.lieu}, ${form.ville}`,
      date: form.date,
      date_debut: form.date,
      heure_fin: form.heure_fin,
      categorie: EVENT_TYPES.find(t => t.id === selectedType)?.nom || '',
      event_type_id: selectedType,
      description: form.description,
      lien: form.lien,
      longitude: coords.longitude,
      latitude: coords.latitude,
      acces: form.acces,
      prix: form.prix,
      image_url: image_url,
      statut: 'publié'
    }]).select().single()

    // Lier les thèmes
    if (!error && newEvent && selectedThemes.length > 0) {
      await supabase.from('evenement_themes').insert(
        selectedThemes.map(theme_id => ({
          evenement_id: newEvent.id,
          theme_id
        }))
      )
    }

    setLoading(false)

    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      alert('Événement ajouté avec succès !')
      router.push('/')
    }
  }

  return (
    <main style={{minHeight: '100dvh'}} className="bg-black text-white p-8">
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

          {/* TYPE PRINCIPAL */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm">Type d'événement <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    selectedType === type.id
                      ? 'border-green-500 bg-green-900/30 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span>{type.icone}</span>
                  <span>{type.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {/* THÈMES */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm">Thèmes <span className="text-gray-500">(plusieurs possible)</span></label>
            <div className="flex flex-wrap gap-2">
              {EVENT_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-all ${
                    selectedThemes.includes(theme.id)
                      ? 'border-green-500 bg-green-900/30 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span>{theme.icone}</span>
                  <span>{theme.nom}</span>
                </button>
              ))}
            </div>
          </div>

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

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Photo de l'événement (optionnel)</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white" />
          </div>

          <button type="submit" disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-2">
            {loading ? 'Publication en cours...' : 'Publier l\'événement'}
          </button>

        </form>
      </div>
    </main>
  )
}