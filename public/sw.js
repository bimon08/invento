const CACHE_NAME = "invento-v3";

// Install — DO NOT cache pages that require middleware/auth
// Only cache truly static assets that will always succeed
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                "/manifest.json",
                "/icon-192.png",
                "/icon-512.png",
            ]);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches and take control
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — network first, fall back to cache
// This handler is REQUIRED for PWA installability
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    // Return cached response, or a minimal offline fallback
                    return cached || new Response(
                        "<html><body style='background:#020617;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif'><p>You're offline. Please reconnect.</p></body></html>",
                        { headers: { "Content-Type": "text/html" } }
                    );
                });
            })
    );
});
