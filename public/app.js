function run(){
  const querySelector = (sel) => document.querySelector(sel);
  const querySelectorAll = (sel) => Array.from(document.querySelectorAll(sel));

  function toInt(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }

  async function getRequest(url) {
    const response = await fetch(url);
    console.log("[PHP state]", {
      method: "GET",
      url: response.url || url,
      ok: response.ok,
      status: response.status
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("[PHP state]", {
      method: "POST",
      url: response.url || url,
      ok: response.ok,
      status: response.status
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }

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

    const statsEndpointByFilter = {
      points: "points",
      wins: "wins",
      played: "played"
    };

    let currentFilter = "points";

    function renderPlayers() {
      const count = toInt(maxPlayersInput.value) || 1;
      const safeCount = Math.max(1, Math.min(10, count));
      playersContainer.innerHTML = "";
      for (let i = 0; i < safeCount; i++) {
        playersContainer.innerHTML += `
          <div class="player-card">
            <div class="field-label">Gracz ${i + 1}</div>
            <input type="text" class="player-name" placeholder="Nazwa gracza" required>
            <input type="number" class="player-points" placeholder="Punkty" min="0" required>
          </div>
        `;
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

      const endpointType = statsEndpointByFilter[currentFilter];
      const encodedName = encodeURIComponent(gameName);
      const endpoint = `api/stats/${endpointType}/${encodedName}`;

      try {
        await getRequest(endpoint);
      } catch (_err) {
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

      try {
        await postJson("api/match", matchPayload);
      } catch (_err) {
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
