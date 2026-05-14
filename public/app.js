import { qs, qsa } from "./js/dom.js";
import { getRequest } from "./js/api.js";
import { attachAutocomplete } from "./js/autocomplete.js";
import { initModals, openGameModal } from "./modals.js";
import { initMatchForm } from "./js/matchForm.js";
import { initHistory } from "./js/history.js";
import { loadAdminPanel, refreshAdminPanel } from "./js/adminPanel.js";

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = qsa(".tab-btn");
  const viewPanels = qsa(".view");
  const matchForm = qs("#matchForm");
  const gameNameInput = qs("#gameName");
  const maxPlayersInput = qs("#maxPlayers");
  const maxPlayersLabel = qs("#maxPlayersLabel");
  const playersLabel = qs("#playersLabel");
  const statsForm = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const tableBody = qs("#tableBody");
  const filterButtons = qsa(".filter-btn");
  const playersContainer = qs("#playersRow");

  let currentFilter = "points";
  initModals();
  initMatchForm({
    matchForm,
    gameNameInput,
    maxPlayersInput,
    maxPlayersLabel,
    playersLabel,
    playersContainer,
    openGameModal
  });
  initHistory();
  loadAdminPanel({ openGameModal });

  attachAutocomplete(
    statsNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    {
      label: "game:stats",
      maxSuggestions: 3
    }
  );

  function showView(viewId) {
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === viewId);
    });

    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === viewId);
    });

    if (viewId === "adminView") {
      refreshAdminPanel().catch((error) => {
        alert(error instanceof Error ? error.message : "Nie mozna odswiezyc admin panelu.");
      });
    }
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

  statsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadStats();
  });
});
