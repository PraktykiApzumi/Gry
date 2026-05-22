const DEFAULT_PAGE_SIZE = 20;

export function createPaginator(items = [], pageSize = DEFAULT_PAGE_SIZE) {
  let currentPage = 1;
  let currentItems = items;

  function totalPages() {
    return Math.max(1, Math.ceil(currentItems.length / pageSize));
  }

  return {
    setItems(newItems) {
      currentItems = newItems ?? [];
      currentPage = 1;
    },

    getPage(page = currentPage) {
      const p = Math.min(Math.max(1, page), totalPages());
      const start = (p - 1) * pageSize;
      return currentItems.slice(start, start + pageSize);
    },

    goToPage(n) { currentPage = Math.min(Math.max(1, n), totalPages()); },
    nextPage()  { if (currentPage < totalPages()) currentPage++; },
    prevPage()  { if (currentPage > 1) currentPage--; },

    getCurrentPage() { return currentPage; },
    getTotalPages()  { return totalPages(); },
    getTotalItems()  { return currentItems.length; },
    hasNext()        { return currentPage < totalPages(); },
    hasPrev()        { return currentPage > 1; },
  };
}

export function renderPaginationControls(paginator, container, onPageChange) {
  if (!container) return;

  const total   = paginator.getTotalPages();
  const current = paginator.getCurrentPage();
  const items   = paginator.getTotalItems();

  if (total <= 1) {
    container.innerHTML = "";
    return;
  }

  function pageNumbers() {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set([1, total, current]);
    for (let d = -2; d <= 2; d++) {
      const p = current + d;
      if (p >= 1 && p <= total) pages.add(p);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
      result.push(sorted[i]);
    }
    return result;
  }

  const infoHtml = `<span class="pagination-info">Strona ${current} z ${total} (${items} rekordów)</span>`;

  const btnPrev = `<button class="pagination-btn" data-page="prev" ${!paginator.hasPrev() ? "disabled" : ""}>‹ Poprzednia</button>`;
  const btnNext = `<button class="pagination-btn" data-page="next" ${!paginator.hasNext() ? "disabled" : ""}>Następna ›</button>`;

  const numBtns = pageNumbers().map((p) =>
    p === "…"
      ? `<span class="pagination-ellipsis">…</span>`
      : `<button class="pagination-btn ${p === current ? "active" : ""}" data-page="${p}">${p}</button>`
  ).join("");

  container.innerHTML = `
    <div class="pagination-controls">
      ${btnPrev}
      <div class="pagination-pages">${numBtns}</div>
      ${btnNext}
      ${infoHtml}
    </div>
  `;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;

    const val = btn.dataset.page;
    if (val === "prev") paginator.prevPage();
    else if (val === "next") paginator.nextPage();
    else paginator.goToPage(Number(val));

    onPageChange();
  });
}
