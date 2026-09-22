const CACHE_NAME = 'risk-analizi-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/index.css',
  './js/app.js',
  './js/database.js',
  './js/fine-kinney.js',
  './js/gemini-api.js',
  './js/media-handler.js',
  './js/compliance-checker.js',
  './js/excel-export.js',
  './js/ui-components.js',
  './js/tanimlar.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
];

// Kurulum - Statik dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Etkinleştirme - Eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// İstekleri Yakalama - Offline Desteği (Stale-while-revalidate stratejisi)
self.addEventListener('fetch', (event) => {
  // Sadece GET isteklerini işle (POST vs geçsin)
  if (event.request.method !== 'GET') return;
  
  // SheetJS veya Google Fonts vs dış CDN'ler
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          // Ağa ulaşılamıyorsa bir şey yapma, catch blocku
        });
        
        return cachedResponse || fetchPromise;
      })
    );
  }
});
