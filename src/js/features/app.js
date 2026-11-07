// The application: loads the data, applies the settings and connects the modules by events.
import { APP_VERSION } from "../core/config.js";
import { EventTypes } from "../core/event-types.js";
import { initMyMemoryUsage } from "./mymemory-usage.js";

export function createApp({ bus, config, langLoader, store, ui, utils, developer }) {
  // F1 opens the help window (and not the help of the browser); Esc closes the open window
  function handleKeyControls(event) {
    const anyWindowOpen = ui.isAppHelpModalOpen() || ui.isSettingsModalOpen();

    if (event.key === "F1" || event.code === "F1" || event.keyCode === 112) {
      event.preventDefault();
      if (!anyWindowOpen) bus.emit(EventTypes.UI_HELP_MODAL_OPEN);
      return;
    }

    if (event.key === "Escape" || event.code === "Escape" || event.keyCode === 27) {
      if (ui.isAppHelpModalOpen()) bus.emit(EventTypes.UI_HELP_MODAL_CLOSE);
      else if (ui.isSettingsModalOpen()) bus.emit(EventTypes.UI_SETTINGS_MODAL_CLOSE);
    }
  }

  async function init() {
    // The version is shown at once, without waiting for the configuration and the texts
    const versionEl = document.getElementById("version");
    if (versionEl) versionEl.textContent = `version: ${APP_VERSION}`;

    const appCfg = await config.load();
    utils.setDebug(appCfg.developerMode);
    store.setDefaultActive(appCfg);
    ui.setDeveloperVisibility(appCfg);
    developer.init(appCfg);
    initMyMemoryUsage();

    await langLoader.loadAll(config.UI_LANGS);
    const { merged } = store.loadSettingsFromLocal();
    store.setSettings(merged);
    ui.applySettingsToUI(merged);

    bus.on(EventTypes.APP_INIT, () => ui.init());

    bus.on(EventTypes.SETTINGS_APPLY_TO_UI, ({ saveFromUI } = {}) => {
      const s = ui.readSettingsFromUI();
      store.setSettings(s);
      if (saveFromUI) store.saveSettings(s);
    });

    bus.on(EventTypes.UI_TRANSLATE, ({ lang }) => ui.updateUILabels(lang));

    bus.on(EventTypes.SETTINGS_RESET, async () => {
      // config.json may have been edited since the page was opened
      store.setDefaultActive(await config.load());
      const defaults = store.getDefaultSettings();
      store.setSettings(defaults);
      ui.applySettingsToUI(defaults);
      bus.emit(EventTypes.TRANSLATE_CLEAR);
      store.saveSettings(defaults);
    });

    window.addEventListener("pagehide", () => bus.emit(EventTypes.APP_CLOSED));
    window.addEventListener("beforeunload", () => bus.emit(EventTypes.APP_CLOSED));
    document.addEventListener("keydown", handleKeyControls);

    bus.emit(EventTypes.APP_INIT);
    bus.emit(EventTypes.TRANSLATE_IF_AUTO);
  }

  return { init };
}
