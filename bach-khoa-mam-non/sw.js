/* Bách Khoa Mầm Non 4D — service worker: dùng offline, bản mới luôn được ưu tiên */
const CACHE_NAME = 'bachkhoa-mamnon-4d-v3';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
      /* Trang chính: lấy bản mới trên mạng trước, mất mạng mới dùng bản đã lưu */
      e.respondWith(fetch(e.request).then((r) => {
        const c = r.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, c));
        return r;
      }).catch(() => caches.match(e.request)));
      return;
    }
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const c = r.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(e.request, c));
      return r;
    }).catch(() => hit)));
    return;
  }
  /* CDN (font, pdf.js): có sẵn thì dùng, không thì tải rồi lưu lại */
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r && r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(e.request, c)); }
    return r;
  }).catch(() => hit)));
});
