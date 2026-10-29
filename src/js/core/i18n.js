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

function getEntry(lang) {
  return cache[lang] || cache.en || {};
}

// Texts of the given language (default: the one selected in the settings)
export function getTexts(lang = $("uiLangSelect").value) {
  return getEntry(lang).ui || {};
}

export function getLanguageNames(lang = $("uiLangSelect").value) {
  return getEntry(lang).languages || {};
}
