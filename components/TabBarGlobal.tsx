'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useLangue } from '../lib/useLangue'
import { getTraductions } from '../lib/i18n'

const EXCLUSIONS = ['/admin', '/login']

export default function TabBarGlobal() {
  const pathname              = usePathname()
  const { langue }            = useLangue()
  const t                     = getTraductions(langue)
  const [userId, setUserId]   = useState<string | null>(null)
  const [nonLues, setNonLues] = useState(0)
  const [badgeAnsanm, setBadgeAnsanm] = useState(false)

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

      fetch('/api/ansanm/dernier-moment')
        .then(r => r.json())
        .then(async (d) => {
          if (!d.derniere_activite) return
          const derniereActivite = new Date(d.derniere_activite).getTime()

          let lastSeen: number | null = null
          if (uid) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('last_seen_ansanm')
              .eq('id', uid)
              .single()
            lastSeen = prof?.last_seen_ansanm ? new Date(prof.last_seen_ansanm).getTime() : null
          } else {
            const stored = localStorage.getItem('lotbo_last_seen_ansanm')
            lastSeen = stored ? parseInt(stored, 10) : null
          }

          setBadgeAnsanm(!lastSeen || derniereActivite > lastSeen)
        })
        .catch(() => {})
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
  const isAnsanm = pathname.startsWith('/ansanm')
  const isProfil = pathname.startsWith('/profil')

  const c = (active: boolean) => active ? '#C8431A' : 'rgba(255,255,255,0.5)'

  return (
    <nav className="lotbo-tabbar-global" role="navigation" aria-label={t.nav.tabbar.navigationPrincipale}>

      {/* Carte */}
      <a href="/" className="lotbo-tabbar-item" aria-label={t.nav.tabbar.carte}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" stroke={c(isHome)} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
          <line x1="9" y1="3" x2="9" y2="18" stroke={c(isHome)} strokeWidth="1.8"/>
          <line x1="15" y1="6" x2="15" y2="21" stroke={c(isHome)} strokeWidth="1.8"/>
        </svg>
        <span style={{ color: c(isHome) }}>{t.nav.tabbar.carte}</span>
      </a>

      {/* Recherche */}
      <a href="/?s=1" className="lotbo-tabbar-item" aria-label={t.nav.tabbar.recherche}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke={c(false)} strokeWidth="1.8"/>
          <path d="M16.5 16.5L21 21" stroke={c(false)} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ color: c(false) }}>{t.nav.tabbar.recherche}</span>
      </a>

      {/* Ajouter — FAB central */}
      <a href="/ajouter" className="lotbo-tabbar-item" aria-label={t.nav.tabbar.ajouterAria}>
        <div className="lotbo-tabbar-fab">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ color: c(isAjout) }}>{t.nav.tabbar.ajouter}</span>
      </a>

      {/* Ansanm — Communauté */}
      <a href="/ansanm" className="lotbo-tabbar-item" aria-label={t.nav.tabbar.ansanmAria}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3" stroke={c(isAnsanm)} strokeWidth="1.8"/>
            <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke={c(isAnsanm)} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M16 3.5a3.5 3.5 0 0 1 0 6.9" stroke={c(isAnsanm)} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M21 20c0-3-2.2-5-5-5.3" stroke={c(isAnsanm)} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          {badgeAnsanm && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8, borderRadius: '50%',
              background: '#C8431A', border: '1.5px solid #1A1410',
            }} />
          )}
        </div>
        <span style={{ color: c(isAnsanm) }}>{t.nav.tabbar.ansanm}</span>
      </a>

      {/* Profil — badge notif migré ici */}
      <a href={userId ? '/profil' : `/login?redirect=${encodeURIComponent(pathname || '/')}`} className="lotbo-tabbar-item" aria-label={t.nav.tabbar.profil}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={c(isProfil)} strokeWidth="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c(isProfil)} strokeWidth="1.8" strokeLinecap="round"/>
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
        <span style={{ color: c(isProfil) }}>{t.nav.tabbar.profil}</span>
      </a>

    </nav>
  )
}
