'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'
import type { ActionCelebrable, ActionAmbiante } from '../lib/celebrerAction'
import { selectionnerContexte } from '../lib/contexteAnsanm'
import { jouerBipLoyita } from '../lib/sonLoyita'

const CLE_SALUT_VU = 'lotbo_guide_salut_vu'

interface DonneesWikivoyage {
  extrait: string | null
  lien: string | null
}

interface MessageChat {
  role: 'user' | 'assistant'
  content: string
}

const MAPPING_ACTION_CLE: Record<ActionCelebrable, string> = {
  inscription: 'celebration_inscription',
  premier_favori: 'celebration_premier_favori',
  premier_commentaire: 'celebration_premier_commentaire',
  premiere_organisation_suivie: 'celebration_premiere_organisation',
}

const MAPPING_AMBIANT_CLES: Record<ActionAmbiante, string[]> = {
  favori_repete: ['ambiant_favori_1', 'ambiant_favori_2'],
  commentaire_repete: ['ambiant_commentaire_1', 'ambiant_commentaire_2'],
  partage: ['ambiant_partage_1', 'ambiant_partage_2'],
  ville_suivie_repetee: ['ambiant_ville_1', 'ambiant_ville_2'],
  organisation_suivie_repetee: ['ambiant_organisation_1', 'ambiant_organisation_2'],
}

export default function GuideLotboGlobal() {
  const pathname = usePathname()
  const { langue } = useLangue()
  const t = getTraductions(langue)
  const [visible, setVisible] = useState(false)
  const [bulleSalut, setBulleSalut] = useState(false)
  const [bulleCelebration, setBulleCelebration] = useState<string | null>(null)
  const [variante] = useState(() => Math.floor(Math.random() * 3))
  const [messageSalutContextuel, setMessageSalutContextuel] = useState<string | null>(null)
  const [toastAmbiant, setToastAmbiant] = useState<string | null>(null)
  const [panneauOuvert, setPanneauOuvert] = useState(false)
  const [wikivoyage, setWikivoyage] = useState<DonneesWikivoyage | null>(null)
  const [conseilGenerique, setConseilGenerique] = useState('')
  const [messages, setMessages] = useState<MessageChat[]>([])
  const [saisie, setSaisie] = useState('')
  const [chatEnCours, setChatEnCours] = useState(false)

  const langueRef = useRef(langue)
  useEffect(() => { langueRef.current = langue }, [langue])

  useEffect(() => {
    setVisible(true)
    const dejaVu = localStorage.getItem(CLE_SALUT_VU)
    if (!dejaVu) {
      setBulleSalut(true)
      let annule = false
      fetch('/api/ansanm/contexte')
        .then(res => res.json())
        .then(data => {
          if (annule) return
          const resultat = selectionnerContexte(data.contextes || [], langueRef.current)
          if (resultat) setMessageSalutContextuel(resultat.message)
        })
        .catch(() => {})
        .finally(() => {
          if (!annule) setTimeout(() => setBulleSalut(false), 9000)
        })
      return () => { annule = true }
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

  useEffect(() => {
    const ecouterAmbiant = (e: Event) => {
      const detail = (e as CustomEvent).detail as { action: ActionAmbiante }
      const cles = MAPPING_AMBIANT_CLES[detail.action]
      if (!cles) return
      const cleChoisie = cles[Math.floor(Math.random() * cles.length)]
      const texte = (t.loyita as Record<string, string>)[cleChoisie]
      if (!texte) return
      setToastAmbiant(texte)
      const timer = setTimeout(() => setToastAmbiant(null), 4500)
      return () => clearTimeout(timer)
    }
    window.addEventListener('lotbo:toast_ambiant', ecouterAmbiant)
    return () => window.removeEventListener('lotbo:toast_ambiant', ecouterAmbiant)
  }, [t])

  useEffect(() => {
    const ecouterChat = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string }
      setBulleSalut(false)
      setBulleCelebration(null)
      setPanneauOuvert(true)
      if (detail.message) {
        envoyerMessage(detail.message)
      }
    }
    window.addEventListener('lotbo:ouvrir_chat', ecouterChat)
    return () => window.removeEventListener('lotbo:ouvrir_chat', ecouterChat)
  }, [])

  const envoyerMessage = async (texteOverride?: string) => {
    const texte = (texteOverride ?? saisie).trim()
    if (!texte || chatEnCours) return

    const nouveauxMessages: MessageChat[] = [...messages, { role: 'user', content: texte }]
    setMessages(nouveauxMessages)
    setSaisie('')
    setChatEnCours(true)

    try {
      const res = await fetch('/api/loyita-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nouveauxMessages, langue }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reponse }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '...' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '...' }])
    }
    setChatEnCours(false)
  }

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
        @keyframes lotboGuideBulleApparait { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes lotboGuideClinOeil { 0%, 85%, 100% { transform: scaleY(1) } 90% { transform: scaleY(0.15) } }
        .lotbo-guide-eye-clin-droit { animation: lotboGuideBlink 3.6s ease-in-out infinite; transform-origin: center }
        .lotbo-guide-eye-clin-gauche { animation: lotboGuideClinOeil 4.2s ease-in-out infinite; transform-origin: center }
        @keyframes lotboGuideRebond { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.25) } }
        .lotbo-guide-eye-rebond { animation: lotboGuideRebond 2.8s ease-in-out infinite; transform-origin: center }
        @keyframes lotboGuideFloatJoyeux { 0%, 100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-6px) rotate(-2deg) } }
        .lotbo-guide-svg-joyeux { animation: lotboGuideFloatJoyeux 2.2s ease-in-out infinite }
      `}</style>

      {bulleSalut && !panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(150px + env(safe-area-inset-bottom))', right: 20, zIndex: 998,
          background: '#1A1410', color: '#F7F2E8', fontSize: 13,
          padding: '10px 14px', borderRadius: '14px 14px 2px 14px',
          maxWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {messageSalutContextuel ?? "Bonjour ! Je suis là pour t'aider à explorer LOTBO 👋"}
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

      {toastAmbiant && !panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(150px + env(safe-area-inset-bottom))', right: 20, zIndex: 998,
          background: '#1A1410', color: '#F7F2E8', fontSize: 13, fontWeight: 'bold',
          padding: '10px 14px', borderRadius: '14px 14px 2px 14px', maxWidth: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'lotboGuideBulleApparait 0.2s ease-out',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="20" height="20" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
            <path d="M28 6 C40 6 48 15 48 27 C48 37 41 45 30 47 C29 47.3 27.5 47.3 26.5 46.5 C22 43 8 40 8 27 C8 15 16 6 28 6 Z" fill="#C8431A" />
            <circle cx="20" cy="25" r="3" fill="#F7F2E8" />
            <circle cx="36" cy="25" r="3" fill="#F7F2E8" />
          </svg>
          <span>{toastAmbiant}</span>
        </div>
      )}

      {!panneauOuvert && (
        <button
          onClick={ouvrirPanneau}
          aria-label="Ouvrir le guide LOTBO"
          style={{ position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom))', right: 20, zIndex: 998, width: 56, height: 56, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg className={variante === 2 ? "lotbo-guide-svg lotbo-guide-svg-joyeux" : "lotbo-guide-svg"} viewBox="0 0 56 56" width="56" height="56">
            <circle className="lotbo-guide-halo" cx="28" cy="28" r="26" fill="#D4A820" opacity="0.25" />
            <path d="M28 6 C40 6 48 15 48 27 C48 37 41 45 30 47 C29 47.3 27.5 47.3 26.5 46.5 C22 43 8 40 8 27 C8 15 16 6 28 6 Z" fill="#C8431A" />
            {variante === 0 && (
              <>
                <circle className="lotbo-guide-eye" cx="20" cy="25" r="3" fill="#F7F2E8" />
                <circle className="lotbo-guide-eye" cx="36" cy="25" r="3" fill="#F7F2E8" />
              </>
            )}
            {variante === 1 && (
              <>
                <circle className="lotbo-guide-eye-clin-gauche" cx="20" cy="25" r="3" fill="#F7F2E8" />
                <circle className="lotbo-guide-eye-clin-droit" cx="36" cy="25" r="3" fill="#F7F2E8" />
              </>
            )}
            {variante === 2 && (
              <>
                <circle className="lotbo-guide-eye-rebond" cx="20" cy="25" r="3" fill="#F7F2E8" />
                <circle className="lotbo-guide-eye-rebond" cx="36" cy="25" r="3" fill="#F7F2E8" />
              </>
            )}
          </svg>
        </button>
      )}

      {panneauOuvert && (
        <div style={{
          position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom))', right: 20, left: 20, maxWidth: 340, marginLeft: 'auto', zIndex: 999,
          background: 'white', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', maxHeight: '60vh',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 10px' }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#1A1410' }}>Guide LOTBO</span>
            <button onClick={fermerPanneau} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C5A40', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ overflowY: 'auto', padding: '0 16px', flex: 1 }}>
            <p style={{ fontSize: 12, color: '#4A3830', lineHeight: 1.5, marginBottom: wikivoyage ? 10 : 12 }}>
              {wikivoyage ? wikivoyage.extrait : conseilGenerique}
            </p>
            {wikivoyage?.lien && (
              <a href={wikivoyage.lien} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#F7F2E8', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#8C5A40', textDecoration: 'none', marginBottom: 12 }}>
                📖 Source Wikivoyage
              </a>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 8, display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.5,
                  background: m.role === 'user' ? '#C8431A' : '#F7F2E8',
                  color: m.role === 'user' ? 'white' : '#1A1410',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatEnCours && (
              <div style={{ fontSize: 12, color: '#8C5A40', fontStyle: 'italic', marginBottom: 8 }}>...</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #E8E0D0' }}>
            <input
              type="text"
              value={saisie}
              onChange={e => setSaisie(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') envoyerMessage() }}
              placeholder="Écris ton message..."
              disabled={chatEnCours}
              style={{ flex: 1, border: '1px solid #E8E0D0', borderRadius: 999, padding: '8px 14px', fontSize: 13, outline: 'none' }}
            />
            <button
              onClick={() => envoyerMessage()}
              disabled={chatEnCours || !saisie.trim()}
              style={{ background: '#C8431A', color: 'white', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', flexShrink: 0, opacity: (chatEnCours || !saisie.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
