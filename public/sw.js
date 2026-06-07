const SW_VERSION      = 'v2'
const CACHE_SHELL     = `lotbo-shell-${SW_VERSION}`
const CACHE_PAGES     = `lotbo-pages-${SW_VERSION}`
const CACHE_ASSETS    = `lotbo-assets-${SW_VERSION}`
const CACHE_IMAGES    = `lotbo-images-${SW_VERSION}`

const ALL_CACHES      = [CACHE_SHELL, CACHE_PAGES, CACHE_ASSETS, CACHE_IMAGES]
const MAX_PAGES       = 30
const MAX_IMAGES      = 60

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
]

// ── Install : précache du shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate : purge des anciens caches ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys  = await cache.keys()
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map(k => cache.delete(k)))
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1. Bypass : API internes + Supabase + autres origines tierces
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('mapbox.com') ||
    (url.origin !== self.location.origin && !url.hostname.includes('lotbo'))
  ) {
    return
  }

  // 2. Chunks Next.js immutables (_next/static/) → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  // 3. Images → stale-while-revalidate avec limite de 60 entrées
  if (/\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then(async cache => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone())
            trimCache(CACHE_IMAGES, MAX_IMAGES)
          }
          return response
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // 4. Navigation → network-first → cache → /offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_PAGES).then(cache => {
              cache.put(request, response.clone())
              trimCache(CACHE_PAGES, MAX_PAGES)
            })
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const shell = await caches.match('/')
          if (shell) return shell
          return caches.match('/offline.html')
        })
    )
    return
  }

  // 5. Reste (fonts, autres assets) → network-first avec fallback cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data    = event.data ? event.data.json() : {}
  const title   = data.title || 'Lotbo'
  const options = {
    body    : data.body || 'Nouvel événement près de toi !',
    icon    : '/icon-192.png',
    badge   : '/icon-192.png',
    data    : { url: data.url || 'https://app.lotbo.app' },
    vibrate : [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || 'https://app.lotbo.app'
  event.waitUntil(clients.openWindow(url))
})
