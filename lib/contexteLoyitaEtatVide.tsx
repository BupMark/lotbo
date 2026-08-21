'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PositionCible {
  x: number
  y: number
}

interface LoyitaEtatVideContextType {
  etatVideActif: boolean
  positionCible: PositionCible | null
  signalerEtatVide: (position: PositionCible) => void
  signalerFinEtatVide: () => void
}

const LoyitaEtatVideContext = createContext<LoyitaEtatVideContextType | null>(null)

export function LoyitaEtatVideProvider({ children }: { children: ReactNode }) {
  const [etatVideActif, setEtatVideActif] = useState(false)
  const [positionCible, setPositionCible] = useState<PositionCible | null>(null)

  const signalerEtatVide = useCallback((position: PositionCible) => {
    setPositionCible(position)
    setEtatVideActif(true)
  }, [])

  const signalerFinEtatVide = useCallback(() => {
    setEtatVideActif(false)
    setPositionCible(null)
  }, [])

  return (
    <LoyitaEtatVideContext.Provider value={{ etatVideActif, positionCible, signalerEtatVide, signalerFinEtatVide }}>
      {children}
    </LoyitaEtatVideContext.Provider>
  )
}

export function useLoyitaEtatVide() {
  const ctx = useContext(LoyitaEtatVideContext)
  if (!ctx) throw new Error('useLoyitaEtatVide doit être utilisé dans LoyitaEtatVideProvider')
  return ctx
}
