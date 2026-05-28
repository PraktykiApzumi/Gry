import { qs } from "./dom.js";
import { initModals, openGameModal } from "./modals.js";
import { initMatchForm } from "./matchForm.js";
import { initHistory } from "./history.js";
import { loadAdminPanel, refreshAdminPanel } from "./adminPanel.js";
import { initNavigation } from "./navigation.js";
import { initStats } from "./stats.js";
import { applyTranslations, getLocale, initI18n, setLocale } from "./i18n.js";
import { applySettings, getSettings, setSettings } from "./settings.js";

export function initApp() {
  initModals();
  initI18n();
  applySettings();
  applyTranslations();
  updateAppearanceActiveState();

  const languageToggle = qs("#languageToggle");
  const appearanceToggle = qs("#appearanceToggle");
  const appearanceModal = qs("#appearanceModal");
  const appearanceClose = qs("#appearanceClose");

  if (languageToggle) {
    languageToggle.addEventListener("click", async () => {
      await setLocale(getLocale() === "pl" ? "en" : "pl");
      applyTranslations();
    });
  }

  if (appearanceToggle && appearanceModal) {
    appearanceToggle.addEventListener("click", () => {
      appearanceModal.style.display = "flex";
      appearanceToggle.setAttribute("aria-expanded", "true");
    });
  }

  if (appearanceClose && appearanceModal) {
    appearanceClose.addEventListener("click", () => {
      appearanceModal.style.display = "none";
      appearanceToggle?.setAttribute("aria-expanded", "false");
    });
    appearanceModal.addEventListener("click", (event) => {
      if (event.target === appearanceModal) {
        appearanceModal.style.display = "none";
        appearanceToggle?.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest(".appearance-chip");
    if (!target) return;
    const next = {};
    if (target.dataset.accent) next.accent = target.dataset.accent;
    if (target.dataset.font) next.font = target.dataset.font;
    if (target.dataset.size) next.fontScale = Number(target.dataset.size);
    setSettings(next);
    applySettings();
    updateAppearanceActiveState();
  });

  function updateAppearanceActiveState() {
    const settings = getSettings();
    document.querySelectorAll(".appearance-chip").forEach((button) => {
      button.classList.toggle("active", Boolean(
        (button.dataset.accent && button.dataset.accent === settings.accent) ||
        (button.dataset.font && button.dataset.font === settings.font) ||
        (button.dataset.size && Number(button.dataset.size) === Number(settings.fontScale))
      ));
    });
  }

  initMatchForm({
    matchForm: qs("#matchForm"),
    gameNameInput: qs("#gameName"),
    maxPlayersInput: qs("#maxPlayers"),
    maxPlayersLabel: qs("#maxPlayersLabel"),
    playersLabel: qs("#playersLabel"),
    playersContainer: qs("#playersRow"),
    openGameModal,
  });

  const navigation = initNavigation({
    onViewChange(viewId) {
      if (viewId !== "adminView") return;
      refreshAdminPanel().catch((error) => {
        alert(error instanceof Error ? error.message : "Unable to refresh admin panel.");
      });
    },
  });

  const historyNavigation = initHistory({ showView: navigation.showView });
  initStats(historyNavigation);

  loadAdminPanel({ openGameModal, historyNavigation }).catch((error) => {
    alert(error instanceof Error ? error.message : "Unable to load admin panel.");
  });
}
