// Permite abrir o app sem internet.
// - A página do app é buscada na rede primeiro (as atualizações chegam logo); sem conexão, usa a cópia guardada.
// - Ícone e manifesto: cópia guardada primeiro.
// - Bibliotecas, estilos e fontes de outros sites (login da Microsoft, gráficos, fonte Inter): guardados no primeiro uso,
//   sem lista fixa de endereços (trocar a versão no index.html não quebra o modo offline).
const CACHE = 'cf-v3';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.webmanifest', './icon.svg'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
const guardar = (req, r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return r; };
const doCacheOuRede = req => caches.match(req).then(r => r || fetch(req).then(x => guardar(req, x)));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    if (req.mode === 'navigate'){
      e.respondWith(
        fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }) // sempre confere se há versão nova
          .then(r => guardar('./', r))
          .catch(() => caches.match('./'))
      );
    } else e.respondWith(doCacheOuRede(req));
  } else if (['script', 'style', 'font'].includes(req.destination)){
    e.respondWith(doCacheOuRede(req));
  }
});
