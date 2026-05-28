import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import {
  formatDate,
  emptyRow,
  formatScores,
  escapeHtml,
  normalizeGame,
  normalizeUser,
  isDeletedGame,
  isDeletedUser,
} from "./utils.js";
import { createPaginator, renderPaginationControls } from "./pagination.js";
import { t } from "./i18n.js";

function renderPanelLink(label, entityType, value) {
  if (!value) return "-";
  if (entityType === "game" && isDeletedGame(value)) return normalizeGame(value);
  if (entityType === "player" && isDeletedUser(value)) return normalizeUser(value);

  const safeLabel = escapeHtml(String(label));
  const safeValue = escapeHtml(String(value));
  return `<button type="button" class="panel-link" data-entity-type="${entityType}" data-entity-value="${safeValue}">${safeLabel}</button>`;
}

function renderHistoryRow(type, row, scoresByMatch = {}) {
  const scores = row.scores ?? scoresByMatch[row.id] ?? [];
  const rawDate = row.match_date || row.data;
  const dateSort = rawDate ? new Date(rawDate).getTime() : "";
  const gameName = row.game_name || row.nazwa || "";
  const winnerName = row.winner || row.winner_nick || "";
  const playerCount = Number(row.player_count ?? row.ilosc_graczy ?? 0);
  const points = row.points_scored ?? "-";

  const base = {
    date: escapeHtml(formatDate(rawDate)),
    dateSort: Number.isFinite(dateSort) ? dateSort : "",
    game: renderPanelLink(normalizeGame(gameName), "game", gameName),
    winner: renderPanelLink(normalizeUser(winnerName), "player", winnerName),
    playerCount,
    points,
    scores: formatScores(scores),
  };

  switch (type) {
    case "recent":
      return `
        <tr>
          <td data-sort="${base.dateSort}">${base.date}</td>
          <td>${base.game}</td>
          <td>${base.winner}</td>
          <td data-sort="${base.playerCount}">${base.playerCount || "-"}</td>
          <td>${base.scores}</td>
        </tr>
      `;
    case "game":
      return `
        <tr>
          <td data-sort="${base.dateSort}">${base.date}</td>
          <td>${base.winner}</td>
          <td data-sort="${base.playerCount}">${base.playerCount || "-"}</td>
          <td>${base.scores}</td>
        </tr>
      `;
    case "player":
      return `
        <tr>
          <td data-sort="${base.dateSort}">${base.date}</td>
          <td>${base.game}</td>
          <td>${base.winner}</td>
          <td data-sort="${Number.isFinite(Number(base.points)) ? Number(base.points) : ""}">${escapeHtml(String(base.points))}</td>
          <td data-sort="${base.playerCount}">${base.playerCount || "-"}</td>
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
      return { ...row, scores: response?.data || [] };
    })
  );
}

export function initHistory({ showView } = {}) {
  const historyView = qs("#historyView");
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

  const recentPaginator = createPaginator();
  const gamePaginator = createPaginator();
  const playerPaginator = createPaginator();

  function showHistoryPanel(target) {
    const panelId = `history${target.charAt(0).toUpperCase()}${target.slice(1)}`;
    historyTabBtns.forEach((button) => {
      button.classList.toggle("active", button.dataset.history === target);
    });
    historyPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === panelId);
    });
  }

  function renderRecentPage() {
    const page = recentPaginator.getPage();
    recentBody.innerHTML = page.map((row) => renderHistoryRow("recent", row)).join("");
    renderPaginationControls(recentPaginator, qs("#recentHistoryPagination"), renderRecentPage);
  }

  function renderGamePage() {
    const page = gamePaginator.getPage();
    gameBody.innerHTML = page.map((row) => renderHistoryRow("game", row)).join("");
    renderPaginationControls(gamePaginator, qs("#gameHistoryPagination"), renderGamePage);
  }

  function renderPlayerPage() {
    const page = playerPaginator.getPage();
    playerBody.innerHTML = page.map((row) => renderHistoryRow("player", row)).join("");
    renderPaginationControls(playerPaginator, qs("#playerHistoryPagination"), renderPlayerPage);
  }

  async function loadRecentHistory() {
    recentBody.innerHTML = emptyRow(5, t("loading"));

    try {
      const data = await getRequest("api/history/recent");
      const rows = await attachScoresToRows(data?.history ?? []);

      if (!rows.length) {
        recentBody.innerHTML = emptyRow(5, t("noGames"));
        recentPaginator.setItems([]);
        renderPaginationControls(recentPaginator, qs("#recentHistoryPagination"), renderRecentPage);
        return false;
      }

      recentPaginator.setItems(rows);
      renderRecentPage();
      return true;
    } catch (error) {
      recentBody.innerHTML = emptyRow(5, t("loadError"));
      console.error("[history/recent]", error);
      return false;
    }
  }

  async function loadGameHistory(name) {
    const normalizedName = name?.trim();
    if (!normalizedName) return false;

    historyGameNameInput.value = normalizedName;
    gameBody.innerHTML = emptyRow(4, t("loading"));

    try {
      const data = await getRequest(`api/history/game/${encodeURIComponent(normalizedName)}`);
      const rows = await attachScoresToRows(data?.history ?? []);

      if (!rows.length) {
        gameBody.innerHTML = emptyRow(4, t("noGamesForItem"));
        gamePaginator.setItems([]);
        renderPaginationControls(gamePaginator, qs("#gameHistoryPagination"), renderGamePage);
        return false;
      }

      gamePaginator.setItems(rows);
      renderGamePage();
      return true;
    } catch (error) {
      gameBody.innerHTML = emptyRow(4, t("loadError"));
      console.error("[history/game]", error);
      return false;
    }
  }

  async function loadPlayerHistory(name) {
    const normalizedName = name?.trim();
    if (!normalizedName) return false;

    historyPlayerNameInput.value = normalizedName;
    playerBody.innerHTML = emptyRow(6, t("loading"));

    try {
      const data = await getRequest(`api/history/player/${encodeURIComponent(normalizedName)}`);
      const rows = await attachScoresToRows(data?.history ?? []);

      if (!rows.length) {
        playerBody.innerHTML = emptyRow(6, t("noPlayersForItem"));
        playerPaginator.setItems([]);
        renderPaginationControls(playerPaginator, qs("#playerHistoryPagination"), renderPlayerPage);
        return false;
      }

      playerPaginator.setItems(rows);
      renderPlayerPage();
      return true;
    } catch (error) {
      playerBody.innerHTML = emptyRow(6, t("loadError"));
      console.error("[history/player]", error);
      return false;
    }
  }

  async function openHistoryTarget(entityType, value) {
    if (typeof showView === "function") {
      showView("historyView");
    }

    if (entityType === "recent") {
      showHistoryPanel("recent");
      return loadRecentHistory();
    }

    if (entityType === "game") {
      showHistoryPanel("game");
      return loadGameHistory(value);
    }

    showHistoryPanel("player");
    return loadPlayerHistory(value);
  }

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

  historyTabBtns.forEach((button) => {
    button.addEventListener("click", () => {
      showHistoryPanel(button.dataset.history);
    });
  });

  if (loadRecentBtn) {
    loadRecentBtn.addEventListener("click", () => {
      loadRecentHistory();
    });
  }

  if (historyGameForm) {
    historyGameForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loadGameHistory(historyGameNameInput?.value);
    });
  }

  if (historyPlayerForm) {
    historyPlayerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loadPlayerHistory(historyPlayerNameInput?.value);
    });
  }

  historyView.addEventListener("click", async (event) => {
    const trigger = event.target.closest(".panel-link");
    if (!trigger) return;

    const { entityType, entityValue } = trigger.dataset;
    await openHistoryTarget(entityType, entityValue);
  });

  return {
    openRecentHistory: () => openHistoryTarget("recent"),
    openGameHistory: (name) => openHistoryTarget("game", name),
    openPlayerHistory: (name) => openHistoryTarget("player", name),
  };
}
