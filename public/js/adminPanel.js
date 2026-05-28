import { qs, qsa } from "./dom.js";
import { deleteRequest, getRequest, postJson, putJson } from "./api.js";
import {
  normalizeGame,
  normalizeUser,
  escapeHtml,
  isDeletedGame,
  isDeletedUser,
  formatScores,
} from "./utils.js";
import { createPaginator, renderPaginationControls } from "./pagination.js";
import { formatDate, formatGameType, formatWinType, t } from "./i18n.js";

let players = [];
let games = [];
let matches = [];
let scoresByMatch = {};
let modalType = "";
let modalId = 0;
let activeMatchId = 0;
let openGameModalRef = null;
let historyNavigation = null;

const playersPaginator = createPaginator();
const gamesPaginator = createPaginator();
const matchesPaginator = createPaginator();

const emptyRow = (cols, text) => `<tr><td colspan="${cols}" class="admin-empty">${text}</td></tr>`;
const dateSortValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.getTime();
};

const renderHistoryLink = (type, value, label) =>
  (type === "player" && isDeletedUser(value))
    ? normalizeUser(value)
    : (type === "game" && isDeletedGame(value))
      ? normalizeGame(value)
      : `<button type="button" class="panel-link" data-nav-history="${type}" data-nav-value="${escapeHtml(String(value))}">${label}</button>`;

const showPanel = (name) => {
  qsa("#adminView .admin-tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminPanel === name);
  });
  qsa("#adminView .admin-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === name);
  });
};

const toast = (message, variant = "success") => {
  const existing = document.querySelector(".inline-toast");
  if (existing) existing.remove();

  const element = document.createElement("div");
  element.className = `inline-toast is-${variant}`;
  element.textContent = message;
  document.body.appendChild(element);

  requestAnimationFrame(() => element.classList.add("is-visible"));
  setTimeout(() => {
    element.classList.remove("is-visible");
    setTimeout(() => element.remove(), 250);
  }, 2600);
};

async function refreshAdminPanel() {
  players = (await getRequest("api/admin/players")).data || [];
  games = (await getRequest("api/admin/games")).data || [];
  matches = (await getRequest("api/admin/matches")).data || [];

  scoresByMatch = {};
  for (const match of matches) {
    scoresByMatch[match.id] = (await getRequest(`api/admin/scores/${match.id}`)).data || [];
  }

  playersPaginator.setItems(players);
  gamesPaginator.setItems(games);
  matchesPaginator.setItems(matches);

  renderPlayers();
  renderGames();
  renderMatches();
}

function renderPlayers() {
  const page = playersPaginator.getPage();
  qs("#adminPlayersBody").innerHTML = page.length
    ? page
        .map(
          (player) => `<tr>
            <td data-sort="${player.id}">${player.id}</td>
            <td>${renderHistoryLink("player", player.nick, escapeHtml(player.nick))}</td>
            <td class="actions-cell">
              <div class="admin-actions">
                <button type="button" class="btn-edit" data-action="edit-player" data-id="${player.id}">${t("edit")}</button>
                <button type="button" class="btn-delete" data-action="delete-player" data-id="${player.id}">${t("delete")}</button>
              </div>
            </td>
          </tr>`,
        )
        .join("")
    : emptyRow(3, t("noData"));

  renderPaginationControls(playersPaginator, qs("#adminPlayersPagination"), renderPlayers);
}

function renderGames() {
  const page = gamesPaginator.getPage();
  qs("#adminGamesBody").innerHTML = page.length
    ? page
        .map(
          (game) => `<tr>
            <td data-sort="${game.id}">${game.id}</td>
            <td>${renderHistoryLink("game", game.nazwa, escapeHtml(game.nazwa))}</td>
            <td>${formatGameType(game.rodzaj)}</td>
            <td data-sort="${game.min_graczy}">${game.min_graczy}</td>
            <td data-sort="${game.max_graczy}">${game.max_graczy}</td>
            <td>${formatWinType(game.rodzaj_wygranej)}</td>
            <td class="actions-cell">
              <div class="admin-actions">
                <button type="button" class="btn-edit" data-action="edit-game" data-id="${game.id}">${t("edit")}</button>
                <button type="button" class="btn-delete" data-action="delete-game" data-id="${game.id}">${t("delete")}</button>
              </div>
            </td>
          </tr>`,
        )
        .join("")
    : emptyRow(7, t("noData"));

  renderPaginationControls(gamesPaginator, qs("#adminGamesPagination"), renderGames);
}

function renderMatches() {
  const page = matchesPaginator.getPage();
  qs("#adminMatchesBody").innerHTML = page.length
    ? page
        .map(
          (match) => `<tr>
            <td data-sort="${match.id}">${match.id}</td>
            <td data-sort="${dateSortValue(match.data)}">${formatDate(match.data)}</td>
            <td>${renderHistoryLink("game", match.game_name, normalizeGame(match.game_name))}</td>
            <td>${renderHistoryLink("player", match.winner_nick, normalizeUser(match.winner_nick))}</td>
            <td data-sort="${match.ilosc_graczy}">${match.ilosc_graczy}</td>
            <td>
              <div class="score-list">
                ${formatScores(scoresByMatch[match.id] || [])}
                ${(scoresByMatch[match.id] || []).length ? `<button type="button" class="btn-score-edit" data-action="edit-scores" data-id="${match.id}">${t("editResults")}</button>` : ""}
              </div>
            </td>
            <td class="actions-cell">
              <div class="admin-actions">
                <button type="button" class="btn-delete" data-action="delete-match" data-id="${match.id}">${t("delete")}</button>
              </div>
            </td>
          </tr>`,
        )
        .join("")
    : emptyRow(7, t("noData"));

  renderPaginationControls(matchesPaginator, qs("#adminMatchesPagination"), renderMatches);
}

function openEntityModal(title, html, type, id = 0) {
  modalType = type;
  modalId = id;
  qs("#adminEntityModalTitle").textContent = title;
  qs("#adminEntityFields").innerHTML = html;
  qs("#adminEntityModal").style.display = "flex";
}

const closeEntityModal = () => {
  modalType = "";
  modalId = 0;
  qs("#adminEntityForm").reset();
  qs("#adminEntityFields").innerHTML = "";
  qs("#adminEntityModal").style.display = "none";
};

function openPlayerModal(player) {
  openEntityModal(
    player ? t("editPlayerTitle") : t("addPlayerTitle"),
    `<div class="admin-form-field">
      <label class="field-label" for="adminPlayerName">${t("playerNameLabel")}</label>
      <input type="text" id="adminPlayerName" name="name" placeholder="${t("playerNamePlaceholder")}" value="${player ? escapeHtml(player.nick) : ""}" required />
    </div>`,
    "player",
    player ? player.id : 0,
  );
}

async function saveEntityModal(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);

  try {
    if (modalType === "player") {
      const payload = { name: String(data.get("name")).trim() };
      if (modalId) await putJson(`api/player/${modalId}`, payload);
      else await postJson("api/player", payload);
    }

    if (modalType === "match") {
      const gameName = String(data.get("gameName")).trim();
      const winnerName = String(data.get("winnerName")).trim();
      const playerCount = Number(data.get("playerCount"));
      const game = await getRequest(`api/game/${encodeURIComponent(gameName)}`);
      const winner = await getRequest(`api/player/${encodeURIComponent(winnerName)}`);
      await putJson(`api/match/${modalId}`, {
        gameId: Number(game.gameData.id),
        winnerId: Number(winner.playerData.id),
        playerCount,
      });
    }

    closeEntityModal();
    await refreshAdminPanel();
    toast(t("saved"));
  } catch (error) {
    toast(error instanceof Error ? error.message : t("loadError"), "error");
  }
}

function openScoresModal(matchId) {
  const match = matches.find((item) => item.id === matchId);
  const scores = scoresByMatch[matchId] || [];
  const isOtherWinType = match.rodzaj_wygranej === "inna";

  activeMatchId = matchId;
  qs("#adminScoresModalTitle").textContent = isOtherWinType
    ? `${t("winnerOfMatch")} #${match.id}`
    : `${t("matchResults")} #${match.id}`;
  qs("#adminScoresMeta").innerHTML = `
    <div><strong>${t("colGame")}:</strong> ${escapeHtml(match.game_name)}</div>
    <div><strong>${t("colWinner")}:</strong> ${escapeHtml(match.winner_nick)}</div>
    <div><strong>${t("colDate")}:</strong> ${formatDate(match.data)}</div>
  `;
  qs("#adminScoresFields").innerHTML = scores
    .map(
      (score) => `<div class="admin-score-row">
        <div class="admin-score-name">${escapeHtml(score.player_nick)}</div>
        ${
          isOtherWinType
            ? `<label class="winner-radio-label">
                <input type="radio" name="winnerId" value="${score.id_gracza}" ${Number(score.id_gracza) === Number(match.id_zwyciezcy) ? "checked" : ""} required />
                ${t("chooseWinner")}
              </label>`
            : `<input type="number" min="0" name="score-${score.id}" value="${score.liczba_punktow}" required />`
        }
      </div>`,
    )
    .join("");

  qs("#adminScoresSaveBtn").textContent = t("saveResults");
  qs("#adminScoresModal").style.display = "flex";
}

const closeScoresModal = () => {
  activeMatchId = 0;
  qs("#adminScoresForm").reset();
  qs("#adminScoresMeta").innerHTML = "";
  qs("#adminScoresFields").innerHTML = "";
  qs("#adminScoresModal").style.display = "none";
};

async function saveScores(event) {
  event.preventDefault();
  const match = matches.find((item) => item.id === activeMatchId);
  const scores = scoresByMatch[activeMatchId] || [];
  const data = new FormData(event.currentTarget);
  let winnerId = scores[0].id_gracza;
  let winnerPoints = match.rodzaj_wygranej === "punktowa-malejaca" ? Number.POSITIVE_INFINITY : -1;

  try {
    if (match.rodzaj_wygranej === "inna") {
      winnerId = Number(data.get("winnerId"));
    } else {
      for (const score of scores) {
        const points = Number(data.get(`score-${score.id}`));
        await putJson(`api/score/${score.id}`, {
          matchId: score.id_rozgrywki,
          playerId: score.id_gracza,
          points,
        });

        const isBetter =
          match.rodzaj_wygranej === "punktowa-malejaca"
            ? points < winnerPoints
            : points > winnerPoints;

        if (isBetter) {
          winnerPoints = points;
          winnerId = score.id_gracza;
        }
      }
    }

    await putJson(`api/match/${match.id}`, {
      gameId: match.id_gry,
      winnerId,
      playerCount: match.ilosc_graczy,
    });
    closeScoresModal();
    await refreshAdminPanel();
    toast(t("saved"));
  } catch (error) {
    toast(error instanceof Error ? error.message : t("loadError"), "error");
  }
}

async function removeRecord(type, id) {
  if (!window.confirm(t("confirmDelete"))) return;
  await deleteRequest(`api/${type}/${id}`);
  await refreshAdminPanel();
  toast(t("deleted"));
}

const openAddMatchView = () => {
  qsa(".view").forEach((view) => view.classList.toggle("active", view.id === "addView"));
  qsa(".tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === "addView"));
};

function bindButtons() {
  qsa("#adminView .admin-tab-btn").forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.adminPanel));
  });

  qs("#addPlayerBtn").addEventListener("click", () => openPlayerModal(null));
  qs("#addGameBtn").addEventListener("click", () => openGameModalRef({ onSaved: refreshAdminPanel }));
  qs("#addMatchBtn").addEventListener("click", openAddMatchView);
  qs("#adminEntityCloseBtn").addEventListener("click", closeEntityModal);
  qs("#adminScoresCloseBtn").addEventListener("click", closeScoresModal);
  qs("#adminEntityForm").addEventListener("submit", saveEntityModal);
  qs("#adminScoresForm").addEventListener("submit", saveScores);

  qs("#adminEntityModal").addEventListener("click", (event) => {
    if (event.target === qs("#adminEntityModal")) closeEntityModal();
  });

  qs("#adminScoresModal").addEventListener("click", (event) => {
    if (event.target === qs("#adminScoresModal")) closeScoresModal();
  });

  qs("#adminView").addEventListener("click", (event) => {
    const historyLink = event.target.closest("[data-nav-history]");
    if (historyLink && historyNavigation) {
      const { navHistory, navValue } = historyLink.dataset;
      if (navHistory === "player") historyNavigation.openPlayerHistory(navValue);
      if (navHistory === "game") historyNavigation.openGameHistory(navValue);
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit-player") {
      openPlayerModal(players.find((item) => item.id === id));
    }
    if (action === "delete-player") {
      removeRecord("player", id);
    }
    if (action === "edit-game") {
      const game = games.find((item) => item.id === id);
      openGameModalRef({
        mode: "edit",
        id: game.id,
        name: game.nazwa,
        type: game.rodzaj,
        minPlayers: game.min_graczy,
        maxPlayers: game.max_graczy,
        winType: game.rodzaj_wygranej,
        onSaved: refreshAdminPanel,
      });
    }
    if (action === "delete-game") {
      removeRecord("game", id);
    }
    if (action === "delete-match") {
      removeRecord("match", id);
    }
    if (action === "edit-scores") {
      openScoresModal(id);
    }
  });
}

export async function loadAdminPanel(options = {}) {
  openGameModalRef = options.openGameModal;
  historyNavigation = options.historyNavigation || null;
  bindButtons();
  await refreshAdminPanel();
}

export { refreshAdminPanel };

window.addEventListener("language-changed", () => {
  if (players.length || games.length || matches.length) {
    renderPlayers();
    renderGames();
    renderMatches();
  }
});
