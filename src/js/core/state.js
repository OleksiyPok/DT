// Shared state of the configurations. Imported by the modules that read or change it.
import { DEFAULT_PRESET_COUNT, buildDefaultPresets } from "./config.js";

export const state = {
  autoTranslateChecked: true, // state of the "Auto-translate" checkbox
  presets: buildDefaultPresets(), // saved configurations
  presetCount: DEFAULT_PRESET_COUNT, // configurations shown (1..PRESET_MAX)
  activePreset: 1, // configuration applied on the main screen
  editLangPreset: 1, // configuration shown in the "Languages" settings block
  editBtnPreset: 1, // configuration shown in the "Visible buttons" settings block
};
