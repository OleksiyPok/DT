// Translation services. Each function returns the translated text,
// or throws an Error if the service did not give a translation.
import { GOOGLE_API_KEY } from "../core/config.js";
import { recordMyMemoryRequest } from "./mymemory-usage.js";

export async function translateMyMemory(q, source, target) {
  const langpair = source + "|" + target;

  // Count every outgoing request, including requests that fail.
  recordMyMemoryRequest(q);

  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      q
    )}&langpair=${langpair}`
  );

  const data = await res.json();
  const text = data?.responseData?.translatedText;

  // On errors (e.g. the daily limit) MyMemory puts a warning into the text field
  const failed =
    (data?.responseStatus !== undefined &&
      Number(data.responseStatus) !== 200) ||
    /^MYMEMORY WARNING/i.test(text || "");

  if (!text || failed) throw new Error("MyMemory: no translation");

  return text;
}

export async function translateLibre(q, source, target) {
  const res = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q, source, target, format: "text" }),
  });

  const data = await res.json();

  if (!data?.translatedText) {
    throw new Error("LibreTranslate: no translation");
  }

  return data.translatedText;
}

export async function translateGoogle(q, source, target) {
  const body = { q, target, format: "text" };

  if (source !== "auto") body.source = source;

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  const text = data?.data?.translations?.[0]?.translatedText;

  if (!text) throw new Error("Google: no translation");

  return text;
}
