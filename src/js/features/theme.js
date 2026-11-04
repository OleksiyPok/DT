// Theme: palette + mode selects, the mode button on the main screen.
import { getDefaults } from "../core/defaults.js";
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";
import { THEME_MODES, applyThemeClass, composeThema, getPaletteOptions, parseThema } from "../core/theme-registry.js";
import { refreshLiveLists } from "./live-select.js";

// Theme used when the saved one is missing or unknown: the default from config/config.json
const defaultThema = () => getDefaults().thema;

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
  const mode = $("themaModeSelect").value;
  return composeThema(palette, mode) || defaultThema();
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
  icon.innerHTML = `<svg aria-hidden="true"><use href="#i-mode-${mode}" /></svg>`;
  btn.title = title;
  btn.setAttribute("aria-label", title);
}

export function applyThema(value) {
  const chosen = applyThemeClass(document.documentElement, value, defaultThema());
  const parsed = parseThema(chosen);
  if (parsed) {
    $("themaSelect").value = parsed.palette;
    $("themaModeSelect").value = parsed.mode;
    updateModeButton(parsed.mode);
    refreshLiveLists();
  }
  return chosen;
}

// The button on the main screen: next mode in the list
export function nextThemaMode() {
  const select = $("themaModeSelect");
  const next = THEME_MODES[(THEME_MODES.indexOf(select.value) + 1) % THEME_MODES.length];
  select.value = next;
  applyThema(getThemaFromSelects());
}
