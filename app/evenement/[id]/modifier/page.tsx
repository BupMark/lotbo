'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import CarteInteractive, { Coords } from '../../../components/CarteInteractive'

interface Suggestion {
  place_name: string
  center: [number, number]
  text: string
  context?: { id: string; text: string }[]
  place_id?: string
  _osm_lat?: string
  _osm_lon?: string
}

interface EvenementEdit {
  id: string
  titre: string
  organisateur: string | null
  ville: string
  pays: string
  nom_lieu: string | null
  adresse: string | null
  date: string
  date_fin: string | null
  heure_debut: string | null
  heure_fin: string | null
  description: string | null
  lien: string | null
  acces: 'public' | 'prive'
  prix: 'gratuit' | 'payant'
  image_url: string | null
  user_id: string | null
  organisation_id: string | null
  statut: string
  latitude: number | null
  longitude: number | null
  est_recurrent: boolean
}

export default function ModifierEvenement() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [ev, setEv]                 = useState<EvenementEdit | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [monRoleOrg, setMonRoleOrg] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [message, setMessage]       = useState('')
  const [messageType, setMessageType] = useState<'succes' | 'erreur'>('erreur')

  const [titre, setTitre]           = useState('')
  const [organisateur, setOrganisateur] = useState('')
  const [ville, setVille]           = useState('')
  const [pays, setPays]             = useState('')
  const [nomLieu, setNomLieu]       = useState('')
  const [adresse, setAdresse]       = useState('')
  const [date, setDate]             = useState('')
  const [dateFin, setDateFin]       = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin]     = useState('')
  const [description, setDescription] = useState('')
  const [lien, setLien]             = useState('')
  const [acces, setAcces]           = useState<'public' | 'prive'>('public')
  const [prix, setPrix]             = useState<'gratuit' | 'payant'>('gratuit')
  const [image, setImage]           = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [latitude, setLatitude]       = useState<number | null>(null)
  const [longitude, setLongitude]     = useState<number | null>(null)
  const [pinConfirme, setPinConfirme] = useState(false)
  const [rechercheTexte, setRechercheTexte]   = useState('')
  const [suggestions, setSuggestions]         = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? null
      setUserId(uid)

      const { data: evData } = await supabase
        .from('evenements')
        .select('*')
        .eq('id', id)
        .single()

      if (!evData) { router.push('/'); return }
      setEv(evData)

      setTitre(evData.titre || '')
      setOrganisateur(evData.organisateur || '')
      setVille(evData.ville || '')
      setPays(evData.pays || '')
      setNomLieu(evData.nom_lieu || '')
      setAdresse(evData.adresse || '')
      setDate(evData.date?.slice(0, 10) || '')
      setDateFin(evData.date_fin?.slice(0, 10) || '')
      setHeureDebut(evData.heure_debut || '')
      setHeureFin(evData.heure_fin || '')
      setDescription(evData.description || '')
      setLien(evData.lien || '')
      setAcces(evData.acces || 'public')
      setPrix(evData.prix || 'gratuit')
      setImagePreview(evData.image_url || null)
      setLatitude(evData.latitude ?? null)
      setLongitude(evData.longitude ?? null)
      setPinConfirme(evData.latitude != null)
      setRechercheTexte(evData.nom_lieu || '')

      if (evData.organisation_id && uid) {
        const { data: membreData } = await supabase
          .from('organisation_membres')
          .select('role')
          .eq('org_id', evData.organisation_id)
          .eq('user_id', uid)
          .maybeSingle()
        setMonRoleOrg(membreData?.role ?? null)
      }

      setLoading(false)
    }
    init()
  }, [id, router])

  const peutModifier = !loading && ev && (
    userId === ev.user_id
    || monRoleOrg === 'owner'
    || monRoleOrg === 'admin'
    || monRoleOrg === 'editeur'
  )

  useEffect(() => {
    if (!loading && ev && !peutModifier) {
      router.push(`/evenement/${id}`)
    }
  }, [loading, ev, peutModifier, id, router])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRechercheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRechercheTexte(value)
    setPinConfirme(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const query = `${value}${ville ? ', ' + ville : ''}${pays ? ', ' + pays : ''}`
      try {
        const res  = await fetch(`/api/places-autocomplete?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.predictions?.length > 0) {
          setSuggestions(data.predictions.map((p: { description: string; structured_formatting?: { main_text: string }; place_id: string; _osm_lat?: string; _osm_lon?: string }) => ({
            place_name: p.description,
            text: p.structured_formatting?.main_text || p.description,
            center: [0, 0] as [number, number],
            place_id: p.place_id,
            _osm_lat: p._osm_lat,
            _osm_lon: p._osm_lon,
          })))
          setShowSuggestions(true)
        }
      } catch {}
    }, 350)
  }

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setRechercheTexte(suggestion.place_name)
    setSuggestions([])
    setShowSuggestions(false)
    setPinConfirme(false)
    setNomLieu(suggestion.text || suggestion.place_name.split(',')[0])
    setAdresse(suggestion.place_name)

    if (suggestion._osm_lat && suggestion._osm_lon) {
      setLatitude(parseFloat(suggestion._osm_lat))
      setLongitude(parseFloat(suggestion._osm_lon))
      setPinConfirme(true)
      return
    }
    if (suggestion.place_id) {
      try {
        const res  = await fetch(`/api/places-details?place_id=${suggestion.place_id}`)
        const data = await res.json()
        const loc  = data.result?.geometry?.location
        if (loc) {
          setLatitude(loc.lat)
          setLongitude(loc.lng)
          setPinConfirme(true)
          return
        }
      } catch {}
    }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const url   = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(suggestion.place_name)}.json?access_token=${token}&limit=1`
    try {
      const res  = await fetch(url)
      const data = await res.json()
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center
        setLatitude(lat)
        setLongitude(lng)
        setPinConfirme(true)
      }
    } catch {}
  }

  const handleSave = async () => {
    if (!ev || !peutModifier) return
    setSaving(true)
    setMessage('')

    try {
      let image_url = ev.image_url

      if (image) {
        const ext = image.name.split('.').pop()?.toLowerCase() || 'jpg'
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evenements')
          .upload(safeName, image, { upsert: true })
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('evenements').getPublicUrl(uploadData.path)
          image_url = publicUrl
        }
      }

      const { error } = await supabase
        .from('evenements')
        .update({
          titre,
          organisateur: organisateur || null,
          ville,
          pays,
          nom_lieu: nomLieu || null,
          adresse: adresse || null,
          date: date || null,
          date_fin: dateFin || null,
          heure_debut: heureDebut || null,
          heure_fin: heureFin || null,
          description: description || null,
          lien: lien || null,
          acces,
          prix,
          image_url,
          latitude: latitude ?? ev.latitude,
          longitude: longitude ?? ev.longitude,
        })
        .eq('id', ev.id)

      if (error) throw error

      setMessageType('succes')
      setMessage('✅ Événement mis à jour avec succès !')
      setTimeout(() => router.push(`/evenement/${id}`), 1500)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessageType('erreur')
      setMessage('Erreur : ' + msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement…</p>
    </main>
  )

  if (!peutModifier) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'white', border: '1px solid #E8E0D0',
    borderRadius: 10, padding: '10px 14px', fontSize: 14,
    color: '#1A1410', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#8C5A40',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block',
  }

  const sectionStyle: React.CSSProperties = {
    background: 'white', border: '1px solid #E8E0D0',
    borderRadius: 16, padding: 20, marginBottom: 16,
  }

  const coordsPin: Coords | null = latitude !== null && longitude !== null
    ? { latitude, longitude, adresse: rechercheTexte || adresse || '' }
    : null

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>

        <div style={{ marginBottom: 24 }}>
          <a href={`/evenement/${id}`} style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>
            ← Retour à l&apos;événement
          </a>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', marginTop: 8, color: '#1A1410' }}>
            Modifier l&apos;événement
          </h1>
          {ev?.statut === 'approuve' && (
            <div style={{ background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.25)', borderRadius: 8, padding: '8px 14px', marginTop: 12, fontSize: 13, color: '#C8431A' }}>
              ℹ️ Cet événement est publié — vos modifications seront visibles immédiatement.
            </div>
          )}
        </div>

        {/* Image */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Image de l&apos;événement</label>
          {imagePreview && (
            <img src={imagePreview} alt="preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
          )}
          <label style={{ display: 'inline-block', background: '#F7F2E8', border: '1px dashed #C8431A', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13, color: '#C8431A', fontWeight: 'bold' }}>
            📷 {imagePreview ? "Changer l'image" : 'Ajouter une image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Infos principales */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Titre *</label>
          <input value={titre} onChange={e => setTitre(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} placeholder="Titre de l'événement" />

          <label style={labelStyle}>Organisateur</label>
          <input value={organisateur} onChange={e => setOrganisateur(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} placeholder="Nom de l'organisateur" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Ville *</label>
              <input value={ville} onChange={e => setVille(e.target.value)} style={inputStyle} placeholder="Ville" />
            </div>
            <div>
              <label style={labelStyle}>Pays *</label>
              <input value={pays} onChange={e => setPays(e.target.value)} style={inputStyle} placeholder="Pays" />
            </div>
          </div>

          <label style={labelStyle}>📍 Localisation sur la carte</label>
          <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8 }}>Recherche le lieu pour repositionner le pin sur la carte</p>
          <div style={{ position: 'relative', marginBottom: 12 }} ref={suggestionsRef}>
            <input
              value={rechercheTexte}
              onChange={handleRechercheChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Ex. : Pétion-Ville, El Rancho…"
              style={{
                ...inputStyle,
                border: pinConfirme ? '1px solid #C8431A' : latitude ? '1px solid #D4A820' : '1px solid #E8E0D0',
              }}
              autoComplete="off"
            />
            {pinConfirme && <span style={{ position: 'absolute', right: 14, top: 14, color: '#C8431A', fontSize: 16 }}>✓</span>}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4, background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #E8E0D0' : 'none', color: '#1A1410', fontSize: 13, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F7F2E8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: 13 }}>{s.text || s.place_name.split(',')[0]}</span>
                    <span style={{ color: '#8C5A40', fontSize: 11 }}>{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label style={labelStyle}>Nom du lieu</label>
          <input value={nomLieu} onChange={e => setNomLieu(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} placeholder="Nom du lieu" />

          <label style={labelStyle}>Adresse</label>
          <input value={adresse} onChange={e => setAdresse(e.target.value)} style={{ ...inputStyle, marginBottom: coordsPin ? 12 : 0 }} placeholder="Adresse complète" />

          {coordsPin && (
            <div>
              <CarteInteractive
                coords={coordsPin}
                onCoordsChange={(c) => {
                  setLatitude(c.latitude)
                  setLongitude(c.longitude)
                  setPinConfirme(true)
                }}
              />
              <div style={{ marginTop: 10 }}>
                {!pinConfirme ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setPinConfirme(true)} style={{ flex: 2, background: '#C8431A', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>✓ Confirmer cet emplacement</button>
                    <button type="button" onClick={() => { setLatitude(null); setLongitude(null); setPinConfirme(false); setRechercheTexte('') }} style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 8, padding: '10px 12px', fontSize: 13, cursor: 'pointer' }}>Réinitialiser</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#C8431A', fontSize: 13, fontWeight: 'bold' }}>✓ Emplacement confirmé</span>
                    <button type="button" onClick={() => setPinConfirme(false)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Modifier</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Date de début *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date de fin</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Heure de début</label>
              <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Heure de fin</label>
              <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            placeholder="Description de l'événement" />
        </div>

        {/* Accès & Prix */}
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Accès</label>
              <select value={acces} onChange={e => setAcces(e.target.value as 'public' | 'prive')} style={inputStyle}>
                <option value="public">Public</option>
                <option value="prive">Privé</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prix</label>
              <select value={prix} onChange={e => setPrix(e.target.value as 'gratuit' | 'payant')} style={inputStyle}>
                <option value="gratuit">Gratuit</option>
                <option value="payant">Payant</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Lien officiel</label>
          <input value={lien} onChange={e => setLien(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>

        {message && (
          <div style={{
            background: messageType === 'succes' ? 'rgba(45,158,107,0.1)' : 'rgba(200,67,26,0.1)',
            border: `1px solid ${messageType === 'succes' ? 'rgba(45,158,107,0.3)' : 'rgba(200,67,26,0.3)'}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            color: messageType === 'succes' ? '#2D9E6B' : '#C8431A', fontSize: 14,
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, background: '#C8431A', color: 'white', border: 'none',
            borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 'bold',
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Enregistrement…' : '💾 Enregistrer les modifications'}
          </button>
          <a href={`/evenement/${id}`} style={{
            background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0',
            borderRadius: 12, padding: '14px 20px', fontSize: 14, fontWeight: 'bold',
            textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
            Annuler
          </a>
        </div>

      </div>
    </main>
  )
}
