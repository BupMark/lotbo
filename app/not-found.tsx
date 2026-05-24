'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SUBTITLES: Record<string, string> = {
  fr: "Cette page s'est perdue en chemin. Mais il y a sûrement un événement près de toi qui t'attend.",
  en: "This page got lost along the way. But there's surely an event near you waiting.",
  es: "Esta página se perdió en el camino. Pero seguro hay un evento cerca de ti esperándote.",
  pt: "Esta página se perdeu no caminho. Mas certamente há um evento perto de você esperando.",
  ht: "Paj sa a pèdi nan wout li. Men siman gen yon evènman pre ou k ap tann ou.",
}

function getSubtitle(lang: string): string {
  const code = lang.toLowerCase().split('-')[0]
  return SUBTITLES[code] ?? SUBTITLES.fr
}

export default function NotFound() {
  const [subtitle, setSubtitle] = useState(SUBTITLES.fr)

  useEffect(() => {
    setSubtitle(getSubtitle(navigator.language))
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#F7F2E8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'sans-serif',
      textAlign: 'center',
    }}>

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: 48 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: '#1A1410' }}>lot</span>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: '#C8431A' }}>bo</span>
      </Link>

      {/* Illustration SVG — pin avec "?" */}
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 32 }}>
        <path d="M40 2C22.327 2 8 16.327 8 34C8 57.5 40 98 40 98C40 98 72 57.5 72 34C72 16.327 57.673 2 40 2Z" fill="#C8431A" />
        <circle cx="40" cy="34" r="17" fill="#F7F2E8" />
        <text x="40" y="41" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#C8431A">?</text>
      </svg>

      {/* Titre */}
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        fontSize: 'clamp(26px, 6vw, 36px)',
        fontWeight: 700,
        color: '#1A1410',
        margin: '0 0 16px',
      }}>
        Oops… lòt bò !
      </h1>

      {/* Sous-titre localisé */}
      <p style={{
        fontSize: 15,
        color: '#8C5A40',
        lineHeight: 1.65,
        maxWidth: 360,
        margin: '0 0 40px',
      }}>
        {subtitle}
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <Link
          href="/"
          style={{
            display: 'block',
            background: '#C8431A',
            color: 'white',
            padding: '14px 24px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Découvrir les événements →
        </Link>
        <Link
          href="/"
          style={{
            display: 'block',
            background: 'transparent',
            color: '#8C5A40',
            padding: '14px 24px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            border: '1px solid #E8E0D0',
          }}
        >
          Retour à l'accueil
        </Link>
      </div>

    </main>
  )
}
