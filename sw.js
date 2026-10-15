const CACHE_NAME = "dual-translator-v1.2.12";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles/styles_07.css",
  "./script/script_09.js",
  "./script/ui_DT_texts.js",
  "./script/config.json",
  "./icons/icon_DT_16x16.png",
  "./icons/icon_DT_32x32.png",
  "./icons/icon_DT_64x64.png",
  "./icons/icon_DT_128x128.png",
  "./icons/icon_DT_512x512.png",
  "./icons/icon_DT_1024x1024.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first strategy: try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the fresh response for future use
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
