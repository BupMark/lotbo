'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './popup.css'
import { supabase } from '../lib/supabase'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

const CATEGORIES = ['Toutes', 'Festival', 'Musique', 'Art', 'Sport', 'Gastronomie', 'Culture', 'Conférence', 'Autre']

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [categorie, setCategorie] = useState('Toutes')
  const [acces, setAcces] = useState('tous')
  const [prix, setPrix] = useState('tous')
  const [evenements, setEvenements] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

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
      const { data } = await supabase.from('evenements').select('*')
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
      return true
    })

    filtres.forEach(ev => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family:sans-serif;padding:12px;background:#1a1a1a;color:#ffffff;border-radius:8px;min-width:200px">
          ${ev.image_url ? `<img src="${ev.image_url}" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ''}
          <strong style="font-size:16px;color:#ffffff">${ev.titre}</strong>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span style="background:#1D9E75;color:white;padding:2px 8px;border-radius:20px;font-size:11px">${ev.categorie}</span>
            <span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">${ev.acces || 'public'}</span>
            <span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">${ev.prix || 'gratuit'}</span>
          </div>
          <div style="margin-top:10px;font-size:13px;color:#cccccc;line-height:1.6">
            📍 ${ev.lieu}<br/>
            📅 ${ev.date}<br/>
            ${ev.heure_fin ? '⏰ Fin : ' + ev.heure_fin : ''}
            ${ev.description ? '<br/><br/>' + ev.description : ''}
            ${ev.lien ? '<br/><br/><a href="' + ev.lien + '" target="_blank" style="color:#1D9E75">🔗 Plus de détails</a>' : ''}
<br/><br/><a href="/evenement/${ev.id}" style="color:#1D9E75;font-weight:bold">Voir la page →</a>
          </div>
        </div>
      `)

      const marker = new mapboxgl.Marker({ color: '#1D9E75' })
        .setLngLat([ev.longitude, ev.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [evenements, categorie, acces, prix])

  return (
    <main className="w-full h-screen relative">

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-white px-6 py-3 rounded-full text-xl font-bold">
        Lotbo
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {user ? (
          <>
            <a href="/ajouter" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              + Ajouter
            </a>
            <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-bold">
              Déconnexion
            </button>
          </>
        ) : (
          <a href="/login" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
            + Ajouter
          </a>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-wrap gap-2 justify-center px-4">

        <div className="flex gap-1 bg-black/80 rounded-full px-3 py-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategorie(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${categorie === cat ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-black/80 rounded-full px-3 py-2">
          {['tous', 'public', 'prive'].map(a => (
            <button key={a} onClick={() => setAcces(a)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${acces === a ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {a === 'tous' ? 'Tous' : a === 'public' ? 'Public' : 'Privé'}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-black/80 rounded-full px-3 py-2">
          {['tous', 'gratuit', 'payant'].map(p => (
            <button key={p} onClick={() => setPrix(p)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${prix === p ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {p === 'tous' ? 'Tous' : p === 'gratuit' ? 'Gratuit' : 'Payant'}
            </button>
          ))}
        </div>

      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </main>
  )
}