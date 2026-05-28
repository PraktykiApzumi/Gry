import { toInt, escapeHtml } from "./utils.js";
import { getRequest, postJson } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import { t } from "./i18n.js";

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

const setFieldError = (input) => {
  if (!input) return;
  input.classList.add("field-input-error");
  input.setAttribute("aria-invalid", "true");
};

const clearFieldError = (input) => {
  if (!input) return;
  input.classList.remove("field-input-error");
  input.setAttribute("aria-invalid", "false");
};

const getPlayerValues = (playersContainer) =>
  Array.from(playersContainer.querySelectorAll(".player-card")).map((card) => ({
    name: card.querySelector(".player-name")?.value ?? "",
    points: card.querySelector(".player-points")?.value ?? "",
    winner: Boolean(card.querySelector(".winner-radio")?.checked),
  }));

const findDuplicatePlayerNames = (players) => {
  const counts = new Map();

  players.forEach((player) => {
    const trimmedName = player.name.trim();
    if (trimmedName.length < 2) return;

    const normalizedName = trimmedName.toLocaleLowerCase("pl-PL");
    counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
  });

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name),
  );
};

export function initMatchForm({
  matchForm,
  gameNameInput,
  maxPlayersInput,
  maxPlayersLabel,
  playersLabel,
  playersContainer,
  openGameModal,
}) {
  const defaultMaxPlayersMin = Number(maxPlayersInput.min) || 1;
  const defaultMaxPlayersMax = Number(maxPlayersInput.max) || 10;
  const defaultMaxPlayersValue = toInt(maxPlayersInput.value) || defaultMaxPlayersMin;

  let gameConstraintsRequestId = 0;
  let hasResolvedGameConstraints = false;
  let currentWinType = "punktowa";
  let savedPlayers = [];

  const saveVisiblePlayers = () => {
    getPlayerValues(playersContainer).forEach((player, index) => {
      savedPlayers[index] = player;
    });
  };

  const toggleMatchPlayersFields = (visible) => {
    maxPlayersInput.style.display = visible ? "block" : "none";
    if (maxPlayersLabel) maxPlayersLabel.style.display = visible ? "block" : "none";
    if (playersLabel) playersLabel.style.display = visible ? "block" : "none";

    if (!visible) {
      saveVisiblePlayers();
      playersContainer.innerHTML = "";
      clearFieldError(maxPlayersInput);
    }
  };

  function attachPlayerAutocomplete(card) {
    const playerNameInput = card.querySelector(".player-name");

    attachAutocomplete(playerNameInput, (value) => `api/suggest/player/${encodeURIComponent(value)}`, {
      label: "player:match",
      maxSuggestions: 3,
      emptyLabel: t("add"),
      onEmptySelect: async (playerName) => {
        const trimmedName = playerName.trim();
        if (!trimmedName) return;

        clearFieldError(playerNameInput);
        try {
          await postJson("api/player", { name: trimmedName });
          playerNameInput.value = trimmedName;
          toast(`${t("addPlayerSuccess")}: "${trimmedName}".`);
        } catch {
          setFieldError(playerNameInput);
          toast(t("playerExists"), "error");
        }
      },
    });
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

    for (let index = 0; index < safeCount; index++) {
      const player = savedPlayers[index] || {};
      const card = document.createElement("div");
      card.className = "player-card";
      const isOtherWinType = currentWinType === "inna";

      card.innerHTML = `
        <div class="field-label">${t("playerPrefix")} ${index + 1}</div>
        <input
          type="text"
          class="player-name"
          placeholder="${t("playerNamePlaceholder")}"
          value="${escapeHtml(player.name || "")}"
          required
        >
        <div class="field-error" aria-live="polite"></div>
        ${
          isOtherWinType
            ? `<label class="winner-radio-label">
                <input
                  type="radio"
                  name="winnerName"
                  class="winner-radio"
                  value="${escapeHtml(player.name || "")}"
                  ${player.winner ? "checked" : ""}
                >${t("chooseWinner")}
              </label>`
            : `<input
                type="number"
                class="player-points"
                placeholder="${t("colPoints")}"
                min="0"
                value="${escapeHtml(player.points || "")}"
                required
              >`
        }
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

  const setMaxPlayersRange = (minPlayers, maxPlayers, winType = "punktowa") => {
    maxPlayersInput.min = String(minPlayers);
    maxPlayersInput.max = String(maxPlayers);
    maxPlayersInput.placeholder = t("playerCountPlaceholder");
    maxPlayersInput.value = "";
    currentWinType = winType || "punktowa";
    hasResolvedGameConstraints = true;
    clearFieldError(gameNameInput);
    toggleMatchPlayersFields(true);
    renderPlayers();
  };

  const clearMaxPlayersRange = () => {
    saveVisiblePlayers();
    savedPlayers = [];
    maxPlayersInput.min = String(defaultMaxPlayersMin);
    maxPlayersInput.max = String(defaultMaxPlayersMax);
    maxPlayersInput.placeholder = t("playerCountPlaceholder");
    maxPlayersInput.value = String(defaultMaxPlayersValue);
    currentWinType = "punktowa";
    hasResolvedGameConstraints = false;
    toggleMatchPlayersFields(false);
  };

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

  attachAutocomplete(gameNameInput, (value) => `api/suggest/game/${encodeURIComponent(value)}`, {
    label: "game:add-match",
    maxSuggestions: 3,
    emptyLabel: () => t("add"),
    onSelect: (selectedGameName) => syncGamePlayerConstraints(selectedGameName),
    onEmptySelect: async (gameName) => {
      const gameNameValue = gameName.trim();
      if (!gameNameValue) return;
      openGameModal(gameNameValue);
    },
  });

  clearMaxPlayersRange();

  gameNameInput.addEventListener("blur", () => syncGamePlayerConstraints(gameNameInput.value));
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

  matchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const gameName = gameNameInput.value.trim();
    if (!hasResolvedGameConstraints) {
      await syncGamePlayerConstraints(gameName);
    }

    if (!hasResolvedGameConstraints) {
      setFieldError(gameNameInput);
      toast(t("selectExistingGame"), "error");
      return;
    }

    const players = Array.from(playersContainer.querySelectorAll(".player-card")).map((card) => ({
      nameInput: card.querySelector(".player-name"),
      pointsInput: card.querySelector(".player-points"),
      name: card.querySelector(".player-name").value.trim(),
      points: currentWinType === "inna" ? 0 : toInt(card.querySelector(".player-points").value),
      winner: Boolean(card.querySelector(".winner-radio")?.checked),
    }));

    saveVisiblePlayers();

    const matchPayload = {
      gameName,
      players: players.map(({ name, points }) => ({ name, points })),
    };

    if (currentWinType === "inna") {
      matchPayload.winnerName = players.find((player) => player.winner)?.name || "";
    }

    if (currentWinType === "inna" && !matchPayload.winnerName) {
      toast(t("chooseWinnerError"), "error");
      return;
    }

    if (gameName.length < 2 || gameName.length > 100) {
      setFieldError(gameNameInput);
      toast(t("enterGameName"), "error");
      return;
    }

    const duplicateNames = findDuplicatePlayerNames(players);
    let hasError = false;

    for (let index = 0; index < players.length; index++) {
      const player = players[index];
      clearFieldError(player.nameInput);
      clearFieldError(player.pointsInput);

      if (player.name.length < 2 || player.name.length > 100) {
        setFieldError(player.nameInput);
        toast(`${t("playerPrefix")} ${index + 1}: ${t("playerNameLength")}`, "error");
        hasError = true;
        continue;
      }

      if (duplicateNames.has(player.name.trim().toLocaleLowerCase("pl-PL"))) {
        setFieldError(player.nameInput);
        toast(`${t("playerPrefix")} ${index + 1}: ${t("duplicatePlayer")}`, "error");
        hasError = true;
        continue;
      }

      if (currentWinType !== "inna" && (!Number.isInteger(player.points) || player.points < 0)) {
        setFieldError(player.pointsInput);
        toast(`${t("playerPrefix")} ${index + 1}: ${t("scoreMin")}`, "error");
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      await postJson("api/match", matchPayload);
      gameNameInput.value = "";
      clearMaxPlayersRange();
      toast(t("matchAdded"));
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : t("loadError"), "error");
    }
  });
}
