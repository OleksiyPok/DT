// Texts of the page: applies the texts of the selected interface language.
export function createUiLabels(ctx) {
  const { elements: E, langLoader } = ctx;

  const currentLang = () => E.uiLangSelect?.value || "en";
  const getTexts = (lang = currentLang()) => langLoader.getTexts(lang);

  // Shows a window with a message (key = key in the UI texts); `detail` is added after it
  function showAlert(key, detail = "") {
    alert(getTexts()[key] + detail);
  }

  // The "Translate" button is needed only when auto-translate is off
  function updateTranslateButtonVisibility() {
    if (E.manualTranslateBtn) E.manualTranslateBtn.style.display = E.autoTranslate?.checked ? "none" : "";
  }

  function updateUILabels(lang = currentLang()) {
    const t = getTexts(lang);
    document.documentElement.lang = lang;

    const setText = (el, value) => {
      if (el && value) el.textContent = value;
    };
    const setTitle = (el, value) => {
      if (el && value) {
        el.title = value;
        el.setAttribute("aria-label", value);
      }
    };

    setText(E.serviceLabel, t.serviceLabel);
    setText(E.autoTranslateLabel, t.autoTranslateLabel);
    updateTranslateButtonVisibility();
    setText(E.uiLangLabel, t.interfaceLabel);
    setText(E.sourceLangLabel, t.sourceLangLabel);
    setText(E.targetLang1Label, t.targetLang1Label);
    setText(E.targetLang2Label, t.targetLang2Label);

    if (E.sourceText) E.sourceText.placeholder = t.sourcePlaceholder;
    if (E.translatedText1) E.translatedText1.placeholder = t.translation1Placeholder;
    if (E.translatedText2) E.translatedText2.placeholder = t.translation2Placeholder;
    // While a translation is running the button shows "..." (see translate.js)
    if (E.manualTranslateBtn && !E.manualTranslateBtn.disabled) E.manualTranslateBtn.textContent = t.translateBtnLabel;

    setTitle(E.copySource, t.copyBtnTitle);
    setTitle(E.pasteSource, t.pasteBtnTitle);
    setTitle(E.micSource, t.micBtnTitle);
    setTitle(E.copyTarget1, t.copyBtnTitle);
    setTitle(E.copyTarget2, t.copyBtnTitle);
    setTitle(E.clearSource, t.clearBtnTitle);
    setTitle(E.clearBottom, t.clearBtnTitle);
    setTitle(E.micBottom, t.micBtnTitle);
    setTitle(E.speakSource, t.speakBtnTitle);
    setTitle(E.speakTarget1, t.speakBtnTitle);
    setTitle(E.speakTarget2, t.speakBtnTitle);

    setTitle(E.helpAppBtn, t.helpBtnTitle);
    setTitle(E.settingsAppBtn, t.settingsBtnTitle);
    setTitle(E.helpAppCloseBtn, t.closeBtnTitle);
    setTitle(E.settingsAppCloseBtn, t.closeBtnTitle);
    setText(E.labelThemaMode, t.themaModeLabel);
    setText(E.labelThema, t.themaLabel);
    setText(E.labelVisibleButtons, t.visibleButtonsLabel);
    setText(E.resetSettingsText, t.resetSettingsLabel);
    setTitle(E.resetSettingsBtn, t.resetSettingsLabel);

    setText(E.labelPresets, t.presetsLabel);
    setText(E.labelPresetCount, t.presetCountLabel);
    setText(E.labelPresetLanguages, t.presetLanguagesLabel);
    setText(E.labelOverwriteLangs, t.overwriteLangsLabel);
    setText(E.labelBottomButtons, t.bottomButtonsLabel);
    setText(E.labelClearOnMic, t.clearOnMicLabel);
    setText(E.settingsTitle, t.settingsTitle);
    setText(E.helpTitle, t.helpBtnTitle);
    setText(E.labelPresetSourceLang, t.sourceLangLabel);
    setText(E.labelPresetTargetLang1, t.targetLang1Label);
    setText(E.labelPresetTargetLang2, t.targetLang2Label);

    // The theme, the presets, the buttons and the language names follow the texts
    ctx.onLabelsUpdated?.(t, lang);
  }

  return { getTexts, showAlert, updateTranslateButtonVisibility, updateUILabels };
}
