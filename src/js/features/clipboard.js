// Clipboard: copy (the selected part, or everything) and paste.
import { showAlert } from "../core/i18n.js";

export function copyToClipboard(text) {
  if (!navigator.clipboard) {
    showAlert("clipboardUnsupported");
    return;
  }
  navigator.clipboard
    .writeText(text)
    .catch(() => showAlert("clipboardCopyFailed"));
}

// Copies the selected part of a textarea, or the whole text if nothing is selected
export function copyTextOf(textarea) {
  const selected = textarea.value.substring(
    textarea.selectionStart,
    textarea.selectionEnd
  );
  copyToClipboard(selected.length > 0 ? selected : textarea.value);
}

// Inserts the clipboard text at the cursor (replaces the selected text)
export function pasteFromClipboard(textarea) {
  if (!navigator.clipboard) {
    showAlert("clipboardUnsupported");
    return;
  }
  navigator.clipboard
    .readText()
    .then((clipText) => {
      textarea.setRangeText(
        clipText,
        textarea.selectionStart,
        textarea.selectionEnd,
        "end"
      );
      textarea.dispatchEvent(new Event("input"));
    })
    .catch(() => showAlert("clipboardPasteFailed"));
}
