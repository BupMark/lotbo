'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

interface Organisation {
  id: string
  slug: string
  nom: string
  description: string | null
  ville: string | null
  pays: string | null
  site_web: string | null
  email_contact: string | null
  verified: boolean
  logo_url: string | null
  owner_id: string
}

interface EvenementVitrine {
  id: string
  titre: string
  lieu: string
  date_debut: string | null
  date: string
  categorie: string
  prix: string
  image_url: string | null
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'OR'
}

export default function PageOrganisation() {
  const params = useParams()
  const slug = params?.slug as string

  const [org, setOrg]                 = useState<Organisation | null>(null)
  const [evenements, setEvenements]   = useState<EvenementVitrine[]>([])
  const [nbFollowers, setNbFollowers] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [introuvable, setIntrouvable] = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)
  const [suivi, setSuivi]             = useState(false)
  const [suiviLoading, setSuiviLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!slug) return
    charger()
  }, [slug])

  useEffect(() => {
    if (!userId || !org) return
    supabase
      .from('organisation_membres')
      .select('id')
      .eq('organisation_id', org.id)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setSuivi(!!data))
  }, [userId, org])

  const charger = async () => {
    setLoading(true)

    const { data: orgData } = await supabase
      .from('organisations')
      .select('id, slug, nom, description, ville, pays, site_web, email_contact, verified, logo_url, owner_id')
      .eq('slug', slug)
      .maybeSingle()

    if (!orgData) {
      setIntrouvable(true)
      setLoading(false)
      return
    }

    setOrg(orgData as Organisation)

    const aujourd_hui = new Date().toISOString().split('T')[0]

    const [{ data: evData }, { count: followCount }] = await Promise.all([
      supabase
        .from('evenements')
        .select('id, titre, lieu, date_debut, date, categorie, prix, image_url')
        .eq('organisation_id', orgData.id)
        .gte('date_debut', aujourd_hui)
        .eq('statut', 'approuve')
        .order('date_debut', { ascending: true })
        .limit(10),
      supabase
        .from('organisation_membres')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', orgData.id)
        .neq('role', 'owner'),
    ])

    setEvenements((evData as EvenementVitrine[]) ?? [])
    setNbFollowers(followCount ?? 0)
    setLoading(false)
  }

  const toggleSuivi = async () => {
    if (!userId || !org) return
    setSuiviLoading(true)
    if (suivi) {
      await supabase
        .from('organisation_membres')
        .delete()
        .eq('organisation_id', org.id)
        .eq('user_id', userId)
      setSuivi(false)
      setNbFollowers(prev => Math.max(0, prev - 1))
    } else {
      await supabase
        .from('organisation_membres')
        .insert({ organisation_id: org.id, user_id: userId, role: 'lecteur' })
      setSuivi(true)
      setNbFollowers(prev => prev + 1)
    }
    setSuiviLoading(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8C5A40' }}>Chargement...</p>
    </main>
  )

  if (introuvable) return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <p style={{ fontSize: 40 }}>🏢</p>
      <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 18 }}>Organisation introuvable</p>
      <a href="/" style={{ color: '#C8431A', fontSize: 14, textDecoration: 'none' }}>← Retour à la carte</a>
    </main>
  )

  if (!org) return null

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>

        <a href="/" style={{ color: '#8C5A40', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          ← Retour à la carte
        </a>

        {/* Carte organisation */}
        <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>

            {/* Logo ou initiales */}
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.nom}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid #E8E0D0' }}
              />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 'bold', color: 'white' }}>
                {getInitiales(org.nom)}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1A1410', margin: 0 }}>{org.nom}</h1>
                {org.verified && (
                  <span style={{ background: 'rgba(45,158,107,0.12)', color: '#2D9E6B', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>
                    ✅ Organisation vérifiée
                  </span>
                )}
              </div>
              {(org.ville || org.pays) && (
                <p style={{ color: '#8C5A40', fontSize: 13, marginBottom: 6 }}>
                  📍 {[org.ville, org.pays].filter(Boolean).join(', ')}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: '#8C5A40', fontSize: 12 }}>
                  <strong style={{ color: '#1A1410' }}>{evenements.length}</strong> événements à venir
                </span>
                <span style={{ color: '#8C5A40', fontSize: 12 }}>
                  <strong style={{ color: '#1A1410' }}>{nbFollowers}</strong> membres
                </span>
              </div>
            </div>
          </div>

          {org.description && (
            <p style={{ color: '#4A3830', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{org.description}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {userId && (
              <button
                onClick={toggleSuivi}
                disabled={suiviLoading}
                style={{
                  background: suivi ? 'rgba(200,67,26,0.1)' : '#C8431A',
                  color: suivi ? '#C8431A' : 'white',
                  border: suivi ? '1px solid #C8431A' : 'none',
                  borderRadius: 999, padding: '9px 20px',
                  fontSize: 13, fontWeight: 'bold', cursor: suiviLoading ? 'default' : 'pointer',
                }}
              >
                {suivi ? 'Suivi ✓' : 'Suivre'}
              </button>
            )}
            {org.email_contact && (
              <a
                href={`mailto:${org.email_contact}`}
                style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none' }}
              >
                Contacter
              </a>
            )}
            {org.site_web && (
              <a
                href={org.site_web.startsWith('http') ? org.site_web : `https://${org.site_web}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: 'white', color: '#8C5A40', border: '1px solid #E8E0D0', borderRadius: 999, padding: '9px 20px', fontSize: 13, textDecoration: 'none' }}
              >
                🌐 Site web
              </a>
            )}
          </div>
        </div>

        {/* Événements à venir */}
        <h2 style={{ fontSize: 11, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Événements à venir
        </h2>

        {evenements.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ color: '#8C5A40', fontSize: 14 }}>Aucun événement à venir</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evenements.map(ev => (
              <a
                key={ev.id}
                href={`/evenement/${ev.id}`}
                style={{ display: 'flex', gap: 12, background: 'white', border: '1px solid #E8E0D0', borderRadius: 12, padding: 14, textDecoration: 'none', color: '#1A1410', alignItems: 'flex-start' }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F7F2E8', border: '1px solid #E8E0D0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {ev.image_url
                    ? <img src={ev.image_url} alt={ev.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '📅'
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.titre}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 2 }}>📍 {ev.lieu}</p>
                  <p style={{ color: '#8C5A40', fontSize: 12 }}>📅 {ev.date_debut ?? ev.date}</p>
                </div>
                <span style={{ background: '#C8431A', color: 'white', padding: '2px 8px', borderRadius: 20, fontSize: 10, flexShrink: 0, alignSelf: 'flex-start' }}>
                  {ev.categorie}
                </span>
              </a>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
