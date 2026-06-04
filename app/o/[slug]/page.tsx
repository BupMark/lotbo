'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
export default function DeeplinkOrganisation() {
  const params = useParams()
  const slug = params?.slug as string
  useEffect(() => {
    if (slug) window.location.replace(`/organisation/${slug}?utm_source=share&utm_medium=deeplink&utm_campaign=org`)
  }, [slug])
  return <div style={{ minHeight:'100dvh', background:'#F7F2E8', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ color:'#8C5A40' }}>Chargement…</p></div>
}
