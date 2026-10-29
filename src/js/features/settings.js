// Applying settings to the page: on start, and by "Reset defaults".
import {
  DEFAULT_PRESET_COUNT,
  DEFAULT_SETTINGS,
  PATHS,
  PRESET_LANG_FIELDS,
  buildDefaultPresets,
} from "../core/config.js";
import { $ } from "../core/dom.js";
import { loadTexts } from "../core/i18n.js";
import { state } from "../core/state.js";
import { readSavedSettings, saveSettings } from "../core/storage.js";
import { THEME_FALLBACK, applyThema } from "../core/theme.js";
import { applyButtonVisibility } from "./buttons.js";
import {
  clampCount,
  clampPreset,
  normalizePreset,
  normalizePresets,
  pickLang,
  renderPresetControls,
  syncPresetEditor,
  updatePresetButtons,
} from "./presets.js";
import { clearTranslations } from "./translate.js";
import { updateUI } from "./ui.js";

function applyState(settings) {
  $("uiLangSelect").value = settings.uiLangSelect || "en";
  $("serviceSelect").value = settings.serviceSelect || "mymemory";

  if (Array.isArray(settings.presets)) {
    state.presets = normalizePresets(settings.presets);
  } else {
    state.presets = buildDefaultPresets();
    state.presets[0] = normalizePreset(
      {
        sourceLang: settings.sourceLang,
        targetLang1: settings.targetLang1,
        targetLang2: settings.targetLang2,
        buttons: settings.buttons,
      },
      state.presets[0]
    );
  }
  state.presetCount = clampCount(settings.presetCount);
  state.activePreset = clampPreset(settings.activePreset);
  state.editLangPreset = state.activePreset;
  state.editBtnPreset = state.activePreset;
  renderPresetControls();

  const active = state.presets[state.activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    $(field).value = pickLang(settings[field], active[field]);
  });

  $("autoTranslate").checked = settings.autoTranslate ?? true;
  state.autoTranslateChecked = $("autoTranslate").checked;
  $("clearOnMic").checked = settings.clearOnMic === true;
  $("bottomButtons").checked = settings.bottomButtons !== false;
  $("overwriteLangs").checked =
    typeof settings.overwriteLangs === "boolean"
      ? settings.overwriteLangs
      : Array.isArray(settings.presets) &&
        settings.presets.some((x) => x && x.overwriteLangs === true);
  applyThema(settings.thema || THEME_FALLBACK);

  const devMode = settings.developerMode ?? false;
  $("developer").style.display = devMode ? "flex" : "none";
  $("serviceRow").style.display = devMode ? "flex" : "none";

  applyButtonVisibility();
  updatePresetButtons();
  syncPresetEditor();
}

// Defaults merged with values from config/config.json. Without a `presets` array there,
// its sourceLang / targetLang1 / targetLang2 go into configuration 1.
function buildResetSettings(external) {
  const ext = external && typeof external === "object" ? external : {};
  const settings = { ...DEFAULT_SETTINGS, ...ext };

  if (Array.isArray(ext.presets)) {
    settings.presets = normalizePresets(ext.presets);
  } else {
    settings.presets = buildDefaultPresets();
    settings.presets[0] = normalizePreset(
      {
        sourceLang: ext.sourceLang,
        targetLang1: ext.targetLang1,
        targetLang2: ext.targetLang2,
      },
      settings.presets[0]
    );
  }

  settings.presetCount = clampCount(ext.presetCount ?? DEFAULT_PRESET_COUNT);
  settings.activePreset = clampPreset(ext.activePreset, settings.presetCount);
  const active = settings.presets[settings.activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    settings[field] = active[field];
  });
  return settings;
}

// Language of the saved settings (the texts must be loaded before the page is filled)
export async function loadSavedTexts() {
  const saved = readSavedSettings();
  await loadTexts(saved?.uiLangSelect || DEFAULT_SETTINGS.uiLangSelect);
}

export function loadSettings() {
  const saved = readSavedSettings();
  applyState(
    saved && typeof saved === "object" ? saved : buildResetSettings({})
  );
}

async function applySettings(settings) {
  await loadTexts(settings.uiLangSelect);
  applyState(settings);
  clearTranslations();
  updateUI();
  saveSettings();
}

export async function resetSettings() {
  let external = {};
  try {
    const response = await fetch(PATHS.CONFIG, { cache: "no-cache" });
    if (response.ok) external = await response.json();
  } catch (error) {
    external = {};
  }
  await applySettings(buildResetSettings(external));
}
