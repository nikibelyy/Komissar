/* sw.js — simple caching service worker (no notifications) */
const CACHE = 'lightcrm-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(fres => {
      if (req.url.startsWith(self.location.origin)) {
        const copy = fres.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return fres;
    })).catch(()=> caches.match('/'))
  );
});
