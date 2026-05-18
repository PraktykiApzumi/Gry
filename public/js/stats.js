import { qs, qsa } from "./dom.js";
import { esc } from "./utils.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";

function emptyStatsRow(tableBody, message = "Brak danych") {
  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">${message}</td></tr>`;
}

function renderStatsRows(rows, statsValue) {
  return rows.map((row) => {
    const avg = row.average_points ?? "-";
    const avgText = Number.isFinite(Number(avg)) ? Number(avg).toFixed(1) : avg;
    const playedGames = Number(row.played_games ?? 0);
    const wins = Number(row.wins ?? 0);
    const winrate = playedGames > 0 ? `${((wins / playedGames) * 100).toFixed(1)}%` : "-";

    return `
      <tr>
        <td>${esc(row.nick)}</td>
        <td>${esc(statsValue)}</td>
        <td>${row.total_points ?? 0}</td>
        <td>${avgText}</td>
        <td>${wins}</td>
        <td>${playedGames}</td>
        <td>${winrate}</td>
      </tr>`;
  }).join("");
}

export function initStats() {
  const statsForm = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const statsTypeInput = qs("#statsType");
  const tableBody = qs("#tableBody");
  const filterButtons = qsa(".filter-btn");
  const scopeButtons = qsa(".scope-btn");

  let currentFilter = "points";
  let currentStatsScope = "game";

  attachAutocomplete(
    statsNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    {
      label: "game:stats",
      maxSuggestions: 3
    }
  );

  async function loadStats() {
    const statsValue = currentStatsScope === "type"
      ? statsTypeInput.value.trim()
      : statsNameInput.value.trim();

    if (statsValue.length < 2 || statsValue.length > 100) {
      alert(currentStatsScope === "type" ? "Wybierz typ gry." : "Nazwa gry musi miec od 2 do 100 znakow.");
      return;
    }

    const endpoint = `api/stats/${currentStatsScope}/${currentFilter}/${encodeURIComponent(statsValue)}`;

    try {
      const statsData = await getRequest(endpoint);
      const rows = statsData.data;

      if (!rows || rows.length === 0) {
        emptyStatsRow(tableBody);
        return;
      }

      tableBody.innerHTML = renderStatsRows(rows, statsValue);
    } catch (err) {
      if (err instanceof Error && err.message) {
        alert(err.message);
        return;
      }
      alert("Nie mozna teraz pobrac statystyk.");
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });
    });
  });

  scopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentStatsScope = button.dataset.scope;
      scopeButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      statsNameInput.style.display = currentStatsScope === "game" ? "block" : "none";
      statsNameInput.required = currentStatsScope === "game";
      statsTypeInput.style.display = currentStatsScope === "type" ? "block" : "none";
      statsTypeInput.required = currentStatsScope === "type";
      emptyStatsRow(tableBody);
    });
  });

  statsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadStats();
  });
}
