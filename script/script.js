const googleApiKey = "YOUR_GOOGLE_API_KEY"; // Google API key

const PATHS = {
  CONFIG: "script/config.json",
};

/* Buttons that can be shown/hidden per section (settings modal).
   `id` is the button element on the main page, `textKey` is the key in uiTexts
   used for the localized name (same text as the button tooltip). */
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

/* ---------- Presets (configurations 1-3) ----------
   A preset stores the languages (source, target 1, target 2) and the
   visibility of the buttons. Presets are edited ONLY in the settings modal.
   The language selects on the main window are a "live" state: changing them
   never writes into a preset. Clicking a preset button loads that preset. */

const LANG_CODES = ["de", "en", "fr", "nl", "pl", "pt", "ru", "tr", "uk"];
const PRESET_COUNT = 3;

// Language fields of a preset. The keys are also the ids of the main-window selects.
const PRESET_LANG_FIELDS = {
  presetSourceLang: "sourceLang",
  presetTargetLang1: "targetLang1",
  presetTargetLang2: "targetLang2",
};

const DEFAULT_PRESET_LANGS = [
  { sourceLang: "nl", targetLang1: "en", targetLang2: "uk" },
  { sourceLang: "en", targetLang1: "nl", targetLang2: "uk" },
  { sourceLang: "nl", targetLang1: "en", targetLang2: "de" },
];

function buildDefaultPresets() {
  return DEFAULT_PRESET_LANGS.map((langs) => ({
    ...langs,
    buttons: buildDefaultButtons(),
  }));
}

const DEFAULT_SETTINGS = {
  uiLangSelect: "en",
  sourceLang: "nl",
  targetLang1: "en",
  targetLang2: "uk",
  serviceSelect: "mymemory",
  autoTranslate: true,
  clearOnMic: false, // clear the source text when the microphone starts
  developerMode: false,
  thema: "theme-yellowblue-normal",
  presets: buildDefaultPresets(),
  activePreset: 1,
};

const themeRegistry = window.DTThemeRegistry || null;
const THEME_FALLBACK = themeRegistry?.defaultTheme || DEFAULT_SETTINGS.thema;

let autoTranslateChecked = true;
let debounceTimer;
let currentUtterance = null;
let recognition = null;
let isRecording = false;
let presets = buildDefaultPresets();
let activePreset = 1; // applied on the main window
let editPreset = 1; // shown in the settings modal

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

// Full theme key (e.g. "theme-delftware-night") from the palette + mode selects
function getThemaFromSelects() {
  if (!themeRegistry) return THEME_FALLBACK;
  const palette = document.getElementById("themaSelect").value;
  const mode = document.getElementById("themaModeSelect").value;
  return themeRegistry.composeThema(palette, mode) || THEME_FALLBACK;
}

// Applies the theme class to <html> and syncs both selects with it
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
    document.getElementById("themaModeSelect").value = parsed.mode;
  }
  return chosen;
}

/* ---------- Presets: data helpers ---------- */

function clampPreset(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PRESET_COUNT ? n : 1;
}

// Builds a full {section: {button: boolean}} object, missing/invalid values = true
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

/* ---------- Presets: main window ---------- */

function updatePresetButtons() {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    const on = Number(btn.dataset.preset) === activePreset;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

// Loads preset n into the main window (languages + visible buttons)
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

// Fills the three language selects of the preset editor (names are set in updateUI)
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

// Shows the preset being edited: tabs, language selects and checkboxes
function syncPresetEditor() {
  const p = presets[editPreset - 1];

  document.querySelectorAll(".preset-tab").forEach((tab) => {
    const on = Number(tab.dataset.preset) === editPreset;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-pressed", String(on));
  });

  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    document.getElementById(selectId).value = p[field];
  });

  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const checkbox = document.querySelector(
        `.button-visibility-checkbox[data-section="${section.key}"][data-button="${btn.key}"]`
      );
      if (checkbox) checkbox.checked = p.buttons[section.key][btn.key];
    });
  });
}

// Creates the checkbox groups in the settings modal (texts are set in updateUI)
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

// Localized section titles and button names in the settings modal
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

// Shows/hides the buttons on the main page according to the ACTIVE preset
function applyButtonVisibility() {
  const visibility = getActiveButtons();

  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const visible = visibility[section.key][btn.key];
      document.getElementById(btn.id)?.classList.toggle("is-hidden", !visible);
    });
  });

  // Hide button containers that have no visible buttons left
  document
    .querySelectorAll(".side-buttons, .button-container")
    .forEach((container) => {
      const hasVisible = !!container.querySelector(".icon-btn:not(.is-hidden)");
      container.classList.toggle("is-hidden", !hasVisible);
    });

  // Stop recording if the microphone button was hidden meanwhile
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

function isAnyModalOpen() {
  return !!document.querySelector(".app-modal:not(.hidden)");
}

function initModals() {
  document
    .getElementById("helpAppBtn")
    .addEventListener("click", () => openModal("helpAppModal"));
  document.getElementById("settingsAppBtn").addEventListener("click", () => {
    // The editor starts on the configuration that is currently active
    editPreset = activePreset;
    syncPresetEditor();
    openModal("settingsAppModal");
    updateModalSnap();
  });

  document
    .querySelectorAll(".app-modal-close-btn")
    .forEach((btn) => btn.addEventListener("click", closeAllModals));

  // Click on the dark backdrop closes the modal
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

  // Top row, theme and bottom block
  setTitle("helpAppBtn", t.helpBtnTitle);
  setTitle("settingsAppBtn", t.settingsBtnTitle);
  setTitle("helpAppCloseBtn", t.closeBtnTitle);
  setTitle("settingsAppCloseBtn", t.closeBtnTitle);
  setText("labelThemaMode", t.labelThemaMode);
  setText("labelThema", t.labelThema);
  setText("labelVisibleButtons", t.labelVisibleButtons);
  setText("resetSettingsText", t.defaultSettings);
  setTitle("resetSettingsBtn", t.defaultSettings);

  // Configurations: main-window buttons, modal tabs, modal language labels
  setText("labelPresets", t.presetsLabel);
  setText("labelClearOnMic", t.clearOnMicLabel);
  setText("settingsTitle", t.settingsTitle);
  setText("labelPresetSourceLang", t.sourceLangLabel);
  setText("labelPresetTargetLang1", t.targetLang1Label);
  setText("labelPresetTargetLang2", t.targetLang2Label);
  document.querySelectorAll(".preset-btn, .preset-tab").forEach((el) => {
    const title = `${t.presetBtnTitle} ${el.dataset.preset}`;
    el.title = title;
    el.setAttribute("aria-label", title);
  });

  updateButtonVisibilityTexts(t);

  const modeTexts = {
    contrast: t.themaModeContrast,
    normal: t.themaModeNormal,
    night: t.themaModeNight,
  };
  Array.from(document.getElementById("themaModeSelect").options).forEach(
    (option) => {
      if (modeTexts[option.value]) option.textContent = modeTexts[option.value];
    }
  );

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

  // Web Speech API requires a secure context (HTTPS or localhost)
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
    // Append to existing text (or set if empty) so multiple phrases accumulate
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
      // Silent — user just didn't speak
    } else if (event.error === "aborted") {
      // Silent — user stopped recording
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

function setMicActive(active) {
  const micBtn = document.getElementById("micSource");
  if (!micBtn) return;
  micBtn.classList.toggle("mic-active", active);
  micBtn.textContent = active ? "⏹️" : "🎤";
}

// Empties the source text and both translations
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

  // Update language in case it changed since initialization
  recognition.lang = document.getElementById("sourceLang").value;

  try {
    recognition.start();
    isRecording = true;
    setMicActive(true);
    // Option from the settings: start with an empty text field
    if (document.getElementById("clearOnMic").checked) clearSourceText();
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    alert("Failed to start speech recognition: " + err.message);
  }
}

/* ---------- Scroll steps (CSS scroll-snap) ----------
   The steps themselves are in styles.css. A step can only be reached if there
   is enough content below it, so an empty spacer is added at the bottom of each
   scrolling window, as small as possible. */

// Position of an element inside the scrolling content of `container`
function contentTop(container, el) {
  return (
    el.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  );
}

// Scroll offset of a step: element top minus scroll-padding / scroll-margin
function snapOffset(container, el) {
  return (
    (parseFloat(getComputedStyle(container).scrollPaddingTop) || 0) +
    (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
  );
}

// Makes the spacer just tall enough that the step of `lastSnapEl` is reachable
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

  // On small screens the content below the last step may not fit: then the
  // bottom of the content gets its own step, otherwise it could not be reached.
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
  if (!body || !body.clientHeight) return; // modal is closed
  const blocks = document.getElementById("settingsAppContent");
  fitSnapSpacer(
    body,
    document.getElementById("settingsSnapSpacer"),
    blocks && blocks.lastElementChild
  );
  updateScrollHints();
}

// Triangles in the settings window: where can the body still scroll?
function updateScrollHints() {
  const body = document.getElementById("settingsBody");
  if (!body || !body.clientHeight) return; // modal is closed
  const canUp = body.scrollTop > 2;
  const canDown = body.scrollTop + body.clientHeight < body.scrollHeight - 2;
  // Keeps the right triangle clear of a classic (non-overlay) scrollbar
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

function updateSnap() {
  updateMainSnap();
  updateModalSnap();
}

function initSnap() {
  updateSnap();
  document
    .getElementById("settingsBody")
    ?.addEventListener("scroll", updateScrollHints, { passive: true });
  window.addEventListener("resize", updateSnap);
  window.addEventListener("orientationchange", updateSnap);
  window.addEventListener("load", updateSnap);
  // Content height changes (hidden buttons, language, modal opened, ...)
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
  // getComputedStyle: the panel is hidden by CSS, so inline style.display is
  // empty until the script sets it
  return (
    getComputedStyle(document.getElementById("developer")).display !== "none"
  );
}

// sourceLang / targetLang1 / targetLang2 are the LIVE values of the main
// window; the saved configurations are stored separately in `presets`.
function saveSettings() {
  const settings = {
    uiLangSelect: document.getElementById("uiLangSelect").value,
    serviceSelect: document.getElementById("serviceSelect").value,
    sourceLang: document.getElementById("sourceLang").value,
    targetLang1: document.getElementById("targetLang1").value,
    targetLang2: document.getElementById("targetLang2").value,
    autoTranslate: document.getElementById("autoTranslate").checked,
    clearOnMic: document.getElementById("clearOnMic").checked,
    developerMode: isDeveloperPanelVisible(),
    thema: getThemaFromSelects(),
    presets,
    activePreset,
  };
  localStorage.setItem("translatorSettings", JSON.stringify(settings));
}

// Puts a full settings object into the page (used by load and by reset)
function applyState(settings) {
  const $ = (id) => document.getElementById(id);

  $("uiLangSelect").value = settings.uiLangSelect || "en";
  $("serviceSelect").value = settings.serviceSelect || "mymemory";

  if (Array.isArray(settings.presets)) {
    presets = normalizePresets(settings.presets);
  } else {
    // Older saved settings: their languages and buttons become configuration 1
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
  activePreset = clampPreset(settings.activePreset);
  editPreset = activePreset;

  const active = presets[activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    $(field).value = pickLang(settings[field], active[field]);
  });

  $("autoTranslate").checked = settings.autoTranslate ?? true;
  autoTranslateChecked = $("autoTranslate").checked;
  $("clearOnMic").checked = settings.clearOnMic === true;
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

// Defaults + (optional) values from config.json. Without a `presets` array in
// config.json, its sourceLang / targetLang1 / targetLang2 go into configuration 1.
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

  settings.activePreset = clampPreset(ext.activePreset);
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

  // Theme: palette and mode both recompose the full theme key
  ["themaSelect", "themaModeSelect"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      applyThema(getThemaFromSelects());
      saveSettings();
    });
  });

  // Main window: preset buttons load the saved configuration
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => setActivePreset(btn.dataset.preset));
  });

  // Settings modal: tabs choose which configuration is edited
  document.querySelectorAll(".preset-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      editPreset = clampPreset(tab.dataset.preset);
      syncPresetEditor();
    });
  });

  // Settings modal: languages of the edited configuration
  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    document.getElementById(selectId).addEventListener("change", (e) => {
      presets[editPreset - 1][field] = e.target.value;
      if (editPreset === activePreset) {
        // The active configuration is applied right away to the main window
        // (the main select has the same id as the preset field)
        document.getElementById(field).value = e.target.value;
        if (autoTranslateChecked) translateText();
      }
      saveSettings();
    });
  });

  // Settings modal: button visibility of the edited configuration
  document
    .getElementById("buttonVisibilityGroups")
    .addEventListener("change", (e) => {
      const cb = e.target;
      if (!cb.classList || !cb.classList.contains("button-visibility-checkbox"))
        return;
      const { section, button } = cb.dataset;
      const buttons = presets[editPreset - 1].buttons;
      if (buttons[section] && button in buttons[section]) {
        buttons[section][button] = cb.checked;
        if (editPreset === activePreset) applyButtonVisibility();
        saveSettings();
      }
    });

  document.getElementById("serviceSelect").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  // Main-window language selects only change the live state, never a preset
  ["sourceLang", "targetLang1", "targetLang2"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
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

  // Clear source text button
  document.getElementById("clearSource").addEventListener("click", () => {
    // Stop the microphone first, so no late result is added after clearing
    if (isRecording && recognition) recognition.abort();
    clearSourceText();
  });

  // Copy buttons with selection or full text
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

  // Paste button
  document.getElementById("pasteSource").addEventListener("click", () => {
    pasteFromClipboard(document.getElementById("sourceText"));
  });

  // Speak buttons
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

  // Mic button - speech recognition
  document.getElementById("micSource").addEventListener("click", () => {
    startSpeechRecognition();
  });

  // Reset settings button
  document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    resetSettings();
  });

  initSnap();

  // Initial translation if needed
  if (autoTranslateChecked) translateText();
});
