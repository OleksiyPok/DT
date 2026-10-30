// MyMemory usage counter: requests and source-text characters sent today.
// Stored separately from the settings; the line is shown in the developer panel.
import { MYMEMORY_DAILY_LIMIT, MYMEMORY_USAGE_KEY } from "../core/config.js";
import { $ } from "../core/dom.js";

const CHANGE_EVENT = "mymemory-usage-change";

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Usage of today; a new day (or no / broken data) starts from zero
function readUsage() {
  try {
    const saved = JSON.parse(localStorage.getItem(MYMEMORY_USAGE_KEY));
    if (
      saved?.date === todayKey() &&
      Number.isFinite(saved.requests) &&
      Number.isFinite(saved.characters)
    ) {
      return saved;
    }
  } catch (err) {
    console.warn("MyMemory usage counter:", err);
  }
  return { date: todayKey(), requests: 0, characters: 0 };
}

// Call once for every outgoing MyMemory request (failed ones count too)
export function recordMyMemoryRequest(text) {
  const usage = readUsage();
  usage.requests += 1;
  usage.characters += Array.from(String(text)).length;

  try {
    localStorage.setItem(MYMEMORY_USAGE_KEY, JSON.stringify(usage));
  } catch (err) {
    console.warn("Could not save the MyMemory usage:", err);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function render() {
  const { requests, characters } = readUsage();
  $("myMemoryUsage").textContent =
    `MyMemory today: ${requests.toLocaleString()} requests · ` +
    `${characters.toLocaleString()} / ${MYMEMORY_DAILY_LIMIT.toLocaleString()} characters`;
}

// Zero the line at midnight even if the page stays open
function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  setTimeout(() => {
    render();
    scheduleMidnightRefresh();
  }, midnight - now + 100);
}

export function initMyMemoryUsage() {
  render();
  scheduleMidnightRefresh();

  window.addEventListener(CHANGE_EVENT, render);
  // Another tab of the same site changed the counter
  window.addEventListener("storage", (event) => {
    if (event.key === MYMEMORY_USAGE_KEY) render();
  });
  // The page was in the background (the date may have changed)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
}
