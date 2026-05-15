import { qsa } from "./dom.js";

export function initNavigation({ onViewChange } = {}) {
  const tabButtons = qsa(".tab-btn");
  const viewPanels = qsa(".view");

  function showView(viewId) {
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === viewId);
    });

    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === viewId);
    });

    if (typeof onViewChange === "function") {
      onViewChange(viewId);
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  return { showView };
}
