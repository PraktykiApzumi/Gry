import { qs, qsa } from "./dom.js";
import { getRequest } from "./api.js";
import { attachAutocomplete } from "./autocomplete.js";
import { escapeHtml } from "./utils.js";
import { createPaginator, renderPaginationControls } from "./pagination.js";
import { t, formatGameType } from "./i18n.js";

function renderPanelLink(label, entityType, value) {
  if (!value) return "-";
  return `<button type="button" class="panel-link" data-entity-type="${entityType}" data-entity-value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</button>`;
}

function emptyStatsRow(tableBody, message = t("noData")) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 7;
  cell.style.textAlign = "center";
  cell.style.color = "#999";
  cell.textContent = message;

  row.append(cell);
  tableBody.replaceChildren(row);
}

function renderStatsRows(rows, statsValue, statsScope) {
  return rows
    .map((row) => {
      const avg = row.average_points ?? "-";
      const avgValue = Number(avg);
      const avgText = Number.isFinite(avgValue) ? avgValue.toFixed(1) : avg;
      const playedGames = Number(row.played_games ?? 0);
      const wins = Number(row.wins ?? 0);
      const totalPoints = Number(row.total_points ?? 0);
      const winrateValue = playedGames > 0 ? (wins / playedGames) * 100 : null;
      const winrate = winrateValue === null ? "-" : `${winrateValue.toFixed(1)}%`;
      const scopeCell =
        statsScope === "game" ? renderPanelLink(statsValue, "game", statsValue) : formatGameType(statsValue);

      return `<tr>
        <td>${renderPanelLink(row.nick, "player", row.nick)}</td>
        <td>${scopeCell}</td>
        <td data-sort="${totalPoints}">${totalPoints}</td>
        <td data-sort="${Number.isFinite(avgValue) ? avgValue : ""}">${avgText}</td>
        <td data-sort="${wins}">${wins}</td>
        <td data-sort="${playedGames}">${playedGames}</td>
        <td data-sort="${winrateValue ?? ""}">${winrate}</td>
      </tr>`;
    })
    .join("");
}

const SORT_COLUMNS = [
  null,
  null,
  { key: "total_points" },
  { key: "average_points" },
  { key: "wins" },
  { key: "played_games" },
  { key: "_winrate" },
];

const getRowSortValue = (row, colIndex) =>
  colIndex === 0
    ? (row.nick ?? "").toLowerCase()
    : colIndex === 1
      ? ""
      : colIndex === 6
        ? (Number(row.played_games ?? 0) > 0 ? Number(row.wins ?? 0) / Number(row.played_games ?? 0) : -1)
        : Number(row[SORT_COLUMNS[colIndex]?.key] ?? 0);

const sortRows = (rows, colIndex, direction) =>
  [...rows].sort((a, b) => {
    const va = getRowSortValue(a, colIndex);
    const vb = getRowSortValue(b, colIndex);
    const cmp = typeof va === "string" ? va.localeCompare(vb, "pl") : va - vb;
    return direction === "asc" ? cmp : -cmp;
  });

const sortStatsRowsByPlayedGames = (rows) =>
  [...rows].sort(
    (a, b) => (Number(b.played_games ?? 0) - Number(a.played_games ?? 0)) || (Number(b.wins ?? 0) - Number(a.wins ?? 0)),
  );

export function initStats({ openGameHistory, openPlayerHistory } = {}) {
  const statsForm = qs("#statsForm");
  const statsNameInput = qs("#statsName");
  const statsTypeInput = qs("#statsType");
  const statsTable = qs("#statsTable");
  const tableBody = qs("#tableBody");
  const scopeButtons = qsa(".scope-btn");

  let currentStatsScope = "game";
  let currentStatsValue = "";
  let allRows = [];
  let sortColIndex = 5;
  let sortDirection = "desc";

  const statsPaginator = createPaginator();

  attachAutocomplete(statsNameInput, (value) => `api/suggest/game/${encodeURIComponent(value)}`, {
    label: "game:stats",
    maxSuggestions: 3,
  });

  const headers = statsTable.querySelectorAll("thead th");
  headers.forEach((th, index) => {
    if (index === 1) return;

    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      if (!allRows.length) return;

      if (sortColIndex === index) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColIndex = index;
        sortDirection = index === 0 ? "asc" : "desc";
      }

      applySort();
    });
  });

  function updateSortIndicators() {
    headers.forEach((th) => {
      th.removeAttribute("aria-sort");
      th.classList.remove("sort-asc", "sort-desc");
    });

    const activeTh = headers[sortColIndex];
    if (activeTh) {
      activeTh.setAttribute("aria-sort", sortDirection === "asc" ? "ascending" : "descending");
      activeTh.classList.add(sortDirection === "asc" ? "sort-asc" : "sort-desc");
    }
  }

  function renderStatsPage() {
    const page = statsPaginator.getPage();
    if (!page.length) emptyStatsRow(tableBody);
    else tableBody.innerHTML = renderStatsRows(page, currentStatsValue, currentStatsScope);

    renderPaginationControls(statsPaginator, qs("#statsPagination"), renderStatsPage);
  }

  function applySort() {
    const sorted = sortRows(allRows, sortColIndex, sortDirection);
    statsPaginator.setItems(sorted);
    updateSortIndicators();
    renderStatsPage();
  }

  async function loadStats() {
    currentStatsValue = currentStatsScope === "type" ? statsTypeInput.value.trim() : statsNameInput.value.trim();

    if (currentStatsValue.length < 2 || currentStatsValue.length > 100) {
      alert(currentStatsScope === "type" ? t("enterType") : t("enterGameName"));
      return;
    }

    try {
      const statsData = await getRequest(`api/stats/${currentStatsScope}/${encodeURIComponent(currentStatsValue)}`);
      const rows = statsData.data;

      if (!rows || rows.length === 0) {
        allRows = [];
        emptyStatsRow(tableBody);
        statsPaginator.setItems([]);
        renderPaginationControls(statsPaginator, qs("#statsPagination"), renderStatsPage);
        return;
      }

      sortColIndex = 5;
      sortDirection = "desc";
      allRows = sortStatsRowsByPlayedGames(rows);
      statsPaginator.setItems(allRows);
      updateSortIndicators();
      renderStatsPage();
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : t("statsUnavailable"));
    }
  }

  scopeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentStatsScope = button.dataset.scope;

      scopeButtons.forEach((item) => item.classList.toggle("active", item === button));
      statsNameInput.style.display = currentStatsScope === "game" ? "block" : "none";
      statsNameInput.required = currentStatsScope === "game";
      statsTypeInput.style.display = currentStatsScope === "type" ? "block" : "none";
      statsTypeInput.required = currentStatsScope === "type";

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

  statsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadStats();
  });

  statsTable.addEventListener("click", async (event) => {
    const trigger = event.target.closest(".panel-link");
    if (!trigger) return;

    const { entityType, entityValue } = trigger.dataset;
    if (entityType === "player" && typeof openPlayerHistory === "function") {
      await openPlayerHistory(entityValue);
    }
    if (entityType === "game" && currentStatsScope === "game" && typeof openGameHistory === "function") {
      await openGameHistory(entityValue);
    }
  });
}
