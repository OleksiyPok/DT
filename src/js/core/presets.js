// Configurations (presets): checking of saved data. Pure functions, no DOM access.
import { BUTTON_SECTIONS, PRESET_MAX, buildDefaultButtons } from "./config.js";

// The languages of the configurations (the same as the languages of the interface)
export const LANG_CODES = ["ar", "cs", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "ru", "tr", "uk"];

export function clampPreset(value, max = PRESET_MAX) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 1;
}

export function clampCount(value, fallback = 1) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PRESET_MAX ? n : fallback;
}

export function pickLang(value, fallback) {
  return LANG_CODES.includes(value) ? value : fallback;
}

export function normalizeButtonVisibility(raw) {
  const result = buildDefaultButtons();
  if (!raw || typeof raw !== "object") return result;
  BUTTON_SECTIONS.forEach((section) => {
    const src = raw[section.key];
    if (!src || typeof src !== "object") return;
    section.buttons.forEach((btn) => {
      if (typeof src[btn.key] === "boolean") result[section.key][btn.key] = src[btn.key];
    });
  });
  return result;
}

// A configuration from saved data; missing or invalid parts come from `fallback`
// (the same configuration in config/config.json).
export function normalizePreset(raw, fallback) {
  const src = raw && typeof raw === "object" ? raw : {};
  const fb = fallback && typeof fallback === "object" ? fallback : {};
  const lang = (field, i) => pickLang(src[field], pickLang(fb[field], LANG_CODES[i]));
  return {
    sourceLang: lang("sourceLang", 0),
    targetLang1: lang("targetLang1", 1),
    targetLang2: lang("targetLang2", 2),
    buttons: normalizeButtonVisibility(src.buttons ?? fb.buttons),
  };
}

export function normalizePresets(raw, fallbacks) {
  const list = Array.isArray(raw) ? raw : [];
  const defaults = Array.isArray(fallbacks) ? fallbacks : [];
  return Array.from({ length: PRESET_MAX }, (_, i) => normalizePreset(list[i], defaults[i]));
}
