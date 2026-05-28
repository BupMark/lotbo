'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const EXCLUSIONS = ['/admin', '/login']

export default function TabBarGlobal() {
  const pathname                = usePathname()
  const [userId, setUserId]     = useState<string | null>(null)
  const [nonLues, setNonLues]   = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('lu', false)
          .then(({ count }) => setNonLues(count || 0))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (!uid) setNonLues(0)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (EXCLUSIONS.some(p => pathname.startsWith(p))) return null

  const isHome   = pathname === '/'
  const isAjout  = pathname.startsWith('/ajouter')
  const isNotifs = pathname.startsWith('/notifications')
  const isProfil = pathname.startsWith('/profil')

  const c = (active: boolean) => active ? '#C8431A' : '#8C5A40'

  return (
    <nav className="lotbo-tabbar-global" role="navigation" aria-label="Navigation principale">

      {/* Carte */}
      <a href="/" className="lotbo-tabbar-item" aria-label="Carte">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" stroke={c(isHome)} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
          <line x1="9" y1="3" x2="9" y2="18" stroke={c(isHome)} strokeWidth="1.8"/>
          <line x1="15" y1="6" x2="15" y2="21" stroke={c(isHome)} strokeWidth="1.8"/>
        </svg>
        <span style={{ color: c(isHome) }}>Carte</span>
      </a>

      {/* Recherche */}
      <a href="/?s=1" className="lotbo-tabbar-item" aria-label="Recherche">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#8C5A40" strokeWidth="1.8"/>
          <path d="M16.5 16.5L21 21" stroke="#8C5A40" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#8C5A40' }}>Recherche</span>
      </a>

      {/* Ajouter — FAB */}
      <a href="/ajouter" className="lotbo-tabbar-item" aria-label="Ajouter un événement">
        <div className="lotbo-tabbar-fab">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ color: c(isAjout) }}>Ajouter</span>
      </a>

      {/* Notifications */}
      <a href="/notifications" className="lotbo-tabbar-item" aria-label="Notifications">
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 16V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill={c(isNotifs)}/>
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill={c(isNotifs)}/>
          </svg>
          {nonLues > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -5,
              background: '#C8431A', color: 'white',
              fontSize: 8, fontWeight: 'bold', borderRadius: 999,
              minWidth: 14, height: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1,
            }}>
              {nonLues > 9 ? '9+' : nonLues}
            </span>
          )}
        </div>
        <span style={{ color: c(isNotifs) }}>Notifs</span>
      </a>

      {/* Profil */}
      <a href={userId ? '/profil' : '/login'} className="lotbo-tabbar-item" aria-label="Profil">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={c(isProfil)} strokeWidth="1.8"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c(isProfil)} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ color: c(isProfil) }}>Profil</span>
      </a>

    </nav>
  )
}
