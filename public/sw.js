const CACHE_NAME = "revinted-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests, skip Supabase/API calls
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("supabase") ||
    event.request.url.includes("functions")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful static responses
        if (
          response.ok &&
          (event.request.url.endsWith(".js") ||
            event.request.url.endsWith(".css") ||
            event.request.url.endsWith(".woff2"))
        ) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, cloned)
          );
        }
        return response;
      });
    })
  );
});

// Push notification support
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "ReVinted", {
      body: data.body ?? "La tua analisi è pronta!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "analysis-ready",
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? "/dashboard")
  );
});
