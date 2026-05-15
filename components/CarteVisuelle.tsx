'use client'

import { useEffect, useRef, useState } from 'react'

// ── Palette LOTBO ─────────────────────────────────────────────────────────────
const FONDS = [
  { id: 'creme', label: 'Crème', bg: '#F7F2E8' },
  { id: 'night', label: 'Nuit', bg: '#1A1410' },
  { id: 'brique', label: 'Brique', bg: '#C8431A' },
  { id: 'or', label: 'Or', bg: '#D4A820' },
  { id: 'terre', label: 'Terre', bg: '#8C5A40' },
  { id: 'vert', label: 'Vert', bg: '#2D9E6B' },
]

// ── Expressions ───────────────────────────────────────────────────────────────
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

// ── Dispositions ──────────────────────────────────────────────────────────────
type Disposition = 'centree' | 'split' | 'paysage'
const DISPOSITIONS: { id: Disposition; label: string; icon: string; size: string }[] = [
  { id: 'centree', label: 'Centrée', icon: '⬛', size: '1080×1080' },
  { id: 'split', label: 'Split', icon: '◧', size: '1080×1080' },
  { id: 'paysage', label: 'Paysage', icon: '▬', size: '1200×630' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function getTextColor(bg: string): string {
  return getLuminance(bg) > 0.5 ? '#1A1410' : '#F7F2E8'
}

function getExpressionColor(bg: string, useFoto: boolean): string {
  if (useFoto) return '#F7F2E8'
  return getLuminance(bg) > 0.5 ? '#C8431A' : '#F7F2E8'
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LB'
}

function formatDateCourte(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(date)
  } catch { return dateStr }
}

async function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else { current = test }
  }
  if (current) lines.push(current)
  return lines
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
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

export default function CarteVisuelle({ evenement, expression: expressionInitiale, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fondActif, setFondActif] = useState(FONDS[0])
  const [useFotoEvent, setUseFotoEvent] = useState(false)
  const [expressionSelectionnee, setExpressionSelectionnee] = useState(
    EXPRESSIONS.find(e => e.texte === expressionInitiale) || EXPRESSIONS[0]
  )
  const [texteCustom, setTexteCustom] = useState('')
  const [nomUtilisateur, setNomUtilisateur] = useState('Moi')
  const [disposition, setDisposition] = useState<Disposition>('centree')
  const [etape, setEtape] = useState<'expression' | 'carte'>('expression')

  const texteExpression = expressionSelectionnee.id === 'custom'
    ? (texteCustom || 'Personnalisé')
    : `${expressionSelectionnee.emoji} ${expressionSelectionnee.texte}`

  const periode = evenement.date_fin && evenement.date_fin !== evenement.date
    ? `${formatDateCourte(evenement.date)} → ${formatDateCourte(evenement.date_fin)}`
    : formatDateCourte(evenement.date)

  // ── Détection auto disposition selon format photo ─────────────────────────
  useEffect(() => {
    if (!evenement.image_url) { setDisposition('centree'); return }
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > img.naturalHeight * 1.2) setDisposition('paysage')
      else if (img.naturalHeight > img.naturalWidth * 1.1) setDisposition('split')
      else setDisposition('centree')
    }
    img.src = evenement.image_url
  }, [evenement.image_url])

  // ── Redessiner quand params changent ─────────────────────────────────────
  useEffect(() => {
    if (etape !== 'carte') return
    dessinerCarte()
  }, [fondActif, useFotoEvent, texteExpression, etape, nomUtilisateur, disposition])

  // ── Canvas dimensions selon disposition ───────────────────────────────────
  const getDimensions = () => {
    if (disposition === 'paysage') return { W: 1200, H: 630 }
    return { W: 1080, H: 1080 }
  }

  // ── Dessiner avatar (initiales) ───────────────────────────────────────────
  const dessinerAvatar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.save()
    ctx.fillStyle = '#C8431A'
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.font = `bold ${Math.round(r * 0.75)}px system-ui, sans-serif`
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(getInitiales(nomUtilisateur), x, y)
    ctx.textBaseline = 'alphabetic'; ctx.restore()
    // Bordure
    ctx.strokeStyle = '#C8431A'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.stroke()
  }

  // ── Logo LOTBO ────────────────────────────────────────────────────────────
  const dessinerLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, textColor: string) => {
    ctx.font = `bold italic ${size}px Georgia, serif`
    ctx.fillStyle = textColor; ctx.textAlign = 'left'
    ctx.fillText('lot', x, y)
    const w = ctx.measureText('lot').width
    ctx.fillStyle = '#C8431A'
    ctx.fillText('bo', x + w, y)
  }

  // ── DISPOSITION 1 : Centrée ───────────────────────────────────────────────
  const dessinerCentree = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const bgColor = useFotoEvent && evenement.image_url ? '#1A1410' : fondActif.bg
    const textColor = useFotoEvent && evenement.image_url ? '#F7F2E8' : getTextColor(bgColor)
    const exprColor = getExpressionColor(bgColor, useFotoEvent && !!evenement.image_url)

    // Fond
    if (useFotoEvent && evenement.image_url) {
      try {
        const img = await chargerImage(evenement.image_url)
        ctx.drawImage(img, 0, 0, W, H)
        ctx.fillStyle = 'rgba(26,20,16,0.72)'; ctx.fillRect(0, 0, W, H)
      } catch { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H) }
    } else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H) }

    // Logo
    dessinerLogo(ctx, 60, 100, 48, textColor)

    // Avatar
    const avatarX = W / 2, avatarY = 340, avatarR = 90
    dessinerAvatar(ctx, avatarX, avatarY, avatarR)

    // Expression
    ctx.font = 'bold 46px system-ui, sans-serif'
    ctx.fillStyle = exprColor; ctx.textAlign = 'center'
    ctx.fillText(texteExpression, W / 2, avatarY + avatarR + 72)

    // Séparateur
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.12)'
    ctx.fillRect(80, avatarY + avatarR + 100, W - 160, 1)

    // Titre
    ctx.font = 'bold italic 52px Georgia, serif'
    ctx.fillStyle = textColor; ctx.textAlign = 'center'
    const titreLines = wrapText(ctx, evenement.titre, W - 120)
    titreLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, W / 2, avatarY + avatarR + 170 + i * 62))

    const baseY = avatarY + avatarR + 170 + Math.min(titreLines.length, 2) * 62

    // Date
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    const dateDisplay = periode.length > 40 ? periode.slice(0, 40) + '…' : periode
    ctx.fillText(`📅 ${dateDisplay}`, W / 2, baseY + 20)

    // Lieu
    ctx.font = '30px system-ui, sans-serif'
    const lieuDisplay = evenement.lieu.length > 46 ? evenement.lieu.slice(0, 46) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, W / 2, baseY + 65)

    // Footer
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.3)'
    ctx.fillText('app.lotbo.app', W / 2, H - 55)
    ctx.textAlign = 'left'
  }

  // ── DISPOSITION 2 : Split ─────────────────────────────────────────────────
  const dessinerSplit = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const bgColor = fondActif.bg
    const textColor = getTextColor(bgColor)
    const exprColor = getExpressionColor(bgColor, false)
    const photoW = Math.round(W * 0.42)

    // Photo gauche
    if (evenement.image_url) {
      try {
        const img = await chargerImage(evenement.image_url)
        ctx.save()
        ctx.beginPath(); ctx.rect(0, 0, photoW, H); ctx.clip()
        ctx.drawImage(img, 0, 0, photoW, H)
        ctx.restore()
      } catch {
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, photoW, H)
      }
    } else {
      ctx.fillStyle = '#C8431A'; ctx.fillRect(0, 0, photoW, H)
      dessinerLogo(ctx, 40, H / 2, 52, '#F7F2E8')
    }

    // Fond droite
    ctx.fillStyle = bgColor; ctx.fillRect(photoW, 0, W - photoW, H)

    // Contenu droite
    const rx = photoW + 48, rw = W - photoW - 96
    ctx.textAlign = 'left'

    // Logo droite
    dessinerLogo(ctx, rx, 90, 40, textColor)

    // Avatar
    const avatarX = rx + 52, avatarY = 210, avatarR = 52
    dessinerAvatar(ctx, avatarX, avatarY, avatarR)

    // Expression
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillStyle = exprColor
    ctx.fillText(texteExpression, rx, avatarY + avatarR + 52)

    // Séparateur
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.12)'
    ctx.fillRect(rx, avatarY + avatarR + 72, rw, 1)

    // Titre
    ctx.font = 'bold italic 44px Georgia, serif'
    ctx.fillStyle = textColor
    const titreLines = wrapText(ctx, evenement.titre, rw)
    titreLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, rx, avatarY + avatarR + 130 + i * 54))

    const baseY = avatarY + avatarR + 130 + Math.min(titreLines.length, 3) * 54

    // Date
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    const dateShort = formatDateCourte(evenement.date).replace(/^[a-zA-ZÀ-ÿ]+ /, '')
    ctx.fillText(`📅 ${dateShort}`, rx, baseY + 20)

    const lieuDisplay = evenement.lieu.length > 32 ? evenement.lieu.slice(0, 32) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, rx, baseY + 60)

    // Footer
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.3)'
    ctx.fillText('app.lotbo.app', rx, H - 50)
    ctx.textAlign = 'left'
  }

  // ── DISPOSITION 3 : Paysage ───────────────────────────────────────────────
  const dessinerPaysage = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const photoH = Math.round(H * 0.58)
    const bgColor = fondActif.bg
    const textColor = getTextColor(bgColor)
    const exprColor = getExpressionColor(bgColor, false)

    // Photo haut
    if (evenement.image_url) {
      try {
        const img = await chargerImage(evenement.image_url)
        ctx.drawImage(img, 0, 0, W, photoH)
        ctx.fillStyle = 'rgba(26,20,16,0.35)'; ctx.fillRect(0, 0, W, photoH)
      } catch {
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, W, photoH)
      }
    } else {
      ctx.fillStyle = '#C8431A'; ctx.fillRect(0, 0, W, photoH)
    }

    // Bande infos bas
    ctx.fillStyle = bgColor; ctx.fillRect(0, photoH, W, H - photoH)

    // Logo sur photo
    dessinerLogo(ctx, 48, 72, 44, '#F7F2E8')

    // Avatar sur photo (bas gauche)
    const avatarX = 80, avatarY = photoH - 60, avatarR = 52
    dessinerAvatar(ctx, avatarX, avatarY, avatarR)

    // Expression sur photo
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'; ctx.textAlign = 'left'
    ctx.fillText(texteExpression, avatarX + avatarR + 20, avatarY + 12)

    // Contenu bande bas
    const by = photoH + 36
    ctx.textAlign = 'left'

    // Titre
    ctx.font = 'bold italic 48px Georgia, serif'
    ctx.fillStyle = textColor
    const titreLines = wrapText(ctx, evenement.titre, W - 96)
    titreLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 48, by + i * 56))

    const baseY = by + Math.min(titreLines.length, 2) * 56

    // Date + Lieu inline
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    const dateShort = formatDateCourte(evenement.date).replace(/^[a-zA-ZÀ-ÿ]+ /, '')
    const lieuDisplay = evenement.lieu.length > 38 ? evenement.lieu.slice(0, 38) + '…' : evenement.lieu
    ctx.fillText(`📅 ${dateShort}  ·  📍 ${lieuDisplay}`, 48, baseY + 24)

    // Footer droite
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bgColor) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.3)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 48, H - 24)
    ctx.textAlign = 'left'
  }

  // ── Orchestrateur principal ───────────────────────────────────────────────
  const dessinerCarte = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { W, H } = getDimensions()
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)

    if (disposition === 'split') await dessinerSplit(ctx, W, H)
    else if (disposition === 'paysage') await dessinerPaysage(ctx, W, H)
    else await dessinerCentree(ctx, W, H)
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
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'lotbo-carte.png', { type: 'image/png' })
      try {
        if (typeof window !== 'undefined' && 'share' in navigator && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: evenement.titre, text: texteExpression + ' · ' + evenement.titre, files: [file] })
        } else { telecharger() }
      } catch { telecharger() }
    }, 'image/png')
  }

  const urlEvent = typeof window !== 'undefined' ? window.location.href : ''
  const textePartage = encodeURIComponent(`${texteExpression} · ${evenement.titre} — ${urlEvent}`)

  // ── Ratio canvas pour aperçu ──────────────────────────────────────────────
  const { W: cW, H: cH } = getDimensions()
  const aspectRatio = `${cW}/${cH}`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <div style={{
        background: '#1A1410', borderRadius: 20, width: '100%', maxWidth: 520,
        border: '1px solid #2a2a2a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #2a2a2a' }}>
          <p style={{ color: '#F7F2E8', fontWeight: 'bold', fontSize: 16 }}>
            {etape === 'expression' ? '🙋 Je serai là' : '🎨 Ma carte'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>

          {/* ── Étape 1 : Expression ── */}
          {etape === 'expression' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#8C5A40', fontSize: 13 }}>Comment tu veux exprimer ta présence ?</p>
              <div>
                <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Ton prénom</label>
                <input value={nomUtilisateur} onChange={e => setNomUtilisateur(e.target.value)} maxLength={30}
                  placeholder="Ton prénom"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #333', borderRadius: 10, padding: '10px 14px', color: '#F7F2E8', fontSize: 14, outline: 'none', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXPRESSIONS.map(exp => (
                  <button key={exp.id} onClick={() => setExpressionSelectionnee(exp)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, textAlign: 'left',
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
              {expressionSelectionnee.id === 'custom' && (
                <input value={texteCustom} onChange={e => setTexteCustom(e.target.value.slice(0, 30))}
                  placeholder="Ton expression (30 caractères max)" maxLength={30}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #C8431A', borderRadius: 10, padding: '10px 14px', color: '#F7F2E8', fontSize: 14, outline: 'none', width: '100%' }} />
              )}
              <button onClick={() => setEtape('carte')} style={{
                background: '#C8431A', color: 'white', border: 'none', borderRadius: 10,
                padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginTop: 8
              }}>Créer ma carte →</button>
            </div>
          )}

          {/* ── Étape 2 : Carte ── */}
          {etape === 'carte' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Aperçu canvas */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2a', aspectRatio }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>

              {/* Sélecteur disposition */}
              <div>
                <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Disposition</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DISPOSITIONS.map(d => (
                    <button key={d.id} onClick={() => setDisposition(d.id)} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                      background: disposition === d.id ? 'rgba(200,67,26,0.15)' : 'rgba(255,255,255,0.04)',
                      border: disposition === d.id ? '1px solid #C8431A' : '1px solid #2a2a2a',
                      color: disposition === d.id ? '#C8431A' : '#8C5A40',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                    }}>
                      <span style={{ fontSize: 18 }}>{d.icon}</span>
                      <span style={{ fontWeight: 'bold' }}>{d.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{d.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur fonds */}
              <div>
                <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Fond</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FONDS.map(f => (
                    <button key={f.id} onClick={() => { setFondActif(f); setUseFotoEvent(false) }} style={{
                      width: 38, height: 38, borderRadius: '50%', background: f.bg,
                      border: fondActif.id === f.id && !useFotoEvent ? '3px solid #C8431A' : '3px solid transparent',
                      cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }} title={f.label} />
                  ))}
                  {evenement.image_url && (
                    <button onClick={() => setUseFotoEvent(true)} style={{
                      width: 38, height: 38, borderRadius: '50%',
                      backgroundImage: `url(${evenement.image_url})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: useFotoEvent ? '3px solid #C8431A' : '3px solid transparent',
                      cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }} title="Photo événement" />
                  )}
                </div>
              </div>

              <button onClick={() => setEtape('expression')} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid #333',
                borderRadius: 10, padding: '10px', color: '#8C5A40', fontSize: 13, cursor: 'pointer'
              }}>← Modifier l'expression</button>

              {/* Partage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: '#8C5A40', fontSize: 12 }}>Partager</p>
                <button onClick={telecharger} style={{
                  background: '#C8431A', color: 'white', border: 'none', borderRadius: 10,
                  padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>⬇️ Télécharger l'image</button>
                {typeof window !== 'undefined' && 'share' in navigator && (
                  <button onClick={partagerNatif} style={{
                    background: 'rgba(255,255,255,0.08)', color: '#F7F2E8',
                    border: '1px solid #333', borderRadius: 10, padding: '13px',
                    fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>📤 Partager (mobile)</button>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`https://wa.me/?text=${textePartage}`} target="_blank" style={{ flex: 1, background: '#25D366', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>WhatsApp</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlEvent)}`} target="_blank" style={{ flex: 1, background: '#1877F2', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>Facebook</a>
                  <a href={`https://twitter.com/intent/tweet?text=${textePartage}`} target="_blank" style={{ flex: 1, background: '#000', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>𝕏</a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlEvent)}`} target="_blank" style={{ flex: 1, background: '#0A66C2', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>in</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
