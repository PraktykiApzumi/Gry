import { qs } from "./dom.js";
import { initModals, openGameModal } from "./modals.js";
import { initMatchForm } from "./matchForm.js";
import { initHistory } from "./history.js";
import { loadAdminPanel, refreshAdminPanel } from "./adminPanel.js";
import { initNavigation } from "./navigation.js";
import { initStats } from "./stats.js";

export function initApp() {
  initModals();

  initMatchForm({
    matchForm: qs("#matchForm"),
    gameNameInput: qs("#gameName"),
    maxPlayersInput: qs("#maxPlayers"),
    maxPlayersLabel: qs("#maxPlayersLabel"),
    playersLabel: qs("#playersLabel"),
    playersContainer: qs("#playersRow"),
    openGameModal
  });

  initStats();
  initHistory();
  loadAdminPanel({ openGameModal }).catch((error) => {
    alert(error instanceof Error ? error.message : "Nie mozna zaladowac admin panelu.");
  });

  initNavigation({
    onViewChange(viewId) {
      if (viewId !== "adminView") return;

      refreshAdminPanel().catch((error) => {
        alert(error instanceof Error ? error.message : "Nie mozna odswiezyc admin panelu.");
      });
    }
  });
}
