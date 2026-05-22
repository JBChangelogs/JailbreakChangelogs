"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/safeStorage";

export type Theme = "light" | "dark" | "og";

// used during theme toggle to cycle through themes
// order determines the cycle order during theme toggle.
// first theme refers to the default.
export const AvailableThemes: Theme[] = ["dark", "light", "og"] as const;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return AvailableThemes[0];

    const savedTheme = safeLocalStorage.getItem("theme") as Theme | "system";
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
    }

    if (savedTheme && AvailableThemes.includes(savedTheme)) {
      return savedTheme as Theme;
    }

    return AvailableThemes[0];
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const resolvedTheme = theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...AvailableThemes);
    root.classList.add(theme);
    safeLocalStorage.setItem("theme", theme);
  }, [theme]);

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
