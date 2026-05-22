import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import { escapeHtml } from "./utils.js";
import { createPaginator, renderPaginationControls } from "./pagination.js";

function emptyStatsRow(tableBody, message = "Brak danych") {
  const row  = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 7;
  cell.style.textAlign = "center";
  cell.style.color = "#999";
  cell.textContent = message;
  tableBody.replaceChildren(row);
  row.append(cell);
}

function renderStatsRows(rows, statsValue) {
  return rows.map((row) => {
    const avg        = row.average_points ?? "-";
    const avgValue   = Number(avg);
    const avgText    = Number.isFinite(avgValue) ? avgValue.toFixed(1) : avg;
    const playedGames = Number(row.played_games ?? 0);
    const wins        = Number(row.wins ?? 0);
    const totalPoints = Number(row.total_points ?? 0);
    const winrateValue = playedGames > 0 ? (wins / playedGames) * 100 : null;
    const winrate      = winrateValue === null ? "-" : `${winrateValue.toFixed(1)}%`;

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

// Kolumny: index => klucz w danych, kierunek domyślny ("desc" = większe wyżej)
const SORT_COLUMNS = [
  null,                                    // 0: Gracz – sortowanie tekstowe
  null,                                    // 1: Zakres – tekstowe
  { key: "total_points",   type: "num" },  // 2: Punkty
  { key: "average_points", type: "num" },  // 3: Śr. pkt
  { key: "wins",           type: "num" },  // 4: Zwycięstwa
  { key: "played_games",   type: "num" },  // 5: Ilość gier
  { key: "_winrate",       type: "num" },  // 6: Winrate (wyliczany)
];

function getRowSortValue(row, colIndex) {
  if (colIndex === 0) return (row.nick ?? "").toLowerCase();
  if (colIndex === 1) return "";
  if (colIndex === 6) {
    const played = Number(row.played_games ?? 0);
    return played > 0 ? Number(row.wins ?? 0) / played : -1;
  }
  const col = SORT_COLUMNS[colIndex];
  if (!col) return 0;
  return Number(row[col.key] ?? 0);
}

function sortRows(rows, colIndex, direction) {
  return [...rows].sort((a, b) => {
    const va = getRowSortValue(a, colIndex);
    const vb = getRowSortValue(b, colIndex);
    let cmp = 0;
    if (typeof va === "string") {
      cmp = va.localeCompare(vb, "pl");
    } else {
      cmp = va - vb;
    }
    return direction === "asc" ? cmp : -cmp;
  });
}

function sortStatsRowsByPlayedGames(rows) {
  return [...rows].sort((a, b) => {
    const playedDiff = Number(b.played_games ?? 0) - Number(a.played_games ?? 0);
    if (playedDiff !== 0) return playedDiff;
    return Number(b.wins ?? 0) - Number(a.wins ?? 0);
  });
}

export function initStats() {
  const statsForm      = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const statsTypeInput = qs("#statsType");
  const statsTable     = qs("#statsTable");
  const tableBody      = qs("#tableBody");
  const scopeButtons   = qsa(".scope-btn");

  let currentStatsScope = "game";
  let currentStatsValue = "";
  let allRows = [];             // pełna, posortowana lista wierszy
  let sortColIndex  = 5;        // domyślnie: Ilość gier
  let sortDirection = "desc";

  const statsPaginator = createPaginator();

  attachAutocomplete(
    statsNameInput,
    (value) => `api/suggest/game/${encodeURIComponent(value)}`,
    { label: "game:stats", maxSuggestions: 3 }
  );

  // --- Nagłówki tabeli: dodaj obsługę kliknięcia ---
  const headers = statsTable.querySelectorAll("thead th");
  headers.forEach((th, idx) => {
    // Tylko kolumny z danymi (nie Zakres)
    if (idx === 1) return;
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      if (!allRows.length) return;

      if (sortColIndex === idx) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColIndex = idx;
        // Tekstowe (Gracz) domyślnie rosnąco, liczbowe malejąco
        sortDirection = idx === 0 ? "asc" : "desc";
      }

      applySort();
    });
  });

  function updateSortIndicators() {
    headers.forEach((th, idx) => {
      th.removeAttribute("aria-sort");
      th.classList.remove("sort-asc", "sort-desc");
    });
    const activeTh = headers[sortColIndex];
    if (activeTh) {
      activeTh.setAttribute("aria-sort", sortDirection === "asc" ? "ascending" : "descending");
      activeTh.classList.add(sortDirection === "asc" ? "sort-asc" : "sort-desc");
    }
  }

  function applySort() {
    const sorted = sortRows(allRows, sortColIndex, sortDirection);
    statsPaginator.setItems(sorted);   // resetuje do strony 1
    updateSortIndicators();
    renderStatsPage();
  }

  function renderStatsPage() {
    const page = statsPaginator.getPage();
    if (!page.length) {
      emptyStatsRow(tableBody);
    } else {
      tableBody.innerHTML = renderStatsRows(page, currentStatsValue);
    }
    renderPaginationControls(statsPaginator, qs("#statsPagination"), renderStatsPage);
  }

  async function loadStats() {
    currentStatsValue = currentStatsScope === "type"
      ? statsTypeInput.value.trim()
      : statsNameInput.value.trim();

    if (currentStatsValue.length < 2 || currentStatsValue.length > 100) {
      alert(currentStatsScope === "type"
        ? "Wybierz typ gry."
        : "Nazwa gry musi miec od 2 do 100 znakow.");
      return;
    }

    const endpoint = `api/stats/${currentStatsScope}/${encodeURIComponent(currentStatsValue)}`;

    try {
      const statsData = await getRequest(endpoint);
      const rows = statsData.data;

      if (!rows || rows.length === 0) {
        allRows = [];
        emptyStatsRow(tableBody);
        statsPaginator.setItems([]);
        renderPaginationControls(statsPaginator, qs("#statsPagination"), renderStatsPage);
        return;
      }

      // Domyślne sortowanie po załadowaniu: Ilość gier malejąco
      sortColIndex  = 5;
      sortDirection = "desc";
      allRows = sortStatsRowsByPlayedGames(rows);

      statsPaginator.setItems(allRows);
      updateSortIndicators();
      renderStatsPage();
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
      statsNameInput.required      = currentStatsScope === "game";
      statsTypeInput.style.display = currentStatsScope === "type" ? "block" : "none";
      statsTypeInput.required      = currentStatsScope === "type";

      allRows = [];
      statsPaginator.setItems([]);
      emptyStatsRow(tableBody);
      headers.forEach((th) => {
        th.removeAttribute("aria-sort");
        th.classList.remove("sort-asc", "sort-desc");
      });
      const paginationEl = qs("#statsPagination");
      if (paginationEl) paginationEl.innerHTML = "";
    });
  });

  statsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadStats();
  });
}
