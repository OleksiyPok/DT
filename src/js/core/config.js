// Constants and the default settings (config/config.json).

// Shown on the main screen (change it with every change of the app)
export const APP_VERSION = "2.8.2";

// Key of the saved settings in localStorage
export const STORAGE_KEY = "DT-settings";

// Folder of the help pages
export const HELP_DIR = "docs/help/";

// Languages of the help pages (docs/help/help.<lang>.html); a missing page is replaced by the English one
export const HELP_LANGS = ["ar", "cs", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "ru", "tr", "uk"];

// Language chosen in the help window
export const HELP_LANGUAGE_KEY = "DT-help-language";

// Google Cloud Translate API key (used only when the "google" service is selected).
// Anyone can read it in the page source: restrict the key to your site in Google Cloud.
export const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";

// Key of the MyMemory usage counter in localStorage
export const MYMEMORY_USAGE_KEY = "DT-MyMemory-usage";

// Characters per day that MyMemory translates without a key (shown in the developer panel)
export const MYMEMORY_DAILY_LIMIT = 5000;

// Values of <select id="serviceSelect">
export const SERVICES = Object.freeze(["mymemory", "libretranslate", "google"]);

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

// Number of prepared configurations (data is always kept for all of them)
export const PRESET_MAX = 6;

// Language fields of a preset: settings-window select id -> field name.
// The field names are also the ids of the main-screen selects.
export const PRESET_LANG_FIELDS = {
  presetSourceLang: "sourceLang",
  presetTargetLang1: "targetLang1",
  presetTargetLang2: "targetLang2",
};

// Default settings come only from config/config.json.
// config.json: common values; the "mobile" block overrides them on phones and tablets.
export function createConfig() {
  const PATHS = {
    CONFIG: "config/config.json",
    UI_TEXTS_DIR: "src/i18n",
  };
  // Languages of the interface (src/i18n); the same list is used for the languages of the texts
  const UI_LANGS = Object.freeze(["ar", "cs", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "ru", "tr", "uk"]);

  async function load() {
    const res = await fetch(PATHS.CONFIG, { cache: "no-store" });
    if (!res.ok) throw new Error(`${PATHS.CONFIG}: ${res.status}`);
    const { mobile, ...common } = await res.json();
    const isMobile = /Mobi|Android|iPhone|iPad|Windows Phone|IEMobile/i.test(navigator.userAgent || "");
    return { ...common, ...(isMobile ? mobile || {} : {}) };
  }

  return { PATHS, UI_LANGS, load };
}
