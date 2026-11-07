// Clipboard: copy (the selected part, or everything) and paste.
// showAlert(key) shows a message of the interface language (see ui-labels.js).
export function copyToClipboard(text, showAlert) {
  if (!navigator.clipboard) {
    showAlert("clipboardUnsupported");
    return;
  }
  navigator.clipboard.writeText(text).catch(() => showAlert("clipboardCopyFailed"));
}

// Copies the selected part of a textarea, or the whole text if nothing is selected
export function copyTextOf(textarea, showAlert) {
  const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  copyToClipboard(selected.length > 0 ? selected : textarea.value, showAlert);
}

// Inserts the clipboard text at the cursor (replaces the selected text)
export function pasteFromClipboard(textarea, showAlert) {
  if (!navigator.clipboard) {
    showAlert("clipboardUnsupported");
    return;
  }
  navigator.clipboard
    .readText()
    .then((clipText) => {
      textarea.setRangeText(clipText, textarea.selectionStart, textarea.selectionEnd, "end");
      textarea.dispatchEvent(new Event("input"));
    })
    .catch(() => showAlert("clipboardPasteFailed"));
}
