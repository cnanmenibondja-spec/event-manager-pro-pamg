/* Event Manager Pro — service worker : l'application s'installe et s'ouvre même sans réseau.
   Les données en ligne (Supabase) ne passent JAMAIS par le cache : elles vont toujours directement au serveur. */
const VERSION = '4.4';
const PREFIX = 'emp-pamg-';
const CACHE = PREFIX + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase (comptes, données, fichiers, direct) et WhatsApp : toujours en direct, jamais en cache
  if (/supabase\.(co|in)$/.test(url.hostname) || url.hostname.endsWith('supabase.co') || /whatsapp|wa\.me/.test(url.hostname)) return;
  if (url.origin === location.origin && !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (req.mode === 'navigate') {
    // Le réseau d'abord (nouvelle version tout de suite), le cache si pas de connexion
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Polices, bibliothèque de connexion, icônes : le cache d'abord, mis à jour en arrière-plan
  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
