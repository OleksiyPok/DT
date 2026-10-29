// Translate the source text into both target languages; clear the texts.
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";
import { saveSettings } from "../core/storage.js";
import {
  translateGoogle,
  translateLibre,
  translateMyMemory,
} from "./translate-services.js";

// Value of <select id="serviceSelect"> -> translation function
const SERVICES = {
  mymemory: translateMyMemory,
  libretranslate: translateLibre,
  google: translateGoogle,
};

function setLoadingState(isLoading) {
  const translateBtn = $("manualTranslateBtn");
  translateBtn.disabled = isLoading;
  translateBtn.textContent = isLoading ? "..." : getTexts().translateButtonText;
}

export function clearTranslations() {
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

  const translate = SERVICES[$("serviceSelect").value];
  const src = $("sourceLang").value;
  const t1 = $("targetLang1").value;
  const t2 = $("targetLang2").value;

  setLoadingState(true);
  $("translatedText1").value = "...";
  $("translatedText2").value = "...";

  try {
    if (translate) {
      $("translatedText1").value = await translate(text, src, t1);
      $("translatedText2").value = await translate(text, src, t2);
    }
  } catch (err) {
    $("translatedText1").value = "Error";
    $("translatedText2").value = "Error";
    clearTranslations();
    alert("Translation failed: " + err.message);
  } finally {
    setLoadingState(false);
  }
}
