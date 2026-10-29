// Entry point (loaded as a module, so the page is already parsed here).
import { state } from "./core/state.js";
import { renderThemePaletteOptions } from "./core/theme.js";
import { renderButtonVisibilityOptions } from "./features/buttons.js";
import { initEvents } from "./features/events.js";
import { initLiveSelect } from "./features/live-select.js";
import { initModals } from "./features/modals.js";
import { renderPresetLanguageOptions } from "./features/presets.js";
import { initSnap } from "./features/scroll-steps.js";
import { loadSavedTexts, loadSettings } from "./features/settings.js";
import { translateText } from "./features/translate.js";
import { updateUI } from "./features/ui.js";

async function init() {
  await loadSavedTexts();

  renderThemePaletteOptions();
  ["themaSelect", "themaModeSelectSettings"].forEach(initLiveSelect);
  renderButtonVisibilityOptions();
  renderPresetLanguageOptions();
  loadSettings();
  updateUI();
  initModals();
  initEvents();
  initSnap();

  if (state.autoTranslateChecked) translateText();
}

init();
