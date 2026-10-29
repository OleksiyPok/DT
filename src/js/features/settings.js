// Applying settings to the page: on start, and by "Reset defaults".
// Default values come only from config/config.json (core/defaults.js).
import { PRESET_LANG_FIELDS } from "../core/config.js";
import { getDefaults, loadDefaults } from "../core/defaults.js";
import { $ } from "../core/dom.js";
import { loadTexts } from "../core/i18n.js";
import { state } from "../core/state.js";
import {
  readSavedSettings,
  saveSettings,
  setDeveloperModeSetting,
} from "../core/storage.js";
import { applyThema } from "../core/theme.js";
import { applyButtonVisibility } from "./buttons.js";
import {
  clampCount,
  clampPreset,
  normalizePresets,
  pickLang,
  renderPresetControls,
  syncPresetEditor,
  updatePresetButtons,
} from "./presets.js";
import { clearTranslations } from "./translate.js";
import { updateUI } from "./ui.js";

// Complete, checked settings: saved values on top of the defaults.
// Without saved settings (first start, reset) these are the defaults.
function buildSettings(saved) {
  const base = getDefaults();
  const src = {
    ...base,
    ...(saved && typeof saved === "object" ? saved : {}),
  };

  const presetCount = clampCount(src.presetCount, clampCount(base.presetCount));
  const presets = normalizePresets(src.presets, base.presets);
  const activePreset = clampPreset(src.activePreset, presetCount);

  const settings = {
    ...src,
    uiLangSelect: pickLang(src.uiLangSelect, base.uiLangSelect),
    presets,
    presetCount,
    activePreset,
  };

  // Languages on the main screen: saved ones, otherwise those of the active configuration.
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    settings[field] = pickLang(src[field], presets[activePreset - 1][field]);
  });

  return settings;
}

function applyState(settings) {
  $("uiLangSelect").value = settings.uiLangSelect;
  $("serviceSelect").value = settings.serviceSelect;

  state.presets = settings.presets;
  state.presetCount = settings.presetCount;
  state.activePreset = settings.activePreset;
  state.editLangPreset = state.activePreset;
  state.editBtnPreset = state.activePreset;

  renderPresetControls();

  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    $(field).value = settings[field];
  });

  $("autoTranslate").checked = settings.autoTranslate;
  $("clearOnMic").checked = settings.clearOnMic;
  $("bottomButtons").checked = settings.bottomButtons;
  $("overwriteLangs").checked = settings.overwriteLangs;

  applyThema(settings.thema);

  // Keep the saved developerMode value separate from temporary panel visibility.
  const devMode = Boolean(settings.developerMode);
  setDeveloperModeSetting(devMode);

  $("developer").style.display = devMode ? "flex" : "none";
  $("serviceRow").style.display = devMode ? "flex" : "none";

  applyButtonVisibility();
  updatePresetButtons();
  syncPresetEditor();
}

// Loads the defaults and the texts of the saved interface language (before the page is filled).
export async function loadInitialData() {
  await loadDefaults();

  const saved = readSavedSettings();
  await loadTexts(buildSettings(saved).uiLangSelect);
}

export function loadSettings() {
  applyState(buildSettings(readSavedSettings()));
}

export async function resetSettings() {
  await loadDefaults(); // config.json may have been edited since the page was opened.
  const settings = buildSettings(null);

  await loadTexts(settings.uiLangSelect);

  applyState(settings);
  clearTranslations();
  updateUI();
  saveSettings();
}
