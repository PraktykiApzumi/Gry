import { qs, qsa } from "./dom.js";

const adminData = {
  players: [
    { id: 1, nick: "PlayerOne" },
    { id: 2, nick: "Marta" },
    { id: 3, nick: "Kamil" }
  ],
  games: [
    {
      id: 1,
      nazwa: "Catan",
      rodzaj: "Strategiczna",
      min_graczy: 3,
      max_graczy: 4,
      rodzaj_wygranej: "Punktowa"
    },
    {
      id: 2,
      nazwa: "Uno",
      rodzaj: "Karciana",
      min_graczy: 2,
      max_graczy: 10,
      rodzaj_wygranej: "Punktowa malejaca"
    }
  ],
  matches: [
    {
      id: 12,
      id_gry: 1,
      game_name: "Catan",
      id_zwyciezcy: 2,
      winner_nick: "Marta",
      data: "2026-05-13 08:20:00",
      ilosc_graczy: 4,
      scores: [
        { id: 41, id_rozgrywki: 12, id_gracza: 2, player_nick: "Marta", liczba_punktow: 12 },
        { id: 42, id_rozgrywki: 12, id_gracza: 1, player_nick: "PlayerOne", liczba_punktow: 9 },
        { id: 43, id_rozgrywki: 12, id_gracza: 3, player_nick: "Kamil", liczba_punktow: 7 }
      ]
    },
    {
      id: 11,
      id_gry: 2,
      game_name: "Uno",
      id_zwyciezcy: 1,
      winner_nick: "PlayerOne",
      data: "2026-05-12 19:45:00",
      ilosc_graczy: 3,
      scores: [
        { id: 37, id_rozgrywki: 11, id_gracza: 1, player_nick: "PlayerOne", liczba_punktow: 0 },
        { id: 38, id_rozgrywki: 11, id_gracza: 2, player_nick: "Marta", liczba_punktow: 24 },
        { id: 39, id_rozgrywki: 11, id_gracza: 3, player_nick: "Kamil", liczba_punktow: 36 }
      ]
    }
  ]
};

function actionButtons() {
  return `
    <div class="admin-actions">
      <button type="button" class="btn-edit">Modyfikuj</button>
      <button type="button" class="btn-delete">Usun</button>
    </div>
  `;
}

function emptyRow(colspan, label) {
  return `<tr><td colspan="${colspan}" class="admin-empty">${label}</td></tr>`;
}

function renderPlayers() {
  const body = qs("#adminPlayersBody");
  if (!body) return;

  body.innerHTML = adminData.players.length
    ? adminData.players.map((player) => `
      <tr>
        <td>${player.id}</td>
        <td>${player.nick}</td>
        <td class="actions-cell">${actionButtons()}</td>
      </tr>
    `).join("")
    : emptyRow(3, "Brak graczy");
}

function renderGames() {
  const body = qs("#adminGamesBody");
  if (!body) return;

  body.innerHTML = adminData.games.length
    ? adminData.games.map((game) => `
      <tr>
        <td>${game.id}</td>
        <td>${game.nazwa}</td>
        <td>${game.rodzaj}</td>
        <td>${game.min_graczy}</td>
        <td>${game.max_graczy}</td>
        <td>${game.rodzaj_wygranej}</td>
        <td class="actions-cell">${actionButtons()}</td>
      </tr>
    `).join("")
    : emptyRow(7, "Brak gier");
}

function scoreList(scores) {
  return `
    <div class="score-list">
      ${scores.map((score) => `
        <span class="score-chip">${score.player_nick}: ${score.liczba_punktow}</span>
      `).join("")}
    </div>
  `;
}

function renderMatches() {
  const body = qs("#adminMatchesBody");
  if (!body) return;

  body.innerHTML = adminData.matches.length
    ? adminData.matches.map((match) => `
      <tr>
        <td>${match.id}</td>
        <td>${match.data}</td>
        <td>${match.game_name}</td>
        <td>${match.winner_nick}</td>
        <td>${match.ilosc_graczy}</td>
        <td>${scoreList(match.scores)}</td>
        <td class="actions-cell">${actionButtons()}</td>
      </tr>
    `).join("")
    : emptyRow(7, "Brak rozgrywek");
}

function showAdminPanel(panelName) {
  qsa("#adminView .admin-tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminPanel === panelName);
  });

  qsa("#adminView .admin-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.adminPanel === panelName);
  });
}

export function loadAdminPanel() {
  qsa("#adminView .admin-tab-btn").forEach((button) => {
    button.addEventListener("click", () => showAdminPanel(button.dataset.adminPanel));
  });

  renderPlayers();
  renderGames();
  renderMatches();
}
