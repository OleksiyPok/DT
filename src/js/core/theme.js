// Theme: palette + mode selects, the mode button on the main screen.
import { $ } from "./dom.js";
import { getTexts } from "./i18n.js";
import {
  DEFAULT_THEME,
  THEME_MODES,
  applyThemeClass,
  composeThema,
  getPaletteOptions,
  parseThema,
} from "./theme-registry.js";
import { refreshLiveLists } from "../features/live-select.js";

// Theme used when the saved one is missing or unknown
export const THEME_FALLBACK = DEFAULT_THEME;

// SVG icon of the main-screen button for each theme mode (same size and line style, colour = text colour)
const SVG_OPEN =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const THEME_MODE_ICONS = {
  contrast: `${SVG_OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>`,
  normal: `${SVG_OPEN}<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  evening: `${SVG_OPEN}<path d="M8 17a4 4 0 0 1 8 0"/><path d="M2 17h20M7 20.5h10M12 7v2M4.9 9.9l1.4 1.4M17.7 11.3l1.4-1.4"/></svg>`,
  night: `${SVG_OPEN}<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`,
};

export function renderThemePaletteOptions() {
  const select = $("themaSelect");
  if (!select) return;
  select.innerHTML = "";
  getPaletteOptions().forEach(({ palette, label }) => {
    const option = document.createElement("option");
    option.value = palette;
    option.textContent = label;
    select.appendChild(option);
  });
}

export function getThemaFromSelects() {
  const palette = $("themaSelect").value;
  const mode = $("themaModeSelectSettings").value;
  return composeThema(palette, mode) || THEME_FALLBACK;
}

export function updateModeButton(mode, t) {
  const btn = $("themaModeBtn");
  const icon = $("themaModeIcon");
  if (!btn || !icon) return;
  const texts = t || getTexts();
  const modeTexts = {
    contrast: texts.themaModeContrast,
    normal: texts.themaModeNormal,
    evening: texts.themaModeEvening,
    night: texts.themaModeNight,
  };
  const title = `${texts.themaModeLabel}: ${modeTexts[mode] || ""}`;
  icon.innerHTML = THEME_MODE_ICONS[mode] || "";
  btn.title = title;
  btn.setAttribute("aria-label", title);
}

export function applyThema(value) {
  const chosen = applyThemeClass(
    document.documentElement,
    value,
    THEME_FALLBACK
  );
  const parsed = parseThema(chosen);
  if (parsed) {
    $("themaSelect").value = parsed.palette;
    $("themaModeSelectSettings").value = parsed.mode;
    updateModeButton(parsed.mode);
    refreshLiveLists();
  }
  return chosen;
}

// The button on the main screen: next mode in the list
export function nextThemaMode() {
  const select = $("themaModeSelectSettings");
  const next =
    THEME_MODES[(THEME_MODES.indexOf(select.value) + 1) % THEME_MODES.length];
  select.value = next;
  applyThema(getThemaFromSelects());
}
