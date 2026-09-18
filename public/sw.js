// Service Worker — RyHaD Tic-Medic PWA & Web Push Notifications
const CACHE_NAME = "ryhad-crm-pwa-v2";
const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Pre-caching non bloquant:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Événement fetch requis pour la conformité PWA dans Chrome/Edge
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne JAMAIS intercepter :
  // 1. Les requêtes non GET
  // 2. Les appels API (/api/)
  // 3. Les requêtes de navigation et composants serveur Next.js (RSC, _rsc, headers Next.js)
  // 4. Les pages dynamiques (/crm)
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/crm") ||
    url.searchParams.has("_rsc") ||
    event.request.headers.get("RSC") === "1" ||
    event.request.headers.get("Next-Router-State-Tree")
  ) {
    return;
  }

  // Pour les assets statiques uniquement (images, manifest, favicons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});

// Écoute des notifications Push reçues du serveur
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "RyHaD Tic-Medic";
    const options = {
      body: data.body || "Nouvelle mise à jour disponible",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-192x192.png",
      tag: data.tag || "ryhad-notification",
      data: {
        url: data.url || "/crm",
      },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Erreur lecture données notification push:", err);
  }
});

// Clic sur la notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/crm";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la cibler et naviguer
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
