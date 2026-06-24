'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { type Langue } from './i18n'

const STORAGE_KEY = 'lotbo_langue'
const LANGUES_VALIDES: Langue[] = ['fr', 'en', 'es', 'pt', 'ht']

function estLangueValide(l: string): l is Langue {
  return LANGUES_VALIDES.includes(l as Langue)
}

export function useLangue() {
  const [langue, setLangueState] = useState<Langue>('fr')
  const [pret, setPret] = useState(false)

  useEffect(() => {
    const init = async () => {
      // 1. localStorage en priorité (instantané, pas de flash)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && estLangueValide(stored)) {
        setLangueState(stored)
        setPret(true)
        return
      }

      // 2. profiles.langue_preference si connecté
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('langue_preference')
          .eq('id', session.user.id)
          .single()
        const pref = profile?.langue_preference
        if (pref && estLangueValide(pref)) {
          setLangueState(pref)
          localStorage.setItem(STORAGE_KEY, pref)
          setPret(true)
          return
        }
      }

      // 3. Fallback fr
      setPret(true)
    }
    init()
  }, [])

  const setLangue = async (l: Langue) => {
    setLangueState(l)
    localStorage.setItem(STORAGE_KEY, l)

    // Sync DB si connecté (fire & forget)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      supabase.from('profiles')
        .update({ langue_preference: l, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
        .then(() => {})
    }
  }

  return { langue, setLangue, pret }
}
