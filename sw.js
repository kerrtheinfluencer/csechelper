/* =========================================================
   CXC PAST PAPERS — sw.js
   Full offline support — cache-first with network update
   ========================================================= */

const VERSION  = 'cxcpapers-v4';
const FALLBACK = '/offline.html';

// Files to pre-cache on install
const SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/brain.js',
  '/ai-search.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ── Install: cache the app shell ─────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL.filter(u => !u.startsWith('https://cdn'))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Supabase API — always network, never cache
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(request));
    return;
  }

  // Google Fonts — cache first
  if (url.hostname.includes('fonts.goog') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // CDN resources (Transformers.js, Supabase client) — cache after first load
  if (url.hostname.includes('jsdelivr') || url.hostname.includes('cdnjs') || url.hostname.includes('unpkg')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(VERSION).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // App shell (HTML, CSS, JS, images) — stale-while-revalidate
  // Serve from cache immediately, update cache in background
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(request);

      const fetchPromise = fetch(request).then(res => {
        if (res.ok && res.status === 200) {
          cache.put(request, res.clone());
        }
        return res;
      }).catch(() => null);

      // Return cached immediately if available, otherwise wait for network
      if (cached) {
        // Background update
        fetchPromise;
        return cached;
      }

      // No cache — wait for network
      const fresh = await fetchPromise;
      if (fresh) return fresh;

      // Both failed — show offline page for navigation, empty for assets
      if (request.mode === 'navigate') {
        return cache.match(FALLBACK) || new Response('Offline', { status: 503 });
      }
      return new Response('', { status: 503 });
    })
  );
});

// ── Background sync for when connection returns ───────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
