// Translation services. Each function returns the translated text,
// or an error message (never throws), so one failed request does not stop the other.
import { GOOGLE_API_KEY } from "../core/config.js";

export async function translateMyMemory(q, source, target) {
  const langpair = source + "|" + target;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        q
      )}&langpair=${langpair}`
    );
    const data = await res.json();
    if (data?.responseData?.translatedText)
      return data.responseData.translatedText;
    throw new Error("Translation error (MyMemory)");
  } catch (err) {
    return "Translation error (MyMemory).";
  }
}

export async function translateLibre(q, source, target) {
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source, target, format: "text" }),
    });
    const data = await res.json();
    if (data?.translatedText) return data.translatedText;
    throw new Error("Translation error (LibreTranslate)");
  } catch {
    return "Translation error (LibreTranslate).";
  }
}

export async function translateGoogle(q, source, target) {
  try {
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
    if (data?.data?.translations?.[0]?.translatedText)
      return data.data.translations[0].translatedText;
    throw new Error("Translation error (Google)");
  } catch {
    return "Translation error (Google).";
  }
}
