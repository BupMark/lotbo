'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PositionCible {
  x: number
  y: number
}

interface LoyitaEtatVideContextType {
  etatVideActif: boolean
  positionCible: PositionCible | null
  message: string | null
  signalerEtatVide: (position: PositionCible, message: string) => void
  signalerFinEtatVide: () => void
}

const LoyitaEtatVideContext = createContext<LoyitaEtatVideContextType | null>(null)

export function LoyitaEtatVideProvider({ children }: { children: ReactNode }) {
  const [etatVideActif, setEtatVideActif] = useState(false)
  const [positionCible, setPositionCible] = useState<PositionCible | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const signalerEtatVide = useCallback((position: PositionCible, msg: string) => {
    setPositionCible(position)
    setMessage(msg)
    setEtatVideActif(true)
  }, [])

  const signalerFinEtatVide = useCallback(() => {
    setEtatVideActif(false)
    setPositionCible(null)
    setMessage(null)
  }, [])

  return (
    <LoyitaEtatVideContext.Provider value={{ etatVideActif, positionCible, message, signalerEtatVide, signalerFinEtatVide }}>
      {children}
    </LoyitaEtatVideContext.Provider>
  )
}

export function useLoyitaEtatVide() {
  const ctx = useContext(LoyitaEtatVideContext)
  if (!ctx) throw new Error('useLoyitaEtatVide doit être utilisé dans LoyitaEtatVideProvider')
  return ctx
}
