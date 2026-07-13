'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getEventImage } from '../../lib/fallbackImages'
import { normaliserVille, normaliserPays, codeVersNomPays } from '../../lib/normalisation'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Evenement {
  id: string
  titre: string
  lieu: string
  ville: string
  organisateur: string | null
  date: string
  heure_debut: string | null
  categorie: string
  acces: string
  prix: string
  statut: 'en_attente' | 'approuve' | 'rejete' | string
  visibilite?: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  source: string | null
  created_at: string
  mis_en_avant?: boolean
  mis_en_avant_ville?: string | null
  mis_en_avant_jusqu_au?: string | null
  date_fin?: string | null
  date_debut?: string | null
  user_id?: string | null
  soumis_en_tant_que?: string | null
  profiles?: { nom: string | null; role: string | null } | null
}

interface Signalement {
  id: string
  evenement_id: string
  raison: string
  user_id: string | null
  statut: string
  traite_par: string | null
  traite_le: string | null
  decision: string | null
  created_at: string
}

interface Reclamation {
  id: string
  evenement_id: string
  reclamant_id: string
  message: string | null
  statut: string
  traite_par: string | null
  traite_le: string | null
  created_at: string
  evenements?: { titre: string; user_id: string | null } | null
  profiles?: { nom: string | null } | null
}

interface EnqueteurCandidature {
  id: string
  nom_complet: string
  ville: string
  email: string
  whatsapp: string | null
  nom_affichage_type: string
  nom_affichage_valeur: string | null
  consent_publication: boolean
  consent_volontariat: boolean
  consent_age: boolean
  consent_photo: boolean
  photo_url: string | null
  langue: string
  signature_at: string
  token_expire_at: string
}

interface BadgeEnAttente {
  id: string
  nom_affichage: string
  ville: string
  user_id: string | null
  created_at: string
}

type FiltreStatut  = 'en_attente' | 'approuve' | 'en_cours' | 'rejete' | 'hors_ligne' | 'archive' | 'tous'
type FiltreTemporel = 'aujourd_hui' | 'cette_semaine' | 'ce_mois' | 'tous'
type Onglet        = 'evenements' | 'signalements' | 'import' | 'utilisateurs' | 'reclamations' | 'candidatures'
type FiltreRole    = 'tous' | 'membre' | 'contributeur' | 'contributeur_terrain' | 'organisateur' | 'ambassadeur' | 'admin' | 'admin_enqueteur'
type FiltreStatutUser = 'tous' | 'actif' | 'suspendu'

interface UserAdmin {
  id: string
  email: string
  nom: string | null
  role: string
  photo_url: string | null
  points_total: number
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  nb_soumis: number
  nb_approuves: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const couleurStatut = (s: string): { bg: string; color: string } => {
  if (s === 'approuve') return { bg: 'rgba(45,158,107,0.15)', color: '#2D9E6B' }
  if (s === 'rejete')   return { bg: 'rgba(180,40,40,0.2)',   color: '#e57373' }
  return                       { bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
}

const labelStatut = (s: string): string => {
  if (s === 'approuve')   return '✓ Approuvé'
  if (s === 'rejete')     return '✗ Rejeté'
  if (s === 'en_attente') return '⏳ En attente'
  return s
}

const matchTemporel = (dateStr: string, filtre: FiltreTemporel): boolean => {
  if (filtre === 'tous') return true
  if (!dateStr) return false
  const now  = new Date()
  const date = new Date(dateStr)
  if (filtre === 'aujourd_hui') {
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  if (filtre === 'cette_semaine') {
    const debut = new Date(now); debut.setDate(now.getDate() - now.getDay()); debut.setHours(0, 0, 0, 0)
    const fin   = new Date(debut); fin.setDate(debut.getDate() + 6); fin.setHours(23, 59, 59, 999)
    return date >= debut && date <= fin
  }
  if (filtre === 'ce_mois') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  return true
}

// ─── Drapeaux pays (affichage modal) ─────────────────────────────────────────
const DRAPEAUX_PAYS: Record<string, string> = {
  'Haiti':                  '🇭🇹',
  'États-Unis':             '🇺🇸',
  'France':                 '🇫🇷',
  'Canada':                 '🇨🇦',
  'Nigeria':                '🇳🇬',
  'Martinique':             '🇲🇶',
  'Guadeloupe':             '🇬🇵',
  'République Dominicaine': '🇩🇴',
  'Jamaïque':               '🇯🇲',
  "Côte d'Ivoire":          '🇨🇮',
  'Sénégal':                '🇸🇳',
  'Philippines':            '🇵🇭',
  'Suisse':                 '🇨🇭',
  'Bahamas':                '🇧🇸',
  'Belgique':               '🇧🇪',
  'Royaume-Uni':            '🇬🇧',
  'Espagne':                '🇪🇸',
  'Italie':                 '🇮🇹',
  'Allemagne':              '🇩🇪',
  'Brésil':                 '🇧🇷',
  'Argentine':              '🇦🇷',
  'Mexique':                '🇲🇽',
  'Colombie':               '🇨🇴',
  'Cuba':                   '🇨🇺',
  'Porto Rico':             '🇵🇷',
  'Trinité-et-Tobago':      '🇹🇹',
  'Barbade':                '🇧🇧',
  'Sainte-Lucie':           '🇱🇨',
  'Suriname':               '🇸🇷',
  'Haïti':                  '🇭🇹',
}

// ─── Valeurs à exclure du champ "ville" (ce sont des pays ou codes ISO) ───────
const EXCLU_VILLES = new Set([
  'haiti', 'ht', 'caribbean', 'martinique', 'guadeloupe',
  'us', 'fr', 'ca', 'ng', 'do', 'jm', 'ci', 'sn', 'mq', 'gp', 'ph', 'ch', 'bs',
  'republique dominicaine', 'dominican republic', 'bahamas', 'the bahamas',
])

// ─── Coordonnées villes (carte bubbles) ──────────────────────────────────────

const COORDS_VILLES: Record<string, [number, number]> = {
  'Port-au-Prince':      [-72.3388, 18.5425],
  'Pétionville':         [-72.2894, 18.5116],
  'Delmas':              [-72.3000, 18.5454],
  'Tabarre':             [-72.2788, 18.5845],
  'Croix-des-Bouquets':  [-72.2138, 18.5783],
  'Kenscoff':            [-72.2875, 18.4478],
  'Léogâne':             [-72.6333, 18.5122],
  'Cap-Haïtien':         [-72.2014, 19.7578],
  'Gonaïves':            [-72.6877, 19.4489],
  'Saint-Marc':          [-72.7014, 19.1189],
  'Les Cayes':           [-73.7473, 18.1936],
  'Jacmel':              [-72.5353, 18.2342],
  'Jérémie':             [-74.1201, 18.6480],
  'Port-de-Paix':        [-72.8341, 19.9319],
  'Hinche':              [-71.9874, 19.1492],
  'Fort-Liberté':        [-71.8400, 19.6626],
  'Miragoâne':           [-73.0877, 18.4444],
  'Trou-du-Nord':        [-71.9983, 19.6302],
  'Ouanaminthe':         [-71.7333, 19.5500],
  'Aquin':               [-73.0823, 18.2774],
  'Saint-Louis-du-Sud':  [-73.5167, 18.2667],
}

// ─── Carte choroplèthe bubbles ────────────────────────────────────────────────

function CarteVillesMap({ villes }: { villes: { ville: string; nb: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const points = villes
      .filter(v => COORDS_VILLES[v.ville])
      .map(v => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: COORDS_VILLES[v.ville] },
        properties: { nom: v.ville, nb: v.nb },
      }))

    let destroyed = false
    const maxNb = points.length > 0 ? Math.max(...points.map(p => p.properties.nb)) : 1

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (destroyed || !containerRef.current) return
      import('mapbox-gl/dist/mapbox-gl.css').catch(() => {})
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-72.8, 18.9],
        zoom: 6.2,
        interactive: true,
        attributionControl: false,
      })
      mapRef.current = map

      map.on('load', () => {
        if (destroyed) return
        map.addSource('villes-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: points },
        })
        map.addLayer({
          id: 'villes-bubbles',
          type: 'circle',
          source: 'villes-src',
          paint: {
            'circle-radius':       ['interpolate', ['linear'], ['get', 'nb'], 1, 8, maxNb, 36],
            'circle-color':        ['interpolate', ['linear'], ['get', 'nb'], 1, '#F7C4A0', maxNb, '#C8431A'],
            'circle-opacity':       0.82,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#fff',
          },
        })
        map.addLayer({
          id: 'villes-labels',
          type: 'symbol',
          source: 'villes-src',
          layout: {
            'text-field':          ['get', 'nom'],
            'text-size':           10,
            'text-offset':         [0, 2.4],
            'text-anchor':         'top',
            'text-allow-overlap':  false,
          },
          paint: {
            'text-color':       '#1A1410',
            'text-halo-color':  'rgba(247,242,232,0.9)',
            'text-halo-width':  1.5,
          },
        })

        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
        map.on('mouseenter', 'villes-bubbles', e => {
          map.getCanvas().style.cursor = 'pointer'
          const feat = e.features?.[0]
          if (!feat) return
          const { nom, nb } = feat.properties as { nom: string; nb: number }
          popup.setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:sans-serif;padding:6px 10px"><strong style="font-size:13px;color:#1A1410">${nom}</strong><br/><span style="color:#C8431A;font-weight:bold;font-size:12px">${nb} événement${nb > 1 ? 's' : ''}</span></div>`)
            .addTo(map)
        })
        map.on('mouseleave', 'villes-bubbles', () => {
          map.getCanvas().style.cursor = ''
          popup.remove()
        })
      })
    })

    return () => {
      destroyed = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nbSurCarte = villes.filter(v => COORDS_VILLES[v.ville]).length

  return (
    <div style={{ flexShrink: 0 }}>
      <div ref={containerRef} style={{ height: 210, background: '#E8E0D0' }} />
      {nbSurCarte < villes.length && (
        <p style={{ color: '#8C5A40', fontSize: 10, padding: '4px 12px', background: 'rgba(200,67,26,0.05)', textAlign: 'center', margin: 0 }}>
          {nbSurCarte} / {villes.length} villes avec coordonnées · les autres apparaissent dans la liste
        </p>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements]         = useState<Evenement[]>([])
  const [signalements, setSignalements]     = useState<Signalement[]>([])
  const [reclamations, setReclamations]     = useState<Reclamation[]>([])
  const [loading, setLoading]               = useState(true)
  const [userEmail, setUserEmail]           = useState<string>('')
  const [filtreStatut, setFiltreStatut]     = useState<FiltreStatut>('en_attente')
  const [filtreTemporel, setFiltreTemporel] = useState<FiltreTemporel>('tous')
  const [recherche, setRecherche]           = useState('')
  const [onglet, setOnglet]                 = useState<Onglet>('evenements')

  // ── Counts exacts (indépendants de la liste chargée) ──────────────────────
  const [countTotal,     setCountTotal]     = useState(0)
  const [countApprouves, setCountApprouves] = useState(0)
  const [countEnAttente, setCountEnAttente] = useState(0)
  const [countRejetes,   setCountRejetes]   = useState(0)
  const [countHorsLigne, setCountHorsLigne] = useState(0)
  const [countVilles,    setCountVilles]    = useState(0)
  const [countPays,      setCountPays]      = useState(0)
  const [repartitionVilles, setRepartitionVilles] = useState<{ ville: string; nb: number }[]>([])
  const [modalGeo,       setModalGeo]       = useState<'villes' | 'pays' | 'regions' | null>(null)

  const [misEnAvantConfigs, setMisEnAvantConfigs] = useState<Record<string, { ville: string; jusqu_au: string }>>({})
  const [misEnAvantSaveStatus, setMisEnAvantSaveStatus] = useState<Record<string, 'saving' | 'ok' | 'error'>>({})
  const [misEnAvantToggling, setMisEnAvantToggling] = useState<Record<string, boolean>>({})

  // SC7 — Dashboard import
  const [statsImport,      setStatsImport]      = useState<{ source: string; nb: number; dernierImport: string | null }[]>([])
  const [repartitionPays,  setRepartitionPays]  = useState<{ pays: string; nb: number }[]>([])
  const [loadingImport,    setLoadingImport]     = useState(false)
  const [loadingBelgium,   setLoadingBelgium]    = useState(false)

  // F2 — Onglet Utilisateurs
  const [countMembres,     setCountMembres]     = useState(0)
  const [parRole,          setParRole]          = useState<Record<string, number>>({})
  const [users,            setUsers]            = useState<UserAdmin[]>([])
  const [loadingUsers,     setLoadingUsers]     = useState(false)
  const [filtreRole,       setFiltreRole]       = useState<FiltreRole>('tous')
  const [filtreStatutUser, setFiltreStatutUser] = useState<FiltreStatutUser>('tous')
  const [rechercheUser,    setRechercheUser]    = useState('')
  const [changingRole,     setChangingRole]     = useState<string | null>(null)
  const [inviteStates,     setInviteStates]     = useState<Record<string, 'idle' | 'loading' | 'copied' | 'error'>>({})

  // Soumetteur — map profiles indexée par user_id
  const [profilesMap, setProfilesMap] = useState<Map<string, { nom: string | null; role: string | null }>>(new Map())

  // T-7 — Validation candidatures enquêteur
  const [accessToken,         setAccessToken]         = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [candidatures,        setCandidatures]        = useState<EnqueteurCandidature[]>([])
  const [loadingCandidatures, setLoadingCandidatures]  = useState(false)
  const [traitementId,        setTraitementId]        = useState<string | null>(null)
  const [badgesEnAttente,     setBadgesEnAttente]     = useState<BadgeEnAttente[]>([])
  const [loadingBadges,       setLoadingBadges]       = useState(false)

  // F5 — Modal rejet
  const [modalRejet,    setModalRejet]    = useState<{ id: string; titre: string; userId: string | null } | null>(null)
  const [raisonRejet,   setRaisonRejet]   = useState('')
  const [raisonAutre,   setRaisonAutre]   = useState('')
  const [loadingRejet,  setLoadingRejet]  = useState(false)

  const hi: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '',
  }

  // T-7 — Auth par session vérifiée serveur (pas de secret exposé au navigateur)
  // Décision Conseiller Stratégique 11 juillet 2026 — voir SEC-ADMIN-ROUTES-1
  // pour l'audit du pattern hi (secret NEXT_PUBLIC) sur les autres routes admin.
  const hiAuth = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()
      const role = prof?.role ?? data.session.user.user_metadata?.role
      if (role !== 'admin' && role !== 'admin_enqueteur') { router.push('/'); return }
      setUserEmail(data.session.user.email ?? '')
      setAccessToken(data.session.access_token)
      setUserRole(role)
      if (role === 'admin_enqueteur') {
        setOnglet('candidatures')
        chargerCandidatures()
      } else {
        chargerDonnees()
      }
    })
  }, [])

  const chargerDonnees = async () => {
    // ── 1. Counts exacts via count:exact — pas de limite 1000 ────────────────
    const [
      { count: total },
      { count: approuves },
      { count: enAttente },
      { count: rejetes },
      { count: horsLigne },
    ] = await Promise.all([
      supabase.from('evenements').select('*', { count: 'exact', head: true }),
      supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('statut', 'approuve'),
      supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
      supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('statut', 'rejete'),
      supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('statut', 'hors_ligne'),
    ])
    setCountTotal(total || 0)
    setCountApprouves(approuves || 0)
    setCountEnAttente(enAttente || 0)
    setCountRejetes(rejetes || 0)
    setCountHorsLigne(horsLigne || 0)

    // ── 2. Villes distinctes (count côté client sur colonne ville) ───────────
    const { data: villesData } = await supabase
      .from('evenements')
      .select('ville')
      .eq('statut', 'approuve')
      .not('ville', 'is', null)
    const mapVilles: Record<string, number> = {}
    for (const ev of villesData || []) {
      const v = ev.ville?.trim()
      if (!v) continue
      const vStripped = v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (EXCLU_VILLES.has(vStripped)) continue
      const vNorm = normaliserVille(v)
      mapVilles[vNorm] = (mapVilles[vNorm] || 0) + 1
    }
    const villesArr = Object.entries(mapVilles).map(([ville, nb]) => ({ ville, nb })).sort((a, b) => b.nb - a.nb)
    setCountVilles(villesArr.length)
    setRepartitionVilles(villesArr)

    // ── 3. Liste événements — limit 2000 pour dépasser la limite par défaut ──
    const [{ data: evs }, { data: sigs }, { data: reclsData }] = await Promise.all([
      supabase.from('evenements').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('signalements').select('*').order('created_at', { ascending: false }),
      supabase.from('reclamations_evenements').select('*, evenements(titre, user_id), profiles!reclamations_evenements_reclamant_id_fkey(nom)').order('created_at', { ascending: false }),
    ])
    const { data: rejetesData } = await supabase
      .from('evenements').select('*').eq('statut', 'rejete').order('created_at', { ascending: false })
    const baseEvs   = (evs as Evenement[]) || []
    const seenIds   = new Set(baseEvs.map(e => e.id))
    const allEvs    = [...baseEvs, ...((rejetesData as Evenement[]) || []).filter(e => !seenIds.has(e.id))]
    setEvenements(allEvs)

    // ── Profils soumetteurs — via API service role (contourne RLS anon) ────────
    const userIds = [...new Set(allEvs.map(e => e.user_id).filter(Boolean))] as string[]
    if (userIds.length > 0) {
      try {
        const res = await fetch(`/api/admin/profiles?ids=${userIds.join(',')}`, { headers: hiAuth() })
        const json = await res.json()
        setProfilesMap(new Map((json.profiles || []).map((p: { id: string; nom: string | null; role: string | null }) => [p.id, p])))
      } catch { /* si fetch échoue, la map reste vide — non bloquant */ }
    }

    // Pré-remplir les configs pour les événements déjà mis en avant
    const cfgs: Record<string, { ville: string; jusqu_au: string }> = {}
    for (const ev of allEvs) {
      if (ev.mis_en_avant) cfgs[ev.id] = { ville: ev.mis_en_avant_ville || '', jusqu_au: ev.mis_en_avant_jusqu_au || '' }
    }
    setMisEnAvantConfigs(cfgs)
    setSignalements((sigs as Signalement[]) || [])
    setReclamations((reclsData as Reclamation[]) || [])

    // ── 4. SC7 — Stats import par source ─────────────────────────────────────
    const { data: statsSource } = await supabase
      .from('evenements')
      .select('source, created_at')
      .eq('statut', 'approuve')
      .not('source', 'is', null)
      .limit(2000)

    if (statsSource) {
      const map: Record<string, { nb: number; dernierImport: string }> = {}
      for (const ev of statsSource) {
        if (!ev.source) continue
        if (!map[ev.source]) map[ev.source] = { nb: 0, dernierImport: ev.created_at }
        map[ev.source].nb++
        if (ev.created_at > map[ev.source].dernierImport) map[ev.source].dernierImport = ev.created_at
      }
      setStatsImport(
        Object.entries(map)
          .map(([source, v]) => ({ source, nb: v.nb, dernierImport: v.dernierImport }))
          .sort((a, b) => b.nb - a.nb)
      )
    }

    // ── 5. SC7 — Répartition par pays ────────────────────────────────────────
    const { data: statsPays } = await supabase
      .from('evenements')
      .select('pays')
      .eq('statut', 'approuve')
      .not('pays', 'is', null)
      .limit(2000)

    if (statsPays) {
      const map: Record<string, number> = {}
      for (const ev of statsPays) {
        if (!ev.pays) continue
        const paysNorm = codeVersNomPays(normaliserPays(ev.pays))
        map[paysNorm] = (map[paysNorm] || 0) + 1
      }
      const allPays = Object.entries(map).map(([pays, nb]) => ({ pays, nb })).sort((a, b) => b.nb - a.nb)
      setCountPays(allPays.length)
      setRepartitionPays(allPays)
    }

    // ── 6. Count membres (auth.users) via endpoint léger ─────────────────────
    try {
      const resMembres = await fetch('/api/admin/users?count=true', { headers: hiAuth() })
      const jsonMembres = await resMembres.json()
      setCountMembres(jsonMembres.total || 0)
      setParRole(jsonMembres.parRole || {})
    } catch { /* non bloquant */ }

    setLoading(false)
  }

  const chargerUtilisateurs = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users', { headers: hiAuth() })
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
        setCountMembres(data.users.length)  // auth.users = total réel, pas seulement profiles
      }
    } catch { /* ignore */ }
    setLoadingUsers(false)
  }

  const chargerCandidatures = async () => {
    setLoadingCandidatures(true)
    try {
      const res  = await fetch('/api/admin/enqueteurs/candidatures', { headers: hiAuth() })
      const data = await res.json()
      setCandidatures(data.candidatures || [])
    } catch { /* ignore */ }
    setLoadingCandidatures(false)

    setLoadingBadges(true)
    try {
      const resB  = await fetch('/api/admin/enqueteurs/badges', { headers: hiAuth() })
      const dataB = await resB.json()
      setBadgesEnAttente(dataB.badges || [])
    } catch { /* ignore */ }
    setLoadingBadges(false)
  }

  const validerCandidature = async (c: EnqueteurCandidature) => {
    if (!confirm(`Valider la candidature de ${c.nom_complet} ? Elle apparaîtra publiquement sur lotbo.app/enqueteurs.`)) return
    setTraitementId(c.id)
    try {
      const res  = await fetch('/api/admin/enqueteurs/valider', { method: 'POST', headers: hiAuth(), body: JSON.stringify({ consentementId: c.id }) })
      const data = await res.json()
      if (data.error) { alert('Erreur : ' + data.error); setTraitementId(null); return }
      setCandidatures(prev => prev.filter(x => x.id !== c.id))
    } catch {
      alert('Erreur lors de la validation')
    }
    setTraitementId(null)
  }

  const rejeterCandidature = async (c: EnqueteurCandidature) => {
    if (!confirm(`Rejeter la candidature de ${c.nom_complet} ?`)) return
    setTraitementId(c.id)
    try {
      const res  = await fetch('/api/admin/enqueteurs/rejeter', { method: 'POST', headers: hiAuth(), body: JSON.stringify({ consentementId: c.id }) })
      const data = await res.json()
      if (data.error) { alert('Erreur : ' + data.error); setTraitementId(null); return }
      setCandidatures(prev => prev.filter(x => x.id !== c.id))
    } catch {
      alert('Erreur lors du rejet')
    }
    setTraitementId(null)
  }

  const marquerBadgeEnvoye = async (id: string) => {
    setTraitementId(id)
    try {
      await fetch('/api/admin/enqueteurs/badges', { method: 'PATCH', headers: hiAuth(), body: JSON.stringify({ id }) })
      setBadgesEnAttente(prev => prev.filter(b => b.id !== id))
    } catch { /* ignore */ }
    setTraitementId(null)
  }

  const changerRole = async (id: string, role: string) => {
    setChangingRole(id)
    try {
      const res  = await fetch('/api/admin/users', { method: 'PATCH', headers: hiAuth(), body: JSON.stringify({ id, role }) })
      const data = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch { /* ignore */ }
    setChangingRole(null)
  }

  const toggleSuspendre = async (user: UserAdmin) => {
    const suspendre = !user.banned_until
    if (!confirm(suspendre ? `Suspendre ${user.email} ?` : `Réactiver ${user.email} ?`)) return
    setChangingRole(user.id)
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: hiAuth(),
        body: JSON.stringify({ id: user.id, suspendu: suspendre }),
      })
      const newBannedUntil = suspendre ? new Date(Date.now() + 876600 * 3600000).toISOString() : null
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned_until: newBannedUntil } : u))
    } catch { /* ignore */ }
    setChangingRole(null)
  }

  const genererInvitation = async (userId: string, email: string) => {
    setInviteStates(prev => ({ ...prev, [userId]: 'loading' }))
    try {
      const res  = await fetch('/api/admin/users', { method: 'POST', headers: hiAuth(), body: JSON.stringify({ email }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await navigator.clipboard.writeText(data.link)
      setInviteStates(prev => ({ ...prev, [userId]: 'copied' }))
      setTimeout(() => setInviteStates(prev => ({ ...prev, [userId]: 'idle' })), 2500)
    } catch {
      setInviteStates(prev => ({ ...prev, [userId]: 'error' }))
      setTimeout(() => setInviteStates(prev => ({ ...prev, [userId]: 'idle' })), 2500)
    }
  }

  const ROLES_INFERIEURS = ['visiteur', 'membre', 'contributeur']

  const approuver = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'approuve' }).eq('id', id)
    setEvenements(prev => prev.map(ev => ev.id === id ? { ...ev, statut: 'approuve' } : ev))
    setCountApprouves(c => c + 1)
    setCountEnAttente(c => Math.max(0, c - 1))
    const ev = evenements.find(e => e.id === id)
    if (ev) {
      fetch('/api/notify-abonnes', { method: 'POST', headers: hiAuth(), body: JSON.stringify({ id: ev.id, titre: ev.titre, lieu: ev.lieu, ville: ev.ville, date: ev.date, categorie: ev.categorie }) }).catch(() => {})
      fetch('/api/push-notify',    { method: 'POST', headers: hiAuth(), body: JSON.stringify({ titre: ev.titre, lieu: ev.lieu, url: `https://app.lotbo.app/evenement/${ev.id}` }) }).catch(() => {})
      if (ev.user_id) {
        await fetch('/api/admin/notifications', {
          method: 'POST', headers: hiAuth(),
          body: JSON.stringify({
            user_id: ev.user_id,
            type: 'evenement_approuve',
            titre: 'Événement approuvé ✅',
            message: `Votre événement "${ev.titre}" est maintenant en ligne.`,
            lien: `/evenement/${ev.id}`,
          }),
        }).catch(() => {})
        const typeRole = ev.soumis_en_tant_que === 'contributeur' ? 'utilisateur' : 'organisateur'
        fetch('/api/attributer-points', {
          method: 'POST', headers: hiAuth(),
          body: JSON.stringify({ user_id: ev.user_id, action: 'evenement_approuve', evenement_id: ev.id, type_role: typeRole }),
        }).catch(() => {})

        // Promotion automatique du rôle au premier événement approuvé
        const profilActuel = profilesMap.get(ev.user_id)
        const roleActuel   = profilActuel?.role ?? 'visiteur'
        if (ROLES_INFERIEURS.includes(roleActuel)) {
          const nouveauRole = ev.soumis_en_tant_que === 'organisateur' ? 'organisateur' : 'contributeur'
          // Anti-rétrogradation : ne jamais promouvoir vers un rôle identique ou inférieur
          if (nouveauRole !== roleActuel) fetch('/api/admin/users', {
            method: 'PATCH', headers: hiAuth(),
            body: JSON.stringify({ id: ev.user_id, role: nouveauRole, raison: 'Promotion automatique — premier événement approuvé' }),
          }).then(async (res) => {
            if (res.ok) {
              // Mettre à jour profilesMap local
              setProfilesMap(prev => {
                const next = new Map(prev)
                const existing = next.get(ev.user_id!) ?? { nom: null, role: null }
                next.set(ev.user_id!, { ...existing, role: nouveauRole })
                return next
              })
              // Mettre à jour la liste utilisateurs si elle est chargée
              setUsers(prev => prev.map(u => u.id === ev.user_id && ROLES_INFERIEURS.includes(u.role) ? { ...u, role: nouveauRole } : u))
              // Notifier l'utilisateur de sa promotion
              await fetch('/api/admin/notifications', {
                method: 'POST', headers: hiAuth(),
                body: JSON.stringify({
                  user_id: ev.user_id,
                  type: 'badge_debloque',
                  titre: nouveauRole === 'organisateur' ? '🎪 Tu es Organisateur !' : '⭐ Tu es Contributeur !',
                  message: nouveauRole === 'organisateur'
                    ? 'Ton premier événement a été approuvé. Bienvenue parmi les organisateurs LOTBO !'
                    : 'Ton premier événement a été approuvé. Tu rejoins les contributeurs LOTBO !',
                  lien: '/profil',
                }),
              }).catch(() => {})
            }
          }).catch(() => {})
        }

        // GM-BADGE-WIKI1 — Badge Contributeur Wikimedia
        if (ev.source === 'wikimedia') {
          fetch('/api/admin/notifications', {
            method: 'POST', headers: hiAuth(),
            body: JSON.stringify({
              user_id: ev.user_id,
              type: 'badge_debloque',
              titre: '🌐 Badge Contributeur Wikimedia !',
              message: 'Ton événement Wikimedia a été approuvé. Badge débloqué sur LOTBO !',
              lien: '/profil?onglet=badges',
            }),
          }).catch(() => {})
        }

        // notif_scan_publie — notification dédiée si l'événement vient d'un scan IA
        if (ev.source === 'scan_publie') {
          supabase.from('profiles').select('notif_scan_publie').eq('id', ev.user_id).single().then(({ data: p }) => {
            if (p?.notif_scan_publie ?? true) {
              fetch('/api/admin/notifications', {
                method: 'POST', headers: hiAuth(),
                body: JSON.stringify({
                  user_id: ev.user_id,
                  type: 'scan_publie',
                  titre: '📸 Ton scan a été publié !',
                  message: `"${ev.titre}" est maintenant en ligne, généré depuis ton scan.`,
                  lien: `/evenement/${ev.id}`,
                }),
              }).catch(() => {})
            }
          })
        }
      }
    }
  }

  const ouvrirModalRejet = (ev: Evenement) => {
    setModalRejet({ id: ev.id, titre: ev.titre, userId: ev.user_id ?? null })
    setRaisonRejet('')
    setRaisonAutre('')
  }

  const confirmerRejet = async () => {
    if (!modalRejet) return
    const raison = raisonRejet === 'Autre' ? raisonAutre.trim() : raisonRejet
    if (!raison) return
    setLoadingRejet(true)

    const { error } = await supabase.from('evenements')
      .update({ statut: 'rejete', raison_rejet: raison })
      .eq('id', modalRejet.id)

    if (error?.code === '42703') {
      // colonne raison_rejet absente — fallback sans raison_rejet
      // Migration à exécuter : ALTER TABLE evenements ADD COLUMN IF NOT EXISTS raison_rejet TEXT
      await supabase.from('evenements').update({ statut: 'rejete' }).eq('id', modalRejet.id)
    }

    setEvenements(prev => prev.map(ev => ev.id === modalRejet.id ? { ...ev, statut: 'rejete' } : ev))
    setCountRejetes(c => c + 1)
    setCountEnAttente(c => Math.max(0, c - 1))

    fetch('/api/notify-rejet', {
      method: 'POST',
      headers: hiAuth(),
      body: JSON.stringify({ evenementId: modalRejet.id, titre: modalRejet.titre, raison, userId: modalRejet.userId }),
    }).catch(() => {})

    if (modalRejet.userId) {
      await fetch('/api/admin/notifications', {
        method: 'POST', headers: hiAuth(),
        body: JSON.stringify({
          user_id: modalRejet.userId,
          type: 'evenement_rejete',
          titre: 'Événement non publié',
          message: `Votre événement "${modalRejet.titre}" n'a pas été approuvé.`,
          lien: null,
        }),
      }).catch(() => {})
    }

    setLoadingRejet(false)
    setModalRejet(null)
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(prev => prev.filter(ev => ev.id !== id))
    setCountTotal(c => Math.max(0, c - 1))
  }

  const toggleMisEnAvant = async (id: string, actuel: boolean) => {
    if (misEnAvantToggling[id]) return
    const val = !actuel
    setMisEnAvantToggling(prev => ({ ...prev, [id]: true }))
    const { error } = await supabase.from('evenements').update({ mis_en_avant: val }).eq('id', id)
    if (error) {
      setMisEnAvantToggling(prev => ({ ...prev, [id]: false }))
      alert('Erreur épinglage : ' + error.message)
      return
    }
    setEvenements(prev => prev.map(ev => ev.id === id ? { ...ev, mis_en_avant: val } : ev))
    if (val) {
      setMisEnAvantConfigs(prev => ({ ...prev, [id]: prev[id] ?? { ville: '', jusqu_au: '' } }))
    } else {
      await supabase.from('evenements').update({ mis_en_avant_ville: null, mis_en_avant_jusqu_au: null }).eq('id', id)
      setMisEnAvantConfigs(prev => { const next = { ...prev }; delete next[id]; return next })
      setMisEnAvantSaveStatus(prev => { const next = { ...prev }; delete next[id]; return next })
    }
    setMisEnAvantToggling(prev => ({ ...prev, [id]: false }))
  }

  const saveMisEnAvantConfig = async (id: string) => {
    const cfg = misEnAvantConfigs[id]
    if (!cfg) return
    setMisEnAvantSaveStatus(prev => ({ ...prev, [id]: 'saving' }))
    const { error } = await supabase.from('evenements').update({
      mis_en_avant_ville:    cfg.ville || null,
      mis_en_avant_jusqu_au: cfg.jusqu_au || null,
    }).eq('id', id)
    if (error) {
      setMisEnAvantSaveStatus(prev => ({ ...prev, [id]: 'error' }))
      return
    }
    setMisEnAvantSaveStatus(prev => ({ ...prev, [id]: 'ok' }))
    setTimeout(() => setMisEnAvantSaveStatus(prev => { const next = { ...prev }; delete next[id]; return next }), 2000)
  }

  const traiterSignalement = async (sig: Signalement, decision: 'maintenu' | 'retire') => {
    const { data: { session } } = await supabase.auth.getSession()

    await supabase.from('signalements').update({
      statut:     decision,
      traite_par: session?.user?.id ?? null,
      traite_le:  new Date().toISOString(),
      decision,
    }).eq('id', sig.id)

    if (decision === 'retire') {
      await supabase.from('evenements').update({ statut: 'hors_ligne' }).eq('id', sig.evenement_id)
    }

    if (sig.user_id) {
      const msg = decision === 'maintenu'
        ? "Votre signalement a été examiné — l'événement a été maintenu."
        : "Votre signalement a été examiné — l'événement a été retiré."
      await fetch('/api/admin/notifications', {
        method: 'POST', headers: hiAuth(),
        body: JSON.stringify({
          user_id: sig.user_id,
          type:    'classement',
          titre:   'Signalement traité',
          message: msg,
          lien:    null,
        }),
      }).catch(() => {})
    }

    if (decision === 'retire') {
      const ev = evenements.find(e => e.id === sig.evenement_id)
      if (ev?.user_id) {
        await fetch('/api/admin/notifications', {
          method: 'POST', headers: hiAuth(),
          body: JSON.stringify({
            user_id: ev.user_id,
            type:    'evenement_rejete',
            titre:   'Événement retiré suite à un signalement',
            message: `Votre événement "${ev.titre}" a été retiré suite à un signalement.`,
            lien:    null,
          }),
        }).catch(() => {})
      }
    }

    chargerDonnees()
  }

  // ─── Stats affichées — counts exacts + dérivés de la liste ───────────────

  const nbRegions = new Set(
    evenements
      .filter(e => e.statut === 'approuve' && e.longitude !== null)
      .map(e => (e.longitude! < -30 ? 'Amériques' : e.longitude! < 60 ? 'Europe/Afrique' : 'Asie/Pacifique'))
  ).size

  const repartitionRegions = (() => {
    const map: Record<string, number> = {}
    for (const ev of evenements) {
      if (ev.statut !== 'approuve' || ev.longitude === null) continue
      const r = ev.longitude < -30 ? 'Amériques' : ev.longitude < 60 ? 'Europe/Afrique' : 'Asie/Pacifique'
      map[r] = (map[r] || 0) + 1
    }
    return Object.entries(map).map(([region, nb]) => ({ region, nb })).sort((a, b) => b.nb - a.nb)
  })()

  // ─── Classification temporelle ───────────────────────────────────────────

  const getStatutTemporel = (ev: Evenement): 'a_venir' | 'en_cours' | 'archive' => {
    const dateRef = ev.date_fin || ev.date_debut || ev.date
    if (!dateRef) return 'a_venir'
    const debut      = new Date(ev.date_debut || ev.date || dateRef)
    const fin        = new Date(ev.date_fin   || ev.date_debut || ev.date || dateRef)
    const aujourdhui = new Date(); aujourdhui.setHours(0, 0, 0, 0)
    const demain     = new Date(aujourdhui);  demain.setDate(demain.getDate() + 1)
    if (fin < aujourdhui)                    return 'archive'
    if (debut <= demain && fin >= aujourdhui) return 'en_cours'
    return 'a_venir'
  }

  const nbAVenir   = evenements.filter(ev => ev.statut === 'approuve' && getStatutTemporel(ev) === 'a_venir').length
  const nbEnCours  = evenements.filter(ev => ev.statut === 'approuve' && getStatutTemporel(ev) === 'en_cours').length
  const nbArchives = evenements.filter(ev => ev.statut === 'approuve' && getStatutTemporel(ev) === 'archive').length

  // ─── Filtre combiné ───────────────────────────────────────────────────────

  const matchStatutFn = (ev: Evenement): boolean => {
    if (filtreStatut === 'approuve') return ev.statut === 'approuve' && getStatutTemporel(ev) === 'a_venir'
    if (filtreStatut === 'en_cours') return ev.statut === 'approuve' && getStatutTemporel(ev) === 'en_cours'
    if (filtreStatut === 'archive')  return ev.statut === 'approuve' && getStatutTemporel(ev) === 'archive'
    if (filtreStatut === 'tous')     return true
    return ev.statut === filtreStatut
  }

  const evenementsFiltres = evenements.filter(ev => {
    const matchTemps     = matchTemporel(ev.date || ev.date_debut || '', filtreTemporel)
    const q              = recherche.toLowerCase()
    const matchRecherche = q === '' ||
      ev.titre?.toLowerCase().includes(q) ||
      ev.lieu?.toLowerCase().includes(q) ||
      ev.organisateur?.toLowerCase().includes(q)
    return matchStatutFn(ev) && matchTemps && matchRecherche
  })

  const nbParTemps = (f: FiltreTemporel) =>
    evenements.filter(ev => matchStatutFn(ev) && matchTemporel(ev.date || ev.date_debut || '', f)).length

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40', fontFamily: 'serif', fontStyle: 'italic' }}>Chargement...</p>
    </main>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── En-tête ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            <span style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold' }}>lot</span>
            <span style={{ color: '#C8431A', fontSize: 24, fontWeight: 'bold' }}>bo</span>
            <span style={{ color: '#8C5A40', fontSize: 14, marginLeft: 12 }}>admin</span>
          </div>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
        </div>

        {/* ── Stats — counts exacts ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
          {([
            { label: 'Total',      valeur: countTotal,     couleur: '#1A1410', onClick: () => { setFiltreStatut('tous');       setOnglet('evenements') }, public: true },
            { label: 'En attente', valeur: countEnAttente, couleur: '#D4A820', onClick: () => { setFiltreStatut('en_attente'); setOnglet('evenements') }, public: false },
            { label: 'Approuvés',  valeur: countApprouves, couleur: '#2D9E6B', onClick: () => { setFiltreStatut('approuve');   setOnglet('evenements') }, public: true },
            { label: 'Rejetés',    valeur: countRejetes,   couleur: '#e57373', onClick: () => { setFiltreStatut('rejete');     setOnglet('evenements') }, public: false },
            { label: 'Membres',    valeur: countMembres,   couleur: '#4A90D9', onClick: () => { setOnglet('utilisateurs'); if (users.length === 0) chargerUtilisateurs() }, public: false },
            { label: 'Villes',     valeur: countVilles,    couleur: '#C8431A', onClick: () => setModalGeo('villes'), public: true },
            { label: 'Pays',       valeur: countPays,      couleur: '#8C5A40', onClick: () => setModalGeo('pays'), public: true },
            { label: 'Régions',    valeur: nbRegions,      couleur: '#8C5A40', onClick: () => setModalGeo('regions'), public: true },
          ] as Array<{ label: string; valeur: number; couleur: string; onClick: () => void; public: boolean }>)
            .filter(c => userRole !== 'admin_enqueteur' || c.public)
            .map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={userRole === 'admin_enqueteur' && (c.label === 'Villes' || c.label === 'Pays' || c.label === 'Régions' || c.label === 'Total' || c.label === 'Approuvés') ? undefined : c.onClick}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 12px', textAlign: 'center', cursor: (userRole === 'admin_enqueteur' && (c.label === 'Villes' || c.label === 'Pays' || c.label === 'Régions' || c.label === 'Total' || c.label === 'Approuvés')) ? 'default' : 'pointer', width: '100%', transition: 'background 0.15s, transform 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
            >
              <p style={{ fontSize: 28, fontWeight: 'bold', color: c.couleur, marginBottom: 4 }}>{c.valeur}</p>
              <p style={{ fontSize: 11, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
            </button>
          ))}
        </div>

        {/* ── Utilisateur connecté ──────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #333', borderRadius: 12, padding: '10px 16px', marginBottom: 24 }}>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>
            Connecté en tant que <span style={{ color: '#C8431A' }}>{userEmail}</span>
          </p>
        </div>

        {/* ── ADMIN2 — Navigation onglets ───────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #E8E0D0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { key: 'evenements',   label: 'Événements',   count: countTotal,                                                badge: true },
            { key: 'signalements', label: 'Signalements', count: signalements.length,                                       badge: true },
            { key: 'reclamations', label: '🔑 Claims', count: reclamations.filter(r => r.statut === 'en_attente').length, badge: true },
            { key: 'candidatures', label: '📋 Enquêteurs', count: candidatures.length,                                      badge: true },
            { key: 'import',       label: '📥 Import',  count: statsImport.length,                                        badge: true },
            { key: 'utilisateurs', label: '👥 Users',   count: countMembres,                                              badge: true },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setOnglet(tab.key as Onglet)
                if (tab.key === 'utilisateurs' && users.length === 0) chargerUtilisateurs()
                if (tab.key === 'candidatures' && candidatures.length === 0 && !loadingCandidatures) chargerCandidatures()
              }}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 'bold',
                border: 'none', cursor: 'pointer', background: 'transparent',
                color: onglet === tab.key ? '#C8431A' : '#8C5A40',
                borderBottom: onglet === tab.key ? '2px solid #C8431A' : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: onglet === tab.key ? '#C8431A' : 'rgba(26,20,16,0.06)',
                  color: onglet === tab.key ? 'white' : '#8C5A40',
                  borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 'bold',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ONGLET ÉVÉNEMENTS
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'evenements' && (
          <>
            {/* Filtres statut */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {([
                { key: 'en_attente',  label: '⏳ En attente', count: countEnAttente },
                { key: 'approuve',    label: '✅ En ligne',   count: nbAVenir   },
                { key: 'en_cours',    label: '🔴 En cours',   count: nbEnCours  },
                { key: 'archive',     label: '📅 Archivés',   count: nbArchives },
                { key: 'rejete',      label: '✗ Rejetés',     count: countRejetes   },
                { key: 'hors_ligne',  label: '⬇ Hors ligne',  count: countHorsLigne },
                { key: 'tous',        label: 'Tous',           count: countTotal     },
              ] as { key: FiltreStatut; label: string; count: number }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltreStatut(f.key)}
                  style={{
                    padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold',
                    border: 'none', cursor: 'pointer',
                    background: filtreStatut === f.key ? '#C8431A' : 'rgba(255,255,255,0.06)',
                    color:      filtreStatut === f.key ? 'white'   : '#8C5A40',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Stats approuvés */}
            <div style={{ fontSize: 12, color: '#8C5A40', marginBottom: 8 }}>
              {nbAVenir} à venir · {nbEnCours} en cours · {nbArchives} archivés · {nbAVenir + nbEnCours + nbArchives} total approuvés
            </div>

            {/* ADMIN1 — Filtres temporels */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Période :</span>
              {([
                { key: 'aujourd_hui',   label: "Aujourd'hui"   },
                { key: 'cette_semaine', label: 'Cette semaine' },
                { key: 'ce_mois',       label: 'Ce mois'       },
                { key: 'tous',          label: 'Toutes dates'  },
              ] as { key: FiltreTemporel; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltreTemporel(f.key)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 'bold',
                    border: filtreTemporel === f.key ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    cursor: 'pointer',
                    background: filtreTemporel === f.key ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    color:      filtreTemporel === f.key ? '#C8431A'              : '#555',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>{nbParTemps(f.key)}</span>
                </button>
              ))}
            </div>

            {/* Recherche */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Rechercher par titre, lieu, organisateur…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid #333',
                  borderRadius: 999, padding: '8px 16px', fontSize: 12,
                  color: '#1A1410', outline: 'none',
                }}
              />
            </div>

            {/* Résultat filtres */}
            {(recherche || filtreTemporel !== 'tous') && (
              <p style={{ color: '#555', fontSize: 11, marginBottom: 12 }}>
                {evenementsFiltres.length} résultat{evenementsFiltres.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Liste événements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
              {evenementsFiltres.length === 0 && (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>
                  Aucun événement dans cette catégorie.
                </p>
              )}
              {evenementsFiltres.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    background: ev.mis_en_avant ? 'rgba(200,67,26,0.06)' : 'rgba(255,255,255,0.04)',
                    border: ev.mis_en_avant ? '1px solid rgba(200,67,26,0.4)' : ev.statut === 'en_attente' ? '1px solid rgba(212,168,32,0.3)' : '1px solid #2a2a2a',
                    borderRadius: 12, padding: 16,
                    display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start',
                  }}
                >
                  <img src={getEventImage(ev.image_url, ev.categorie)} alt={ev.titre} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { if (ev.image_url) { (e.target as HTMLImageElement).style.display = 'none'; return; } const img = e.target as HTMLImageElement; const fb = getEventImage(null, ev.categorie); if (img.src !== fb) img.src = fb; else img.style.display = 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <h2 style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 15, margin: 0 }}>{ev.titre}</h2>
                      {ev.visibilite === 'prive'   && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#1A1410', color: 'white', flexShrink: 0 }}>🔒 Privé</span>}
                      {ev.visibilite === 'discret' && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#8C5A40', color: 'white', flexShrink: 0 }}>👁 Discret</span>}
                      {ev.statut === 'approuve' && (
                        getStatutTemporel(ev) === 'en_cours' ? <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#C8431A', color: 'white', flexShrink: 0 }}>🔴 En cours</span> :
                        getStatutTemporel(ev) === 'a_venir'  ? <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#2D9E6B', color: 'white', flexShrink: 0 }}>✅ À venir</span> :
                                                               <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#8C5A40', color: 'white', flexShrink: 0 }}>📅 Archivé</span>
                      )}
                    </div>
                    {ev.organisateur && (
                      <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 4 }}>👤 {ev.organisateur}</p>
                    )}
                    <p style={{ color: '#8C5A40', fontSize: 12 }}>📍 {ev.lieu}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12 }}>📅 {ev.date}{ev.heure_debut ? ` · ${ev.heure_debut}` : ''}</p>
                    {ev.source && (
                      <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Source : {ev.source}</p>
                    )}
                    {(() => {
                      if (!ev.user_id) return null
                      const soumetteur = profilesMap.get(ev.user_id)
                      const nomAffiche = soumetteur?.nom || '(compte sans nom)'
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ color: '#555', fontSize: 11 }}>Soumis par</span>
                          <button
                            onClick={() => { setOnglet('utilisateurs'); setRechercheUser(soumetteur?.nom || '') }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#C8431A', fontSize: 11, fontWeight: 'bold', textDecoration: 'underline' }}
                          >
                            {nomAffiche}
                          </button>
                          {soumetteur?.role && (
                            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(200,67,26,0.12)', color: '#C8431A' }}>
                              {soumetteur.role === 'visiteur' ? 'membre' : soumetteur.role}
                            </span>
                          )}
                          <span style={{ color: '#555', fontSize: 11 }}>
                            · {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(ev.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })()}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.categorie}</span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.acces}</span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.prix}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: couleurStatut(ev.statut).bg, color: couleurStatut(ev.statut).color }}>
                        {labelStatut(ev.statut)}
                      </span>
                      {ev.mis_en_avant && (
                        <span style={{ background: 'rgba(200,67,26,0.2)', color: '#C8431A', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold' }}>📌 À la une</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <a href={'/evenement/' + ev.id} target="_blank" style={{ background: 'rgba(255,255,255,0.06)', color: '#1A1410', padding: '6px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>
                      Voir
                    </a>
                    {ev.statut !== 'approuve' && (
                      <button onClick={() => approuver(ev.id)} style={{ background: 'rgba(45,158,107,0.15)', color: '#2D9E6B', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        Approuver
                      </button>
                    )}
                    {ev.statut !== 'rejete' && (
                      <button onClick={() => ouvrirModalRejet(ev)} style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        Rejeter
                      </button>
                    )}
                    <button onClick={() => supprimer(ev.id)} style={{ background: 'rgba(180,40,40,0.2)', color: '#e57373', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      Supprimer
                    </button>
                    <button
                      onClick={() => toggleMisEnAvant(ev.id, !!ev.mis_en_avant)}
                      disabled={!!misEnAvantToggling[ev.id]}
                      style={{ background: ev.mis_en_avant ? 'rgba(200,67,26,0.25)' : 'rgba(255,255,255,0.06)', color: ev.mis_en_avant ? '#C8431A' : '#8C5A40', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: ev.mis_en_avant ? '1px solid rgba(200,67,26,0.4)' : 'none', cursor: misEnAvantToggling[ev.id] ? 'wait' : 'pointer', fontWeight: ev.mis_en_avant ? 'bold' : 'normal', opacity: misEnAvantToggling[ev.id] ? 0.6 : 1 }}
                    >
                      {misEnAvantToggling[ev.id] ? '...' : ev.mis_en_avant ? '📌 Retirer' : '📌 Une'}
                    </button>
                  </div>

                  {/* Formulaire config mis_en_avant — pleine largeur */}
                  {ev.mis_en_avant && misEnAvantConfigs[ev.id] !== undefined && (
                    <div style={{ flexBasis: '100%', borderTop: '1px solid rgba(200,67,26,0.2)', paddingTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
                        <label style={{ color: '#8C5A40', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ville ciblée</label>
                        <input
                          type="text"
                          value={misEnAvantConfigs[ev.id].ville}
                          onChange={e => setMisEnAvantConfigs(prev => ({ ...prev, [ev.id]: { ...prev[ev.id], ville: e.target.value } }))}
                          placeholder="ex: Port-au-Prince"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,67,26,0.3)', borderRadius: 8, padding: '6px 10px', color: '#1A1410', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
                        <label style={{ color: '#8C5A40', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jusqu'au</label>
                        <input
                          type="date"
                          value={misEnAvantConfigs[ev.id].jusqu_au}
                          onChange={e => setMisEnAvantConfigs(prev => ({ ...prev, [ev.id]: { ...prev[ev.id], jusqu_au: e.target.value } }))}
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,67,26,0.3)', borderRadius: 8, padding: '6px 10px', color: '#1A1410', fontSize: 12, outline: 'none', colorScheme: 'light' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <button
                          onClick={() => saveMisEnAvantConfig(ev.id)}
                          disabled={misEnAvantSaveStatus[ev.id] === 'saving'}
                          style={{
                            background: misEnAvantSaveStatus[ev.id] === 'ok' ? '#2D9E6B' : misEnAvantSaveStatus[ev.id] === 'error' ? '#c0392b' : '#C8431A',
                            color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 'bold',
                            cursor: misEnAvantSaveStatus[ev.id] === 'saving' ? 'wait' : 'pointer', flexShrink: 0,
                            transition: 'background 0.2s',
                          }}
                        >
                          {misEnAvantSaveStatus[ev.id] === 'saving' ? '...' : misEnAvantSaveStatus[ev.id] === 'ok' ? '✓ Sauvegardé' : misEnAvantSaveStatus[ev.id] === 'error' ? '✗ Erreur' : 'Sauvegarder'}
                        </button>
                        {misEnAvantSaveStatus[ev.id] === 'error' && (
                          <span style={{ color: '#e57373', fontSize: 10 }}>Colonnes manquantes ? Voir SQL ci-dessous.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ONGLET SIGNALEMENTS
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'signalements' && (
          <div>
            {signalements.length === 0 ? (
              <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>Aucun signalement pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {signalements.map(sig => {
                  const evSig    = evenements.find(e => e.id === sig.evenement_id)
                  const statut   = sig.statut || 'nouveau'
                  const badgeCfg =
                    statut === 'maintenu' ? { label: '✅ Maintenu', bg: '#2D9E6B' } :
                    statut === 'retire'   ? { label: '⬇ Retiré',   bg: '#8C5A40' } :
                                           { label: '🔴 Nouveau',  bg: '#C8431A' }
                  return (
                    <div key={sig.id} style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a
                            href={`/evenement/${sig.evenement_id}`}
                            target="_blank"
                            style={{ color: '#C8431A', fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'block', marginBottom: 4 }}
                          >
                            {evSig?.titre ?? 'Événement inconnu'} ↗
                          </a>
                          <p style={{ color: '#e57373', fontSize: 13 }}>{sig.raison}</p>
                          <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                            {new Date(sig.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {' '}
                            {new Date(sig.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: badgeCfg.bg, color: 'white', flexShrink: 0, fontWeight: 'bold' }}>
                          {badgeCfg.label}
                        </span>
                      </div>
                      {statut === 'nouveau' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => traiterSignalement(sig, 'maintenu')}
                            style={{ background: '#2D9E6B', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ✅ Maintenir l'événement
                          </button>
                          <button
                            onClick={() => traiterSignalement(sig, 'retire')}
                            style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ⬇ Retirer l'événement
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ONGLET RÉCLAMATIONS — CLAIM-1
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'reclamations' && (
          <div>
            {reclamations.length === 0 ? (
              <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>Aucune réclamation pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reclamations.map(rec => {
                  const statut = rec.statut || 'en_attente'
                  const badgeCfg =
                    statut === 'approuve' ? { label: '✅ Approuvé', bg: '#2D9E6B' } :
                    statut === 'rejete'   ? { label: '✗ Rejeté',   bg: '#8C5A40' } :
                                           { label: '🔑 En attente', bg: '#D4A820' }
                  return (
                    <div key={rec.id} style={{ background: 'rgba(212,168,32,0.06)', border: '1px solid rgba(212,168,32,0.3)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a
                            href={`/evenement/${rec.evenement_id}`}
                            target="_blank"
                            style={{ color: '#C8431A', fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'block', marginBottom: 4 }}
                          >
                            {rec.evenements?.titre ?? 'Événement inconnu'} ↗
                          </a>
                          <p style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold' }}>
                            Réclamant : {rec.profiles?.nom ?? rec.reclamant_id.slice(0, 8)}
                          </p>
                          {rec.message && <p style={{ color: '#555', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{rec.message}"</p>}
                          <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>
                            {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: badgeCfg.bg, color: 'white', flexShrink: 0, fontWeight: 'bold' }}>
                          {badgeCfg.label}
                        </span>
                      </div>
                      {statut === 'en_attente' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button
                            onClick={async () => {
                              if (!confirm(`Transférer la propriété de "${rec.evenements?.titre}" à ce reclamant ?`)) return
                              await supabase.from('evenements').update({ user_id: rec.reclamant_id }).eq('id', rec.evenement_id)
                              await supabase.from('reclamations_evenements').update({ statut: 'approuve', traite_le: new Date().toISOString() }).eq('id', rec.id)
                              fetch('/api/admin/notifications', {
                                method: 'POST', headers: hiAuth(),
                                body: JSON.stringify({
                                  user_id: rec.reclamant_id,
                                  type: 'evenement_approuve',
                                  titre: '🔑 Réclamation approuvée !',
                                  message: `Vous êtes maintenant propriétaire de "${rec.evenements?.titre}".`,
                                  lien: `/evenement/${rec.evenement_id}`,
                                }),
                              }).catch(() => {})
                              setReclamations(prev => prev.map(r => r.id === rec.id ? { ...r, statut: 'approuve' } : r))
                            }}
                            style={{ background: '#2D9E6B', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ✅ Approuver — transférer propriété
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from('reclamations_evenements').update({ statut: 'rejete', traite_le: new Date().toISOString() }).eq('id', rec.id)
                              fetch('/api/admin/notifications', {
                                method: 'POST', headers: hiAuth(),
                                body: JSON.stringify({
                                  user_id: rec.reclamant_id,
                                  type: 'evenement_rejete',
                                  titre: 'Réclamation non approuvée',
                                  message: `Votre réclamation sur "${rec.evenements?.titre}" a été examinée et refusée.`,
                                  lien: null,
                                }),
                              }).catch(() => {})
                              setReclamations(prev => prev.map(r => r.id === rec.id ? { ...r, statut: 'rejete' } : r))
                            }}
                            style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ✗ Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {onglet === 'candidatures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 48 }}>
            <div>
              <h3 style={{ color: '#1A1410', fontSize: 15, fontWeight: 'bold', marginBottom: 12 }}>
                📋 Candidatures en attente {candidatures.length > 0 && `(${candidatures.length})`}
              </h3>
              {loadingCandidatures ? (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40, fontStyle: 'italic' }}>Chargement…</p>
              ) : candidatures.length === 0 ? (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>Aucune candidature en attente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {candidatures.map(c => {
                    const busy = traitementId === c.id
                    const tousConsentements = c.consent_publication && c.consent_volontariat && c.consent_age
                    return (
                      <div key={c.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {c.photo_url && (
                          <img src={c.photo_url} alt={c.nom_complet} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h4 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{c.nom_complet}</h4>
                          <p style={{ color: '#8C5A40', fontSize: 12 }}>📍 {c.ville}</p>
                          <p style={{ color: '#8C5A40', fontSize: 12 }}>✉️ {c.email}{c.whatsapp ? ` · 📱 ${c.whatsapp}` : ''}</p>
                          <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                            Affichage : {c.nom_affichage_type === 'vrai_nom' ? 'Vrai nom' : c.nom_affichage_type === 'username' ? `Pseudo — ${c.nom_affichage_valeur || '(vide)'}` : `Prénom + initiale${c.nom_affichage_valeur ? ` — ${c.nom_affichage_valeur}` : ' (calculé à la validation)'}`}
                          </p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: c.consent_publication ? 'rgba(45,158,107,0.15)' : 'rgba(180,40,40,0.15)', color: c.consent_publication ? '#2D9E6B' : '#e57373' }}>
                              {c.consent_publication ? '✓' : '✗'} Publication
                            </span>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: c.consent_volontariat ? 'rgba(45,158,107,0.15)' : 'rgba(180,40,40,0.15)', color: c.consent_volontariat ? '#2D9E6B' : '#e57373' }}>
                              {c.consent_volontariat ? '✓' : '✗'} Volontariat
                            </span>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: c.consent_age ? 'rgba(45,158,107,0.15)' : 'rgba(180,40,40,0.15)', color: c.consent_age ? '#2D9E6B' : '#e57373' }}>
                              {c.consent_age ? '✓' : '✗'} Âge
                            </span>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: c.consent_photo ? 'rgba(45,158,107,0.15)' : 'rgba(255,255,255,0.06)', color: c.consent_photo ? '#2D9E6B' : '#8C5A40' }}>
                              {c.consent_photo ? '✓' : '—'} Photo
                            </span>
                          </div>
                          <p style={{ color: '#555', fontSize: 10, marginTop: 6 }}>
                            Soumis le {new Date(c.signature_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · Langue {c.langue.toUpperCase()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, justifyContent: 'center' }}>
                          <button
                            onClick={() => validerCandidature(c)}
                            disabled={busy || !tousConsentements}
                            title={!tousConsentements ? 'Consentements obligatoires manquants' : ''}
                            style={{ background: tousConsentements ? 'rgba(45,158,107,0.15)' : 'rgba(255,255,255,0.04)', color: tousConsentements ? '#2D9E6B' : '#555', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: busy || !tousConsentements ? 'not-allowed' : 'pointer' }}
                          >
                            {busy ? '…' : '✓ Valider'}
                          </button>
                          <button
                            onClick={() => rejeterCandidature(c)}
                            disabled={busy}
                            style={{ background: 'rgba(180,40,40,0.15)', color: '#e57373', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: busy ? 'not-allowed' : 'pointer' }}
                          >
                            {busy ? '…' : '✗ Rejeter'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ color: '#1A1410', fontSize: 15, fontWeight: 'bold', marginBottom: 12 }}>
                🎖️ Badges physiques à envoyer {badgesEnAttente.length > 0 && `(${badgesEnAttente.length})`}
              </h3>
              {loadingBadges ? (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40, fontStyle: 'italic' }}>Chargement…</p>
              ) : badgesEnAttente.length === 0 ? (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40 }}>Aucune demande de badge en attente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {badgesEnAttente.map(b => {
                    const busy = traitementId === b.id
                    return (
                      <div key={b.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold' }}>{b.nom_affichage}</p>
                          <p style={{ color: '#8C5A40', fontSize: 11 }}>📍 {b.ville}</p>
                        </div>
                        <button
                          onClick={() => marquerBadgeEnvoye(b.id)}
                          disabled={busy}
                          style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: busy ? 'not-allowed' : 'pointer' }}
                        >
                          {busy ? '…' : '📦 Marquer envoyé'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ONGLET IMPORT — SC7
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stats globales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Sources actives', valeur: statsImport.length,      couleur: '#1A1410' },
                { label: 'Total approuvés', valeur: countApprouves,          couleur: '#2D9E6B' },
                { label: 'En attente',      valeur: countEnAttente,           couleur: '#D4A820' },
                { label: 'Pays couverts',   valeur: repartitionPays.length,  couleur: '#C8431A' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 'bold', color: c.couleur, marginBottom: 4 }}>{c.valeur}</p>
                  <p style={{ fontSize: 11, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
                </div>
              ))}
            </div>

            {/* Tableau par source */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a' }}>
                <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold' }}>📊 Par source</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                      {['Source', 'Événements', 'Dernier import'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statsImport.map((s, i) => {
                      const dernierImport = s.dernierImport ? new Date(s.dernierImport) : null
                      const heuresDepuis  = dernierImport ? Math.floor((Date.now() - dernierImport.getTime()) / 3600000) : null
                      const statut        = heuresDepuis === null ? '⏳' : heuresDepuis < 6 ? '✅' : heuresDepuis < 24 ? '⚠️' : '🔴'
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{statut}</span>
                              <span style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' }}>{s.source}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 'bold' }}>{s.nb}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#8C5A40', fontSize: 12 }}>
                            {dernierImport ? dernierImport.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                    {statsImport.length === 0 && (
                      <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#8C5A40', fontSize: 13 }}>Aucune donnée disponible</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 10 pays */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>🌍 Top pays</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {repartitionPays.map((p, i) => {
                  const total = repartitionPays.reduce((s, x) => s + x.nb, 0)
                  const pct   = total > 0 ? Math.round((p.nb / total) * 100) : 0
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#8C5A40', fontSize: 12, width: 24, textAlign: 'right' }}>#{i + 1}</span>
                      <span style={{ color: '#1A1410', fontSize: 13, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.pays}</span>
                      <div style={{ width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#C8431A', borderRadius: 999 }} />
                      </div>
                      <span style={{ color: '#C8431A', fontSize: 12, fontWeight: 'bold', width: 36, textAlign: 'right' }}>{p.nb}</span>
                      <span style={{ color: '#555', fontSize: 11, width: 36 }}>{pct}%</span>
                    </div>
                  )
                })}
                {repartitionPays.length === 0 && <p style={{ color: '#8C5A40', fontSize: 13 }}>Aucune donnée disponible</p>}
              </div>
            </div>

            {/* Actions scrapers */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 16 }}>⚡ Relancer un scraper</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'PredictHQ',      route: '/api/scrape-predicthq'      },
                  { label: 'Ticketmaster',    route: '/api/scrape-ticketmaster'   },
                  { label: 'World Cup',       route: '/api/scrape-worldcup'       },
                  { label: 'Ligue Haïtienne', route: '/api/scrape-liguehaitienne' },
                  { label: 'Eventbrite',          route: '/api/scrape-eventbrite'           },
                ].map(s => (
                  <button
                    key={s.route}
                    disabled={loadingImport}
                    onClick={async () => {
                      setLoadingImport(true)
                      try {
                        const res  = await fetch(s.route, { headers: { 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '' } })
                        const data = await res.json()
                        alert(`✅ ${s.label} : ${data.imported || 0} importés · ${data.skipped || 0} ignorés`)
                        chargerDonnees()
                      } catch {
                        alert(`❌ Erreur lors du scraping ${s.label}`)
                      }
                      setLoadingImport(false)
                    }}
                    style={{
                      background: loadingImport ? 'rgba(255,255,255,0.04)' : 'rgba(200,67,26,0.15)',
                      color: loadingImport ? '#555' : '#C8431A',
                      border: '1px solid rgba(200,67,26,0.3)',
                      borderRadius: 8, padding: '8px 16px',
                      fontSize: 13, fontWeight: 'bold',
                      cursor: loadingImport ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loadingImport ? '⏳' : '▶️'} {s.label}
                  </button>
                ))}
                <button
                  disabled={loadingBelgium}
                  onClick={async () => {
                    setLoadingBelgium(true)
                    try {
                      const res  = await fetch('/api/import-eventbrite-belgium', { headers: hiAuth() })
                      const data = await res.json()
                      alert(`✅ Eventbrite Belgique : ${data.imported || 0} importés · ${data.skipped || 0} ignorés`)
                      chargerDonnees()
                    } catch {
                      alert('❌ Erreur lors du scraping Eventbrite Belgique')
                    }
                    setLoadingBelgium(false)
                  }}
                  style={{
                    background: loadingBelgium ? 'rgba(255,255,255,0.04)' : 'rgba(200,67,26,0.15)',
                    color: loadingBelgium ? '#555' : '#C8431A',
                    border: '1px solid rgba(200,67,26,0.3)',
                    borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 'bold',
                    cursor: loadingBelgium ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingBelgium ? '⏳' : '▶️'} Eventbrite Belgique
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ONGLET UTILISATEURS — F2
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'utilisateurs' && (() => {
          const ROLES: FiltreRole[] = ['tous', 'membre', 'contributeur', 'contributeur_terrain', 'organisateur', 'ambassadeur', 'admin', 'admin_enqueteur']

          const couleurRole = (r: string): { bg: string; color: string } => {
            if (r === 'admin')                return { bg: 'rgba(229,115,115,0.15)', color: '#e57373' }
            if (r === 'admin_enqueteur')      return { bg: 'rgba(139,69,19,0.15)',   color: '#8B4513' }
            if (r === 'ambassadeur')          return { bg: 'rgba(45,158,107,0.15)',  color: '#2D9E6B' }
            if (r === 'organisateur')         return { bg: 'rgba(200,67,26,0.15)',   color: '#C8431A' }
            if (r === 'contributeur_terrain') return { bg: 'rgba(200,160,32,0.18)',  color: '#C8A020' }
            if (r === 'contributeur')         return { bg: 'rgba(212,168,32,0.15)',  color: '#D4A820' }
            // 'visiteur' traité comme 'membre' (migration en attente)
            return                                   { bg: 'rgba(74,144,217,0.15)',  color: '#4A90D9' }
          }

          // Normalise 'visiteur' → 'membre' pour l'affichage tant que la migration SQL n'est pas exécutée
          const normaliserRole = (r: string) => r === 'visiteur' ? 'membre' : r

          const initiales = (u: UserAdmin) => {
            const src = u.nom || u.email
            return src.split(/[\s@]/)[0].slice(0, 2).toUpperCase()
          }

          const isSuspendu = (u: UserAdmin) => !!u.banned_until && new Date(u.banned_until) > new Date()

          const usersFiltres = users.filter(u => {
            const ROLES_CONTRIB = ['contributeur', 'contributeur_terrain', 'organisateur', 'ambassadeur', 'admin']
            if (filtreRole === 'contributeur' && !ROLES_CONTRIB.includes(normaliserRole(u.role))) return false
            if (filtreRole !== 'tous' && filtreRole !== 'membre' && filtreRole !== 'contributeur' && normaliserRole(u.role) !== filtreRole) return false
            if (filtreStatutUser === 'actif'     &&  isSuspendu(u)) return false
            if (filtreStatutUser === 'suspendu'  && !isSuspendu(u)) return false
            if (rechercheUser) {
              const q = rechercheUser.toLowerCase()
              if (!u.email.toLowerCase().includes(q) && !(u.nom || '').toLowerCase().includes(q)) return false
            }
            return true
          })

          // Stats — normalise visiteur→membre, fallback sur parRole si users pas encore chargé
          const statsRoles: Record<string, number> = users.length > 0
            ? users.reduce((acc, u) => {
                const r = normaliserRole(u.role)
                acc[r] = (acc[r] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            : Object.entries(parRole).reduce((acc, [r, n]) => {
                const rn = normaliserRole(r)
                acc[rn] = (acc[rn] || 0) + n
                return acc
              }, {} as Record<string, number>)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Membres',         valeur: users.length > 0 ? users.length : countMembres,                                                                                                                              couleur: '#1A1410' },
                  { label: 'Contributeurs',   valeur: (statsRoles['contributeur'] || 0) + (statsRoles['contributeur_terrain'] || 0) + (statsRoles['organisateur'] || 0) + (statsRoles['ambassadeur'] || 0) + (statsRoles['admin'] || 0), couleur: '#D4A820' },
                  { label: '· dont terrain',  valeur: statsRoles['contributeur_terrain'] || 0,                                      couleur: '#C8A020' },
                  { label: 'Organisateurs',   valeur: statsRoles['organisateur'] || 0,                                              couleur: '#C8431A' },
                  { label: 'Ambassadeurs',    valeur: statsRoles['ambassadeur']  || 0,                                              couleur: '#2D9E6B' },
                  { label: 'Admins',          valeur: statsRoles['admin']        || 0,                                              couleur: '#e57373' },
                  { label: 'Admin enq.',      valeur: statsRoles['admin_enqueteur'] || 0,                                           couleur: '#8B4513' },
                ].map((c, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 'bold', color: c.couleur, marginBottom: 3 }}>{c.valeur}</p>
                    <p style={{ fontSize: 10, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
                  </div>
                ))}
              </div>

              {loadingUsers ? (
                <p style={{ color: '#8C5A40', textAlign: 'center', padding: 40, fontStyle: 'italic' }}>Chargement des utilisateurs…</p>
              ) : (
                <>
                  {/* Filtres */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Filtre rôle */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rôle :</span>
                      {ROLES.map(r => (
                        <button
                          key={r}
                          onClick={() => setFiltreRole(r)}
                          style={{
                            padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 'bold',
                            border: 'none', cursor: 'pointer',
                            background: filtreRole === r ? '#C8431A' : 'rgba(255,255,255,0.06)',
                            color:      filtreRole === r ? 'white'   : '#8C5A40',
                            textTransform: 'capitalize',
                          }}
                        >
                          {r === 'tous' ? 'Tous' : r === 'contributeur_terrain' ? 'terrain' : r === 'admin_enqueteur' ? 'admin enq.' : r}
                        </button>
                      ))}
                    </div>

                    {/* Filtre statut + recherche */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut :</span>
                      {(['tous', 'actif', 'suspendu'] as FiltreStatutUser[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setFiltreStatutUser(s)}
                          style={{
                            padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 'bold',
                            border: 'none', cursor: 'pointer',
                            background: filtreStatutUser === s ? '#C8431A' : 'rgba(255,255,255,0.06)',
                            color:      filtreStatutUser === s ? 'white'   : '#8C5A40',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s === 'tous' ? 'Tous' : s === 'actif' ? '✓ Actif' : '⛔ Suspendu'}
                        </button>
                      ))}
                      <input
                        type="text"
                        placeholder="Rechercher nom ou email…"
                        value={rechercheUser}
                        onChange={e => setRechercheUser(e.target.value)}
                        style={{
                          flex: 1, minWidth: 180,
                          background: 'rgba(255,255,255,0.06)', border: '1px solid #333',
                          borderRadius: 999, padding: '5px 14px', fontSize: 12,
                          color: '#1A1410', outline: 'none',
                        }}
                      />
                    </div>
                    <p style={{ color: '#555', fontSize: 11 }}>{usersFiltres.length} utilisateur{usersFiltres.length !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Tableau */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                            {['Utilisateur', 'Rôle', 'Inscription', 'Événements', 'Dernière co.', 'Statut', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {usersFiltres.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#8C5A40', fontSize: 13 }}>Aucun utilisateur trouvé</td></tr>
                          )}
                          {usersFiltres.map(u => {
                            const rc    = couleurRole(u.role)
                            const susp  = isSuspendu(u)
                            const busy  = changingRole === u.id
                            return (
                              <tr key={u.id} style={{ borderBottom: '1px solid rgba(42,42,42,0.5)', opacity: susp ? 0.65 : 1 }}>

                                {/* Avatar + nom + email */}
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                      background: rc.bg, color: rc.color,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 12, fontWeight: 'bold',
                                    }}>
                                      {initiales(u)}
                                    </div>
                                    <div style={{ minWidth: 0 }} title={u.email}>
                                      <p style={{ color: '#1A1410', fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                        {u.nom || u.email.split('@')[0]}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Rôle (select) */}
                                <td style={{ padding: '10px 12px' }}>
                                  <select
                                    value={normaliserRole(u.role)}
                                    disabled={busy}
                                    onChange={e => changerRole(u.id, e.target.value)}
                                    style={{
                                      background: rc.bg, color: rc.color,
                                      border: 'none', borderRadius: 6, padding: '3px 8px',
                                      fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
                                      textTransform: 'capitalize', outline: 'none',
                                    }}
                                  >
                                    {['membre', 'contributeur', 'contributeur_terrain', 'organisateur', 'ambassadeur', 'admin', 'admin_enqueteur'].map(r => (
                                      <option key={r} value={r}>{r === 'contributeur_terrain' ? 'terrain' : r === 'admin_enqueteur' ? 'admin enquêteur' : r}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Date inscription */}
                                <td style={{ padding: '10px 12px', color: '#8C5A40', fontSize: 11, whiteSpace: 'nowrap' }}>
                                  {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                </td>

                                {/* Événements soumis / approuvés */}
                                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                  <span style={{ color: '#1A1410', fontSize: 12, fontWeight: 'bold' }}>{u.nb_soumis}</span>
                                  <span style={{ color: '#8C5A40', fontSize: 11 }}> / </span>
                                  <span style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold' }}>{u.nb_approuves}</span>
                                </td>

                                {/* Dernière connexion */}
                                <td style={{ padding: '10px 12px', color: '#8C5A40', fontSize: 11, whiteSpace: 'nowrap' }}>
                                  {u.last_sign_in_at
                                    ? new Date(u.last_sign_in_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                    : '—'}
                                </td>

                                {/* Statut */}
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{
                                    background: susp ? 'rgba(229,115,115,0.15)' : 'rgba(45,158,107,0.12)',
                                    color:      susp ? '#e57373'                : '#2D9E6B',
                                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap',
                                  }}>
                                    {susp ? '⛔ Suspendu' : '✓ Actif'}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                    <a
                                      href={`/profil?id=${u.id}`}
                                      target="_blank"
                                      style={{ background: 'rgba(255,255,255,0.06)', color: '#1A1410', padding: '4px 10px', borderRadius: 6, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}
                                    >
                                      Voir
                                    </a>
                                    {(() => {
                                      const inv = inviteStates[u.id] || 'idle'
                                      const invLabel = inv === 'loading' ? '…' : inv === 'copied' ? '✓ Copié' : inv === 'error' ? '✗ Erreur' : '✉️ Inviter'
                                      return (
                                        <button
                                          onClick={() => genererInvitation(u.id, u.email)}
                                          disabled={inv === 'loading' || busy}
                                          style={{
                                            background: inv === 'copied' ? 'rgba(45,158,107,0.15)' : inv === 'error' ? 'rgba(229,115,115,0.15)' : 'rgba(200,67,26,0.12)',
                                            color:      inv === 'copied' ? '#2D9E6B'                : inv === 'error' ? '#e57373'                : '#C8431A',
                                            border: 'none', borderRadius: 6, padding: '4px 10px',
                                            fontSize: 11, cursor: (inv === 'loading' || busy) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                            transition: 'background 0.2s, color 0.2s',
                                          }}
                                        >
                                          {invLabel}
                                        </button>
                                      )
                                    })()}
                                    <button
                                      onClick={() => toggleSuspendre(u)}
                                      disabled={busy}
                                      style={{
                                        background: susp ? 'rgba(45,158,107,0.12)' : 'rgba(229,115,115,0.15)',
                                        color:      susp ? '#2D9E6B'               : '#e57373',
                                        border: 'none', borderRadius: 6, padding: '4px 10px',
                                        fontSize: 11, cursor: busy ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {busy ? '…' : susp ? 'Réactiver' : 'Suspendre'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })()}

      {/* ── Modal géo — Villes / Pays / Régions ─────────────────────── */}
      {modalGeo && (
        <div
          onClick={() => setModalGeo(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#F7F2E8', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E8E0D0', flexShrink: 0 }}>
              <div>
                <h3 style={{ color: '#1A1410', fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>
                  {modalGeo === 'villes' ? '🏙️ Villes' : modalGeo === 'pays' ? '🌍 Pays' : '🗺️ Régions'}
                </h3>
                <p style={{ color: '#8C5A40', fontSize: 11 }}>
                  {modalGeo === 'villes'   ? `${repartitionVilles.length} villes · événements approuvés`
                   : modalGeo === 'pays'   ? `${repartitionPays.length} pays · événements approuvés`
                   : `${repartitionRegions.length} région${repartitionRegions.length > 1 ? 's' : ''} · par longitude`}
                </p>
              </div>
              <button onClick={() => setModalGeo(null)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>✕</button>
            </div>

            {/* Carte bubbles — villes uniquement */}
            {modalGeo === 'villes' && <CarteVillesMap villes={repartitionVilles} />}

            {/* Liste */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 24px' }}>
              {(modalGeo === 'villes' ? repartitionVilles.map((v, i) => ({ nom: v.ville, nb: v.nb, i }))
                : modalGeo === 'pays' ? repartitionPays.map((p, i) => ({ nom: (DRAPEAUX_PAYS[p.pays] ? DRAPEAUX_PAYS[p.pays] + ' ' : '') + p.pays, nb: p.nb, i }))
                : repartitionRegions.map((r, i) => ({ nom: r.region, nb: r.nb, i }))
              ).map(({ nom, nb, i }) => {
                const liste = modalGeo === 'villes' ? repartitionVilles : modalGeo === 'pays' ? repartitionPays : repartitionRegions
                const maxNb = (liste[0] as { nb: number })?.nb || 1
                const pct   = Math.round((nb / maxNb) * 100)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #E8E0D0' }}>
                    <span style={{ color: '#8C5A40', fontSize: 11, width: 22, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#1A1410', fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
                    <div style={{ width: 80, background: '#E8E0D0', borderRadius: 999, height: 5, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#C8431A', borderRadius: 999 }} />
                    </div>
                    <span style={{ color: '#C8431A', fontSize: 12, fontWeight: 'bold', width: 32, textAlign: 'right', flexShrink: 0 }}>{nb}</span>
                  </div>
                )
              })}
              {((modalGeo === 'villes' && repartitionVilles.length === 0)
                || (modalGeo === 'pays' && repartitionPays.length === 0)
                || (modalGeo === 'regions' && repartitionRegions.length === 0)) && (
                <p style={{ color: '#8C5A40', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ── F5 — Modal raison de rejet ───────────────────────────────── */}
      {modalRejet && (
        <div
          onClick={() => setModalRejet(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1A1410', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 560, padding: '24px 20px 32px' }}
          >
            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ color: '#F7F2E8', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>Rejeter l'événement</h3>
                <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.4, maxWidth: 360 }}>{modalRejet.titre}</p>
              </div>
              <button
                onClick={() => setModalRejet(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8C5A40', borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >✕</button>
            </div>

            {/* Raison — liste déroulante */}
            <p style={{ color: '#8C5A40', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Raison du rejet <span style={{ color: '#C8431A' }}>*</span></p>
            <select
              value={raisonRejet}
              onChange={e => setRaisonRejet(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: raisonRejet ? '#F7F2E8' : '#8C5A40', border: '1px solid #2a2a2a', borderRadius: 10, padding: '11px 14px', fontSize: 14, cursor: 'pointer', outline: 'none', marginBottom: 12, appearance: 'none' as const }}
            >
              <option value="" disabled>Sélectionner une raison…</option>
              <option value="Informations incorrectes ou incomplètes">Informations incorrectes ou incomplètes</option>
              <option value="Contenu inapproprié ou non conforme aux CGU">Contenu inapproprié ou non conforme aux CGU</option>
              <option value="Événement déjà passé">Événement déjà passé</option>
              <option value="Doublon d'un événement existant">Doublon d'un événement existant</option>
              <option value="Image non conforme">Image non conforme</option>
              <option value="Événement annulé">Événement annulé</option>
              <option value="Lieu introuvable ou invalide">Lieu introuvable ou invalide</option>
              <option value="Autre">Autre (préciser)</option>
            </select>

            {/* Champ libre si "Autre" */}
            {raisonRejet === 'Autre' && (
              <textarea
                value={raisonAutre}
                onChange={e => setRaisonAutre(e.target.value)}
                placeholder="Précise la raison…"
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: '#F7F2E8', border: '1px solid #2a2a2a', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'none', marginBottom: 12, boxSizing: 'border-box' as const }}
              />
            )}

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setModalRejet(null)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#8C5A40', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmerRejet}
                disabled={loadingRejet || !raisonRejet || (raisonRejet === 'Autre' && !raisonAutre.trim())}
                style={{ flex: 2, background: (!raisonRejet || (raisonRejet === 'Autre' && !raisonAutre.trim())) ? '#2a2a2a' : '#C8431A', color: (!raisonRejet || (raisonRejet === 'Autre' && !raisonAutre.trim())) ? '#8C5A40' : 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, cursor: loadingRejet || !raisonRejet ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {loadingRejet ? 'Rejet en cours…' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}