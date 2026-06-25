"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { debounce } from "@/utils/helpers/debounce";

type Theme = "light" | "dark" | "amoled";

// Spamming the toggle shouldn't spam the realtime WS with one
// "set_preference" message per click — wait for clicks to settle first.
const THEME_SYNC_DEBOUNCE_MS = 500;

// After a user-initiated change, ignore incoming WS preference echoes for this
// long. Covers the debounce window + a generous server round-trip buffer so a
// stale echo can't revert the theme the user just set.
const THEME_SYNC_BLOCK_MS = THEME_SYNC_DEBOUNCE_MS + 1000;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const savedTheme = safeLocalStorage.getItem("theme");

  if (savedTheme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const migratedTheme = prefersDark ? "dark" : "light";
    safeLocalStorage.setItem("theme", migratedTheme);
    return migratedTheme;
  } else if (savedTheme && ["light", "dark", "amoled"].includes(savedTheme)) {
    return savedTheme as Theme;
  }

  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "dark" to match the server render and avoid hydration
  // mismatches. The actual theme is read from localStorage in useEffect below.
  const [theme, setThemeState] = useState<Theme>("dark");
  const resolvedTheme: "light" | "dark" = theme === "light" ? "light" : "dark";

  // Timestamp of the last user-initiated change. Incoming WS echoes arriving
  // within THEME_SYNC_BLOCK_MS of this are ignored to prevent stale echoes
  // from reverting what the user just set.
  const lastUserChangeRef = useRef<number>(0);

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
    root.classList.remove("light", "dark", "amoled");
    root.classList.add(theme);
    safeLocalStorage.setItem("theme", theme);
  }, [theme]);

  // Apply incoming preference syncs from other devices without re-broadcasting.
  // Skip any echo that arrives while a local change is still in-flight.
  useEffect(() => {
    const isBlocked = () =>
      Date.now() - lastUserChangeRef.current < THEME_SYNC_BLOCK_MS;

    const handlePreferenceUpdate = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (
        key === "theme" &&
        !isBlocked() &&
        (value === "light" || value === "dark" || value === "amoled")
      ) {
        setThemeState(value);
      }
    };
    const handlePreferences = (e: Event) => {
      if (isBlocked()) return;
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.theme;
      if (
        incoming === "light" ||
        incoming === "dark" ||
        incoming === "amoled"
      ) {
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

  // User-initiated theme change — apply locally right away, stamp the change
  // time so WS echoes can't revert it, and debounce the actual WS dispatch.
  const setTheme = (newTheme: Theme) => {
    if (newTheme === theme) return;
    lastUserChangeRef.current = Date.now();
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
