// Windows: help and settings.
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { loadHelp } from "./help.js";
import { closeLiveLists } from "./live-select.js";
import { syncPresetEditor } from "./presets.js";
import { updateModalSnap } from "./scroll-steps.js";

// An open window owns one history entry, so the browser / phone "Back" button
// closes the window instead of leaving the page. Without a window Back works as usual.
let modalHistoryPushed = false;

// Closing with the cross, the backdrop or Esc also removes the history entry.
export function closeAllModals() {
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
}
