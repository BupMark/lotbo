'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const VALEURS = [
  {
    icon: '🌍',
    titre: 'Local d\'abord',
    texte: 'Chaque événement a une histoire ancrée dans un lieu. Nous mettons en valeur ce qui se passe près de toi, pas ce qui est populaire en général.',
    color: '#C8431A',
    bg: 'rgba(200,67,26,0.06)',
  },
  {
    icon: '🔓',
    titre: 'Ouvert à tous',
    texte: 'Organiser ou découvrir un événement ne devrait pas nécessiter de compte, de frais ou de permission. LOTBO est gratuit et ouvert.',
    color: '#2D9E6B',
    bg: 'rgba(45,158,107,0.06)',
  },
  {
    icon: '🤝',
    titre: 'Confiance communautaire',
    texte: 'Les événements sont soumis par la communauté et vérifiés par notre équipe. Chacun peut signaler une information incorrecte.',
    color: '#D4A820',
    bg: 'rgba(212,168,32,0.06)',
  },
  {
    icon: '🇭🇹',
    titre: 'Fierté haïtienne',
    texte: 'Né à Petit-Goâve le 5 mai 2026. L\'Haïti nous a appris que la culture et la vie communautaire sont les vraies richesses d\'un peuple.',
    color: '#C8431A',
    bg: 'rgba(200,67,26,0.06)',
  },
]

export default function Apropos() {
  const router = useRouter()
  const [stats, setStats] = useState<{ total: number; villes: number; pays: number } | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  const fmt = (n: number) => n > 0 ? `${n}+` : '…'

  const STATS = [
    { valeur: stats ? fmt(stats.total)  : '…', label: 'Événements soumis'  },
    { valeur: stats ? fmt(stats.villes) : '…', label: 'Villes couvertes'   },
    { valeur: stats ? fmt(stats.pays)   : '…', label: 'Pays'               },
    { valeur: '5',                              label: 'Langues supportées' },
  ]

  return (
    <main style={{ minHeight: '100dvh', background: '#F7F2E8', color: '#1A1410', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 32px', borderBottom: '1px solid #E8E0D0',
        background: '#F7F2E8', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: 'none', border: 'none', color: '#8C5A40',
          fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6
        }}>← Retour</button>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 'bold' }}>
          <span style={{ color: '#1A1410' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <a href="/ajouter" style={{
          background: '#C8431A', color: 'white', padding: '8px 18px',
          borderRadius: 8, fontSize: 13, fontWeight: 'bold', textDecoration: 'none'
        }}>+ Ajouter</a>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1A1410', color: '#F7F2E8',
        padding: 'clamp(48px, 8vw, 96px) clamp(24px, 5vw, 80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48, alignItems: 'center'
          }}>
            {/* Texte */}
            <div>
              <p style={{
                color: '#C8431A', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16
              }}>Notre histoire</p>
              <h1 style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700,
                color: '#F7F2E8', lineHeight: 1.15, marginBottom: 24
              }}>
                Né en Haïti,<br />
                <span style={{ color: '#C8431A' }}>pour le monde entier.</span>
              </h1>
              <p style={{ color: 'rgba(247,242,232,0.7)', fontSize: 16, lineHeight: 1.8, marginBottom: 16, maxWidth: 520 }}>
                Les événements existent. La vie locale existe. Mais elle reste invisible.
                Lotbo est né de cette frustration — une plateforme unique où tout ce qui
                se passe près de toi est visible, accessible, en un seul endroit.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
                <a href="/" style={{
                  background: '#C8431A', color: 'white',
                  padding: '12px 24px', borderRadius: 10,
                  fontSize: 14, fontWeight: 'bold', textDecoration: 'none'
                }}>Voir les événements →</a>
                <a href="/ajouter" style={{
                  background: 'rgba(255,255,255,0.08)', color: '#F7F2E8',
                  border: '1px solid rgba(247,242,232,0.2)',
                  padding: '12px 24px', borderRadius: 10,
                  fontSize: 14, fontWeight: 'bold', textDecoration: 'none'
                }}>Soumettre un événement</a>
              </div>
            </div>

            {/* Stats dynamiques */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16
            }}>
              {STATS.map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(247,242,232,0.1)',
                  borderRadius: 16, padding: '28px 20px', textAlign: 'center'
                }}>
                  <p style={{
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700,
                    color: '#C8431A', marginBottom: 6, lineHeight: 1
                  }}>{s.valeur}</p>
                  <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: 12, lineHeight: 1.4 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 48, alignItems: 'center'
          }}>
            <div>
              <p style={{
                color: '#C8431A', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16
              }}>Mission</p>
              <h2 style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 'clamp(24px, 3vw, 36px)', color: '#1A1410',
                lineHeight: 1.3, marginBottom: 20
              }}>
                Tous les événements,<br />un seul endroit.
              </h2>
            </div>
            <div>
              <p style={{ color: '#8C5A40', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>
                LOTBO connecte les organisateurs d'événements avec leur communauté locale,
                qu'ils soient touristes, voyageurs ou résidents. Notre carte interactive permet
                à chacun de découvrir ce qui se passe autour de lui, en temps réel, partout dans le monde.
              </p>
              <p style={{ color: '#8C5A40', fontSize: 15, lineHeight: 1.85 }}>
                La plateforme est ouverte. N'importe qui peut soumettre un événement en 2 minutes.
                Nous croyons que la culture locale mérite d'être visible, et que les communautés
                savent mieux que quiconque ce qui se passe chez elles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ──────────────────────────────────────────────────────── */}
      <section style={{
        background: 'white', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        borderTop: '1px solid #E8E0D0', borderBottom: '1px solid #E8E0D0'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12
          }}>Nos valeurs</p>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 'clamp(22px, 3vw, 32px)', color: '#1A1410',
            marginBottom: 40
          }}>Ce en quoi nous croyons.</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20
          }}>
            {VALEURS.map((v, i) => (
              <div key={i} style={{
                background: v.bg,
                border: `1px solid ${v.color}22`,
                borderRadius: 16, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <span style={{ fontSize: 32 }}>{v.icon}</span>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#1A1410' }}>{v.titre}</p>
                <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.7 }}>{v.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fondateur ────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 40
          }}>Fondateur</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 40, alignItems: 'center'
          }}>
            {/* Photo */}
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid #E8E0D0',
              height: 'clamp(300px, 40vw, 480px)',
              boxShadow: '0 8px 40px rgba(26,20,16,0.12)'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-fondateur.jpg"
                alt="Handgod Abraham"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              />
            </div>

            {/* Bio */}
            <div>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: 'clamp(24px, 3vw, 36px)', color: '#1A1410',
                marginBottom: 4, lineHeight: 1.2
              }}>Handgod Abraham</h3>
              <p style={{ color: '#C8431A', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
                Fondateur · Petit-Goâve, Haïti 🇭🇹
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: '#8C5A40', fontSize: 15, lineHeight: 1.85 }}>
                  Poète, entrepreneur et citoyen du monde. Handgod a fondé LOTBO avec la
                  conviction que les événements culturels locaux méritent une vitrine mondiale.
                </p>
                <p style={{ color: '#8C5A40', fontSize: 15, lineHeight: 1.85 }}>
                  Directeur de Stratégie Digital chez Bup Mark, agence de marketing digital
                  international. Il préside des événements culturels comme le Marathon du Livre
                  chaque année en Haïti.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
                {[
                  { label: '🗺️ Lotbo', href: '/' },
                  { label: '🏢 Bup Mark', href: 'https://bup-mark.com' },
                ].map(l => (
                  <a key={l.label} href={l.href} style={{
                    background: '#F7F2E8', border: '1px solid #E8E0D0',
                    color: '#1A1410', padding: '8px 16px', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, textDecoration: 'none'
                  }}>{l.label}</a>
                ))}
                <a href="https://www.linkedin.com/in/handgod-abraham-003140153/"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#F7F2E8', border: '1px solid #E8E0D0',
                    color: '#0A66C2', padding: '8px 16px', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, textDecoration: 'none'
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Voir le profil LinkedIn →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1A1410', color: '#F7F2E8',
        padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p style={{ color: '#C8431A', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            Kisa k'ap pase lotbo?
          </p>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: 'clamp(28px, 4vw, 44px)', color: '#F7F2E8',
            lineHeight: 1.2, marginBottom: 16
          }}>
            Prêt à explorer ?
          </h2>
          <p style={{ color: 'rgba(247,242,232,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            Découvre les événements près de toi ou partage le tien avec le monde.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{
              background: '#C8431A', color: 'white',
              padding: '14px 32px', borderRadius: 10,
              fontSize: 15, fontWeight: 'bold', textDecoration: 'none'
            }}>Voir la carte →</a>
            <a href="/ajouter" style={{
              background: 'rgba(255,255,255,0.08)', color: '#F7F2E8',
              border: '1px solid rgba(247,242,232,0.2)',
              padding: '14px 32px', borderRadius: 10,
              fontSize: 15, fontWeight: 'bold', textDecoration: 'none'
            }}>Soumettre un événement</a>
          </div>
          <p style={{ color: 'rgba(247,242,232,0.3)', fontSize: 12, marginTop: 40 }}>
            Un produit de <strong style={{ color: 'rgba(247,242,232,0.5)' }}>Bup Mark Ltd</strong> · Manchester, UK · Né en Haïti 🇭🇹
          </p>
        </div>
      </section>

    </main>
  )
}
