// Clipboard: copy (the selected part, or everything) and paste.

export function copyToClipboard(text) {
  if (!navigator.clipboard) {
    alert("Clipboard API not supported");
    return;
  }
  navigator.clipboard.writeText(text).catch(() => alert("Failed to copy"));
}

// Copies the selected part of a textarea, or the whole text if nothing is selected
export function copyTextOf(textarea) {
  const selected = textarea.value.substring(
    textarea.selectionStart,
    textarea.selectionEnd
  );
  copyToClipboard(selected.length > 0 ? selected : textarea.value);
}

export function pasteFromClipboard(inputElement) {
  if (!navigator.clipboard) {
    alert("Clipboard API not supported");
    return;
  }
  navigator.clipboard.readText().then((clipText) => {
    inputElement.value += clipText;
    inputElement.dispatchEvent(new Event("input"));
  });
}
