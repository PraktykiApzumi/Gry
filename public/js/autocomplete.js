import { debounce } from "./utils.js";
import { getRequest } from "./api.js";

export function attachConsoleAutocomplete(inputEl, endpointBuilder, label) {
  let lastValue = null;

  const fetchSuggestions = debounce(async () => {
    const rawValue = inputEl.value;
    const value = rawValue.trim();

    if (value === lastValue) {
      return;
    }
    lastValue = value;

    if (value.length < 2) {
      console.log(`[suggestions:${label}]`, []);
      return;
    }

    try {
      const endpoint = endpointBuilder(value);
      const data = await getRequest(endpoint);
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      console.log(`[suggestions:${label}]`, suggestions);
    } catch (err) {
      console.warn(`[suggestions:${label}]`, err instanceof Error ? err.message : err);
    }
  }, 200);

  inputEl.addEventListener("input", fetchSuggestions);
}
