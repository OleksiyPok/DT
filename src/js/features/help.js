// Content of the help window: docs/help/help.<lang>.html (English is the fallback).
import { PATHS } from "../core/config.js";
import { $ } from "../core/dom.js";

const helpCache = {}; // loaded pages by language

async function fetchHelpHtml(lang) {
  if (helpCache[lang]) return helpCache[lang];
  const response = await fetch(`${PATHS.HELP_DIR}help.${lang}.html`, {
    cache: "no-cache",
  });
  if (!response.ok) throw new Error(`help.${lang}.html: ${response.status}`);
  helpCache[lang] = await response.text();
  return helpCache[lang];
}

export async function loadHelp() {
  const target = $("helpAppContent");
  if (!target) return;
  const lang = $("uiLangSelect").value;
  let html = "";
  try {
    html = await fetchHelpHtml(lang);
  } catch {
    try {
      html = await fetchHelpHtml("en");
    } catch {
      html = "";
    }
  }
  if (!html) {
    target.textContent = "Help is not available.";
    return;
  }
  target.innerHTML = html;
  target.querySelectorAll(".help-shot img").forEach((img) => {
    const markMissing = () =>
      img.closest(".help-shot")?.classList.add("missing");
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0) markMissing();
  });
}
