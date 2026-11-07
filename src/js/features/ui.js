// The page: connects the ui-*.js modules, the controls of the settings and the events of the bus.
import { PRESET_LANG_FIELDS } from "../core/config.js";
import { EventTypes } from "../core/event-types.js";
import { clampCount } from "../core/presets.js";
import { copyTextOf, pasteFromClipboard } from "./clipboard.js";
import { createHelp } from "./help.js";
import { closeLiveLists } from "./live-select.js";
import { createModalHistory, createModals } from "./modals.js";
import { updateModalSnap } from "./scroll-steps.js";
import { createTheme } from "./theme.js";
import { createUiButtons } from "./ui-buttons.js";
import { cacheElements, createUiContext } from "./ui-elements.js";
import { createUiLabels } from "./ui-labels.js";
import { createUiMirrors } from "./ui-mirrors.js";
import { createUiPresets } from "./ui-presets.js";
import { createUiSelects } from "./ui-selects.js";

// Delay of auto-translation while the user types (ms)
const AUTO_TRANSLATE_DELAY = 700;

export function createUI({ bus, store, config, langLoader, utils }) {
  const ctx = createUiContext({ bus, store, config, utils, langLoader });
  cacheElements(ctx);
  // The texts changed: the theme, the buttons, the configurations and the language names follow them
  ctx.onLabelsUpdated = (texts, lang) => {
    theme.updateLabels(texts);
    buttons.updateTexts(texts);
    presets.updateTitles(texts);
    selects.updateLangNames(lang);
    mirrors.sync();
  };
  const { elements, view } = ctx;

  const mirrors = createUiMirrors();
  const theme = createTheme(ctx);
  const help = createHelp(ctx);
  const labels = createUiLabels(ctx);
  const selects = createUiSelects(ctx);
  const buttons = createUiButtons(ctx);
  const presets = createUiPresets(ctx, buttons);
  const settingsWindow = createModals({ elements, mirrors });
  theme.renderThemeSelectOptions();
  buttons.renderOptions();
  selects.renderPresetLanguageOptions();

  const modalHistory = createModalHistory({
    isAnyOpen: () => help.isAppHelpModalOpen() || settingsWindow.isSettingsModalOpen(),
    closeAll: () => {
      help.closeHelpModal();
      closeLiveLists();
      settingsWindow.closeSettingsModal();
    },
  });
  const { getTexts, showAlert, updateTranslateButtonVisibility, updateUILabels } = labels;

  const saveFromUI = () => bus.emit(EventTypes.SETTINGS_APPLY_TO_UI, { saveFromUI: true });

  // The settings go to the page (when the app starts, and after "Reset defaults")
  function applySettingsToUI(s) {
    const E = elements;
    E.uiLangSelect.value = s.uiLang;
    E.serviceSelect.value = s.service;

    view.presets = s.presets;
    view.presetCount = s.presetCount;
    view.activePreset = s.activePreset;
    view.editLangPreset = view.activePreset;
    view.editBtnPreset = view.activePreset;

    presets.renderControls();

    Object.values(PRESET_LANG_FIELDS).forEach((field) => {
      E[field].value = s[field];
    });

    E.autoTranslate.checked = s.autoTranslate;
    E.clearOnMic.checked = s.clearOnMic;
    E.bottomButtons.checked = s.bottomButtons;
    E.overwriteLangs.checked = s.overwriteLangs;

    theme.applyThemeFromSettings({ thema: s.thema });

    buttons.applyVisibility();
    presets.updateButtons();
    presets.syncEditor();
    updateUILabels(s.uiLang);
  }

  // The settings from the page
  function readSettingsFromUI() {
    const E = elements;
    return {
      uiLang: E.uiLangSelect.value,
      thema: theme.getThemaFromSelects() || store.getSettings().thema,
      service: E.serviceSelect.value,
      sourceLang: E.sourceLang.value,
      targetLang1: E.targetLang1.value,
      targetLang2: E.targetLang2.value,
      autoTranslate: E.autoTranslate.checked,
      clearOnMic: E.clearOnMic.checked,
      bottomButtons: E.bottomButtons.checked,
      overwriteLangs: E.overwriteLangs.checked,
      presetCount: view.presetCount,
      activePreset: view.activePreset,
      presets: view.presets,
    };
  }

  // The developer rows: shown when developerMode is on
  function setDeveloperVisibility(appCfg) {
    const display = appCfg?.developerMode ? "flex" : "none";
    if (elements.serviceRow) elements.serviceRow.style.display = display;
    if (elements.developerPanel) elements.developerPanel.style.display = display;
  }

  /* ---------- Handlers ---------- */

  function bindAppearance() {
    const E = elements;
    E.uiLangSelect.addEventListener("change", () => {
      bus.emit(EventTypes.UI_TRANSLATE, { lang: E.uiLangSelect.value });
      saveFromUI();
      if (help.isAppHelpModalOpen()) help.loadHelpContent();
    });
    const onThemaChange = () => {
      theme.applyThemeFromSelects();
      saveFromUI();
    };
    E.themaSelect.addEventListener("change", onThemaChange);
    E.themaModeSelect.addEventListener("change", onThemaChange);
    E.themaModeBtn.addEventListener("click", () => {
      theme.nextThemaMode();
      onThemaChange();
    });
  }

  function bindPresets() {
    const E = elements;

    E.presetCountSelect.addEventListener("change", (e) => {
      view.presetCount = clampCount(e.target.value);
      presets.renderControls();
      if (view.activePreset > view.presetCount) presets.setActivePreset(view.presetCount);
      presets.syncEditor();
      saveFromUI();
    });

    Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
      E[selectId].addEventListener("change", (e) => {
        view.presets[view.editLangPreset - 1][field] = e.target.value;
        if (view.editLangPreset === view.activePreset) {
          E[field].value = e.target.value;
          bus.emit(EventTypes.TRANSLATE_IF_AUTO);
        }
        presets.updateButtons();
        saveFromUI();
      });
    });

    E.overwriteLangs.addEventListener("change", saveFromUI);

    E.buttonVisibilityGroups.addEventListener("change", (e) => {
      const cb = e.target;
      if (!cb.classList || !cb.classList.contains("button-visibility-checkbox")) return;
      const { section, button } = cb.dataset;
      const list = view.presets[view.editBtnPreset - 1].buttons;
      if (list[section] && button in list[section]) {
        list[section][button] = cb.checked;
        if (view.editBtnPreset === view.activePreset) buttons.applyVisibility();
        saveFromUI();
      }
    });

    E.clearOnMic.addEventListener("change", saveFromUI);

    E.bottomButtons.addEventListener("change", () => {
      buttons.applyBottomButtons();
      saveFromUI();
    });

    E.resetSettingsBtn.addEventListener("click", () => bus.emit(EventTypes.SETTINGS_RESET));
  }

  function bindTranslation() {
    const E = elements;
    let debounceTimer;

    E.serviceSelect.addEventListener("change", () => {
      saveFromUI();
      bus.emit(EventTypes.TRANSLATE_IF_AUTO);
    });

    ["sourceLang", "targetLang1", "targetLang2"].forEach((id) => {
      E[id].addEventListener("change", (e) => {
        const p = view.presets[view.activePreset - 1];
        if (E.overwriteLangs.checked) {
          p[id] = e.target.value;
          if (view.editLangPreset === view.activePreset) presets.syncLangEditor();
        }
        presets.updateButtons();
        saveFromUI();
        bus.emit(EventTypes.TRANSLATE_IF_AUTO);
      });
    });

    E.autoTranslate.addEventListener("change", () => {
      updateTranslateButtonVisibility();
      saveFromUI();
      bus.emit(EventTypes.TRANSLATE_IF_AUTO);
    });

    E.sourceText.addEventListener("input", () => {
      if (E.autoTranslate.checked) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => bus.emit(EventTypes.TRANSLATE_RUN), AUTO_TRANSLATE_DELAY);
      }
      saveFromUI();
    });

    E.manualTranslateBtn.addEventListener("click", () => bus.emit(EventTypes.TRANSLATE_RUN));
  }

  function bindTextButtons() {
    const E = elements;

    [E.clearSource, E.clearBottom].forEach((button) => {
      button.addEventListener("click", () => {
        bus.emit(EventTypes.MIC_ABORT);
        bus.emit(EventTypes.SOURCE_CLEAR);
      });
    });

    E.copySource.addEventListener("click", () => copyTextOf(E.sourceText, showAlert));
    E.copyTarget1.addEventListener("click", () => copyTextOf(E.translatedText1, showAlert));
    E.copyTarget2.addEventListener("click", () => copyTextOf(E.translatedText2, showAlert));
    E.pasteSource.addEventListener("click", () => pasteFromClipboard(E.sourceText, showAlert));

    [
      [E.speakSource, E.sourceText, E.sourceLang],
      [E.speakTarget1, E.translatedText1, E.targetLang1],
      [E.speakTarget2, E.translatedText2, E.targetLang2],
    ].forEach(([button, field, langSelect]) => {
      button.addEventListener("click", () => {
        const text = field.value;
        if (text.trim()) bus.emit(EventTypes.SPEECH_SPEAK, { text, lang: langSelect.value });
      });
    });

    [E.micSource, E.micBottom].forEach((button) => button.addEventListener("click", () => bus.emit(EventTypes.MIC_TOGGLE)));
  }

  function bindWindows() {
    const E = elements;
    mirrors.attach();
    E.helpAppBtn.addEventListener("click", () => bus.emit(EventTypes.UI_HELP_MODAL_OPEN));
    E.helpAppCloseBtn.addEventListener("click", () => bus.emit(EventTypes.UI_HELP_MODAL_CLOSE));
    E.settingsAppBtn.addEventListener("click", () => bus.emit(EventTypes.UI_SETTINGS_MODAL_OPEN));
    E.settingsAppCloseBtn.addEventListener("click", () => bus.emit(EventTypes.UI_SETTINGS_MODAL_CLOSE));
    E.helpAppModal.addEventListener("click", (e) => {
      if (e.target === E.helpAppModal) bus.emit(EventTypes.UI_HELP_MODAL_CLOSE);
    });
    E.settingsAppModal.addEventListener("click", (e) => {
      if (e.target === E.settingsAppModal) bus.emit(EventTypes.UI_SETTINGS_MODAL_CLOSE);
    });
  }

  function bindEventSubscriptions() {
    bus.on(EventTypes.UI_HELP_MODAL_OPEN, () => {
      help.loadHelpContent();
      help.openHelpModal();
      modalHistory.opened();
    });
    bus.on(EventTypes.UI_HELP_MODAL_CLOSE, () => {
      help.closeHelpModal();
      modalHistory.closed();
    });
    bus.on(EventTypes.UI_SETTINGS_MODAL_OPEN, () => {
      view.editLangPreset = view.activePreset;
      view.editBtnPreset = view.activePreset;
      presets.syncEditor();
      settingsWindow.openSettingsModal();
      updateModalSnap();
      modalHistory.opened();
    });
    bus.on(EventTypes.UI_SETTINGS_MODAL_CLOSE, () => {
      closeLiveLists();
      settingsWindow.closeSettingsModal();
      modalHistory.closed();
    });
  }

  function init() {
    bindAppearance();
    bindPresets();
    bindTranslation();
    bindTextButtons();
    bindWindows();
    bindEventSubscriptions();
  }

  return {
    elements,
    getTexts,
    showAlert,
    updateUILabels,
    applySettingsToUI,
    readSettingsFromUI,
    setDeveloperVisibility,
    isAppHelpModalOpen: help.isAppHelpModalOpen,
    isSettingsModalOpen: settingsWindow.isSettingsModalOpen,
    init,
  };
}
