'use client'

import { useRouter } from 'next/navigation'

export default function Apropos() {
  const router = useRouter()

  return (
    <main style={{ minHeight: '100dvh', background: '#1A1410', color: '#F7F2E8' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #2a2a2a'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none', border: 'none', color: '#8C5A40',
            fontSize: 13, cursor: 'pointer', padding: 0
          }}>
          ← Retour à la carte
        </button>
        <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 20, fontWeight: 'bold' }}>
          <span style={{ color: '#F7F2E8' }}>lot</span>
          <span style={{ color: '#C8431A' }}>bo</span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12
          }}>Notre histoire</p>
          <h1 style={{
            fontFamily: 'serif', fontStyle: 'italic',
            fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 'bold',
            color: '#F7F2E8', lineHeight: 1.2, marginBottom: 20
          }}>
            Né en Haïti,<br />
            <span style={{ color: '#C8431A' }}>pour le monde entier.</span>
          </h1>
          <p style={{ color: '#E8E0D0', fontSize: 15, lineHeight: 1.8, maxWidth: 560 }}>
            LOTBO est né d'une frustration simple : pourquoi est-il si difficile de savoir ce qui se passe autour de soi ? Concerts, marchés, conférences, célébrations culturelles — ces événements existent, mais restent invisibles faute d'un endroit commun pour les découvrir.
          </p>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 56 }} />

        {/* Mission */}
        <div style={{ marginBottom: 56 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12
          }}>Mission</p>
          <h2 style={{
            fontFamily: 'serif', fontStyle: 'italic',
            fontSize: 'clamp(20px, 3vw, 28px)', color: '#F7F2E8',
            marginBottom: 16
          }}>Tous les événements, un seul endroit.</h2>
          <p style={{ color: '#E8E0D0', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
            LOTBO connecte les organisateurs d'événements avec leur communauté locale — qu'ils soient touristes, voyageurs ou résidents. Notre carte interactive permet à chacun de découvrir ce qui se passe autour de lui, en temps réel, partout dans le monde.
          </p>
          <p style={{ color: '#E8E0D0', fontSize: 15, lineHeight: 1.8 }}>
            La plateforme est ouverte — n'importe qui peut soumettre un événement en 2 minutes. Nous croyons que la culture locale mérite d'être visible, et que les communautés savent mieux que quiconque ce qui se passe chez elles.
          </p>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 56 }} />

        {/* Valeurs */}
        <div style={{ marginBottom: 56 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24
          }}>Nos valeurs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '🌍', titre: 'Local d\'abord', texte: 'Chaque événement a une histoire ancrée dans un lieu. Nous mettons en valeur ce qui se passe près de toi, pas ce qui est populaire en général.' },
              { icon: '🔓', titre: 'Ouvert à tous', texte: 'Organiser ou découvrir un événement ne devrait pas nécessiter de compte, de frais ou de permission. LOTBO est gratuit et ouvert.' },
              { icon: '🤝', titre: 'Confiance communautaire', texte: 'Les événements sont soumis par la communauté et vérifiés par notre équipe. Chacun peut signaler une information incorrecte.' },
              { icon: '🇭🇹', titre: 'Fierté haïtienne', texte: 'Né à Port-au-Prince le 5 mai 2026. L\'Haïti nous a appris que la culture et la vie communautaire sont les vraies richesses d\'un peuple.' },
            ].map((v, i) => (
              <div key={i} style={{
                display: 'flex', gap: 16,
                padding: '20px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #2a2a2a'
              }}>
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{v.icon}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: 15, color: '#F7F2E8', marginBottom: 6 }}>
                    {v.titre}
                  </p>
                  <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.7 }}>
                    {v.texte}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 56 }} />

        {/* Fondateur */}
        <div style={{ marginBottom: 56 }}>
          <p style={{
            color: '#C8431A', fontSize: 11, fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24
          }}>Fondateur</p>
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
            padding: 24, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #2a2a2a'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#C8431A', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 'bold', color: '#F7F2E8'
            }}>H</div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: 17, color: '#F7F2E8', marginBottom: 4 }}>
                Handgod Abraham
              </p>
              <p style={{ color: '#C8431A', fontSize: 12, marginBottom: 12, fontWeight: 'bold' }}>
                Fondateur & CEO · Port-au-Prince, Haïti
              </p>
              <p style={{ color: '#8C5A40', fontSize: 13, lineHeight: 1.7 }}>
                Poète, entrepreneur et citoyen du monde. Handgod a fondé LOTBO avec la conviction que les événements culturels locaux méritent une vitrine mondiale. Il préside également le MOLICAJ — Mouvement Littéraire Culturel et Artistique des Jeunes — et organise le Marathon du Livre chaque année en Haïti.
              </p>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#2a2a2a', marginBottom: 56 }} />

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'serif', fontStyle: 'italic',
            fontSize: 'clamp(20px, 3vw, 28px)', color: '#F7F2E8',
            marginBottom: 12
          }}>Prêt à explorer ?</h2>
          <p style={{ color: '#8C5A40', fontSize: 14, marginBottom: 24 }}>
            Découvre les événements près de toi ou soumets le tien.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{
              background: '#C8431A', color: '#F7F2E8',
              padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none'
            }}>Voir la carte →</a>
            <a href="/ajouter" style={{
              background: 'rgba(255,255,255,0.06)', color: '#F7F2E8',
              border: '1px solid #2a2a2a',
              padding: '12px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 'bold', textDecoration: 'none'
            }}>Soumettre un événement</a>
          </div>
        </div>

      </div>
    </main>
  )
}