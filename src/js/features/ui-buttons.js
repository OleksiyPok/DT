// Visibility of the buttons (per configuration) and the extra buttons under the translations.
import { BUTTON_SECTIONS } from "../core/config.js";
import { EventTypes } from "../core/event-types.js";
import { updateMainSnap } from "./main-snap.js";

export function createUiButtons(ctx) {
  const { bus, elements: E, view } = ctx;

  const getActiveButtons = () => view.presets[view.activePreset - 1].buttons;

  // The extra buttons under the translations depend only on their own checkbox,
  // not on the "visible buttons" of the configurations.
  const bottomButtonsOn = () => E.bottomButtons?.checked !== false;

  // Checkboxes of the "Visible buttons" block of the settings window
  function renderOptions() {
    const container = E.buttonVisibilityGroups;
    if (!container) return;
    container.replaceChildren();

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

        label.append(checkbox, text);
        list.appendChild(label);
      });

      group.appendChild(list);
      container.appendChild(group);
    });
  }

  function updateTexts(t) {
    BUTTON_SECTIONS.forEach((section) => {
      const title = document.querySelector(`.button-visibility-title[data-section-title="${section.key}"]`);
      if (title) title.textContent = t[section.labelKey] || "";

      section.buttons.forEach((btn) => {
        const text = document.querySelector(`.button-visibility-text[data-section="${section.key}"][data-button="${btn.key}"]`);
        if (text) text.textContent = t[btn.textKey] || "";
      });
    });
  }

  // Checkboxes show the buttons of the configuration being edited
  function syncEditor() {
    const p = view.presets[view.editBtnPreset - 1];
    BUTTON_SECTIONS.forEach((section) => {
      section.buttons.forEach((btn) => {
        const checkbox = document.querySelector(`.button-visibility-checkbox[data-section="${section.key}"][data-button="${btn.key}"]`);
        if (checkbox) checkbox.checked = p.buttons[section.key][btn.key];
      });
    });
  }

  function applyBottomButtons() {
    E.bottomActions?.classList.toggle("is-hidden", !bottomButtonsOn());
    updateMainSnap();
  }

  function applyVisibility() {
    const visibility = getActiveButtons();

    BUTTON_SECTIONS.forEach((section) => {
      section.buttons.forEach((btn) => {
        E[btn.id]?.classList.toggle("is-hidden", !visibility[section.key][btn.key]);
      });
    });

    document.querySelectorAll(".side-buttons, .button-container").forEach((container) => {
      const hasVisible = !!container.querySelector(".icon-btn:not(.is-hidden)");
      container.classList.toggle("is-hidden", !hasVisible);
    });

    applyBottomButtons();

    // Stop recording only if no microphone button is left on the screen
    if (!visibility.source.mic && !bottomButtonsOn()) bus.emit(EventTypes.MIC_ABORT);
  }

  return { renderOptions, updateTexts, syncEditor, applyVisibility, applyBottomButtons };
}
