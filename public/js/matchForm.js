import { toInt } from "./utils.js";
import { getRequest, postJson } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";

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

export function initMatchForm({
  matchForm,
  gameNameInput,
  maxPlayersInput,
  playersLabel,
  playersContainer,
  openGameModal
}) {
  const defaultMaxPlayersMin = Number(maxPlayersInput.min) || 1;
  const defaultMaxPlayersMax = Number(maxPlayersInput.max) || 10;
  const defaultMaxPlayersValue = toInt(maxPlayersInput.value) || defaultMaxPlayersMin;

  let gameConstraintsRequestId = 0;
  let hasResolvedGameConstraints = false;

  function toggleMatchPlayersFields(visible) {
    maxPlayersInput.style.display = visible ? "block" : "none";
    if (playersLabel) {
      playersLabel.style.display = visible ? "block" : "none";
    }
    if (!visible) {
      playersContainer.innerHTML = "";
    }
  }

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
    if (!hasResolvedGameConstraints) {
      playersContainer.innerHTML = "";
      return;
    }

    const minAllowed = Number(maxPlayersInput.min) || 1;
    const maxAllowed = Number(maxPlayersInput.max) || 10;
    const count = toInt(maxPlayersInput.value) || minAllowed;
    const safeCount = Math.max(minAllowed, Math.min(maxAllowed, count));
    if (safeCount !== count) {
      maxPlayersInput.value = String(safeCount);
    }

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

  function setMaxPlayersRange(minPlayers, maxPlayers) {
    maxPlayersInput.min = String(minPlayers);
    maxPlayersInput.max = String(maxPlayers);
    maxPlayersInput.placeholder = `Liczba graczy (${minPlayers}-${maxPlayers})`;
    maxPlayersInput.value = "";
    hasResolvedGameConstraints = true;
    toggleMatchPlayersFields(true);
    renderPlayers();
  }

  function clearMaxPlayersRange() {
    maxPlayersInput.min = String(defaultMaxPlayersMin);
    maxPlayersInput.max = String(defaultMaxPlayersMax);
    maxPlayersInput.placeholder = "Liczba graczy";
    maxPlayersInput.value = String(defaultMaxPlayersValue);
    hasResolvedGameConstraints = false;
    toggleMatchPlayersFields(false);
  }

  async function syncGamePlayerConstraints(gameNameRaw) {
    const gameName = gameNameRaw.trim();
    if (!gameName) {
      clearMaxPlayersRange();
      return;
    }

    const requestId = ++gameConstraintsRequestId;
    try {
      const gameDataResponse = await getRequest(`api/game/${encodeURIComponent(gameName)}`);
      if (requestId !== gameConstraintsRequestId) return;

      const gameData = gameDataResponse?.gameData ?? {};
      const minPlayers = toInt(gameData.min_graczy ?? gameData.minPlayers);
      const maxPlayers = toInt(gameData.max_graczy ?? gameData.maxPlayers);

      if (
        Number.isInteger(minPlayers) &&
        Number.isInteger(maxPlayers) &&
        minPlayers >= 1 &&
        maxPlayers >= minPlayers
      ) {
        setMaxPlayersRange(minPlayers, maxPlayers);
        return;
      }

      clearMaxPlayersRange();
    } catch {
      if (requestId !== gameConstraintsRequestId) return;
      clearMaxPlayersRange();
    }
  }

  attachAutocomplete(
    gameNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    {
      label: "game:add-match",
      maxSuggestions: 3,
      emptyLabel: "Dodaj gre",
      onSelect: (selectedGameName) => {
        syncGamePlayerConstraints(selectedGameName);
      },
      onEmptySelect: async (gameName) => {
        const gameNameValue = gameName.trim();
        if (!gameNameValue) return;
        openGameModal(gameNameValue);
      }
    }
  );

  clearMaxPlayersRange();
  gameNameInput.addEventListener("blur", () => {
    syncGamePlayerConstraints(gameNameInput.value);
  });
  gameNameInput.addEventListener("input", () => {
    hasResolvedGameConstraints = false;
    toggleMatchPlayersFields(false);
  });
  maxPlayersInput.addEventListener("input", renderPlayers);

  window.addEventListener("game-created", (event) => {
    const detail = event?.detail ?? {};
    const gameName = typeof detail.name === "string" ? detail.name.trim() : "";
    const minPlayers = toInt(detail.minPlayers);
    const maxPlayers = toInt(detail.maxPlayers);

    if (!gameName) return;

    gameNameInput.value = gameName;
    if (
      Number.isInteger(minPlayers) &&
      Number.isInteger(maxPlayers) &&
      minPlayers >= 1 &&
      maxPlayers >= minPlayers
    ) {
      setMaxPlayersRange(minPlayers, maxPlayers);
      return;
    }

    syncGamePlayerConstraints(gameName);
  });

  matchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const gameName = gameNameInput.value.trim();
    if (!hasResolvedGameConstraints) {
      await syncGamePlayerConstraints(gameName);
    }
    if (!hasResolvedGameConstraints) {
      alert("Najpierw wybierz poprawna gre z bazy, aby ustawic liczbe graczy.");
      return;
    }

    const players = Array.from(playersContainer.querySelectorAll(".player-card")).map((card) => ({
      name: card.querySelector(".player-name").value.trim(),
      points: toInt(card.querySelector(".player-points").value)
    }));

    const matchPayload = { gameName, players };
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
}
