// Configurations (presets): data helpers, main-screen buttons, editors in the settings window.
import {
  DEFAULT_PRESET_COUNT,
  LANG_CODES,
  PRESET_LANG_FIELDS,
  PRESET_MAX,
  buildDefaultPresets,
} from "../core/config.js";
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";
import { state } from "../core/state.js";
import { saveSettings } from "../core/storage.js";
import { applyButtonVisibility, normalizeButtonVisibility, syncBtnEditor } from "./buttons.js";
import { translateText } from "./translate.js";

/* ---------- Data helpers ---------- */

export function clampPreset(value, max = state.presetCount) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 1;
}

export function clampCount(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= PRESET_MAX
    ? n
    : DEFAULT_PRESET_COUNT;
}

export function pickLang(value, fallback) {
  return LANG_CODES.includes(value) ? value : fallback;
}

export function normalizePreset(raw, fallback) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    sourceLang: pickLang(src.sourceLang, fallback.sourceLang),
    targetLang1: pickLang(src.targetLang1, fallback.targetLang1),
    targetLang2: pickLang(src.targetLang2, fallback.targetLang2),
    buttons: normalizeButtonVisibility(src.buttons),
  };
}

export function normalizePresets(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return buildDefaultPresets().map((fallback, i) =>
    normalizePreset(list[i], fallback)
  );
}

/* ---------- Main screen ---------- */

// Buttons and tabs show source language codes. The active main-screen button
// shows the language currently selected there, the others show the saved one.
export function updatePresetButtons() {
  const liveSource = $("sourceLang").value;
  const codeOf = (n, live) =>
    String(
      (live && liveSource) || state.presets[n - 1]?.sourceLang || ""
    ).toUpperCase();

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    const n = Number(btn.dataset.preset);
    const on = n === state.activePreset;
    btn.textContent = codeOf(n, on);
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  document.querySelectorAll(".preset-tab").forEach((tab) => {
    const n = Number(tab.dataset.preset);
    const editing =
      tab.dataset.group === "btn" ? state.editBtnPreset : state.editLangPreset;
    tab.textContent = codeOf(n, false);
    tab.classList.toggle("active", n === editing);
    tab.setAttribute("aria-pressed", String(n === editing));
  });
}

export function updatePresetTitles(t) {
  const texts = t || getTexts();
  document.querySelectorAll(".preset-btn, .preset-tab").forEach((el) => {
    const title = `${texts.presetBtnTitle} ${el.dataset.preset}`;
    el.title = title;
    el.setAttribute("aria-label", title);
  });
}

export function renderPresetControls() {
  const fill = (container, className, group, onClick) => {
    if (!container) return;
    container.replaceChildren();
    for (let n = 1; n <= state.presetCount; n++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = className;
      el.dataset.preset = String(n);
      if (group) el.dataset.group = group;
      el.addEventListener("click", () => onClick(n));
      container.appendChild(el);
    }
  };

  state.editLangPreset = clampPreset(state.editLangPreset);
  state.editBtnPreset = state.editLangPreset;

  fill($("presetButtons"), "preset-btn", "", (n) => setActivePreset(n));
  fill($("langPresetTabs"), "preset-tab", "lang", (n) => setEditPreset(n));
  fill($("btnPresetTabs"), "preset-tab", "btn", (n) => setEditPreset(n));

  const countSelect = $("presetCountSelect");
  if (countSelect) countSelect.value = String(state.presetCount);

  updatePresetTitles();
  updatePresetButtons();
}

export function setActivePreset(n) {
  state.activePreset = clampPreset(n);
  const p = state.presets[state.activePreset - 1];
  Object.values(PRESET_LANG_FIELDS).forEach((field) => {
    $(field).value = p[field];
  });
  applyButtonVisibility();
  updatePresetButtons();
  saveSettings();
  if (state.autoTranslateChecked) translateText();
}

/* ---------- Settings window ---------- */

function setEditPreset(n) {
  state.editLangPreset = clampPreset(n);
  state.editBtnPreset = state.editLangPreset;
  syncLangEditor();
  syncBtnEditor();
  updatePresetButtons();
}

export function renderPresetLanguageOptions() {
  Object.keys(PRESET_LANG_FIELDS).forEach((selectId) => {
    const select = $(selectId);
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

export function syncLangEditor() {
  const p = state.presets[state.editLangPreset - 1];
  Object.entries(PRESET_LANG_FIELDS).forEach(([selectId, field]) => {
    $(selectId).value = p[field];
  });
}

export function syncPresetEditor() {
  syncLangEditor();
  syncBtnEditor();
  updatePresetButtons();
}
