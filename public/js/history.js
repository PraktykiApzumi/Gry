import { getRequest } from "./api.js";
import { esc } from "./utils.js";
import { attachAutocomplete } from "./autocomplete.js";
import { qs, qsa } from "./dom.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return esc(dateStr);

  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:#999;">${msg}</td></tr>`;
}

function formatScores(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return '<span class="admin-muted">Brak wynikow</span>';
  }

  return scores
    .map((score) => `<span class="score-chip">${esc(score.player_nick)}: ${Number(score.liczba_punktow)}</span>`)
    .join("");
}

async function enrichWithScores(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const response = await getRequest(`api/panel/scores/${row.id}`);
      return {
        ...row,
        scores: response?.data || []
      };
    })
  );
}

export function loadHistory() {
  const historyTabBtns = qsa("#historyView .history-tab-btn");
  const historyPanels = qsa("#historyView .history-panel");

  const recentBody = qs("#recentBody");
  const gameBody = qs("#gameHistoryBody");
  const playerBody = qs("#playerHistoryBody");

  attachAutocomplete(
    qs("#historyGameInput"),
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    { label: "game:history", maxSuggestions: 3 }
  );
  attachAutocomplete(
    qs("#historyPlayerInput"),
    (value) => `api/suggest/player/${encodeURIComponent(value)}`,
    { label: "player:history", maxSuggestions: 3 }
  );

  historyTabBtns.forEach((btn) => {
    const panelId = btn.dataset.historyPanel;
    btn.addEventListener("click", () => {
      historyTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
      historyPanels.forEach((p) => p.classList.toggle("active", p.id === panelId));
    });
  });

  // Recent matches
  qs("#recentSearchBtn").addEventListener("click", async () => {
    const data = await getRequest("api/history/recent");
    const rows = data?.data || [];

    if (!rows.length) {
      recentBody.innerHTML = emptyRow(5, "Brak rozgrywek");
      return;
    }

    const enriched = await enrichWithScores(rows);
    recentBody.innerHTML = enriched.map((r) => `
      <tr>
        <td>${formatDate(r.match_date)}</td>
        <td>${esc(r.game_name ?? "—")}</td>
        <td>${esc(r.winner ?? "—")}</td>
        <td>${r.player_count ?? "—"}</td>
        <td>${formatScores(r.scores)}</td>
      </tr>
    `).join("");
  });

  // Game history
  qs("#gameHistorySearchBtn").addEventListener("click", async () => {
    const name = qs("#historyGameInput").value.trim();
    if (!name) return;

    const data = await getRequest(`api/history/game/${encodeURIComponent(name)}`);
    const rows = data?.data || [];

    if (!rows.length) {
      gameBody.innerHTML = emptyRow(4, "Brak rozgrywek dla tej gry");
      return;
    }

    const enriched = await enrichWithScores(rows);
    gameBody.innerHTML = enriched.map((r) => `
      <tr>
        <td>${formatDate(r.match_date)}</td>
        <td>${esc(r.winner ?? "—")}</td>
        <td>${r.player_count ?? "—"}</td>
        <td>${formatScores(r.scores)}</td>
      </tr>
    `).join("");
  });

  // Player history
  qs("#playerHistorySearchBtn").addEventListener("click", async () => {
    const name = qs("#historyPlayerInput").value.trim();
    if (!name) return;

    const data = await getRequest(`api/history/player/${encodeURIComponent(name)}`);
    const rows = data?.data || [];

    if (!rows.length) {
      playerBody.innerHTML = emptyRow(6, "Brak rozgrywek dla tego gracza");
      return;
    }

    const enriched = await enrichWithScores(rows);
    playerBody.innerHTML = enriched.map((r) => `
      <tr>
        <td>${formatDate(r.match_date)}</td>
        <td>${esc(r.game_name ?? "—")}</td>
        <td>${esc(r.winner ?? "—")}</td>
        <td>${r.points_scored ?? "—"}</td>
        <td>${r.player_count ?? "—"}</td>
        <td>${formatScores(r.scores)}</td>
      </tr>
    `).join("");
  });
}
