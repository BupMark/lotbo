'use client'

import { useEffect, useRef, useState } from 'react'

// ── Traductions GM13 ──────────────────────────────────────────────────────────
const T: Record<string, { titre: string; partager: string; telecharger: string; fermer: string; expressions: Record<string, string> }> = {
  fr: {
    titre:      'Mon badge LOTBO',
    partager:   'Partager ce badge',
    telecharger:'Télécharger',
    fermer:     'Fermer',
    expressions: {
      legende:          'Je suis Légende LOTBO',
      elite:            'Je suis Élite LOTBO',
      top_contributeur: 'Je suis Top Contributeur LOTBO',
      contributeur:     'Je suis Contributeur LOTBO',
      actif:            'Je suis Actif sur LOTBO',
      decouvreur:       'Je découvre LOTBO',
    }
  },
  en: {
    titre:      'My LOTBO Badge',
    partager:   'Share this badge',
    telecharger:'Download',
    fermer:     'Close',
    expressions: {
      legende:          "I'm LOTBO's Legend",
      elite:            "I'm LOTBO Elite",
      top_contributeur: "I'm a LOTBO Top Contributor",
      contributeur:     "I'm a LOTBO Contributor",
      actif:            "I'm active on LOTBO",
      decouvreur:       "I'm discovering LOTBO",
    }
  },
  es: {
    titre:      'Mi insignia LOTBO',
    partager:   'Compartir esta insignia',
    telecharger:'Descargar',
    fermer:     'Cerrar',
    expressions: {
      legende:          'Soy Leyenda de LOTBO',
      elite:            'Soy Élite de LOTBO',
      top_contributeur: 'Soy Top Contribuidor de LOTBO',
      contributeur:     'Soy Contribuidor de LOTBO',
      actif:            'Estoy activo en LOTBO',
      decouvreur:       'Estoy descubriendo LOTBO',
    }
  },
  pt: {
    titre:      'O meu badge LOTBO',
    partager:   'Partilhar este badge',
    telecharger:'Transferir',
    fermer:     'Fechar',
    expressions: {
      legende:          'Sou Lenda do LOTBO',
      elite:            'Sou Elite do LOTBO',
      top_contributeur: 'Sou Top Contribuidor do LOTBO',
      contributeur:     'Sou Contribuidor do LOTBO',
      actif:            'Estou ativo no LOTBO',
      decouvreur:       'Estou a descobrir o LOTBO',
    }
  },
  ht: {
    titre:      'Badge LOTBO mwen',
    partager:   'Pataje badge sa',
    telecharger:'Telechaje',
    fermer:     'Fèmen',
    expressions: {
      legende:          'Mwen se Léjann LOTBO',
      elite:            'Mwen se Elit LOTBO',
      top_contributeur: 'Mwen se Top Kontribitè LOTBO',
      contributeur:     'Mwen se Kontribitè LOTBO',
      actif:            'Mwen aktif sou LOTBO',
      decouvreur:       'Mwen ap dekouvri LOTBO',
    }
  },
}

const FONDS_PALETTE = [
  { id: 'creme',  bg: '#F7F2E8', label: 'Crème'  },
  { id: 'night',  bg: '#1A1410', label: 'Nuit'   },
  { id: 'brique', bg: '#C8431A', label: 'Brique' },
  { id: 'or',     bg: '#D4A820', label: 'Or'     },
  { id: 'terre',  bg: '#8C5A40', label: 'Terre'  },
  { id: 'vert',   bg: '#2D9E6B', label: 'Vert'   },
]

type Format = '1080x1080' | '1200x630' | '1080x1920'
const FORMATS: { id: Format; label: string; icon: string; W: number; H: number }[] = [
  { id: '1080x1080', label: 'Carré',   icon: '⬛', W: 1080, H: 1080 },
  { id: '1200x630',  label: 'Paysage', icon: '▬',  W: 1200, H: 630  },
  { id: '1080x1920', label: 'Story',   icon: '▮',  W: 1080, H: 1920 },
]

interface Props {
  badge: { emoji: string; label: string; desc: string; id: string }
  nom: string
  photoProfil?: string | null
  points?: number
  onClose: () => void
}

// ── Helpers canvas ────────────────────────────────────────────────────────────
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function getTextColor(bg: string): string {
  return getLuminance(bg) > 0.5 ? '#1A1410' : '#F7F2E8'
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LB'
}

async function chargerImage(src: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload  = () => resolve(img)
      img.onerror = () => reject(null)
      img.src = src
    })
  } catch { return null }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); current = word
    } else { current = test }
  }
  if (current) lines.push(current)
  return lines
}

async function dessinerAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  photoUrl: string | null, initiales: string, borderColor: string
) {
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  if (photoUrl) {
    const img = await chargerImage(photoUrl)
    if (img) { ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore() }
    else { ctx.fillStyle = '#C8431A'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.restore() }
  } else {
    ctx.fillStyle = '#C8431A'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.restore()
    ctx.font = `bold ${Math.round(r * 0.75)}px system-ui`
    ctx.fillStyle = '#F7F2E8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(initiales, cx, cy)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.strokeStyle = borderColor; ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.stroke()
}

function dessinerLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, textColor: string) {
  ctx.save(); ctx.textAlign = 'left'
  ctx.font = `bold italic ${size}px Georgia, serif`
  ctx.fillStyle = textColor; ctx.fillText('lot', x, y)
  const lotW = ctx.measureText('lot').width
  ctx.fillStyle = '#C8431A'; ctx.fillText('bo', x + lotW, y)
  ctx.restore()
}

export default function CarteBadge({ badge, nom, photoProfil, points, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fond, setFond]       = useState(FONDS_PALETTE[0])
  const [format, setFormat]   = useState<Format>('1080x1080')
  const [locale, setLocale]   = useState('fr')

  // Détecter la langue du navigateur
  useEffect(() => {
    const l = navigator.language.slice(0, 2)
    if (['en', 'es', 'pt', 'ht'].includes(l)) setLocale(l)
  }, [])

  useEffect(() => { dessiner() }, [fond, format, locale])

  const t = T[locale] || T['fr']
  const expression = (t.expressions as Record<string, string>)[badge.id] || t.expressions['decouvreur']
  const { W, H } = FORMATS.find(f => f.id === format)!
  const aspectRatio = `${W}/${H}`
  const bg        = fond.bg
  const textColor = getTextColor(bg)
  const initiales = getInitiales(nom)

  const dessiner = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { W: cW, H: cH } = FORMATS.find(f => f.id === format)!
    canvas.width = cW; canvas.height = cH
    ctx.clearRect(0, 0, cW, cH)

    // Fond
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cW, cH)

    // Cercles décoratifs
    ctx.globalAlpha = 0.06
    ctx.fillStyle = getLuminance(bg) < 0.5 ? '#F7F2E8' : '#1A1410'
    ctx.beginPath(); ctx.arc(cW * 0.85, cH * 0.15, cW * 0.3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cW * 0.1,  cH * 0.85, cW * 0.2, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1

    if (format === '1080x1080') {
      // ── Carré ──
      dessinerLogo(ctx, 60, 90, 44, textColor)

      // Badge central
      const badgeFontSize = 160
      ctx.font = `${badgeFontSize}px serif`
      ctx.textAlign = 'center'
      ctx.fillText(badge.emoji, cW / 2, 380)

      // Cercle autour du badge
      ctx.strokeStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.1)'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(cW / 2, 310, 180, 0, Math.PI * 2); ctx.stroke()

      // Titre badge
      ctx.font = 'bold italic 64px Georgia, serif'
      ctx.fillStyle = textColor; ctx.textAlign = 'center'
      ctx.fillText(badge.label, cW / 2, 470)

      // Desc badge
      ctx.font = '32px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.6)' : 'rgba(26,20,16,0.5)'
      ctx.fillText(badge.desc, cW / 2, 520)

      // Séparateur
      ctx.strokeStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.2)' : 'rgba(26,20,16,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(120, 570); ctx.lineTo(cW - 120, 570); ctx.stroke()

      // Avatar + nom
      await dessinerAvatar(ctx, cW / 2, 700, 80, photoProfil || null, initiales, '#C8431A')
      ctx.font = 'bold 40px system-ui'
      ctx.fillStyle = textColor; ctx.textAlign = 'center'
      ctx.fillText(nom || 'LOTBO', cW / 2, 820)

      // Expression
      ctx.font = 'italic 32px Georgia, serif'
      ctx.fillStyle = '#C8431A'
      const exprLines = wrapText(ctx, expression, cW - 200)
      exprLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, cW / 2, 870 + i * 40))

      // Points
      if (points) {
        ctx.font = 'bold 28px system-ui'
        ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.5)' : 'rgba(26,20,16,0.4)'
        ctx.fillText(`${points} pts`, cW / 2, 970)
      }

      // URL
      ctx.font = '24px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.25)'
      ctx.fillText('app.lotbo.app', cW / 2, 1030)

    } else if (format === '1200x630') {
      // ── Paysage ──
      dessinerLogo(ctx, 60, 72, 38, textColor)

      // Zone gauche — badge
      ctx.font = '200px serif'
      ctx.textAlign = 'center'
      ctx.fillText(badge.emoji, 320, 340)

      // Séparateur vertical
      ctx.strokeStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.1)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(560, 60); ctx.lineTo(560, cH - 60); ctx.stroke()

      // Zone droite — infos
      const rx = 600
      ctx.font = 'bold italic 52px Georgia, serif'
      ctx.fillStyle = textColor; ctx.textAlign = 'left'
      ctx.fillText(badge.label, rx, 180)

      ctx.font = '28px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.6)' : 'rgba(26,20,16,0.5)'
      ctx.fillText(badge.desc, rx, 230)

      // Avatar + nom
      await dessinerAvatar(ctx, rx + 44, 340, 44, photoProfil || null, initiales, '#C8431A')
      ctx.font = 'bold 32px system-ui'
      ctx.fillStyle = textColor; ctx.textAlign = 'left'
      ctx.fillText(nom || 'LOTBO', rx + 102, 350)

      // Expression
      ctx.font = 'italic 26px Georgia, serif'
      ctx.fillStyle = '#C8431A'
      const exprLines = wrapText(ctx, expression, 560)
      exprLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, rx, 410 + i * 36))

      // URL
      ctx.font = '22px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.25)'
      ctx.textAlign = 'right'
      ctx.fillText('app.lotbo.app', cW - 60, cH - 30)

    } else {
      // ── Story 1080x1920 ──
      dessinerLogo(ctx, 60, 100, 44, textColor)

      // Badge central — plus haut
      ctx.font = '220px serif'
      ctx.textAlign = 'center'
      ctx.fillText(badge.emoji, cW / 2, 580)

      // Cercle
      ctx.strokeStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.12)' : 'rgba(26,20,16,0.08)'
      ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(cW / 2, 460, 280, 0, Math.PI * 2); ctx.stroke()

      // Titre
      ctx.font = 'bold italic 72px Georgia, serif'
      ctx.fillStyle = textColor; ctx.textAlign = 'center'
      ctx.fillText(badge.label, cW / 2, 720)

      ctx.font = '36px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.6)' : 'rgba(26,20,16,0.5)'
      ctx.fillText(badge.desc, cW / 2, 790)

      // Séparateur
      ctx.strokeStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.1)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(150, 860); ctx.lineTo(cW - 150, 860); ctx.stroke()

      // Avatar + nom
      await dessinerAvatar(ctx, cW / 2, 1020, 110, photoProfil || null, initiales, '#C8431A')
      ctx.font = 'bold 52px system-ui'
      ctx.fillStyle = textColor; ctx.textAlign = 'center'
      ctx.fillText(nom || 'LOTBO', cW / 2, 1190)

      // Expression
      ctx.font = 'italic 40px Georgia, serif'
      ctx.fillStyle = '#C8431A'
      const exprLines = wrapText(ctx, expression, cW - 200)
      exprLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, cW / 2, 1270 + i * 52))

      // Points
      if (points) {
        ctx.font = 'bold 36px system-ui'
        ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.5)' : 'rgba(26,20,16,0.4)'
        ctx.fillText(`${points} pts`, cW / 2, 1430)
      }

      // Hashtag
      ctx.font = 'bold 32px system-ui'
      ctx.fillStyle = '#C8431A'
      ctx.fillText('#LOTBO', cW / 2, 1700)

      // URL
      ctx.font = '28px system-ui'
      ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.25)'
      ctx.fillText('app.lotbo.app', cW / 2, 1850)
    }

    ctx.textAlign = 'left'
  }

  const telecharger = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const lien = document.createElement('a')
    lien.download = `lotbo-badge-${badge.id}.png`
    lien.href = canvas.toDataURL('image/png')
    lien.click()
  }

  const partagerNatif = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `lotbo-badge-${badge.id}.png`, { type: 'image/png' })
      try {
        if ('share' in navigator && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `${badge.emoji} ${badge.label} — LOTBO`, files: [file] })
        } else { telecharger() }
      } catch { telecharger() }
    }, 'image/png')
  }

  const urlPartage = encodeURIComponent(`${expression} — app.lotbo.app/classement`)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,20,16,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ background: '#F7F2E8', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid #E8E0D0', boxShadow: '0 24px 80px rgba(26,20,16,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E8E0D0', background: 'white' }}>
          <div>
            <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 16 }}>{badge.emoji} {t.titre}</p>
            <p style={{ color: '#8C5A40', fontSize: 12, marginTop: 2 }}>{badge.label} · {badge.desc}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Aperçu canvas */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E8E0D0', aspectRatio }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          {/* Langue */}
          <div>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Langue</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { code: 'fr', label: '🇫🇷 FR' },
                { code: 'en', label: '🇺🇸 EN' },
                { code: 'es', label: '🇪🇸 ES' },
                { code: 'pt', label: '🇵🇹 PT' },
                { code: 'ht', label: '🇭🇹 KW' },
              ].map(l => (
                <button key={l.code} onClick={() => setLocale(l.code)} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: locale === l.code ? '#C8431A' : 'white', color: locale === l.code ? 'white' : '#8C5A40', boxShadow: '0 1px 4px rgba(26,20,16,0.08)' }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Format</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer', background: format === f.id ? 'rgba(200,67,26,0.12)' : 'white', border: format === f.id ? '1px solid #C8431A' : '1px solid #E8E0D0', color: format === f.id ? '#C8431A' : '#8C5A40', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <span style={{ fontWeight: 'bold' }}>{f.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{f.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fond */}
          <div>
            <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Fond</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FONDS_PALETTE.map(f => (
                <button key={f.id} onClick={() => setFond(f)} style={{ width: 38, height: 38, borderRadius: '50%', background: f.bg, border: fond.id === f.id ? '3px solid #C8431A' : '3px solid #E8E0D0', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} title={f.label} />
              ))}
            </div>
          </div>

          {/* Actions partage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={telecharger} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ⬇️ {t.telecharger}
            </button>
            {'share' in navigator && (
              <button onClick={partagerNatif} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                📤 {t.partager}
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`https://wa.me/?text=${urlPartage}`} target="_blank" style={{ flex: 1, background: '#25D366', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://app.lotbo.app/classement')}`} target="_blank" style={{ flex: 1, background: '#1877F2', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>Facebook</a>
              <a href={`https://twitter.com/intent/tweet?text=${urlPartage}`} target="_blank" style={{ flex: 1, background: '#000', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>𝕏</a>
              <a href={`https://www.tiktok.com/`} target="_blank" style={{ flex: 1, background: '#000', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>TikTok</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}