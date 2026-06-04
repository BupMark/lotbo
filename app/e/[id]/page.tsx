'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
export default function DeeplinkEvenement() {
  const params = useParams()
  const id = params?.id as string
  useEffect(() => {
    if (id) window.location.replace(`/evenement/${id}?utm_source=share&utm_medium=deeplink&utm_campaign=event`)
  }, [id])
  return <div style={{ minHeight:'100dvh', background:'#F7F2E8', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#8C5A40' }}>Chargement…</p></div>
}
