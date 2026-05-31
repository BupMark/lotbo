'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Statut = 'loading' | 'ok' | 'deja' | 'introuvable' | 'erreur'

export default function PageRejoindre() {
  const params = useParams()
  const slug   = params?.slug as string
  const router = useRouter()

  const [statut, setStatut]   = useState<Statut>('loading')
  const [orgNom, setOrgNom]   = useState('')
  const [orgSlug, setOrgSlug] = useState('')

  useEffect(() => {
    if (!slug) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push(`/inscription?redirect=/organisation/${slug}/rejoindre`)
        return
      }
      const userId = data.session.user.id

      const { data: org } = await supabase
        .from('organisations')
        .select('id, nom, slug')
        .eq('slug', slug)
        .maybeSingle()

      if (!org) { setStatut('introuvable'); return }

      const o = org as { id: string; nom: string; slug: string }
      setOrgNom(o.nom)
      setOrgSlug(o.slug)

      // Vérifier si déjà membre
      const { data: existing } = await supabase
        .from('organisation_membres')
        .select('role')
        .eq('org_id', o.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) { setStatut('deja'); return }

      // Rejoindre comme lecteur
      const { error } = await supabase
        .from('organisation_membres')
        .insert({ org_id: o.id, user_id: userId, role: 'lecteur', joined_at: new Date().toISOString() })

      if (error) { setStatut('erreur'); return }
      setStatut('ok')
    })
  }, [slug])

  const containerStyle: React.CSSProperties = {
    minHeight: '100dvh', background: '#F7F2E8',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', textAlign: 'center',
  }

  if (statut === 'loading') return (
    <main style={containerStyle}>
      <p style={{ color: '#8C5A40', fontSize: 14 }}>Chargement...</p>
    </main>
  )

  if (statut === 'introuvable') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🏢</p>
      <p style={{ fontWeight: 'bold', fontSize: 18, color: '#1A1410', marginBottom: 8 }}>Organisation introuvable</p>
      <a href="/" style={{ color: '#C8431A', fontSize: 14, textDecoration: 'none' }}>← Retour à la carte</a>
    </main>
  )

  if (statut === 'erreur') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>❌</p>
      <p style={{ fontWeight: 'bold', fontSize: 16, color: '#1A1410', marginBottom: 8 }}>Une erreur est survenue</p>
      <a href={`/organisation/${slug}`} style={{ color: '#C8431A', fontSize: 14, textDecoration: 'none' }}>Retour à la page</a>
    </main>
  )

  if (statut === 'deja') return (
    <main style={containerStyle}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
      <p style={{ fontWeight: 'bold', fontSize: 18, color: '#1A1410', marginBottom: 8 }}>Tu fais déjà partie de {orgNom}</p>
      <a href={`/organisation/${orgSlug}`} style={{ background: '#C8431A', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
        Voir la page →
      </a>
    </main>
  )

  return (
    <main style={containerStyle}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
      <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1A1410', marginBottom: 8 }}>
        Tu as rejoint {orgNom} !
      </h1>
      <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Tu suis maintenant cette organisation et tu recevras ses événements.
      </p>
      <a
        href={`/organisation/${orgSlug}`}
        style={{ background: '#C8431A', color: 'white', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}
      >
        Voir la page de l&apos;organisation →
      </a>
    </main>
  )
}
