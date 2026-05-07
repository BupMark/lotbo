'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabase'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-72.3388, 18.5444],
      zoom: 8
    })

    map.on('load', async () => {
      const { data, error } = await supabase.from('evenements').select('*')

      if (error) {
        console.error('Erreur Supabase:', error)
        return
      }

      data?.forEach(ev => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family:sans-serif;padding:12px;background:#1a1a1a;color:#ffffff;border-radius:8px;min-width:200px">
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
            </div>
          </div>
        `)

        new mapboxgl.Marker({ color: '#1D9E75' })
          .setLngLat([ev.longitude, ev.latitude])
          .setPopup(popup)
          .addTo(map)
      })
    })

    return () => map.remove()
  }, [])

  return (
    <main className="w-full h-screen">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-white px-6 py-3 rounded-full text-xl font-bold">
        Lotbo
      </div>
      <a href="/ajouter" className="absolute top-4 right-4 z-10 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
        + Ajouter un événement
      </a>
      <div ref={mapContainer} className="w-full h-full" />
    </main>
  )
}