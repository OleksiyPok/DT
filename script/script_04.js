const googleApiKey = "YOUR_GOOGLE_API_KEY"; // Google API key

let autoTranslateChecked = true;
let debounceTimer;
let currentUtterance = null;

function updateUI() {
  const lang = document.getElementById("uiLangSelect").value;
  const t = uiTexts[lang] || uiTexts.en;

  document.getElementById("serviceLabel").textContent = t.serviceLabel;

  const autoLabel = document.getElementById("autoTranslateLabel");
  if (autoLabel.childNodes.length > 1) {
    autoLabel.childNodes[1].textContent = " " + t.autoTranslateLabel;
  }

  document.getElementById("autoTranslate").checked = autoTranslateChecked;

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
  document.getElementById("copyTarget1").title = t.copyBtnTitle;
  document.getElementById("copyTarget2").title = t.copyBtnTitle;

  updateLangSelectOptions(lang); // 👈 новый вызов
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

function saveSettings() {
  const settings = {
    uiLangSelect: document.getElementById("uiLangSelect").value,
    serviceSelect: document.getElementById("serviceSelect").value,
    sourceLang: document.getElementById("sourceLang").value,
    targetLang1: document.getElementById("targetLang1").value,
    targetLang2: document.getElementById("targetLang2").value,
    autoTranslate: document.getElementById("autoTranslate").checked,
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
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  updateUI();

  document.getElementById("uiLangSelect").addEventListener("change", () => {
    updateUI();
    saveSettings();
  });

  document.getElementById("serviceSelect").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("sourceLang").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("targetLang1").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("targetLang2").addEventListener("change", () => {
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("autoTranslate").addEventListener("change", (e) => {
    autoTranslateChecked = e.target.checked;
    saveSettings();
    if (autoTranslateChecked) translateText();
  });

  document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    localStorage.removeItem("translatorSettings");
    // выставляем дефолтные значения в DOM
    document.getElementById("uiLangSelect").value = "en";
    document.getElementById("serviceSelect").value = "mymemory";
    document.getElementById("sourceLang").value = "nl";
    document.getElementById("targetLang1").value = "en";
    document.getElementById("targetLang2").value = "uk";
    document.getElementById("autoTranslate").checked = true;
    autoTranslateChecked = true;
    saveSettings();
    updateUI();
  });

  document.getElementById("sourceText").addEventListener("input", () => {
    if (autoTranslateChecked) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => translateText(), 600);
    }
  });

  document
    .getElementById("manualTranslateBtn")
    .addEventListener("click", () => {
      translateText();
    });

  document.getElementById("copySource").addEventListener("click", () => {
    copyToClipboard(document.getElementById("sourceText").value);
  });

  document.getElementById("pasteSource").addEventListener("click", () => {
    pasteFromClipboard(document.getElementById("sourceText"));
  });

  document.getElementById("copyTarget1").addEventListener("click", () => {
    copyToClipboard(document.getElementById("translatedText1").value);
  });

  document.getElementById("copyTarget2").addEventListener("click", () => {
    copyToClipboard(document.getElementById("translatedText2").value);
  });

  document.getElementById("speakSource").addEventListener("click", (e) => {
    const text = document.getElementById("sourceText").value;
    const lang = document.getElementById("sourceLang").value;
    speakText(text, lang, e.currentTarget);
  });

  document.getElementById("speakTarget1").addEventListener("click", (e) => {
    const text = document.getElementById("translatedText1").value;
    const lang = document.getElementById("targetLang1").value;
    speakText(text, lang, e.currentTarget);
  });

  document.getElementById("speakTarget2").addEventListener("click", (e) => {
    const text = document.getElementById("translatedText2").value;
    const lang = document.getElementById("targetLang2").value;
    speakText(text, lang, e.currentTarget);
  });
});
document.querySelectorAll("textarea").forEach((el) => {
  el.addEventListener("contextmenu", (e) => {
    e.stopPropagation();
  });
});

document.getElementById("micSource").addEventListener("click", () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = document.getElementById("sourceLang").value || "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    const sourceTextArea = document.getElementById("sourceText");
    sourceTextArea.value = transcript;
    sourceTextArea.dispatchEvent(new Event("input"));
  };

  recognition.onerror = function (event) {
    alert("Speech recognition error: " + event.error);
  };

  recognition.start();
});
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
