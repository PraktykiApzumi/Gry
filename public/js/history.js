import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import {
  formatDate,
  emptyRow,
  normalizeUser,
  normalizeGame,
  formatScores,
} from "./utils.js";

function renderHistoryRow(type, r, scoresByMatch = {}) {
  const scores = r.scores ?? scoresByMatch[r.id] ?? [];

  const base = {
    date: formatDate(r.match_date || r.data),
    game: normalizeGame(r.game_name || r.nazwa),
    winner: normalizeUser(r.winner || r.winner_nick),
    player_count: r.player_count ?? r.ilosc_graczy ?? "—",
    points: r.points_scored ?? "—",
    scores: formatScores(scores),
  };

  switch (type) {
    case "recent":
      return `
        <tr>
          <td>${base.date}</td>
          <td>${base.game}</td>
          <td>${base.winner}</td>
          <td>${base.player_count}</td>
          <td>${base.scores}</td>
        </tr>
      `;

    case "game":
      return `
        <tr>
          <td>${base.date}</td>
          <td>${base.winner}</td>
          <td>${base.player_count}</td>
          <td>${base.scores}</td>
        </tr>
      `;

    case "player":
      return `
        <tr>
          <td>${base.date}</td>
          <td>${base.game}</td>
          <td>${base.winner}</td>
          <td>${base.points}</td>
          <td>${base.player_count}</td>
          <td>${base.scores}</td>
        </tr>
      `;
    default:
      return "";
  }
}

async function attachScoresToRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const response = await getRequest(`api/admin/scores/${row.id}`);
      return {
        ...row,
        scores: response?.data || [],
      };
    }),
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
      { label: "game:history", maxSuggestions: 3 },
    );
  }

  if (historyPlayerNameInput) {
    attachAutocomplete(
      historyPlayerNameInput,
      (value) => `api/suggest/player/${encodeURIComponent(value)}`,
      { label: "player:history", maxSuggestions: 3 },
    );
  }

  historyTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.history;
      const panelId = `history${target.charAt(0).toUpperCase()}${target.slice(1)}`;

      historyTabBtns.forEach((b) =>
        b.classList.toggle("active", b === btn),
      );
      historyPanels.forEach((p) =>
        p.classList.toggle("active", p.id === panelId),
      );
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

        recentBody.innerHTML = rows
          .map((r) => renderHistoryRow("recent", r))
          .join("");
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
        const data = await getRequest(
          `api/history/game/${encodeURIComponent(name)}`,
        );

        const rows = await attachScoresToRows(data?.history ?? []);

        if (!rows.length) {
          gameBody.innerHTML = emptyRow(4, "Brak rozgrywek dla tej gry");
          return;
        }

        gameBody.innerHTML = rows
          .map((r) => renderHistoryRow("game", r))
          .join("");
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
        const data = await getRequest(
          `api/history/player/${encodeURIComponent(name)}`,
        );

        const rows = await attachScoresToRows(data?.history ?? []);

        if (!rows.length) {
          playerBody.innerHTML = emptyRow(
            6,
            "Brak rozgrywek dla tego gracza",
          );
          return;
        }

        playerBody.innerHTML = rows
          .map((r) => renderHistoryRow("player", r))
          .join("");
      } catch (err) {
        playerBody.innerHTML = emptyRow(6, "Blad pobierania danych");
        console.error("[history/player]", err);
      }
    });
  }
}