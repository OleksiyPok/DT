// Constants of the app. No DOM access here.
// Default settings are NOT here: they live only in config/config.json.

// Google Cloud Translate API key (used only when the "google" service is selected).
// Anyone can read it in the page source: restrict the key to your site in Google Cloud.
export const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";

// Version shown on the main screen
export const APP_VERSION = "2.4.3";

// Key of the saved settings in localStorage (keep in sync with theme-boot.js)
export const STORAGE_KEY = "DT-settings";

// File locations: default settings, UI texts (<lang>.json) and help pages (help.<lang>.html)
export const PATHS = {
  CONFIG: "config/config.json",
  I18N_DIR: "src/i18n/",
  HELP_DIR: "docs/help/",
};

// Buttons whose visibility is configurable, grouped by main-screen section.
// key = name in saved settings, id = DOM id, textKey = key in the UI texts (the label in the settings).
export const BUTTON_SECTIONS = [
  {
    key: "source",
    labelKey: "sourceLangLabel",
    buttons: [
      { key: "paste", id: "pasteSource", textKey: "pasteBtnTitle" },
      { key: "copy", id: "copySource", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakSource", textKey: "speakBtnTitle" },
      { key: "mic", id: "micSource", textKey: "micBtnTitle" },
      { key: "clear", id: "clearSource", textKey: "clearBtnTitle" },
    ],
  },
  {
    key: "target1",
    labelKey: "targetLang1Label",
    buttons: [
      { key: "copy", id: "copyTarget1", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakTarget1", textKey: "speakBtnTitle" },
    ],
  },
  {
    key: "target2",
    labelKey: "targetLang2Label",
    buttons: [
      { key: "copy", id: "copyTarget2", textKey: "copyBtnTitle" },
      { key: "speak", id: "speakTarget2", textKey: "speakBtnTitle" },
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

// Language fields of a preset: settings-modal select id -> field name.
// The field names are also the ids of the main-screen selects.
export const PRESET_LANG_FIELDS = {
  presetSourceLang: "sourceLang",
  presetTargetLang1: "targetLang1",
  presetTargetLang2: "targetLang2",
};
