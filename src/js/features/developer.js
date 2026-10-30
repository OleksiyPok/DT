// Developer panel: the "Service" selector and the service buttons at the bottom of the main screen.
// Shown by the developerMode setting, or temporarily by a secret gesture.
import { STORAGE_KEY } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { closeAllModals } from "./modals.js";
import { initMyMemoryUsage } from "./mymemory-usage.js";

const GESTURE_CLICKS = 7;
const GESTURE_WINDOW_MS = 3000;
const TEMPORARY_VISIBLE_MS = 30_000;

let hideTimer = null;

export function showDeveloperPanel(visible) {
  clearTimeout(hideTimer);
  hideTimer = null;

  const display = visible ? "flex" : "none";

  $("serviceRow").style.display = display;
  $("developer").style.display = display;
}

// Shows the panel without changing the saved developerMode setting
function showTemporarily() {
  closeAllModals();
  showDeveloperPanel(true);

  hideTimer = setTimeout(
    () => showDeveloperPanel(state.developerMode),
    TEMPORARY_VISIBLE_MS
  );
}

function bindGesture() {
  let clicks = 0;
  let firstClickAt = 0;

  $("resetSettingsText").addEventListener("click", () => {
    const now = Date.now();

    if (clicks === 0 || now - firstClickAt > GESTURE_WINDOW_MS) {
      firstClickAt = now;
      clicks = 0;
    }

    clicks += 1;

    if (clicks >= GESTURE_CLICKS) {
      clicks = 0;
      showTemporarily();
    }
  });
}

export function initDeveloper() {
  $("developerPathBtn").addEventListener("click", () => {
    alert(location.href);
  });

  // Removes only the settings of this app, other localStorage keys stay.
  $("developerClearBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    alert(`${STORAGE_KEY} cleared`);
  });

  initMyMemoryUsage();
  bindGesture();
}
