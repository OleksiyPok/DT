// Speech: reading text aloud (speech synthesis) and voice input (speech recognition).
import { EventTypes } from "../core/event-types.js";

export function createSpeech({ bus, ui }) {
  const E = ui.elements;

  let currentUtterance = null; // text being read aloud right now
  let recognition = null; // SpeechRecognition instance (created on first use)
  let isRecording = false; // microphone is listening

  /* ---------- Reading aloud ---------- */

  function speakText(text, langCode = "en") {
    if (!window.speechSynthesis) {
      ui.showAlert("speechSynthUnsupported");
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

  // The microphone / "stop" icons are swapped by CSS (.mic-active), so only the class changes here
  // (on both the button in the source block and the one under the translations)
  function setMicActive(active) {
    [E.micSource, E.micBottom].forEach((button) => button?.classList.toggle("mic-active", active));
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      ui.showAlert("speechRecUnsupported");
      return null;
    }

    if (!window.isSecureContext) {
      ui.showAlert("speechRecNeedsHttps");
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = E.sourceLang.value;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const source = E.sourceText;
      source.value = source.value.trim() ? source.value.trim() + " " + transcript.trim() : transcript.trim();
      source.dispatchEvent(new Event("input"));
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        ui.showAlert("micDenied");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        // Nothing to report: the user said nothing or stopped the recording
      } else {
        ui.showAlert("speechRecError", " " + event.error);
      }
    };

    rec.onend = () => {
      isRecording = false;
      setMicActive(false);
    };

    return rec;
  }

  // Stops listening (if it is listening)
  function abortRecognition() {
    if (isRecording && recognition) recognition.abort();
  }

  function toggleRecognition() {
    if (isRecording) {
      if (recognition) recognition.abort();
      return;
    }

    if (!recognition) {
      recognition = initSpeechRecognition();
      if (!recognition) return;
    }

    recognition.lang = E.sourceLang.value;

    try {
      recognition.start();
      isRecording = true;
      setMicActive(true);
      if (E.clearOnMic.checked) bus.emit(EventTypes.SOURCE_CLEAR);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      ui.showAlert("speechRecError", " " + err.message);
    }
  }

  bus.on(EventTypes.SPEECH_SPEAK, ({ text, lang }) => speakText(text, lang));
  bus.on(EventTypes.MIC_TOGGLE, toggleRecognition);
  bus.on(EventTypes.MIC_ABORT, abortRecognition);

  return { speakText, abortRecognition, toggleRecognition };
}
