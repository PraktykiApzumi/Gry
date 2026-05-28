import { formatDate as formatLocalizedDate, t } from "./i18n.js";

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:#999;">${msg}</td></tr>`;
}

export function isDeletedUser(value) {
  return typeof value === "string" && value.startsWith("deleted_user_");
}

export function isDeletedGame(value) {
  return typeof value === "string" && value.startsWith("deleted_game_");
}

export function normalizeUser(value) {
  if (!value) return "-";
  return isDeletedUser(value) ? "deleted" : escapeHtml(value);
}

export function normalizeGame(value) {
  if (!value) return "-";
  return isDeletedGame(value) ? "deleted" : escapeHtml(value);
}

export function formatDate(value) {
  return formatLocalizedDate(value);
}

export function formatScores(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return `<span class="admin-muted">${t("noScoreData")}</span>`;
  }

  return scores
    .map((score) => {
      const nick = normalizeUser(score.player_nick);
      const nickLabel = isDeletedUser(score.player_nick)
        ? nick
        : `<button type="button" class="panel-link score-link" data-entity-type="player" data-entity-value="${escapeHtml(String(score.player_nick))}">${nick}</button>`;
      return `<span class="score-chip">${nickLabel}: ${score.liczba_punktow}</span>`;
    })
    .join("");
}
