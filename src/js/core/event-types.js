// Names of the events of the event bus
export const EventTypes = Object.freeze({
  APP_INIT: "app:init",
  APP_CLOSED: "app:closed",

  CONFIG_LOADED: "app:config:loaded",

  SETTINGS_SAVE: "settings:save",
  SETTINGS_RESET: "settings:resetToDefaults",
  SETTINGS_APPLY_TO_UI: "settings:applyToUI",

  UI_TRANSLATE: "ui:translate",
  UI_HELP_MODAL_OPEN: "ui:helpModal:open",
  UI_HELP_MODAL_CLOSE: "ui:helpModal:close",
  UI_SETTINGS_MODAL_OPEN: "ui:settingsModal:open",
  UI_SETTINGS_MODAL_CLOSE: "ui:settingsModal:close",

  TRANSLATE_RUN: "translate:run",
  TRANSLATE_IF_AUTO: "translate:ifAuto",
  TRANSLATE_CLEAR: "translate:clear",
  SOURCE_CLEAR: "source:clear",

  SPEECH_SPEAK: "speech:speak",
  MIC_TOGGLE: "speech:micToggle",
  MIC_ABORT: "speech:micAbort",
});
