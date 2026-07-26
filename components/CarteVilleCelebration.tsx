'use client'

import { useEffect, useRef, useState } from 'react'
import { chargerImage } from '../lib/carteCanvasUtils'

interface Props {
  ville: string
  pays: string | null
  nbEvenements: number
  imageUrl: string | null
  auteur: string | null
  licence: string | null
  onClose: () => void
}

export default function CarteVilleCelebration({
  ville, pays, nbEvenements, imageUrl, auteur, licence, onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageChargee, setImageChargee] = useState(false)

  useEffect(() => {
    const dessiner = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = 1080, H = 1350
      canvas.width = W
      canvas.height = H

      // Fond dégradé de secours (si pas d'image ou échec de chargement)
      const degradeFallback = ctx.createLinearGradient(0, 0, W, H)
      degradeFallback.addColorStop(0, '#8C5A40')
      degradeFallback.addColorStop(1, '#1A1410')
      ctx.fillStyle = degradeFallback
      ctx.fillRect(0, 0, W, H)

      const hauteurPhoto = 720
      if (imageUrl) {
        const img = await chargerImage(imageUrl)
        if (img) {
          const ratio = Math.max(W / img.width, hauteurPhoto / img.height)
          const w = img.width * ratio, h = img.height * ratio
          ctx.drawImage(img, (W - w) / 2, (hauteurPhoto - h) / 2, w, h)
        }
      }

      // Dégradé sombre en bas de la photo pour lisibilité du texte
      const degradeTexte = ctx.createLinearGradient(0, hauteurPhoto - 300, 0, hauteurPhoto)
      degradeTexte.addColorStop(0, 'rgba(26,20,16,0)')
      degradeTexte.addColorStop(1, 'rgba(26,20,16,0.85)')
      ctx.fillStyle = degradeTexte
      ctx.fillRect(0, hauteurPhoto - 300, W, 300)

      // Badge "Top ville"
      ctx.font = 'bold 28px system-ui'
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      const badgeTexte = '🏆 TOP VILLE'
      const badgeW = ctx.measureText(badgeTexte).width + 48
      ctx.beginPath()
      ctx.roundRect(48, 48, badgeW, 56, 28)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.fillText(badgeTexte, 72, 84)

      // Nom de la ville
      ctx.font = 'bold italic 72px Georgia, serif'
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.fillText(ville, 60, hauteurPhoto - 90)

      ctx.font = '32px system-ui'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText('est maintenant #1 sur LOTBO', 60, hauteurPhoto - 40)

      // Zone stats (fond clair, sous la photo)
      ctx.fillStyle = '#F7F2E8'
      ctx.fillRect(0, hauteurPhoto, W, H - hauteurPhoto)

      ctx.textAlign = 'center'
      ctx.font = 'bold 90px system-ui'
      ctx.fillStyle = '#1A1410'
      ctx.fillText(String(nbEvenements), W / 2, hauteurPhoto + 140)

      ctx.font = '30px system-ui'
      ctx.fillStyle = '#8C5A40'
      ctx.fillText(`événements actifs à ${ville}`, W / 2, hauteurPhoto + 190)

      // Logo LOTBO en bas
      ctx.font = 'bold italic 34px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1A1410'
      const lotW = ctx.measureText('lot').width
      const totalW = ctx.measureText('lotbo').width
      const startX = W / 2 - totalW / 2
      ctx.textAlign = 'left'
      ctx.fillText('lot', startX, H - 60)
      ctx.fillStyle = '#C8431A'
      ctx.fillText('bo', startX + lotW, H - 60)

      setImageChargee(true)
    }
    dessiner()
  }, [ville, pays, nbEvenements, imageUrl])

  const telecharger = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const lien = document.createElement('a')
    lien.download = `lotbo-${ville.toLowerCase().replace(/\s+/g, '-')}-top-ville.png`
    lien.href = canvas.toDataURL('image/png')
    lien.click()
  }

  const partagerNatif = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'lotbo-top-ville.png', { type: 'image/png' })
      try {
        if ('share' in navigator && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `${ville} — #1 sur LOTBO`, files: [file] })
        } else {
          telecharger()
        }
      } catch {
        telecharger()
      }
    }, 'image/png')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(26,20,16,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#F7F2E8', borderRadius: 20, width: '100%', maxWidth: 400,
        border: '1px solid #E8E0D0', boxShadow: '0 24px 80px rgba(26,20,16,0.25)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', display: 'block', aspectRatio: '1080/1350', opacity: imageChargee ? 1 : 0.3 }}
          />
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              fontSize: 16, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={`/?ville=${encodeURIComponent(ville)}`}
            style={{
              background: '#C8431A', color: 'white', textDecoration: 'none',
              borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold',
              textAlign: 'center', display: 'block',
            }}
          >
            Découvrir {ville}
          </a>
          <button
            onClick={partagerNatif}
            style={{
              background: 'white', color: '#1A1410', border: '1px solid #E8E0D0',
              borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            📤 Partager
          </button>
          {auteur && licence && (
            <p style={{ fontSize: 10, color: '#8C5A40', textAlign: 'center', margin: 0 }}>
              Photo : {auteur} via Wikimedia Commons ({licence})
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
