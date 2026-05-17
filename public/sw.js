self.addEventListener('install', function(e) {
  self.skipWaiting()
})

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim())
})

self.addEventListener('fetch', function(e) {
  // Ne jamais intercepter les appels API
  if (e.request.url.includes('/api/')) return

self.addEventListener('fetch', function(e) {
  // Ne jamais intercepter les appels API ni Supabase
  if (e.request.url.includes('/api/') || 
      e.request.url.includes('supabase.co')) return

  e.respondWith(fetch(e.request))
})
})

self.addEventListener('push', function(e) {
  const data = e.data ? e.data.json() : {}
  const title = data.title || 'Lotbo'
  const options = {
    body: data.body || 'Nouvel événement près de toi !',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || 'https://app.lotbo.app' },
    vibrate: [200, 100, 200],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(e) {
  e.notification.close()
  const url = e.notification.data?.url || 'https://app.lotbo.app'
  e.waitUntil(clients.openWindow(url))
})