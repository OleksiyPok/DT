// Entry point: creates the modules and connects them.

import { createConfig } from "./core/config.js";
import { createEventBus } from "./core/event-bus.js";
import { createLangLoader } from "./core/i18n.js";
import { createState } from "./core/state.js";
import { Utils } from "./core/utils.js";
import { createApp } from "./features/app.js";
import { createDeveloper } from "./features/developer.js";
import { initMainSnap } from "./features/main-snap.js";
import { initSnap } from "./features/scroll-steps.js";
import { createSpeech } from "./features/speech.js";
import { initTextareaSync } from "./features/textarea-sync.js";
import { createTranslate } from "./features/translate.js";
import { createUI } from "./features/ui.js";

const bus = createEventBus();
const Config = createConfig();
const LangLoader = createLangLoader({ config: Config, utils: Utils });
const State = createState({ bus: bus, config: Config });
const UI = createUI({ bus: bus, store: State, config: Config, langLoader: LangLoader, utils: Utils });
createTranslate({ bus: bus, ui: UI });
createSpeech({ bus: bus, ui: UI });
const Developer = createDeveloper({ bus: bus, ui: UI });
const App = createApp({
  bus: bus,
  config: Config,
  langLoader: LangLoader,
  store: State,
  ui: UI,
  utils: Utils,
  developer: Developer,
});

App.init();
initSnap();
initMainSnap();
initTextareaSync();
