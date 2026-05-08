'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './popup.css'
import { supabase } from '../lib/supabase'
import { langues, type Langue, getTraductions } from '../lib/i18n'

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
  const [langue, setLangue] = useState<Langue>('fr')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const t = getTraductions(langue)

  const nbFiltres = [
    categorie !== 'Toutes',
    acces !== 'tous',
    prix !== 'tous',
    !!dateDebut,
    !!dateFin
  ].filter(Boolean).length

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
          map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 })
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

  const filtreActif = (ev: any) => {
    if (categorie !== 'Toutes' && ev.categorie !== categorie) return false
    if (acces !== 'tous' && ev.acces !== acces) return false
    if (prix !== 'tous' && ev.prix !== prix) return false
    if (recherche && !ev.titre.toLowerCase().includes(recherche.toLowerCase()) && !ev.lieu.toLowerCase().includes(recherche.toLowerCase())) return false
    if (dateDebut && ev.date_debut && ev.date_debut < dateDebut) return false
    if (dateFin && ev.date_debut && ev.date_debut > dateFin) return false
    return true
  }

  useEffect(() => {
    if (!mapRef.current || evenements.length === 0) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    evenements.filter(filtreActif).forEach(ev => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div style="font-family:sans-serif;padding:12px;background:#1A1410;color:#F7F2E8;border-radius:8px;min-width:200px">' +
        (ev.image_url ? '<img src="' + ev.image_url + '" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px" />' : '') +
        '<strong style="font-size:16px;color:#F7F2E8">' + ev.titre + '</strong>' +
        '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<span style="background:#C8431A;color:#F7F2E8;padding:2px 8px;border-radius:20px;font-size:11px">' + ev.categorie + '</span>' +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.acces || 'public') + '</span>' +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.prix || 'gratuit') + '</span>' +
        '</div>' +
        '<div style="margin-top:10px;font-size:13px;color:#E8E0D0;line-height:1.6">' +
        '📍 ' + ev.lieu + '<br/>' +
        '📅 ' + ev.date + '<br/>' +
        (ev.heure_fin ? '⏰ Fin : ' + ev.heure_fin : '') +
        (ev.description ? '<br/><br/>' + ev.description : '') +
        (ev.lien ? '<br/><br/><a href="' + ev.lien + '" target="_blank" style="color:#C8431A">🔗 Plus de détails</a>' : '') +
        '<br/><br/><a href="/evenement/' + ev.id + '" style="color:#C8431A;font-weight:bold">Voir la page →</a>' +
        '</div></div>'
      )
      const markerColor = ev.statut === 'à compléter' ? '#E87C2A' : '#C8431A'
      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([ev.longitude, ev.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!)
      markersRef.current.push(marker)
    })
  }, [evenements, categorie, acces, prix, recherche, dateDebut, dateFin])

  const btnStyle = (actif: boolean) => ({
    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold' as const,
    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const,
    background: actif ? '#C8431A' : 'rgba(255,255,255,0.08)',
    color: actif ? 'white' : '#aaa'
  })

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════════════════════════
          HEADER — flex, jamais position:absolute
          Mobile-first 375px
      ══════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        flexShrink: 0,
      }}>

        {/* Ligne 1 : Carte/Liste — Logo — Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Carte / Liste */}
          <div style={{
            display: 'flex', gap: 2, background: 'rgba(0,0,0,0.85)',
            borderRadius: 999, padding: 3, flexShrink: 0
          }}>
            <button onClick={() => setMode('carte')} style={{
              padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold',
              border: 'none', cursor: 'pointer',
              background: mode === 'carte' ? '#C8431A' : 'transparent',
              color: mode === 'carte' ? 'white' : '#aaa'
            }}>🗺️ {t.carte.carte}</button>
            <button onClick={() => setMode('liste')} style={{
              padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold',
              border: 'none', cursor: 'pointer',
              background: mode === 'liste' ? '#C8431A' : 'transparent',
              color: mode === 'liste' ? 'white' : '#aaa'
            }}>📋 {t.carte.liste}</button>
          </div>

          {/* Logo — centré automatiquement */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(0,0,0,0.85)', padding: '5px 16px',
              borderRadius: 999, fontSize: 16, fontWeight: 'bold',
              fontFamily: 'serif', fontStyle: 'italic'
            }}>
              <span style={{ color: 'white' }}>lot</span>
              <span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </div>

          {/* Actions droite */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <select value={langue} onChange={e => setLangue(e.target.value as Langue)}
              style={{
                background: 'rgba(0,0,0,0.85)', color: 'white',
                border: '1px solid #333', borderRadius: 999,
                padding: '5px 8px', fontSize: 12, cursor: 'pointer', outline: 'none'
              }}>
              {Object.entries(langues).map(([code, info]) => (
                <option key={code} value={code}>{info.drapeau}</option>
              ))}
            </select>
            {user ? (
              <>
                <a href="/ajouter" style={{
                  background: '#C8431A', color: 'white', padding: '6px 12px',
                  borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none'
                }}>{t.nav.ajouter}</a>
                <a href="/profil" style={{
                  background: '#333', color: 'white', padding: '6px 10px',
                  borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none'
                }}>{t.nav.profil}</a>
              </>
            ) : (
              <a href="/login" style={{
                background: '#C8431A', color: 'white', padding: '6px 12px',
                borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none'
              }}>+ Ajouter</a>
            )}
          </div>
        </div>

        {/* Ligne 2 : Recherche + bouton Filtres */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder={t.carte.recherche}
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
              flex: 1, background: 'rgba(0,0,0,0.85)', color: 'white',
              border: '1px solid #444', borderRadius: 999, padding: '8px 16px',
              fontSize: 13, outline: 'none', minWidth: 0
            }}
          />
          <button onClick={() => setFiltresOuverts(!filtresOuverts)} style={{
            background: nbFiltres > 0 ? '#C8431A' : 'rgba(0,0,0,0.85)',
            color: 'white', border: '1px solid #444',
            borderRadius: 999, padding: '8px 14px', fontSize: 12,
            fontWeight: 'bold', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            ⚙️ Filtres {nbFiltres > 0 && (
              <span style={{
                background: 'white', color: '#C8431A', borderRadius: 999,
                fontSize: 10, fontWeight: 'bold', padding: '1px 6px'
              }}>{nbFiltres}</span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANNEAU FILTRES — slide down
      ══════════════════════════════════════ */}
      {filtresOuverts && (
        <div style={{
          position: 'absolute', top: 110, left: 12, right: 12, zIndex: 30,
          background: 'rgba(10,10,10,0.97)', border: '1px solid #333',
          borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {/* Catégorie */}
          <div>
            <p style={{ color: '#aaa', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Catégorie</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategorie(cat)} style={btnStyle(categorie === cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accès */}
          <div>
            <p style={{ color: '#aaa', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Accès</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['tous', 'public', 'prive'].map(a => (
                <button key={a} onClick={() => setAcces(a)} style={btnStyle(acces === a)}>
                  {a === 'tous' ? t.carte.tous : a === 'public' ? t.carte.public : t.carte.prive}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div>
            <p style={{ color: '#aaa', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Prix</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['tous', 'gratuit', 'payant'].map(p => (
                <button key={p} onClick={() => setPrix(p)} style={btnStyle(prix === p)}>
                  {p === 'tous' ? t.carte.tous : p === 'gratuit' ? t.carte.gratuit : t.carte.payant}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div>
            <p style={{ color: '#aaa', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Période</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ color: '#666', fontSize: 10 }}>Du</label>
                <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid #444',
                    borderRadius: 10, color: 'white', fontSize: 13,
                    padding: '6px 10px', outline: 'none', cursor: 'pointer'
                  }} />
              </div>
              <span style={{ color: '#555', marginTop: 16 }}>→</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ color: '#666', fontSize: 10 }}>Au</label>
                <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid #444',
                    borderRadius: 10, color: 'white', fontSize: 13,
                    padding: '6px 10px', outline: 'none', cursor: 'pointer'
                  }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => {
              setCategorie('Toutes')
              setAcces('tous')
              setPrix('tous')
              setDateDebut('')
              setDateFin('')
            }} style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', color: '#aaa',
              border: '1px solid #333', borderRadius: 999, padding: '10px',
              fontSize: 13, cursor: 'pointer', fontWeight: 'bold'
            }}>Réinitialiser</button>
            <button onClick={() => setFiltresOuverts(false)} style={{
              flex: 2, background: '#C8431A', color: 'white',
              border: 'none', borderRadius: 999, padding: '10px',
              fontSize: 13, cursor: 'pointer', fontWeight: 'bold'
            }}>Appliquer les filtres</button>
          </div>
        </div>
      )}

      {/* ── VUE LISTE ── */}
      {mode === 'liste' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: '#000', zIndex: 5, overflowY: 'auto',
          padding: '120px 16px 40px'
        }}>
          {evenements.filter(filtreActif).map(ev => (
            <a href={'/evenement/' + ev.id} key={ev.id} style={{
              display: 'flex', gap: 12, background: '#111', borderRadius: 12,
              padding: 12, marginBottom: 12, textDecoration: 'none', color: 'white',
              overflow: 'hidden'
            }}>
              {ev.image_url && (
                <img src={ev.image_url} alt={ev.titre} style={{
                  width: 72, height: 72, objectFit: 'cover',
                  borderRadius: 8, flexShrink: 0
                }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontWeight: 'bold', fontSize: 14, marginBottom: 3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{ev.titre}</p>
                <p style={{ color: '#aaa', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                <p style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>📅 {ev.date}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: '#C8431A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{ev.categorie}</span>
                  <span style={{ background: '#333', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{ev.prix}</span>
                  {ev.statut === 'à compléter' && (
                    <span style={{ background: '#E87C2A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>À compléter</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ── CARTE MAPBOX — prend tout l'espace restant ── */}
      <div ref={mapContainer} style={{ flex: 1, position: 'relative', minHeight: 0 }} />

    </main>
  )
}