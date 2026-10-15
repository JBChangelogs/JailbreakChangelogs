"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import { debounce } from "@/utils/helpers/debounce";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";
import type { ThemeOption } from "@/utils/ui/themeOptions";
import type { CustomTheme } from "@/utils/api/userThemes";
import {
  getCustomTheme,
  getPreviewScheme,
  setCustomTheme,
  subscribeCustomTheme,
  syncCustomThemePreferences,
} from "@/utils/ui/customTheme";

/** A theme slug; the dashboard manages the list. */
export type Theme = string;

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
  /** Every enabled theme, in picker order. */
  themes: ThemeOption[];
  /** A user-made theme drawn over `theme`, or null. Picking a site theme clears it. */
  customTheme: CustomTheme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(
  isTheme: (value: unknown) => value is Theme,
  defaultTheme: Theme,
): Theme {
  if (typeof window === "undefined") return defaultTheme;

  const savedTheme = safeLocalStorage.getItem("theme");

  if (savedTheme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const migratedTheme = prefersDark ? "dark" : "light";
    safeLocalStorage.setItem("theme", migratedTheme);
    return isTheme(migratedTheme) ? migratedTheme : defaultTheme;
  } else if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return defaultTheme;
}

export function ThemeProvider({
  children,
  themes,
  defaultTheme,
}: {
  children: React.ReactNode;
  themes: ThemeOption[];
  /** For visitors who haven't picked a theme; the init script matches it. */
  defaultTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const isTheme = useCallback(
    (value: unknown): value is Theme =>
      themes.some((option) => option.value === value),
    [themes],
  );
  const customTheme = useSyncExternalStore(
    subscribeCustomTheme,
    getCustomTheme,
    () => null,
  );
  const resolvedTheme =
    customTheme?.scheme ??
    themes.find((option) => option.value === (theme ?? defaultTheme))?.scheme ??
    "dark";

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
    const savedTheme = getInitialTheme(isTheme, defaultTheme);
    setThemeState(savedTheme);
  }, [isTheme, defaultTheme]);

  useEffect(() => {
    if (theme === null) return;
    const root = document.documentElement;
    root.classList.remove(...themes.map((option) => option.value));
    root.classList.add(theme);
    // A previewed theme (editor, shared link) keeps its own light/dark.
    root.dataset.scheme = getPreviewScheme() ?? resolvedTheme;
    safeLocalStorage.setItem("theme", theme);
  }, [theme, themes, resolvedTheme]);

  useEffect(syncCustomThemePreferences, []);

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
        setThemeState(defaultTheme);
      }
    };
    const handlePreferenceDeleted = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== "theme" || isBlocked()) return;
      safeLocalStorage.removeItem("theme");
      setThemeState(defaultTheme);
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
  }, [isTheme, defaultTheme]);

  // User-initiated theme change — apply locally right away, stamp the change
  // time so WS echoes can't revert it, and debounce the actual WS dispatch.
  const setTheme = (newTheme: Theme) => {
    if (getCustomTheme()) setCustomTheme(null);
    if (newTheme === theme) return;
    lastUserChangeRef.current = Date.now();
    setThemeState(newTheme);
    dispatchThemeSyncRef.current(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: theme ?? defaultTheme,
        setTheme,
        resolvedTheme,
        themes,
        customTheme,
      }}
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
