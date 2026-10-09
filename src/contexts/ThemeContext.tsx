"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { debounce } from "@/utils/helpers/debounce";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

/** "halloween" is the temporary seasonal theme (see globals.css). */
const THEMES = [
  "halloween",
  "dark",
  "light",
  "amoled",
  "catppuccin",
  "catppuccin-latte",
  "future-tone",
] as const;
export type Theme = (typeof THEMES)[number];
/** For visitors who haven't picked a theme; THEME_INIT_SCRIPT matches it. */
const DEFAULT_THEME: Theme = "halloween";

const isTheme = (value: unknown): value is Theme =>
  THEMES.includes(value as Theme);

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
  if (typeof window === "undefined") return DEFAULT_THEME;

  const savedTheme = safeLocalStorage.getItem("theme");

  if (savedTheme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const migratedTheme = prefersDark ? "dark" : "light";
    safeLocalStorage.setItem("theme", migratedTheme);
    return migratedTheme;
  } else if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const resolvedTheme: "light" | "dark" =
    theme === "light" || theme === "catppuccin-latte" ? "light" : "dark";

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
    const cached = getCachedPreference("theme");
    if (isTheme(cached)) {
      setThemeState(cached);
      return;
    }
    const savedTheme = getInitialTheme();
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === null) return;
    const root = document.documentElement;
    root.classList.remove(...THEMES);
    root.classList.add(theme);
    if (theme === "catppuccin-latte") root.classList.add("light");
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
      if (key === "theme" && !isBlocked() && isTheme(value)) {
        setThemeState(value);
      }
    };
    const handlePreferences = (e: Event) => {
      if (isBlocked()) return;
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.theme;
      if (isTheme(incoming)) {
        setThemeState(incoming);
      } else {
        safeLocalStorage.removeItem("theme");
        setThemeState(DEFAULT_THEME);
      }
    };
    const handlePreferenceDeleted = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== "theme" || isBlocked()) return;
      safeLocalStorage.removeItem("theme");
      setThemeState(DEFAULT_THEME);
    };
    window.addEventListener("realtimePreference", handlePreferenceUpdate);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    return () => {
      window.removeEventListener("realtimePreference", handlePreferenceUpdate);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
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
    <ThemeContext.Provider
      value={{ theme: theme ?? DEFAULT_THEME, setTheme, resolvedTheme }}
    >
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
