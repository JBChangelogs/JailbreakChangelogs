"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

type Theme = "og" | "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "og" | "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "og";

    const savedTheme = safeLocalStorage.getItem("theme");
    // const hasBeenMigrated = safeLocalStorage.getItem(
    //   "theme-christmas-removal-migration",
    // );

    // // One-time migration: if user has Christmas theme but hasn't been migrated yet,
    // // switch them to dark theme
    // // if (!hasBeenMigrated && savedTheme === "christmas") {
    // //   safeLocalStorage.setItem("theme-christmas-removal-migration", "done");
    // //   safeLocalStorage.setItem("theme", "dark");
    // //   return "dark";
    // // }

    // // Mark migration as done for users who already had light/dark theme or no theme
    // if (!hasBeenMigrated) {
    //   safeLocalStorage.setItem("theme-christmas-removal-migration", "done");
    // }

    if (savedTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const migratedTheme = prefersDark ? "dark" : "light";
      safeLocalStorage.setItem("theme", migratedTheme);
      return migratedTheme;
    } else if (savedTheme && ["light", "dark", "og"].includes(savedTheme)) {
      return savedTheme as Theme;
    }

    return "dark";
  };

  // Always start with "dark" to match the server render and avoid hydration
  // mismatches. The actual theme is read from localStorage in useEffect below.
  const [theme, setThemeState] = useState<Theme>("dark");
  const resolvedTheme = theme;

  useEffect(() => {
    const savedTheme = getInitialTheme();
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("og", "dark", "light");
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

  // User-initiated theme change — apply locally and sync to other devices via WS
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "theme", value: newTheme },
      }),
    );
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
