// Default settings: the only place is config/config.json (edit that file to change them).
import { PATHS } from "./config.js";

let defaults = null;

// Loads config/config.json. Called at start and by "Reset defaults".
export async function loadDefaults() {
  const response = await fetch(PATHS.CONFIG, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${PATHS.CONFIG}: ${response.status}`);
  defaults = await response.json();
}

export function getDefaults() {
  return defaults;
}
