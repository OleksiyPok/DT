// Local MyMemory usage counter.
// Counts outgoing API requests and the source-text characters in each request.
// Data is stored separately from the application's settings.

const STORAGE_KEY = "DT-MyMemory-usage";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyUsage() {
  return {
    date: getLocalDateKey(),
    requests: 0,
    characters: 0,
  };
}

function readUsage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      saved &&
      saved.date === getLocalDateKey() &&
      Number.isFinite(saved.requests) &&
      Number.isFinite(saved.characters)
    ) {
      return {
        date: saved.date,
        requests: saved.requests,
        characters: saved.characters,
      };
    }
  } catch (error) {
    console.warn("MyMemory usage counter:", error);
  }

  return emptyUsage();
}

function saveUsage(usage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.warn("Could not save MyMemory usage:", error);
  }
}

function notifyUsageChanged() {
  window.dispatchEvent(new Event("mymemory-usage-change"));
}

export function getMyMemoryUsage() {
  const usage = readUsage();
  saveUsage(usage);
  return usage;
}

// Call once for every outgoing MyMemory API request.
export function recordMyMemoryRequest(text) {
  const usage = readUsage();

  usage.requests += 1;
  usage.characters += Array.from(String(text)).length;

  saveUsage(usage);
  notifyUsageChanged();

  return usage;
}
