export function toInt(value) {
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function debounce(fn, waitMs) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}

// XSS protection
export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:#999;">${msg}</td></tr>`;
}

export function normalizeUser(value) {
  if (!value) return "—";
  return value.startsWith("deleted_user_") ? "deleted" : esc(value);
}

export function normalizeGame(value) {
  if (!value) return "—";
  return value.startsWith("deleted_game_") ? "deleted" : esc(value);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? esc(value)
    : date.toLocaleString("pl-PL");
}

export function formatScores(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return `<span class="admin-muted">Brak wynikow</span>`;
  }

  return scores
    .map((s) => {
      const nick = normalizeUser(s.player_nick);
      return `<span class="score-chip">${nick}: ${Number(s.liczba_punktow)}</span>`;
    })
    .join("");
}
