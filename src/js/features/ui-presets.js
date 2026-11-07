// Configurations (presets): the buttons of the main screen and the editors in the settings window.
import { PRESET_LANG_FIELDS } from "../core/config.js";
import { EventTypes } from "../core/event-types.js";
import { clampPreset } from "../core/presets.js";

export function createUiPresets(ctx, buttons) {
  const { bus, elements: E, view, langLoader } = ctx;

  const clamp = (n) => clampPreset(n, view.presetCount);
  const saveFromUI = () => bus.emit(EventTypes.SETTINGS_APPLY_TO_UI, { saveFromUI: true });

  // Buttons and tabs show source language codes. The active main-screen button
  // shows the language currently selected there, the others show the saved one.
  function updateButtons() {
    const liveSource = E.sourceLang?.value;
    const codeOf = (n, live) => String((live && liveSource) || view.presets[n - 1]?.sourceLang || "").toUpperCase();

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      const n = Number(btn.dataset.preset);
      const on = n === view.activePreset;
      btn.textContent = codeOf(n, on);
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });

    document.querySelectorAll(".preset-tab").forEach((tab) => {
      const n = Number(tab.dataset.preset);
      const editing = tab.dataset.group === "btn" ? view.editBtnPreset : view.editLangPreset;
      tab.textContent = codeOf(n, false);
      tab.classList.toggle("active", n === editing);
      tab.setAttribute("aria-pressed", String(n === editing));
    });
  }

  function updateTitles(t) {
    const texts = t || langLoader.getTexts(E.uiLangSelect?.value || "en");
    document.querySelectorAll(".preset-btn, .preset-tab").forEach((el) => {
      const title = `${texts.presetBtnTitle} ${el.dataset.preset}`;
      el.title = title;
      el.setAttribute("aria-label", title);
    });
  }

  // Checkboxes and selects show the configuration being edited
  function syncLangEditor() {
    const p = view.presets[view.editLangPreset - 1];
    Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
      E[selectId].value = p[field];
    });
  }

  function syncEditor() {
    syncLangEditor();
    buttons.syncEditor();
    updateButtons();
  }

  function setEditPreset(n) {
    view.editLangPreset = clamp(n);
    view.editBtnPreset = view.editLangPreset;
    syncLangEditor();
    buttons.syncEditor();
    updateButtons();
  }

  // The configuration applied on the main screen
  function setActivePreset(n) {
    view.activePreset = clamp(n);
    const p = view.presets[view.activePreset - 1];
    Object.values(PRESET_LANG_FIELDS).forEach((field) => {
      E[field].value = p[field];
    });
    buttons.applyVisibility();
    updateButtons();
    saveFromUI();
    bus.emit(EventTypes.TRANSLATE_IF_AUTO);
  }

  function renderControls() {
    const fill = (container, className, group, onClick) => {
      if (!container) return;

      // Build the complete set outside the visible container.
      const fragment = document.createDocumentFragment();

      for (let n = 1; n <= view.presetCount; n++) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = className;
        el.dataset.preset = String(n);
        if (group) el.dataset.group = group;
        el.addEventListener("click", () => onClick(n));
        fragment.appendChild(el);
      }

      // Replace all buttons in one operation to avoid an intermediate empty row.
      container.replaceChildren(fragment);
    };

    view.editLangPreset = clamp(view.editLangPreset);
    view.editBtnPreset = view.editLangPreset;

    fill(E.presetButtons, "preset-btn", "", setActivePreset);
    fill(E.langPresetTabs, "preset-tab", "lang", setEditPreset);
    fill(E.btnPresetTabs, "preset-tab", "btn", setEditPreset);

    if (E.presetCountSelect) E.presetCountSelect.value = String(view.presetCount);

    updateTitles();
    updateButtons();
  }

  return { updateButtons, updateTitles, syncLangEditor, syncEditor, setEditPreset, setActivePreset, renderControls };
}
