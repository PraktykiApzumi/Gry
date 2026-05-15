import { toInt } from "./utils.js";
import { getRequest, postJson } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";

function validateMatchPayload(payload, winType = "punktowa") {
  const errors = [];
  const containsLetter = (value) => /[a-zA-Z]/.test(value);
  const seenNames = new Set();

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
    } else {
      const normalizedName = player.name.toLocaleLowerCase("pl-PL");
      if (seenNames.has(normalizedName)) {
        errors.push(`Gracz ${index + 1}: ten sam gracz nie moze byc dodany dwa razy.`);
      } else {
        seenNames.add(normalizedName);
      }
    }

    if (winType !== "inna" && (!Number.isInteger(player.points) || player.points < 0)) {
      errors.push(`Gracz ${index + 1}: punkty musza byc liczba calkowita >= 0.`);
    }
  });

  if (winType === "inna") {
    const winnerName = String(payload.winnerName || "").trim();
    const hasWinner = payload.players.some((player) => player.name === winnerName);
    if (!hasWinner) {
      errors.push("Wybierz zwyciezce rozgrywki.");
    }
  }

  return errors;
}

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

function getErrorEl(input) {
  const nextEl = input.nextElementSibling;
  return nextEl && nextEl.classList.contains("field-error") ? nextEl : null;
}

function setFieldError(input, message = "") {
  if (!input) return;
  input.classList.toggle("field-input-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  const errorEl = getErrorEl(input);
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(input) {
  setFieldError(input, "");
}

function getPlayerValues(playersContainer) {
  return Array.from(playersContainer.querySelectorAll(".player-card")).map((card) => ({
    name: card.querySelector(".player-name")?.value ?? "",
    points: card.querySelector(".player-points")?.value ?? "",
    winner: Boolean(card.querySelector(".winner-radio")?.checked)
  }));
}

function findDuplicatePlayerNames(players) {
  const counts = new Map();

  players.forEach((player) => {
    if (player.name.length < 2 || !/[a-zA-Z]/.test(player.name)) return;
    const normalizedName = player.name.toLocaleLowerCase("pl-PL");
    counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
  });

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );
}

export function initMatchForm({
  matchForm,
  gameNameInput,
  maxPlayersInput,
  maxPlayersLabel,
  playersLabel,
  playersContainer,
  openGameModal
}) {
  const defaultMaxPlayersMin = Number(maxPlayersInput.min) || 1;
  const defaultMaxPlayersMax = Number(maxPlayersInput.max) || 10;
  const defaultMaxPlayersValue = toInt(maxPlayersInput.value) || defaultMaxPlayersMin;

  let gameConstraintsRequestId = 0;
  let hasResolvedGameConstraints = false;
  let currentWinType = "punktowa";
  let savedPlayers = [];

  function saveVisiblePlayers() {
    const visiblePlayers = getPlayerValues(playersContainer);
    visiblePlayers.forEach((player, index) => {
      savedPlayers[index] = player;
    });
  }

  function toggleMatchPlayersFields(visible) {
    maxPlayersInput.style.display = visible ? "block" : "none";
    if (maxPlayersLabel) {
      maxPlayersLabel.style.display = visible ? "block" : "none";
    }
    if (playersLabel) {
      playersLabel.style.display = visible ? "block" : "none";
    }
    if (!visible) {
      saveVisiblePlayers();
      playersContainer.innerHTML = "";
      clearFieldError(maxPlayersInput);
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
          clearFieldError(playerNameInput);
          try {
            await postJson("api/player", { name: trimmedName });
            playerNameInput.value = trimmedName;
            showToast(`Dodano gracza "${trimmedName}".`);
          } catch {
            setFieldError(playerNameInput, "Nie udalo sie dodac tego gracza.");
            showToast("Nie udalo sie dodac gracza.", "error");
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

    saveVisiblePlayers();
    playersContainer.innerHTML = "";

    for (let i = 0; i < safeCount; i++) {
      const player = savedPlayers[i] || {};
      const card = document.createElement("div");
      card.className = "player-card";
      const isOtherWinType = currentWinType === "inna";
      card.innerHTML = `
        <div class="field-label">Gracz ${i + 1}</div>
        <input type="text" class="player-name" placeholder="Nazwa gracza" value="${player.name || ""}" required>
        <div class="field-error" aria-live="polite"></div>
        ${isOtherWinType ? `
          <label class="winner-radio-label">
            <input type="radio" name="winnerName" class="winner-radio" value="${player.name || ""}" ${player.winner ? "checked" : ""}>
            Zwyciezca
          </label>
        ` : `
          <input type="number" class="player-points" placeholder="Punkty" min="0" value="${player.points || ""}" required>
        `}
        <div class="field-error" aria-live="polite"></div>
      `;

      attachPlayerAutocomplete(card);
      card.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => clearFieldError(input));
      });
      const nameInput = card.querySelector(".player-name");
      const winnerRadio = card.querySelector(".winner-radio");
      if (nameInput && winnerRadio) {
        nameInput.addEventListener("input", () => {
          winnerRadio.value = nameInput.value.trim();
        });
      }
      playersContainer.appendChild(card);
    }
  }

  function setMaxPlayersRange(minPlayers, maxPlayers, winType = "punktowa") {
    maxPlayersInput.min = String(minPlayers);
    maxPlayersInput.max = String(maxPlayers);
    maxPlayersInput.placeholder = `Liczba graczy (${minPlayers}-${maxPlayers})`;
    maxPlayersInput.value = "";
    currentWinType = winType || "punktowa";
    hasResolvedGameConstraints = true;
    clearFieldError(gameNameInput);
    toggleMatchPlayersFields(true);
    renderPlayers();
  }

  function clearMaxPlayersRange() {
    saveVisiblePlayers();
    savedPlayers = [];
    maxPlayersInput.min = String(defaultMaxPlayersMin);
    maxPlayersInput.max = String(defaultMaxPlayersMax);
    maxPlayersInput.placeholder = "Liczba graczy";
    maxPlayersInput.value = String(defaultMaxPlayersValue);
    currentWinType = "punktowa";
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
      const winType = gameData.rodzaj_wygranej ?? gameData.winType ?? "punktowa";

      if (
        Number.isInteger(minPlayers) &&
        Number.isInteger(maxPlayers) &&
        minPlayers >= 1 &&
        maxPlayers >= minPlayers
      ) {
        setMaxPlayersRange(minPlayers, maxPlayers, winType);
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
    clearFieldError(gameNameInput);
    hasResolvedGameConstraints = false;
    toggleMatchPlayersFields(false);
  });

  maxPlayersInput.addEventListener("input", () => {
    clearFieldError(maxPlayersInput);
    renderPlayers();
  });

  window.addEventListener("game-created", (event) => {
    const detail = event?.detail ?? {};
    const gameName = typeof detail.name === "string" ? detail.name.trim() : "";
    const minPlayers = toInt(detail.minPlayers);
    const maxPlayers = toInt(detail.maxPlayers);
    const winType = detail.winType || "punktowa";

    if (!gameName) return;

    gameNameInput.value = gameName;
    savedPlayers = [];
    if (
      Number.isInteger(minPlayers) &&
      Number.isInteger(maxPlayers) &&
      minPlayers >= 1 &&
      maxPlayers >= minPlayers
    ) {
      setMaxPlayersRange(minPlayers, maxPlayers, winType);
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
      setFieldError(gameNameInput, "Wybierz istniejaca gre z bazy albo dodaj ja najpierw.");
      return;
    }

    const players = Array.from(playersContainer.querySelectorAll(".player-card")).map((card) => ({
      nameInput: card.querySelector(".player-name"),
      pointsInput: card.querySelector(".player-points"),
      winnerInput: card.querySelector(".winner-radio"),
      name: card.querySelector(".player-name").value.trim(),
      points: currentWinType === "inna" ? 0 : toInt(card.querySelector(".player-points").value),
      winner: Boolean(card.querySelector(".winner-radio")?.checked)
    }));
    saveVisiblePlayers();

    const matchPayload = {
      gameName,
      players: players.map(({ name, points }) => ({ name, points }))
    };
    if (currentWinType === "inna") {
      matchPayload.winnerName = players.find((player) => player.winner)?.name || "";
    }

    const validationErrors = validateMatchPayload(matchPayload, currentWinType);
    if (validationErrors.length > 0) {
      if (currentWinType === "inna" && !matchPayload.winnerName) {
        showToast("Wybierz zwyciezce rozgrywki.", "error");
      }

      if (gameName.length < 2 || gameName.length > 100) {
        setFieldError(gameNameInput, "Nazwa gry musi miec od 2 do 100 znakow.");
      }

      const duplicateNames = findDuplicatePlayerNames(players);

      players.forEach((player, index) => {
        clearFieldError(player.nameInput);
        clearFieldError(player.pointsInput);

        if (player.name.length < 2 || player.name.length > 100) {
          setFieldError(player.nameInput, `Gracz ${index + 1}: nazwa musi miec od 2 do 100 znakow.`);
        } else if (!/[a-zA-Z]/.test(player.name)) {
          setFieldError(player.nameInput, `Gracz ${index + 1}: nazwa musi zawierac litery.`);
        } else if (duplicateNames.has(player.name.toLocaleLowerCase("pl-PL"))) {
          setFieldError(player.nameInput, `Gracz ${index + 1}: ten sam gracz nie moze byc dodany dwa razy.`);
        }

        if (currentWinType !== "inna" && (!Number.isInteger(player.points) || player.points < 0)) {
          setFieldError(player.pointsInput, `Gracz ${index + 1}: podaj liczbe punktow 0 lub wieksza.`);
        }
      });
      return;
    }

    try {
      await postJson("api/match", matchPayload);

      gameNameInput.value = "";
      clearMaxPlayersRange();

      showToast("Dodano rozgrywke do bazy.");
    } catch (err) {
      if (err instanceof Error && err.message) {
        showToast(err.message, "error");
        return;
      }
      showToast("Nie mozna teraz wyslac danych.", "error");
    }
  });
}
