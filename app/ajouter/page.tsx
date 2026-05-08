'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

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

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid #333',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#F7F2E8',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const labelStyle = {
  color: '#8C5A40',
  fontSize: 12,
  marginBottom: 4,
}

export default function AjouterEvenement() {
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Récupère le user si connecté, null sinon
    const { data: { session } } = await supabase.auth.getSession()

    const { data: newEvent, error } = await supabase.from('evenements').insert([{
      titre: form.titre,
      user_id: session?.user.id || null,
      lieu: `${form.lieu}, ${form.ville}`,
      date: form.date,
      date_debut: form.date,
      heure_debut: form.heure_debut,
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
      statut: 'en_attente',   // ← toujours en_attente, jamais publié
    }]).select().single()

    // Lier les thèmes si connecté (RLS sur evenement_themes)
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
      setSucces(true)
    }
  }

  // ── Écran de confirmation ──
  if (succes) {
    return (
      <main style={{
        minHeight: '100dvh', background: '#1A1410',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#F7F2E8', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            Événement soumis !
          </h2>
          <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Ton événement est en attente de validation. Il apparaîtra sur la carte dès qu'il sera approuvé.
          </p>
          <a href="/" style={{
            background: '#C8431A', color: '#F7F2E8',
            padding: '12px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
            display: 'inline-block'
          }}>
            Retour à la carte
          </a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', padding: '32px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
            ← Retour à la carte
          </a>
          <h1 style={{ color: '#F7F2E8', fontSize: 26, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
            Ajouter un événement
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>
            Partage un événement avec la communauté Lotbo
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Titre */}
          <div>
            <label style={labelStyle}>Titre de l'événement *</label>
            <input name="titre" placeholder="Ex: Livres en Folie 2026"
              onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Lieu */}
          <div>
            <label style={labelStyle}>Nom du lieu *</label>
            <input name="lieu" placeholder="Ex: El Rancho Convention Center"
              onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Ville + Pays */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ville *</label>
              <input name="ville" placeholder="Ex: Pétion-Ville"
                onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pays *</label>
              <input name="pays" placeholder="Ex: Haïti"
                onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" name="date"
              onChange={handleChange} style={inputStyle} required />
          </div>

          {/* Heures */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Début *</label>
              <input type="time" name="heure_debut"
                onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fin *</label>
              <input type="time" name="heure_fin"
                onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Type principal */}
          <div>
            <label style={labelStyle}>Type d'événement *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {EVENT_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10, fontSize: 13,
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    background: selectedType === type.id ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedType === type.id ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    color: selectedType === type.id ? '#F7F2E8' : '#8C5A40',
                  }}
                >
                  <span>{type.icone}</span>
                  <span>{type.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thèmes */}
          <div>
            <label style={labelStyle}>Thèmes <span style={{ color: '#555' }}>(plusieurs possible)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {EVENT_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 999, fontSize: 12,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: selectedThemes.includes(theme.id) ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedThemes.includes(theme.id) ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    color: selectedThemes.includes(theme.id) ? '#F7F2E8' : '#8C5A40',
                  }}
                >
                  <span>{theme.icone}</span>
                  <span>{theme.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accès + Prix */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Accès</label>
              <select name="acces" onChange={handleChange} style={inputStyle}>
                <option value="public">Public</option>
                <option value="prive">Privé</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prix</label>
              <select name="prix" onChange={handleChange} style={inputStyle}>
                <option value="gratuit">Gratuit</option>
                <option value="payant">Payant</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" placeholder="Décris l'événement..."
              onChange={handleChange} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Lien */}
          <div>
            <label style={labelStyle}>Lien pour plus de détails (optionnel)</label>
            <input name="lien" placeholder="https://..."
              onChange={handleChange} style={inputStyle} />
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Photo de l'événement (optionnel)</label>
            <input type="file" accept="image/*"
              onChange={e => setImage(e.target.files?.[0] || null)}
              style={{ ...inputStyle, cursor: 'pointer' }} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            background: loading ? '#8C5A40' : '#C8431A',
            color: '#F7F2E8', fontWeight: 'bold',
            padding: '14px', borderRadius: 10,
            border: 'none', fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 8
          }}>
            {loading ? 'Géocodage et publication...' : 'Soumettre l\'événement'}
          </button>

        </form>
      </div>
    </main>
  )
}