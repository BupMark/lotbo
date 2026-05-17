'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Evenement {
  id: string
  titre: string
  lieu: string
  organisateur: string | null
  date: string
  heure_debut: string | null
  categorie: string
  acces: string
  prix: string
  statut: 'en_attente' | 'approuve' | 'rejete' | string
  image_url: string | null
  latitude: number | null
  longitude: number | null
  source: string | null
  created_at: string
}

interface Signalement {
  id: string
  evenement_id: string
  raison: string
  created_at: string
}

type FiltreStatut = 'en_attente' | 'approuve' | 'rejete' | 'tous'
type FiltreTemporel = 'aujourd_hui' | 'cette_semaine' | 'ce_mois' | 'tous'
type Onglet = 'evenements' | 'signalements' | 'import'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const couleurStatut = (s: string): { bg: string; color: string } => {
  if (s === 'approuve') return { bg: 'rgba(45,158,107,0.15)', color: '#2D9E6B' }
  if (s === 'rejete')   return { bg: 'rgba(180,40,40,0.2)',   color: '#e57373' }
  return                       { bg: 'rgba(212,168,32,0.15)', color: '#D4A820' }
}

const labelStatut = (s: string): string => {
  if (s === 'approuve')  return '✓ Approuvé'
  if (s === 'rejete')    return '✗ Rejeté'
  if (s === 'en_attente') return '⏳ En attente'
  return s
}

/** Retourne true si la date ISO tombe dans la plage demandée */
const matchTemporel = (dateStr: string, filtre: FiltreTemporel): boolean => {
  if (filtre === 'tous') return true
  if (!dateStr) return false

  const now = new Date()
  const date = new Date(dateStr)

  if (filtre === 'aujourd_hui') {
    return (
      date.getDate()     === now.getDate() &&
      date.getMonth()    === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  if (filtre === 'cette_semaine') {
    const debut = new Date(now)
    debut.setDate(now.getDate() - now.getDay())
    debut.setHours(0, 0, 0, 0)
    const fin = new Date(debut)
    fin.setDate(debut.getDate() + 6)
    fin.setHours(23, 59, 59, 999)
    return date >= debut && date <= fin
  }

  if (filtre === 'ce_mois') {
    return (
      date.getMonth()    === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  return true
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Admin() {
  const router = useRouter()
  const [evenements, setEvenements]         = useState<Evenement[]>([])
  const [signalements, setSignalements]     = useState<Signalement[]>([])
  const [loading, setLoading]               = useState(true)
  const [userEmail, setUserEmail]           = useState<string>('')
  const [filtreStatut, setFiltreStatut]     = useState<FiltreStatut>('en_attente')
  const [filtreTemporel, setFiltreTemporel] = useState<FiltreTemporel>('tous')
  const [recherche, setRecherche]           = useState('')
  const [onglet, setOnglet]                 = useState<Onglet>('evenements')
// SC7 — Dashboard import
const [statsImport, setStatsImport] = useState<{
  source: string
  nb: number
  dernierImport: string | null
}[]>([])
const [repartitionPays, setRepartitionPays] = useState<{ pays: string; nb: number }[]>([])
const [loadingImport, setLoadingImport] = useState(false)

  // Headers sécurisés pour les routes API internes
  const hi: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '',
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const role = data.session.user.user_metadata?.role
      if (role !== 'admin') { router.push('/'); return }
      setUserEmail(data.session.user.email ?? '')
      chargerDonnees()
    })
  }, [])

  const chargerDonnees = async () => {
    const [{ data: evs }, { data: sigs }] = await Promise.all([
      supabase.from('evenements').select('*').order('created_at', { ascending: false }),
      supabase.from('signalements').select('*').order('created_at', { ascending: false }),
    ])
    // SC7 — Stats import par source
const { data: statsSource } = await supabase
  .from('evenements')
  .select('source, created_at')
  .eq('statut', 'approuve')
  .not('source', 'is', null)

if (statsSource) {
  const map: Record<string, { nb: number; dernierImport: string }> = {}
  for (const ev of statsSource) {
    if (!ev.source) continue
    if (!map[ev.source]) map[ev.source] = { nb: 0, dernierImport: ev.created_at }
    map[ev.source].nb++
    if (ev.created_at > map[ev.source].dernierImport) map[ev.source].dernierImport = ev.created_at
  }
  setStatsImport(Object.entries(map).map(([source, v]) => ({ source, nb: v.nb, dernierImport: v.dernierImport })).sort((a, b) => b.nb - a.nb))
}

// SC7 — Répartition par pays
const { data: statsPays } = await supabase
  .from('evenements')
  .select('pays')
  .eq('statut', 'approuve')
  .not('pays', 'is', null)

if (statsPays) {
  const map: Record<string, number> = {}
  for (const ev of statsPays) {
    if (!ev.pays) continue
    map[ev.pays] = (map[ev.pays] || 0) + 1
  }
  setRepartitionPays(Object.entries(map).map(([pays, nb]) => ({ pays, nb })) .sort((a, b) => b.nb - a.nb).slice(0, 10))
}
    setEvenements((evs as Evenement[]) || [])
    setSignalements((sigs as Signalement[]) || [])
    setLoading(false)
  }

  const approuver = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'approuve' }).eq('id', id)
    setEvenements(prev => prev.map(ev => ev.id === id ? { ...ev, statut: 'approuve' } : ev))
    const ev = evenements.find(e => e.id === id)
    if (ev) {
      fetch('/api/notify-abonnes', { method: 'POST', headers: hi, body: JSON.stringify({ id: ev.id, titre: ev.titre, lieu: ev.lieu, date: ev.date, categorie: ev.categorie }) }).catch(() => {})
      fetch('/api/push-notify',    { method: 'POST', headers: hi, body: JSON.stringify({ titre: ev.titre, lieu: ev.lieu, url: `https://app.lotbo.app/evenement/${ev.id}` }) }).catch(() => {})
    }
  }

  const rejeter = async (id: string) => {
    await supabase.from('evenements').update({ statut: 'rejete' }).eq('id', id)
    setEvenements(prev => prev.map(ev => ev.id === id ? { ...ev, statut: 'rejete' } : ev))
  }

  const supprimer = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await supabase.from('evenements').delete().eq('id', id)
    setEvenements(prev => prev.filter(ev => ev.id !== id))
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const nbTotal     = evenements.length
  const nbApprouves = evenements.filter(e => e.statut === 'approuve').length
  const nbEnAttente = evenements.filter(e => e.statut === 'en_attente').length
  const nbRejetes   = evenements.filter(e => e.statut === 'rejete').length
  const nbVilles    = new Set(
    evenements
      .filter(e => e.statut === 'approuve')
      .map(e => e.lieu?.split(',').pop()?.trim())
      .filter(Boolean)
  ).size
  const nbRegions = new Set(
    evenements
      .filter(e => e.statut === 'approuve' && e.longitude !== null)
      .map(e => (e.longitude! < -30 ? 'Amériques' : e.longitude! < 60 ? 'Europe/Afrique' : 'Asie/Pacifique'))
  ).size

  // ─── Filtre combiné ────────────────────────────────────────────────────────

  const evenementsFiltres = evenements.filter(ev => {
    const matchStatut    = filtreStatut === 'tous' || ev.statut === filtreStatut
    const matchTemps     = matchTemporel(ev.date, filtreTemporel)
    const q              = recherche.toLowerCase()
    const matchRecherche = q === '' ||
      ev.titre?.toLowerCase().includes(q) ||
      ev.lieu?.toLowerCase().includes(q) ||
      ev.organisateur?.toLowerCase().includes(q)
    return matchStatut && matchTemps && matchRecherche
  })

  // ─── Labels filtres temporels ──────────────────────────────────────────────

  const nbParTemps = (f: FiltreTemporel) =>
    evenements.filter(ev =>
      (filtreStatut === 'tous' || ev.statut === filtreStatut) &&
      matchTemporel(ev.date, f)
    ).length

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40', fontFamily: 'serif', fontStyle: 'italic' }}>Chargement...</p>
    </main>
  )

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── En-tête ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            <span style={{ color: '#1A1410', fontSize: 24, fontWeight: 'bold' }}>lot</span>
            <span style={{ color: '#C8431A', fontSize: 24, fontWeight: 'bold' }}>bo</span>
            <span style={{ color: '#8C5A40', fontSize: 14, marginLeft: 12 }}>admin</span>
          </div>
          <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none' }}>← Retour à la carte</a>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Total',      valeur: nbTotal,     couleur: '#1A1410' },
            { label: 'En attente', valeur: nbEnAttente, couleur: '#D4A820' },
            { label: 'Approuvés',  valeur: nbApprouves, couleur: '#2D9E6B' },
            { label: 'Rejetés',    valeur: nbRejetes,   couleur: '#e57373' },
            { label: 'Villes',     valeur: nbVilles,    couleur: '#C8431A' },
            { label: 'Régions',    valeur: nbRegions,   couleur: '#8C5A40' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: c.couleur, marginBottom: 4 }}>{c.valeur}</p>
              <p style={{ fontSize: 11, color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* ── Utilisateur connecté ────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #333', borderRadius: 12, padding: '10px 16px', marginBottom: 24 }}>
          <p style={{ color: '#8C5A40', fontSize: 13 }}>
            Connecté en tant que <span style={{ color: '#C8431A' }}>{userEmail}</span>
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ADMIN2 — Navigation onglets
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #E8E0D0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { key: 'evenements',   label: `Événements`,                         count: nbTotal            },
            { key: 'signalements', label: `Signalements`,                       count: signalements.length },
            { key: 'import', label: `📥 Import`, count: statsImport.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setOnglet(tab.key as Onglet)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: onglet === tab.key ? '#C8431A' : '#8C5A40',
                borderBottom: onglet === tab.key ? '2px solid #C8431A' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {tab.label}
              <span style={{
                background: onglet === tab.key ? '#C8431A' : 'rgba(26,20,16,0.06)',
               color: onglet === tab.key ? 'white' : '#8C5A40',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 'bold',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ONGLET ÉVÉNEMENTS
        ══════════════════════════════════════════════════════════════ */}
        {onglet === 'evenements' && (
          <>
            {/* ── Filtres statut ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {([
                { key: 'en_attente', label: `⏳ En attente`, count: nbEnAttente },
                { key: 'approuve',   label: `✓ Approuvés`,   count: nbApprouves },
                { key: 'rejete',     label: `✗ Rejetés`,     count: nbRejetes   },
                { key: 'tous',       label: `Tous`,           count: nbTotal     },
              ] as { key: FiltreStatut; label: string; count: number }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltreStatut(f.key)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: filtreStatut === f.key ? '#C8431A' : 'rgba(255,255,255,0.06)',
                    color:      filtreStatut === f.key ? 'white'   : '#8C5A40',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════════════════════
                ADMIN1 — Filtres temporels
            ══════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
                Période :
              </span>
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
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 'bold',
                    border: filtreTemporel === f.key ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    cursor: 'pointer',
                    background: filtreTemporel === f.key ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    color:      filtreTemporel === f.key ? '#C8431A'              : '#555',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>
                    {nbParTemps(f.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Recherche ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Rechercher par titre, lieu, organisateur…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #333',
                  borderRadius: 999,
                  padding: '8px 16px',
                  fontSize: 12,
                  color: '#1A1410',
                  outline: 'none',
                }}
              />
            </div>

            {/* ── Résultat filtres ────────────────────────────────────── */}
            {recherche || filtreTemporel !== 'tous' ? (
              <p style={{ color: '#555', fontSize: 11, marginBottom: 12 }}>
                {evenementsFiltres.length} résultat{evenementsFiltres.length !== 1 ? 's' : ''}
                {filtreTemporel !== 'tous' && ` · ${['aujourd_hui','cette_semaine','ce_mois'].includes(filtreTemporel) ? { aujourd_hui: "aujourd'hui", cette_semaine: 'cette semaine', ce_mois: 'ce mois', tous: '' }[filtreTemporel] : ''}`}
              </p>
            ) : null}

            {/* ── Liste événements ────────────────────────────────────── */}
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
                    background: 'rgba(255,255,255,0.04)',
                    border: ev.statut === 'en_attente' ? '1px solid rgba(212,168,32,0.3)' : '1px solid #2a2a2a',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  {ev.image_url && (
                    <img
                      src={ev.image_url}
                      alt={ev.titre}
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>{ev.titre}</h2>
                    {ev.organisateur && (
                      <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 4 }}>👤 {ev.organisateur}</p>
                    )}
                    <p style={{ color: '#8C5A40', fontSize: 12 }}>📍 {ev.lieu}</p>
                    <p style={{ color: '#8C5A40', fontSize: 12 }}>
                      📅 {ev.date}{ev.heure_debut ? ` · ${ev.heure_debut}` : ''}
                    </p>
                    {ev.source && (
                      <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Source : {ev.source}</p>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(200,67,26,0.15)', color: '#C8431A', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.categorie}</span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.acces}</span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8C5A40', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{ev.prix}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: couleurStatut(ev.statut).bg, color: couleurStatut(ev.statut).color }}>
                        {labelStatut(ev.statut)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <a
                      href={'/evenement/' + ev.id}
                      target="_blank"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#1A1410', padding: '6px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center', textDecoration: 'none' }}
                    >
                      Voir
                    </a>
                    {ev.statut !== 'approuve' && (
                      <button onClick={() => approuver(ev.id)} style={{ background: 'rgba(45,158,107,0.15)', color: '#2D9E6B', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        Approuver
                      </button>
                    )}
                    {ev.statut !== 'rejete' && (
                      <button onClick={() => rejeter(ev.id)} style={{ background: 'rgba(212,168,32,0.15)', color: '#D4A820', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        Rejeter
                      </button>
                    )}
                    <button onClick={() => supprimer(ev.id)} style={{ background: 'rgba(180,40,40,0.2)', color: '#e57373', padding: '6px 12px', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  </div>
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
                {signalements.map(sig => (
                  <div
                    key={sig.id}
                    style={{ background: 'rgba(180,40,40,0.1)', border: '1px solid rgba(180,40,40,0.3)', borderRadius: 12, padding: 16 }}
                  >
                    <p style={{ color: '#555', fontSize: 11 }}>Événement ID : {sig.evenement_id}</p>
                    <p style={{ color: '#e57373', fontSize: 13, marginTop: 4 }}>{sig.raison}</p>
                    <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                      {new Date(sig.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ══ SC7 — ONGLET IMPORT ══ */}
        {onglet === 'import' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stats globales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Sources actives', valeur: statsImport.length, couleur: '#1A1410' },
                { label: 'Total approuvés', valeur: nbApprouves,        couleur: '#2D9E6B' },
                { label: 'En attente',      valeur: nbEnAttente,        couleur: '#D4A820' },
                { label: 'Pays couverts',   valeur: repartitionPays.length, couleur: '#C8431A' },
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
                  { label: 'PredictHQ',       route: '/api/scrape-predicthq'       },
                  { label: 'Ticketmaster',     route: '/api/scrape-ticketmaster'    },
                  { label: 'World Cup',        route: '/api/scrape-worldcup'        },
                  { label: 'Ligue Haïtienne',  route: '/api/scrape-liguehaitienne'  },
                  { label: 'Eventbrite',       route: '/api/scrape-eventbrite'      },
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
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  )
}