/* MOVILIDADRD — Service Worker
   Estrategia:
   - Shell estático (HTML/CSS/iconos locales): cache-first con actualización en segundo plano.
   - Llamadas al API (script.google.com / googleapis): SIEMPRE red — nunca se cachean
     datos personales ni financieros.
   - Sin conexión: página offline.html clara, sin fingir éxito.
*/
const VERSION = 'mrd-v0.15.7';
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './css/brand.css',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/logo-horizontal.svg',
  './assets/icons/logo-horizontal-dark.svg',
  './servicios/transfer-aeropuerto-las-americas.html',
  './servicios/transfer-aeropuerto-puntacana.html',
  './servicios/transporte-ejecutivo-santo-domingo.html',
  './servicios/viajes-interior-republica-dominicana.html',
  './qr.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas al backend ni a Firebase
  const esApi = url.hostname.includes('script.google.com') ||
                url.hostname.includes('googleapis.com') ||
                url.hostname.includes('firebase');
  if (esApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Solo GET del shell mismo origen
  if (event.request.method === 'GET' && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const red = fetch(event.request).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(VERSION).then((c) => c.put(event.request, copia));
          }
          return resp;
        }).catch(() => cached || caches.match('./offline.html'));
        return cached || red;
      })
    );
  }
});



