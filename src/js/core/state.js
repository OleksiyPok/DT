// Settings: current values, defaults and saving to localStorage
import { PRESET_LANG_FIELDS, SERVICES, STORAGE_KEY } from "./config.js";
import { THEME_VALUES, resolveThemaKey } from "./theme-registry.js";
import { EventTypes } from "./event-types.js";
import { clampCount, clampPreset, normalizePresets, pickLang } from "./presets.js";

export function createState({ bus, config }) {
  const Storage = {
    save(s) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch (e) {}
    },
    load() {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v ? JSON.parse(v) : null;
      } catch (e) {
        return null;
      }
    },
  };

  // Defaults come from config/config.json (store.setDefaultActive)
  let defaultsActive = {};
  let current = {};

  function setDefaultActive(defs) {
    defaultsActive = { ...defaultsActive, ...(defs || {}) };
  }

  const bool = (value, fallback) => (typeof value === "boolean" ? value : Boolean(fallback));

  // Complete, checked settings: saved values on top of the defaults.
  // The earlier versions saved "uiLangSelect" and "serviceSelect": they are still understood.
  function mergeWithDefaults(stored, defaults) {
    const src = stored && typeof stored === "object" ? stored : {};
    const base = defaults || {};

    const presetCount = clampCount(src.presetCount, clampCount(base.presetCount));
    const presets = normalizePresets(src.presets, base.presets);
    const activePreset = clampPreset(src.activePreset, presetCount);

    const uiLang = src.uiLang ?? src.uiLangSelect;
    const service = src.service ?? src.serviceSelect;
    const thema = resolveThemaKey(src.thema);

    const out = {
      uiLang: config.UI_LANGS.includes(uiLang) ? uiLang : base.uiLang,
      thema: THEME_VALUES.includes(thema) ? thema : base.thema,
      service: SERVICES.includes(service) ? service : base.service,
      autoTranslate: bool(src.autoTranslate, base.autoTranslate),
      clearOnMic: bool(src.clearOnMic, base.clearOnMic),
      bottomButtons: bool(src.bottomButtons, base.bottomButtons),
      overwriteLangs: bool(src.overwriteLangs, base.overwriteLangs),
      presetCount,
      activePreset,
      presets,
    };

    // Languages on the main screen: saved ones, otherwise those of the active configuration.
    Object.values(PRESET_LANG_FIELDS).forEach((field) => {
      out[field] = pickLang(src[field], presets[activePreset - 1][field]);
    });
    return out;
  }

  function setSettings(s) {
    current = { ...current, ...(s || {}) };
    bus.emit(EventTypes.CONFIG_LOADED, current);
  }

  function getSettings() {
    return { ...current };
  }

  function saveSettings(s) {
    const toSave = mergeWithDefaults(s || {}, defaultsActive);
    current = toSave;
    Storage.save(toSave);
    bus.emit(EventTypes.SETTINGS_SAVE, toSave);
  }

  function loadSettingsFromLocal() {
    const raw = Storage.load() || {};
    return { raw, merged: mergeWithDefaults(raw, defaultsActive) };
  }

  function getDefaultActive() {
    return { ...defaultsActive };
  }

  return {
    setDefaultActive,
    setSettings,
    getSettings,
    saveSettings,
    loadSettingsFromLocal,
    getDefaultActive,
    // The settings of a state without saved data: used by "Reset defaults"
    getDefaultSettings: () => mergeWithDefaults(null, defaultsActive),
  };
}
