import { postJson, putJson } from "./js/api.js";

const gameModalState = {
  mode: "create",
  gameId: null,
  onSaved: null
};

function clearModalFields(modalEl) {
  modalEl.querySelectorAll("input, select").forEach((el) => {
    el.value = "";
    el.style.borderColor = "";
  });
}

function fillGameModal(modalEl, game) {
  modalEl.querySelector('[name="name"]').value = game.name || "";
  modalEl.querySelector('[name="type"]').value = game.type || "";
  modalEl.querySelector('[name="maxPlayers"]').value = game.maxPlayers || "";
  modalEl.querySelector('[name="minPlayers"]').value = game.minPlayers || "";
  modalEl.querySelector('[name="winType"]').value = game.winType || "";
}

export function openGameModal(config = "") {
  const modalEl = document.getElementById("gameModal");
  const titleEl = modalEl.querySelector("h3");
  const nameEl = modalEl.querySelector('[name="name"]');
  const game = typeof config === "string" ? { name: config } : config;

  gameModalState.mode = game.mode || "create";
  gameModalState.gameId = game.id || null;
  gameModalState.onSaved = game.onSaved || null;

  if (game.mode === "edit") {
    if (titleEl) titleEl.textContent = "Modyfikuj gre";
    fillGameModal(modalEl, game);
  } else {
    if (titleEl) titleEl.textContent = "Dodaj nowa gre";
    fillGameModal(modalEl, game);
  }

  modalEl.style.display = "flex";
  nameEl.focus();
}

export function closeGameModal() {
  const modalEl = document.getElementById("gameModal");
  modalEl.style.display = "none";
  clearModalFields(modalEl);
  gameModalState.mode = "create";
  gameModalState.gameId = null;
  gameModalState.onSaved = null;
}

export function initModals() {
  const modalEl = document.getElementById("gameModal");
  const closeBtn = document.getElementById("closeGameModal");
  const saveBtn = document.getElementById("saveGameBtn");

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      closeGameModal();
    }
  });

  closeBtn.addEventListener("click", () => closeGameModal());

  saveBtn.addEventListener("click", async () => {
    const nameEl = modalEl.querySelector('[name="name"]');
    const typeEl = modalEl.querySelector('[name="type"]');
    const minPlayersEl = modalEl.querySelector('[name="minPlayers"]');
    const maxPlayersEl = modalEl.querySelector('[name="maxPlayers"]');
    const winTypeEl = modalEl.querySelector('[name="winType"]');

    if (!nameEl.value.trim()) {
      nameEl.style.borderColor = "red";
      return;
    }

    const minPlayers = Number(minPlayersEl?.value);
    const maxPlayers = Number(maxPlayersEl?.value);
    if (
      !Number.isInteger(minPlayers) ||
      !Number.isInteger(maxPlayers) ||
      minPlayers < 1 ||
      maxPlayers < 1 ||
      minPlayers > maxPlayers
    ) {
      minPlayersEl.style.borderColor = "red";
      maxPlayersEl.style.borderColor = "red";
      alert("Liczba graczy jest niepoprawna: min musi byc mniejsze lub rowne max.");
      return;
    }

    minPlayersEl.style.borderColor = "";
    maxPlayersEl.style.borderColor = "";

    try {
      const payload = {
        name: nameEl.value.trim(),
        type: typeEl.value.trim(),
        maxPlayers,
        minPlayers,
        winType: winTypeEl.value
      };

      const data = gameModalState.mode === "edit" && gameModalState.gameId
        ? await putJson(`api/game/${gameModalState.gameId}`, payload)
        : await postJson("api/game", payload);

      console.log("[gra zapisana - backend]", data);

      const gameNameInput = document.getElementById("gameName");
      if (gameModalState.mode === "create") {
        gameNameInput.value = payload.name;
      }

      window.dispatchEvent(new CustomEvent("game-created", {
        detail: {
          mode: gameModalState.mode,
          id: gameModalState.gameId,
          name: payload.name,
          type: payload.type,
          minPlayers: payload.minPlayers,
          maxPlayers: payload.maxPlayers,
          winType: payload.winType
        }
      }));

      if (gameModalState.onSaved) {
        await gameModalState.onSaved(payload);
      }

      closeGameModal();
    } catch {
      nameEl.style.borderColor = "red";
    }
  });
}
