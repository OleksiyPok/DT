const googleApiKey = "YOUR_GOOGLE_API_KEY"; // Google API key

const PATHS = {
  CONFIG: "script/config.json",
};

const DEFAULT_SETTINGS = {
  uiLangSelect: "en",
  sourceLang: "nl",
  targetLang1: "en",
  targetLang2: "uk",
  serviceSelect: "mymemory",
  autoTranslate: true,
  developerMode: false,
  thema: "theme-yellowblue-normal",
};

const themeRegistry = window.DTThemeRegistry || null;
const THEME_FALLBACK = themeRegistry?.defaultTheme || DEFAULT_SETTINGS.thema;

let autoTranslateChecked = true;
let debounceTimer;
let currentUtterance = null;
let recognition = null;
let isRecording = false;

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
  document
    .getElementById("settingsAppBtn")
    .addEventListener("click", () => openModal("settingsAppModal"));

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

  // Top row, theme and bottom block
  setTitle("helpAppBtn", t.helpBtnTitle);
  setTitle("settingsAppBtn", t.settingsBtnTitle);
  setTitle("helpAppCloseBtn", t.closeBtnTitle);
  setTitle("settingsAppCloseBtn", t.closeBtnTitle);
  setText("labelThemaMode", t.labelThemaMode);
  setText("labelThema", t.labelThema);
  setText("resetSettingsText", t.defaultSettings);
  setTitle("resetSettingsBtn", t.defaultSettings);

  const modeTexts = {
    contrast: t.themaModeContrast,
    normal: t.themaModeNormal,
    evening: t.themaModeEvening,
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

  ["sourceLang", "targetLang1", "targetLang2"].forEach((selectId) => {
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
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    alert("Failed to start speech recognition: " + err.message);
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

function saveSettings() {
  const settings = {
    uiLangSelect: document.getElementById("uiLangSelect").value,
    serviceSelect: document.getElementById("serviceSelect").value,
    sourceLang: document.getElementById("sourceLang").value,
    targetLang1: document.getElementById("targetLang1").value,
    targetLang2: document.getElementById("targetLang2").value,
    autoTranslate: document.getElementById("autoTranslate").checked,
    developerMode: isDeveloperPanelVisible(),
    thema: getThemaFromSelects(),
  };
  localStorage.setItem("translatorSettings", JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem("translatorSettings");
  if (saved) {
    const settings = JSON.parse(saved);
    document.getElementById("uiLangSelect").value =
      settings.uiLangSelect || "en";
    document.getElementById("serviceSelect").value =
      settings.serviceSelect || "mymemory";
    document.getElementById("sourceLang").value = settings.sourceLang || "en";
    document.getElementById("targetLang1").value = settings.targetLang1 || "en";
    document.getElementById("targetLang2").value = settings.targetLang2 || "uk";
    document.getElementById("autoTranslate").checked =
      settings.autoTranslate ?? true;
    autoTranslateChecked = document.getElementById("autoTranslate").checked;
    applyThema(settings.thema || THEME_FALLBACK);
    const devMode = settings.developerMode ?? false;
    document.getElementById("developer").style.display = devMode
      ? "flex"
      : "none";
    document.getElementById("serviceRow").style.display = devMode
      ? "flex"
      : "none";
  } else {
    // Set default settings if nothing saved
    document.getElementById("uiLangSelect").value = "en";
    document.getElementById("serviceSelect").value = "mymemory";
    document.getElementById("sourceLang").value = "nl";
    document.getElementById("targetLang1").value = "en";
    document.getElementById("targetLang2").value = "uk";
    document.getElementById("autoTranslate").checked = true;
    autoTranslateChecked = true;
    applyThema(THEME_FALLBACK);
  }
}

async function resetSettings() {
  try {
    let settings;
    const response = await fetch(PATHS.CONFIG, { cache: "no-cache" });
    if (response.ok) {
      const externalSettings = await response.json();
      settings = { ...DEFAULT_SETTINGS, ...externalSettings };
    } else {
      throw new Error("Config file not found");
    }
    applySettings(settings);
  } catch (error) {
    applySettings(DEFAULT_SETTINGS);
  }
}

function applySettings(settings) {
  document.getElementById("uiLangSelect").value = settings.uiLangSelect || "en";
  document.getElementById("serviceSelect").value =
    settings.serviceSelect || "mymemory";
  document.getElementById("sourceLang").value = settings.sourceLang || "en";
  document.getElementById("targetLang1").value = settings.targetLang1 || "en";
  document.getElementById("targetLang2").value = settings.targetLang2 || "uk";
  document.getElementById("autoTranslate").checked =
    settings.autoTranslate ?? true;
  autoTranslateChecked = document.getElementById("autoTranslate").checked;
  applyThema(settings.thema || THEME_FALLBACK);
  clearTranslations();
  updateUI();
  document.getElementById("serviceRow").style.display = settings.developerMode
    ? "flex"
    : "none";
  document.getElementById("developer").style.display = settings.developerMode
    ? "flex"
    : "none";
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

  document.getElementById("serviceSelect").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  ["sourceLang", "targetLang1", "targetLang2"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      saveSettings();
      if (autoTranslateChecked) translateText();
    });
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
    const source = document.getElementById("sourceText");
    source.value = "";
    clearTranslations();
    saveSettings();
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

  // Initial translation if needed
  if (autoTranslateChecked) translateText();
});
