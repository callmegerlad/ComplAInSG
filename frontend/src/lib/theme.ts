export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "complainsg-theme";

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getStoredTheme(): ThemeMode | null {
  if (!canUseDom()) {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

export function getPreferredTheme(): ThemeMode {
  const stored = getStoredTheme();

  if (stored) {
    return stored;
  }

  if (
    canUseDom() &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function applyTheme(theme: ThemeMode): void {
  if (!canUseDom()) {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme(): ThemeMode {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
}
