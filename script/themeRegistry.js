"use strict";

(function initThemeRegistry(global) {
  var DEFAULT_THEME = "theme-yellowblue-normal";
  /** Same key that script.js uses in saveSettings()/loadSettings(). */
  var STORAGE_KEY = "translatorSettings";

  var THEME_DEFS = [
    { value: "theme-oceanamber-contrast", label: "Ocean Amber - Contrast" },
    { value: "theme-oceanamber-normal", label: "Ocean Amber - Normal" },
    { value: "theme-oceanamber-night", label: "Ocean Amber - Night" },
    { value: "theme-yellowblue-contrast", label: "Yellow Blue - Contrast" },
    { value: "theme-yellowblue-normal", label: "Yellow Blue - Normal" },
    { value: "theme-yellowblue-night", label: "Yellow Blue - Night" },
    { value: "theme-skycoral-contrast", label: "Sky Coral - Contrast" },
    { value: "theme-skycoral-normal", label: "Sky Coral - Normal" },
    { value: "theme-skycoral-night", label: "Sky Coral - Night" },
    { value: "theme-malachite-contrast", label: "Malachite - Contrast" },
    { value: "theme-malachite-normal", label: "Malachite - Normal" },
    { value: "theme-malachite-night", label: "Malachite - Night" },
    { value: "theme-warmorange-contrast", label: "Warm Orange - Contrast" },
    { value: "theme-warmorange-normal", label: "Warm Orange - Normal" },
    { value: "theme-warmorange-night", label: "Warm Orange - Night" },
    { value: "theme-amberglow-contrast", label: "Amber Glow - Contrast" },
    { value: "theme-amberglow-normal", label: "Amber Glow - Normal" },
    { value: "theme-amberglow-night", label: "Amber Glow - Night" },
    { value: "theme-delftware-contrast", label: "Delftware - Contrast" },
    { value: "theme-delftware-normal", label: "Delftware - Normal" },
    { value: "theme-delftware-night", label: "Delftware - Night" },
    { value: "theme-tropical-contrast", label: "Tropical / Caribbean - Contrast" },
    { value: "theme-tropical-normal", label: "Tropical / Caribbean - Normal" },
    { value: "theme-tropical-night", label: "Tropical / Caribbean - Night" },
    { value: "theme-autumnforest-contrast", label: "Autumn Forest - Contrast" },
    { value: "theme-autumnforest-normal", label: "Autumn Forest - Normal" },
    { value: "theme-autumnforest-night", label: "Autumn Forest - Night" },
  ];

  var THEME_VALUES = THEME_DEFS.map(function (x) {
    return x && x.value ? String(x.value) : "";
  }).filter(Boolean);

  /** Suffix order must stay in sync with <select id="themaModeSelect"> option values. */
  var THEME_MODES = Object.freeze(["contrast", "normal", "night"]);

  /** Removed mode: a theme saved earlier with "-evening" becomes "-normal" of the same palette. */
  function migrateThema(value) {
    var v = String(value || "");
    return /-evening$/.test(v) ? v.replace(/-evening$/, "-normal") : v;
  }

  function parseThema(value) {
    var v = String(value || "");
    if (!v || v.indexOf("theme-") !== 0) return null;
    for (var i = 0; i < THEME_MODES.length; i++) {
      var mode = THEME_MODES[i];
      var suf = "-" + mode;
      if (v.length > suf.length && v.slice(-suf.length) === suf) {
        var palette = v.slice("theme-".length, v.length - suf.length);
        if (palette) return { palette: palette, mode: mode };
      }
    }
    return null;
  }

  function composeThema(palette, mode) {
    var p = String(palette || "");
    var m = String(mode || "");
    if (!p || !m) return null;
    if (THEME_MODES.indexOf(m) < 0) return null;
    var candidate = "theme-" + p + "-" + m;
    return THEME_VALUES.indexOf(candidate) >= 0 ? candidate : null;
  }

  function getPaletteOptions() {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < THEME_DEFS.length; i++) {
      var def = THEME_DEFS[i];
      var pr = parseThema(def.value);
      if (!pr) continue;
      if (seen[pr.palette]) continue;
      seen[pr.palette] = 1;
      var display = def.label || pr.palette;
      var sepIdx = display.indexOf(" - ");
      if (sepIdx >= 0) display = display.slice(0, sepIdx).trim();
      out.push({ palette: pr.palette, label: display });
    }
    out.sort(function (a, b) {
      return String(a.label).localeCompare(String(b.label), "en");
    });
    return out;
  }

  function applyThemeClass(htmlEl, value, fallback) {
    var safeFallback = fallback || DEFAULT_THEME;
    var wanted = migrateThema(value);
    var chosen = THEME_VALUES.indexOf(wanted) >= 0 ? wanted : safeFallback;
    if (!htmlEl) return chosen;
    // Also removes a stale "-evening" class that may still be on <html>
    for (var i = 0; i < THEME_VALUES.length; i++) htmlEl.classList.remove(THEME_VALUES[i]);
    htmlEl.classList.add(chosen);
    return chosen;
  }

  global.DTThemeRegistry = Object.freeze({
    defaultTheme: DEFAULT_THEME,
    themes: Object.freeze(THEME_DEFS.slice()),
    themeValues: Object.freeze(THEME_VALUES.slice()),
    themeModes: THEME_MODES,
    parseThema: parseThema,
    composeThema: composeThema,
    getPaletteOptions: getPaletteOptions,
    applyThemeClass: applyThemeClass,
  });

  // Early apply of the saved theme to avoid a flash of the default one.
  try {
    var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
    var parsed = raw ? JSON.parse(raw) : null;
    var wanted = parsed && parsed.thema ? String(parsed.thema) : "";
    var html = global.document && global.document.documentElement;
    applyThemeClass(html, wanted, DEFAULT_THEME);
  } catch (_e) {}
})(window);
