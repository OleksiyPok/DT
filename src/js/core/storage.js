// Saved settings in localStorage.
import { STORAGE_KEY } from "./config.js";
import { $ } from "./dom.js";
import { state } from "./state.js";
import { getThemaFromSelects } from "./theme.js";

// Saved settings object, or null if there is none (or it is broken).
export function readSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// sourceLang / targetLang1 / targetLang2 are the live values of the main
// screen; the saved configurations are stored separately in `presets`.
export function saveSettings() {
  const settings = {
    uiLangSelect: $("uiLangSelect").value,
    serviceSelect: $("serviceSelect").value,
    sourceLang: $("sourceLang").value,
    targetLang1: $("targetLang1").value,
    targetLang2: $("targetLang2").value,
    autoTranslate: $("autoTranslate").checked,
    clearOnMic: $("clearOnMic").checked,
    bottomButtons: $("bottomButtons").checked,
    overwriteLangs: $("overwriteLangs").checked,
    developerMode: state.developerMode,
    thema: getThemaFromSelects(),
    presets: state.presets,
    presetCount: state.presetCount,
    activePreset: state.activePreset,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
