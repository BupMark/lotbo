'use client'

import { useEffect, useRef, useState } from 'react'

// ── Palette LOTBO — 6 fonds ───────────────────────────────────────────────────
const FONDS = [
  { id: 'night', label: 'Nuit', bg: '#1A1410', text: '#F7F2E8' },
  { id: 'brique', label: 'Brique', bg: '#C8431A', text: '#F7F2E8' },
  { id: 'creme', label: 'Crème', bg: '#F7F2E8', text: '#1A1410' },
  { id: 'or', label: 'Or', bg: '#D4A820', text: '#1A1410' },
  { id: 'terre', label: 'Terre', bg: '#8C5A40', text: '#F7F2E8' },
  { id: 'vert', label: 'Vert', bg: '#2D9E6B', text: '#F7F2E8' },
]

// ── Expressions prédéfinies ───────────────────────────────────────────────────
const EXPRESSIONS = [
  { id: 'sera_la', emoji: '🙋', texte: 'Je serai là' },
  { id: 'ecoute', emoji: '🎵', texte: "Je l'écoute" },
  { id: 'regarde', emoji: '🎬', texte: 'Je regarde' },
  { id: 'lis', emoji: '📖', texte: 'Je lis' },
  { id: 'place', emoji: '🎟️', texte: "J'ai ma place" },
  { id: 'passe', emoji: '🥂', texte: 'Je passe' },
  { id: 'fete', emoji: '🎉', texte: 'Je fête' },
  { id: 'custom', emoji: '✏️', texte: 'Personnaliser...' },
]

// ── Algorithme contrast ratio ─────────────────────────────────────────────────
function getTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16)
  const g = parseInt(bgHex.slice(3, 5), 16)
  const b = parseInt(bgHex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1A1410' : '#F7F2E8'
}

// ── Générer initiales avatar ──────────────────────────────────────────────────
function getInitiales(nom: string): string {
  return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LB'
}

interface CarteVisuelleProprs {
  evenement: {
    titre: string
    lieu: string
    date: string
    date_fin?: string
    image_url?: string
  }
  expression: string
  onClose: () => void
}

export default function CarteVisuelle({ evenement, expression: expressionInitiale, onClose }: CarteVisuelleProprs) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fondActif, setFondActif] = useState(FONDS[0])
  const [useFotoEvent, setUseFotoEvent] = useState(false)
  const [expressionSelectionnee, setExpressionSelectionnee] = useState(
    EXPRESSIONS.find(e => e.texte === expressionInitiale) || EXPRESSIONS[0]
  )
  const [texteCustom, setTexteCustom] = useState('')
  const [nomUtilisateur, setNomUtilisateur] = useState('Moi')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [etape, setEtape] = useState<'expression' | 'carte'>('expression')
  const [generating, setGenerating] = useState(false)

  // ── Texte final de l'expression ───────────────────────────────────────────
  const texteExpression = expressionSelectionnee.id === 'custom'
    ? (texteCustom || 'Personnalisé')
    : `${expressionSelectionnee.emoji} ${expressionSelectionnee.texte}`

  // ── Formater date ─────────────────────────────────────────────────────────
  const formatDateCourte = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(date)
    } catch { return dateStr }
  }

  const periode = evenement.date_fin && evenement.date_fin !== evenement.date
    ? `${formatDateCourte(evenement.date)} → ${formatDateCourte(evenement.date_fin)}`
    : formatDateCourte(evenement.date)

  // ── Dessiner canvas ───────────────────────────────────────────────────────
  useEffect(() => {
    if (etape !== 'carte') return
    dessinerCarte()
  }, [fondActif, useFotoEvent, texteExpression, etape, nomUtilisateur])

  const dessinerCarte = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1080, H = 1080
    canvas.width = W
    canvas.height = H

    const bgColor = useFotoEvent && evenement.image_url ? '#1A1410' : fondActif.bg
    const textColor = useFotoEvent && evenement.image_url ? '#F7F2E8' : getTextColor(bgColor)

    // ── Fond ──
    if (useFotoEvent && evenement.image_url) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
          img.src = evenement.image_url!
        })
        ctx.drawImage(img, 0, 0, W, H)
        // Overlay sombre
        ctx.fillStyle = 'rgba(26,20,16,0.72)'
        ctx.fillRect(0, 0, W, H)
      } catch {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, W, H)
      }
    } else {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, W, H)
    }

    // ── Logo LOTBO ──
    ctx.font = 'bold italic 52px Georgia, serif'
    ctx.fillStyle = textColor
    ctx.fillText('lot', 60, 100)
    ctx.fillStyle = '#C8431A'
    ctx.fillText('bo', 60 + ctx.measureText('lot').width, 100)

    // ── Avatar utilisateur ──
    const avatarX = W / 2
    const avatarY = 320
    const avatarR = 90

    if (photoUrl) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = photoUrl })
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2)
        ctx.restore()
      } catch {
        dessinerAvatar(ctx, avatarX, avatarY, avatarR, nomUtilisateur, textColor)
      }
    } else {
      dessinerAvatar(ctx, avatarX, avatarY, avatarR, nomUtilisateur, textColor)
    }

    // ── Bordure avatar ──
    ctx.strokeStyle = '#C8431A'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2)
    ctx.stroke()

    // ── Expression ──
    ctx.font = 'bold 48px system-ui, sans-serif'
    // Contraste auto : orange sur fond clair, crème sur fond foncé/brique
    const luminanceBg = useFotoEvent && evenement.image_url ? 0 : (() => {
      const r2 = parseInt(bgColor.slice(1,3),16)
      const g2 = parseInt(bgColor.slice(3,5),16)
      const b2 = parseInt(bgColor.slice(5,7),16)
      return (0.299*r2 + 0.587*g2 + 0.114*b2) / 255
    })()
    ctx.fillStyle = luminanceBg > 0.5 ? '#C8431A' : '#F7F2E8'
    ctx.textAlign = 'center'
    ctx.fillText(texteExpression, W / 2, avatarY + avatarR + 70)

    // ── Séparateur ──
    ctx.fillStyle = textColor === '#F7F2E8' ? 'rgba(247,242,232,0.2)' : 'rgba(26,20,16,0.15)'
    ctx.fillRect(60, avatarY + avatarR + 100, W - 120, 1)

    // ── Titre événement ──
    ctx.font = 'bold italic 56px Georgia, serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    const titre = evenement.titre.length > 36 ? evenement.titre.slice(0, 36) + '…' : evenement.titre
    ctx.fillText(titre, W / 2, avatarY + avatarR + 180)

    // ── Date ──
    ctx.font = '36px system-ui, sans-serif'
    ctx.fillStyle = textColor === '#F7F2E8' ? 'rgba(247,242,232,0.7)' : 'rgba(26,20,16,0.6)'
    ctx.fillText(`📅 ${periode}`, W / 2, avatarY + avatarR + 250)

    // ── Lieu ──
    const lieu = evenement.lieu.length > 44 ? evenement.lieu.slice(0, 44) + '…' : evenement.lieu
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillText(`📍 ${lieu}`, W / 2, avatarY + avatarR + 310)

    // ── Footer ──
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = textColor === '#F7F2E8' ? 'rgba(247,242,232,0.4)' : 'rgba(26,20,16,0.35)'
    ctx.fillText('app.lotbo.app', W / 2, H - 60)

    ctx.textAlign = 'left'
  }

  const dessinerAvatar = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, r: number,
    nom: string, textColor: string
  ) => {
    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = `bold ${r * 0.8}px system-ui, sans-serif`
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(getInitiales(nom), x, y)
    ctx.textBaseline = 'alphabetic'
  }

  // ── Télécharger ───────────────────────────────────────────────────────────
  const telecharger = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const lien = document.createElement('a')
    lien.download = `lotbo-${evenement.titre.slice(0, 20).replace(/\s/g, '-')}.png`
    lien.href = canvas.toDataURL('image/png')
    lien.click()
  }

  // ── Partage natif ─────────────────────────────────────────────────────────
  const partagerNatif = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'lotbo-carte.png', { type: 'image/png' })
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: evenement.titre,
            text: texteExpression + ' · ' + evenement.titre,
            files: [file],
          })
        } else {
          telecharger()
        }
      }, 'image/png')
    } catch { telecharger() }
  }

  // ── URL partage lien ──────────────────────────────────────────────────────
  const urlEvent = typeof window !== 'undefined' ? window.location.href : ''
  const textePartage = encodeURIComponent(`${texteExpression} · ${evenement.titre} — ${urlEvent}`)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <div style={{
        background: '#1A1410', borderRadius: 20,
        width: '100%', maxWidth: 520,
        border: '1px solid #2a2a2a',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #2a2a2a' }}>
          <p style={{ color: '#F7F2E8', fontWeight: 'bold', fontSize: 16 }}>
            {etape === 'expression' ? '🙋 Je serai là' : '🎨 Ma carte'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>

          {/* ── Étape 1 : Sélecteur expression ── */}
          {etape === 'expression' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#8C5A40', fontSize: 13 }}>Comment tu veux exprimer ta présence ?</p>

              {/* Nom utilisateur */}
              <div>
                <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Ton prénom (apparaîtra sur la carte)</label>
                <input
                  value={nomUtilisateur}
                  onChange={e => setNomUtilisateur(e.target.value)}
                  maxLength={30}
                  placeholder="Ton prénom"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #333', borderRadius: 10, padding: '10px 14px', color: '#F7F2E8', fontSize: 14, outline: 'none', width: '100%' }}
                />
              </div>

              {/* Expressions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXPRESSIONS.map(exp => (
                  <button key={exp.id} onClick={() => setExpressionSelectionnee(exp)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                    background: expressionSelectionnee.id === exp.id ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                    border: expressionSelectionnee.id === exp.id ? '1px solid #C8431A' : '1px solid #2a2a2a',
                    color: '#F7F2E8', fontSize: 14, cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 20 }}>{exp.emoji}</span>
                    <span>{exp.texte}</span>
                    {expressionSelectionnee.id === exp.id && <span style={{ marginLeft: 'auto', color: '#C8431A' }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Champ personnalisé */}
              {expressionSelectionnee.id === 'custom' && (
                <input
                  value={texteCustom}
                  onChange={e => setTexteCustom(e.target.value.slice(0, 30))}
                  placeholder="Ton expression (30 caractères max)"
                  maxLength={30}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #C8431A', borderRadius: 10, padding: '10px 14px', color: '#F7F2E8', fontSize: 14, outline: 'none', width: '100%' }}
                />
              )}

              <button onClick={() => setEtape('carte')} style={{
                background: '#C8431A', color: 'white', border: 'none',
                borderRadius: 10, padding: '13px', fontSize: 14,
                fontWeight: 'bold', cursor: 'pointer', marginTop: 8
              }}>
                Créer ma carte →
              </button>
            </div>
          )}

          {/* ── Étape 2 : Carte + sélecteurs ── */}
          {etape === 'carte' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Aperçu canvas */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2a', aspectRatio: '1/1' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>

              {/* Sélecteur fonds */}
              <div>
                <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 10 }}>Fond de la carte</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FONDS.map(f => (
                    <button key={f.id} onClick={() => { setFondActif(f); setUseFotoEvent(false) }} style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: f.bg, border: fondActif.id === f.id && !useFotoEvent ? '3px solid #C8431A' : '3px solid transparent',
                      cursor: 'pointer', flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }} title={f.label} />
                  ))}
                  {evenement.image_url && (
                    <button onClick={() => setUseFotoEvent(true)} style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundImage: `url(${evenement.image_url})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: useFotoEvent ? '3px solid #C8431A' : '3px solid transparent',
                      cursor: 'pointer', flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }} title="Photo événement" />
                  )}
                </div>
              </div>

              {/* Modifier expression */}
              <button onClick={() => setEtape('expression')} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid #333',
                borderRadius: 10, padding: '10px', color: '#8C5A40',
                fontSize: 13, cursor: 'pointer'
              }}>
                ← Modifier l'expression
              </button>

              {/* Boutons partage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: '#8C5A40', fontSize: 12 }}>Partager</p>

                {/* Télécharger */}
                <button onClick={telecharger} style={{
                  background: '#C8431A', color: 'white', border: 'none',
                  borderRadius: 10, padding: '13px', fontSize: 14,
                  fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  ⬇️ Télécharger l'image
                </button>

                {/* Partage natif mobile */}
                {typeof window !== 'undefined' && 'share' in navigator && (
                  <button onClick={partagerNatif} style={{
                    background: 'rgba(255,255,255,0.08)', color: '#F7F2E8',
                    border: '1px solid #333', borderRadius: 10, padding: '13px',
                    fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    📤 Partager (mobile)
                  </button>
                )}

                {/* Boutons réseaux */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`https://wa.me/?text=${textePartage}`} target="_blank" style={{
                    flex: 1, background: '#25D366', color: 'white', borderRadius: 10,
                    padding: '11px', fontSize: 13, fontWeight: 'bold',
                    textDecoration: 'none', textAlign: 'center'
                  }}>WhatsApp</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlEvent)}`} target="_blank" style={{
                    flex: 1, background: '#1877F2', color: 'white', borderRadius: 10,
                    padding: '11px', fontSize: 13, fontWeight: 'bold',
                    textDecoration: 'none', textAlign: 'center'
                  }}>Facebook</a>
                  <a href={`https://twitter.com/intent/tweet?text=${textePartage}`} target="_blank" style={{
                    flex: 1, background: '#000', color: 'white', borderRadius: 10,
                    padding: '11px', fontSize: 13, fontWeight: 'bold',
                    textDecoration: 'none', textAlign: 'center'
                  }}>𝕏</a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlEvent)}`} target="_blank" style={{
                    flex: 1, background: '#0A66C2', color: 'white', borderRadius: 10,
                    padding: '11px', fontSize: 13, fontWeight: 'bold',
                    textDecoration: 'none', textAlign: 'center'
                  }}>in</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
