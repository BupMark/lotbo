'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total: number
  villes: number
  pays: number
}

export default function AnsanmPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#F7F2E8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px 96px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: isDesktop ? 640 : 340, width: '100%' }}>

        <div style={{ fontSize: 48, marginBottom: 20 }}>🌍</div>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1A1410',
          marginBottom: 12,
          lineHeight: 1.2,
        }}>
          <span style={{ color: '#C8431A' }}>Ansanm</span> arrive.
        </h1>

        <div style={{
          background: 'white',
          border: '1px solid #E8E0D0',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'left',
          marginBottom: 28,
        }}>
          <p style={{ fontSize: 14, color: '#1A1410', lineHeight: 1.6, marginBottom: 16 }}>
            LOTBO est maintenant sur l'App Store et Google Play.{' '}
            {stats ? (
              <>
                <strong style={{ color: '#C8431A' }}>{stats.total.toLocaleString('fr-FR')}</strong> événements ·{' '}
                <strong style={{ color: '#C8431A' }}>{stats.villes.toLocaleString('fr-FR')}</strong> villes ·{' '}
                <strong style={{ color: '#C8431A' }}>{stats.pays.toLocaleString('fr-FR')}</strong> pays.
              </>
            ) : (
              'Chargement des statistiques…'
            )}
            {' '}Télécharge, partage, et ajoute les événements de ta ville. Ensemble, on couvre le monde. 🌍
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="https://apps.apple.com/us/app/lotbo-local-events/id6779059022"
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1, minWidth: 130 }}
            >
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Télécharger sur l'App Store"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=app.lotbo.app.twa"
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1, minWidth: 130 }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Disponible sur Google Play"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </a>
          </div>
        </div>

        <p style={{
          fontSize: 14,
          color: '#8C5A40',
          lineHeight: 1.7,
          marginBottom: 28,
        }}>
          Ansanm — "ensemble" en kreyòl haïtien — sera l'espace où la communauté LOTBO se voit, se reconnaît et se célèbre.
        </p>

        <div style={{
          background: 'white',
          border: '1px solid #E8E0D0',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'left',
          marginBottom: 28,
        }}>
          <p style={{ fontSize: 12, fontWeight: 'bold', color: '#8C5A40', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Bientôt ici :
          </p>
          {[
            'Votre progression et vos badges',
            'Les contributeurs actifs dans votre ville',
            'Le fil de vie de la communauté',
            'Vos anniversaires et paliers LOTBO célébrés',
            'Votez pour les features que vous voulez voir construire',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ color: '#C8431A', fontSize: 14, flexShrink: 0, marginTop: 1 }}>·</span>
              <p style={{ fontSize: 14, color: '#1A1410', lineHeight: 1.5, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: 13,
          color: '#8C5A40',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          La communauté façonne LOTBO.<br />
          <strong style={{ color: '#C8431A', fontStyle: 'normal' }}>Ansanm, c'est vous.</strong>
        </p>

      </div>
    </main>
  )
}
