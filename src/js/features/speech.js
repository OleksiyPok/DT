// Speech: reading text aloud (speech synthesis) and voice input (speech recognition).
import { $ } from "../core/dom.js";
import { clearSourceText } from "./translate.js";

let currentUtterance = null; // text being read aloud right now
let recognition = null; // SpeechRecognition instance (created on first use)
let isRecording = false; // microphone is listening

/* ---------- Reading aloud ---------- */

export function speakText(text, langCode = "en") {
  if (!window.speechSynthesis) {
    alert("Speech Synthesis not supported in this browser.");
    return;
  }

  // A second tap stops the reading
  if (speechSynthesis.speaking && currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 1;
  utterance.pitch = 1;

  currentUtterance = utterance;
  utterance.onend = () => {
    currentUtterance = null;
  };
  utterance.onerror = () => {
    currentUtterance = null;
  };

  speechSynthesis.speak(utterance);
}

/* ---------- Voice input ---------- */

function initSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert(
      "Speech recognition is not supported in this browser.\n\n" +
        "Please use Chrome or Edge on Android."
    );
    return null;
  }

  if (!window.isSecureContext) {
    alert(
      "Speech recognition requires a secure connection (HTTPS).\n\n" +
        "Please serve this app over HTTPS or open it via localhost.\n" +
        "On Android, install it as a PWA or use a local server."
    );
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = $("sourceLang").value;

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const source = $("sourceText");
    source.value = source.value.trim()
      ? source.value.trim() + " " + transcript.trim()
      : transcript.trim();
    source.dispatchEvent(new Event("input"));
  };

  rec.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === "not-allowed") {
      alert(
        "Microphone access was denied.\n\n" +
          "Please allow microphone permission in your browser settings " +
          "and ensure the page is served over HTTPS."
      );
    } else if (event.error === "no-speech") {
    } else if (event.error === "aborted") {
    } else {
      alert("Speech recognition error: " + event.error);
    }
  };

  rec.onend = () => {
    isRecording = false;
    setMicActive(false);
  };

  return rec;
}

// The microphone / "stop" icons are swapped by CSS (.mic-active), so only the class changes here
// (on both the button in the source block and the one under the translations)
function setMicActive(active) {
  ["micSource", "micBottom"].forEach((id) => {
    $(id)?.classList.toggle("mic-active", active);
  });
}

// Stops listening (if it is listening)
export function abortRecognition() {
  if (isRecording && recognition) recognition.abort();
}

export function startSpeechRecognition() {
  if (isRecording) {
    if (recognition) recognition.abort();
    return;
  }

  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) return;
  }

  recognition.lang = $("sourceLang").value;

  try {
    recognition.start();
    isRecording = true;
    setMicActive(true);
    if ($("clearOnMic").checked) clearSourceText();
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    alert("Failed to start speech recognition: " + err.message);
  }
}
