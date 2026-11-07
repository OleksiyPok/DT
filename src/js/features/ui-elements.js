// Elements of the page (found once by selector) and the state shared by the ui-*.js modules.
export const SELECTORS = {
  helpAppBtn: "#helpAppBtn",
  helpAppModal: "#helpAppModal",
  helpAppCloseBtn: "#helpAppCloseBtn",
  helpAppContent: "#helpAppContent",
  helpTitle: "#helpTitle",
  settingsAppBtn: "#settingsAppBtn",
  settingsAppModal: "#settingsAppModal",
  settingsAppCloseBtn: "#settingsAppCloseBtn",
  settingsTitle: "#settingsTitle",
  uiLangSelect: "#uiLangSelect",
  uiLangLabel: "#uiLangLabel",
  themaModeSelect: "#themaModeSelect",
  themaModeBtn: "#themaModeBtn",
  themaModeIcon: "#themaModeIcon",
  themaSelect: "#themaSelect",
  labelThema: "#labelThema",
  labelThemaMode: "#labelThemaMode",
  resetSettingsBtn: "#resetSettingsBtn",
  resetSettingsText: "#resetSettingsText",
  developerPanel: "#developer",
  serviceRow: "#serviceRow",
  serviceSelect: "#serviceSelect",
  serviceLabel: "#serviceLabel",

  // Main screen
  presetButtons: "#presetButtons",
  sourceLang: "#sourceLang",
  targetLang1: "#targetLang1",
  targetLang2: "#targetLang2",
  sourceLangLabel: ".source-lang-label",
  targetLang1Label: ".target-lang-1-label",
  targetLang2Label: ".target-lang-2-label",
  sourceText: "#sourceText",
  translatedText1: "#translatedText1",
  translatedText2: "#translatedText2",
  autoTranslate: "#autoTranslate",
  autoTranslateLabel: "#autoTranslateLabel",
  manualTranslateBtn: "#manualTranslateBtn",
  pasteSource: "#pasteSource",
  copySource: "#copySource",
  speakSource: "#speakSource",
  micSource: "#micSource",
  clearSource: "#clearSource",
  copyTarget1: "#copyTarget1",
  speakTarget1: "#speakTarget1",
  copyTarget2: "#copyTarget2",
  speakTarget2: "#speakTarget2",
  bottomActions: "#bottomActions",
  clearBottom: "#clearBottom",
  micBottom: "#micBottom",

  // Settings window
  labelPresets: "#labelPresets",
  labelPresetCount: "#labelPresetCount",
  presetCountSelect: "#presetCountSelect",
  labelPresetLanguages: "#labelPresetLanguages",
  langPresetTabs: "#langPresetTabs",
  labelPresetSourceLang: "#labelPresetSourceLang",
  labelPresetTargetLang1: "#labelPresetTargetLang1",
  labelPresetTargetLang2: "#labelPresetTargetLang2",
  presetSourceLang: "#presetSourceLang",
  presetTargetLang1: "#presetTargetLang1",
  presetTargetLang2: "#presetTargetLang2",
  labelOverwriteLangs: "#labelOverwriteLangs",
  overwriteLangs: "#overwriteLangs",
  labelVisibleButtons: "#labelVisibleButtons",
  btnPresetTabs: "#btnPresetTabs",
  buttonVisibilityGroups: "#buttonVisibilityGroups",
  labelBottomButtons: "#labelBottomButtons",
  bottomButtons: "#bottomButtons",
  labelClearOnMic: "#labelClearOnMic",
  clearOnMic: "#clearOnMic",
};

// ctx = { bus, store, config, utils, langLoader, elements, view } is passed to every ui-*.js module
export function createUiContext({ bus, store, config, utils, langLoader }) {
  return {
    bus,
    store,
    config,
    utils,
    langLoader,
    elements: {},
    // What the page shows now (kept here, not read back from the DOM)
    view: {
      presets: [], // saved configurations
      presetCount: 1, // configurations shown (1..PRESET_MAX)
      activePreset: 1, // configuration applied on the main screen
      editLangPreset: 1, // configuration shown in the "Languages" block of the settings
      editBtnPreset: 1, // configuration shown in the "Visible buttons" block of the settings
    },
  };
}

export function cacheElements({ elements }) {
  for (const key in SELECTORS) elements[key] = document.querySelector(SELECTORS[key]) || null;
}
