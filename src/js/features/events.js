// Event listeners of the main screen and the settings window.
import { PRESET_LANG_FIELDS } from "../core/config.js";
import { $ } from "../core/dom.js";
import { loadTexts } from "../core/i18n.js";
import { state } from "../core/state.js";
import { saveSettings } from "../core/storage.js";
import {
  applyThema,
  getThemaFromSelects,
  nextThemaMode,
} from "../core/theme.js";
import { applyBottomButtons, applyButtonVisibility } from "./buttons.js";
import { copyTextOf, pasteFromClipboard } from "./clipboard.js";
import {
  clampCount,
  renderPresetControls,
  setActivePreset,
  syncLangEditor,
  syncPresetEditor,
  updatePresetButtons,
} from "./presets.js";
import { abortRecognition, speakText, startSpeechRecognition } from "./speech.js";
import { resetSettings } from "./settings.js";
import { clearSourceText, translateText } from "./translate.js";
import { updateTranslateButtonVisibility, updateUI } from "./ui.js";

// Delay of auto-translation while the user types (ms)
const AUTO_TRANSLATE_DELAY = 700;
let debounceTimer;

function translateIfAuto() {
  if (state.autoTranslateChecked) translateText();
}

/* ---------- Appearance and interface language ---------- */

function bindAppearance() {
  $("uiLangSelect").addEventListener("change", async () => {
    await loadTexts($("uiLangSelect").value);
    updateUI();
    saveSettings();
  });

  ["themaSelect", "themaModeSelectSettings"].forEach((id) => {
    $(id).addEventListener("change", () => {
      applyThema(getThemaFromSelects());
      saveSettings();
    });
  });

  $("themaModeBtn").addEventListener("click", () => {
    nextThemaMode();
    saveSettings();
  });
}

/* ---------- Configurations and buttons (settings window) ---------- */

function bindPresets() {
  $("presetCountSelect").addEventListener("change", (e) => {
    state.presetCount = clampCount(e.target.value);
    renderPresetControls();
    if (state.activePreset > state.presetCount)
      setActivePreset(state.presetCount);
    syncPresetEditor();
    saveSettings();
  });

  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    $(selectId).addEventListener("change", (e) => {
      state.presets[state.editLangPreset - 1][field] = e.target.value;
      if (state.editLangPreset === state.activePreset) {
        $(field).value = e.target.value;
        translateIfAuto();
      }
      updatePresetButtons();
      saveSettings();
    });
  });

  $("overwriteLangs").addEventListener("change", saveSettings);

  $("buttonVisibilityGroups").addEventListener("change", (e) => {
    const cb = e.target;
    if (!cb.classList || !cb.classList.contains("button-visibility-checkbox"))
      return;
    const { section, button } = cb.dataset;
    const buttons = state.presets[state.editBtnPreset - 1].buttons;
    if (buttons[section] && button in buttons[section]) {
      buttons[section][button] = cb.checked;
      if (state.editBtnPreset === state.activePreset) applyButtonVisibility();
      saveSettings();
    }
  });

  $("clearOnMic").addEventListener("change", saveSettings);

  $("bottomButtons").addEventListener("change", () => {
    applyBottomButtons();
    saveSettings();
  });

  $("resetSettingsBtn").addEventListener("click", () => {
    resetSettings();
  });
}

/* ---------- Translation ---------- */

function bindTranslation() {
  $("serviceSelect").addEventListener("change", () => {
    saveSettings();
    translateIfAuto();
  });

  ["sourceLang", "targetLang1", "targetLang2"].forEach((id) => {
    $(id).addEventListener("change", (e) => {
      const p = state.presets[state.activePreset - 1];
      if ($("overwriteLangs").checked) {
        p[id] = e.target.value;
        if (state.editLangPreset === state.activePreset) syncLangEditor();
      }
      updatePresetButtons();
      saveSettings();
      translateIfAuto();
    });
  });

  $("autoTranslate").addEventListener("change", (e) => {
    state.autoTranslateChecked = e.target.checked;
    updateTranslateButtonVisibility();
    saveSettings();
    translateIfAuto();
  });

  $("sourceText").addEventListener("input", () => {
    if (state.autoTranslateChecked) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(translateText, AUTO_TRANSLATE_DELAY);
    }
    saveSettings();
  });

  $("manualTranslateBtn").addEventListener("click", () => {
    translateText();
  });
}

/* ---------- Buttons of the text blocks ---------- */

function bindTextButtons() {
  ["clearSource", "clearBottom"].forEach((id) => {
    $(id).addEventListener("click", () => {
      abortRecognition();
      clearSourceText();
    });
  });

  $("copySource").addEventListener("click", () => copyTextOf($("sourceText")));
  $("copyTarget1").addEventListener("click", () =>
    copyTextOf($("translatedText1"))
  );
  $("copyTarget2").addEventListener("click", () =>
    copyTextOf($("translatedText2"))
  );

  $("pasteSource").addEventListener("click", () => {
    pasteFromClipboard($("sourceText"));
  });

  // [button id, text field id, language select id]
  [
    ["speakSource", "sourceText", "sourceLang"],
    ["speakTarget1", "translatedText1", "targetLang1"],
    ["speakTarget2", "translatedText2", "targetLang2"],
  ].forEach(([buttonId, textId, langId]) => {
    $(buttonId).addEventListener("click", () => {
      const text = $(textId).value;
      if (text.trim()) speakText(text, $(langId).value);
    });
  });

  ["micSource", "micBottom"].forEach((id) => {
    $(id).addEventListener("click", startSpeechRecognition);
  });
}

export function initEvents() {
  bindAppearance();
  bindPresets();
  bindTranslation();
  bindTextButtons();
}
