'use client'

import { useRef, useEffect } from 'react'

export interface Coords {
  longitude: number
  latitude: number
  adresse: string
}

export default function CarteInteractive({ coords, onCoordsChange }: {
  coords: Coords; onCoordsChange: (c: Coords) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const markerRef       = useRef<any>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    import('mapbox-gl').then((mapboxglModule) => {
    const mapboxgl = mapboxglModule.default
    import('mapbox-gl/dist/mapbox-gl.css').catch(() => {})
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coords.longitude, coords.latitude],
      zoom: 14,
    })
    const marker = new mapboxgl.Marker({ color: '#C8431A', draggable: true })
      .setLngLat([coords.longitude, coords.latitude])
      .addTo(map)
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onCoordsChange({ longitude: lngLat.lng, latitude: lngLat.lat, adresse: coords.adresse })
    })
    map.on('click', (e: { lngLat: { lng: number; lat: number } }) => {
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
      onCoordsChange({ longitude: e.lngLat.lng, latitude: e.lngLat.lat, adresse: coords.adresse })
    })
    mapRef.current = map; markerRef.current = marker
    })
    return () => { if(mapRef.current) mapRef.current.remove() }
  }, [])

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([coords.longitude, coords.latitude])
      mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14 })
    }
  }, [coords.longitude, coords.latitude])

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid #C8431A' }}>
      <div ref={mapContainerRef} style={{ height: 200 }} />
      <div style={{ background: '#1A1410', padding: '10px 14px' }}>
        <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 6 }}>📍 Glisse le pin ou clique sur la carte pour ajuster l&apos;emplacement exact</p>
        <p style={{ color: '#F7F2E8', fontSize: 11 }}>{coords.longitude.toFixed(5)}, {coords.latitude.toFixed(5)}</p>
      </div>
    </div>
  )
}
