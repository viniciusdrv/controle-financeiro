// Permite abrir o app sem internet. O próprio app (index.html) é buscado na rede primeiro,
// para as atualizações chegarem logo; sem conexão, usa a cópia guardada.
const CACHE = 'cf-v2';
const CDN = [
  'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.27.0/lib/msal-browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest', './icon.svg', ...CDN])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin){
    // 'no-cache' faz o navegador sempre conferir no servidor se há versão nova do app
    e.respondWith(
      fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then(r => {
        if (r.ok){ const copia = r.clone(); caches.open(CACHE).then(c => c.put(url.pathname.endsWith('/') ? './' : e.request, copia)); }
        return r;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
  } else if (CDN.includes(url.href)){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
