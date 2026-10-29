// Windows: help and settings.
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { loadHelp } from "./help.js";
import { closeLiveLists } from "./live-select.js";
import { syncPresetEditor } from "./presets.js";
import { updateModalSnap } from "./scroll-steps.js";

const DEVELOPER_CLICK_COUNT = 7;
const DEVELOPER_CLICK_WINDOW = 3000;
const DEVELOPER_VISIBLE_TIME = 30_000;

// An open window owns one history entry, so the browser / phone "Back" button
// closes the window instead of leaving the page. Without a window Back works as usual.
let modalHistoryPushed = false;

// State of the secret developer-panel gesture.
let resetClickCount = 0;
let resetFirstClickAt = 0;
let developerTimer = null;

// Closing with the cross, the backdrop or Esc also removes the history entry.
function closeAllModals() {
  hideAllModals();

  if (modalHistoryPushed) {
    modalHistoryPushed = false;
    history.back();
  }
}

function openModal(id) {
  $(id)?.classList.remove("hidden");

  if (!modalHistoryPushed) {
    history.pushState({ dtModal: true }, "");
    modalHistoryPushed = true;
  }
}

function hideAllModals() {
  closeLiveLists();

  document
    .querySelectorAll(".app-modal")
    .forEach((modal) => modal.classList.add("hidden"));
}

function isAnyModalOpen() {
  return !!document.querySelector(".app-modal:not(.hidden)");
}

// Temporarily show the developer buttons without changing the saved developerMode setting.
function openDeveloperTemporarily() {
  const developer = $("developer");

  clearTimeout(developerTimer);

  closeAllModals();
  developer.style.display = "flex";

  developerTimer = setTimeout(() => {
    developer.style.display = "none";
    developerTimer = null;
  }, DEVELOPER_VISIBLE_TIME);
}

// Seven clicks on "Reset defaults" within three seconds open the developer panel.
function bindDeveloperGesture() {
  $("resetSettingsText").addEventListener("click", () => {
    const now = Date.now();

    if (
      resetClickCount === 0 ||
      now - resetFirstClickAt > DEVELOPER_CLICK_WINDOW
    ) {
      resetFirstClickAt = now;
      resetClickCount = 1;
    } else {
      resetClickCount += 1;
    }

    if (resetClickCount >= DEVELOPER_CLICK_COUNT) {
      resetClickCount = 0;
      resetFirstClickAt = 0;
      openDeveloperTemporarily();
    }
  });
}

// Clear only the settings stored by DT, preserving other localStorage keys.
function bindClearDeveloperSettings() {
  const developerButtons = $("developer").querySelectorAll("button");
  const clearSettingsButton = developerButtons[1];

  if (!clearSettingsButton) return;

  // Remove the existing inline localStorage.clear() handler.
  clearSettingsButton.onclick = null;
  clearSettingsButton.title = "Clear DT settings";

  clearSettingsButton.addEventListener("click", () => {
    localStorage.removeItem("DT-settings");
    alert("DT settings cleared");
  });
}

export function initModals() {
  // "Back" pressed while a window is open: the entry is already gone, just hide the window.
  window.addEventListener("popstate", () => {
    if (modalHistoryPushed) {
      modalHistoryPushed = false;
      hideAllModals();
    }
  });

  $("helpAppBtn").addEventListener("click", () => {
    openModal("helpAppModal");
    loadHelp();
  });

  $("settingsAppBtn").addEventListener("click", () => {
    state.editLangPreset = state.activePreset;
    state.editBtnPreset = state.activePreset;
    syncPresetEditor();
    openModal("settingsAppModal");
    updateModalSnap();
  });

  document
    .querySelectorAll(".app-modal-close-btn")
    .forEach((button) => button.addEventListener("click", closeAllModals));

  document.querySelectorAll(".app-modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeAllModals();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isAnyModalOpen()) closeAllModals();
  });

  bindDeveloperGesture();
  bindClearDeveloperSettings();
}
