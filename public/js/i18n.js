const STORAGE_KEY = "gry.locale";

const translations = {
  pl: {
    appTitle: "System wynikow",
    navAdd: "Dodaj rozgrywke",
    navStats: "Statystyki",
    navHistory: "Historia",
    navAdmin: "Admin panel",
    langLabel: "PL",
    settingsLabel: "Wyglad",
    settingsTitle: "Ustawienia wygladu",
    settingsTheme: "Kolory",
    settingsFont: "Font",
    settingsDensity: "Rozmiar",
    settingsAccent: "Kolor bazowy",
    themeOcean: "Ocean",
    themeForest: "Forest",
    themeMono: "Mono",
    fontSans: "Sans",
    fontSerif: "Serif",
    fontRounded: "Rounded",
    densityCompact: "Maly",
    densityComfort: "Sredni",
    densityLarge: "Duzy",
    addViewTitle: "Dodaj rozgrywke",
    gameLabel: "Gra",
    gamePlaceholder: "Nazwa gry...",
    maxPlayersLabel: "Liczba graczy",
    maxPlayersPlaceholder: "Maksymalna liczba graczy",
    playerCountPlaceholder: "Liczba graczy",
    playersLabel: "Gracze:",
    addMatch: "Dodaj rozgrywke",
    statsTitle: "Statystyki",
    statsScopeGame: "Dla gry",
    statsScopeType: "Dla typu gry",
    searchGamePlaceholder: "Szukaj gry...",
    selectGameType: "Wybierz typ gry...",
    gameTypeBoard: "Planszowa",
    gameTypeCard: "Karciana",
    gameTypeComputer: "Komputerowa",
    search: "Szukaj",
    colPlayer: "Gracz",
    colRange: "Zakres",
    colPoints: "Punkty",
    colAvgPoints: "Sr. pkt",
    colWins: "Zwyciestwa",
    colPlayed: "Ilosc gier",
    colWinrate: "Winrate",
    noData: "Brak danych",
    historyTitle: "Historia rozgrywek",
    historyRecent: "Ostatnie rozgrywki",
    historyGame: "Wg gry",
    historyPlayer: "Wg gracza",
    loadRecent: "Zaladuj ostatnie rozgrywki",
    colDate: "Data",
    colGame: "Gra",
    colWinner: "Zwyciezca",
    colPlayers: "Graczy",
    colResults: "Wyniki",
    loadHint: "Kliknij \"Zaladuj\" aby pobrac dane",
    historyGamePlaceholder: "Nazwa gry...",
    historyGameHint: "Wpisz nazwe gry i kliknij \"Szukaj\"",
    historyPlayerPlaceholder: "Nick gracza...",
    historyPlayerHint: "Wpisz nick gracza i kliknij \"Szukaj\"",
    adminTitle: "Admin panel",
    adminPlayers: "Gracze",
    adminGames: "Gry",
    adminMatches: "Rozgrywki",
    addPlayer: "Dodaj gracza",
    addPlayerTitle: "Dodaj gracza",
    editPlayerTitle: "Modyfikuj gracza",
    playerNameLabel: "Nick gracza",
    playerNamePlaceholder: "Nick gracza...",
    addGame: "Dodaj gre",
    editGameTitle: "Modyfikuj gre",
    addMatchAdmin: "Dodaj rozgrywke",
    colId: "ID",
    colNick: "Nick",
    colActions: "Akcje",
    colName: "Nazwa",
    colType: "Rodzaj",
    colMin: "Min",
    colMax: "Max",
    colWinType: "Wygrana",
    edit: "Modyfikuj",
    delete: "Usun",
    save: "Zapisz",
    cancel: "Anuluj",
    addNewGame: "Dodaj nowa gre",
    gameName: "Nazwa gry",
    gameType: "Typ gry",
    minPlayers: "Minimalna liczba graczy",
    maxPlayersText: "Maksymalna liczba graczy",
    minPlayersPlaceholder: "Min. graczy",
    maxPlayersPlaceholderGame: "Maks. graczy",
    winType: "Rodzaj wygranej",
    winPoint: "Punktowa",
    winDecreasing: "Punktowa malejaca",
    winOther: "Inna",
    saveResults: "Zapisz wyniki",
    matchResults: "Wyniki rozgrywki",
    chooseWinner: "Zwyciezca",
    saved: "Zapisano zmiany.",
    deleted: "Usunieto rekord.",
    confirmDelete: "Czy na pewno chcesz usunac ten rekord?",
    loadError: "Nie mozna pobrac danych.",
    noGames: "Brak rozgrywek",
    noGamesForItem: "Brak rozgrywek dla tej gry",
    noPlayersForItem: "Brak rozgrywek dla tego gracza",
    loading: "Ladowanie...",
    enterGameName: "Nazwa gry musi miec od 2 do 100 znakow.",
    enterType: "Wybierz typ gry.",
    enterMinPlayers: "Podaj poprawna minimalna liczbe graczy.",
    enterMaxPlayers: "Podaj poprawna maksymalna liczbe graczy.",
    minPlayersGreater: "Minimum nie moze byc wieksze od maksimum.",
    maxPlayersLower: "Maksimum nie moze byc mniejsze od minimum.",
    enterWinType: "Wybierz rodzaj wygranej.",
    statsUnavailable: "Nie mozna teraz pobrac statystyk.",
    addPlayerSuccess: "Dodano gracza",
    playerExists: "Gracz o takim nicku juz istnieje.",
    gameExists: "Gra o takiej nazwie juz istnieje.",
    gameAdded: "Dodano nowa gre.",
    gameUpdated: "Zapisano zmiany gry.",
    gameSaveError: "Nie udalo sie zapisac gry.",
    matchAdded: "Dodano rozgrywke do bazy.",
    selectExistingGame: "Wybierz istniejaca gre z bazy albo dodaj ja najpierw.",
    chooseWinnerError: "Wybierz zwyciezce rozgrywki.",
    duplicatePlayer: "Ten sam gracz nie moze byc dodany dwa razy.",
    playerNameLength: "nazwa musi miec od 2 do 100 znakow.",
    scoreMin: "podaj liczbe punktow 0 lub wieksza.",
    playerPrefix: "Gracz",
    noScoreData: "Brak wynikow",
    add: "Dodaj",
  },
  en: {
    appTitle: "Score system",
    navAdd: "Add match",
    navStats: "Stats",
    navHistory: "History",
    navAdmin: "Admin panel",
    langLabel: "ENG",
    settingsLabel: "Appearance",
    settingsTitle: "Appearance settings",
    settingsTheme: "Colors",
    settingsFont: "Font",
    settingsDensity: "Size",
    settingsAccent: "Base color",
    themeOcean: "Ocean",
    themeForest: "Forest",
    themeMono: "Mono",
    fontSans: "Sans",
    fontSerif: "Serif",
    fontRounded: "Rounded",
    densityCompact: "Compact",
    densityComfort: "Comfort",
    densityLarge: "Large",
    addViewTitle: "Add match",
    gameLabel: "Game",
    gamePlaceholder: "Game name...",
    maxPlayersLabel: "Players",
    maxPlayersPlaceholder: "Max players",
    playerCountPlaceholder: "Player count",
    playersLabel: "Players:",
    addMatch: "Add match",
    statsTitle: "Statistics",
    statsScopeGame: "By game",
    statsScopeType: "By game type",
    searchGamePlaceholder: "Search game...",
    selectGameType: "Choose game type...",
    gameTypeBoard: "Board",
    gameTypeCard: "Card",
    gameTypeComputer: "Computer",
    search: "Search",
    colPlayer: "Player",
    colRange: "Range",
    colPoints: "Points",
    colAvgPoints: "Avg pts",
    colWins: "Wins",
    colPlayed: "Games",
    colWinrate: "Win rate",
    noData: "No data",
    historyTitle: "Match history",
    historyRecent: "Recent matches",
    historyGame: "By game",
    historyPlayer: "By player",
    loadRecent: "Load recent matches",
    colDate: "Date",
    colGame: "Game",
    colWinner: "Winner",
    colPlayers: "Players",
    colResults: "Results",
    loadHint: "Click \"Load\" to fetch data",
    historyGamePlaceholder: "Game name...",
    historyGameHint: "Enter a game name and click \"Search\"",
    historyPlayerPlaceholder: "Player nick...",
    historyPlayerHint: "Enter a player nick and click \"Search\"",
    adminTitle: "Admin panel",
    adminPlayers: "Players",
    adminGames: "Games",
    adminMatches: "Matches",
    addPlayer: "Add player",
    addPlayerTitle: "Add player",
    editPlayerTitle: "Edit player",
    playerNameLabel: "Player nick",
    playerNamePlaceholder: "Player nick...",
    addGame: "Add game",
    editGameTitle: "Edit game",
    addMatchAdmin: "Add match",
    colId: "ID",
    colNick: "Nick",
    colActions: "Actions",
    colName: "Name",
    colType: "Type",
    colMin: "Min",
    colMax: "Max",
    colWinType: "Win type",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    addNewGame: "Add new game",
    gameName: "Game name",
    gameType: "Game type",
    minPlayers: "Minimum players",
    maxPlayersText: "Maximum players",
    minPlayersPlaceholder: "Min players",
    maxPlayersPlaceholderGame: "Max players",
    winType: "Win type",
    winPoint: "Points",
    winDecreasing: "Decreasing points",
    winOther: "Other",
    saveResults: "Save results",
    matchResults: "Match results",
    chooseWinner: "Winner",
    saved: "Changes saved.",
    deleted: "Record deleted.",
    confirmDelete: "Are you sure you want to delete this record?",
    loadError: "Unable to load data.",
    noGames: "No matches",
    noGamesForItem: "No matches for this game",
    noPlayersForItem: "No matches for this player",
    loading: "Loading...",
    enterGameName: "Game name must be between 2 and 100 characters.",
    enterType: "Choose a game type.",
    enterMinPlayers: "Enter a valid minimum player count.",
    enterMaxPlayers: "Enter a valid maximum player count.",
    minPlayersGreater: "Minimum cannot be greater than maximum.",
    maxPlayersLower: "Maximum cannot be lower than minimum.",
    enterWinType: "Choose a win type.",
    statsUnavailable: "Unable to load stats right now.",
    addPlayerSuccess: "Player added",
    playerExists: "A player with this nick already exists.",
    gameExists: "A game with this name already exists.",
    gameAdded: "New game added.",
    gameUpdated: "Game changes saved.",
    gameSaveError: "Unable to save the game.",
    matchAdded: "Match added to the database.",
    selectExistingGame: "Pick an existing game or add it first.",
    chooseWinnerError: "Choose the match winner.",
    duplicatePlayer: "The same player cannot be added twice.",
    playerNameLength: "name must be between 2 and 100 characters.",
    scoreMin: "enter a score of 0 or greater.",
    playerPrefix: "Player",
    noScoreData: "No results",
    add: "Add",
  },
};

let currentLocale = localStorage.getItem(STORAGE_KEY) || "pl";

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  currentLocale = locale === "en" ? "en" : "pl";
  localStorage.setItem(STORAGE_KEY, currentLocale);
  document.documentElement.lang = currentLocale;
  applyTranslations();
  window.dispatchEvent(new Event("language-changed"));
}

export function t(key) {
  return translations[currentLocale]?.[key] ?? translations.pl[key] ?? key;
}

export function formatGameType(value) {
  if (value === "planszowa") return t("gameTypeBoard");
  if (value === "karciana") return t("gameTypeCard");
  if (value === "komputerowa") return t("gameTypeComputer");
  return value ? String(value) : "-";
}

export function formatWinType(value) {
  if (value === "punktowa") return t("winPoint");
  if (value === "punktowa-malejaca") return t("winDecreasing");
  if (value === "inna") return t("winOther");
  return value ? String(value) : "-";
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(currentLocale === "en" ? "en-GB" : "pl-PL", {
    timeZone: "Europe/Warsaw",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  const languageToggle = document.querySelector("#languageToggle");
  if (languageToggle) languageToggle.textContent = t("langLabel");
  const appearanceToggle = document.querySelector("#appearanceToggle");
  if (appearanceToggle) appearanceToggle.textContent = t("settingsLabel");
  const appearanceClose = document.querySelector("#appearanceClose");
  if (appearanceClose) appearanceClose.textContent = t("cancel");
}

export function initI18n() {
  document.documentElement.lang = currentLocale;
  applyTranslations();
}
