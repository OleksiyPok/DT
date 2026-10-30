// Help window: loads docs/help/help.<lang>.html; the help language is chosen in the window itself.
import { HELP_LANGUAGE_KEY, LANG_CODES, PATHS } from "../core/config.js";
import { $ } from "../core/dom.js";
import { getTexts } from "../core/i18n.js";

const APP_LANGUAGE = "app";
const DEFAULT_LANGUAGE = "en";

const helpCache = {};

function isSupportedLanguage(lang) {
  return LANG_CODES.includes(lang);
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
  const texts = getTexts();

  const row = document.createElement("div");
  row.className = "help-language-row";

  const label = document.createElement("span");
  label.className = "help-language-label";
  label.textContent = texts.helpLanguageLabel;

  const select = document.createElement("select");
  select.id = "helpLanguageSelect";
  select.className = "help-language-select";
  select.setAttribute("aria-label", texts.helpLanguageLabel);
  select.title = texts.helpLanguageLabel;

  const appOption = document.createElement("option");
  appOption.value = APP_LANGUAGE;
  appOption.textContent = texts.helpLanguageApp;
  select.appendChild(appOption);

  LANG_CODES.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code.toUpperCase();
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
    saveHelpLanguage(select.value);
    loadSelectedPage();
  });

  await loadSelectedPage();
}
