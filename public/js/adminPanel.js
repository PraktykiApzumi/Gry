import { qs, qsa } from "./dom.js";
import { attachAutocomplete } from "./autocomplete.js";
import { deleteRequest, getRequest, postJson, putJson } from "./api.js";
import { normalizeGame, normalizeUser, escapeHtml } from "./utils.js";

let players = [];
let games = [];
let matches = [];
let scoresByMatch = {};
let modalType = "";
let modalId = 0;
let activeMatchId = 0;
let openGameModalRef = null;

function showToast(message, variant = "success") {
  const existing = document.querySelector(".inline-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `inline-toast is-${variant}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function emptyRow(cols, text) {
  return `<tr><td colspan="${cols}" class="admin-empty">${text}</td></tr>`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pl-PL");
}

function showPanel(name) {
  qsa("#adminView .admin-tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminPanel === name);
  });
  qsa("#adminView .admin-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === name);
  });
}

async function refreshAdminPanel() {
  players = (await getRequest("api/admin/players")).data || [];
  games = (await getRequest("api/admin/games")).data || [];
  matches = (await getRequest("api/admin/matches")).data || [];

  scoresByMatch = {};
  for (const match of matches) {
    scoresByMatch[match.id] = (await getRequest(`api/admin/scores/${match.id}`)).data || [];
  }

  renderPlayers();
  renderGames();
  renderMatches();
}

function renderPlayers() {
  qs("#adminPlayersBody").innerHTML = players.length
    ? players.map((player) => `
      <tr>
        <td>${player.id}</td>
        <td>${escapeHtml(player.nick)}</td>
        <td class="actions-cell">
          <div class="admin-actions">
            <button type="button" class="btn-edit" data-action="edit-player" data-id="${player.id}">Modyfikuj</button>
            <button type="button" class="btn-delete" data-action="delete-player" data-id="${player.id}">Usun</button>
          </div>
        </td>
      </tr>
    `).join("")
    : emptyRow(3, "Brak graczy");
}

function renderGames() {
  qs("#adminGamesBody").innerHTML = games.length
    ? games.map((game) => `
      <tr>
        <td>${game.id}</td>
        <td>${escapeHtml(game.nazwa)}</td>
        <td>${escapeHtml(game.rodzaj)}</td>
        <td>${game.min_graczy}</td>
        <td>${game.max_graczy}</td>
        <td>${escapeHtml(game.rodzaj_wygranej)}</td>
        <td class="actions-cell">
          <div class="admin-actions">
            <button type="button" class="btn-edit" data-action="edit-game" data-id="${game.id}">Modyfikuj</button>
            <button type="button" class="btn-delete" data-action="delete-game" data-id="${game.id}">Usun</button>
          </div>
        </td>
      </tr>
    `).join("")
    : emptyRow(7, "Brak gier");
}

function renderMatches() {
  qs("#adminMatchesBody").innerHTML = matches.length
    ? matches.map((match) => `
      <tr>
        <td>${match.id}</td>
        <td>${formatDate(match.data)}</td>
        <td>${normalizeGame(match.game_name)}</td>
        <td>${normalizeUser(match.winner_nick)}</td>
        <td>${match.ilosc_graczy}</td>
        <td>
          <div class="score-list">
            ${(scoresByMatch[match.id] || []).map((score) => `<span class="score-chip">${normalizeUser(score.player_nick)}: ${score.liczba_punktow}</span>`).join("")}
            ${(scoresByMatch[match.id] || []).length ? `<button type="button" class="btn-score-edit" data-action="edit-scores" data-id="${match.id}">Edytuj wyniki</button>` : `<span class="admin-muted">Brak wynikow</span>`}
          </div>
        </td>
        <td class="actions-cell">
          <div class="admin-actions">
            <button type="button" class="btn-edit" data-action="edit-match" data-id="${match.id}">Modyfikuj</button>
            <button type="button" class="btn-delete" data-action="delete-match" data-id="${match.id}">Usun</button>
          </div>
        </td>
      </tr>
    `).join("")
    : emptyRow(7, "Brak rozgrywek");
}

function openEntityModal(title, html, type, id = 0) {
  modalType = type;
  modalId = id;
  qs("#adminEntityModalTitle").textContent = title;
  qs("#adminEntityFields").innerHTML = html;
  qs("#adminEntityModal").style.display = "flex";
}

function closeEntityModal() {
  modalType = "";
  modalId = 0;
  qs("#adminEntityForm").reset();
  qs("#adminEntityFields").innerHTML = "";
  qs("#adminEntityModal").style.display = "none";
}

function openPlayerModal(player) {
  openEntityModal(
    player ? "Modyfikuj gracza" : "Dodaj gracza",
    `
      <div class="admin-form-field">
        <label class="field-label" for="adminPlayerName">Nick gracza</label>
        <input type="text" id="adminPlayerName" name="name" placeholder="Nick gracza..." value="${player ? escapeHtml(player.nick) : ""}" required />
      </div>
    `,
    "player",
    player ? player.id : 0
  );
}

function openMatchModal(match) {
  openEntityModal(
    "Modyfikuj rozgrywke",
    `
      <div class="admin-form-field">
        <label class="field-label" for="adminMatchGameName">Nazwa gry</label>
        <input type="text" id="adminMatchGameName" name="gameName" placeholder="Nazwa gry..." value="${escapeHtml(match.game_name)}" required />
      </div>
      <div class="admin-form-field">
        <label class="field-label" for="adminMatchWinnerName">Nick zwycięzcy</label>
        <input type="text" id="adminMatchWinnerName" name="winnerName" placeholder="Nick zwyciezcy..." value="${escapeHtml(match.winner_nick)}" required />
      </div>
      <div class="admin-form-field">
        <label class="field-label" for="adminMatchPlayerCount">Liczba graczy</label>
        <input type="number" id="adminMatchPlayerCount" name="playerCount" min="1" max="20" placeholder="Liczba graczy" value="${match.ilosc_graczy}" required />
      </div>
    `,
    "match",
    match.id
  );

  attachAutocomplete(qs('#adminEntityFields [name="gameName"]'), (value) => `api/suggest/game/${encodeURIComponent(value)}`, { label: "admin:game", maxSuggestions: 3 });
  attachAutocomplete(qs('#adminEntityFields [name="winnerName"]'), (value) => `api/suggest/player/${encodeURIComponent(value)}`, { label: "admin:player", maxSuggestions: 3 });
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
        playerCount
      });
    }

    closeEntityModal();
    await refreshAdminPanel();
    showToast("Zapisano zmiany.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Nie udalo sie zapisac danych.", "error");
  }
}

function openScoresModal(matchId) {
  const match = matches.find((item) => item.id === matchId);
  const scores = scoresByMatch[matchId] || [];
  const isOtherWinType = match.rodzaj_wygranej === "inna";

  activeMatchId = matchId;
  qs("#adminScoresModalTitle").textContent = isOtherWinType ? `Zwyciezca rozgrywki #${match.id}` : `Wyniki rozgrywki #${match.id}`;
  qs("#adminScoresMeta").innerHTML = `
    <div><strong>Gra:</strong> ${escapeHtml(match.game_name)}</div>
    <div><strong>Zwyciezca:</strong> ${escapeHtml(match.winner_nick)}</div>
    <div><strong>Data:</strong> ${formatDate(match.data)}</div>
  `;
  qs("#adminScoresFields").innerHTML = scores.map((score) => `
    <div class="admin-score-row">
      <div class="admin-score-name">${escapeHtml(score.player_nick)}</div>
      ${isOtherWinType ? `
        <label class="winner-radio-label">
          <input type="radio" name="winnerId" value="${score.id_gracza}" ${Number(score.id_gracza) === Number(match.id_zwyciezcy) ? "checked" : ""} required />
          Zwyciezca
        </label>
      ` : `
        <input type="number" min="0" name="score-${score.id}" value="${score.liczba_punktow}" required />
      `}
    </div>
  `).join("");
  qs("#adminScoresSaveBtn").textContent = isOtherWinType ? "Zapisz zwyciezce" : "Zapisz wyniki";
  qs("#adminScoresModal").style.display = "flex";
}

function closeScoresModal() {
  activeMatchId = 0;
  qs("#adminScoresForm").reset();
  qs("#adminScoresMeta").innerHTML = "";
  qs("#adminScoresFields").innerHTML = "";
  qs("#adminScoresSaveBtn").textContent = "Zapisz wyniki";
  qs("#adminScoresModal").style.display = "none";
}

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
          points
        });
        const isBetter = match.rodzaj_wygranej === "punktowa-malejaca"
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
      playerCount: match.ilosc_graczy
    });

    closeScoresModal();
    await refreshAdminPanel();
    showToast("Zapisano wyniki.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Nie udalo sie zapisac wynikow.", "error");
  }
}

async function removeRecord(type, id) {
  if (!window.confirm("Czy na pewno chcesz usunac ten rekord?")) return;
  await deleteRequest(`api/${type}/${id}`);
  await refreshAdminPanel();
  showToast("Usunięto rekord.");
}

function openAddMatchView() {
  qsa(".view").forEach((view) => {
    view.classList.toggle("active", view.id === "addView");
  });
  qsa(".tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === "addView");
  });
}

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
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit-player") openPlayerModal(players.find((item) => item.id === id));
    if (action === "delete-player") removeRecord("player", id);
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
        onSaved: refreshAdminPanel
      });
    }
    if (action === "delete-game") removeRecord("game", id);
    if (action === "edit-match") openMatchModal(matches.find((item) => item.id === id));
    if (action === "delete-match") removeRecord("match", id);
    if (action === "edit-scores") openScoresModal(id);
  });
}

export async function loadAdminPanel(options = {}) {
  openGameModalRef = options.openGameModal;
  bindButtons();
  await refreshAdminPanel();
}

export { refreshAdminPanel };
