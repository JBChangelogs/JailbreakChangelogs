"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { safeLocalStorage } from "@/utils/safeStorage";

type Theme = "light" | "dark" | "christmas";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark" | "christmas";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "christmas";

    const savedTheme = safeLocalStorage.getItem("theme");

    if (savedTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const migratedTheme = prefersDark ? "dark" : "light";
      safeLocalStorage.setItem("theme", migratedTheme);
      return migratedTheme;
    } else if (
      savedTheme &&
      ["light", "dark", "christmas"].includes(savedTheme)
    ) {
      return savedTheme as Theme;
    }

    return "christmas";
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const resolvedTheme = theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "christmas");
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
