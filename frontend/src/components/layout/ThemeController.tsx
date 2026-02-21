"use client";

import { useEffect } from "react";
import {
  SETTINGS_KEY,
  SETTINGS_UPDATED_EVENT,
  applyThemeSettings,
  readThemeSettings,
} from "@/lib/settings";

export function ThemeController() {
  useEffect(() => {
    const initial = readThemeSettings();
    applyThemeSettings(initial.themeMode, initial.themeAccent);

    function refreshTheme() {
      const current = readThemeSettings();
      applyThemeSettings(current.themeMode, current.themeAccent);
    }

    function onStorage(event: StorageEvent) {
      if (event.key === SETTINGS_KEY) refreshTheme();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_UPDATED_EVENT, refreshTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, refreshTheme);
    };
  }, []);

  return null;
}
