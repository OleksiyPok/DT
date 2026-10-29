import { PATHS } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";

const HELP_LANGUAGE_KEY = "DT-help-language";
const APP_LANGUAGE = "app";
const DEFAULT_LANGUAGE = "en";

const HELP_LANGUAGES = [
  { value: "de", code: "DE" },
  { value: "en", code: "EN" },
  { value: "eo", code: "EO" },
  { value: "es", code: "ES" },
  { value: "fr", code: "FR" },
  { value: "it", code: "IT" },
  { value: "nl", code: "NL" },
  { value: "pl", code: "PL" },
  { value: "pt", code: "PT" },
  { value: "ru", code: "RU" },
  { value: "tr", code: "TR" },
  { value: "uk", code: "UK" },
];

const SELECTOR_TEXT = {
  en: { label: "Language", app: "Use app language" },
  uk: { label: "Мова", app: "Як у застосунку" },
  ru: { label: "Язык", app: "Как в приложении" },
  de: { label: "Sprache", app: "Wie in der App" },
  nl: { label: "Taal", app: "Als app-taal" },
  pl: { label: "Język", app: "Jak w aplikacji" },
  pt: { label: "Idioma", app: "Como no app" },
  fr: { label: "Langue", app: "Comme l’application" },
  tr: { label: "Dil", app: "Uygulama dili" },
  it: { label: "Lingua", app: "Come nell’app" },
  es: { label: "Idioma", app: "Como la aplicación" },
  eo: { label: "Lingvo", app: "Kiel en la aplikaĵo" },
};

const helpCache = {};

function isSupportedLanguage(lang) {
  return HELP_LANGUAGES.some((item) => item.value === lang);
}

function getInterfaceLanguage() {
  const lang = $("uiLangSelect")?.value;
  return isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
}

function getSavedHelpLanguage() {
  try {
    const saved = localStorage.getItem(HELP_LANGUAGE_KEY);

    if (saved === APP_LANGUAGE || isSupportedLanguage(saved)) {
      return saved;
    }
  } catch {
    // Continue with the default behavior if storage is unavailable.
  }

  return APP_LANGUAGE;
}

function saveHelpLanguage(lang) {
  try {
    localStorage.setItem(HELP_LANGUAGE_KEY, lang);
  } catch (err) {
    console.warn("Failed to save help language:", err);
  }
}

async function fetchHelpHtml(lang) {
  if (helpCache[lang]) return helpCache[lang];

  const response = await fetch(`${PATHS.HELP_DIR}help.${lang}.html`, {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`help.${lang}.html: ${response.status}`);
  }

  helpCache[lang] = await response.text();
  return helpCache[lang];
}

async function getHelpHtml(lang) {
  try {
    return await fetchHelpHtml(lang);
  } catch {
    if (lang === DEFAULT_LANGUAGE) return "";

    try {
      return await fetchHelpHtml(DEFAULT_LANGUAGE);
    } catch {
      return "";
    }
  }
}

function renderLanguageSelector(target, initialSelection) {
  const interfaceLanguage = getInterfaceLanguage();
  const texts = SELECTOR_TEXT[interfaceLanguage] || SELECTOR_TEXT.en;

  const row = document.createElement("div");
  row.className = "help-language-row";

  const label = document.createElement("span");
  label.className = "help-language-label";
  label.textContent = texts.label;

  const select = document.createElement("select");
  select.id = "helpLanguageSelect";
  select.className = "help-language-select";
  select.setAttribute("aria-label", texts.label);
  select.title = texts.label;

  const appOption = document.createElement("option");
  appOption.value = APP_LANGUAGE;
  appOption.textContent = texts.app;
  select.appendChild(appOption);

  HELP_LANGUAGES.forEach(({ value, code }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = code;
    select.appendChild(option);
  });

  select.value = initialSelection;

  row.append(label, select);

  const page = document.createElement("div");
  page.id = "helpPageContent";

  target.replaceChildren(row, page);

  return { select, page };
}

function markMissingImages(page) {
  page.querySelectorAll(".help-shot img").forEach((img) => {
    const markMissing = () =>
      img.closest(".help-shot")?.classList.add("missing");

    img.addEventListener("error", markMissing);

    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    }
  });
}

export async function loadHelp() {
  const target = $("helpAppContent");
  if (!target) return;

  const initialSelection = getSavedHelpLanguage();
  const { select, page } = renderLanguageSelector(target, initialSelection);

  let requestId = 0;

  async function loadSelectedPage() {
    const currentRequestId = ++requestId;
    const selection = select.value;

    const lang =
      selection === APP_LANGUAGE ? getInterfaceLanguage() : selection;

    const html = await getHelpHtml(lang);

    // Ignore responses from earlier selections.
    if (currentRequestId !== requestId) return;

    if (!html) {
      page.textContent = getTexts().helpUnavailable;
      return;
    }

    page.innerHTML = html;
    markMissingImages(page);
  }

  select.addEventListener("change", () => {
    const selection = select.value;

    if (selection !== APP_LANGUAGE && !isSupportedLanguage(selection)) {
      return;
    }

    saveHelpLanguage(selection);
    loadSelectedPage();
  });

  await loadSelectedPage();
}
