// Linked height of the three text fields (source, translation 1, translation 2).
// The user drags the grip in the bottom-right corner of a field:
//   1. source field          -> all three fields change proportionally;
//   2. translation 1 field   -> translation 1 and 2 change proportionally;
//   3. translation 2 field   -> wide layout (1 and 2 side by side): as in 2;
//                               narrow layout (stacked): only translation 2 changes.
//
// The grip is our own element, not the native resize handle of the browser: the native one is
// tiny, absent on many phones and does not report the finger drag reliably. The size of the
// touch area is set in text-fields.css (--grip-hit).

import { $ } from "../core/dom.js";

const FIELD_IDS = {
  source: "sourceText",
  target1: "translatedText1",
  target2: "translatedText2",
};

function getFields() {
  return {
    source: $(FIELD_IDS.source),
    target1: $(FIELD_IDS.target1),
    target2: $(FIELD_IDS.target2),
  };
}

// Translation 1 and 2 are side by side (wide layout) or one under the other (narrow layout)
function targetsAreSideBySide(fields) {
  const a = fields.target1.getBoundingClientRect();
  const b = fields.target2.getBoundingClientRect();
  return b.top < a.bottom - 1;
}

// Which fields follow the field that the user is resizing
function followers(name, fields) {
  if (name === "source") return [fields.target1, fields.target2];
  if (name === "target1") return [fields.target2];
  // name === "target2"
  return targetsAreSideBySide(fields) ? [fields.target1] : [];
}

function minHeightOf(el) {
  return parseFloat(getComputedStyle(el).minHeight) || 0;
}

// Wraps the field in a positioned box and puts the grip into its corner
function addGrip(el) {
  const wrap = document.createElement("div");
  wrap.className = "ta-wrap";
  el.replaceWith(wrap);
  const grip = document.createElement("div");
  grip.className = "ta-grip";
  grip.setAttribute("aria-hidden", "true");
  wrap.append(el, grip);
  return grip;
}

export function initTextareaSync() {
  const fields = getFields();
  if (!fields.source || !fields.target1 || !fields.target2) return;

  Object.entries(fields).forEach(([name, el]) => {
    const grip = addGrip(el);
    let drag = null;

    grip.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        y: e.clientY,
        // heights of all fields when the drag starts: the ratio is always taken from them
        start: new Map(Object.values(fields).map((field) => [field, field.offsetHeight])),
      };
      grip.classList.add("is-dragging");
    });

    grip.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const startHeight = drag.start.get(el);
      const height = Math.max(minHeightOf(el), Math.round(startHeight + (e.clientY - drag.y)));
      el.style.height = `${height}px`;

      const ratio = height / startHeight;
      followers(name, fields).forEach((other) => {
        const base = drag.start.get(other);
        other.style.height = `${Math.max(minHeightOf(other), Math.round(base * ratio))}px`;
      });
    });

    const stop = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      grip.classList.remove("is-dragging");
    };
    grip.addEventListener("pointerup", stop);
    grip.addEventListener("pointercancel", stop);
  });
}
