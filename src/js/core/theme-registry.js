// Theme list and helpers. Pure functions, no DOM access except applyThemeClass.

// Palettes are listed in colour order (red -> brown -> orange -> yellow -> green -> teal -> blue);
// the selector in the settings shows them in this order. Grayscale (no colour) comes last.
export const THEME_DEFS = [
  { value: "theme-skycoral-contrast", label: "Sky Coral - Contrast" },
  { value: "theme-skycoral-normal", label: "Sky Coral - Normal" },
  { value: "theme-skycoral-evening", label: "Sky Coral - Evening" },
  { value: "theme-skycoral-night", label: "Sky Coral - Night" },
  { value: "theme-autumnforest-contrast", label: "Autumn Forest - Contrast" },
  { value: "theme-autumnforest-normal", label: "Autumn Forest - Normal" },
  { value: "theme-autumnforest-evening", label: "Autumn Forest - Evening" },
  { value: "theme-autumnforest-night", label: "Autumn Forest - Night" },
  { value: "theme-warmorange-contrast", label: "Warm Orange - Contrast" },
  { value: "theme-warmorange-normal", label: "Warm Orange - Normal" },
  { value: "theme-warmorange-evening", label: "Warm Orange - Evening" },
  { value: "theme-warmorange-night", label: "Warm Orange - Night" },
  { value: "theme-amberglow-contrast", label: "Amber Glow - Contrast" },
  { value: "theme-amberglow-normal", label: "Amber Glow - Normal" },
  { value: "theme-amberglow-evening", label: "Amber Glow - Evening" },
  { value: "theme-amberglow-night", label: "Amber Glow - Night" },
  { value: "theme-yellowblue-contrast", label: "Yellow Blue - Contrast" },
  { value: "theme-yellowblue-normal", label: "Yellow Blue - Normal" },
  { value: "theme-yellowblue-evening", label: "Yellow Blue - Evening" },
  { value: "theme-yellowblue-night", label: "Yellow Blue - Night" },
  { value: "theme-malachite-contrast", label: "Malachite - Contrast" },
  { value: "theme-malachite-normal", label: "Malachite - Normal" },
  { value: "theme-malachite-evening", label: "Malachite - Evening" },
  { value: "theme-malachite-night", label: "Malachite - Night" },
  { value: "theme-tropical-contrast", label: "Tropical / Caribbean - Contrast" },
  { value: "theme-tropical-normal", label: "Tropical / Caribbean - Normal" },
  { value: "theme-tropical-evening", label: "Tropical / Caribbean - Evening" },
  { value: "theme-tropical-night", label: "Tropical / Caribbean - Night" },
  { value: "theme-oceanamber-contrast", label: "Ocean Amber - Contrast" },
  { value: "theme-oceanamber-normal", label: "Ocean Amber - Normal" },
  { value: "theme-oceanamber-evening", label: "Ocean Amber - Evening" },
  { value: "theme-oceanamber-night", label: "Ocean Amber - Night" },
  { value: "theme-delftware-contrast", label: "Delftware - Contrast" },
  { value: "theme-delftware-normal", label: "Delftware - Normal" },
  { value: "theme-delftware-evening", label: "Delftware - Evening" },
  { value: "theme-delftware-night", label: "Delftware - Night" },
  { value: "theme-grayscale-contrast", label: "Grayscale - Contrast" },
  { value: "theme-grayscale-normal", label: "Grayscale - Normal" },
  { value: "theme-grayscale-evening", label: "Grayscale - Evening" },
  { value: "theme-grayscale-night", label: "Grayscale - Night" },
];

export const THEME_VALUES = THEME_DEFS.map((x) => x.value);

// Suffix order must stay in sync with <select id="themaModeSelectSettings"> option values.
export const THEME_MODES = ["contrast", "normal", "evening", "night"];

export function parseThema(value) {
  const v = String(value || "");
  if (!v || !v.startsWith("theme-")) return null;
  for (const mode of THEME_MODES) {
    const suffix = "-" + mode;
    if (v.length > suffix.length && v.endsWith(suffix)) {
      const palette = v.slice("theme-".length, v.length - suffix.length);
      if (palette) return { palette, mode };
    }
  }
  return null;
}

export function composeThema(palette, mode) {
  const p = String(palette || "");
  const m = String(mode || "");
  if (!p || !m || !THEME_MODES.includes(m)) return null;
  const candidate = `theme-${p}-${m}`;
  return THEME_VALUES.includes(candidate) ? candidate : null;
}

// One entry per palette: { palette, label } (the label without the " - Mode" part).
export function getPaletteOptions() {
  const seen = new Set();
  const out = [];
  THEME_DEFS.forEach((def) => {
    const parsed = parseThema(def.value);
    if (!parsed || seen.has(parsed.palette)) return;
    seen.add(parsed.palette);
    let label = def.label || parsed.palette;
    const sep = label.indexOf(" - ");
    if (sep >= 0) label = label.slice(0, sep).trim();
    out.push({ palette: parsed.palette, label });
  });
  return out;
}

// Puts the wanted theme class on <html> (unknown value -> fallback) and returns the chosen one.
export function applyThemeClass(htmlEl, value, fallback) {
  const wanted = String(value || "");
  const chosen = THEME_VALUES.includes(wanted) ? wanted : fallback;
  if (!htmlEl) return chosen;
  THEME_VALUES.forEach((v) => htmlEl.classList.remove(v));
  htmlEl.classList.add(chosen);
  return chosen;
}
