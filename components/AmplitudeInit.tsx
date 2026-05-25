'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAmplitude, track } from '../lib/amplitude'

export default function AmplitudeInit() {
  const pathname = usePathname()

  useEffect(() => {
    initAmplitude()
  }, [])

  useEffect(() => {
    track('page_view', { path: pathname })
  }, [pathname])

  return null
}
