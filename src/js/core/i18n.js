// UI texts and language names: src/i18n/<lang>.json = { ui: {...}, languages: {...} }.
// English is always loaded and used as the fallback.
import { PATHS } from "./config.js";
import { $ } from "./dom.js";

const cache = {};

async function fetchLang(lang) {
  if (cache[lang]) return;
  try {
    const response = await fetch(`${PATHS.I18N_DIR}${lang}.json`, {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`${lang}.json: ${response.status}`);
    cache[lang] = await response.json();
  } catch (err) {
    console.error("Failed to load UI texts:", err);
  }
}

// Loads the texts of a language (and English). Call before getTexts().
export async function loadTexts(lang) {
  await Promise.all([fetchLang("en"), fetchLang(lang)]);
}

// Texts of the given language (default: the one selected in the settings).
// A text missing in that language is taken from English.
export function getTexts(lang = $("uiLangSelect").value) {
  return { ...cache.en?.ui, ...cache[lang]?.ui };
}

export function getLanguageNames(lang = $("uiLangSelect").value) {
  return { ...cache.en?.languages, ...cache[lang]?.languages };
}

// Shows a window with a message (key = key in the UI texts); `detail` is added after it
export function showAlert(key, detail = "") {
  alert(getTexts()[key] + detail);
}
