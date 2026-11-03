/* Ancienne adresse : l’app a déménagé. Remplace l’ancien service worker et efface l’ancienne app. */
const CACHE = 'emp-pamg-moved';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './icons/icon-192.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('emp-pamg-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(() => caches.match('./'))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
