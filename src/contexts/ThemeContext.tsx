"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { debounce } from "@/utils/helpers/debounce";

type Theme = "light" | "dark";

// Spamming the toggle shouldn't spam the realtime WS with one
// "set_preference" message per click — wait for clicks to settle first.
const THEME_SYNC_DEBOUNCE_MS = 500;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = safeLocalStorage.getItem("theme");
    const hasBeenMigrated = safeLocalStorage.getItem(
      "theme-christmas-removal-migration",
    );

    // One-time migration: if user has Christmas theme but hasn't been migrated yet,
    // switch them to dark theme
    if (!hasBeenMigrated && savedTheme === "christmas") {
      safeLocalStorage.setItem("theme-christmas-removal-migration", "done");
      safeLocalStorage.setItem("theme", "dark");
      return "dark";
    }

    // Mark migration as done for users who already had light/dark theme or no theme
    if (!hasBeenMigrated) {
      safeLocalStorage.setItem("theme-christmas-removal-migration", "done");
    }

    if (savedTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const migratedTheme = prefersDark ? "dark" : "light";
      safeLocalStorage.setItem("theme", migratedTheme);
      return migratedTheme;
    } else if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      return savedTheme as Theme;
    }

    return "dark";
  };

  // Always start with "dark" to match the server render and avoid hydration
  // mismatches. The actual theme is read from localStorage in useEffect below.
  const [theme, setThemeState] = useState<Theme>("dark");
  const resolvedTheme = theme;

  const dispatchThemeSyncRef = useRef(
    debounce((newTheme: Theme) => {
      window.dispatchEvent(
        new CustomEvent("sendRealtimePreference", {
          detail: { key: "theme", value: newTheme },
        }),
      );
    }, THEME_SYNC_DEBOUNCE_MS),
  );

  useEffect(() => {
    const savedTheme = getInitialTheme();
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    safeLocalStorage.setItem("theme", theme);
  }, [theme]);

  // Apply incoming preference syncs from other devices without re-broadcasting
  useEffect(() => {
    const handlePreferenceUpdate = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (key === "theme" && (value === "light" || value === "dark")) {
        setThemeState(value);
      }
    };
    const handlePreferences = (e: Event) => {
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.theme;
      if (incoming === "light" || incoming === "dark") {
        setThemeState(incoming);
      }
    };
    window.addEventListener("realtimePreference", handlePreferenceUpdate);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreferenceUpdate);
      window.removeEventListener("realtimePreferences", handlePreferences);
    };
  }, []);

  // User-initiated theme change — apply locally right away, but debounce the
  // WS sync so rapid toggling doesn't fire a "set_preference" per click.
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    dispatchThemeSyncRef.current(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
