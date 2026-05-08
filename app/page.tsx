'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './popup.css'
import { supabase } from '../lib/supabase'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

const CATEGORIES = ['Toutes', 'Festival', 'Musique', 'Art', 'Sport', 'Gastronomie', 'Culture', 'Conference', 'Autre']

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [categorie, setCategorie] = useState('Toutes')
  const [acces, setAcces] = useState('tous')
  const [prix, setPrix] = useState('tous')
  const [evenements, setEvenements] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [recherche, setRecherche] = useState('')
  const [mode, setMode] = useState<'carte' | 'liste'>('carte')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-72.3388, 18.5444],
      zoom: 8
    })

    map.on('load', async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 12
          })
        })
      }
      const aujourd_hui = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('evenements')
        .select('*')
        .eq('statut', 'approuve')
        .or('date_debut.gte.' + aujourd_hui + ',date_debut.is.null')
      setEvenements(data || [])
    })

    mapRef.current = map
    return () => map.remove()
  }, [])

  useEffect(() => {
    if (!mapRef.current || evenements.length === 0) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const filtres = evenements.filter(ev => {
      if (categorie !== 'Toutes' && ev.categorie !== categorie) return false
      if (acces !== 'tous' && ev.acces !== acces) return false
      if (prix !== 'tous' && ev.prix !== prix) return false
      if (recherche && !ev.titre.toLowerCase().includes(recherche.toLowerCase()) && !ev.lieu.toLowerCase().includes(recherche.toLowerCase())) return false
      if (dateDebut && ev.date_debut && ev.date_debut < dateDebut) return false
      if (dateFin && ev.date_debut && ev.date_debut > dateFin) return false
      return true
    })

    filtres.forEach(ev => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div style="font-family:sans-serif;padding:12px;background:#1a1a1a;color:#ffffff;border-radius:8px;min-width:200px">' +
        (ev.image_url ? '<img src="' + ev.image_url + '" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px" />' : '') +
        '<strong style="font-size:16px;color:#ffffff">' + ev.titre + '</strong>' +
        '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<span style="background:#1D9E75;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + ev.categorie + '</span>' +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.acces || 'public') + '</span>' +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.prix || 'gratuit') + '</span>' +
        '</div>' +
        '<div style="margin-top:10px;font-size:13px;color:#cccccc;line-height:1.6">' +
        '📍 ' + ev.lieu + '<br/>' +
        '📅 ' + ev.date + '<br/>' +
        (ev.heure_fin ? '⏰ Fin : ' + ev.heure_fin : '') +
        (ev.description ? '<br/><br/>' + ev.description : '') +
        (ev.lien ? '<br/><br/><a href="' + ev.lien + '" target="_blank" style="color:#1D9E75">🔗 Plus de details</a>' : '') +
        '<br/><br/><a href="/evenement/' + ev.id + '" style="color:#1D9E75;font-weight:bold">Voir la page →</a>' +
        '</div></div>'
      )

      const marker = new mapboxgl.Marker({ color: '#1D9E75' })
        .setLngLat([ev.longitude, ev.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [evenements, categorie, acces, prix, recherche, dateDebut, dateFin])

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>

<div style={{
  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
  zIndex: 10, background: 'rgba(0,0,0,0.8)',
  padding: '8px 24px', borderRadius: 999, fontSize: 18, fontWeight: 'bold',
  fontFamily: 'serif', fontStyle: 'italic'
}}>
  <span style={{ color: 'white' }}>lot</span><span style={{ color: '#C84B2F' }}>bo</span>
</div>

      <div style={{
  position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 4,
  background: 'rgba(0,0,0,0.8)', borderRadius: 999, padding: '4px'
}}>
  <button onClick={() => setMode('carte')} style={{
    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
    border: 'none', cursor: 'pointer',
    background: mode === 'carte' ? '#1D9E75' : 'transparent',
    color: mode === 'carte' ? 'white' : '#aaa'
  }}>🗺️ Carte</button>
  <button onClick={() => setMode('liste')} style={{
    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
    border: 'none', cursor: 'pointer',
    background: mode === 'liste' ? '#1D9E75' : 'transparent',
    color: mode === 'liste' ? 'white' : '#aaa'
  }}>📋 Liste</button>
</div>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
        {user ? (
          <>
            <a href="/ajouter" style={{
              background: '#1D9E75', color: 'white', padding: '8px 14px',
              borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none'
            }}>+ Ajouter</a>
            <a href="/profil" style={{
              background: '#444', color: 'white', padding: '8px 14px',
              borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none'
            }}>Mon profil</a>
            <button onClick={handleLogout} style={{
              background: '#333', color: 'white', padding: '8px 14px',
              borderRadius: 999, fontSize: 13, fontWeight: 'bold', border: 'none', cursor: 'pointer'
            }}>Deconnexion</button>
          </>
        ) : (
          <a href="/login" style={{
            background: '#1D9E75', color: 'white', padding: '8px 14px',
            borderRadius: 999, fontSize: 13, fontWeight: 'bold', textDecoration: 'none'
          }}>+ Ajouter</a>
        )}
      </div>

      <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '90%', maxWidth: 400 }}>
        <input
          type="text"
          placeholder="Ville, pays ou evenement..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter' && mapRef.current) {
              const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
              const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(recherche) + '.json?access_token=' + token + '&limit=1'
              const res = await fetch(url)
              const data = await res.json()
              if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center
                mapRef.current.flyTo({ center: [lng as number, lat as number], zoom: 12 })
              }
            }
          }}
          style={{
            width: '100%', background: 'rgba(0,0,0,0.85)', color: 'white',
            border: '1px solid #444', borderRadius: 999, padding: '10px 20px',
            fontSize: 14, outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', padding: '0 12px'
      }}>
        <div style={{
          display: 'flex', gap: 6, background: 'rgba(0,0,0,0.85)',
          borderRadius: 999, padding: '6px 12px', overflowX: 'auto', maxWidth: '100%'
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategorie(cat)} style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: categorie === cat ? '#1D9E75' : 'transparent',
              color: categorie === cat ? 'white' : '#aaa'
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            display: 'flex', gap: 4, background: 'rgba(0,0,0,0.85)',
            borderRadius: 999, padding: '6px 12px'
          }}>
            {['tous', 'public', 'prive'].map(a => (
              <button key={a} onClick={() => setAcces(a)} style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: acces === a ? '#1D9E75' : 'transparent',
                color: acces === a ? 'white' : '#aaa'
              }}>{a === 'tous' ? 'Tous' : a === 'public' ? 'Public' : 'Prive'}</button>
            ))}
          </div>

          <div style={{
            display: 'flex', gap: 4, background: 'rgba(0,0,0,0.85)',
            borderRadius: 999, padding: '6px 12px'
          }}>
            {['tous', 'gratuit', 'payant'].map(p => (
              <button key={p} onClick={() => setPrix(p)} style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: prix === p ? '#1D9E75' : 'transparent',
                color: prix === p ? 'white' : '#aaa'
              }}>{p === 'tous' ? 'Tous' : p === 'gratuit' ? 'Gratuit' : 'Payant'}</button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'liste' && (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: '#000', zIndex: 5, overflowY: 'auto', padding: '80px 16px 120px'
  }}>
    {evenements.filter(ev => {
      if (categorie !== 'Toutes' && ev.categorie !== categorie) return false
      if (acces !== 'tous' && ev.acces !== acces) return false
      if (prix !== 'tous' && ev.prix !== prix) return false
      if (recherche && !ev.titre.toLowerCase().includes(recherche.toLowerCase()) && !ev.lieu.toLowerCase().includes(recherche.toLowerCase())) return false
      return true
    }).map(ev => (
      <a href={'/evenement/' + ev.id} key={ev.id} style={{
        display: 'flex', gap: 12, background: '#111', borderRadius: 12,
        padding: 12, marginBottom: 12, textDecoration: 'none', color: 'white'
      }}>
        {ev.image_url && (
          <img src={ev.image_url} alt={ev.titre} style={{
            width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0
          }} />
        )}
        <div style={{
  display: 'flex', gap: 8, background: 'rgba(0,0,0,0.85)',
  borderRadius: 999, padding: '6px 12px', alignItems: 'center'
}}>
  <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
    style={{
      background: 'transparent', border: 'none', color: '#aaa',
      fontSize: 12, outline: 'none', cursor: 'pointer'
    }} />
  <span style={{ color: '#aaa', fontSize: 12 }}>→</span>
  <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
    style={{
      background: 'transparent', border: 'none', color: '#aaa',
      fontSize: 12, outline: 'none', cursor: 'pointer'
    }} />
</div>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{ev.titre}</p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 2 }}>📍 {ev.lieu}</p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>📅 {ev.date}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ background: '#1D9E75', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{ev.categorie}</span>
            <span style={{ background: '#333', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{ev.prix}</span>
          </div>
        </div>
      </a>
    ))}
  </div>
)}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

    </main>
  )
}