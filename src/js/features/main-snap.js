// Scroll step of the main screen (CSS scroll-snap): the page is pressed to the source block.
// The settings window has its own steps (scroll-steps.js).
import { contentTop, fitSnapSpacer, snapOffset } from "./scroll-steps.js";

export function updateMainSnap() {
  const container = document.getElementById("scrollContainer");
  const source = document.querySelector(".section-block-source");
  const targets = document.querySelector(".section-block-targets-wrapper");
  if (!container || !source || !targets) return;

  // The last visible element of the page: the translations, the buttons under them,
  // or the developer rows (if shown)
  const last = [targets, document.querySelector(".bottom-actions"), document.getElementById("serviceRow"), document.getElementById("developer")].filter((el) => el && el.offsetParent !== null).pop() || targets;
  const sourceStep = contentTop(container, source) - snapOffset(container, source);
  const contentBottom = contentTop(container, last) + last.offsetHeight;
  container.querySelectorAll(".snap-end").forEach((el) => el.classList.remove("snap-end"));
  last.classList.toggle("snap-end", contentBottom - sourceStep > container.clientHeight + 1);

  fitSnapSpacer(container, document.getElementById("mainSnapSpacer"), source);
}

export function initMainSnap() {
  updateMainSnap();
  window.addEventListener("resize", updateMainSnap);
  window.addEventListener("orientationchange", updateMainSnap);
  window.addEventListener("load", updateMainSnap);
  if (window.ResizeObserver) {
    const layout = document.querySelector(".layout");
    if (layout) new ResizeObserver(updateMainSnap).observe(layout);
  }
}
