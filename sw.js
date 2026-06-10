/* BEAT THE HEAT: BUSAN — Service Worker (PWA)
 * 전략: ★network-first★ — 온라인이면 항상 서버 최신(빌드 갇힘 사고 원천 차단),
 * 오프라인일 때만 캐시 폴백(ignoreSearch로 ?v= 달라도 매치). same-origin만 캐시. */
const CACHE = 'bth-busan-v1';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  let sameOrigin = false;
  try { sameOrigin = new URL(e.request.url).origin === self.location.origin; } catch (_) {}
  if (!sameOrigin) return;   // 폰트/Firebase/날씨 API 등 외부는 건드리지 않음
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || Response.error()))
  );
});
