import { qs, qsa } from "./js/dom.js";
import { toInt } from "./js/utils.js";
import { getRequest, postJson } from "./js/api.js";
import { attachAutocomplete } from "./js/autocomplete.js";
import { initModals, openGameModal } from "./modals.js";

function validateMatchPayload(payload) {
  const errors = [];
  const containsLetter = (value) => /[a-zA-Z]/.test(value);

  if (payload.gameName.length < 2 || payload.gameName.length > 100) {
    errors.push("Nazwa gry musi miec od 2 do 100 znakow.");
  }

  if (!Array.isArray(payload.players) || payload.players.length === 0) {
    errors.push("Lista graczy nie moze byc pusta.");
    return errors;
  }

  payload.players.forEach((player, index) => {
    if (player.name.length < 2 || player.name.length > 100) {
      errors.push(`Gracz ${index + 1}: nazwa musi miec od 2 do 100 znakow.`);
    } else if (!containsLetter(player.name)) {
      errors.push(`Gracz ${index + 1}: nazwa musi zawierac litery, nie same cyfry.`);
    }
    if (!Number.isInteger(player.points) || player.points < 0) {
      errors.push(`Gracz ${index + 1}: punkty musza byc liczba calkowita >= 0.`);
    }
  });

  return errors;
}

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = qsa(".tab-btn");
  const viewPanels = qsa(".view");
  const matchForm = qs("#matchForm");
  const gameNameInput = qs("#gameName");
  const maxPlayersInput = qs("#maxPlayers");
  const playersContainer = qs("#playersRow");
  const statsForm = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const tableBody = qs("#tableBody");
  const filterButtons = qsa(".filter-btn");

  let currentFilter = "points";
  initModals();

  attachAutocomplete(
    gameNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    {
      label: "game:add-match",
      maxSuggestions: 3,
      emptyLabel: "Dodaj gre",
      onEmptySelect: async (gameName) => {
        const gameNameValue = gameName.trim();
        if (!gameNameValue) return;
        openGameModal(gameNameValue);
      }
    }
  );

  attachAutocomplete(
    statsNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    {
      label: "game:stats",
      maxSuggestions: 3
    }
  );

  function attachPlayerAutocomplete(card) {
    const playerNameInput = card.querySelector(".player-name");
    attachAutocomplete(
      playerNameInput,
      (value) => `api/suggest/player/${encodeURIComponent(value)}`,
      {
        label: "player:match",
        maxSuggestions: 3,
        emptyLabel: "Dodaj gracza",
        onEmptySelect: async (playerName) => {
          const trimmedName = playerName.trim();
          if (!trimmedName) return;
          playerNameInput.style.borderColor = "";
          try {
            const created = await postJson("api/player", { name: trimmedName });
            console.log("[gracz zapisany — backend]", created);
            playerNameInput.value = trimmedName;
          } catch (err) {
            playerNameInput.style.borderColor = "red";
            console.warn("[api/player]", err instanceof Error ? err.message : err);
          }
        }
      }
    );
  }

  function renderPlayers() {
    const count = toInt(maxPlayersInput.value) || 1;
    const safeCount = Math.max(1, Math.min(10, count));
    playersContainer.innerHTML = "";
    for (let i = 0; i < safeCount; i++) {
      const card = document.createElement("div");
      card.className = "player-card";
      card.innerHTML = `
        <div class="field-label">Gracz ${i + 1}</div>
        <input type="text" class="player-name" placeholder="Nazwa gracza" required>
        <input type="number" class="player-points" placeholder="Punkty" min="0" required>
      `;

      attachPlayerAutocomplete(card);
      playersContainer.appendChild(card);
    }
  }

  function showView(viewId) {
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === viewId);
    });

    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === viewId);
    });
  }

  async function loadStats() {
    const gameName = statsNameInput.value.trim();
    if (gameName.length < 2 || gameName.length > 100) {
      alert("Nazwa gry musi miec od 2 do 100 znakow.");
      return;
    }

    const encodedName = encodeURIComponent(gameName);
    const endpoint = `api/stats/${currentFilter}/${encodedName}`;

    try {
      const statsData = await getRequest(endpoint);
        const rows = statsData.data;

        if (!rows || rows.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999;">Brak danych</td></tr>`;
          return;
        }

        tableBody.innerHTML = rows.map((row) => `
          <tr>
            <td>${row.nick}</td>
            <td>${gameName}</td>
            <td>${row.total_points ?? 0}</td>
            <td>${row.wins ?? 0}</td>
            <td>${row.played_games ?? 0}</td>
          </tr>
        `).join("");
    } catch (err) {
      if (err instanceof Error && err.message) {
        alert(err.message);
        return;
      }
      alert("Nie mozna teraz pobrac statystyk.");
    }
  }

  renderPlayers();
  maxPlayersInput.addEventListener("input", renderPlayers);
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });
    });
  });

  matchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const gameName = gameNameInput.value.trim();

    const players = qsa(".player-card")
      .map((card) => ({
        name: card.querySelector(".player-name").value.trim(),
        points: toInt(card.querySelector(".player-points").value)
      }));

    const matchPayload = {
      gameName,
      players
    };

    const validationErrors = validateMatchPayload(matchPayload);
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    try {
      const matchRes = await postJson("api/match", matchPayload);
      console.log("[mecz zapisany — backend]", matchRes);
    } catch (err) {
      if (err instanceof Error && err.message) {
        alert(err.message);
        return;
      }
      alert("Nie mozna teraz wyslac danych.");
    }
  });

  statsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadStats();
  });
});
