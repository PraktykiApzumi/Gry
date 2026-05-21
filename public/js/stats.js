import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import { escapeHtml } from "./utils.js";

function emptyStatsRow(tableBody, message = "Brak danych") {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 7;
  cell.style.textAlign = "center";
  cell.style.color = "#999";
  cell.textContent = message;
  row.append(cell);
  tableBody.replaceChildren(row);
}

function resetStatsSortState(table) {
  table.querySelectorAll("th[aria-sort]").forEach((header) => {
    header.removeAttribute("aria-sort");
  });
}

function renderStatsRows(rows, statsValue) {
  return rows.map((row) => {
    const avg = row.average_points ?? "-";
    const avgValue = Number(avg);
    const avgText = Number.isFinite(avgValue) ? avgValue.toFixed(1) : avg;
    const playedGames = Number(row.played_games ?? 0);
    const wins = Number(row.wins ?? 0);
    const totalPoints = Number(row.total_points ?? 0);
    const winrateValue = playedGames > 0 ? (wins / playedGames) * 100 : null;
    const winrate = winrateValue === null ? "-" : `${winrateValue.toFixed(1)}%`;

    return `
      <tr>
        <td>${escapeHtml(row.nick)}</td>
        <td>${escapeHtml(statsValue)}</td>
        <td data-sort="${totalPoints}">${totalPoints}</td>
        <td data-sort="${Number.isFinite(avgValue) ? avgValue : ""}">${avgText}</td>
        <td data-sort="${wins}">${wins}</td>
        <td data-sort="${playedGames}">${playedGames}</td>
        <td data-sort="${winrateValue ?? ""}">${winrate}</td>
      </tr>`;
  }).join("");
}

function sortStatsRowsByPlayedGames(rows) {
  return [...rows].sort((a, b) => {
    const playedDiff = Number(b.played_games ?? 0) - Number(a.played_games ?? 0);
    if (playedDiff !== 0) return playedDiff;
    return Number(b.wins ?? 0) - Number(a.wins ?? 0);
  });
}

export function initStats() {
  const statsForm = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const statsTypeInput = qs("#statsType");
  const statsTable = qs("#statsTable");
  const tableBody = qs("#tableBody");
  const scopeButtons = qsa(".scope-btn");

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

    const endpoint = `api/stats/${currentStatsScope}/${encodeURIComponent(statsValue)}`;

    try {
      const statsData = await getRequest(endpoint);
      const rows = statsData.data;

      if (!rows || rows.length === 0) {
        emptyStatsRow(tableBody);
        return;
      }

      tableBody.innerHTML = renderStatsRows(sortStatsRowsByPlayedGames(rows), statsValue);
      resetStatsSortState(statsTable);
    } catch (err) {
      if (err instanceof Error && err.message) {
        alert(err.message);
        return;
      }
      alert("Nie mozna teraz pobrac statystyk.");
    }
  }

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
      resetStatsSortState(statsTable);
      emptyStatsRow(tableBody);
    });
  });

  statsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadStats();
  });
}
