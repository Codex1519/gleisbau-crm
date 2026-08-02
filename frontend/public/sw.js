// Service Worker: macht das Feld-Formular offline-fähig.
// - App-Shell + Assets werden gecacht (Baustelle = schlechtes Netz)
// - API-Aufrufe werden NIE gecacht (frische Daten oder bewusst offline)
// Versions-String bei breaking Changes erhöhen → alte Caches werden geräumt.

const VERSION = 'gleisbau-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(['/']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Seitenaufrufe: Netz zuerst (frische App), sonst gecachte Shell
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const kopie = r.clone()
          caches.open(VERSION).then((c) => c.put('/', kopie))
          return r
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Statische Dateien (gehashte Assets, Favicon): Cache zuerst
  e.respondWith(
    caches.match(e.request).then(
      (treffer) =>
        treffer ||
        fetch(e.request).then((r) => {
          if (r.ok) {
            const kopie = r.clone()
            caches.open(VERSION).then((c) => c.put(e.request, kopie))
          }
          return r
        })
    )
  )
})
