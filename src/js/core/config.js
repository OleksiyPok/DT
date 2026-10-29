// Constants and default values. No DOM access here.

// Google Cloud Translate API key (used only when the "google" service is selected)
export const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";

// Key of the saved settings in localStorage (keep in sync with theme-boot.js)
export const STORAGE_KEY = "DT-settings";

// File locations: saved defaults, UI texts (<lang>.json) and help pages (help.<lang>.html)
export const PATHS = {
  CONFIG: "config/config.json",
  I18N_DIR: "src/i18n/",
  HELP_DIR: "docs/help/",
};

// Buttons whose visibility is configurable, grouped by main-screen section.
// key = name in saved settings, id = DOM id, textKey = key in the UI texts.
export const BUTTON_SECTIONS = [
  {
    key: "source",
    labelKey: "sourceLangLabel",
    buttons: [
      { key: "paste", id: "pasteSource", icon: "📥", textKey: "pasteBtnTitle" },
      { key: "copy", id: "copySource", icon: "📋", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakSource", icon: "🔊", textKey: "speakBtnTitle" },
      { key: "mic", id: "micSource", icon: "🎤", textKey: "micBtnTitle" },
      { key: "clear", id: "clearSource", icon: "❌", textKey: "clearBtnTitle" },
    ],
  },
  {
    key: "target1",
    labelKey: "targetLang1Label",
    buttons: [
      { key: "copy", id: "copyTarget1", icon: "📋", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakTarget1", icon: "🔊", textKey: "speakBtnTitle" },
    ],
  },
  {
    key: "target2",
    labelKey: "targetLang2Label",
    buttons: [
      { key: "copy", id: "copyTarget2", icon: "📋", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakTarget2", icon: "🔊", textKey: "speakBtnTitle" },
    ],
  },
];

export function buildDefaultButtons() {
  const result = {};
  BUTTON_SECTIONS.forEach((section) => {
    result[section.key] = {};
    section.buttons.forEach((btn) => {
      result[section.key][btn.key] = true;
    });
  });
  return result;
}

// Supported language codes (same order as in the language selects)
export const LANG_CODES = [
  "de",
  "en",
  "eo",
  "es",
  "fr",
  "it",
  "nl",
  "pl",
  "pt",
  "ru",
  "tr",
  "uk",
];

// Number of prepared configurations (data is always kept for all of them)
export const PRESET_MAX = 6;
// How many configurations are shown by default
export const DEFAULT_PRESET_COUNT = 2;

// Language fields of a preset: settings-modal select id -> field name.
// The field names are also the ids of the main-screen selects.
export const PRESET_LANG_FIELDS = {
  presetSourceLang: "sourceLang",
  presetTargetLang1: "targetLang1",
  presetTargetLang2: "targetLang2",
};

// Default languages of each configuration (source, target 1, target 2)
const DEFAULT_PRESET_LANGS = [
  { sourceLang: "nl", targetLang1: "en", targetLang2: "uk" },
  { sourceLang: "en", targetLang1: "nl", targetLang2: "uk" },
  { sourceLang: "nl", targetLang1: "en", targetLang2: "de" },
  { sourceLang: "de", targetLang1: "en", targetLang2: "nl" },
  { sourceLang: "fr", targetLang1: "en", targetLang2: "nl" },
  { sourceLang: "pl", targetLang1: "en", targetLang2: "uk" },
];

export function buildDefaultPresets() {
  return DEFAULT_PRESET_LANGS.slice(0, PRESET_MAX).map((langs) => ({
    ...langs,
    buttons: buildDefaultButtons(),
  }));
}

// Settings used on first start and by "Reset defaults"
export const DEFAULT_SETTINGS = {
  uiLangSelect: "en",
  sourceLang: "nl",
  targetLang1: "en",
  targetLang2: "uk",
  serviceSelect: "mymemory",
  autoTranslate: true,
  clearOnMic: false, // clear the source text when the microphone starts
  bottomButtons: true, // show the extra buttons (clear, microphone) under the translations
  overwriteLangs: false, // write languages chosen on the main screen into the active configuration
  developerMode: false,
  thema: "theme-warmorange-normal",
  presets: buildDefaultPresets(),
  presetCount: DEFAULT_PRESET_COUNT,
  activePreset: 1,
};
