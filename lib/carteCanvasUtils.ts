export function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function getTextColor(bg: string): string {
  return getLuminance(bg) > 0.5 ? '#1A1410' : '#F7F2E8'
}

export function getInitiales(nom: string): string {
  return nom.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LB'
}

export async function chargerImage(src: string): Promise<HTMLImageElement | null> {
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

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

export async function dessinerAvatar(
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

export function dessinerLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, textColor: string) {
  ctx.save(); ctx.textAlign = 'left'
  ctx.font = `bold italic ${size}px Georgia, serif`
  ctx.fillStyle = textColor; ctx.fillText('lot', x, y)
  const lotW = ctx.measureText('lot').width
  ctx.fillStyle = '#C8431A'; ctx.fillText('bo', x + lotW, y)
  ctx.restore()
}
