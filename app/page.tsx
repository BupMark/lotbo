'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './popup.css'
import { supabase } from '../lib/supabase'
import { langues, type Langue, getTraductions } from '../lib/i18n'
import { getEventImage, FALLBACK_IMAGES } from '../lib/fallbackImages'
import NotifCloche from '../components/NotifCloche'
import { track } from '../lib/amplitude'
import { attributerPoints } from '../lib/points'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

// ── Types ─────────────────────────────────────────────────────────────────────
interface Evenement {
  id: string
  parent_id: string | null
  titre: string
  lieu: string
  ville?: string | null
  pays?: string | null
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
  mis_en_avant?: boolean
  mis_en_avant_ville?: string | null
  mis_en_avant_jusqu_au?: string | null
}

interface UserMeta {
  id?: string
  user_metadata?: { role?: string }
  email?: string
}

interface TopVille {
  ville: string
  count: number
  pays: string | null
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

function estEnCours(ev: Evenement, now: Date): boolean {
  if (!ev.heure_debut || !ev.heure_fin) return false
  const todayStr  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dateDebut = ev.date_debut || ev.date
  const dateFin   = ev.date_fin   || dateDebut
  if (todayStr < dateDebut || todayStr > dateFin) return false
  const [dh, dm] = ev.heure_debut.split(':').map(Number)
  const [fh, fm] = ev.heure_fin.split(':').map(Number)
  const nowMin   = now.getHours() * 60 + now.getMinutes()
  const result   = nowMin >= dh * 60 + dm && nowMin <= fh * 60 + fm
  console.log('[F8 estEnCours]', ev.titre, { dateDebut, dateFin, todayStr, nowMin, debutMin: dh * 60 + dm, finMin: fh * 60 + fm, result })
  return result
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
  const headerRef    = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(116)

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
  const [favoris, setFavoris]               = useState<Set<string>>(new Set())
  const [togglingFavori, setTogglingFavori] = useState<string | null>(null)
  const [userVille, setUserVille]           = useState<string>('')
  const [favorisCounts, setFavorisCounts]   = useState<Record<string, number>>({})
  const [commCounts, setCommCounts]         = useState<Record<string, number>>({})
  const [carouselIdx, setCarouselIdx]       = useState(0)
  const [clicsEvenements, setClicsEvenements] = useState(0)
  const [inviteVisible, setInviteVisible]   = useState(false)
  const [favoriTooltipId, setFavoriTooltipId] = useState<string | null>(null)
  const [sheetReduit, setSheetReduit]       = useState(false)
  const touchStartX                         = useRef(0)
  const aLaUneMarkerRef                     = useRef<mapboxgl.Marker | null>(null)
  const tooltipTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [enCoursIds, setEnCoursIds]         = useState<Set<string>>(new Set())
  const enCoursIntervalRef                  = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchRef                           = useRef<HTMLInputElement>(null)

  const t       = getTraductions(langue)
  const isAdmin = user?.user_metadata?.role === 'admin'

  // F8 — Recalcul des événements en cours toutes les minutes
  useEffect(() => {
    const calc = () => {
      const now = new Date()
      setEnCoursIds(new Set(evenements.filter(ev => estEnCours(ev, now)).map(ev => ev.id)))
    }
    calc()
    enCoursIntervalRef.current = setInterval(calc, 60000)
    return () => { if (enCoursIntervalRef.current) clearInterval(enCoursIntervalRef.current) }
  }, [evenements])

  // F3 — Afficher l'invitation après 3 clics si non connecté
  useEffect(() => {
    if (user || clicsEvenements < 3) return
    if (typeof window !== 'undefined' && localStorage.getItem('lotbo_invite_shown')) return
    setInviteVisible(true)
  }, [clicsEvenements, user])

  const trackEventClick = (ev?: Evenement) => {
    if (!user) setClicsEvenements(prev => prev + 1)
    track('event_clicked', { event_id: ev?.id, event_title: ev?.titre, categorie: ev?.categorie })
  }

  const dismissInvite = () => {
    setInviteVisible(false)
    if (typeof window !== 'undefined') localStorage.setItem('lotbo_invite_shown', '1')
  }

  // Amplitude — search_performed (debounce 600ms)
  useEffect(() => {
    if (!recherche) return
    const t = setTimeout(() => track('search_performed', { query: recherche }), 600)
    return () => clearTimeout(t)
  }, [recherche])

  // Amplitude — filter_applied
  useEffect(() => {
    if (categorie !== 'Toutes') track('filter_applied', { filter: 'categorie', value: categorie })
  }, [categorie])
  useEffect(() => {
    if (acces !== 'tous') track('filter_applied', { filter: 'acces', value: acces })
  }, [acces])
  useEffect(() => {
    if (prix !== 'tous') track('filter_applied', { filter: 'prix', value: prix })
  }, [prix])
  useEffect(() => {
    if (dateDebut) track('filter_applied', { filter: 'date_debut', value: dateDebut })
  }, [dateDebut])
  useEffect(() => {
    if (dateFin) track('filter_applied', { filter: 'date_fin', value: dateFin })
  }, [dateFin])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('s') === '1') {
      setMode('liste')
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [])

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
    if (!user?.id) { setFavoris(new Set()); return }
    supabase.from('favoris').select('evenement_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setFavoris(new Set(data.map((f: { evenement_id: string }) => f.evenement_id)))
    })
  }, [user])

  // Géolocalisation → ville de l'utilisateur pour le scoring "À la une"
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const url   = `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?types=place&language=fr&access_token=${token}`
      const res   = await fetch(url)
      const json  = await res.json()
      const city  = json.features?.[0]?.text
      if (city) setUserVille(city)
    }, () => {
      fetch('https://ipapi.co/json/').then(r => r.json()).then(d => { if (d.city) setUserVille(d.city) }).catch(() => {})
    })
  }, [])

  // Counts favoris + commentaires pour le scoring
  useEffect(() => {
    if (evenements.length === 0) return
    supabase.from('favoris').select('evenement_id').then(({ data }) => {
      const map: Record<string, number> = {}
      for (const f of data || []) map[f.evenement_id] = (map[f.evenement_id] || 0) + 1
      setFavorisCounts(map)
    })
    ;(async () => {
      try {
        const { data } = await supabase.from('commentaires').select('evenement_id')
        const map: Record<string, number> = {}
        for (const f of data || []) map[f.evenement_id] = (map[f.evenement_id] || 0) + 1
        setCommCounts(map)
      } catch {}
    })()
  }, [evenements.length])

  useEffect(() => {
    if (!headerRef.current) return
    const update = () => setHeaderHeight(headerRef.current!.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(headerRef.current)
    return () => ro.disconnect()
  }, [])

  // Chargement des événements indépendant de Mapbox
  useEffect(() => {
    const aujourd_hui = new Date().toISOString().split('T')[0]
    supabase
      .from('evenements')
      .select('*')
      .eq('statut', 'approuve')
      .or('date_debut.gte.' + aujourd_hui + ',date_debut.is.null')
      .neq('statut', 'hors_ligne')
      .limit(2000)
      .then(({ data }) => setEvenements((data as Evenement[]) || []))
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-72.3388, 18.5444],
      zoom: 8,
    })
    map.on('load', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 })
        })
      }
    })
    mapRef.current = map
    return () => map.remove()
  }, [])

  const filtreActif = (ev: Evenement) => {
    if (categorie !== 'Toutes' && ev.categorie !== categorie) return false
    if (acces !== 'tous' && ev.acces !== acces) return false
    if (prix !== 'tous' && ev.prix !== prix) return false
    if (recherche) {
      const q = recherche.toLowerCase()
      const matchTitre = ev.titre?.toLowerCase().includes(q)
      const matchLieu  = ev.lieu?.toLowerCase().includes(q)
      const matchVille = ev.ville?.toLowerCase().includes(q)
      const matchPays  = ev.pays?.toLowerCase().includes(q)
      if (!matchTitre && !matchLieu && !matchVille && !matchPays) return false
    }
    if (dateDebut && ev.date_debut && ev.date_debut < dateDebut) return false
    if (dateFin && ev.date_debut && ev.date_debut > dateFin) return false
    return true
  }

  useEffect(() => {
    if (!mapRef.current || evenements.length === 0) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    evenements.filter(filtreActif).forEach(ev => {
      const enCours     = enCoursIds.has(ev.id)
      const periodePopup = afficherPeriode(ev)
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div style="font-family:sans-serif;padding:12px;background:#1A1410;color:#F7F2E8;border-radius:8px;min-width:200px">' +
        (enCours ? '<span style="display:inline-block;background:#D4A820;color:white;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;margin-bottom:8px">🔴 En cours</span><br/>' : '') +
        '<img src="' + getEventImage(ev.image_url, ev.categorie) + '" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px" />' +
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
        (ev.description ? '<br/>' + ev.description.replace(/\n/g, '<br/>') : '') +
        (ev.lien ? '<br/><br/><a href="' + ev.lien + '" target="_blank" style="color:#C8431A">🔗 Plus de détails</a>' : '') +
        '<div style="display:flex;gap:8px;margin-top:12px">' +
        '<a href="/evenement/' + ev.id + '" style="flex:1;display:block;background:#C8431A;color:#F7F2E8;text-align:center;padding:8px 12px;border-radius:8px;font-weight:bold;font-size:12px;text-decoration:none">Voir →</a>' +
        '<a href="https://www.google.com/maps/dir/?api=1&destination=' + ev.latitude + ',' + ev.longitude + '" target="_blank" style="flex:1;display:block;background:rgba(255,255,255,0.08);color:#F7F2E8;text-align:center;padding:8px 12px;border-radius:8px;font-weight:bold;font-size:12px;text-decoration:none">🧭 S\'y rendre</a>' +
        '</div></div></div>'
      )
      let marker: mapboxgl.Marker
      if (enCours) {
        const el = document.createElement('div')
        el.className = 'pin-en-cours'
        el.innerHTML = '<div class="pin-pulse"></div><div class="pin-dot"></div>'
        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([ev.longitude, ev.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!)
      } else {
        const markerColor = ev.statut === 'à compléter' ? '#E87C2A' : '#C8431A'
        marker = new mapboxgl.Marker({ color: markerColor })
          .setLngLat([ev.longitude, ev.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!)
      }
      markersRef.current.push(marker)
    })
  }, [evenements, categorie, acces, prix, recherche, dateDebut, dateFin, enCoursIds])

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

  const toggleFavori = async (e: React.MouseEvent, evenementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user?.id) {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      setFavoriTooltipId(evenementId)
      tooltipTimer.current = setTimeout(() => setFavoriTooltipId(null), 3000)
      return
    }
    setTogglingFavori(evenementId)
    if (favoris.has(evenementId)) {
      await supabase.from('favoris').delete().eq('user_id', user.id).eq('evenement_id', evenementId)
      setFavoris(prev => { const next = new Set(prev); next.delete(evenementId); return next })
      track('event_favorited', { event_id: evenementId, action: 'remove' })
    } else {
      await supabase.from('favoris').insert({ user_id: user.id, evenement_id: evenementId })
      setFavoris(prev => new Set([...prev, evenementId]))
      track('event_favorited', { event_id: evenementId, action: 'add' })
      attributerPoints({ user_id: user.id, action: 'favoris', evenement_id: evenementId, type_role: 'utilisateur' })
    }
    setTogglingFavori(null)
  }

  // Score "À la une" — indépendant des filtres actifs
  const aLaUne = useMemo(() => {
    const now = new Date()
    const aujourd_hui = new Date().toISOString().split('T')[0]
    const dejaVus = new Map<string, Evenement>()
    const evenementsDedupliques = evenements
      .filter(ev => ev.statut === 'approuve')
      .reduce<Evenement[]>((acc, ev) => {
        if (!ev.parent_id) { acc.push(ev); return acc }
        const existing = dejaVus.get(ev.parent_id)
        const dateEv = ev.date_debut || ev.date
        if (!existing) {
          if (dateEv >= aujourd_hui) { dejaVus.set(ev.parent_id, ev); acc.push(ev) }
        } else {
          const dateEx = existing.date_debut || existing.date
          if (dateEv >= aujourd_hui && dateEv < dateEx) {
            dejaVus.set(ev.parent_id, ev)
            const idx = acc.indexOf(existing)
            if (idx !== -1) acc[idx] = ev
          }
        }
        return acc
      }, [])
    return evenementsDedupliques
      .map(ev => {
        const expiry  = ev.mis_en_avant_jusqu_au ? new Date(ev.mis_en_avant_jusqu_au) : null
        const actif   = ev.mis_en_avant && (!expiry || expiry >= now)
        let score     = actif ? 10000 : 0
        if (actif && ev.mis_en_avant_ville && userVille) {
          const villes = ev.mis_en_avant_ville.toLowerCase().split(',').map((v: string) => v.trim())
          if (!villes.some((v: string) => userVille.toLowerCase().includes(v) || v.includes(userVille.toLowerCase()))) score -= 5000
        }
        if (userVille && ev.lieu?.toLowerCase().includes(userVille.toLowerCase())) score += 5
        const dateEv = new Date(ev.date_debut || ev.date)
        const diffJ  = (dateEv.getTime() - now.getTime()) / 86400000
        if (diffJ >= 0 && diffJ <= 7) score += 3
        score += (favorisCounts[ev.id] || 0) * 2
        score += (commCounts[ev.id] || 0)
        if (ev.image_url) score += 1
        return { ev, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(s => s.ev)
  }, [evenements, userVille, favorisCounts, commCounts])

  // Top villes — calculé à partir des événements chargés
  const topVilles = useMemo<TopVille[]>(() => {
    const map: Record<string, { count: number; pays: string | null }> = {}
    const EXCLUSIONS = ['haiti', 'haïti', 'france', 'usa', 'canada', 'martinique', 'guadeloupe', 'bresil', 'brésil', 'espagne', 'portugal', 'belgique']
    for (const ev of evenements) {
      if (!ev.ville) continue
      const villeNorm = ev.ville.trim().toLowerCase()
      if (villeNorm.length < 3) continue
      if (EXCLUSIONS.includes(villeNorm)) continue
      const key = ev.ville.trim()
      if (!map[key]) map[key] = { count: 0, pays: ev.pays ?? null }
      map[key].count++
    }
    return Object.entries(map)
      .map(([ville, { count, pays }]) => ({ ville, count, pays }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [evenements])

  // Pin spécial "À la une" — mis à jour quand le carrousel change
  useEffect(() => {
    if (aLaUneMarkerRef.current) { aLaUneMarkerRef.current.remove(); aLaUneMarkerRef.current = null }
    const ev = aLaUne[carouselIdx]
    if (!mapRef.current || !ev || !ev.latitude || !ev.longitude) return
    const el = document.createElement('div')
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer'
    el.innerHTML =
      '<div style="background:#C8431A;color:white;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(200,67,26,0.5);margin-bottom:3px">🔥 À la une</div>' +
      '<div style="width:22px;height:22px;background:#C8431A;border:3px solid white;border-radius:50%;box-shadow:0 3px 10px rgba(200,67,26,0.6)"></div>'
    aLaUneMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([ev.longitude, ev.latitude])
      .addTo(mapRef.current)
  }, [aLaUne, carouselIdx])

  // Carousel — démarrage aléatoire + auto-avance 5s
  useEffect(() => {
    if (aLaUne.length > 0) setCarouselIdx(Math.floor(Math.random() * aLaUne.length))
  }, [aLaUne.length])

  useEffect(() => {
    if (aLaUne.length <= 1) return
    const t = setInterval(() => setCarouselIdx(prev => (prev + 1) % aLaUne.length), 5000)
    return () => clearInterval(t)
  }, [aLaUne.length])

  const evenementsFiltres = evenements.filter(filtreActif)

  // Naviguer vers une ville depuis la sidebar
  const allerVersVille = (ville: string) => {
    setRecherche(ville)
    if (!mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(ville)}.json?access_token=${token}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.features?.length > 0) {
          const [lng, lat] = data.features[0].center as [number, number]
          mapRef.current!.flyTo({ center: [lng, lat], zoom: 12 })
        }
      })
      .catch(() => {})
  }

  return (
    <main style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ══ CSS grille responsive UX4 + sidebar desktop ══ */}
      <style>{`
        .lotbo-grid-evenements {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .lotbo-event-card {
          position: relative;
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

        /* ── À la une : carrousel mobile / grille tablette-desktop ── */
        .aune-carousel { display: block; }
        .aune-grid     { display: none;  }
        @media (min-width: 768px) {
          .aune-carousel { display: none; }
          .aune-grid     { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (min-width: 1024px) {
          .aune-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── À la une bottom sheet (carte mode) — masqué sur desktop ── */
        .aune-sheet {
          position: fixed;
          bottom: 64px;
          left: 0; right: 0;
          z-index: 40;
          background: #F7F2E8;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -4px 24px rgba(26,20,16,0.16);
          pointer-events: auto;
          max-height: calc(50vh - 64px);
          overflow-y: auto;
          padding-bottom: 8px;
        }
        @media (min-width: 641px) {
          .aune-sheet {
            left: auto; right: 16px;
            bottom: auto; top: 50%;
            transform: translateY(-50%);
            width: 280px;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(26,20,16,0.18);
          }
        }
        /* Masquer le bottom sheet sur desktop — la sidebar prend le relais */
        @media (min-width: 1024px) {
          .aune-sheet { display: none !important; }
        }

        /* ── Sidebar desktop ── */
        .lotbo-sidebar {
          display: none;
        }
        @media (min-width: 1024px) {
          .lotbo-carte-wrapper {
            display: flex;
            flex: 1;
            min-height: 0;
            position: relative;
          }
          .lotbo-carte-inner {
            flex: 1;
            position: relative;
            min-width: 0;
          }
          .lotbo-sidebar {
            display: flex;
            flex-direction: column;
            width: 300px;
            flex-shrink: 0;
            background: #F7F2E8;
            border-left: 1px solid #E8E0D0;
            overflow-y: auto;
            padding: 16px 0 80px;
          }
        }
        @media (min-width: 1280px) {
          .lotbo-sidebar {
            width: 320px;
          }
        }

        /* ── Cards À la une dans la sidebar ── */
        .sidebar-aune-card {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 16px;
          text-decoration: none;
          color: #1A1410;
          border-bottom: 1px solid #F0EBE3;
          transition: background 0.12s;
        }
        .sidebar-aune-card:last-child {
          border-bottom: none;
        }
        .sidebar-aune-card:hover {
          background: #F0EBE3;
        }
        .sidebar-aune-card.active {
          background: rgba(200, 67, 26, 0.06);
          border-left: 3px solid #C8431A;
          padding-left: 13px;
        }
        .sidebar-aune-img {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .sidebar-aune-titre {
          font-size: 13px;
          font-weight: 600;
          color: #1A1410;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 3px;
        }
        .sidebar-aune-meta {
          font-size: 11px;
          color: #8C5A40;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Top villes dans la sidebar ── */
        .sidebar-ville-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 16px;
          cursor: pointer;
          border-radius: 8px;
          margin: 0 8px;
          transition: background 0.12s;
          text-decoration: none;
          color: #1A1410;
        }
        .sidebar-ville-row:hover {
          background: #F0EBE3;
        }
        .sidebar-section-title {
          font-size: 10px;
          font-weight: 700;
          color: #8C5A40;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 14px 16px 8px;
        }
        .sidebar-divider {
          height: 1px;
          background: #E8E0D0;
          margin: 4px 0;
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
                  <a href="/classement" onClick={() => setDrawerOuvert(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#F7F2E8', textDecoration: 'none', fontSize: 14 }}>🏆 Classement</a>
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
      <div ref={headerRef} style={{ position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', flexShrink: 0, background: '#F7F2E8', borderBottom: '1px solid #E8E0D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="lotbo-hamburger" onClick={() => setDrawerOuvert(true)} style={{ background: '#1A1410', border: 'none', color: '#F7F2E8', borderRadius: 999, padding: '6px 10px', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>☰</button>

          <div className="lotbo-mode-header lotbo-mode-switcher" style={{ gap: 2, background: '#E8E0D0', borderRadius: 999, padding: 3, flexShrink: 0 }}>
            <button onClick={() => setMode('carte')} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'carte' ? '#C8431A' : 'transparent', color: mode === 'carte' ? 'white' : '#8C5A40' }}>🗺️ {t.carte.carte}</button>
            <button onClick={() => setMode('liste')} style={{ padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: mode === 'liste' ? '#C8431A' : 'transparent', color: mode === 'liste' ? 'white' : '#8C5A40' }}>📋 {t.carte.liste}</button>
          </div>

          <div style={{ padding: '5px 0', fontSize: 18, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', flexShrink: 0 }}>
            <span style={{ color: '#1A1410' }}>lot</span><span style={{ color: '#C8431A' }}>bo</span>
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
            <NotifCloche userId={user?.id} />
            <a href="/ajouter" className="lotbo-ajouter-header" style={{ background: '#C8431A', color: 'white', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Ajouter</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={searchRef}
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
        <div style={{ position: 'absolute', top: headerHeight, left: 12, right: 12, zIndex: 30, background: '#F7F2E8', border: '1px solid #E8E0D0', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100dvh - 220px)', overflowY: 'auto', boxShadow: '0 4px 24px rgba(26,20,16,0.12)' }}>
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
                { label: '🗺️ Paris · Juil 2026', fn: () => { setDateDebut('2026-07-18'); setDateFin('2026-07-27'); setRecherche('Paris') }, check: () => dateDebut === '2026-07-18' && dateFin === '2026-07-27' },
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

          {/* ══ Section "À la une" ══ */}
          {aLaUne.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ color: '#8C5A40', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 'bold' }}>🔥 {t.sidebar.alune}</p>

              {/* Mobile — carrousel */}
              <div className="aune-carousel">
                <div
                  style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#1A1410' }}
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
                  onTouchEnd={e => {
                    const dx = e.changedTouches[0].clientX - touchStartX.current
                    if (Math.abs(dx) > 40) setCarouselIdx(prev =>
                      dx < 0 ? (prev + 1) % aLaUne.length : (prev - 1 + aLaUne.length) % aLaUne.length
                    )
                  }}
                >
                  {aLaUne.map((ev, i) => (
                    <a key={ev.id} href={'/evenement/' + ev.id} style={{ display: i === carouselIdx ? 'block' : 'none', position: 'relative', textDecoration: 'none' }}>
                      <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = FALLBACK_IMAGES[ev.categorie]; if (fb && img.src !== fb) img.src = fb }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,20,16,0.93) 0%, rgba(26,20,16,0.25) 55%, transparent 100%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <span style={{ background: '#C8431A', color: '#F7F2E8', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>
                          {ev.mis_en_avant ? '📌 À la une' : '🔥 À la une'}
                        </span>
                      </div>
                      <button onClick={(e) => toggleFavori(e, ev.id)} disabled={togglingFavori === ev.id} aria-label={favoris.has(ev.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" stroke={favoris.has(ev.id) ? '#C8431A' : '#8C5A40'} strokeWidth="1.8" fill={favoris.has(ev.id) ? '#C8431A' : 'none'} />
                        </svg>
                      </button>
                      <div style={{ position: 'absolute', bottom: 36, left: 14, right: 14 }}>
                        <p style={{ color: '#F7F2E8', fontWeight: 'bold', fontSize: 17, marginBottom: 4, lineHeight: 1.3 }}>{ev.titre}</p>
                        <p style={{ color: 'rgba(247,242,232,0.8)', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                        <p style={{ color: 'rgba(247,242,232,0.8)', fontSize: 12 }}>📅 {afficherPeriode(ev)}</p>
                      </div>
                    </a>
                  ))}
                  {aLaUne.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
                      {aLaUne.map((_, i) => (
                        <button key={i} onClick={e => { e.preventDefault(); setCarouselIdx(i) }}
                          style={{ width: i === carouselIdx ? 18 : 6, height: 6, borderRadius: 999, background: i === carouselIdx ? 'white' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tablette / Desktop — grille statique */}
              <div className="aune-grid">
                {aLaUne.map(ev => (
                  <a key={ev.id} href={'/evenement/' + ev.id} style={{ display: 'block', position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#1A1410', textDecoration: 'none' }}>
                    <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = FALLBACK_IMAGES[ev.categorie]; if (fb && img.src !== fb) img.src = fb }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,20,16,0.93) 0%, rgba(26,20,16,0.2) 55%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ background: '#C8431A', color: '#F7F2E8', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>
                        {ev.mis_en_avant ? '📌 À la une' : '🔥 À la une'}
                      </span>
                    </div>
                    <button onClick={(e) => toggleFavori(e, ev.id)} disabled={togglingFavori === ev.id} aria-label={favoris.has(ev.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" stroke={favoris.has(ev.id) ? '#C8431A' : '#8C5A40'} strokeWidth="1.8" fill={favoris.has(ev.id) ? '#C8431A' : 'none'} />
                      </svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                      <p style={{ color: '#F7F2E8', fontWeight: 'bold', fontSize: 15, marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{ev.titre}</p>
                      <p style={{ color: 'rgba(247,242,232,0.75)', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                      <p style={{ color: 'rgba(247,242,232,0.75)', fontSize: 12 }}>📅 {afficherPeriode(ev)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

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
                      <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} className="card-image" onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = FALLBACK_IMAGES[ev.categorie]; if (fb && img.src !== fb) img.src = fb }} />
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
              <a href={'/evenement/' + ev.id} key={ev.id} className="lotbo-event-card" onClick={() => trackEventClick(ev)}>
                <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} className="card-image" onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = FALLBACK_IMAGES[ev.categorie]; if (fb && img.src !== fb) img.src = fb }} />
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
                <button
                  onClick={(e) => toggleFavori(e, ev.id)}
                  disabled={togglingFavori === ev.id}
                  aria-label={favoris.has(ev.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%',
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0, flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(26,20,16,0.12)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
                      stroke={favoris.has(ev.id) ? '#C8431A' : '#8C5A40'}
                      strokeWidth="1.8"
                      fill={favoris.has(ev.id) ? '#C8431A' : 'none'}
                    />
                  </svg>
                </button>
              </a>
            ))}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════
          CARTE + SIDEBAR DESKTOP (mode carte)
      ══════════════════════════════════════ */}
      <div className="lotbo-carte-wrapper" style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* ── Carte Mapbox ── */}
        <div className="lotbo-carte-inner">
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

        {/* ── Sidebar desktop — visible uniquement ≥ 1024px en mode carte ── */}
        {mode === 'carte' && (
          <aside className="lotbo-sidebar">

            {/* ── Section À la une ── */}
            {aLaUne.length > 0 && (
              <>
                <div className="sidebar-section-title">🔥 {t.sidebar.alune}</div>
                <div>
                  {aLaUne.map((ev, i) => (
                    <a
                      key={ev.id}
                      href={'/evenement/' + ev.id}
                      className={`sidebar-aune-card${i === carouselIdx ? ' active' : ''}`}
                      onMouseEnter={() => setCarouselIdx(i)}
                    >
                      <img
                        src={getEventImage(ev.image_url, ev.categorie)}
                        alt={ev.titre}
                        className="sidebar-aune-img"
                        onError={e2 => {
                          if (ev.image_url) { (e2.target as HTMLImageElement).style.display = 'none'; return }
                          const img = e2.target as HTMLImageElement
                          const fb  = FALLBACK_IMAGES[ev.categorie]
                          if (fb && img.src !== fb) img.src = fb
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="sidebar-aune-titre">{ev.titre}</p>
                        <p className="sidebar-aune-meta">📍 {ev.lieu}</p>
                        <p className="sidebar-aune-meta">📅 {afficherPeriode(ev)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* ── Séparateur ── */}
            {aLaUne.length > 0 && topVilles.length > 0 && (
              <div className="sidebar-divider" style={{ margin: '8px 0' }} />
            )}

            {/* ── Section Top villes ── */}
            {topVilles.length > 0 && (
              <>
                <div className="sidebar-section-title">🌍 {t.sidebar.topvilles}</div>
                <div>
                  {topVilles.map((v, i) => (
                    <div
                      key={v.ville}
                      className="sidebar-ville-row"
                      onClick={() => allerVersVille(v.ville)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && allerVersVille(v.ville)}
                      aria-label={`Explorer ${v.ville}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: i === 0 ? '#C8431A' : i === 1 ? '#D4A820' : '#E8E0D0',
                          color: i < 2 ? 'white' : '#8C5A40',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 'bold',
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1410', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.ville}</p>
                          {v.pays && <p style={{ fontSize: 10, color: '#8C5A40', margin: 0 }}>{v.pays}</p>}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#8C5A40', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {v.count} {t.sidebar.evenements}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Lien vers vue liste filtrée */}
                <div style={{ padding: '12px 16px 0' }}>
                  <button
                    onClick={() => setMode('liste')}
                    style={{ width: '100%', background: 'transparent', border: '1px solid #E8E0D0', borderRadius: 999, padding: '8px', fontSize: 12, color: '#8C5A40', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {t.sidebar.voirtous} →
                  </button>
                </div>
              </>
            )}

          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════
          F3 — TOOLTIP FAVORI (non connecté)
      ══════════════════════════════════════ */}
      {favoriTooltipId && (
        <>
          <div onClick={() => setFavoriTooltipId(null)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
          <div style={{ position: 'fixed', bottom: 72, left: 16, right: 16, zIndex: 45, background: '#1A1410', borderRadius: 14, padding: '16px', boxShadow: '0 4px 24px rgba(26,20,16,0.3)' }}>
            <p style={{ color: '#F7F2E8', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>Connectez-vous pour sauvegarder</p>
            <p style={{ color: 'rgba(247,242,232,0.65)', fontSize: 12, marginBottom: 14 }}>Retrouvez vos événements favoris dans votre profil.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/login" onClick={() => setFavoriTooltipId(null)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#F7F2E8', border: 'none', borderRadius: 999, padding: '9px 0', fontSize: 13, fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                Se connecter
              </a>
              <a href="/login?mode=inscription" onClick={() => setFavoriTooltipId(null)}
                style={{ flex: 1, background: '#C8431A', color: '#F7F2E8', border: 'none', borderRadius: 999, padding: '9px 0', fontSize: 13, fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                Créer un compte
              </a>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          F3 — BANNIÈRE INVITATION (vue liste)
      ══════════════════════════════════════ */}
      {mode === 'liste' && inviteVisible && !user && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 18, background: '#1A1410', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -2px 16px rgba(26,20,16,0.2)' }}>
          <p style={{ color: '#F7F2E8', fontSize: 13, flex: 1, lineHeight: 1.4 }}>
            Sauvegardez vos événements favoris 🎉
          </p>
          <a href="/login?mode=inscription"
            style={{ background: '#C8431A', color: '#F7F2E8', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Créer un compte
          </a>
          <button onClick={dismissInvite}
            style={{ background: 'none', border: 'none', color: 'rgba(247,242,232,0.5)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 }}
            aria-label="Fermer">✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════
          BOTTOM SHEET "À la une" (mode carte, mobile/tablette uniquement)
          Masqué sur desktop ≥ 1024px via CSS
      ══════════════════════════════════════ */}
      {mode === 'carte' && aLaUne.length > 0 && (
        <div
          className="aune-sheet"
          style={sheetReduit ? { maxHeight: 80, overflow: 'hidden', cursor: 'pointer' } : undefined}
          onClick={sheetReduit ? () => setSheetReduit(false) : undefined}
        >
          {sheetReduit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 80 }}>
              {aLaUne[carouselIdx] && (
                <>
                  <img
                    src={getEventImage(aLaUne[carouselIdx].image_url, aLaUne[carouselIdx].categorie)}
                    alt={aLaUne[carouselIdx].titre}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    onError={e => { if (aLaUne[carouselIdx]?.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = FALLBACK_IMAGES[aLaUne[carouselIdx].categorie]; if (fb && img.src !== fb) img.src = fb }}
                  />
                  <p style={{ flex: 1, color: '#1A1410', fontWeight: 'bold', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {aLaUne[carouselIdx].titre}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setSheetReduit(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 18, padding: '4px', flexShrink: 0, lineHeight: 1 }}
                    aria-label="Agrandir le panneau">▲</button>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingBottom: 2, position: 'relative' }}>
                <div style={{ width: 36, height: 4, background: '#D4C8B8', borderRadius: 999 }} />
                <button
                  onClick={() => setSheetReduit(true)}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 16, padding: '4px', lineHeight: 1 }}
                  aria-label="Réduire le panneau">▼</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 10px' }}>
                <span style={{ background: '#C8431A', color: '#F7F2E8', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold' }}>
                  🔥 {t.sidebar.alune}
                </span>
                {aLaUne.length > 1 && (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {aLaUne.map((_, i) => (
                      <button key={i} onClick={() => setCarouselIdx(i)}
                        style={{ width: i === carouselIdx ? 16 : 6, height: 6, borderRadius: 999, background: i === carouselIdx ? '#C8431A' : '#D4C8B8', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }}
                        aria-label={`Événement ${i + 1}`} />
                    ))}
                  </div>
                )}
              </div>

              <div
                onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
                onTouchEnd={e => {
                  const dx = e.changedTouches[0].clientX - touchStartX.current
                  if (Math.abs(dx) > 40) setCarouselIdx(prev =>
                    dx < 0 ? (prev + 1) % aLaUne.length : (prev - 1 + aLaUne.length) % aLaUne.length
                  )
                }}
                style={{ padding: '8px 16px 16px' }}
              >
                {aLaUne.map((ev, i) => i === carouselIdx && (
                  <a key={ev.id} href={'/evenement/' + ev.id}
                    style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
                    <img
                      src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                      onError={e2 => { if (ev.image_url) { (e2.target as HTMLImageElement).style.display = 'none'; return; } const img = e2.target as HTMLImageElement; const fb = FALLBACK_IMAGES[ev.categorie]; if (fb && img.src !== fb) img.src = fb }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 14, marginBottom: 3 }}>{ev.titre}</p>
                      <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                      <p style={{ color: '#8C5A40', fontSize: 12, paddingBottom: 24 }}>📅 {afficherPeriode(ev)}</p>
                    </div>
                    <button
                      onClick={e2 => toggleFavori(e2, ev.id)} disabled={togglingFavori === ev.id}
                      aria-label={favoris.has(ev.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0, boxShadow: '0 1px 4px rgba(26,20,16,0.1)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 3h14a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
                          stroke={favoris.has(ev.id) ? '#C8431A' : '#8C5A40'} strokeWidth="1.8"
                          fill={favoris.has(ev.id) ? '#C8431A' : 'none'} />
                      </svg>
                    </button>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </main>
  )
}
