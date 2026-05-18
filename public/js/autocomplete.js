import { getRequest } from "./api.js";

function normalizeSuggestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeValue(value) {
  return String(value || "").trim().toLocaleLowerCase("pl-PL");
}

export function attachAutocomplete(inputEl, endpointBuilder, options = {}) {
  const {
    label = "autocomplete",
    maxSuggestions = 3,
    emptyLabel = null,
    onEmptySelect = null,
    onSelect = null
  } = options;

  let lastValue = null;
  let requestCounter = 0;
  let debounceTimerId = null;
  const parent = inputEl.parentElement;
  const wrapper = document.createElement("div");
  wrapper.className = "autocomplete-wrap";
  parent.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  const listEl = document.createElement("div");
  listEl.className = "autocomplete-list";
  listEl.style.display = "none";
  wrapper.appendChild(listEl);

  function closeList() {
    listEl.style.display = "none";
  }

  function clearList() {
    listEl.style.display = "none";
    listEl.innerHTML = "";
  }

  function showList() {
    listEl.style.display = "block";
  }

  function renderSuggestions(items, query) {
    listEl.innerHTML = "";
    const normalizedQuery = normalizeValue(query);
    const hasExactMatch = items.some((item) => normalizeValue(item) === normalizedQuery);

    items.forEach((item) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "autocomplete-item";
      row.textContent = item;
      row.addEventListener("mousedown", (e) => e.preventDefault());
      row.addEventListener("click", () => {
        inputEl.value = item;
        closeList();
        if (typeof onSelect === "function") {
          onSelect(item);
        }
      });
      listEl.appendChild(row);
    });

    if (
      normalizedQuery.length >= 2 &&
      !hasExactMatch &&
      emptyLabel 
    ) {
      const addRow = document.createElement("button");
      addRow.type = "button";
      addRow.className = "autocomplete-item autocomplete-item-add";
      addRow.textContent = `${emptyLabel} "${query}"`;
      addRow.addEventListener("mousedown", (e) => e.preventDefault());
      addRow.addEventListener("click", async () => {
        await onEmptySelect(query);
        closeList();
      });
      listEl.appendChild(addRow);
    }

    if (listEl.childElementCount > 0) {
      showList();
      return;
    }

    clearList();
  }

  async function fetchSuggestions(value, requestId) {
    try {
      const endpoint = endpointBuilder(value);
      const data = await getRequest(endpoint);
      if (requestId !== requestCounter) {
        return;
      }
      const suggestions = normalizeSuggestions(data?.suggestions).slice(0, maxSuggestions);
      console.log(`[suggestions:${label}]`, suggestions);
      renderSuggestions(suggestions, value);
    } catch (err) {
      if (requestId !== requestCounter) {
        return;
      }
      clearList();
      console.warn(`[suggestions:${label}]`, err instanceof Error ? err.message : err);
    }
  }

  inputEl.addEventListener("input", () => {
    const value = inputEl.value.trim();
    const previousValue = lastValue;

    if (value === previousValue) {
      return;
    }

    lastValue = value;

    if (debounceTimerId !== null) {
      clearTimeout(debounceTimerId);
      debounceTimerId = null;
    }

    if (value.length < 1) {
      requestCounter += 1;
      clearList();
      return;
    }

    const requestId = ++requestCounter;
    const firstKeystroke = !previousValue;

    if (firstKeystroke) {
      fetchSuggestions(value, requestId);
      return;
    }

    debounceTimerId = setTimeout(() => {
      fetchSuggestions(value, requestId);
      debounceTimerId = null;
    }, 200);
  });
  inputEl.addEventListener("focus", () => {
    if (listEl.childElementCount > 0) {
      showList();
    }
  });
  inputEl.addEventListener("blur", () => {
    setTimeout(() => closeList(), 100);
  });
}
