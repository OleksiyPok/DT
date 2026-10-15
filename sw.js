const CACHE_NAME = "dual-translator-v1.2.11";
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
