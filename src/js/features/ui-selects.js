// Language selects: the main screen and the "Languages" block of the settings window.
import { PRESET_LANG_FIELDS } from "../core/config.js";
import { LANG_CODES } from "../core/presets.js";

export function createUiSelects(ctx) {
  const { elements: E, langLoader } = ctx;

  const mainSelects = () => Object.values(PRESET_LANG_FIELDS).map((field) => E[field]);
  const presetSelects = () => Object.keys(PRESET_LANG_FIELDS).map((id) => E[id]);

  // The selects of the configurations get one option for every language
  function renderPresetLanguageOptions() {
    presetSelects().forEach((select) => {
      if (!select) return;
      select.replaceChildren(
        ...LANG_CODES.map((code) => {
          const option = document.createElement("option");
          option.value = code;
          option.textContent = code;
          return option;
        }),
      );
    });
  }

  // Language names in all language selects (main screen and settings)
  function updateLangNames(lang) {
    const names = langLoader.getLanguageNames(lang);
    [...mainSelects(), ...presetSelects()].forEach((select) => {
      if (!select) return;
      Array.from(select.options).forEach((option) => {
        if (names[option.value]) option.textContent = names[option.value];
      });
    });
  }

  return { renderPresetLanguageOptions, updateLangNames };
}
