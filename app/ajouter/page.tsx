'use client'

import { useState, useRef, useEffect } from 'react'
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
  { id: 11, nom: 'Droit / Juridique', icone: '⚖️' },
  { id: 12, nom: 'Loisir', icone: '🎯' },
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

const FUSEAUX = [
  { value: 'America/Port-au-Prince', label: '🇭🇹 Haïti' },
  { value: 'America/Guadeloupe', label: '🇬🇵 Guadeloupe / Martinique' },
  { value: 'America/Santo_Domingo', label: '🇩🇴 République Dominicaine' },
  { value: 'America/Jamaica', label: '🇯🇲 Jamaïque' },
  { value: 'America/Havana', label: '🇨🇺 Cuba' },
  { value: 'America/Puerto_Rico', label: '🇵🇷 Porto Rico' },
  { value: 'America/New_York', label: '🇺🇸 New York / Miami / Boston' },
  { value: 'America/Chicago', label: '🇺🇸 Chicago / Houston' },
  { value: 'America/Denver', label: '🇺🇸 Denver / Phoenix' },
  { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles / San Francisco' },
  { value: 'America/Montreal', label: '🇨🇦 Montréal / Québec' },
  { value: 'America/Toronto', label: '🇨🇦 Toronto / Ottawa' },
  { value: 'America/Vancouver', label: '🇨🇦 Vancouver' },
  { value: 'America/Mexico_City', label: '🇲🇽 Mexique' },
  { value: 'America/Bogota', label: '🇨🇴 Colombie' },
  { value: 'America/Lima', label: '🇵🇪 Pérou' },
  { value: 'America/Santiago', label: '🇨🇱 Chili' },
  { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷 Argentine' },
  { value: 'America/Sao_Paulo', label: '🇧🇷 Brésil (São Paulo)' },
  { value: 'Europe/London', label: '🇬🇧 Londres' },
  { value: 'Europe/Paris', label: '🇫🇷 Paris / Bruxelles / Genève' },
  { value: 'Europe/Berlin', label: '🇩🇪 Berlin / Amsterdam / Rome' },
  { value: 'Europe/Madrid', label: '🇪🇸 Madrid / Barcelone' },
  { value: 'Europe/Lisbon', label: '🇵🇹 Lisbonne' },
  { value: 'Europe/Moscow', label: '🇷🇺 Moscou' },
  { value: 'Africa/Abidjan', label: '🇨🇮 Côte d\'Ivoire / Sénégal / Mali' },
  { value: 'Africa/Lagos', label: '🇳🇬 Nigeria / Cameroun / Gabon' },
  { value: 'Africa/Kinshasa', label: '🇨🇩 Congo / RDC' },
  { value: 'Africa/Nairobi', label: '🇰🇪 Kenya / Éthiopie / Tanzanie' },
  { value: 'Africa/Casablanca', label: '🇲🇦 Maroc' },
  { value: 'Africa/Cairo', label: '🇪🇬 Égypte' },
  { value: 'Indian/Reunion', label: '🇷🇪 La Réunion / Maurice' },
  { value: 'Asia/Beirut', label: '🇱🇧 Liban' },
  { value: 'Asia/Riyadh', label: '🇸🇦 Arabie Saoudite / Koweït' },
  { value: 'Asia/Dubai', label: '🇦🇪 Dubaï / EAU' },
  { value: 'Asia/Tehran', label: '🇮🇷 Iran' },
  { value: 'Asia/Karachi', label: '🇵🇰 Pakistan' },
  { value: 'Asia/Kolkata', label: '🇮🇳 Inde' },
  { value: 'Asia/Dhaka', label: '🇧🇩 Bangladesh' },
  { value: 'Asia/Bangkok', label: '🇹🇭 Thaïlande / Vietnam / Cambodge' },
  { value: 'Asia/Singapore', label: '🇸🇬 Singapour / Malaisie / Philippines' },
  { value: 'Asia/Jakarta', label: '🇮🇩 Indonésie' },
  { value: 'Asia/Shanghai', label: '🇨🇳 Chine / Hong Kong / Taïwan' },
  { value: 'Asia/Seoul', label: '🇰🇷 Corée du Sud' },
  { value: 'Asia/Tokyo', label: '🇯🇵 Japon' },
  { value: 'Australia/Sydney', label: '🇦🇺 Australie (Sydney)' },
  { value: 'Pacific/Auckland', label: '🇳🇿 Nouvelle-Zélande' },
  { value: 'Pacific/Honolulu', label: '🇺🇸 Hawaï' },
  { value: 'UTC', label: '🌍 UTC — événement international / en ligne' },
]

// ── Niveaux de visibilité ─────────────────────────────────────────────────────
const VISIBILITES = [
  {
    value: 'public',
    label: '🌍 Public',
    description: 'Visible sur la carte pour tout le monde',
    color: '#2D9E6B',
    bg: 'rgba(45,158,107,0.12)',
    border: 'rgba(45,158,107,0.4)',
  },
  {
    value: 'discret',
    label: '🔒 Discret',
    description: 'Pin visible sur la carte — adresse révélée avec un code',
    color: '#D4A820',
    bg: 'rgba(212,168,32,0.12)',
    border: 'rgba(212,168,32,0.4)',
  },
  {
    value: 'prive',
    label: '🫧 Privé',
    description: 'Invisible sur la carte — accessible uniquement via lien secret',
    color: '#C8431A',
    bg: 'rgba(200,67,26,0.12)',
    border: 'rgba(200,67,26,0.4)',
  },
]
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle = {
  background: 'white',
  border: '1px solid #E8E0D0',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#1A1410',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  colorScheme: 'light' as const,
}

const labelStyle = {
  color: '#8C5A40',
  fontSize: 12,
  marginBottom: 4,
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(day)} ${mois[parseInt(month) - 1]} ${year}`
}

interface Suggestion {
  place_name: string
  center: [number, number]
  text: string
  context?: { id: string; text: string }[]
}

interface CoordsPreview {
  longitude: number
  latitude: number
  adresse: string
}

export default function AjouterEvenement() {
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [succesData, setSuccesData] = useState<{ lienSecret?: string; codeAcces?: string; visibilite?: string } | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [selectedThemes, setSelectedThemes] = useState<number[]>([])
  const [multiJours, setMultiJours] = useState(false)
  const [visibilite, setVisibilite] = useState<'public' | 'discret' | 'prive'>('public')
  const [codeAcces, setCodeAcces] = useState('')

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coordsPreview, setCoordsPreview] = useState<CoordsPreview | null>(null)
  const [adresseConfirmee, setAdresseConfirmee] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    titre: '',
    organisateur: '',
    lieu: '',
    nom_lieu: '',
    adresse: '',
    ville: '',
    pays: '',
    date: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    fuseau_organisateur: 'America/Port-au-Prince',
    description: '',
    lien: '',
    acces: 'public',
    prix: 'gratuit',
  })

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLieuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(f => ({ ...f, lieu: value }))
    setAdresseConfirmee(false)
    setCoordsPreview(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return }

    debounceRef.current = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const query = `${value}${form.ville ? ', ' + form.ville : ''}${form.pays ? ', ' + form.pays : ''}`
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5&language=fr`
      try {
        const res = await fetch(url)
        const data = await res.json()
        if (data.features?.length > 0) {
          setSuggestions(data.features)
          setShowSuggestions(true)
        }
      } catch {}
    }, 350)
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const [longitude, latitude] = suggestion.center
    let ville = form.ville
    let pays = form.pays
    if (suggestion.context) {
      const villeCtx = suggestion.context.find(c => c.id.startsWith('place') || c.id.startsWith('locality'))
      const paysCtx = suggestion.context.find(c => c.id.startsWith('country'))
      if (villeCtx) ville = villeCtx.text
      if (paysCtx) pays = paysCtx.text
    }
    setForm(f => ({ ...f, lieu: suggestion.text || suggestion.place_name.split(',')[0], ville, pays }))
    setCoordsPreview({ longitude, latitude, adresse: suggestion.place_name })
    setAdresseConfirmee(false)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const toggleTheme = (id: number) => {
    setSelectedThemes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const geocoder = async () => {
    if (coordsPreview && adresseConfirmee) {
      return { longitude: coordsPreview.longitude, latitude: coordsPreview.latitude }
    }
    const adresseComplete = `${form.lieu}, ${form.ville}, ${form.pays}`
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(adresseComplete)}.json?access_token=${token}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    if (data.features?.length > 0) {
      const [longitude, latitude] = data.features[0].center
      return { longitude, latitude }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) { alert('Choisis un type d\'événement.'); return }
    if (multiJours && form.date_fin && form.date_fin < form.date) {
      alert('La date de fin doit être après la date de début.'); return
    }
    if (coordsPreview && !adresseConfirmee) {
      alert('Vérifie l\'emplacement sur la mini-carte et clique sur "Confirmer cet emplacement".'); return
    }
    if (visibilite === 'discret' && (!codeAcces || codeAcces.length < 4)) {
      alert('Le code d\'accès doit contenir au moins 4 chiffres.'); return
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
        .from('evenements').upload(`${Date.now()}-${image.name}`, image)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('evenements').getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }
    }

    const { data: { session } } = await supabase.auth.getSession()
    const categorieNom = EVENT_TYPES.find(t => t.id === selectedType)?.nom || ''

    const { data: inserted, error } = await supabase.from('evenements').insert([{
      titre: form.titre,
      organisateur: form.organisateur || null,
      user_id: session?.user?.id || null,
      nom_lieu: form.nom_lieu || null,
      adresse: form.lieu || null,
      lieu: form.nom_lieu ? `${form.nom_lieu}, ${form.ville}` : `${form.lieu}, ${form.ville}`,
      ville: form.ville,
      pays: form.pays,
      date: form.date,
      date_debut: form.date,
      date_fin: multiJours && form.date_fin ? form.date_fin : null,
      heure_debut: form.heure_debut,
      heure_fin: form.heure_fin || null,
      fuseau_organisateur: form.fuseau_organisateur,
      categorie: categorieNom,
      event_type_id: selectedType,
      description: form.description,
      lien: form.lien,
      longitude: coords.longitude,
      latitude: coords.latitude,
      acces: form.acces,
      prix: form.prix,
      image_url: image_url,
      statut: 'en_attente',
      visibilite: visibilite,
      code_acces: visibilite === 'discret' ? codeAcces : null,
    }]).select('lien_secret').single()

    if (!error) {
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '',
        },
        body: JSON.stringify({
          titre: form.titre,
          lieu: `${form.lieu}, ${form.ville}`,
          date: multiJours && form.date_fin
            ? `${formatDate(form.date)} → ${formatDate(form.date_fin)}`
            : form.date,
          categorie: categorieNom,
        })
      }).catch(() => {})

      setSuccesData({
        lienSecret: inserted?.lien_secret,
        codeAcces: visibilite === 'discret' ? codeAcces : undefined,
        visibilite,
      })
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
        minHeight: '100dvh', background: '#F7F2E8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#1A1410', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            Événement soumis !
          </h2>
          <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Ton événement est en attente de validation.
          </p>

          {/* ── Infos visibilité ── */}
          {succesData?.visibilite === 'prive' && succesData.lienSecret && (
            <div style={{
              background: 'rgba(200,67,26,0.1)', border: '1px solid rgba(200,67,26,0.3)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left'
            }}>
              <p style={{ color: '#C8431A', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
                🫧 Événement privé — partage ce lien secret :
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <code style={{ color: '#1A1410', fontSize: 12, flex: 1, wordBreak: 'break-all' }}>
                  {`https://app.lotbo.app/evenement/secret/${succesData.lienSecret}`}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://app.lotbo.app/evenement/secret/${succesData.lienSecret}`)}
                  style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                >
                  Copier
                </button>
              </div>
            </div>
          )}

          {succesData?.visibilite === 'discret' && succesData.codeAcces && (
            <div style={{
              background: 'rgba(212,168,32,0.1)', border: '1px solid rgba(212,168,32,0.3)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left'
            }}>
              <p style={{ color: '#D4A820', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
                🔒 Événement discret — partage ce code d'accès :
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold', letterSpacing: 8 }}>
                  {succesData.codeAcces}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(succesData.codeAcces!)}
                  style={{ background: '#D4A820', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
                >
                  Copier
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/" style={{
              background: '#C8431A', color: '#F7F2E8',
              padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
              display: 'block', textAlign: 'center'
            }}>Retour à la carte</a>
            <a href="/ajouter" style={{
              background: 'rgba(255,255,255,0.06)', color: '#F7F2E8',
              border: '1px solid #333', padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none',
              display: 'block', textAlign: 'center'
            }}>+ Ajouter un autre événement</a>
          </div>
        </div>
      </main>
    )
  }

  const miniCarteUrl = coordsPreview
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+C8431A(${coordsPreview.longitude},${coordsPreview.latitude})/${coordsPreview.longitude},${coordsPreview.latitude},14,0/600x200@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    : null

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', padding: '32px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
          <h1 style={{ color: '#1A1410', fontSize: 26, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>
            Ajouter un événement
          </h1>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>Partage un événement avec la communauté Lotbo</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={labelStyle}>Titre de l'événement *</label>
            <input name="titre" placeholder="Ex: Livres en Folie 2026" onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Organisateur</label>
            <input name="organisateur" value={form.organisateur} onChange={handleChange}
              placeholder="Ex: Barreau de Petit-Goâve, Club Sportif..." style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ville *</label>
              <input name="ville" value={form.ville} placeholder="Ex: Pétion-Ville" onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pays *</label>
              <input name="pays" value={form.pays} placeholder="Ex: Haïti" onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nom du lieu *</label>
            <input name="nom_lieu" value={form.nom_lieu} placeholder="Ex: El Rancho Convention Center"
              onChange={handleChange}
              style={inputStyle}
              required autoComplete="off" />
            <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>Nom du bâtiment, salle ou espace</p>
          </div>

          <div style={{ position: 'relative' }} ref={suggestionsRef}>
            <label style={labelStyle}>Adresse complète *</label>
            <input name="lieu" value={form.lieu} placeholder="Ex: Route de Frères, Pétion-Ville"
              onChange={handleLieuChange} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              style={{ ...inputStyle, border: adresseConfirmee ? '1px solid #2D9E6B' : coordsPreview ? '1px solid #D4A820' : '1px solid #333' }}
              autoComplete="off" />
            {adresseConfirmee && (
              <span style={{ position: 'absolute', right: 14, top: 36, color: '#2D9E6B', fontSize: 16 }}>✓</span>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
                background: 'white', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => handleSelectSuggestion(s)} style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent',
                    border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #2a2a2a' : 'none',
                    color: '#1A1410', fontSize: 13, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: 13 }}>{s.text || s.place_name.split(',')[0]}</span>
                    <span style={{ color: '#8C5A40', fontSize: 11 }}>{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {coordsPreview && miniCarteUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: adresseConfirmee ? '2px solid #2D9E6B' : '2px solid #D4A820' }}>
              <img src={miniCarteUrl} alt="Emplacement" style={{ width: '100%', display: 'block', height: 180, objectFit: 'cover' }} />
              <div style={{ background: 'rgba(26,20,16,0.95)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>📍 {coordsPreview.adresse}</p>
                {!adresseConfirmee ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setAdresseConfirmee(true)} style={{
                      flex: 2, background: '#2D9E6B', color: 'white', border: 'none', borderRadius: 8,
                      padding: '9px 12px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
                    }}>✓ Confirmer cet emplacement</button>
                    <button type="button" onClick={() => { setCoordsPreview(null); setAdresseConfirmee(false); setForm(f => ({ ...f, lieu: '' })) }} style={{
                      flex: 1, background: 'rgba(255,255,255,0.06)', color: '#8C5A40',
                      border: '1px solid #333', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer'
                    }}>Corriger</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#2D9E6B', fontSize: 13, fontWeight: 'bold' }}>✓ Emplacement confirmé</span>
                    <button type="button" onClick={() => setAdresseConfirmee(false)} style={{
                      background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer', textDecoration: 'underline'
                    }}>Modifier</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <button type="button" onClick={() => { setMultiJours(!multiJours); if (multiJours) setForm(f => ({ ...f, date_fin: '' })) }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: multiJours ? 'rgba(200,67,26,0.12)' : 'rgba(255,255,255,0.04)',
              border: multiJours ? '1px solid #C8431A' : '1px solid #333',
              borderRadius: 10, padding: '10px 14px', color: multiJours ? '#1A1410' : '#8C5A40',
              fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left'
            }}>
              <span style={{ fontSize: 16 }}>{multiJours ? '✅' : '☐'}</span>
              <span>Événement sur plusieurs jours</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{multiJours ? 'Date de début *' : 'Date *'}</label>
              <input type="date" name="date" onChange={handleChange} style={inputStyle} required />
            </div>
            {multiJours && (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date de fin *</label>
                <input type="date" name="date_fin" min={form.date || undefined} onChange={handleChange} style={inputStyle} required={multiJours} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Heure de début *</label>
              <input type="time" name="heure_debut" onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Heure de fin <span style={{ color: '#555' }}>(optionnel)</span></label>
              <input type="time" name="heure_fin" onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Fuseau horaire <span style={{ color: '#555', marginLeft: 4 }}>(heure locale du lieu)</span></label>
            <select name="fuseau_organisateur" value={form.fuseau_organisateur} onChange={handleChange} style={inputStyle}>
              {FUSEAUX.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Type d'événement *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {EVENT_TYPES.map(type => (
                <button key={type.id} type="button" onClick={() => setSelectedType(type.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                  fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedType === type.id ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                  border: selectedType === type.id ? '1px solid #C8431A' : '1px solid #2a2a2a',
                  color: selectedType === type.id ? '#1A1410' : '#8C5A40',
                }}>
                  <span>{type.icone}</span><span>{type.nom}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Thèmes <span style={{ color: '#555' }}>(plusieurs possible)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {EVENT_THEMES.map(theme => (
                <button key={theme.id} type="button" onClick={() => toggleTheme(theme.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedThemes.includes(theme.id) ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                  border: selectedThemes.includes(theme.id) ? '1px solid #C8431A' : '1px solid #2a2a2a',
                  color: selectedThemes.includes(theme.id) ? '#1A1410' : '#8C5A40',
                }}>
                  <span>{theme.icone}</span><span>{theme.nom}</span>
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" placeholder="Décris l'événement..." onChange={handleChange} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>Lien pour plus de détails (optionnel)</label>
            <input name="lien" placeholder="https://" onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Photo de l'événement (optionnel)</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)}
              style={{ ...inputStyle, cursor: 'pointer' }} />
          </div>

          {/* ── F4-F6 : Visibilité 3 niveaux ─────────────────────────────── */}
          <div>
            <label style={labelStyle}>Visibilité de l'événement</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {VISIBILITES.map(v => (
                <button key={v.value} type="button" onClick={() => setVisibilite(v.value as any)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                  borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  background: visibilite === v.value ? v.bg : 'rgba(255,255,255,0.04)',
                  border: visibilite === v.value ? `1px solid ${v.border}` : '1px solid #2a2a2a',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: visibilite === v.value ? `2px solid ${v.color}` : '2px solid #444',
                    background: visibilite === v.value ? v.color : 'transparent',
                  }} />
                  <div>
                    <p style={{ color: visibilite === v.value ? '#1A1410' : '#8C5A40', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>
                      {v.label}
                    </p>
                    <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>{v.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Code d'accès pour événement discret */}
            {visibilite === 'discret' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelStyle, color: '#D4A820' }}>
                  Code d'accès (4-6 chiffres) *
                </label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={codeAcces}
                  onChange={e => setCodeAcces(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 1234"
                  style={{ ...inputStyle, border: '1px solid rgba(212,168,32,0.4)', letterSpacing: 8, fontSize: 18 }}
                />
                <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>
                  Ce code sera demandé aux visiteurs pour révéler l'adresse exacte.
                </p>
              </div>
            )}

            {visibilite === 'prive' && (
              <div style={{
                marginTop: 12, background: 'rgba(200,67,26,0.08)',
                border: '1px solid rgba(200,67,26,0.2)', borderRadius: 10, padding: '12px 14px'
              }}>
                <p style={{ color: '#C8431A', fontSize: 13, lineHeight: 1.6 }}>
                  🫧 Un lien secret unique sera généré après soumission. Seules les personnes ayant ce lien pourront voir l'événement.
                </p>
              </div>
            )}
          </div>
          {/* ────────────────────────────────────────────────────────────── */}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#8C5A40' : '#C8431A',
            color: '#F7F2E8', fontWeight: 'bold', padding: '14px', borderRadius: 10,
            border: 'none', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8
          }}>
            {loading ? 'Géocodage et publication...' : 'Soumettre l\'événement'}
          </button>

        </form>
      </div>
    </main>
  )
}
