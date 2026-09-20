/* global self, caches, clients, fetch, Response */

const CACHE_VERSION = "v1";
const PRECACHE_NAME = `inspecciones-precache-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `inspecciones-runtime-${CACHE_VERSION}`;
const CACHE_PREFIX = "inspecciones-";

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon-192x192.png",
  "/favicon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );

});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(CACHE_PREFIX) &&
                cacheName !== PRECACHE_NAME &&
                cacheName !== RUNTIME_CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function cacheRuntimeResponse(request, response) {
  if (!response || !response.ok || response.type === "opaque") {
    return response;
  }

  const copy = response.clone();
  caches
    .open(RUNTIME_CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => {
      // El contenido sigue siendo utilizable aunque el almacenamiento falle.
    });

  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return cacheRuntimeResponse(request, response);
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // El shell precacheado sirve como página de recuperación para navegación.
    if (request.mode === "navigate") {
      const appShell = await caches.match("/");
      if (appShell) {
        return appShell;
      }
    }

    return new Response("Sin conexión y sin contenido disponible.", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return networkFirst(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo se manejan lecturas del mismo origen: no se cachean peticiones de
  // terceros, mutaciones ni información que pudiera ser sensible.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Los recursos estáticos pueden reutilizarse de inmediato; si faltan en
  // caché, se obtienen de la red y se guardan como runtime cache.
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documentos y datos GET usan red primero para privilegiar contenido actual,
  // con caché como recuperación cuando la conectividad falla.
  event.respondWith(networkFirst(request));
});
