// Translate the source text into both target languages; clear the texts.
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";
import { saveSettings } from "../core/storage.js";
import {
  translateGoogle,
  translateLibre,
  translateMyMemory,
} from "./translate-services.js";

// Value of <select id="serviceSelect"> -> name and translation function
const SERVICES = {
  mymemory: { name: "MyMemory", translate: translateMyMemory },
  libretranslate: { name: "LibreTranslate", translate: translateLibre },
  google: { name: "Google", translate: translateGoogle },
};

// Number of the last request. An answer to an older request is ignored,
// so a slow old answer cannot replace a newer translation.
let lastRequest = 0;

function setLoadingState(isLoading) {
  const translateBtn = $("manualTranslateBtn");
  translateBtn.disabled = isLoading;
  translateBtn.textContent = isLoading ? "..." : getTexts().translateBtnLabel;
}

// Empties the translations and drops the request that is still running
export function clearTranslations() {
  lastRequest++;
  setLoadingState(false);
  $("translatedText1").value = "";
  $("translatedText2").value = "";
}

export function clearSourceText() {
  $("sourceText").value = "";
  clearTranslations();
  saveSettings();
}

export async function translateText() {
  const text = $("sourceText").value.trim();
  if (!text) {
    clearTranslations();
    return;
  }

  const service = SERVICES[$("serviceSelect").value];
  if (!service) return;
  const src = $("sourceLang").value;
  const t1 = $("targetLang1").value;
  const t2 = $("targetLang2").value;
  const request = ++lastRequest;

  setLoadingState(true);
  $("translatedText1").value = "...";
  $("translatedText2").value = "...";

  try {
    const [result1, result2] = await Promise.all([
      service.translate(text, src, t1),
      service.translate(text, src, t2),
    ]);
    if (request !== lastRequest) return;
    $("translatedText1").value = result1;
    $("translatedText2").value = result2;
  } catch (err) {
    console.error("Translation failed:", err);
    if (request !== lastRequest) return;
    const message = `${getTexts().translationError} (${service.name})`;
    $("translatedText1").value = message;
    $("translatedText2").value = message;
  } finally {
    if (request === lastRequest) setLoadingState(false);
  }
}

// The checkbox "Auto-translate" is the only place where this setting lives
export function translateIfAuto() {
  if ($("autoTranslate").checked) translateText();
}
