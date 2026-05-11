function run(){
  const querySelector = (sel) => document.querySelector(sel);
  const querySelectorAll = (sel) => Array.from(document.querySelectorAll(sel));

  function toInt(value) {
    if (typeof value === "string" && value.trim() === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }

  function buildApiErrorMessage(body, fallbackMessage) {
    if (!body) return fallbackMessage;

    const baseMessage = body.error || fallbackMessage;
    const detailLines = Object.entries(body.details || {})
      .map(([field, message]) => `${field}: ${message}`);

    if (!detailLines.length) return baseMessage;
    return `${baseMessage}\n${detailLines.join("\n")}`;
  }

  async function getRequest(url) {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    console.log("[API response]", {
      method: "GET",
      url,
      status: response.status,
      ok: response.ok,
      body: data
    });
    if (!response.ok) {
      const message = buildApiErrorMessage(data, `Request failed: ${url}`);
      throw new Error(message);
    }

    return data;
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    console.log("[API response]", {
      method: "POST",
      url,
      status: response.status,
      ok: response.ok,
      body: data
    });

    if (!response.ok) {
      const message = buildApiErrorMessage(data, `Request failed: ${url}`);
      throw new Error(message);
    }

    return data;
  }

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
    const tabButtons = querySelectorAll(".tab-btn");
    const viewPanels = querySelectorAll(".view");
    const matchForm = querySelector("#matchForm");
    const gameNameInput = querySelector("#gameName");
    const maxPlayersInput = querySelector("#maxPlayers");
    const playersContainer = querySelector("#playersRow");
    const statsForm = querySelector("#statsForm");
    const statsNameInput = querySelector("#statsName");
    const filterButtons = querySelectorAll(".filter-btn");

    let currentFilter = "points";

    function renderPlayers() {
      const count = toInt(maxPlayersInput.value) || 1;
      const safeCount = Math.max(1, Math.min(10, count));
      playersContainer.innerHTML = "";
      for (let i = 0; i < safeCount; i++) {
        const card = document.createElement("div");
        card.className = "player-card";
        card.innerHTML = `
          <div class="field-label">Gracz ${i + 1}
            <button type="button" class="btn-plus" title="Dodaj gracza do bazy">+</button>
          </div>
          <input type="text" class="player-name" placeholder="Nazwa gracza" required>
          <input type="number" class="player-points" placeholder="Punkty" min="0" required>
        `;
        card.querySelector(".btn-plus").addEventListener("click", async () => {
          const nameInput = card.querySelector(".player-name");
          const imie = nameInput.value.trim();
          if (!imie) { nameInput.style.borderColor = "red"; return; }
          nameInput.style.borderColor = "";
          try {
            const created = await postJson("api/player", { name: imie });
            console.log("[gracz zapisany — backend]", created);
          } catch (err) {
            console.warn("[api/player]", err instanceof Error ? err.message : err);
          }
        });
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
        console.log("[stats z backendu]", statsData.filter, statsData.data);
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

      const players = querySelectorAll(".player-card")
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
};

run();
