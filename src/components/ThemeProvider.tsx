"use client";

import { ThemeProvider as MuiThemeProvider } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return <MuiThemeProvider theme={darkTheme}>{children}</MuiThemeProvider>;
}
