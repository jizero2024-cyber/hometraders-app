// 오프라인 대비 캐시 — 네트워크 우선(온라인이면 항상 최신 코드), 오프라인이면 캐시.
const CACHE = 'ht-v10';
const ASSETS = [
  './', './index.html', './css/app.css',
  './js/app.js', './js/store-supabase.js', './js/data.js', './js/ecount-items.js', './js/item-map.js', './js/supabase-config.js', './js/partners-seed.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/logo-full.png', './icons/favicon.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return; // CDN(폰트)은 기본 처리
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
