// Last Stand Arena — Service Worker (Push Notifications)

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload;
  try {
    payload = e.data.json();
  } catch {
    payload = { title: "Last Stand Arena", body: e.data.text(), icon: "/icon-192.png" };
  }

  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url ?? "/" },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: payload.tag ?? "lsa-notification",
    renotify: true,
  };

  e.waitUntil(self.registration.showNotification(payload.title ?? "Last Stand Arena", options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
