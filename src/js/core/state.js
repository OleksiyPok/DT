// Shared state of the configurations. Imported by the modules that read or change it.
// The real values are set when the settings are applied (features/settings.js).

export const state = {
  presets: [], // saved configurations
  presetCount: 1, // configurations shown (1..PRESET_MAX)
  activePreset: 1, // configuration applied on the main screen
  editLangPreset: 1, // configuration shown in the "Languages" settings block
  editBtnPreset: 1, // configuration shown in the "Visible buttons" settings block
};
