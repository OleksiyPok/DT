// Translation of the source text into both target languages; clearing of the texts.
import { EventTypes } from "../core/event-types.js";
import { translateGoogle, translateLibre, translateMyMemory } from "./translate-services.js";

// Value of <select id="serviceSelect"> -> name and translation function
const SERVICES = {
  mymemory: { name: "MyMemory", translate: translateMyMemory },
  libretranslate: { name: "LibreTranslate", translate: translateLibre },
  google: { name: "Google", translate: translateGoogle },
};

export function createTranslate({ bus, ui }) {
  const E = ui.elements;

  // Number of the last request. An answer to an older request is ignored,
  // so a slow old answer cannot replace a newer translation.
  let lastRequest = 0;

  function setLoadingState(isLoading) {
    E.manualTranslateBtn.disabled = isLoading;
    E.manualTranslateBtn.textContent = isLoading ? "..." : ui.getTexts().translateBtnLabel;
  }

  // Empties the translations and drops the request that is still running
  function clearTranslations() {
    lastRequest++;
    setLoadingState(false);
    E.translatedText1.value = "";
    E.translatedText2.value = "";
  }

  function clearSourceText() {
    E.sourceText.value = "";
    clearTranslations();
    bus.emit(EventTypes.SETTINGS_APPLY_TO_UI, { saveFromUI: true });
  }

  async function translateText() {
    const text = E.sourceText.value.trim();
    if (!text) {
      clearTranslations();
      return;
    }

    const service = SERVICES[E.serviceSelect.value];
    if (!service) return;
    const src = E.sourceLang.value;
    const t1 = E.targetLang1.value;
    const t2 = E.targetLang2.value;
    const request = ++lastRequest;

    setLoadingState(true);
    E.translatedText1.value = "...";
    E.translatedText2.value = "...";

    try {
      const [result1, result2] = await Promise.all([service.translate(text, src, t1), service.translate(text, src, t2)]);
      if (request !== lastRequest) return;
      E.translatedText1.value = result1;
      E.translatedText2.value = result2;
    } catch (err) {
      console.error("Translation failed:", err);
      if (request !== lastRequest) return;
      const message = `${ui.getTexts().translationError} (${service.name})`;
      E.translatedText1.value = message;
      E.translatedText2.value = message;
    } finally {
      if (request === lastRequest) setLoadingState(false);
    }
  }

  // The checkbox "Auto-translate" is the only place where this setting lives
  function translateIfAuto() {
    if (E.autoTranslate.checked) translateText();
  }

  bus.on(EventTypes.TRANSLATE_RUN, translateText);
  bus.on(EventTypes.TRANSLATE_IF_AUTO, translateIfAuto);
  bus.on(EventTypes.TRANSLATE_CLEAR, clearTranslations);
  bus.on(EventTypes.SOURCE_CLEAR, clearSourceText);

  return { translateText, translateIfAuto, clearTranslations, clearSourceText };
}
