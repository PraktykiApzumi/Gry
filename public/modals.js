import { postJson } from "./js/api.js";

function clearModalFields(modalEl) {
  modalEl.querySelectorAll("input, select").forEach((el) => {
    el.value = "";
    el.style.borderColor = "";
  });
}

export function openGameModal(prefillName = "") {
  const modalEl = document.getElementById("gameModal");
  if (!modalEl) return;
  modalEl.style.display = "flex";

  const nameEl = modalEl.querySelector('[name="name"]');
  if (nameEl && prefillName) {
    nameEl.value = prefillName;
    nameEl.focus();
  }
}

export function closeGameModal() {
  const modalEl = document.getElementById("gameModal");
  if (!modalEl) return;
  modalEl.style.display = "none";
  clearModalFields(modalEl);
}

export function initModals() {
  const modalEl = document.getElementById("gameModal");
  const closeBtn = document.getElementById("closeGameModal");
  const saveBtn = document.getElementById("saveGameBtn");
  if (!modalEl || !closeBtn || !saveBtn) return;

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeGameModal();
      }
    });
  });

  closeBtn.addEventListener("click", () => closeGameModal());

  saveBtn.addEventListener("click", async () => {
    const nameEl = modalEl.querySelector('[name="name"]');
    if (!nameEl || !nameEl.value.trim()) {
      if (nameEl) nameEl.style.borderColor = "red";
      return;
    }

    try {
      const payload = {
        name: nameEl.value.trim(),
        type: modalEl.querySelector('[name="type"]').value.trim(),
        maxPlayers: Number(modalEl.querySelector('[name="maxPlayers"]').value),
        minPlayers: Number(modalEl.querySelector('[name="minPlayers"]').value),
        winType: modalEl.querySelector('[name="winType"]').value
      };

      const data = await postJson("api/game", payload);
      console.log("[gra zapisana — backend]", data);

      const gameNameInput = document.getElementById("gameName");
      if (gameNameInput) {
        gameNameInput.value = payload.name;
      }
      closeGameModal();
    } catch {
      if (nameEl) nameEl.style.borderColor = "red";
    }
  });
}
