const CACHE_NAME = 'crm-pwa-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  // Always try network first, fallback to cache
  if(req.method !== 'GET') return;
  evt.respondWith(
    fetch(req).then(res => {
      // update cache in background
      const r2 = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, r2));
      return res;
    }).catch(()=> caches.match(req).then(c => c || caches.match('/index.html')))
  );
});
