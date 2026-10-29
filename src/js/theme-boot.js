"use strict";

// Applies the saved theme before the first paint (no flash of the default theme).
// A classic script on purpose: it must run synchronously, before the page is drawn.
// STORAGE_KEY must match core/config.js.
(function () {
  var STORAGE_KEY = "DT-settings";
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var saved = raw ? JSON.parse(raw) : null;
    var thema = saved && saved.thema ? String(saved.thema) : "";
    if (!/^theme-[a-z]+-(contrast|normal|evening|night)$/.test(thema)) return;
    var html = document.documentElement;
    Array.from(html.classList).forEach(function (name) {
      if (name.indexOf("theme-") === 0) html.classList.remove(name);
    });
    html.classList.add(thema);
  } catch (_e) {}
})();
