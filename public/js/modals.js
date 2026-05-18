import { postJson, putJson } from "./api.js";

const gameModalState = {
  mode: "create",
  gameId: null,
  onSaved: null
};

function getErrorEl(modalEl, fieldName) {
  return modalEl.querySelector(`[data-error-for="${fieldName}"]`);
}

function setFieldError(fieldEl, errorEl, message = "") {
  if (fieldEl) {
    fieldEl.classList.toggle("field-input-error", Boolean(message));
    fieldEl.setAttribute("aria-invalid", message ? "true" : "false");
  }
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function clearFieldError(modalEl, fieldName) {
  const fieldEl = modalEl.querySelector(`[name="${fieldName}"]`);
  setFieldError(fieldEl, getErrorEl(modalEl, fieldName), "");
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

function clearModalFields(modalEl) {
  modalEl.querySelectorAll("input, select").forEach((el) => {
    el.value = "";
    el.classList.remove("field-input-error");
    el.setAttribute("aria-invalid", "false");
  });
  modalEl.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
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
    if (titleEl) titleEl.textContent = "Modyfikuj grę";
    fillGameModal(modalEl, game);
  } else {
    if (titleEl) titleEl.textContent = "Dodaj nową grę";
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

  modalEl.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(modalEl, field.name));
    field.addEventListener("change", () => clearFieldError(modalEl, field.name));
  });

  saveBtn.addEventListener("click", async () => {
    const nameEl = modalEl.querySelector('[name="name"]');
    const typeEl = modalEl.querySelector('[name="type"]');
    const minPlayersEl = modalEl.querySelector('[name="minPlayers"]');
    const maxPlayersEl = modalEl.querySelector('[name="maxPlayers"]');
    const winTypeEl = modalEl.querySelector('[name="winType"]');

    const name = nameEl.value.trim();
    const type = typeEl.value.trim();
    const minPlayers = Number(minPlayersEl?.value);
    const maxPlayers = Number(maxPlayersEl?.value);
    const winType = winTypeEl.value;

    let hasErrors = false;

    if (name.length < 2 || name.length > 100) {
      setFieldError(nameEl, getErrorEl(modalEl, "name"), "Podaj nazwę gry od 2 do 100 znaków.");
      hasErrors = true;
    }

    if (!type) {
      setFieldError(typeEl, getErrorEl(modalEl, "type"), "Wybierz typ gry.");
      hasErrors = true;
    }

    if (!Number.isInteger(minPlayers) || minPlayers < 1) {
      setFieldError(minPlayersEl, getErrorEl(modalEl, "minPlayers"), "Podaj poprawną minimalną liczbę graczy.");
      hasErrors = true;
    }

    if (!Number.isInteger(maxPlayers) || maxPlayers < 1) {
      setFieldError(maxPlayersEl, getErrorEl(modalEl, "maxPlayers"), "Podaj poprawną maksymalną liczbę graczy.");
      hasErrors = true;
    } else if (Number.isInteger(minPlayers) && minPlayers > maxPlayers) {
      setFieldError(minPlayersEl, getErrorEl(modalEl, "minPlayers"), "Minimum nie może być większe od maksimum.");
      setFieldError(maxPlayersEl, getErrorEl(modalEl, "maxPlayers"), "Maksimum nie może być mniejsze od minimum.");
      hasErrors = true;
    }

    if (!winType) {
      setFieldError(winTypeEl, getErrorEl(modalEl, "winType"), "Wybierz rodzaj wygranej.");
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      const payload = {
        name,
        type,
        maxPlayers,
        minPlayers,
        winType
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

      showToast(gameModalState.mode === "edit" ? "Zapisano zmiany gry." : "Dodano nową grę.");
      closeGameModal();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Nie udało się zapisać gry.", "error");
    }
  });
}
