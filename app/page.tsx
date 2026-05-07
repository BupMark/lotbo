'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function Home() {
  const mapContainer = useRef(null)
  const [pret, setPret] = useState(false)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-72.3388, 18.5444],
      zoom: 12
    })

    map.on('load', async () => {
      const { data, error } = await supabase.from('evenements').select('*')
      
      if (error) {
        console.error('Erreur Supabase:', error)
        return
      }

      console.log('Événements chargés:', data)

      data.forEach(ev => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family:sans-serif;padding:8px">
            <strong style="font-size:14px">${ev.titre}</strong><br/>
            <span style="color:#888;font-size:12px">${ev.categorie}</span><br/>
            <span style="font-size:12px">📍 ${ev.lieu}</span><br/>
            <span style="font-size:12px">📅 ${ev.date}</span>
          </div>
        `)

        new mapboxgl.Marker({ color: '#1D9E75' })
          .setLngLat([ev.longitude, ev.latitude])
          .setPopup(popup)
          .addTo(map)
      })
    })

    mapRef.current = map
    return () => map.remove()
  }, [])

  return (
    <main className="w-full h-screen">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-white px-6 py-3 rounded-full text-xl font-bold">
        Lotbo
      </div>
      <div ref={mapContainer} className="w-full h-full" />
    </main>
  )
}