import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:#999;">${msg}</td></tr>`;
}

function formatScores(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return '<span class="admin-muted">Brak wynikow</span>';
  }

  return scores
    .map((score) => `<span class="score-chip">${score.player_nick}: ${score.liczba_punktow}</span>`)
    .join("");
}

async function attachScoresToRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const response = await getRequest(`api/admin/scores/${row.id}`);
      return {
        ...row,
        scores: response?.data || []
      };
    })
  );
}

export function initHistory() {
  const historyTabBtns = qsa(".history-tab-btn");
  const historyPanels = qsa(".history-panel");
  const recentBody = qs("#recentHistoryBody");
  const gameBody = qs("#gameHistoryBody");
  const playerBody = qs("#playerHistoryBody");
  const loadRecentBtn = qs("#loadRecentBtn");
  const historyGameForm = qs("#historyGameForm");
  const historyPlayerForm = qs("#historyPlayerForm");
  const historyGameNameInput = qs("#historyGameName");
  const historyPlayerNameInput = qs("#historyPlayerName");

  if (historyGameNameInput) {
    attachAutocomplete(
      historyGameNameInput,
      (value) => `api/suggest/game/${encodeURIComponent(value)}`,
      { label: "game:history", maxSuggestions: 3 }
    );
  }

  if (historyPlayerNameInput) {
    attachAutocomplete(
      historyPlayerNameInput,
      (value) => `api/suggest/player/${encodeURIComponent(value)}`,
      { label: "player:history", maxSuggestions: 3 }
    );
  }

  historyTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.history;
      const panelId = `history${target.charAt(0).toUpperCase()}${target.slice(1)}`;
      historyTabBtns.forEach((b) => b.classList.toggle("active", b === btn));
      historyPanels.forEach((p) => p.classList.toggle("active", p.id === panelId));
    });
  });

  if (loadRecentBtn) {
    loadRecentBtn.addEventListener("click", async () => {
      recentBody.innerHTML = emptyRow(5, "Ladowanie...");
      try {
        const data = await getRequest("api/history/recent");
        const rows = await attachScoresToRows(data?.history ?? []);
        if (!rows.length) {
          recentBody.innerHTML = emptyRow(5, "Brak rozgrywek");
          return;
        }
        recentBody.innerHTML = rows.map((r) => `
          <tr>
            <td>${formatDate(r.match_date)}</td>
            <td>${r.game_name ?? "—"}</td>
            <td>${r.winner ?? "—"}</td>
            <td>${r.player_count ?? "—"}</td>
            <td>${formatScores(r.scores)}</td>
          </tr>
        `).join("");
      } catch (err) {
        recentBody.innerHTML = emptyRow(5, "Blad pobierania danych");
        console.error("[history/recent]", err);
      }
    });
  }

  if (historyGameForm) {
    historyGameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = historyGameNameInput?.value.trim();
      if (!name) return;
      gameBody.innerHTML = emptyRow(4, "Ladowanie...");
      try {
        const data = await getRequest(`api/history/game/${encodeURIComponent(name)}`);
        const rows = await attachScoresToRows(data?.history ?? []);
        if (!rows.length) {
          gameBody.innerHTML = emptyRow(4, "Brak rozgrywek dla tej gry");
          return;
        }
        gameBody.innerHTML = rows.map((r) => `
          <tr>
            <td>${formatDate(r.match_date)}</td>
            <td>${r.winner ?? "—"}</td>
            <td>${r.player_count ?? "—"}</td>
            <td>${formatScores(r.scores)}</td>
          </tr>
        `).join("");
      } catch (err) {
        gameBody.innerHTML = emptyRow(4, "Blad pobierania danych");
        console.error("[history/game]", err);
      }
    });
  }

  if (historyPlayerForm) {
    historyPlayerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = historyPlayerNameInput?.value.trim();
      if (!name) return;
      playerBody.innerHTML = emptyRow(6, "Ladowanie...");
      try {
        const data = await getRequest(`api/history/player/${encodeURIComponent(name)}`);
        const rows = await attachScoresToRows(data?.history ?? []);
        if (!rows.length) {
          playerBody.innerHTML = emptyRow(6, "Brak rozgrywek dla tego gracza");
          return;
        }
        playerBody.innerHTML = rows.map((r) => `
          <tr>
            <td>${formatDate(r.match_date)}</td>
            <td>${r.game_name ?? "—"}</td>
            <td>${r.winner ?? "—"}</td>
            <td>${r.points_scored ?? "—"}</td>
            <td>${r.player_count ?? "—"}</td>
            <td>${formatScores(r.scores)}</td>
          </tr>
        `).join("");
      } catch (err) {
        playerBody.innerHTML = emptyRow(6, "Blad pobierania danych");
        console.error("[history/player]", err);
      }
    });
  }
}
