'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'
import type { ActionCelebrable } from '../lib/celebrerAction'
import { jouerBipLoyita } from '../lib/sonLoyita'

const CLE_SALUT_VU = 'lotbo_guide_salut_vu'

interface DonneesWikivoyage {
  extrait: string | null
  lien: string | null
}

const MAPPING_ACTION_CLE: Record<ActionCelebrable, string> = {
  inscription: 'celebration_inscription',
  premier_favori: 'celebration_premier_favori',
  premier_commentaire: 'celebration_premier_commentaire',
  premiere_organisation_suivie: 'celebration_premiere_organisation',
}

export default function GuideLotboGlobal() {
  const pathname = usePathname()
  const { langue } = useLangue()
  const t = getTraductions(langue)
  const [visible, setVisible] = useState(false)
  const [bulleSalut, setBulleSalut] = useState(false)
  const [bulleCelebration, setBulleCelebration] = useState<string | null>(null)
  const [panneauOuvert, setPanneauOuvert] = useState(false)
  const [wikivoyage, setWikivoyage] = useState<DonneesWikivoyage | null>(null)
  const [conseilGenerique, setConseilGenerique] = useState('')

  useEffect(() => {
    setVisible(true)
    const dejaVu = localStorage.getItem(CLE_SALUT_VU)
    if (!dejaVu) {
      setBulleSalut(true)
      const timer = setTimeout(() => setBulleSalut(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const ecouter = (e: Event) => {
      const detail = (e as CustomEvent).detail as { action: ActionCelebrable }
      const cle = MAPPING_ACTION_CLE[detail.action]
      const texte = (t.loyita as Record<string, string>)[cle]
      if (!texte) return
      setBulleSalut(false)
      setBulleCelebration(texte)
      jouerBipLoyita()
      const timer = setTimeout(() => setBulleCelebration(null), 6000)
      return () => clearTimeout(timer)
    }
    window.addEventListener('lotbo:premiere_fois', ecouter)
    return () => window.removeEventListener('lotbo:premiere_fois', ecouter)
  }, [t])

  const ouvrirPanneau = async () => {
    setBulleSalut(false)
    setPanneauOuvert(true)
    jouerBipLoyita()
    localStorage.setItem(CLE_SALUT_VU, new Date().toISOString())

    const matchVille = pathname?.match(/^\/ville\/([^/]+)/)
    if (matchVille) {
      const nomVille = decodeURIComponent(matchVille[1])
      try {
        const res = await fetch(`/api/wikivoyage-ville?ville=${encodeURIComponent(nomVille)}`)
        const data = await res.json()
        if (data.trouve) {
          setWikivoyage({ extrait: data.extrait, lien: data.lien })
          return
        }
      } catch { /* silencieux, fallback générique */ }
    }
    setWikivoyage(null)
    const clesConseils = ['conseil_suivre_ville', 'conseil_proposer_correction', 'conseil_swipe_alune', 'conseil_profil_contributions', 'conseil_bouton_ajouter', 'conseil_scan_publie']
    const cleChoisie = clesConseils[Math.floor(Math.random() * clesConseils.length)]
    setConseilGenerique((t.loyita as Record<string, string>)[cleChoisie])
  }

  const fermerPanneau = () => setPanneauOuvert(false)

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes lotboGuideBlink { 0%, 88%, 100% { transform: scaleY(1) } 92% { transform: scaleY(0.15) } }
        @keyframes lotboGuideFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes lotboGuideGlow { 0%, 100% { opacity: 0.2 } 50% { opacity: 0.35 } }
        .lotbo-guide-svg { animation: lotboGuideFloat 3s ease-in-out infinite }
        .lotbo-guide-halo { animation: lotboGuideGlow 2.4s ease-in-out infinite }
        .lotbo-guide-eye { animation: lotboGuideBlink 3.6s ease-in-out infinite; transform-origin: center }
      `}</style>

      {bulleSalut && !panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(150px + env(safe-area-inset-bottom))', right: 20, zIndex: 998,
          background: '#1A1410', color: '#F7F2E8', fontSize: 13,
          padding: '10px 14px', borderRadius: '14px 14px 2px 14px',
          maxWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          Bonjour ! Je suis là pour t&apos;aider à explorer LOTBO 👋
        </div>
      )}

      {bulleCelebration && !panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(150px + env(safe-area-inset-bottom))', right: 20, zIndex: 998,
          background: '#1A1410', color: '#F7F2E8', fontSize: 13,
          padding: '10px 14px', borderRadius: '14px 14px 2px 14px',
          maxWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid #D4A820',
        }}>
          {bulleCelebration}
        </div>
      )}

      {!panneauOuvert && (
        <button
          onClick={ouvrirPanneau}
          aria-label="Ouvrir le guide LOTBO"
          style={{ position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom))', right: 20, zIndex: 998, width: 56, height: 56, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg className="lotbo-guide-svg" viewBox="0 0 56 56" width="56" height="56">
            <circle className="lotbo-guide-halo" cx="28" cy="28" r="26" fill="#D4A820" opacity="0.25" />
            <path d="M28 6 C40 6 48 15 48 27 C48 37 41 45 30 47 C29 47.3 27.5 47.3 26.5 46.5 C22 43 8 40 8 27 C8 15 16 6 28 6 Z" fill="#C8431A" />
            <circle className="lotbo-guide-eye" cx="20" cy="25" r="3" fill="#F7F2E8" />
            <circle className="lotbo-guide-eye" cx="36" cy="25" r="3" fill="#F7F2E8" />
          </svg>
        </button>
      )}

      {panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom))', right: 20, left: 20, maxWidth: 340, marginLeft: 'auto', zIndex: 999,
          background: 'white', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410' }}>Guide LOTBO</span>
            <button onClick={fermerPanneau} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 16 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#4A3830', lineHeight: 1.5, marginBottom: wikivoyage ? 10 : 0 }}>
            {wikivoyage ? wikivoyage.extrait : conseilGenerique}
          </p>
          {wikivoyage?.lien && (
            <a href={wikivoyage.lien} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#F7F2E8', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#8C5A40', textDecoration: 'none' }}>
              📖 Source Wikivoyage
            </a>
          )}
        </div>
      )}
    </>
  )
}
