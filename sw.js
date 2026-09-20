// 오프라인 대비 캐시 — 네트워크 우선(온라인이면 항상 최신 코드), 오프라인이면 캐시.
const CACHE = 'ht-v43';
const ASSETS = [
  './', './index.html', './css/app.css', './css/erp.css',
  './js/app.js', './js/store-supabase.js', './js/data.js', './js/ecount-items.js', './js/textread.js', './js/delivery.js', './js/supabase-config.js', './js/partners-seed.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/logo-full.png', './icons/confirm-logo.png', './icons/favicon.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    // 이전 버전에서 올라온 업데이트면 열려있는 창을 새 코드로 자동 새로고침 → 캐시 수동삭제 불필요
    if (old.length) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    }
  })());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return; // CDN(폰트)은 기본 처리
  if (url.pathname.startsWith('/catalog/')) return; // 카탈로그 편집기는 사진이 많아 앱 캐시에 담지 않음
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
