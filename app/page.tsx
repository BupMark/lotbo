'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './popup.css'
import { supabase } from '../lib/supabase'
import { langues, type Langue, getTraductions } from '../lib/i18n'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

// ── Types ─────────────────────────────────────────────────────────────────────
interface Evenement {
  id: string
  titre: string
  lieu: string
  date: string
  date_debut: string | null
  date_fin: string | null
  heure_debut: string | null
  heure_fin: string | null
  categorie: string
  acces: string
  prix: string
  statut: string
  image_url: string | null
  latitude: number
  longitude: number
  description: string | null
  lien: string | null
}

interface UserMeta {
  user_metadata?: { role?: string }
  email?: string
}

const CATEGORIES = ['Toutes', 'Festival', 'Musique', 'Art', 'Sport', 'Gastronomie', 'Culture', 'Conference', 'Autre']

function formatDate(dateStr: string): string {
  if (!dateStr) return dateStr
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(day)} ${mois[parseInt(month) - 1]} ${year}`
}

function afficherPeriode(ev: Pick<Evenement, 'date' | 'date_fin'>): string {
  if (ev.date_fin && ev.date_fin !== ev.date) {
    return `${formatDate(ev.date)} → ${formatDate(ev.date_fin)}`
  }
  return formatDate(ev.date) || ev.date || ''
}

function emojiCategorie(categorie: string): string {
  switch (categorie) {
    case 'Festival':              return '🎉'
    case 'Concert / Spectacle':   return '🎶'
    case 'Tournoi / Compétition': return '⚽'
    case 'Gastronomie':           return '🍽️'
    case 'Art':                   return '🎨'
    case 'Conférence / Sommet':   return '🎤'
    case 'Formation / Séminaire': return '📚'
    default:                      return '📅'
  }
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const markersRef   = useRef<mapboxgl.Marker[]>([])

  const [categorie, setCategorie]           = useState('Toutes')
  const [acces, setAcces]                   = useState('tous')
  const [prix, setPrix]                     = useState('tous')
  const [evenements, setEvenements]         = useState<Evenement[]>([])
  const [user, setUser]                     = useState<UserMeta | null>(null)
  const [recherche, setRecherche]           = useState('')
  const [mode, setMode]                     = useState<'carte' | 'liste'>('carte')
  const [langue, setLangue]                 = useState<Langue>('fr')
  const [dateDebut, setDateDebut]           = useState('')
  const [dateFin, setDateFin]               = useState('')
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [drawerOuvert, setDrawerOuvert]     = useState(false)

  const t       = getTraductions(langue)
  const isAdmin = user?.user_metadata?.role === 'admin'

  const nbFiltres = [
    categorie !== 'Toutes',
    acces !== 'tous',
    prix !== 'tous',
    !!dateDebut,
    !!dateFin,
  ].filter(Boolean).length

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser((data.session?.user ?? null) as UserMeta | null)
    })
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-72.3388, 18.5444],
      zoom: 8,
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
        .neq('statut', 'hors_ligne')
      setEvenements((data as Evenement[]) || [])
    })
    mapRef.current = map
    return () => map.remove()
  }, [])

  const filtreActif = (ev: Evenement) => {
    if (categorie !== 'Toutes' && ev.categorie !== categorie) return false
    if (acces !== 'tous' && ev.acces !== acces) return false
    if (prix !== 'tous' && ev.prix !== prix) return false
    if (recherche && !ev.titre?.toLowerCase().includes(recherche.toLowerCase()) && !ev.lieu?.toLowerCase().includes(recherche.toLowerCase())) return false
    if (dateDebut && ev.date_debut && ev.date_debut < dateDebut) return false
    if (dateFin && ev.date_debut && ev.date_debut > dateFin) return false
    return true
  }

  useEffect(() => {
    if (!mapRef.current || evenements.length === 0) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    evenements.filter(filtreActif).forEach(ev => {
      const periodePopup = afficherPeriode(ev)
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div style="font-family:sans-serif;padding:12px;background:#1A1410;color:#F7F2E8;border-radius:8px;min-width:200px">' +
        (ev.image_url ? '<img src="' + ev.image_url + '" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px" />' : '') +
        '<strong style="font-size:16px;color:#F7F2E8">' + ev.titre + '</strong>' +
        '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
        '<span style="background:#C8431A;color:#F7F2E8;padding:2px 8px;border-radius:20px;font-size:11px">' + ev.categorie + '</span>' +
        (ev.date_fin && ev.date_fin !== ev.date ? '<span style="background:rgba(212,168,32,0.2);color:#D4A820;padding:2px 8px;border-radius:20px;font-size:11px">🗓️ Multi-jours</span>' : '') +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.acces || 'public') + '</span>' +
        '<span style="background:#333;color:white;padding:2px 8px;border-radius:20px;font-size:11px">' + (ev.prix || 'gratuit') + '</span>' +
        '</div>' +
        '<div style="margin-top:10px;font-size:13px;color:#E8E0D0;line-height:1.6">' +
        '📍 ' + ev.lieu + '<br/>' +
        '📅 ' + periodePopup + '<br/>' +
        (ev.heure_debut ? '🕐 ' + ev.heure_debut + (ev.heure_fin ? ' → ' + ev.heure_fin : '') + '<br/>' : '') +
        (ev.description ? '<br/>' + ev.description : '') +
        (ev.lien ? '<br/><br/><a href="' + ev.lien + '" target="_blank" style="color:#C8431A">🔗 Plus de détails</a>' : '') +
        '<div style="display:flex;gap:8px;margin-top:12px">' +
        '<a href="/evenement/' + ev.id + '" style="flex:1;display:block;background:#C8431A;color:#F7F2E8;text-align:center;padding:8px 12px;border-radius:8px;font-weight:bold;font-size:12px;text-decoration:none">Voir →</a>' +
        '<a href="https://www.google.com/maps/dir/?api=1&destination=' + ev.latitude + ',' + ev.longitude + '" target="_blank" style="flex:1;display:block;background:rgba(255,255,255,0.08);color:#F7F2E8;text-align:center;padding:8px 12px;border-radius:8px;font-weight:bold;font-size:12px;text-decoration:none">🧭 S\'y rendre</a>' +
        '</div></div></div>'
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
    border: actif ? 'none' : '1px solid #E8E0D0', cursor: 'pointer', whiteSpace: 'nowrap' as const,
    background: actif ? '#C8431A' : '#F7F2E8',
    color: actif ? 'white' : '#8C5A40',
  })

  const centrerSurPosition = () => {
    if (!mapRef.current || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      mapRef.current!.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 })
    })
  }

  const evenementsFiltres = evenements.filter(filtreActif)

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ══ CSS grille responsive UX4 ══ */}
      <style>{`
        .lotbo-grid-evenements {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .lotbo-event-card {
          display: flex;
          flex-direction: row;
          gap: 12px;
          background: white;
          border: 1px solid #E8E0D0;
          border-radius: 12px;
          padding: 12px;
          text-decoration: none;
          color: #1A1410;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(26,20,16,0.06);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .lotbo-event-card:hover {
          box-shadow: 0 4px 16px rgba(26,20,16,0.12);
          transform: translateY(-1px);
        }
        .lotbo-event-card .card-image {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .lotbo-event-card .card-image-placeholder {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #F7F2E8 0%, #E8E0D0 100%);
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        .lotbo-event-card .card-body {
          flex: 1;
          min-width: 0;
        }
        .card-titre {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #1A1410;
        }

        /* Tablette — 2 colonnes ≥ 768px */
        @media (min-width: 768px) {
          .lotbo-grid-evenements {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .lotbo-event-card {
            flex-direction: column;
            gap: 0;
            padding: 0;
            border-radius: 14px;
            align-items: stretch;
          }
          .lotbo-event-card .card-image {
            width: 100%;
            height: 160px;
            border-radius: 14px 14px 0 0;
            aspect-ratio: 16/9;
          }
          .lotbo-event-card .card-image-placeholder {
            width: 100%;
            height: 160px;
            border-radius: 14px 14px 0 0;
            font-size: 40px;
            aspect-ratio: 16/9;
          }
          .lotbo-event-card .card-body {
            padding: 14px;
          }
          .card-titre {
            font-size: 15px;
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: unset;
          }
          .lotbo-vue-liste {
            padding-left: 32px !important;
            padding-right: 32px !important;
          }
        }

        /* Desktop — 3 colonnes ≥ 1024px */
        @media (min-width: 1024px) {
          .lotbo-grid-evenements {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .lotbo-event-card .card-image,
          .lotbo-event-card .card-image-placeholder {
            height: 170px;
          }
        }

        /* Grand écran — 4 colonnes ≥ 1280px */
        @media (min-width: 1280px) {
          .lotbo-grid-evenements {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          .lotbo-vue-liste {
            padding-left: 48px !important;
            padding-right: 48px !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════
          DRAWER
      ══════════════════════════════════════ */}
      {drawerOuvert && (
        <>
          <div onClick={() => setDrawerOuvert(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 51, background: '#1A1410', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
                <span style={{ color: '#F7F2E8' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
              </div>
              <button onClick={() => setDrawerOuvert(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#F7F2E8', borderRadius: 999, width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#8C5A40', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Langue</p>
              <select value={langue} onChange={e => setLangue(e.target.value as Langue)} style={{ background: 'rgba(255,255,255,0.06)', color: '#F7F2E8', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 12px', fontSize: 14, cursor: 'pointer', outline: 'none', width: '100%' }}>
                {Object.entries(langues).map(([code, info]) => (
                  <option key={code} value={code}>{info.drapeau} {String((info as Record<string, unknown>).nom ?? code)}</option>
                ))}
              </select>
            </div>

            <div style={{ height: 1, background: '#2a2a2a', marginBottom: 24 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!user ? (
                <>
                  <a href="/login" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(200,67,26,0.12)', color: '#C8431A', textDecoration: 'none', fontSize: 14, fontWeight: 'bold' }}>🔑 Se connecter</a>
                  <a href="/inscription" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#F7F2E8', textDecoration: 'none', fontSize: 14 }}>🔔 Recevoir les événements</a>
                </>
              ) : (
                <>
                  <a href="/profil" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#F7F2E8', textDecoration: 'none', fontSize: 14 }}>👤 Mon profil</a>
                  <a href="/inscription" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#F7F2E8', textDecoration: 'none', fontSize: 14 }}>🔔 Recevoir les événements</a>
                  {isAdmin && <a href="/admin" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#D4A820', textDecoration: 'none', fontSize: 14 }}>⚙️ Panel admin</a>}
                  <a href="/apropos" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#F7F2E8', textDecoration: 'none', fontSize: 14 }}>ℹ️ À propos</a>
                  <button onClick={async () => { await supabase.auth.signOut(); setUser(null); setDrawerOuvert(false) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#8C5A40', border: 'none', fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}>🚪 Déconnexion</button>
                </>
              )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24 }}>
              <a href="/politique-confidentialite" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#8C5A40', textDecoration: 'none', fontSize: 13 }}>🔒 Confidentialité</a>
              <a href="/aide" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#8C5A40', textDecoration: 'none', fontSize: 13 }}>❓ Aide</a>
              <a href="/cgu" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#8C5A40', textDecoration: 'none', fontSize: 13 }}>📄 CGU</a>
              <p style={{ color: '#2a2a2a', fontSize: 11, textAlign: 'center', marginTop: 12 }}>Lotbo v1.0 · né en Haïti 🇭🇹</p>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', flexShrink: 0, background: '#F7F2E8', borderBottom: '1px solid #E8E0D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="lotbo-hamburger" onClick={() => setDrawerOuvert(true)} style={{ background: '#1A1410', border: 'none', color: '#F7F2E8', borderRadius: 999, padding: '6px 10px', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>☰</button>

          <div className="lotbo-mode-header" style={{ gap: 2, background: '#E8E0D0', borderRadius: 999, padding: 3, flexShrink: 0 }}>
            <button onClick={() => setMode('carte')} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'carte' ? '#C8431A' : 'transparent', color: mode === 'carte' ? 'white' : '#8C5A40' }}>🗺️ {t.carte.carte}</button>
            <button onClick={() => setMode('liste')} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'liste' ? '#C8431A' : 'transparent', color: mode === 'liste' ? 'white' : '#8C5A40' }}>📋 {t.carte.liste}</button>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '5px 16px', fontSize: 18, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic' }}>
              <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <a href="/apropos" className="lotbo-mode-header" style={{ color: '#8C5A40', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>À propos</a>
            <div className="lotbo-langue-desktop">
              <select value={langue} onChange={e => setLangue(e.target.value as Langue)} style={{ background: '#E8E0D0', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '5px 8px', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                {Object.entries(langues).map(([code, info]) => (
                  <option key={code} value={code}>{info.drapeau}</option>
                ))}
              </select>
            </div>
            <div className="lotbo-mode-header" style={{ gap: 6 }}>
              {user ? (
                <>
                  {isAdmin && <a href="/admin" style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>⚙️</a>}
                  <a href="/profil" style={{ background: '#1A1410', color: '#F7F2E8', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>{t.nav.profil}</a>
                </>
              ) : (
                <a href="/login" style={{ background: '#1A1410', color: '#F7F2E8', border: 'none', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none' }}>Connexion</a>
              )}
            </div>
            <a href="/ajouter" style={{ background: '#C8431A', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Ajouter</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder={t.carte.recherche}
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter' && mapRef.current) {
                const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
                const url   = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(recherche)}.json?access_token=${token}&limit=1`
                const res   = await fetch(url)
                const data  = await res.json()
                if (data.features?.length > 0) {
                  const [lng, lat] = data.features[0].center as [number, number]
                  mapRef.current.flyTo({ center: [lng, lat], zoom: 12 })
                }
              }
            }}
            className="lotbo-recherche"
            style={{ flex: 1, background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '8px 16px', fontSize: 13, outline: 'none', minWidth: 0 }}
          />
          <button onClick={() => setFiltresOuverts(!filtresOuverts)} style={{ background: nbFiltres > 0 ? '#C8431A' : '#1A1410', color: 'white', border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚙️ Filtres {nbFiltres > 0 && <span style={{ background: 'white', color: '#C8431A', borderRadius: 999, fontSize: 10, fontWeight: 'bold', padding: '1px 6px' }}>{nbFiltres}</span>}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANNEAU FILTRES
      ══════════════════════════════════════ */}
      {filtresOuverts && (
        <div style={{ position: 'absolute', top: 116, left: 12, right: 12, zIndex: 30, background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto', boxShadow: '0 4px 24px rgba(26,20,16,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ color: '#8C5A40', fontSize: 12, fontWeight: 'bold' }}>Filtres</p>
            <button onClick={() => setFiltresOuverts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }} aria-label="Fermer les filtres">✕</button>
          </div>
          <div>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Catégorie</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(cat => <button key={cat} onClick={() => setCategorie(cat)} style={btnStyle(categorie === cat)}>{cat}</button>)}
            </div>
          </div>
          <div>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Accès</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['tous', 'public', 'prive'].map(a => <button key={a} onClick={() => setAcces(a)} style={btnStyle(acces === a)}>{a === 'tous' ? t.carte.tous : a === 'public' ? t.carte.public : t.carte.prive}</button>)}
            </div>
          </div>
          <div>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Prix</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['tous', 'gratuit', 'payant'].map(p => <button key={p} onClick={() => setPrix(p)} style={btnStyle(prix === p)}>{p === 'tous' ? t.carte.tous : p === 'gratuit' ? t.carte.gratuit : t.carte.payant}</button>)}
            </div>
          </div>
          <div>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Période</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { label: "Aujourd'hui", fn: () => { const d = new Date().toISOString().split('T')[0]; setDateDebut(d); setDateFin(d) }, check: () => { const d = new Date().toISOString().split('T')[0]; return dateDebut === d && dateFin === d } },
                { label: 'Cette semaine', fn: () => { const d = new Date(); const debut = new Date(d); debut.setDate(d.getDate() - d.getDay() + 1); const fin = new Date(debut); fin.setDate(debut.getDate() + 6); setDateDebut(debut.toISOString().split('T')[0]); setDateFin(fin.toISOString().split('T')[0]) }, check: () => { const d = new Date(); const debut = new Date(d); debut.setDate(d.getDate() - d.getDay() + 1); return dateDebut === debut.toISOString().split('T')[0] } },
                { label: 'Ce mois', fn: () => { const d = new Date(); const debut = new Date(d.getFullYear(), d.getMonth(), 1); const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0); setDateDebut(debut.toISOString().split('T')[0]); setDateFin(fin.toISOString().split('T')[0]) }, check: () => { const d = new Date(); return dateDebut === new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] } },
                { label: 'Ce week-end', fn: () => { const d = new Date(); const sam = new Date(d); sam.setDate(d.getDate() + (6 - d.getDay())); const dim = new Date(sam); dim.setDate(sam.getDate() + 1); setDateDebut(sam.toISOString().split('T')[0]); setDateFin(dim.toISOString().split('T')[0]) }, check: () => { const d = new Date(); const sam = new Date(d); sam.setDate(d.getDate() + (6 - d.getDay())); return dateDebut === sam.toISOString().split('T')[0] } },
              ].map(p => (
                <button key={p.label} onClick={p.fn} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', border: p.check() ? 'none' : '1px solid #E8E0D0', cursor: 'pointer', whiteSpace: 'nowrap', background: p.check() ? '#C8431A' : '#F7F2E8', color: p.check() ? 'white' : '#8C5A40' }}>{p.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ color: '#8C5A40', fontSize: 10 }}>Du</label>
                <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, color: '#1A1410', fontSize: 13, padding: '6px 10px', outline: 'none', cursor: 'pointer', width: '100%', colorScheme: 'light', minWidth: 0 }} />
              </div>
              <span style={{ color: '#8C5A40', fontSize: 14, marginTop: 14 }}>→</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={{ color: '#8C5A40', fontSize: 10 }}>Au</label>
                <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, color: '#1A1410', fontSize: 13, padding: '6px 10px', outline: 'none', cursor: 'pointer', width: '100%', colorScheme: 'light', minWidth: 0 }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setCategorie('Toutes'); setAcces('tous'); setPrix('tous'); setDateDebut(''); setDateFin('') }} style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 999, padding: '10px', fontSize: 13, cursor: 'pointer', fontWeight: 'bold' }}>Réinitialiser</button>
            <button onClick={() => setFiltresOuverts(false)} style={{ flex: 2, background: '#C8431A', color: 'white', border: 'none', borderRadius: 999, padding: '10px', fontSize: 13, cursor: 'pointer', fontWeight: 'bold' }}>Appliquer les filtres</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VUE LISTE — UX4 grille responsive
      ══════════════════════════════════════ */}
      {mode === 'liste' && (
        <div className="lotbo-vue-liste" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#F7F2E8', zIndex: 5, overflowY: 'auto', paddingTop: 100, paddingLeft: 16, paddingRight: 16, paddingBottom: 80 }}>

          {evenementsFiltres.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Aucun événement trouvé</p>
              <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Aucun événement ne correspond à tes filtres actuels.</p>
              <button onClick={() => { setCategorie('Toutes'); setAcces('tous'); setPrix('tous'); setDateDebut(''); setDateFin('') }} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', marginBottom: 24 }}>
                Réinitialiser les filtres
              </button>
              {evenements.length > 0 && (
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#8C5A40', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 'bold' }}>Tu pourrais aimer</p>
                  {evenements.slice(0, 3).map(ev => (
                    <a href={'/evenement/' + ev.id} key={ev.id} className="lotbo-event-card" style={{ marginBottom: 10 }}>
                      {ev.image_url
                        ? <img src={ev.image_url} alt={ev.titre} className="card-image" />
                        : <div className="card-image-placeholder">{emojiCategorie(ev.categorie)}</div>
                      }
                      <div className="card-body">
                        <p className="card-titre">{ev.titre}</p>
                        <p style={{ color: '#8C5A40', fontSize: 11 }}>📍 {ev.lieu}</p>
                        <span style={{ background: '#C8431A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{ev.categorie}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Grille UX4 ── */}
          <div className="lotbo-grid-evenements">
            {evenementsFiltres.map(ev => (
              <a href={'/evenement/' + ev.id} key={ev.id} className="lotbo-event-card">
                {ev.image_url
                  ? <img src={ev.image_url} alt={ev.titre} className="card-image" />
                  : <div className="card-image-placeholder">{emojiCategorie(ev.categorie)}</div>
                }
                <div className="card-body">
                  <p className="card-titre">{ev.titre}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6 }}>📅 {afficherPeriode(ev)}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: '#C8431A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{ev.categorie}</span>
                    {ev.date_fin && ev.date_fin !== ev.date && (
                      <span style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>🗓️ Multi-jours</span>
                    )}
                    <span style={{ background: '#E8E0D0', color: '#8C5A40', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{ev.prix}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════
          CARTE MAPBOX
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
        {mode === 'carte' && evenementsFiltres.length === 0 && evenements.length > 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, background: 'white', borderRadius: 16, padding: '24px 20px', boxShadow: '0 8px 32px rgba(26,20,16,0.18)', textAlign: 'center', maxWidth: 280, width: 'calc(100% - 40px)' }}>
            <button onClick={() => { setCategorie('Toutes'); setAcces('tous'); setPrix('tous'); setDateDebut(''); setDateFin('') }} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}>✕</button>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Aucun événement trouvé</p>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>Aucun événement ne correspond à tes filtres actuels.</p>
            <button onClick={() => { setCategorie('Toutes'); setAcces('tous'); setPrix('tous'); setDateDebut(''); setDateFin('') }} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>Réinitialiser les filtres</button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          TAB BAR mobile
      ══════════════════════════════════════ */}
      <div className="lotbo-tabbar">
        <button onClick={() => { setMode('carte'); setFiltresOuverts(false) }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={mode === 'carte' ? '#C8431A' : '#8C5A40'} strokeWidth="1.8" fill="none"/>
            <path d="M9 21V12h6v9" stroke={mode === 'carte' ? '#C8431A' : '#8C5A40'} strokeWidth="1.8"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: mode === 'carte' ? '#C8431A' : '#8C5A40' }}>Home</span>
        </button>

        <button onClick={() => setMode('liste')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="2" stroke={mode === 'liste' ? '#C8431A' : '#8C5A40'} strokeWidth="1.8"/>
            <path d="M8 2v3M16 2v3M3 9h18" stroke={mode === 'liste' ? '#C8431A' : '#8C5A40'} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: mode === 'liste' ? '#C8431A' : '#8C5A40' }}>Événements</span>
        </button>

        <button onClick={centrerSurPosition} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 0', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: -4, boxShadow: '0 2px 8px rgba(200,67,26,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: '#C8431A' }}>Carte</span>
        </button>

        <a href="/inscription" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 0', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 003.4 0" stroke="#8C5A40" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: '#8C5A40' }}>Alertes</span>
        </a>

        <a href={user ? '/profil' : '/login'} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 0', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={user ? '#C8431A' : '#8C5A40'} strokeWidth="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={user ? '#C8431A' : '#8C5A40'} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: user ? '#C8431A' : '#8C5A40' }}>{user ? 'Profil' : 'Connexion'}</span>
        </a>
      </div>

    </main>
  )
}