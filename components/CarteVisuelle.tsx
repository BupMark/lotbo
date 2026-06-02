'use client'

import { useEffect, useRef, useState } from 'react'

const FONDS = [
  { id: 'creme', label: 'Crème', bg: '#F7F2E8' },
  { id: 'night', label: 'Nuit', bg: '#1A1410' },
  { id: 'brique', label: 'Brique', bg: '#C8431A' },
  { id: 'or', label: 'Or', bg: '#D4A820' },
  { id: 'terre', label: 'Terre', bg: '#8C5A40' },
]

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

type Disposition = 'centree' | 'split' | 'paysage' | 'portrait' | 'story' | 'minimal' | 'badge_vip'
const DISPOSITIONS = [
  { id: 'centree' as Disposition, label: 'Centrée', icon: '⬛', size: '1080×1080' },
  { id: 'split' as Disposition, label: 'Split', icon: '◧', size: '1080×1080' },
  { id: 'paysage' as Disposition, label: 'Paysage', icon: '▬', size: '1200×630' },
  { id: 'portrait' as Disposition, label: 'Portrait Élégant', icon: '🖼️', size: '1080×1350' },
  { id: 'story' as Disposition, label: 'Story Immersive', icon: '📱', size: '1080×1920' },
  { id: 'minimal' as Disposition, label: 'Minimal Chic', icon: '◻️', size: '1080×1080' },
  { id: 'badge_vip' as Disposition, label: 'Badge VIP', icon: '💎', size: '1080×1080' },
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

function getExprColor(bg: string, surFondSombre: boolean): string {
  if (surFondSombre) return '#F7F2E8'
  return getLuminance(bg) > 0.5 ? '#C8431A' : '#F7F2E8'
}

function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LB'
}

function formatDateCourte(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(year, month - 1, day))
  } catch { return dateStr }
}

async function chargerImage(src: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
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

async function dessinerZonePhotoAjustable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  photoUrl: string | null,
  fallbackBg: string,
  offsetX: number = 0,
  offsetY: number = 0,
  zoom: number = 1
) {
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()

  if (photoUrl) {
    const img = await chargerImage(photoUrl)
    if (img) {
      const baseRatio = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const ratio = baseRatio * zoom
      const dw = img.naturalWidth * ratio
      const dh = img.naturalHeight * ratio
      const dx = x + (w - dw) / 2 + offsetX
      const dy = y + (h - dh) / 2 + offsetY
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
      return
    }
  }

  const grad = ctx.createLinearGradient(x, y, x + w, y + h)
  grad.addColorStop(0, fallbackBg)
  grad.addColorStop(1, '#1A1410')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

async function dessinerAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  photoUrl: string | null, initiales: string
) {
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  if (photoUrl) {
    const img = await chargerImage(photoUrl)
    if (img) {
      const size = r * 2
      const ratio = Math.max(size / img.naturalWidth, size / img.naturalHeight)
      const dw = img.naturalWidth * ratio
      const dh = img.naturalHeight * ratio
      const dx = cx - r + (size - dw) / 2
      const dy = cy - r + (size - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
      ctx.strokeStyle = '#C8431A'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke()
      return
    }
  }
  ctx.fillStyle = '#C8431A'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.restore()
  ctx.font = `bold ${Math.round(r * 0.75)}px system-ui, sans-serif`
  ctx.fillStyle = '#F7F2E8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(initiales, cx, cy)
  ctx.textBaseline = 'alphabetic'
  ctx.strokeStyle = '#C8431A'; ctx.lineWidth = 5
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke()
}

function dessinerLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, textColor: string) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.font = `bold italic ${size}px Georgia, serif`
  ctx.fillStyle = textColor
  ctx.fillText('lot', x, y)
  const lotW = ctx.measureText('lot').width
  ctx.fillStyle = '#C8431A'
  ctx.fillText('bo', x + lotW, y)
  ctx.restore()
}

interface Props {
  evenement: { titre: string; lieu: string; date: string; date_fin?: string; image_url?: string }
  expression: string
  photoProfil?: string | null
  onClose: () => void
}

export default function CarteVisuelle({ evenement, expression: expressionInitiale, photoProfil: photoProfilProp, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputFondRef = useRef<HTMLInputElement>(null)

  const [fondActif, setFondActif] = useState(FONDS[0])
  const [useFotoEvent, setUseFotoEvent] = useState(false)
  const [expressionSelectionnee, setExpressionSelectionnee] = useState(
    EXPRESSIONS.find(e => e.texte === expressionInitiale) || EXPRESSIONS[0]
  )
  const [texteCustom, setTexteCustom] = useState('')
  const [nomUtilisateur, setNomUtilisateur] = useState('Moi')
  const [photoProfil, setPhotoProfil] = useState<string | null>(photoProfilProp || null)
  const [photoFond, setPhotoFond] = useState<string | null>(null)
  const [disposition, setDisposition] = useState<Disposition>('centree')
  const [etape, setEtape] = useState<'expression' | 'carte'>('expression')

  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [zoom, setZoom] = useState(1)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const previewRef = useRef<HTMLDivElement>(null)

  const texteExpression = expressionSelectionnee.id === 'custom'
    ? (texteCustom || 'Personnalisé')
    : `${expressionSelectionnee.emoji} ${expressionSelectionnee.texte}`

  const initiales = getInitiales(nomUtilisateur)

  const periode = evenement.date_fin && evenement.date_fin !== evenement.date
    ? `${formatDateCourte(evenement.date)} → ${formatDateCourte(evenement.date_fin)}`
    : formatDateCourte(evenement.date)

  const photoFondPaysage = photoFond || photoProfil || evenement.image_url || null

  useEffect(() => {
    if (!evenement.image_url && !photoProfil) { setDisposition('centree'); return }
    if (evenement.image_url) {
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth > img.naturalHeight * 1.25) setDisposition('paysage')
        else if (img.naturalHeight > img.naturalWidth * 1.1) setDisposition('split')
        else setDisposition('centree')
      }
      img.src = evenement.image_url
    }
  }, [evenement.image_url, photoProfil])

  useEffect(() => {
    if (etape !== 'carte') return
    dessinerCarte()
  }, [fondActif, useFotoEvent, texteExpression, etape, nomUtilisateur, disposition, photoProfil, photoFond, offsetX, offsetY, zoom])

  const getDimensions = () => {
    if (disposition === 'paysage') return { W: 1200, H: 630 }
    if (disposition === 'portrait') return { W: 1080, H: 1350 }
    if (disposition === 'story') return { W: 1080, H: 1920 }
    return { W: 1080, H: 1080 }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Photo max 2MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoProfil(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePhotoFondUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo max 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoFond(ev.target?.result as string)
      setOffsetX(0); setOffsetY(0); setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const hasPhoto = photoFond || photoProfil || evenement.image_url
    if (!hasPhoto) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY }
    e.preventDefault()
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect()
    const { W } = getDimensions()
    const scale = rect ? W / rect.width : 3
    const dx = (e.clientX - dragStart.current.x) * scale
    const dy = (e.clientY - dragStart.current.y) * scale
    setOffsetX(dragStart.current.ox + dx)
    setOffsetY(dragStart.current.oy + dy)
  }
  const handleMouseUp = () => { isDragging.current = false }

  const touchStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const handleTouchStart = (e: React.TouchEvent) => {
    const hasPhoto = photoFond || photoProfil || evenement.image_url
    if (!hasPhoto) return
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offsetX, oy: offsetY }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect()
    const { W } = getDimensions()
    const scale = rect ? W / rect.width : 3
    const dx = (e.touches[0].clientX - touchStart.current.x) * scale
    const dy = (e.touches[0].clientY - touchStart.current.y) * scale
    setOffsetX(touchStart.current.ox + dx)
    setOffsetY(touchStart.current.oy + dy)
  }

  // ── Dessiner centree ──────────────────────────────────────────────────────
  const dessinerCentree = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const bg = useFotoEvent && evenement.image_url ? '#1A1410' : fondActif.bg
    const textColor = useFotoEvent && evenement.image_url ? '#F7F2E8' : getTextColor(bg)
    const exprColor = getExprColor(bg, useFotoEvent && !!evenement.image_url)

    if (useFotoEvent && evenement.image_url) {
      const img = await chargerImage(evenement.image_url)
      if (img) { ctx.drawImage(img, 0, 0, W, H); ctx.fillStyle = 'rgba(26,20,16,0.72)'; ctx.fillRect(0, 0, W, H) }
      else { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H) }
    } else { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H) }

    dessinerLogo(ctx, 60, 100, 46, textColor)
    const avatarX = W / 2, avatarY = 330, avatarR = 88
    await dessinerAvatar(ctx, avatarX, avatarY, avatarR, photoProfil, initiales)
    ctx.font = 'bold 46px system-ui, sans-serif'
    ctx.fillStyle = exprColor; ctx.textAlign = 'center'
    ctx.fillText(texteExpression, W / 2, avatarY + avatarR + 70)
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.12)'
    ctx.fillRect(80, avatarY + avatarR + 96, W - 160, 1)
    ctx.font = 'bold italic 52px Georgia, serif'
    ctx.fillStyle = textColor; ctx.textAlign = 'center'
    const titreLines = wrapText(ctx, evenement.titre, W - 120)
    const startTitre = avatarY + avatarR + 166
    titreLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, W / 2, startTitre + i * 60))
    const after = startTitre + Math.min(titreLines.length, 2) * 60
    const remaining = H - after - 80
    const spacing = Math.min(52, remaining / 3)
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    const dateDisplay = periode.length > 42 ? periode.slice(0, 42) + '…' : periode
    ctx.fillText(`📅 ${dateDisplay}`, W / 2, after + spacing)
    const lieuDisplay = evenement.lieu.length > 46 ? evenement.lieu.slice(0, 46) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, W / 2, after + spacing * 2)
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.28)'
    ctx.fillText('app.lotbo.app', W / 2, H - 48)
    ctx.textAlign = 'left'
  }

  // ── Dessiner split ────────────────────────────────────────────────────────
  const dessinerSplit = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const photoW = Math.round(W * 0.55)
    const bg = fondActif.bg
    const textColor = getTextColor(bg)
    const exprColor = getExprColor(bg, false)
    const photoSource = photoProfil || evenement.image_url || null
    await dessinerZonePhotoAjustable(ctx, 0, 0, photoW, H, photoSource, '#C8431A', offsetX, offsetY, zoom)
    if (photoSource) { ctx.fillStyle = 'rgba(26,20,16,0.15)'; ctx.fillRect(0, 0, photoW, H) }
    ctx.fillStyle = bg; ctx.fillRect(photoW, 0, W - photoW, H)
    const rx = photoW + 56, rw = W - photoW - 96
    dessinerLogo(ctx, rx, 72, 40, textColor)
    const avatarX = rx + 52, avatarY = Math.round(H * 0.28), avatarR = 52
    await dessinerAvatar(ctx, avatarX, avatarY, avatarR, photoProfil, initiales)
    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillStyle = exprColor; ctx.textAlign = 'left'
    ctx.fillText(texteExpression, rx, avatarY + avatarR + 56)
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.15)' : 'rgba(26,20,16,0.12)'
    ctx.fillRect(rx, avatarY + avatarR + 76, rw, 1)
    ctx.font = 'bold italic 44px Georgia, serif'
    ctx.fillStyle = textColor; ctx.textAlign = 'left'
    const titreLines = wrapText(ctx, evenement.titre, rw)
    const titreStartY = avatarY + avatarR + 138
    titreLines.slice(0, 3).forEach((line, i) => ctx.fillText(line, rx, titreStartY + i * 52))
    const afterTitre = titreStartY + Math.min(titreLines.length, 3) * 52
    const remaining = H - afterTitre - 80
    const spacing = Math.max(44, Math.min(56, remaining / 2.5))
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}`, rx, afterTitre + spacing)
    const lieuDisplay = evenement.lieu.length > 32 ? evenement.lieu.slice(0, 32) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, rx, afterTitre + spacing * 2)
    ctx.font = '22px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.28)'
    ctx.fillText('app.lotbo.app', rx, H - 44)
    ctx.textAlign = 'left'
  }

  // ── Dessiner paysage ──────────────────────────────────────────────────────
  const dessinerPaysage = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const photoH = Math.round(H * 0.62)
    const bg = fondActif.bg
    const textColor = getTextColor(bg)

    await dessinerZonePhotoAjustable(ctx, 0, 0, W, photoH, photoFondPaysage, '#C8431A', offsetX, offsetY, zoom)

    if (photoFondPaysage) {
      ctx.fillStyle = 'rgba(26,20,16,0.38)'; ctx.fillRect(0, 0, W, photoH)
    }

    dessinerLogo(ctx, 48, 66, 40, '#F7F2E8')

    const avatarX = 76, avatarY = photoH - 70, avatarR = 50
    await dessinerAvatar(ctx, avatarX, avatarY, avatarR, photoProfil, initiales)
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'; ctx.textAlign = 'left'
    ctx.fillText(texteExpression, avatarX + avatarR + 18, avatarY + 12)

    ctx.fillStyle = bg; ctx.fillRect(0, photoH, W, H - photoH)
    const bandH = H - photoH
    const startY = photoH + (bandH - 130) / 2 + 38
    ctx.font = 'bold italic 44px Georgia, serif'
    ctx.fillStyle = textColor; ctx.textAlign = 'left'
    const titreLines = wrapText(ctx, evenement.titre, W - 96)
    titreLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 48, startY + i * 52))
    const afterTitre = startY + Math.min(titreLines.length, 2) * 52
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.65)' : 'rgba(26,20,16,0.55)'
    const lieuDisplay = evenement.lieu.length > 38 ? evenement.lieu.slice(0, 38) + '…' : evenement.lieu
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}  ·  📍 ${lieuDisplay}`, 48, afterTitre + 30)
    ctx.font = '20px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.3)' : 'rgba(26,20,16,0.28)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 48, H - 22)
    ctx.textAlign = 'left'
  }

  // ── PORTRAIT ÉLÉGANT ──────────────────────────────────────────────────────
  const dessinerPortrait = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const photoH = Math.round(H * 0.68)
    const bg = fondActif.bg
    const textColor = getTextColor(bg)

    await dessinerZonePhotoAjustable(ctx, 0, 0, W, photoH, photoProfil || evenement.image_url || null, '#1A1410', offsetX, offsetY, zoom)

    const grad = ctx.createLinearGradient(0, photoH * 0.5, 0, photoH)
    grad.addColorStop(0, 'rgba(26,20,16,0)')
    grad.addColorStop(1, 'rgba(26,20,16,0.85)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, photoH)

    dessinerLogo(ctx, 48, 72, 44, '#F7F2E8')

    const badgeY = photoH - 80
    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.roundRect(48, badgeY - 44, 440, 56, 28)
    ctx.fill()
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'left'
    ctx.fillText(texteExpression, 72, badgeY - 8)

    ctx.fillStyle = bg
    ctx.fillRect(0, photoH, W, H - photoH)

    ctx.font = 'bold 96px Georgia, serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'left'
    ctx.fillText(nomUtilisateur, 48, photoH + 110)

    ctx.fillStyle = '#C8431A'
    ctx.fillRect(48, photoH + 128, 120, 4)

    ctx.font = 'italic 36px Georgia, serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.75)' : 'rgba(26,20,16,0.65)'
    const titreLines = wrapText(ctx, evenement.titre, W - 96)
    titreLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 48, photoH + 182 + i * 44))

    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.5)' : 'rgba(26,20,16,0.45)'
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}`, 48, H - 88)
    const lieuDisplay = evenement.lieu.length > 38 ? evenement.lieu.slice(0, 38) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, 48, H - 48)

    ctx.font = '22px system-ui, sans-serif'
    ctx.fillStyle = getLuminance(bg) < 0.5 ? 'rgba(247,242,232,0.25)' : 'rgba(26,20,16,0.22)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 48, H - 20)
    ctx.textAlign = 'left'
  }

  // ── STORY IMMERSIVE ───────────────────────────────────────────────────────
  const dessinerStory = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    await dessinerZonePhotoAjustable(ctx, 0, 0, W, H, photoProfil || evenement.image_url || null, '#1A1410', offsetX, offsetY, zoom)

    const grad = ctx.createLinearGradient(0, H * 0.35, 0, H)
    grad.addColorStop(0, 'rgba(26,20,16,0)')
    grad.addColorStop(0.6, 'rgba(26,20,16,0.75)')
    grad.addColorStop(1, 'rgba(26,20,16,0.95)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    dessinerLogo(ctx, 48, 100, 48, '#F7F2E8')

    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.roundRect(W - 380, 60, 332, 60, 30)
    ctx.fill()
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'right'
    ctx.fillText(texteExpression, W - 72, 100)
    ctx.textAlign = 'left'

    ctx.font = 'bold 120px Georgia, serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.fillText(nomUtilisateur, 56, H - 420)

    ctx.font = 'bold 36px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(247,242,232,0.7)'
    ctx.fillText('VIBES ONLY ✨', 56, H - 360)

    ctx.fillStyle = '#C8431A'
    ctx.fillRect(56, H - 330, 160, 4)

    ctx.fillStyle = 'rgba(247,242,232,0.12)'
    ctx.beginPath()
    ctx.roundRect(48, H - 300, W - 96, 180, 16)
    ctx.fill()

    ctx.font = 'bold italic 38px Georgia, serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.fillText(evenement.titre.slice(0, 36) + (evenement.titre.length > 36 ? '…' : ''), 72, H - 246)

    ctx.font = '28px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(247,242,232,0.65)'
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}`, 72, H - 196)
    const lieuDisplay = evenement.lieu.length > 36 ? evenement.lieu.slice(0, 36) + '…' : evenement.lieu
    ctx.fillText(`📍 ${lieuDisplay}`, 72, H - 156)

    ctx.font = '24px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(247,242,232,0.3)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 48, H - 32)
    ctx.textAlign = 'left'
  }

  // ── MINIMAL CHIC ──────────────────────────────────────────────────────────
  const dessinerMinimal = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const bg = '#F7F2E8'
    const textColor = '#1A1410'

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#C8431A'
    ctx.fillRect(80, 80, W - 160, 3)

    dessinerLogo(ctx, 80, 160, 44, textColor)

    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.roundRect(80, 196, 380, 52, 26)
    ctx.fill()
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'left'
    ctx.fillText(texteExpression, 104, 230)

    const avatarX = W / 2, avatarY = 490, avatarR = 180
    await dessinerAvatar(ctx, avatarX, avatarY, avatarR, photoProfil, initiales)

    ctx.font = 'bold 88px Georgia, serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.fillText(nomUtilisateur, W / 2, 720)

    ctx.fillStyle = 'rgba(26,20,16,0.15)'
    ctx.fillRect(80, 748, W - 160, 1)

    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(26,20,16,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('ON SE RETROUVE LÀ-BAS', W / 2, 800)

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.roundRect(80, 832, W - 160, 160, 16)
    ctx.fill()
    ctx.strokeStyle = '#E8E0D0'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = 'bold italic 34px Georgia, serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'left'
    ctx.fillText(evenement.titre.slice(0, 38) + (evenement.titre.length > 38 ? '…' : ''), 110, 884)

    ctx.font = '24px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(26,20,16,0.5)'
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}  ·  📍 ${evenement.lieu.slice(0, 28)}`, 110, 924)

    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.arc(W - 110, 912, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'center'
    ctx.fillText('→', W - 110, 920)

    ctx.fillStyle = '#C8431A'
    ctx.fillRect(80, H - 80, W - 160, 3)

    ctx.font = '20px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(26,20,16,0.25)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 80, H - 24)
    ctx.textAlign = 'left'
  }

  // ── BADGE VIP ─────────────────────────────────────────────────────────────
  const dessinerBadgeVip = async (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const bg = '#1A1410'

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#D4A820'
    ctx.lineWidth = 6
    ctx.strokeRect(32, 32, W - 64, H - 64)

    const drawCorner = (x: number, y: number, sx: number, sy: number) => {
      ctx.fillStyle = 'rgba(212,168,32,0.12)'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + sx * 120, y)
      ctx.lineTo(x, y + sy * 120)
      ctx.closePath()
      ctx.fill()
    }
    drawCorner(32, 32, 1, 1)
    drawCorner(W - 32, 32, -1, 1)
    drawCorner(32, H - 32, 1, -1)
    drawCorner(W - 32, H - 32, -1, -1)

    dessinerLogo(ctx, 80, 110, 42, '#F7F2E8')

    ctx.fillStyle = '#D4A820'
    ctx.beginPath()
    ctx.roundRect(W - 180, 70, 112, 48, 24)
    ctx.fill()
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillStyle = '#1A1410'
    ctx.textAlign = 'center'
    ctx.fillText('VIP', W - 124, 102)
    ctx.textAlign = 'left'

    const avatarX = 220, avatarY = H / 2 - 20, avatarR = 150
    await dessinerAvatar(ctx, avatarX, avatarY, avatarR, photoProfil, initiales)

    ctx.font = 'bold 72px Georgia, serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'left'
    ctx.fillText(nomUtilisateur, avatarX * 2 - 20, avatarY - 60)

    ctx.fillStyle = '#C8431A'
    ctx.beginPath()
    ctx.roundRect(avatarX * 2 - 20, avatarY - 30, 360, 52, 26)
    ctx.fill()
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.fillText(texteExpression, avatarX * 2, avatarY + 6)

    ctx.fillStyle = '#D4A820'
    ctx.fillRect(avatarX * 2 - 20, avatarY + 76, 380, 2)

    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.fillStyle = '#D4A820'
    ctx.fillText("MEMBRE DE L'EXPÉRIENCE ✦", avatarX * 2 - 20, avatarY + 116)

    ctx.fillStyle = 'rgba(247,242,232,0.06)'
    ctx.beginPath()
    ctx.roundRect(80, H - 280, W - 160, 180, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(212,168,32,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = 'bold italic 34px Georgia, serif'
    ctx.fillStyle = '#F7F2E8'
    ctx.textAlign = 'left'
    ctx.fillText(evenement.titre.slice(0, 34) + (evenement.titre.length > 34 ? '…' : ''), 110, H - 218)

    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(247,242,232,0.55)'
    ctx.fillText(`📅 ${formatDateCourte(evenement.date)}`, 110, H - 166)
    ctx.fillText(`📍 ${evenement.lieu.slice(0, 32)}`, 110, H - 126)

    ctx.font = '20px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(247,242,232,0.2)'
    ctx.textAlign = 'right'
    ctx.fillText('app.lotbo.app', W - 80, H - 52)
    ctx.textAlign = 'left'
  }

  const dessinerCarte = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const { W, H } = getDimensions()
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)
    if (disposition === 'split') await dessinerSplit(ctx, W, H)
    else if (disposition === 'paysage') await dessinerPaysage(ctx, W, H)
    else if (disposition === 'portrait') await dessinerPortrait(ctx, W, H)
    else if (disposition === 'story') await dessinerStory(ctx, W, H)
    else if (disposition === 'minimal') await dessinerMinimal(ctx, W, H)
    else if (disposition === 'badge_vip') await dessinerBadgeVip(ctx, W, H)
    else await dessinerCentree(ctx, W, H)
  }

  const telecharger = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const lien = document.createElement('a')
    lien.download = `lotbo-${evenement.titre.slice(0, 20).replace(/\s/g, '-')}.png`
    lien.href = canvas.toDataURL('image/png')
    lien.click()
  }

  const partagerNatif = async () => {
    const canvas = canvasRef.current; if (!canvas) return
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
  const { W: cW, H: cH } = getDimensions()
  const aspectRatio = `${cW}/${cH}`
  const isPaysage = disposition === 'paysage'
  const hasPhotoZone = isPaysage || disposition === 'split' || disposition === 'portrait' || disposition === 'story'

  // ── Styles communs mode clair ─────────────────────────────────────────────
  const inputClair = {
    background: 'white',
    border: '1px solid #E8E0D0',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#1A1410',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(26,20,16,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '16px', overflowY: 'auto',
    }}>
      {/* ── Card principale — fond clair ── */}
      <div style={{
        background: '#F7F2E8',
        borderRadius: 20,
        width: '100%',
        maxWidth: 520,
        border: '1px solid #E8E0D0',
        boxShadow: '0 24px 80px rgba(26,20,16,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid #E8E0D0',
          background: 'white',
        }}>
          <p style={{ color: '#1A1410', fontWeight: 'bold', fontSize: 16 }}>
            {etape === 'expression' ? '🙋 Je serai là' : '🎨 Ma carte'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>

          {/* ── Étape 1 — Expression ── */}
          {etape === 'expression' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#8C5A40', fontSize: 13 }}>Comment tu veux exprimer ta présence ?</p>

              {/* Nom */}
              <div>
                <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 6, display: 'block' }}>Ton prénom</label>
                <input
                  value={nomUtilisateur}
                  onChange={e => setNomUtilisateur(e.target.value)}
                  maxLength={30}
                  placeholder="Ton prénom"
                  style={inputClair}
                />
              </div>

              {/* Photo profil */}
              <div>
                <label style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8, display: 'block' }}>Photo de profil</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {photoProfil ? (
                    <div style={{ position: 'relative' }}>
                      <img src={photoProfil} alt="profil" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C8431A' }} />
                      <button onClick={() => setPhotoProfil(null)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#C8431A', border: 'none', color: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#C8431A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F7F2E8', fontWeight: 'bold', fontSize: 18 }}>{initiales}</div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: 'white', border: '1px solid #E8E0D0', color: '#8C5A40', cursor: 'pointer', textAlign: 'left' as const }}>
                    📷 {photoProfil ? 'Changer ma photo' : 'Ajouter ma photo'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </div>
                <p style={{ color: '#8C5A40', fontSize: 11, marginTop: 6 }}>JPG, PNG, WebP · max 2MB</p>
              </div>

              {/* Expressions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXPRESSIONS.map(exp => (
                  <button key={exp.id} onClick={() => setExpressionSelectionnee(exp)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, textAlign: 'left' as const,
                    background: expressionSelectionnee.id === exp.id ? 'rgba(200,67,26,0.12)' : 'white',
                    border: expressionSelectionnee.id === exp.id ? '1px solid #C8431A' : '1px solid #E8E0D0',
                    color: '#1A1410', fontSize: 14, cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 20 }}>{exp.emoji}</span>
                    <span>{exp.texte}</span>
                    {expressionSelectionnee.id === exp.id && <span style={{ marginLeft: 'auto', color: '#C8431A' }}>✓</span>}
                  </button>
                ))}
              </div>

              {expressionSelectionnee.id === 'custom' && (
                <input
                  value={texteCustom}
                  onChange={e => setTexteCustom(e.target.value.slice(0, 30))}
                  placeholder="Ton expression (30 caractères max)"
                  maxLength={30}
                  style={{ ...inputClair, border: '1px solid #C8431A' }}
                />
              )}

              <button onClick={() => setEtape('carte')} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}>
                Créer ma carte →
              </button>
            </div>
          )}

          {/* ── Étape 2 — Carte ── */}
          {etape === 'carte' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Canvas aperçu */}
              <div
                ref={previewRef}
                style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E8E0D0', aspectRatio, userSelect: 'none' }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block', cursor: hasPhotoZone && photoFondPaysage ? 'grab' : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                />
              </div>

              {/* Contrôles zoom/drag */}
              {hasPhotoZone && (photoFondPaysage || photoProfil || evenement.image_url) && (
                <div style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ color: '#8C5A40', fontSize: 11, marginBottom: 8 }}>🖱️ Glisse l'aperçu pour repositionner la photo</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#8C5A40', fontSize: 11 }}>Zoom</span>
                    <input type="range" min="1" max="3" step="0.05"
                      value={zoom}
                      onChange={e => setZoom(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: '#C8431A', maxWidth: 160 }}
                    />
                    <span style={{ color: '#8C5A40', fontSize: 11, minWidth: 30 }}>{zoom.toFixed(1)}x</span>
                    <button onClick={() => { setOffsetX(0); setOffsetY(0); setZoom(1) }}
                      style={{ background: 'white', border: '1px solid #E8E0D0', borderRadius: 6, padding: '4px 10px', color: '#8C5A40', fontSize: 11, cursor: 'pointer' }}>
                      ↺ Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Upload photo fond */}
              {hasPhotoZone && (
                <div>
                  <button onClick={() => fileInputFondRef.current?.click()} style={{
                    width: '100%', padding: '10px', borderRadius: 10, fontSize: 13,
                    background: photoFond ? 'rgba(200,67,26,0.08)' : 'white',
                    border: photoFond ? '1px solid rgba(200,67,26,0.4)' : '1px solid #E8E0D0',
                    color: photoFond ? '#C8431A' : '#8C5A40', cursor: 'pointer',
                  }}>
                    🖼️ {photoFond ? 'Changer la photo de fond' : 'Ajouter une photo de fond'}
                    {!photoFond && photoProfil && <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.6 }}>(photo profil utilisée par défaut)</span>}
                  </button>
                  <input ref={fileInputFondRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoFondUpload} style={{ display: 'none' }} />
                  {photoFond && (
                    <button onClick={() => { setPhotoFond(null); setOffsetX(0); setOffsetY(0); setZoom(1) }}
                      style={{ background: 'none', border: 'none', color: '#8C5A40', fontSize: 11, cursor: 'pointer', marginTop: 6, textDecoration: 'underline' }}>
                      Supprimer la photo de fond
                    </button>
                  )}
                </div>
              )}

              {/* Disposition */}
              <div>
                <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Template</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DISPOSITIONS.map(d => (
                    <button key={d.id} onClick={() => setDisposition(d.id)} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                      background: disposition === d.id ? 'rgba(200,67,26,0.12)' : 'white',
                      border: disposition === d.id ? '1px solid #C8431A' : '1px solid #E8E0D0',
                      color: disposition === d.id ? '#C8431A' : '#8C5A40',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 18 }}>{d.icon}</span>
                      <span style={{ fontWeight: 'bold' }}>{d.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{d.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur fond */}
              <div>
                <p style={{ color: '#8C5A40', fontSize: 12, marginBottom: 8 }}>Fond bande</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FONDS.map(f => (
                    <button key={f.id} onClick={() => { setFondActif(f); setUseFotoEvent(false) }} style={{
                      width: 38, height: 38, borderRadius: '50%', background: f.bg,
                      border: fondActif.id === f.id && !useFotoEvent ? '3px solid #C8431A' : '3px solid #E8E0D0',
                      cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }} title={f.label} />
                  ))}
                  {evenement.image_url && !isPaysage && (
                    <button onClick={() => setUseFotoEvent(true)} style={{
                      width: 38, height: 38, borderRadius: '50%',
                      backgroundImage: `url(${evenement.image_url})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: useFotoEvent ? '3px solid #C8431A' : '3px solid #E8E0D0',
                      cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }} title="Photo événement" />
                  )}
                </div>
              </div>

              <button onClick={() => setEtape('expression')} style={{
                background: 'white', border: '1px solid #E8E0D0',
                borderRadius: 10, padding: '10px', color: '#8C5A40', fontSize: 13, cursor: 'pointer',
              }}>
                ← Modifier l'expression
              </button>

              {/* Partage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: '#8C5A40', fontSize: 12 }}>Partager</p>
                <button onClick={telecharger} style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  ⬇️ Télécharger l'image
                </button>
                {typeof window !== 'undefined' && 'share' in navigator && (
                  <button onClick={partagerNatif} style={{ background: 'white', color: '#1A1410', border: '1px solid #E8E0D0', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    📤 Partager (mobile)
                  </button>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`https://wa.me/?text=${textePartage}`} target="_blank" style={{ flex: 1, background: '#25D366', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>WhatsApp</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlEvent)}`} target="_blank" style={{ flex: 1, background: '#1877F2', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>Facebook</a>
                  <a href={`https://twitter.com/intent/tweet?text=${textePartage}`} target="_blank" style={{ flex: 1, background: '#000', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>𝕏</a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlEvent)}`} target="_blank" style={{ flex: 1, background: '#0A66C2', color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const }}>in</a>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}