// sw.js - service worker for offline caching
const CACHE = 'crm-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k!==CACHE ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event=>{
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(res => res || fetch(request).then(net=>{
      const copy = net.clone();
      caches.open(CACHE).then(c=> c.put(request, copy)).catch(()=>{});
      return net;
    }).catch(()=> caches.match('./index.html')))
  );
});
