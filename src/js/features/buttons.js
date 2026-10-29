// Visibility of the buttons (per configuration) and the extra buttons under the translations.
import { BUTTON_SECTIONS, buildDefaultButtons } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { updateMainSnap } from "./scroll-steps.js";
import { abortRecognition } from "./speech.js";

export function normalizeButtonVisibility(raw) {
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

function getActiveButtons() {
  return state.presets[state.activePreset - 1].buttons;
}

// Checkboxes of the "Visible buttons" block of the settings window
export function renderButtonVisibilityOptions() {
  const container = $("buttonVisibilityGroups");
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

export function updateButtonVisibilityTexts(t) {
  BUTTON_SECTIONS.forEach((section) => {
    const title = document.querySelector(
      `.button-visibility-title[data-section-title="${section.key}"]`
    );
    if (title) title.textContent = t[section.labelKey] || "";

    section.buttons.forEach((btn) => {
      const text = document.querySelector(
        `.button-visibility-text[data-section="${section.key}"][data-button="${btn.key}"]`
      );
      if (text) text.textContent = t[btn.textKey] || "";
    });
  });
}

// Checkboxes show the buttons of the configuration being edited
export function syncBtnEditor() {
  const p = state.presets[state.editBtnPreset - 1];
  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const checkbox = document.querySelector(
        `.button-visibility-checkbox[data-section="${section.key}"][data-button="${btn.key}"]`
      );
      if (checkbox) checkbox.checked = p.buttons[section.key][btn.key];
    });
  });
}

export function applyButtonVisibility() {
  const visibility = getActiveButtons();

  BUTTON_SECTIONS.forEach((section) => {
    section.buttons.forEach((btn) => {
      const visible = visibility[section.key][btn.key];
      $(btn.id)?.classList.toggle("is-hidden", !visible);
    });
  });

  document
    .querySelectorAll(".side-buttons, .button-container")
    .forEach((container) => {
      const hasVisible = !!container.querySelector(".icon-btn:not(.is-hidden)");
      container.classList.toggle("is-hidden", !hasVisible);
    });

  applyBottomButtons();

  // Stop recording only if no microphone button is left on the screen
  if (!visibility.source.mic && !bottomButtonsOn()) abortRecognition();
}

// The extra buttons under the translations depend only on their own checkbox,
// not on the "visible buttons" of the configurations.
function bottomButtonsOn() {
  return $("bottomButtons")?.checked !== false;
}

export function applyBottomButtons() {
  $("bottomActions")?.classList.toggle("is-hidden", !bottomButtonsOn());
  updateMainSnap();
}
