'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { normaliserVille, normaliserPays } from '../../lib/normalisation'
import { track } from '../../lib/amplitude'

import dynamicImport from 'next/dynamic'
const CarteBadge = dynamicImport(() => import('../../components/CarteBadge'), { ssr: false })
import { attributerPoints } from '../../lib/points'

// ── Système de badges ─────────────────────────────────────────────────────────
const BADGES_CONTRIBUTEUR = [
  { id: 'decouvreur',       emoji: '🌱', label: 'Découvreur',       seuil: 1,   desc: '1re contribution' },
  { id: 'actif',            emoji: '🔥', label: 'Actif',            seuil: 5,   desc: '5 contributions' },
  { id: 'contributeur',     emoji: '⭐', label: 'Contributeur',     seuil: 10,  desc: '10 contributions' },
  { id: 'top_contributeur', emoji: '🏅', label: 'Top Contributeur', seuil: 25,  desc: '25 contributions' },
  { id: 'elite',            emoji: '🥇', label: 'Élite',            seuil: 50,  desc: '50 contributions' },
  { id: 'legende',          emoji: '👑', label: 'Légende LOTBO',    seuil: 100, desc: '100 contributions' },
]

const BADGES_ORGANISATEUR = [
  { id: 'organisateur', emoji: '🎪', label: 'Organisateur', seuil: 1,  desc: '1er événement' },
  { id: 'regulier',     emoji: '📅', label: 'Régulier',     seuil: 3,  desc: '3 événements' },
  { id: 'premium',      emoji: '💎', label: 'Premium',      seuil: 10, desc: '10 événements' },
  { id: 'vedette',      emoji: '🌟', label: 'Vedette',      seuil: 25, desc: '25 événements' },
  { id: 'champion',     emoji: '🏆', label: 'Champion',     seuil: 50, desc: '50 événements' },
]

type Badge = { id: string; emoji: string; label: string; seuil: number; desc: string }

function getBadgeActuel(nb: number, badges: Badge[]): Badge | null {
  const obtenus = badges.filter(b => nb >= b.seuil)
  return obtenus[obtenus.length - 1] || null
}

function detecterNouveauBadge(avant: number, apres: number, badges: Badge[]): Badge | null {
  const badgeAvant = getBadgeActuel(avant, badges)
  const badgeApres = getBadgeActuel(apres, badges)
  if (!badgeApres) return null
  if (!badgeAvant) return badgeApres
  if (badgeApres.id !== badgeAvant.id) return badgeApres
  return null
}

// ── Traductions F10 ───────────────────────────────────────────────────────────
const T_IMAGE = {
  fr: {
    titre:             'Votre événement serait plus beau avec une image.',
    stat:              'Les événements avec photo attirent 3× plus de visiteurs.',
    suggestions:       'Choisissez parmi nos suggestions :',
    ajouter:           '+ Ajouter ma propre image',
    continuer:         'Continuer sans image →',
    credit:            'Photo par',
    chargement:        'Chargement des suggestions…',
    selectionnee:      '✓ Image sélectionnée',
    scanAffiche:       '📸 Scanner ou importer une affiche',
    scanAnalyse:       '📸 Analyse en cours...',
    scanVerifier:      'Vérifie et complète les informations avant de publier',
    scanErreurLecture: "On n'a pas pu lire l'affiche. Tu peux remplir le formulaire manuellement.",
    scanErreurService: 'Service temporairement indisponible. Réessaie dans quelques instants.',
  },
  en: {
    titre:             'Your event would look even better with a photo.',
    stat:              'Events with photos attract 3× more visitors.',
    suggestions:       'Choose from our suggestions:',
    ajouter:           '+ Add my own image',
    continuer:         'Continue without image →',
    credit:            'Photo by',
    chargement:        'Loading suggestions…',
    selectionnee:      '✓ Image selected',
    scanAffiche:       '📸 Scan or import a poster',
    scanAnalyse:       '📸 Analyzing...',
    scanVerifier:      'Check and complete the information before publishing',
    scanErreurLecture: "We couldn't read the poster. You can fill in the form manually.",
    scanErreurService: 'Service temporarily unavailable. Please try again in a moment.',
  },
  es: {
    titre:             'Tu evento se vería mucho mejor con una imagen.',
    stat:              'Los eventos con foto atraen 3× más visitantes.',
    suggestions:       'Elige entre nuestras sugerencias:',
    ajouter:           '+ Agregar mi propia imagen',
    continuer:         'Continuar sin imagen →',
    credit:            'Foto por',
    chargement:        'Cargando sugerencias…',
    selectionnee:      '✓ Imagen seleccionada',
    scanAffiche:       '📸 Escanear o importar un cartel',
    scanAnalyse:       '📸 Analizando...',
    scanVerifier:      'Verifica y completa la información antes de publicar',
    scanErreurLecture: 'No pudimos leer el cartel. Puedes rellenar el formulario manualmente.',
    scanErreurService: 'Servicio temporalmente no disponible. Inténtalo de nuevo en un momento.',
  },
  pt: {
    titre:             'O seu evento ficaria ainda mais bonito com uma imagem.',
    stat:              'Eventos com foto atraem 3× mais visitantes.',
    suggestions:       'Escolha entre as nossas sugestões:',
    ajouter:           '+ Adicionar minha própria imagem',
    continuer:         'Continuar sem imagem →',
    credit:            'Foto por',
    chargement:        'A carregar sugestões…',
    selectionnee:      '✓ Imagem selecionada',
    scanAffiche:       '📸 Escanear ou importar um cartaz',
    scanAnalyse:       '📸 A analisar...',
    scanVerifier:      'Verifique e complete as informações antes de publicar',
    scanErreurLecture: 'Não conseguimos ler o cartaz. Pode preencher o formulário manualmente.',
    scanErreurService: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  },
  ht: {
    titre:             'Evènman ou a ta pi bèl ak yon imaj.',
    stat:              'Evènman ki gen foto jwenn 3× plis vizitè.',
    suggestions:       'Chwazi youn nan sijèsyon nou yo:',
    ajouter:           '+ Ajoute pwòp imaj ou',
    continuer:         'Kontinye san imaj →',
    credit:            'Foto pa',
    chargement:        'Ap chaje sijèsyon…',
    selectionnee:      '✓ Imaj chwazi',
    scanAffiche:       '📸 Skane oswa enpòte yon afich',
    scanAnalyse:       '📸 Ap analize...',
    scanVerifier:      'Verifye epi konplete enfòmasyon yo anvan ou pibliye',
    scanErreurLecture: 'Nou pa t kapab li afich la. Ou ka ranpli fòmilè a manyèlman.',
    scanErreurService: 'Sèvis la pa disponib kounye a. Eseye ankò nan kèk segond.',
  },
}

type Locale = keyof typeof T_IMAGE

// ── Types ─────────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 1,  nom: 'Conférence / Sommet',          icone: '🎤' },
  { id: 2,  nom: 'Concert / Spectacle',           icone: '🎶' },
  { id: 3,  nom: 'Foire / Exposition',            icone: '🏪' },
  { id: 4,  nom: 'Culte / Cérémonie religieuse',  icone: '⛪' },
  { id: 5,  nom: 'Festival',                      icone: '🎉' },
  { id: 6,  nom: 'Tournoi / Compétition',         icone: '🏆' },
  { id: 7,  nom: 'Inauguration / Lancement',      icone: '🎊' },
  { id: 8,  nom: 'Assemblée / Réunion',           icone: '🤝' },
  { id: 9,  nom: 'Formation / Séminaire',         icone: '📚' },
  { id: 10, nom: 'Célébration communautaire',     icone: '🌍' },
  { id: 11, nom: 'Droit / Juridique',             icone: '⚖️' },
  { id: 12, nom: 'Loisir',                        icone: '🎯' },
]

const EVENT_THEMES = [
  { id: 1,  nom: 'Religion',      icone: '✝️' },
  { id: 2,  nom: 'Politique',     icone: '🏛️' },
  { id: 3,  nom: 'Business',      icone: '💼' },
  { id: 4,  nom: 'Culture',       icone: '🎭' },
  { id: 5,  nom: 'Gastronomie',   icone: '🍽️' },
  { id: 6,  nom: 'Littérature',   icone: '📖' },
  { id: 7,  nom: 'Art',           icone: '🎨' },
  { id: 8,  nom: 'Artisanat',     icone: '🪡' },
  { id: 9,  nom: 'Sport',         icone: '⚽' },
  { id: 10, nom: 'Technologie',   icone: '💻' },
  { id: 11, nom: 'Éducation',     icone: '🎓' },
  { id: 12, nom: 'Social',        icone: '👥' },
  { id: 13, nom: 'Musique',       icone: '🎵' },
  { id: 14, nom: 'Cinéma',        icone: '🎬' },
  { id: 15, nom: 'Mode',          icone: '👗' },
  { id: 16, nom: 'Santé',         icone: '❤️' },
  { id: 17, nom: 'Environnement', icone: '🌿' },
]

const FUSEAUX = [
  { value: 'America/Port-au-Prince',         label: '🇭🇹 Haïti' },
  { value: 'America/Guadeloupe',             label: '🇬🇵 Guadeloupe / Martinique' },
  { value: 'America/Santo_Domingo',          label: '🇩🇴 République Dominicaine' },
  { value: 'America/Jamaica',                label: '🇯🇲 Jamaïque' },
  { value: 'America/Havana',                 label: '🇨🇺 Cuba' },
  { value: 'America/Puerto_Rico',            label: '🇵🇷 Porto Rico' },
  { value: 'America/New_York',               label: '🇺🇸 New York / Miami / Boston' },
  { value: 'America/Chicago',                label: '🇺🇸 Chicago / Houston' },
  { value: 'America/Denver',                 label: '🇺🇸 Denver / Phoenix' },
  { value: 'America/Los_Angeles',            label: '🇺🇸 Los Angeles / San Francisco' },
  { value: 'America/Montreal',               label: '🇨🇦 Montréal / Québec' },
  { value: 'America/Toronto',               label: '🇨🇦 Toronto / Ottawa' },
  { value: 'America/Vancouver',              label: '🇨🇦 Vancouver' },
  { value: 'America/Mexico_City',            label: '🇲🇽 Mexique' },
  { value: 'America/Bogota',                 label: '🇨🇴 Colombie' },
  { value: 'America/Lima',                   label: '🇵🇪 Pérou' },
  { value: 'America/Santiago',               label: '🇨🇱 Chili' },
  { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷 Argentine' },
  { value: 'America/Sao_Paulo',              label: '🇧🇷 Brésil (São Paulo)' },
  { value: 'Europe/London',                  label: '🇬🇧 Londres' },
  { value: 'Europe/Paris',                   label: '🇫🇷 Paris / Bruxelles / Genève' },
  { value: 'Europe/Berlin',                  label: '🇩🇪 Berlin / Amsterdam / Rome' },
  { value: 'Europe/Madrid',                  label: '🇪🇸 Madrid / Barcelone' },
  { value: 'Europe/Lisbon',                  label: '🇵🇹 Lisbonne' },
  { value: 'Europe/Moscow',                  label: '🇷🇺 Moscou' },
  { value: 'Africa/Abidjan',                 label: "🇨🇮 Côte d'Ivoire / Sénégal / Mali" },
  { value: 'Africa/Lagos',                   label: '🇳🇬 Nigeria / Cameroun / Gabon' },
  { value: 'Africa/Kinshasa',                label: '🇨🇩 Congo / RDC' },
  { value: 'Africa/Nairobi',                 label: '🇰🇪 Kenya / Éthiopie / Tanzanie' },
  { value: 'Africa/Casablanca',              label: '🇲🇦 Maroc' },
  { value: 'Africa/Cairo',                   label: '🇪🇬 Égypte' },
  { value: 'Indian/Reunion',                 label: '🇷🇪 La Réunion / Maurice' },
  { value: 'Asia/Beirut',                    label: '🇱🇧 Liban' },
  { value: 'Asia/Riyadh',                    label: '🇸🇦 Arabie Saoudite / Koweït' },
  { value: 'Asia/Dubai',                     label: '🇦🇪 Dubaï / EAU' },
  { value: 'Asia/Tehran',                    label: '🇮🇷 Iran' },
  { value: 'Asia/Karachi',                   label: '🇵🇰 Pakistan' },
  { value: 'Asia/Kolkata',                   label: '🇮🇳 Inde' },
  { value: 'Asia/Dhaka',                     label: '🇧🇩 Bangladesh' },
  { value: 'Asia/Bangkok',                   label: '🇹🇭 Thaïlande / Vietnam / Cambodge' },
  { value: 'Asia/Singapore',                 label: '🇸🇬 Singapour / Malaisie / Philippines' },
  { value: 'Asia/Jakarta',                   label: '🇮🇩 Indonésie' },
  { value: 'Asia/Shanghai',                  label: '🇨🇳 Chine / Hong Kong / Taïwan' },
  { value: 'Asia/Seoul',                     label: '🇰🇷 Corée du Sud' },
  { value: 'Asia/Tokyo',                     label: '🇯🇵 Japon' },
  { value: 'Australia/Sydney',               label: '🇦🇺 Australie (Sydney)' },
  { value: 'Pacific/Auckland',               label: '🇳🇿 Nouvelle-Zélande' },
  { value: 'Pacific/Honolulu',               label: '🇺🇸 Hawaï' },
  { value: 'UTC',                            label: '🌍 UTC — événement international / en ligne' },
]

const VISIBILITES = [
  { value: 'public',  label: '🌍 Public',  description: 'Visible sur la carte pour tout le monde',                        color: '#2D9E6B', bg: 'rgba(45,158,107,0.12)',  border: 'rgba(45,158,107,0.4)'  },
  { value: 'discret', label: '🔒 Discret', description: 'Pin visible sur la carte — adresse révélée avec un code',       color: '#D4A820', bg: 'rgba(212,168,32,0.12)', border: 'rgba(212,168,32,0.4)' },
  { value: 'prive',   label: '🫧 Privé',   description: 'Invisible sur la carte — accessible uniquement via lien secret', color: '#C8431A', bg: 'rgba(200,67,26,0.12)',  border: 'rgba(200,67,26,0.4)'  },
]

const inputStyle = {
  background: 'white', border: '1px solid #E8E0D0', borderRadius: 10,
  padding: '12px 16px', color: '#1A1410', fontSize: 14, outline: 'none',
  width: '100%', colorScheme: 'light' as const,
}
const labelStyle = { color: '#8C5A40', fontSize: 12, marginBottom: 4 }

interface Suggestion {
  place_name: string
  center: [number, number]
  text: string
  context?: { id: string; text: string }[]
  place_id?: string
}

interface Coords {
  longitude: number
  latitude: number
  adresse: string
}

interface UnsplashPhoto {
  url: string
  thumb: string
  author: string
  authorLink: string
}

interface SuccesData {
  lienSecret?: string
  codeAcces?: string
  visibilite?: string
  role?: string
  nbContributions?: number
  evenementId?: string
  nouveauBadge?: Badge
}

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#C8431A', '#D4A820', '#2D9E6B', '#F7F2E8', '#E8620A']

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i)
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(i => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const left  = `${Math.random() * 100}%`
        const delay = `${Math.random() * 1.5}s`
        const dur   = `${2 + Math.random() * 2}s`
        const size  = `${6 + Math.random() * 8}px`
        const shape = i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px'
        return (
          <div key={i} style={{ position: 'absolute', top: 0, left, width: size, height: size, background: color, borderRadius: shape, animation: `confetti-fall ${dur} ${delay} ease-in forwards` }} />
        )
      })}
    </div>
  )
}

// ── Popup badge ───────────────────────────────────────────────────────────────
function PopupBadge({ badge, nbContributions, role, onContinuer, onCreerCarte }: {
  badge: Badge; nbContributions: number; role: string; onContinuer: () => void; onCreerCarte: () => void
})
{
  const isContrib = role === 'contributeur'
  const ordinal   = nbContributions === 1 ? '1ère' : `${nbContributions}e`
  return (
    <>
      <Confetti />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(26,20,16,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <style>{`
          @keyframes popIn     { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }
          @keyframes badgePulse { 0%,100% { transform: scale(1) rotate(-3deg) } 50% { transform: scale(1.08) rotate(3deg) } }
        `}</style>
        <div style={{ background: '#1A1410', border: '1px solid rgba(212,168,32,0.4)', borderRadius: 24, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)', boxShadow: '0 0 60px rgba(212,168,32,0.15)' }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16, display: 'inline-block', animation: 'badgePulse 1.5s ease-in-out infinite' }}>{badge.emoji}</div>
          <p style={{ color: '#D4A820', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>🏅 Badge débloqué !</p>
          <h2 style={{ color: '#F7F2E8', fontSize: 26, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', marginBottom: 8 }}>{badge.label}</h2>
          <p style={{ color: '#8C5A40', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {isContrib ? `Félicitations ! Tu viens d'atteindre ta ${ordinal} contribution sur LOTBO !` : `Félicitations ! Tu viens de soumettre ton ${ordinal} événement sur LOTBO !`}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <span style={{ background: 'rgba(212,168,32,0.15)', border: '1px solid rgba(212,168,32,0.4)', color: '#D4A820', padding: '6px 18px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>
              {badge.emoji} {badge.label} · {badge.desc}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={onContinuer} style={{ background: '#C8431A', color: '#F7F2E8', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Voir mes badges →</button>
            <button onClick={onCreerCarte} style={{ background: 'rgba(247,242,232,0.1)', color: '#F7F2E8', border: '1px solid rgba(247,242,232,0.2)', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: 8 }}>🎨 Créer ma carte badge</button>
            <button onClick={onContinuer} style={{ background: 'transparent', color: '#8C5A40', border: 'none', fontSize: 13, cursor: 'pointer', padding: '6px' }}>Continuer</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── F10 — Bloc incitatif image ────────────────────────────────────────────────
function BlocIncitatiImage({
  locale,
  titre,
  categorie,
  onSelectUnsplash,
  onOwnImage,
  onSkip,
  imageDejaSelectionnee,
}: {
  locale: Locale
  titre: string
  categorie: string
  onSelectUnsplash: (photo: UnsplashPhoto) => void
  onOwnImage: () => void
  onSkip: () => void
  imageDejaSelectionnee: boolean
}) {
  const t = T_IMAGE[locale]
  const [photos, setPhotos]         = useState<UnsplashPhoto[]>([])
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState<string | null>(null)

  const charger = useCallback(async () => {
    if (!categorie && !titre) return
    setLoading(true)
    try {
      const q   = encodeURIComponent(titre.slice(0, 40))
      const cat = encodeURIComponent(categorie)
      const res = await fetch(`/api/unsplash?q=${q}&categorie=${cat}&count=3`)
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch {
      setPhotos([])
    }
    setLoading(false)
  }, [titre, categorie])

  useEffect(() => { charger() }, [charger])

  if (imageDejaSelectionnee) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(200,67,26,0.06) 0%, rgba(212,168,32,0.06) 100%)',
      border: '1px solid rgba(200,67,26,0.25)',
      borderRadius: 14,
      padding: '20px 18px',
      marginTop: 4,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🖼️</span>
        <div>
          <p style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', lineHeight: 1.4, marginBottom: 3 }}>
            {t.titre}
          </p>
          <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.4 }}>
            {t.stat}
          </p>
        </div>
      </div>

      <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {t.suggestions}
      </p>

      {loading ? (
        <p style={{ color: '#8C5A40', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>{t.chargement}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelected(photo.url)
                onSelectUnsplash(photo)
              }}
              style={{
                position: 'relative',
                padding: 0,
                border: selected === photo.url ? '3px solid #C8431A' : '2px solid transparent',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'none',
                aspectRatio: '16/9',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={photo.thumb}
                alt={`suggestion ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {selected === photo.url && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,67,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>✓</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '3px 6px' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.credit} {photo.author}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <p style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
          {t.selectionnee}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={onOwnImage}
          style={{
            background: '#C8431A',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {t.ajouter}
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: 'transparent',
            color: '#8C5A40',
            border: 'none',
            fontSize: 12,
            cursor: 'pointer',
            padding: '6px',
            textDecoration: 'underline',
          }}
        >
          {t.continuer}
        </button>
      </div>
    </div>
  )
}

// ── Carte interactive ─────────────────────────────────────────────────────────
function CarteInteractive({ coords, onCoordsChange }: {
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
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid #2D9E6B' }}>
      <div ref={mapContainerRef} style={{ height: 220 }} />
      <div style={{ background: '#1A1410', padding: '10px 14px' }}>
        <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 6 }}>📍 Glisse le pin ou clique sur la carte pour ajuster l'emplacement exact</p>
        <p style={{ color: '#2D9E6B', fontSize: 11 }}>{coords.longitude.toFixed(5)}, {coords.latitude.toFixed(5)}</p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AjouterEvenement() {
  const [loading, setLoading]               = useState(false)
  const [succes, setSucces]                 = useState(false)
  const [succesData, setSuccesData]         = useState<SuccesData | null>(null)
  const [showBadgePopup, setShowBadgePopup] = useState(false)
  const [showCarteBadge, setShowCarteBadge] = useState(false)
  const [nomUtilisateur, setNomUtilisateur] = useState('')

  // F10 — image state
  const [image, setImage]                     = useState<File | null>(null)
  const [imageUnsplash, setImageUnsplash]     = useState<UnsplashPhoto | null>(null)
  const [showImageBloc, setShowImageBloc]     = useState(false)
  const [imageBlocIgnore, setImageBlocIgnore] = useState(false)
  const fileInputRef                          = useRef<HTMLInputElement>(null)
  const scanInputRef                          = useRef<HTMLInputElement>(null)
  const [scanLoading, setScanLoading]         = useState(false)
  const [scanMessage, setScanMessage]         = useState<{ type: 'verifier' | 'erreur'; texte: string } | null>(null)
  const imageSectionRef                       = useRef<HTMLDivElement>(null)

  const locale: Locale = (() => {
    if (typeof window === 'undefined') return 'fr'
    const l = navigator.language.slice(0, 2)
    if (l === 'en') return 'en'
    if (l === 'es') return 'es'
    if (l === 'pt') return 'pt'
    if (l === 'ht') return 'ht'
    return 'fr'
  })()

  const [selectedType, setSelectedType]       = useState<number | null>(null)
  const [selectedThemes, setSelectedThemes]   = useState<number[]>([])
  const [multiJours, setMultiJours]           = useState(false)
  const [visibilite, setVisibilite]           = useState<'public' | 'discret' | 'prive'>('public')
  const [codeAcces, setCodeAcces]             = useState('')
  const [soumisEnTantQue, setSoumisEnTantQue] = useState<'organisateur' | 'contributeur'>('contributeur')
  const [aDoubleRole, setADoubleRole]         = useState(false)

  // F8 — Récurrence
  const [estRecurrent, setEstRecurrent]           = useState(false)
  const [typeRecurrence, setTypeRecurrence]       = useState<'quotidien' | 'hebdomadaire' | 'mensuel' | 'annuel'>('hebdomadaire')
  const [joursRecurrence, setJoursRecurrence]     = useState<string[]>([])
  const [finRecurrenceType, setFinRecurrenceType] = useState<'date' | 'occurrences' | 'sans_fin'>('sans_fin')
  const [finRecurrenceDate, setFinRecurrenceDate] = useState('')
  const [finRecurrenceNb, setFinRecurrenceNb]     = useState(10)

  const [suggestions, setSuggestions]         = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [coordsPin, setCoordsPin]             = useState<Coords | null>(null)
  const [pinConfirme, setPinConfirme]         = useState(false)
  const [rechercheTexte, setRechercheTexte]   = useState('')
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    titre: '', organisateur: '', nom_lieu: '', adresse: '', ville: '', pays: '',
    date: '', date_fin: '', heure_debut: '', heure_fin: '',
    fuseau_organisateur: 'America/Port-au-Prince',
    description: '', lien: '', acces: 'public', prix: 'gratuit',
  })

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login?redirect=/ajouter'
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role, charte_acceptee').eq('id', session.user.id).single()
      const { data: raRow1 } = await supabase.from('profiles').select('roles_actifs').eq('id', session.user.id).single()
      const rolesActifs: string[] = (raRow1 as any)?.roles_actifs?.length ? (raRow1 as any).roles_actifs : (profile?.role ? [profile.role] : [])
      const estContrib = rolesActifs.some(r => ['contributeur', 'contributeur_terrain', 'admin', 'ambassadeur'].includes(r))
      if (estContrib && profile?.charte_acceptee) setADoubleRole(true)
    })
  }, [])

  useEffect(() => {
    if (!imageSectionRef.current || imageBlocIgnore || image || imageUnsplash) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowImageBloc(true) },
      { threshold: 0.5 }
    )
    observer.observe(imageSectionRef.current)
    return () => observer.disconnect()
  }, [imageBlocIgnore, image, imageUnsplash])

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanLoading(true)
    setScanMessage(null)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const mimeType = file.type || 'image/jpeg'
        try {
          const res = await fetch('/api/scan-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType }),
          })
          if (!res.ok) throw new Error('service')
          const json = await res.json()
          const d = json.data || {}
          if (Object.keys(d).length === 0) {
            setScanMessage({ type: 'erreur', texte: T_IMAGE[locale].scanErreurLecture || "On n'a pas pu lire l'affiche." })
          } else {
            setForm(f => ({
              ...f,
              titre:       d.titre       || f.titre,
              nom_lieu:    d.lieu        || f.nom_lieu,
              ville:       d.ville       || f.ville,
              pays:        d.pays        || f.pays,
              date:        d.date_debut  || f.date,
              date_fin:    d.date_fin    || f.date_fin,
              heure_debut: d.heure_debut || f.heure_debut,
              heure_fin:   d.heure_fin   || f.heure_fin,
              description: d.description || f.description,
              lien:        d.lien_officiel || f.lien,
              prix:        d.prix        || f.prix,
            }))
            setScanMessage({ type: 'verifier', texte: T_IMAGE[locale].scanVerifier || 'Vérifie et complète les informations avant de publier.' })
          }
        } catch {
          setScanMessage({ type: 'erreur', texte: T_IMAGE[locale].scanErreurService || 'Service temporairement indisponible.' })
        }
        setScanLoading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setScanMessage({ type: 'erreur', texte: T_IMAGE[locale].scanErreurService || 'Service temporairement indisponible.' })
      setScanLoading(false)
    }
    e.target.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRechercheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRechercheTexte(value)
    setPinConfirme(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      const query = `${value}${form.ville ? ', ' + form.ville : ''}${form.pays ? ', ' + form.pays : ''}`
      try {
        const res  = await fetch(`/api/places-autocomplete?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.predictions?.length > 0) {
          setSuggestions(data.predictions.map((p: { description: string; structured_formatting?: { main_text: string }; place_id: string }) => ({
            place_name: p.description,
            text: p.structured_formatting?.main_text || p.description,
            center: [0, 0] as [number, number],
            place_id: p.place_id,
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
    if (suggestion.place_id) {
      try {
        const res  = await fetch(`/api/places-details?place_id=${suggestion.place_id}`)
        const data = await res.json()
        const loc  = data.result?.geometry?.location
        if (loc) {
          const comps     = data.result?.address_components || []
          const villeComp = comps.find((c: { types: string[]; long_name: string }) => c.types.includes('locality') || c.types.includes('administrative_area_level_1'))
          const paysComp  = comps.find((c: { types: string[]; long_name: string }) => c.types.includes('country'))
          if (villeComp && !form.ville) setForm(f => ({ ...f, ville: normaliserVille(villeComp.long_name) }))
          if (paysComp && !form.pays)   setForm(f => ({ ...f, pays: normaliserPays(paysComp.long_name) }))
          setCoordsPin({ longitude: loc.lng, latitude: loc.lat, adresse: suggestion.place_name })
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
        setCoordsPin({ longitude: lng, latitude: lat, adresse: suggestion.place_name })
      }
    } catch {
      // Fallback 3 : OSM Nominatim (gratuit, open source, max 1 req/seconde)
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suggestion.place_name)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'Lotbo/1.0 (https://lotbo.app; contact@lotbo.app)' } }
        )
        const nomData = await nomRes.json()
        if (nomData.length > 0) {
          const { lon, lat, display_name } = nomData[0]
          setCoordsPin({
            longitude: parseFloat(lon),
            latitude: parseFloat(lat),
            adresse: display_name || suggestion.place_name,
          })
        }
      } catch {}
    }
  }

  const toggleTheme = (id: number) => {
    setSelectedThemes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) { alert("Choisis un type d'événement."); return }
    if (multiJours && form.date_fin && form.date_fin < form.date) { alert('La date de fin doit être après la date de début.'); return }
    if (!coordsPin) { alert("Recherche et place le pin sur la carte pour localiser l'événement."); return }
    if (!pinConfirme) { alert("Confirme l'emplacement du pin sur la carte."); return }
    if (visibilite === 'discret' && (!codeAcces || codeAcces.length < 4)) { alert("Le code d'accès doit contenir au moins 4 chiffres."); return }
    if (!form.heure_debut) { alert("L'heure de début est obligatoire."); return }
    setLoading(true)

    let image_url = ''

    if (image) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evenements').upload(`${Date.now()}-${image.name}`, image)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('evenements').getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }
    } else if (imageUnsplash) {
      image_url = imageUnsplash.url
    }

    const { data: { session } } = await supabase.auth.getSession()
    const categorieNom = EVENT_TYPES.find(t => t.id === selectedType)?.nom || ''
    const { data: profile } = await supabase.from('profiles').select('role, charte_acceptee, nom').eq('id', session?.user?.id || '').single()
    if (profile?.nom) setNomUtilisateur(profile.nom)
    const { data: raRow2 } = await supabase.from('profiles').select('roles_actifs').eq('id', session?.user?.id || '').single()
    const rolesActifs: string[] = (raRow2 as any)?.roles_actifs?.length ? (raRow2 as any).roles_actifs : (profile?.role ? [profile.role] : [])
    const estContributeur        = rolesActifs.some(r => ['contributeur', 'contributeur_terrain', 'admin', 'ambassadeur'].includes(r))
    const peutPublierDirectement = rolesActifs.some(r => ['contributeur_terrain', 'admin'].includes(r))
    if (estContributeur && profile?.charte_acceptee) setADoubleRole(true)
    const choix           = soumisEnTantQue
    const statutInsertion = peutPublierDirectement ? 'approuve' : 'en_attente'
    const lieuAffiche     = form.nom_lieu
      ? `${form.nom_lieu}${form.ville ? ', ' + form.ville : ''}`
      : `${form.adresse || form.ville}${form.ville ? ', ' + form.ville : ''}`

    const userId = session?.user?.id || ''
    const { count: nbAvant } = await supabase.from('evenements').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('soumis_en_tant_que', choix)

    const { data: inserted, error } = await supabase.from('evenements').insert([{
      titre: form.titre, organisateur: form.organisateur || null, user_id: session?.user?.id || null,
      nom_lieu: form.nom_lieu || null, adresse: form.adresse || null, lieu: lieuAffiche,
      ville: form.ville, pays: form.pays, date: form.date, date_debut: form.date,
      date_fin: multiJours && form.date_fin ? form.date_fin : null,
      heure_debut: form.heure_debut || null, heure_fin: form.heure_fin || null,
      fuseau_organisateur: form.fuseau_organisateur, categorie: categorieNom,
      event_type_id: selectedType, description: form.description, lien: form.lien,
      longitude: coordsPin.longitude, latitude: coordsPin.latitude,
      acces: form.acces, prix: form.prix, image_url,
      statut: statutInsertion,
      soumis_en_tant_que: soumisEnTantQue,
      visibilite, code_acces: visibilite === 'discret' ? codeAcces : null,
      est_recurrent: estRecurrent,
      recurrence_regle: estRecurrent ? {
        type: typeRecurrence,
        jours: joursRecurrence,
        fin_type: finRecurrenceType,
        fin_date: finRecurrenceType === 'date' ? finRecurrenceDate : null,
        fin_occurrences: finRecurrenceType === 'occurrences' ? finRecurrenceNb : null,
      } : null,
    }]).select('id, lien_secret').single()

    setLoading(false)
    if (error) { alert('Erreur: ' + error.message); return }
    track('event_submitted', { event_id: inserted?.id, titre: form.titre, categorie: categorieNom })

    const { count: nbApres } = await supabase.from('evenements').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('soumis_en_tant_que', choix)
    const avant        = nbAvant || 0
    const apres        = nbApres || 1
    const badges       = choix === 'contributeur' ? BADGES_CONTRIBUTEUR : BADGES_ORGANISATEUR
    const nouveauBadge = detecterNouveauBadge(avant, apres, badges)

    // ── Notif admin (fire & forget) ───────────────────────────────────────────
    fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '' },
      body: JSON.stringify({ titre: form.titre, lieu: lieuAffiche, date: form.date, categorie: categorieNom })
    }).catch(() => {})

    // ── F8 — Générer les occurrences si récurrent ─────────────────────────────
    if (estRecurrent && inserted?.id) {
      fetch('/api/generer-occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '' },
        body: JSON.stringify({ parent_id: inserted.id }),
      }).catch(() => {})
    }

    // ── GM1/GM2 — Points soumission ───────────────────────────────────────────
    // Points attribués uniquement si l'événement est approuvé directement
    // (contributeur avec charte acceptée). Pour les événements en_attente,
    // les points seront attribués par l'admin au moment de l'approbation.
    if (statutInsertion === 'approuve' && userId && inserted?.id) {
      attributerPoints({
        user_id: userId,
        action: 'evenement_approuve',
        evenement_id: inserted.id,
        type_role: choix === 'contributeur' ? 'utilisateur' : 'organisateur',
      })
    }

    // Ajouter 'organisateur' à roles_actifs si soumis en tant qu'organisateur
    if (choix === 'organisateur' && userId && !rolesActifs.includes('organisateur')) {
      supabase.from('profiles').update({
        roles_actifs: [...rolesActifs, 'organisateur'],
        updated_at: new Date().toISOString(),
      }).eq('id', userId).then(() => {})
    }

    // ── ENG3 — Badge débloqué ─────────────────────────────────────────────────
    if (nouveauBadge) {
      // ENG3-C — Push PWA ciblé
      fetch('/api/push-notify-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '' },
        body: JSON.stringify({
          user_id: userId,
          badge_emoji: nouveauBadge.emoji,
          badge_label: nouveauBadge.label,
          badge_desc: nouveauBadge.desc,
        }),
      }).catch(() => {})

      await supabase.from('notifications').insert([{
        user_id: userId,
        type: 'badge_debloque',
        titre: 'Nouveau badge débloqué 🏅',
        message: `Tu as débloqué un nouveau badge sur LOTBO !`,
        lien: '/profil?onglet=badges',
        lu: false,
      }])

      // ENG3-D — Email Brevo
      fetch('/api/notify-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '' },
        body: JSON.stringify({
          email: session?.user?.email,
          nom: session?.user?.user_metadata?.nom || null,
          badge_emoji: nouveauBadge.emoji,
          badge_label: nouveauBadge.label,
          badge_desc: nouveauBadge.desc,
          nb_contributions: apres,
          role: choix,
        }),
      }).catch(() => {})
    }

    setSuccesData({
      lienSecret: inserted?.lien_secret,
      codeAcces: visibilite === 'discret' ? codeAcces : undefined,
      visibilite, role: soumisEnTantQue,
      nbContributions: apres, evenementId: inserted?.id,
      nouveauBadge: nouveauBadge || undefined,
    })
    setSucces(true)
    if (nouveauBadge) setShowBadgePopup(true)
  }

  const handleContinuerApresBadge = () => {
    setShowBadgePopup(false)
    window.location.href = '/profil?onglet=badges'
  }

  // ── Écran succès ──────────────────────────────────────────────────────────
  if (succes) {
    const isContrib = succesData?.role === 'contributeur'
    const nb        = succesData?.nbContributions || 1
    const ordinal   = nb === 1 ? '1ère' : `${nb}e`
    return (
      <main style={{ minHeight: '100dvh', background: '#1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        {showBadgePopup && succesData?.nouveauBadge && (
          <PopupBadge
            badge={succesData.nouveauBadge}
            nbContributions={nb}
            role={succesData.role || 'organisateur'}
            onContinuer={handleContinuerApresBadge}
            onCreerCarte={() => { setShowBadgePopup(false); setShowCarteBadge(true) }}
          />
        )}
        {showCarteBadge && succesData?.nouveauBadge && (
          <CarteBadge
            badge={succesData.nouveauBadge}
            nom={nomUtilisateur || 'LOTBO'}
            onClose={() => setShowCarteBadge(false)}
          />
        )}

        <div style={{ maxWidth: 480, width: '100%' }}>
          <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 20 }}>{isContrib ? '⭐' : '🎪'}</div>
          <h2 style={{ color: '#F7F2E8', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
            {isContrib ? `Félicitations pour ta ${ordinal} contribution !` : `Événement soumis avec succès !`}
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: '#F7F2E8', fontSize: 14, lineHeight: 1.7 }}>
              {isContrib ? `Tu viens de contribuer à un projet communautaire mondial né en Haïti. Chaque événement ajouté connecte des gens autour de moments qui comptent. Continue comme ça — la communauté te voit ! 🌍` : `Ton événement est en cours de validation par notre équipe. Tu seras notifié dès qu'il sera approuvé et visible sur la carte. Merci de faire vibrer ta communauté ! 🎉`}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <span style={{ background: isContrib ? 'rgba(212,168,32,0.15)' : 'rgba(200,67,26,0.15)', color: isContrib ? '#D4A820' : '#C8431A', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 'bold' }}>
              {isContrib ? `⭐ Contributeur · ${ordinal} contribution` : `🎪 Organisateur · ${ordinal} événement`}
            </span>
          </div>
          {succesData?.nouveauBadge && !showBadgePopup && (
            <div style={{ background: 'rgba(212,168,32,0.08)', border: '1px solid rgba(212,168,32,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{succesData.nouveauBadge.emoji}</span>
              <div>
                <p style={{ color: '#D4A820', fontSize: 12, fontWeight: 'bold' }}>Badge débloqué !</p>
                <p style={{ color: '#F7F2E8', fontSize: 14, fontWeight: 'bold' }}>{succesData.nouveauBadge.label}</p>
              </div>
            </div>
          )}
          {succesData?.visibilite === 'prive' && succesData.lienSecret && (
            <div style={{ background: 'rgba(200,67,26,0.1)', border: '1px solid rgba(200,67,26,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ color: '#C8431A', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>🫧 Lien secret :</p>
              <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ color: '#1A1410', fontSize: 11, flex: 1, wordBreak: 'break-all' }}>{`https://app.lotbo.app/evenement/secret/${succesData.lienSecret}`}</code>
                <button onClick={() => navigator.clipboard.writeText(`https://app.lotbo.app/evenement/secret/${succesData.lienSecret}`)} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>Copier</button>
              </div>
            </div>
          )}
          {succesData?.visibilite === 'discret' && succesData.codeAcces && (
            <div style={{ background: 'rgba(212,168,32,0.1)', border: '1px solid rgba(212,168,32,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ color: '#D4A820', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>🔒 Code d'accès :</p>
              <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold', letterSpacing: 8 }}>{succesData.codeAcces}</span>
                <button onClick={() => navigator.clipboard.writeText(succesData.codeAcces!)} style={{ background: '#D4A820', color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Copier</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {succesData?.evenementId && (
              <a href={'/evenement/' + succesData.evenementId} style={{ background: '#C8431A', color: 'white', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'block', textAlign: 'center' }}>👁️ Voir l'événement</a>
            )}
            <a href="/ajouter" style={{ background: 'rgba(255,255,255,0.06)', color: '#F7F2E8', border: '1px solid #2a2a2a', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'block', textAlign: 'center' }}>+ Ajouter un autre événement</a>
            <a href="/profil" style={{ background: 'rgba(255,255,255,0.10)', color: '#F7F2E8', border: '1px solid #444', padding: '13px 24px', borderRadius: 10, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center' }}>Mon tableau de bord →</a>
            <a href="/" style={{ color: '#C8431A', fontSize: 13, textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: 4, fontWeight: 'bold' }}>← Retour à la carte</a>
          </div>
        </div>
      </main>
    )
  }

  const categorieNomSelectionnee = EVENT_TYPES.find(t => t.id === selectedType)?.nom || ''
  const imageConfirmee           = !!(image || imageUnsplash)

  // ── Formulaire ────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', padding: '32px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
          <h1 style={{ color: '#1A1410', fontSize: 26, fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>Ajouter un événement</h1>
          {/* ── FEAT-SCAN-PUBLIE — Bouton scan ── */}
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleScan}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '13px 16px', marginTop: 16, marginBottom: 4,
              background: scanLoading ? 'rgba(200,67,26,0.08)' : 'rgba(200,67,26,0.06)',
              border: '1px dashed rgba(200,67,26,0.4)',
              borderRadius: 12, cursor: scanLoading ? 'not-allowed' : 'pointer',
              color: '#C8431A', fontSize: 14, fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
          >
            {scanLoading
              ? <><span style={{ fontSize: 18 }}>⏳</span><span>{T_IMAGE[locale].scanAnalyse || '📸 Analyse en cours...'}</span></>
              : <><span style={{ fontSize: 18 }}>📸</span><span>{T_IMAGE[locale].scanAffiche || '📸 Scanner ou importer une affiche'}</span></>
            }
          </button>
          {scanMessage && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5,
              background: scanMessage.type === 'verifier' ? 'rgba(45,158,107,0.08)' : 'rgba(200,67,26,0.08)',
              border: `1px solid ${scanMessage.type === 'verifier' ? 'rgba(45,158,107,0.3)' : 'rgba(200,67,26,0.3)'}`,
              color: scanMessage.type === 'verifier' ? '#2D9E6B' : '#C8431A',
            }}>
              {scanMessage.type === 'verifier' ? '✅ ' : '⚠️ '}{scanMessage.texte}
            </div>
          )}
          <p style={{ color: '#8C5A40', fontSize: 13 }}>Partage un événement avec la communauté Lotbo</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={labelStyle}>Titre de l'événement *</label>
            <input name="titre" value={form.titre} placeholder="Ex: Livres en Folie 2026" onChange={handleChange} style={inputStyle} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => setSoumisEnTantQue('organisateur')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: soumisEnTantQue === 'organisateur' ? 'rgba(200,67,26,0.10)' : 'white', border: soumisEnTantQue === 'organisateur' ? '2px solid #C8431A' : '1px solid #E8E0D0', width: '100%' }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>🎪</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>C'est mon événement</p>
                  <p style={{ color: '#8C5A40', fontSize: 12 }}>Je suis l'organisateur</p>
                </div>
                {soumisEnTantQue === 'organisateur' && <span style={{ color: '#C8431A', fontSize: 18, flexShrink: 0 }}>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setSoumisEnTantQue('contributeur')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: soumisEnTantQue === 'contributeur' ? 'rgba(212,168,32,0.10)' : 'white', border: soumisEnTantQue === 'contributeur' ? '2px solid #D4A820' : '1px solid #E8E0D0', width: '100%' }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>⭐</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>Je l'ai repéré</p>
                  <p style={{ color: '#8C5A40', fontSize: 12 }}>J'ai vu cette info et je la partage</p>
                </div>
                {soumisEnTantQue === 'contributeur' && <span style={{ color: '#D4A820', fontSize: 18, flexShrink: 0 }}>✓</span>}
              </button>
            </div>

          <div>
            <label style={labelStyle}>Organisateur</label>
            <input name="organisateur" value={form.organisateur} onChange={handleChange} placeholder="Ex: Barreau de Petit-Goâve..." style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ville *</label>
              <input name="ville" value={form.ville} placeholder="Ex: Pétion-Ville" onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pays *</label>
              <input name="pays" value={form.pays} placeholder="Ex: Haïti" onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nom du lieu *</label>
            <input name="nom_lieu" value={form.nom_lieu} placeholder="Ex: El Rancho Convention Center" onChange={handleChange} style={inputStyle} required autoComplete="off" />
            <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>Nom exact du bâtiment, salle ou espace</p>
          </div>

          <div>
            <label style={labelStyle}>Adresse <span style={{ color: '#8C5A40' }}>(optionnel)</span></label>
            <input name="adresse" value={form.adresse} placeholder="Ex: Rue Républicaine, Carrefour..." onChange={handleChange} style={inputStyle} />
            <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 4 }}>Numéro, rue, quartier — pour aider les participants</p>
          </div>

          <div>
            <label style={labelStyle}>📍 Localisation sur la carte *</label>
            <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8 }}>Recherche la ville ou le lieu pour placer le pin, puis ajuste-le en le glissant</p>
            <div style={{ position: 'relative' }} ref={suggestionsRef}>
              <input value={rechercheTexte} onChange={handleRechercheChange} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder="Recherche : Pétion-Ville, El Rancho..." style={{ ...inputStyle, border: pinConfirme ? '1px solid #2D9E6B' : coordsPin ? '1px solid #D4A820' : '1px solid #E8E0D0' }} autoComplete="off" />
              {pinConfirme && <span style={{ position: 'absolute', right: 14, top: 14, color: '#2D9E6B', fontSize: 16 }}>✓</span>}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4, background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => handleSelectSuggestion(s)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #E8E0D0' : 'none', color: '#1A1410', fontSize: 13, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
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
            {coordsPin && (
              <div style={{ marginTop: 12 }}>
                <CarteInteractive coords={coordsPin} onCoordsChange={(c) => { setCoordsPin(c); setPinConfirme(false) }} />
                <div style={{ marginTop: 10 }}>
                  {!pinConfirme ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setPinConfirme(true)} style={{ flex: 2, background: '#2D9E6B', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>✓ Confirmer cet emplacement</button>
                      <button type="button" onClick={() => { setCoordsPin(null); setPinConfirme(false); setRechercheTexte('') }} style={{ flex: 1, background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 8, padding: '10px 12px', fontSize: 13, cursor: 'pointer' }}>Réinitialiser</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#2D9E6B', fontSize: 13, fontWeight: 'bold' }}>✓ Emplacement confirmé</span>
                      <button type="button" onClick={() => setPinConfirme(false)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Modifier</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <button type="button" onClick={() => { setMultiJours(!multiJours); if (multiJours) setForm(f => ({ ...f, date_fin: '' })) }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: multiJours ? 'rgba(200,67,26,0.12)' : 'white', border: multiJours ? '1px solid #C8431A' : '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: multiJours ? '#1A1410' : '#8C5A40', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: 16 }}>{multiJours ? '✅' : '☐'}</span>
              <span>Événement sur plusieurs jours</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{multiJours ? 'Date de début *' : 'Date *'}</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} required />
            </div>
            {multiJours && (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date de fin *</label>
                <input type="date" name="date_fin" value={form.date_fin} min={form.date || undefined} onChange={handleChange} style={inputStyle} required={multiJours} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Heure de début *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={form.heure_debut.split(':')[0] || ''}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    heure_debut: e.target.value + ':' + (prev.heure_debut.split(':')[1] || '00'),
                  }))}
                  style={inputStyle}
                >
                  <option value="">HH</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span style={{ alignSelf: 'center', color: '#8C5A40' }}>:</span>
                <select
                  value={form.heure_debut.split(':')[1] || ''}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    heure_debut: (prev.heure_debut.split(':')[0] || '00') + ':' + e.target.value,
                  }))}
                  style={{ ...inputStyle, width: 80 }}
                >
                  <option value="">MM</option>
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Heure de fin <span style={{ color: '#8C5A40' }}>(optionnel)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={form.heure_fin.split(':')[0] || ''}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    heure_fin: e.target.value + ':' + (prev.heure_fin.split(':')[1] || '00'),
                  }))}
                  style={inputStyle}
                >
                  <option value="">HH</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>
                  ))}
                </select>
                <span style={{ alignSelf: 'center', color: '#8C5A40' }}>:</span>
                <select
                  value={form.heure_fin.split(':')[1] || ''}
                  onChange={e => setForm(prev => ({
                    ...prev,
                    heure_fin: (prev.heure_fin.split(':')[0] || '00') + ':' + e.target.value,
                  }))}
                  style={{ ...inputStyle, width: 80 }}
                >
                  <option value="">MM</option>
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── F8 — Récurrence ── */}
          <div>
            <button type="button" onClick={() => setEstRecurrent(!estRecurrent)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: estRecurrent ? 'rgba(200,67,26,0.12)' : 'white', border: estRecurrent ? '1px solid #C8431A' : '1px solid #E8E0D0', borderRadius: 10, padding: '10px 14px', color: estRecurrent ? '#1A1410' : '#8C5A40', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left' as const }}>
              <span style={{ fontSize: 16 }}>{estRecurrent ? '✅' : '☐'}</span>
              <span>Cet événement se répète</span>
            </button>

            {estRecurrent && (
              <div style={{ background: 'rgba(200,67,26,0.04)', border: '1px solid rgba(200,67,26,0.2)', borderRadius: 12, padding: '16px', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Fréquence</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {[
                      { key: 'quotidien',    label: 'Tous les jours' },
                      { key: 'hebdomadaire', label: 'Toutes les semaines' },
                      { key: 'mensuel',      label: 'Tous les mois' },
                      { key: 'annuel',       label: 'Tous les ans' },
                    ].map(t => (
                      <button key={t.key} type="button" onClick={() => setTypeRecurrence(t.key as typeof typeRecurrence)} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: typeRecurrence === t.key ? '#C8431A' : 'rgba(255,255,255,0.6)', color: typeRecurrence === t.key ? 'white' : '#8C5A40' }}>{t.label}</button>
                    ))}
                  </div>
                </div>

                {typeRecurrence === 'hebdomadaire' && (
                  <div>
                    <label style={labelStyle}>Jour(s) de la semaine</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(jour => {
                        const actif = joursRecurrence.includes(jour)
                        return (
                          <button key={jour} type="button" onClick={() => setJoursRecurrence(prev => actif ? prev.filter(j => j !== jour) : [...prev, jour])} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', border: actif ? 'none' : '1px solid #E8E0D0', cursor: 'pointer', background: actif ? '#C8431A' : 'white', color: actif ? 'white' : '#8C5A40' }}>{jour}</button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Fin de la récurrence</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 10 }}>
                    {[
                      { key: 'sans_fin',    label: 'Sans fin' },
                      { key: 'date',        label: "Jusqu'à une date" },
                      { key: 'occurrences', label: 'Après X fois' },
                    ].map(f => (
                      <button key={f.key} type="button" onClick={() => setFinRecurrenceType(f.key as typeof finRecurrenceType)} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: finRecurrenceType === f.key ? '#1A1410' : 'rgba(255,255,255,0.6)', color: finRecurrenceType === f.key ? '#F7F2E8' : '#8C5A40' }}>{f.label}</button>
                    ))}
                  </div>
                  {finRecurrenceType === 'date' && (
                    <input type="date" value={finRecurrenceDate} onChange={e => setFinRecurrenceDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                  )}
                  {finRecurrenceType === 'occurrences' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <input type="number" min={2} max={52} value={finRecurrenceNb} onChange={e => setFinRecurrenceNb(parseInt(e.target.value))} style={{ ...inputStyle, width: 80 }} />
                      <span style={{ color: '#8C5A40', fontSize: 13 }}>occurrences</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Fuseau horaire <span style={{ color: '#8C5A40', marginLeft: 4 }}>(heure locale du lieu)</span></label>
            <select name="fuseau_organisateur" value={form.fuseau_organisateur} onChange={handleChange} style={inputStyle}>
              {FUSEAUX.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Type d'événement *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {EVENT_TYPES.map(type => (
                <button key={type.id} type="button" onClick={() => setSelectedType(type.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer', background: selectedType === type.id ? 'rgba(200,67,26,0.15)' : 'white', border: selectedType === type.id ? '1px solid #C8431A' : '1px solid #E8E0D0', color: selectedType === type.id ? '#1A1410' : '#8C5A40' }}>
                  <span>{type.icone}</span><span>{type.nom}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Thèmes <span style={{ color: '#8C5A40' }}>(plusieurs possible)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {EVENT_THEMES.map(theme => (
                <button key={theme.id} type="button" onClick={() => toggleTheme(theme.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', background: selectedThemes.includes(theme.id) ? 'rgba(200,67,26,0.15)' : 'white', border: selectedThemes.includes(theme.id) ? '1px solid #C8431A' : '1px solid #E8E0D0', color: selectedThemes.includes(theme.id) ? '#1A1410' : '#8C5A40' }}>
                  <span>{theme.icone}</span><span>{theme.nom}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Accès</label>
              <select name="acces" value={form.acces} onChange={handleChange} style={inputStyle}>
                <option value="public">Public</option>
                <option value="prive">Privé</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prix</label>
              <select name="prix" value={form.prix} onChange={handleChange} style={inputStyle}>
                <option value="gratuit">Gratuit</option>
                <option value="payant">Payant</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} placeholder="Décris l'événement..." onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>Lien pour plus de détails (optionnel)</label>
            <input name="lien" value={form.lien} placeholder="https://" onChange={handleChange} style={inputStyle} />
          </div>

          {/* ── F10 — Section image avec bloc incitatif ── */}
          <div ref={imageSectionRef}>
            <label style={labelStyle}>
              Photo de l'événement
              <span style={{ color: '#8C5A40', marginLeft: 6 }}>(optionnel)</span>
            </label>

            {showImageBloc && !imageConfirmee && !imageBlocIgnore && (
              <BlocIncitatiImage
                locale={locale}
                titre={form.titre}
                categorie={categorieNomSelectionnee}
                imageDejaSelectionnee={imageConfirmee}
                onSelectUnsplash={(photo) => {
                  setImageUnsplash(photo)
                  setShowImageBloc(false)
                }}
                onOwnImage={() => {
                  setShowImageBloc(false)
                  fileInputRef.current?.click()
                }}
                onSkip={() => {
                  setImageBlocIgnore(true)
                  setShowImageBloc(false)
                }}
              />
            )}

            {imageUnsplash && !image && (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid #2D9E6B', marginTop: 8 }}>
                <img src={imageUnsplash.thumb} alt="suggestion" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Photo par {imageUnsplash.author}</p>
                  <button type="button" onClick={() => { setImageUnsplash(null); setShowImageBloc(true) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>Changer</button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0] || null
                setImage(file)
                if (file) { setImageUnsplash(null); setShowImageBloc(false) }
              }}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                marginTop: 8,
                display: (showImageBloc && !imageConfirmee && !imageBlocIgnore) ? 'none' : 'block',
              }}
            />

            {image && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#2D9E6B', fontSize: 12, fontWeight: 'bold' }}>✓ {image.name}</span>
                <button type="button" onClick={() => setImage(null)} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>Supprimer</button>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Visibilité de l'événement</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {VISIBILITES.map(v => (
                <button key={v.value} type="button" onClick={() => setVisibilite(v.value as 'public' | 'discret' | 'prive')} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: visibilite === v.value ? v.bg : 'white', border: visibilite === v.value ? `1px solid ${v.border}` : '1px solid #E8E0D0' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: visibilite === v.value ? `2px solid ${v.color}` : '2px solid #E8E0D0', background: visibilite === v.value ? v.color : 'transparent' }} />
                  <div>
                    <p style={{ color: '#1A1410', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{v.label}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12, lineHeight: 1.5 }}>{v.description}</p>
                  </div>
                </button>
              ))}
            </div>
            {visibilite === 'discret' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelStyle, color: '#D4A820' }}>Code d'accès (4-6 chiffres) *</label>
                <input type="text" inputMode="numeric" maxLength={6} value={codeAcces} onChange={e => setCodeAcces(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 1234" style={{ ...inputStyle, border: '1px solid rgba(212,168,32,0.4)', letterSpacing: 8, fontSize: 18 }} />
                <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>Ce code sera demandé aux visiteurs pour révéler l'adresse exacte.</p>
              </div>
            )}
            {visibilite === 'prive' && (
              <div style={{ marginTop: 12, background: 'rgba(200,67,26,0.08)', border: '1px solid rgba(200,67,26,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ color: '#C8431A', fontSize: 13, lineHeight: 1.6 }}>🫧 Un lien secret unique sera généré après soumission.</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ background: loading ? '#8C5A40' : '#C8431A', color: '#F7F2E8', fontWeight: 'bold', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
            {loading ? 'Publication en cours...' : "Soumettre l'événement"}
          </button>

        </form>
      </div>
    </main>
  )
}