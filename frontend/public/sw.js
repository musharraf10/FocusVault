const CACHE_NAME = "focus-vault-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/android/android-launchericon-192-192.png",
  "/android/android-launchericon-512-512.png",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.url.includes("/api/study/state")) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => queueRequest(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response || fetch(request).catch(() => caches.match("/index.html"))
        );
      })
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "/android/android-launchericon-192-192.png",
    badge: "/android/android-launchericon-192-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "/android/android-launchericon-192-192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/android/android-launchericon-192-192.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Focus Vault", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for queued API requests
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-session") {
    event.waitUntil(syncQueuedRequests());
  }
});

// Store failed API requests in IndexedDB
async function queueRequest(request) {
  try {
    const db = await openDB();
    const body = await request.clone().json();
    await db.put("requests", { url: request.url, body, timestamp: Date.now() });
    return new Response(JSON.stringify({ status: "queued" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to queue request:", error);
    return new Response(JSON.stringify({ error: "Failed to queue request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Retry queued requests
async function syncQueuedRequests() {
  try {
    const db = await openDB();
    const requests = await db.getAll("requests");
    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });
        if (response.ok) {
          await db.delete("requests", req.timestamp);
        }
      } catch (error) {
        console.error("Failed to sync request:", error);
      }
    }
  } catch (error) {
    console.error("Failed to sync queued requests:", error);
  }
}

// Open IndexedDB for queuing requests
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("focus-vault-db", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("requests", { keyPath: "timestamp" });
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
