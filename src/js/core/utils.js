// Small helpers without dependencies on other modules

let debug = false;

// Switch the debug output on or off (developerMode in config/config.json)
function setDebug(on) {
  debug = Boolean(on);
}

function log(...args) {
  if (debug) console.log(...args);
}

export const Utils = {
  setDebug,
  log,
};
