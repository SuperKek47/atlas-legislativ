/* Atlasul legislativ — lucrul fără internet.
   Codul aplicației (pagini, scripturi, stiluri) se ia mereu întâi din rețea, ca o versiune nouă să apară imediat;
   din cache doar când nu e internet. Textele legilor se iau din cache și se reîmprospătează în fundal. */
const V = 'atlas-v24';
const SHELL = [
  './', './index.html', './menu.html', './app.css', './phone.css', './clash.css', './fx.css', './manifest.webmanifest',
  './data/moldova.js',
  './js/core.js', './js/fx.js', './js/tts.js', './js/brand.js', './js/study.js', './js/game.js', './js/quiz.js', './js/eco.js',
  './js/views.js', './js/dosar.js', './js/firm.js', './js/play.js', './js/arena.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const isCode = url => url.pathname.endsWith('/') || /\.(html|js|css|webmanifest)$/.test(url.pathname) && !/\/data\/.+\.js$/.test(url.pathname);
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin || url.pathname.includes('/api/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(V);
    if (r.mode === 'navigate' || isCode(url)) {
      try { const resp = await fetch(r, { cache: 'no-store' }); if (resp && resp.ok) cache.put(r, resp.clone()); return resp; }
      catch (err) { return (await cache.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? await cache.match('./index.html') : null) || new Response('Offline', { status: 503 }); }
    }
    const hit = await cache.match(r, { ignoreSearch: true });
    const net = fetch(r).then(resp => { if (resp && resp.ok) cache.put(r, resp.clone()); return resp; }).catch(() => null);
    if (hit) return hit;
    return (await net) || new Response('Offline', { status: 503 });
  })());
});
