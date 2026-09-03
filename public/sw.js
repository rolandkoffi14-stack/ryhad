// Service Worker — RyHaD Tic-Medic PWA & Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Écoute des notifications Push reçues du serveur
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "RyHaD Tic-Medic";
    const options = {
      body: data.body || "Nouvelle mise à jour disponible",
      icon: data.icon || "/images/logo.jpg",
      badge: data.badge || "/images/logo.jpg",
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
