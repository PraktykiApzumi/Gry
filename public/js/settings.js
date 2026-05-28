const STORAGE_KEY = "gry.settings";
const defaults = { accent: "#3498db", fontScale: 1, font: "sans" };

export function getSettings() {
  try { return { ...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }; }
  catch { return { ...defaults }; }
}

export function setSettings(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getSettings(), ...next }));
  applySettings();
}

export function applySettings() {
  const settings = getSettings();
  document.documentElement.style.setProperty("--accent-color", settings.accent);
  document.documentElement.style.setProperty("--font-scale", String(settings.fontScale));
  document.documentElement.dataset.font = settings.font;
}
