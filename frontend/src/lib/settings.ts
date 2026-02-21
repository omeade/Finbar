export const SETTINGS_KEY = "finagent.settings";
export const SETTINGS_UPDATED_EVENT = "finagent:settings-updated";

export type ThemeMode = "light" | "dark";
export type ThemeAccent = "ocean" | "mint" | "sunset";

function sanitizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function sanitizeThemeAccent(value: unknown): ThemeAccent {
  if (value === "mint" || value === "sunset") return value;
  return "ocean";
}

export function readThemeSettings(): { themeMode: ThemeMode; themeAccent: ThemeAccent } {
  if (typeof window === "undefined") {
    return { themeMode: "light", themeAccent: "ocean" };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { themeMode: "light", themeAccent: "ocean" };
    const parsed = JSON.parse(raw) as { themeMode?: unknown; themeAccent?: unknown };
    return {
      themeMode: sanitizeThemeMode(parsed.themeMode),
      themeAccent: sanitizeThemeAccent(parsed.themeAccent),
    };
  } catch {
    return { themeMode: "light", themeAccent: "ocean" };
  }
}

export function applyThemeSettings(themeMode: ThemeMode, themeAccent: ThemeAccent): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = themeMode;
  root.dataset.accent = themeAccent;
  root.style.colorScheme = themeMode;
}
