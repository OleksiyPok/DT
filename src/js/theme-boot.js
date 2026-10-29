"use strict";

// Applies the saved theme before the first paint.
// If no valid saved theme exists, use the same default as config/config.json.
(function () {
  var STORAGE_KEY = "DT-settings";
  var DEFAULT_THEME = "theme-warmorange-normal";
  var THEME_PATTERN =
    /^theme-(skycoral|autumnforest|warmorange|amberglow|yellowblue|malachite|tropical|oceanamber|delftware|grayscale)-(contrast|normal|evening|night)$/;

  var html = document.documentElement;
  var theme = DEFAULT_THEME;

  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var saved = raw ? JSON.parse(raw) : null;
    var candidate = saved && saved.thema ? String(saved.thema) : "";

    if (THEME_PATTERN.test(candidate)) {
      theme = candidate;
    }
  } catch (_e) {
    // Keep the default theme if saved settings cannot be read.
  }

  Array.from(html.classList).forEach(function (name) {
    if (name.indexOf("theme-") === 0) {
      html.classList.remove(name);
    }
  });

  html.classList.add(theme);

  // Prepare the mode icon as soon as the page DOM is available.
  // The main application will update its title and accessibility label later.
  var SVG_OPEN =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">';

  var MODE_ICONS = {
    contrast:
      SVG_OPEN +
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>' +
      "</svg>",

    normal:
      SVG_OPEN +
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2M12 20v2M2 12h2M20 12h2' +
      "M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4" +
      'M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' +
      "</svg>",

    evening:
      SVG_OPEN +
      '<path d="M8 17a4 4 0 0 1 8 0"/>' +
      '<path d="M2 17h20M7 20.5h10M12 7v2' +
      'M4.9 9.9l1.4 1.4M17.7 11.3l-1.4-1.4"/>' +
      "</svg>",

    night:
      SVG_OPEN +
      '<path d="M20 14.5A8 8 0 0 1 9.5 4' +
      'a8 8 0 1 0 10.5 10.5z"/>' +
      "</svg>",
  };

  function setInitialModeIcon() {
    var icon = document.getElementById("themaModeIcon");
    if (!icon) return;

    var match = theme.match(/-(contrast|normal|evening|night)$/);
    var mode = match ? match[1] : "normal";

    icon.innerHTML = MODE_ICONS[mode] || MODE_ICONS.normal;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setInitialModeIcon, {
      once: true,
    });
  } else {
    setInitialModeIcon();
  }
})();
