// Google Cloud Translate API key (used only when the "google" service is selected)
const googleApiKey = "YOUR_GOOGLE_API_KEY";

// File locations: saved defaults and the folder with help/help.<lang>.html
const PATHS = {
  CONFIG: "script/config.json",
  HELP_DIR: "help/",
};

// Buttons whose visibility is configurable, grouped by main-screen section.
// key = name in saved settings, id = DOM id, textKey = key in uiTexts
const BUTTON_SECTIONS = [
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
      {
        key: "speak",
        id: "speakTarget1",
        icon: "🔊",
        textKey: "speakBtnTitle",
      },
    ],
  },
  {
    key: "target2",
    labelKey: "targetLang2Label",
    buttons: [
      { key: "copy", id: "copyTarget2", icon: "📋", textKey: "copyBtnTitle" },
      {
        key: "speak",
        id: "speakTarget2",
        icon: "🔊",
        textKey: "speakBtnTitle",
      },
    ],
  },
];

function buildDefaultButtons() {
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
const LANG_CODES = [
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

// SVG icon of the main-screen button for each theme mode (same size and line style, colour = text colour)
const THEME_MODE_SVG_OPEN =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const THEME_MODE_ICONS = {
  contrast: `${THEME_MODE_SVG_OPEN}<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>`,
  normal: `${THEME_MODE_SVG_OPEN}<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  night: `${THEME_MODE_SVG_OPEN}<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>`,
};

// Number of prepared configurations (data is always kept for all of them)
const PRESET_MAX = 6;
// How many configurations are shown by default
const DEFAULT_PRESET_COUNT = 2;

// Language fields of a preset: settings-modal select id -> field name.
// The field names are also the ids of the main-screen selects.
const PRESET_LANG_FIELDS = {
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

function buildDefaultPresets() {
  return DEFAULT_PRESET_LANGS.slice(0, PRESET_MAX).map((langs) => ({
    ...langs,
    buttons: buildDefaultButtons(),
  }));
}

// Settings used on first start and by "Reset defaults"
const DEFAULT_SETTINGS = {
  uiLangSelect: "en",
  sourceLang: "nl",
  targetLang1: "en",
  targetLang2: "uk",
  serviceSelect: "mymemory",
  autoTranslate: true,
  clearOnMic: false, // clear the source text when the microphone starts
  overwriteLangs: false, // write languages chosen on the main screen into the active configuration
  developerMode: false,
  thema: "theme-warmorange-normal",
  presets: buildDefaultPresets(),
  presetCount: DEFAULT_PRESET_COUNT,
  activePreset: 1,
};

// Theme helper from themeRegistry.js (null if the script failed to load)
const themeRegistry = window.DTThemeRegistry || null;
// Theme used when the saved one is missing or unknown
const THEME_FALLBACK = themeRegistry?.defaultTheme || DEFAULT_SETTINGS.thema;

let autoTranslateChecked = true; // state of the "Auto-translate" checkbox
let debounceTimer; // delays auto-translation while the user types
let currentUtterance = null; // text being read aloud right now
let recognition = null; // SpeechRecognition instance (created on first use)
let isRecording = false; // microphone is listening
let presets = buildDefaultPresets(); // saved configurations
let presetCount = DEFAULT_PRESET_COUNT; // configurations shown (1..PRESET_MAX)
let activePreset = 1; // configuration applied on the main screen
let editLangPreset = 1; // configuration shown in the "Languages" settings block
let editBtnPreset = 1; // configuration shown in the "Visible buttons" settings block

/* ---------- Theme ---------- */

function renderThemePaletteOptions() {
  const select = document.getElementById("themaSelect");
  if (!select || !themeRegistry) return;
  select.innerHTML = "";
  themeRegistry.getPaletteOptions().forEach(({ palette, label }) => {
    const option = document.createElement("option");
    option.value = palette;
    option.textContent = label;
    select.appendChild(option);
  });
}

function getThemaFromSelects() {
  if (!themeRegistry) return THEME_FALLBACK;
  const palette = document.getElementById("themaSelect").value;
  const mode = document.getElementById("themaModeSelectSettings").value;
  return themeRegistry.composeThema(palette, mode) || THEME_FALLBACK;
}

function updateModeButton(mode, t) {
  const btn = document.getElementById("themaModeBtn");
  const icon = document.getElementById("themaModeIcon");
  if (!btn || !icon) return;
  const texts =
    t || uiTexts[document.getElementById("uiLangSelect").value] || uiTexts.en;
  const modeTexts = {
    contrast: texts.themaModeContrast,
    normal: texts.themaModeNormal,
    night: texts.themaModeNight,
  };
  const title = `${texts.labelThemaMode}: ${modeTexts[mode] || ""}`;
  icon.innerHTML = THEME_MODE_ICONS[mode] || "";
  btn.title = title;
  btn.setAttribute("aria-label", title);
}

function applyThema(value) {
  if (!themeRegistry) return THEME_FALLBACK;
  const chosen = themeRegistry.applyThemeClass(
    document.documentElement,
    value,
    THEME_FALLBACK
  );
  const parsed = themeRegistry.parseThema(chosen);
  if (parsed) {
    document.getElementById("themaSelect").value = parsed.palette;
    document.getElementById("themaModeSelectSettings").value = parsed.mode;
    updateModeButton(parsed.mode);
  }
  return chosen;
}

function cycleThemaMode() {
  if (!themeRegistry) return;
  const modes = themeRegistry.themeModes;
  const select = document.getElementById("themaModeSelectSettings");
  const next = modes[(modes.indexOf(select.value) + 1) % modes.length];
  select.value = next;
  applyThema(getThemaFromSelects());
  saveSettings();
}

/* ---------- Presets: data helpers ---------- */

function clampPreset(value, max = presetCount) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 1;
}

function clampCount(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PRESET_MAX
    ? n
    : DEFAULT_PRESET_COUNT;
}

function normalizeButtonVisibility(raw) {
  const result = buildDefaultButtons();
  if (!raw || typeof raw !== "object") return result;
  BUTTON_SECTIONS.forEach((section) => {
    const src = raw[section.key];
    if (!src || typeof src !== "object") return;
    section.buttons.forEach((btn) => {
      if (typeof src[btn.key] === "boolean") {
        result[section.key][btn.key] = src[btn.key];
      }
    });
  });
  return result;
}

function pickLang(value, fallback) {
  return LANG_CODES.includes(value) ? value : fallback;
}

function normalizePreset(raw, fallback) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    sourceLang: pickLang(src.sourceLang, fallback.sourceLang),
    targetLang1: pickLang(src.targetLang1, fallback.targetLang1),
    targetLang2: pickLang(src.targetLang2, fallback.targetLang2),
    buttons: normalizeButtonVisibility(src.buttons),
  };
}

function normalizePresets(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return buildDefaultPresets().map((fallback, i) =>
    normalizePreset(list[i], fallback)
  );
}

function getActiveButtons() {
  return presets[activePreset - 1].buttons;
}

/* ---------- Presets: main screen ---------- */

// Buttons and tabs show source language codes. The active main-screen button
// shows the language currently selected there, the others show the saved one.
function updatePresetButtons() {
  const liveSource = document.getElementById("sourceLang").value;
  const codeOf = (n, live) =>
    String(
      (live && liveSource) || presets[n - 1]?.sourceLang || ""
    ).toUpperCase();

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    const n = Number(btn.dataset.preset);
    const on = n === activePreset;
    btn.textContent = codeOf(n, on);
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  document.querySelectorAll(".preset-tab").forEach((tab) => {
    const n = Number(tab.dataset.preset);
    const editing =
      tab.dataset.group === "btn" ? editBtnPreset : editLangPreset;
    tab.textContent = codeOf(n, false);
    tab.classList.toggle("active", n === editing);
    tab.setAttribute("aria-pressed", String(n === editing));
  });
}

function updatePresetTitles(t) {
  const texts =
    t || uiTexts[document.getElementById("uiLangSelect").value] || uiTexts.en;
  document.querySelectorAll(".preset-btn, .preset-tab").forEach((el) => {
    const title = `${texts.presetBtnTitle} ${el.dataset.preset}`;
    el.title = title;
    el.setAttribute("aria-label", title);
  });
}

function renderPresetControls() {
  const fill = (container, className, group, onClick) => {
    if (!container) return;
    container.replaceChildren();
    for (let n = 1; n <= presetCount; n++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = className;
      el.dataset.preset = String(n);
      if (group) el.dataset.group = group;
      el.addEventListener("click", () => onClick(n));
      container.appendChild(el);
    }
  };

  editLangPreset = clampPreset(editLangPreset);
  editBtnPreset = editLangPreset;

  fill(document.getElementById("presetButtons"), "preset-btn", "", (n) =>
    setActivePreset(n)
  );
  fill(document.getElementById("langPresetTabs"), "preset-tab", "lang", (n) =>
    setEditPreset(n)
  );
  fill(document.getElementById("btnPresetTabs"), "preset-tab", "btn", (n) =>
    setEditPreset(n)
  );

  const countSelect = document.getElementById("presetCountSelect");
  if (countSelect) countSelect.value = String(presetCount);

  updatePresetTitles();
  updatePresetButtons();
}

function setEditPreset(n) {
  editLangPreset = clampPreset(n);
  editBtnPreset = editLangPreset;
  syncLangEditor();
  syncBtnEditor();
  updatePresetButtons();
}

function setActivePreset(n) {
  activePreset = clampPreset(n);
  const p = presets[activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    document.getElementById(field).value = p[field];
  });
  applyButtonVisibility();
  updatePresetButtons();
  saveSettings();
  if (autoTranslateChecked) translateText();
}

/* ---------- Presets: settings modal ---------- */

function renderPresetLanguageOptions() {
  Object.keys(PRESET_LANG_FIELDS).forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = "";
    LANG_CODES.forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = code;
      select.appendChild(option);
    });
  });
}

function syncLangEditor() {
  const p = presets[editLangPreset - 1];
  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    document.getElementById(selectId).value = p[field];
  });
}

function syncBtnEditor() {
  const p = presets[editBtnPreset - 1];
  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const checkbox = document.querySelector(
        `.button-visibility-checkbox[data-section="${section.key}"][data-button="${btn.key}"]`
      );
      if (checkbox) checkbox.checked = p.buttons[section.key][btn.key];
    });
  });
}

function syncPresetEditor() {
  syncLangEditor();
  syncBtnEditor();
  updatePresetButtons();
}

function renderButtonVisibilityOptions() {
  const container = document.getElementById("buttonVisibilityGroups");
  if (!container) return;
  container.innerHTML = "";

  BUTTON_SECTIONS.forEach((section) => {
    const group = document.createElement("div");
    group.className = "button-visibility-group";

    const title = document.createElement("div");
    title.className = "button-visibility-title";
    title.dataset.sectionTitle = section.key;
    group.appendChild(title);

    const list = document.createElement("div");
    list.className = "button-visibility-list";

    section.buttons.forEach((btn) => {
      const label = document.createElement("label");
      label.className = "button-visibility-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "button-visibility-checkbox";
      checkbox.dataset.section = section.key;
      checkbox.dataset.button = btn.key;

      const text = document.createElement("span");
      text.className = "button-visibility-text";
      text.dataset.section = section.key;
      text.dataset.button = btn.key;

      label.appendChild(checkbox);
      label.appendChild(text);
      list.appendChild(label);
    });

    group.appendChild(list);
    container.appendChild(group);
  });
}

function updateButtonVisibilityTexts(t) {
  BUTTON_SECTIONS.forEach((section) => {
    const title = document.querySelector(
      `.button-visibility-title[data-section-title="${section.key}"]`
    );
    if (title) title.textContent = t[section.labelKey] || "";

    section.buttons.forEach((btn) => {
      const text = document.querySelector(
        `.button-visibility-text[data-section="${section.key}"][data-button="${btn.key}"]`
      );
      if (text) text.textContent = `${btn.icon} ${t[btn.textKey] || ""}`;
    });
  });
}

function applyButtonVisibility() {
  const visibility = getActiveButtons();

  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const visible = visibility[section.key][btn.key];
      document.getElementById(btn.id)?.classList.toggle("is-hidden", !visible);
    });
  });

  document
    .querySelectorAll(".side-buttons, .button-container")
    .forEach((container) => {
      const hasVisible = !!container.querySelector(".icon-btn:not(.is-hidden)");
      container.classList.toggle("is-hidden", !hasVisible);
    });

  if (!visibility.source.mic && isRecording && recognition) {
    recognition.abort();
  }
}

/* ---------- Modals (help, settings) ---------- */

function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeAllModals() {
  document
    .querySelectorAll(".app-modal")
    .forEach((m) => m.classList.add("hidden"));
}

/* ---------- Help window content ---------- */

// Loaded help pages by language (help/help.<lang>.html; English is the fallback)
const helpCache = {};

async function fetchHelpHtml(lang) {
  if (helpCache[lang]) return helpCache[lang];
  const response = await fetch(`${PATHS.HELP_DIR}help.${lang}.html`, {
    cache: "no-cache",
  });
  if (!response.ok) throw new Error(`help.${lang}.html: ${response.status}`);
  helpCache[lang] = await response.text();
  return helpCache[lang];
}

async function loadHelp() {
  const target = document.getElementById("helpAppContent");
  if (!target) return;
  const lang = document.getElementById("uiLangSelect").value;
  let html = "";
  try {
    html = await fetchHelpHtml(lang);
  } catch {
    try {
      html = await fetchHelpHtml("en");
    } catch {
      html = "";
    }
  }
  if (!html) {
    target.textContent = "Help is not available.";
    return;
  }
  target.innerHTML = html;
  target.querySelectorAll(".help-shot img").forEach((img) => {
    const markMissing = () =>
      img.closest(".help-shot")?.classList.add("missing");
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0) markMissing();
  });
}

function isAnyModalOpen() {
  return !!document.querySelector(".app-modal:not(.hidden)");
}

function initModals() {
  document.getElementById("helpAppBtn").addEventListener("click", () => {
    openModal("helpAppModal");
    loadHelp();
  });
  document.getElementById("settingsAppBtn").addEventListener("click", () => {
    editLangPreset = activePreset;
    editBtnPreset = activePreset;
    syncPresetEditor();
    openModal("settingsAppModal");
    updateModalSnap();
  });

  document
    .querySelectorAll(".app-modal-close-btn")
    .forEach((btn) => btn.addEventListener("click", closeAllModals));

  document.querySelectorAll(".app-modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isAnyModalOpen()) closeAllModals();
  });
}

/* ---------- UI texts ---------- */

function updateUI() {
  const lang = document.getElementById("uiLangSelect").value;
  const t = uiTexts[lang] || uiTexts.en;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  };
  const setTitle = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) {
      el.title = value;
      el.setAttribute("aria-label", value);
    }
  };

  document.getElementById("serviceLabel").textContent = t.serviceLabel;

  const autoLabel =
    document.getElementById("autoTranslateLabel") ||
    document.querySelector(".auto-translate-label");
  if (autoLabel) {
    autoLabel.textContent = t.autoTranslateLabel;
  }

  document.getElementById("autoTranslate").checked = autoTranslateChecked;
  updateTranslateButtonVisibility();
  document.getElementById("uiLangLabel").textContent = t.interfaceLabel;
  document.querySelector(".source-lang-label").textContent = t.sourceLangLabel;
  document.querySelector(".target-lang-1-label").textContent =
    t.targetLang1Label;
  document.querySelector(".target-lang-2-label").textContent =
    t.targetLang2Label;

  document.getElementById("sourceText").placeholder = t.sourcePlaceholder;
  document.getElementById("translatedText1").placeholder =
    t.translation1Placeholder;
  document.getElementById("translatedText2").placeholder =
    t.translation2Placeholder;
  document.getElementById("manualTranslateBtn").textContent =
    t.translateButtonText;

  document.getElementById("copySource").title = t.copyBtnTitle;
  document.getElementById("pasteSource").title = t.pasteBtnTitle;
  document.getElementById("micSource").title = t.micBtnTitle;
  document.getElementById("copyTarget1").title = t.copyBtnTitle;
  document.getElementById("copyTarget2").title = t.copyBtnTitle;
  setTitle("clearSource", t.clearBtnTitle);
  setTitle("speakSource", t.speakBtnTitle);
  setTitle("speakTarget1", t.speakBtnTitle);
  setTitle("speakTarget2", t.speakBtnTitle);

  setTitle("helpAppBtn", t.helpBtnTitle);
  setTitle("settingsAppBtn", t.settingsBtnTitle);
  setTitle("helpAppCloseBtn", t.closeBtnTitle);
  setTitle("settingsAppCloseBtn", t.closeBtnTitle);
  setText("labelThemaModeSettings", t.labelThemaMode);
  setText("labelThema", t.labelThema);
  setText("labelVisibleButtons", t.labelVisibleButtons);
  setText("resetSettingsText", t.defaultSettings);
  setTitle("resetSettingsBtn", t.defaultSettings);

  setText("labelPresets", t.presetsLabel);
  setText("labelPresetCount", t.labelPresetCount);
  setText("labelPresetLanguages", t.labelPresetLanguages);
  setText("labelOverwriteLangs", t.labelOverwriteLangs);
  setText("labelClearOnMic", t.clearOnMicLabel);
  setText("settingsTitle", t.settingsTitle);
  setText("helpTitle", t.helpBtnTitle);
  setText("labelPresetSourceLang", t.sourceLangLabel);
  setText("labelPresetTargetLang1", t.targetLang1Label);
  setText("labelPresetTargetLang2", t.targetLang2Label);
  updatePresetTitles(t);

  updateButtonVisibilityTexts(t);

  const modeSelect = document.getElementById("themaModeSelectSettings");
  const modeTexts = {
    contrast: t.themaModeContrast,
    normal: t.themaModeNormal,
    night: t.themaModeNight,
  };
  Array.from(modeSelect.options).forEach((option) => {
    if (modeTexts[option.value]) option.textContent = modeTexts[option.value];
  });
  updateModeButton(modeSelect.value, t);

  updateLangSelectOptions(lang);
}

function updateLangSelectOptions(lang) {
  const nameMap = languageNames[lang] || languageNames.en;

  [
    "sourceLang",
    "targetLang1",
    "targetLang2",
    "presetSourceLang",
    "presetTargetLang1",
    "presetTargetLang2",
  ].forEach((selectId) => {
    const select = document.getElementById(selectId);
    Array.from(select.options).forEach((option) => {
      const code = option.value;
      if (nameMap[code]) {
        option.textContent = nameMap[code];
      }
    });
  });
}

function setLoadingState(isLoading) {
  const translateBtn = document.getElementById("manualTranslateBtn");
  const lang = document.getElementById("uiLangSelect").value;
  const t = uiTexts[lang] || uiTexts.en;

  translateBtn.disabled = isLoading;
  translateBtn.textContent = isLoading ? "..." : t.translateButtonText;
}

function updateTranslateButtonVisibility() {
  const btn = document.getElementById("manualTranslateBtn");
  btn.style.display = autoTranslateChecked ? "none" : "";
}

/* ---------- Translation ---------- */

async function translateText() {
  const text = document.getElementById("sourceText").value.trim();
  if (!text) {
    clearTranslations();
    return;
  }

  const service = document.getElementById("serviceSelect").value;
  const src = document.getElementById("sourceLang").value;
  const t1 = document.getElementById("targetLang1").value;
  const t2 = document.getElementById("targetLang2").value;

  setLoadingState(true);
  document.getElementById("translatedText1").value = "...";
  document.getElementById("translatedText2").value = "...";

  try {
    if (service === "mymemory") {
      document.getElementById("translatedText1").value =
        await translateMyMemory(text, src, t1);
      document.getElementById("translatedText2").value =
        await translateMyMemory(text, src, t2);
    } else if (service === "libretranslate") {
      document.getElementById("translatedText1").value = await translateLibre(
        text,
        src,
        t1
      );
      document.getElementById("translatedText2").value = await translateLibre(
        text,
        src,
        t2
      );
    } else if (service === "google") {
      document.getElementById("translatedText1").value = await translateGoogle(
        text,
        src,
        t1
      );
      document.getElementById("translatedText2").value = await translateGoogle(
        text,
        src,
        t2
      );
    }
  } catch (err) {
    document.getElementById("translatedText1").value = "Error";
    document.getElementById("translatedText2").value = "Error";
    clearTranslations();
    alert("Translation failed: " + err.message);
  } finally {
    setLoadingState(false);
  }
}

function clearTranslations() {
  document.getElementById("translatedText1").value = "";
  document.getElementById("translatedText2").value = "";
}

async function translateMyMemory(q, source, target) {
  const langpair = source + "|" + target;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        q
      )}&langpair=${langpair}`
    );
    const data = await res.json();
    if (data?.responseData?.translatedText)
      return data.responseData.translatedText;
    throw new Error("Translation error (MyMemory)");
  } catch (err) {
    return "Translation error (MyMemory).";
  }
}

async function translateLibre(q, source, target) {
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source, target, format: "text" }),
    });
    const data = await res.json();
    if (data?.translatedText) return data.translatedText;
    throw new Error("Translation error (LibreTranslate)");
  } catch {
    return "Translation error (LibreTranslate).";
  }
}

async function translateGoogle(q, source, target) {
  try {
    const body = { q, target, format: "text" };
    if (source !== "auto") body.source = source;
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    if (data?.data?.translations?.[0]?.translatedText)
      return data.data.translations[0].translatedText;
    throw new Error("Translation error (Google)");
  } catch {
    return "Translation error (Google).";
  }
}

/* ---------- Clipboard, speech ---------- */

function copyToClipboard(text) {
  if (!navigator.clipboard) {
    alert("Clipboard API not supported");
    return;
  }
  navigator.clipboard.writeText(text).catch(() => alert("Failed to copy"));
}

function pasteFromClipboard(inputElement) {
  if (!navigator.clipboard) {
    alert("Clipboard API not supported");
    return;
  }
  navigator.clipboard.readText().then((clipText) => {
    inputElement.value += clipText;
    inputElement.dispatchEvent(new Event("input"));
  });
}

function speakText(text, langCode = "en", button = null) {
  if (!window.speechSynthesis) {
    alert("Speech Synthesis not supported in this browser.");
    return;
  }

  if (speechSynthesis.speaking && currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1;
  utterance.pitch = 1;

  currentUtterance = utterance;

  utterance.onend = () => {
    currentUtterance = null;
  };

  utterance.onerror = () => {
    currentUtterance = null;
  };

  speechSynthesis.speak(utterance);
}

function initSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert(
      "Speech recognition is not supported in this browser.\n\n" +
        "Please use Chrome or Edge on Android."
    );
    return null;
  }

  if (!window.isSecureContext) {
    alert(
      "Speech recognition requires a secure connection (HTTPS).\n\n" +
        "Please serve this app over HTTPS or open it via localhost.\n" +
        "On Android, install it as a PWA or use a local server."
    );
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = document.getElementById("sourceLang").value;

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const source = document.getElementById("sourceText");
    source.value = source.value.trim()
      ? source.value.trim() + " " + transcript.trim()
      : transcript.trim();
    source.dispatchEvent(new Event("input"));
  };

  rec.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === "not-allowed") {
      alert(
        "Microphone access was denied.\n\n" +
          "Please allow microphone permission in your browser settings " +
          "and ensure the page is served over HTTPS."
      );
    } else if (event.error === "no-speech") {
    } else if (event.error === "aborted") {
    } else {
      alert("Speech recognition error: " + event.error);
    }
  };

  rec.onend = () => {
    isRecording = false;
    setMicActive(false);
  };

  return rec;
}

// The microphone / "stop" icons are swapped by CSS (.mic-active), so only the class changes here
function setMicActive(active) {
  const micBtn = document.getElementById("micSource");
  if (!micBtn) return;
  micBtn.classList.toggle("mic-active", active);
}

function clearSourceText() {
  document.getElementById("sourceText").value = "";
  clearTranslations();
  saveSettings();
}

function startSpeechRecognition() {
  if (isRecording) {
    if (recognition) recognition.abort();
    return;
  }

  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) return;
  }

  recognition.lang = document.getElementById("sourceLang").value;

  try {
    recognition.start();
    isRecording = true;
    setMicActive(true);
    if (document.getElementById("clearOnMic").checked) clearSourceText();
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    alert("Failed to start speech recognition: " + err.message);
  }
}

/* ---------- Scroll steps (CSS scroll-snap) ---------- */

function contentTop(container, el) {
  return (
    el.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  );
}

function snapOffset(container, el) {
  return (
    (parseFloat(getComputedStyle(container).scrollPaddingTop) || 0) +
    (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
  );
}

function fitSnapSpacer(container, spacer, lastSnapEl) {
  if (!container || !spacer || !lastSnapEl || !container.clientHeight) return;
  spacer.style.height = "0px";
  const stepPos =
    contentTop(container, lastSnapEl) - snapOffset(container, lastSnapEl);
  const maxScroll = container.scrollHeight - container.clientHeight;
  spacer.style.height = Math.max(0, Math.ceil(stepPos - maxScroll)) + "px";
}

function updateMainSnap() {
  const container = document.getElementById("scrollContainer");
  const source = document.querySelector(".section-block-source");
  const targets = document.querySelector(".section-block-targets-wrapper");
  if (!container || !source || !targets) return;

  const sourceStep =
    contentTop(container, source) - snapOffset(container, source);
  const contentBottom = contentTop(container, targets) + targets.offsetHeight;
  targets.classList.toggle(
    "snap-end",
    contentBottom - sourceStep > container.clientHeight + 1
  );

  fitSnapSpacer(container, document.getElementById("mainSnapSpacer"), source);
}

function updateModalSnap() {
  const body = document.getElementById("settingsBody");
  if (!body || !body.clientHeight) return;
  const blocks = document.getElementById("settingsAppContent");
  fitSnapSpacer(
    body,
    document.getElementById("settingsSnapSpacer"),
    blocks && blocks.lastElementChild
  );
  updateScrollHints();
}

function updateScrollHints() {
  const body = document.getElementById("settingsBody");
  if (!body || !body.clientHeight) return;
  const canUp = body.scrollTop > 2;
  const canDown = body.scrollTop + body.clientHeight < body.scrollHeight - 2;
  body.parentElement.style.setProperty(
    "--scrollbar-w",
    body.offsetWidth - body.clientWidth + "px"
  );
  ["scrollHintLeft", "scrollHintRight"].forEach((id) => {
    const hint = document.getElementById(id);
    if (!hint) return;
    hint.classList.toggle("can-up", canUp);
    hint.classList.toggle("can-down", canDown);
  });
}

/* ---------- Step number (fraction) ---------- */

// How long the block-number badge stays visible after the last scroll (ms)
const STEP_BADGE_MS = 2000;
// Hide timers of the badges by badge id
const stepBadgeTimers = {};

function getSettingsSteps() {
  const blocks = document.getElementById("settingsAppContent");
  return blocks
    ? Array.from(blocks.children).filter((el) => el.offsetParent !== null)
    : [];
}

function showStepBadge(badgeId, container, steps) {
  const badge = document.getElementById(badgeId);
  if (!badge || !container || !steps.length || !container.clientHeight) return;

  let current = 0;
  let best = Infinity;
  steps.forEach((el, i) => {
    const pos = contentTop(container, el) - snapOffset(container, el);
    const dist = Math.abs(pos - container.scrollTop);
    if (dist < best - 0.5) {
      best = dist;
      current = i;
    }
  });
  if (
    container.scrollTop + container.clientHeight >=
    container.scrollHeight - 2
  ) {
    current = steps.length - 1;
  }

  badge.innerHTML =
    `<span class="step-num">${current + 1}</span>` +
    `<span class="step-den">${steps.length}</span>`;
  badge.classList.add("show");
  clearTimeout(stepBadgeTimers[badgeId]);
  stepBadgeTimers[badgeId] = setTimeout(
    () => badge.classList.remove("show"),
    STEP_BADGE_MS
  );
}

function updateSnap() {
  updateMainSnap();
  updateModalSnap();
}

function initSnap() {
  updateSnap();
  const settingsBody = document.getElementById("settingsBody");
  settingsBody?.addEventListener("scroll", updateScrollHints, {
    passive: true,
  });
  settingsBody?.addEventListener(
    "scroll",
    () => showStepBadge("stepBadgeSettings", settingsBody, getSettingsSteps()),
    { passive: true }
  );

  window.addEventListener("resize", updateSnap);
  window.addEventListener("orientationchange", updateSnap);
  window.addEventListener("load", updateSnap);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateSnap);
    [
      document.querySelector(".layout"),
      document.getElementById("settingsAppContent"),
      document.getElementById("settingsBody"),
    ].forEach((el) => el && ro.observe(el));
  }
}

/* ---------- Settings ---------- */

function isDeveloperPanelVisible() {
  return (
    getComputedStyle(document.getElementById("developer")).display !== "none"
  );
}

// sourceLang / targetLang1 / targetLang2 are the live values of the main
// screen; the saved configurations are stored separately in `presets`.
function saveSettings() {
  const settings = {
    uiLangSelect: document.getElementById("uiLangSelect").value,
    serviceSelect: document.getElementById("serviceSelect").value,
    sourceLang: document.getElementById("sourceLang").value,
    targetLang1: document.getElementById("targetLang1").value,
    targetLang2: document.getElementById("targetLang2").value,
    autoTranslate: document.getElementById("autoTranslate").checked,
    clearOnMic: document.getElementById("clearOnMic").checked,
    overwriteLangs: document.getElementById("overwriteLangs").checked,
    developerMode: isDeveloperPanelVisible(),
    thema: getThemaFromSelects(),
    presets,
    presetCount,
    activePreset,
  };
  localStorage.setItem("translatorSettings", JSON.stringify(settings));
}

function applyState(settings) {
  const $ = (id) => document.getElementById(id);

  $("uiLangSelect").value = settings.uiLangSelect || "en";
  $("serviceSelect").value = settings.serviceSelect || "mymemory";

  if (Array.isArray(settings.presets)) {
    presets = normalizePresets(settings.presets);
  } else {
    presets = buildDefaultPresets();
    presets[0] = normalizePreset(
      {
        sourceLang: settings.sourceLang,
        targetLang1: settings.targetLang1,
        targetLang2: settings.targetLang2,
        buttons: settings.buttons,
      },
      presets[0]
    );
  }
  presetCount = clampCount(settings.presetCount);
  activePreset = clampPreset(settings.activePreset);
  editLangPreset = activePreset;
  editBtnPreset = activePreset;
  renderPresetControls();

  const active = presets[activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    $(field).value = pickLang(settings[field], active[field]);
  });

  $("autoTranslate").checked = settings.autoTranslate ?? true;
  autoTranslateChecked = $("autoTranslate").checked;
  $("clearOnMic").checked = settings.clearOnMic === true;
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

function loadSettings() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("translatorSettings"));
  } catch {
    saved = null;
  }
  applyState(
    saved && typeof saved === "object" ? saved : buildResetSettings({})
  );
}

// Defaults merged with values from config.json. Without a `presets` array there,
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

async function resetSettings() {
  let external = {};
  try {
    const response = await fetch(PATHS.CONFIG, { cache: "no-cache" });
    if (response.ok) external = await response.json();
  } catch (error) {
    external = {};
  }
  applySettings(buildResetSettings(external));
}

function applySettings(settings) {
  applyState(settings);
  clearTranslations();
  updateUI();
  saveSettings();
}

function onInputChanged() {
  if (autoTranslateChecked) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      translateText();
    }, 700);
  }
  saveSettings();
}

document.addEventListener("DOMContentLoaded", () => {
  renderThemePaletteOptions();
  renderButtonVisibilityOptions();
  renderPresetLanguageOptions();
  loadSettings();
  updateUI();
  initModals();

  document.getElementById("uiLangSelect").addEventListener("change", () => {
    updateUI();
    saveSettings();
  });

  ["themaSelect", "themaModeSelectSettings"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      applyThema(getThemaFromSelects());
      saveSettings();
    });
  });

  document
    .getElementById("themaModeBtn")
    .addEventListener("click", cycleThemaMode);

  document
    .getElementById("presetCountSelect")
    .addEventListener("change", (e) => {
      presetCount = clampCount(e.target.value);
      renderPresetControls();
      if (activePreset > presetCount) setActivePreset(presetCount);
      syncPresetEditor();
      saveSettings();
    });

  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    document.getElementById(selectId).addEventListener("change", (e) => {
      presets[editLangPreset - 1][field] = e.target.value;
      if (editLangPreset === activePreset) {
        document.getElementById(field).value = e.target.value;
        if (autoTranslateChecked) translateText();
      }
      updatePresetButtons();
      saveSettings();
    });
  });

  document.getElementById("overwriteLangs").addEventListener("change", () => {
    saveSettings();
  });

  document
    .getElementById("buttonVisibilityGroups")
    .addEventListener("change", (e) => {
      const cb = e.target;
      if (!cb.classList || !cb.classList.contains("button-visibility-checkbox"))
        return;
      const { section, button } = cb.dataset;
      const buttons = presets[editBtnPreset - 1].buttons;
      if (buttons[section] && button in buttons[section]) {
        buttons[section][button] = cb.checked;
        if (editBtnPreset === activePreset) applyButtonVisibility();
        saveSettings();
      }
    });

  document.getElementById("serviceSelect").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  ["sourceLang", "targetLang1", "targetLang2"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const p = presets[activePreset - 1];
      if (document.getElementById("overwriteLangs").checked) {
        p[id] = e.target.value;
        if (editLangPreset === activePreset) syncLangEditor();
      }
      updatePresetButtons();
      saveSettings();
      if (autoTranslateChecked) translateText();
    });
  });

  document.getElementById("clearOnMic").addEventListener("change", () => {
    saveSettings();
  });

  document.getElementById("autoTranslate").addEventListener("change", (e) => {
    autoTranslateChecked = e.target.checked;
    updateTranslateButtonVisibility();
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("sourceText").addEventListener("input", () => {
    onInputChanged();
  });

  document
    .getElementById("manualTranslateBtn")
    .addEventListener("click", () => {
      translateText();
    });

  document.getElementById("clearSource").addEventListener("click", () => {
    if (isRecording && recognition) recognition.abort();
    clearSourceText();
  });

  document.getElementById("copySource").addEventListener("click", () => {
    const source = document.getElementById("sourceText");
    const selected = source.value.substring(
      source.selectionStart,
      source.selectionEnd
    );
    copyToClipboard(selected.length > 0 ? selected : source.value);
  });
  document.getElementById("copyTarget1").addEventListener("click", () => {
    const target1 = document.getElementById("translatedText1");
    const selected = target1.value.substring(
      target1.selectionStart,
      target1.selectionEnd
    );
    copyToClipboard(selected.length > 0 ? selected : target1.value);
  });
  document.getElementById("copyTarget2").addEventListener("click", () => {
    const target2 = document.getElementById("translatedText2");
    const selected = target2.value.substring(
      target2.selectionStart,
      target2.selectionEnd
    );
    copyToClipboard(selected.length > 0 ? selected : target2.value);
  });

  document.getElementById("pasteSource").addEventListener("click", () => {
    pasteFromClipboard(document.getElementById("sourceText"));
  });

  document.getElementById("speakSource").addEventListener("click", () => {
    const source = document.getElementById("sourceText");
    const srcLang = document.getElementById("sourceLang").value;
    if (source.value.trim()) speakText(source.value, srcLang);
  });

  document.getElementById("speakTarget1").addEventListener("click", () => {
    const target1 = document.getElementById("translatedText1");
    const tgtLang1 = document.getElementById("targetLang1").value;
    if (target1.value.trim()) speakText(target1.value, tgtLang1);
  });

  document.getElementById("speakTarget2").addEventListener("click", () => {
    const target2 = document.getElementById("translatedText2");
    const tgtLang2 = document.getElementById("targetLang2").value;
    if (target2.value.trim()) speakText(target2.value, tgtLang2);
  });

  document.getElementById("micSource").addEventListener("click", () => {
    startSpeechRecognition();
  });

  document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    resetSettings();
  });

  initSnap();

  if (autoTranslateChecked) translateText();
});
