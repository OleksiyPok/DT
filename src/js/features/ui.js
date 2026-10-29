// Interface texts: applies the texts of the selected interface language to the page.
import { $ } from "../core/dom.js";
import { getLanguageNames, getTexts } from "../core/i18n.js";
import { updateModeButton } from "../core/theme.js";
import { updateButtonVisibilityTexts } from "./buttons.js";
import { refreshLiveLists } from "./live-select.js";
import { updatePresetTitles } from "./presets.js";

// The "Translate" button is needed only when auto-translate is off
export function updateTranslateButtonVisibility() {
  $("manualTranslateBtn").style.display = $("autoTranslate").checked
    ? "none"
    : "";
}

// Language names in all language selects (main screen and settings)
function updateLangSelectOptions(lang) {
  const nameMap = getLanguageNames(lang);

  [
    "sourceLang",
    "targetLang1",
    "targetLang2",
    "presetSourceLang",
    "presetTargetLang1",
    "presetTargetLang2",
  ].forEach((selectId) => {
    Array.from($(selectId).options).forEach((option) => {
      const name = nameMap[option.value];
      if (name) option.textContent = name;
    });
  });
}

export function updateUI() {
  const lang = $("uiLangSelect").value;
  const t = getTexts(lang);
  document.documentElement.lang = lang;

  const setText = (id, value) => {
    const el = $(id);
    if (el && value) el.textContent = value;
  };
  const setTitle = (id, value) => {
    const el = $(id);
    if (el && value) {
      el.title = value;
      el.setAttribute("aria-label", value);
    }
  };

  $("serviceLabel").textContent = t.serviceLabel;

  const autoLabel =
    $("autoTranslateLabel") || document.querySelector(".auto-translate-label");
  if (autoLabel) {
    autoLabel.textContent = t.autoTranslateLabel;
  }

  updateTranslateButtonVisibility();
  $("uiLangLabel").textContent = t.interfaceLabel;
  document.querySelector(".source-lang-label").textContent = t.sourceLangLabel;
  document.querySelector(".target-lang-1-label").textContent =
    t.targetLang1Label;
  document.querySelector(".target-lang-2-label").textContent =
    t.targetLang2Label;

  $("sourceText").placeholder = t.sourcePlaceholder;
  $("translatedText1").placeholder = t.translation1Placeholder;
  $("translatedText2").placeholder = t.translation2Placeholder;
  $("manualTranslateBtn").textContent = t.translateBtnLabel;

  setTitle("copySource", t.copyBtnTitle);
  setTitle("pasteSource", t.pasteBtnTitle);
  setTitle("micSource", t.micBtnTitle);
  setTitle("copyTarget1", t.copyBtnTitle);
  setTitle("copyTarget2", t.copyBtnTitle);
  setTitle("clearSource", t.clearBtnTitle);
  setTitle("clearBottom", t.clearBtnTitle);
  setTitle("micBottom", t.micBtnTitle);
  setTitle("speakSource", t.speakBtnTitle);
  setTitle("speakTarget1", t.speakBtnTitle);
  setTitle("speakTarget2", t.speakBtnTitle);

  setTitle("helpAppBtn", t.helpBtnTitle);
  setTitle("settingsAppBtn", t.settingsBtnTitle);
  setTitle("helpAppCloseBtn", t.closeBtnTitle);
  setTitle("settingsAppCloseBtn", t.closeBtnTitle);
  setText("labelThemaModeSettings", t.themaModeLabel);
  setText("labelThema", t.themaLabel);
  setText("labelVisibleButtons", t.visibleButtonsLabel);
  setText("resetSettingsText", t.resetSettingsLabel);
  setTitle("resetSettingsBtn", t.resetSettingsLabel);

  setText("labelPresets", t.presetsLabel);
  setText("labelPresetCount", t.presetCountLabel);
  setText("labelPresetLanguages", t.presetLanguagesLabel);
  setText("labelOverwriteLangs", t.overwriteLangsLabel);
  setText("labelBottomButtons", t.bottomButtonsLabel);
  setText("labelClearOnMic", t.clearOnMicLabel);
  setText("settingsTitle", t.settingsTitle);
  setText("helpTitle", t.helpBtnTitle);
  setText("labelPresetSourceLang", t.sourceLangLabel);
  setText("labelPresetTargetLang1", t.targetLang1Label);
  setText("labelPresetTargetLang2", t.targetLang2Label);
  updatePresetTitles(t);

  updateButtonVisibilityTexts(t);

  const modeSelect = $("themaModeSelectSettings");
  const modeTexts = {
    contrast: t.themaModeContrast,
    normal: t.themaModeNormal,
    evening: t.themaModeEvening,
    night: t.themaModeNight,
  };
  Array.from(modeSelect.options).forEach((option) => {
    if (modeTexts[option.value]) option.textContent = modeTexts[option.value];
  });
  updateModeButton(modeSelect.value, t);
  refreshLiveLists();

  updateLangSelectOptions(lang);
}
