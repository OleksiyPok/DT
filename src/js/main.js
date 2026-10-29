// Entry point (loaded as a module, so the page is already parsed here).
import { APP_VERSION } from "./core/config.js";
import { $ } from "./core/dom.js";
import { renderThemePaletteOptions } from "./core/theme.js";
import { renderButtonVisibilityOptions } from "./features/buttons.js";
import { initEvents } from "./features/events.js";
import { initLiveSelect } from "./features/live-select.js";
import { initModals } from "./features/modals.js";
import { renderPresetLanguageOptions } from "./features/presets.js";
import { initSnap } from "./features/scroll-steps.js";
import { loadInitialData, loadSettings } from "./features/settings.js";
import { translateIfAuto } from "./features/translate.js";
import { updateUI } from "./features/ui.js";

async function init() {
  await loadInitialData();

  $("version").textContent = `version: ${APP_VERSION}`;
  renderThemePaletteOptions();
  ["themaSelect", "themaModeSelectSettings"].forEach(initLiveSelect);
  renderButtonVisibilityOptions();
  renderPresetLanguageOptions();
  loadSettings();
  updateUI();
  initModals();
  initEvents();
  initSnap();

  translateIfAuto();
}

init().catch((err) => console.error("The app failed to start:", err));
