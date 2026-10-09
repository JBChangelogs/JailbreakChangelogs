import {
  Mic,
  Cat,
  Ghost,
  Moon,
  MoonStar,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Theme } from "@/contexts/ThemeContext";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

interface ThemePreview {
  page: string;
  card: string;
  text: string;
  muted: string;
  button: string;
  link: string;
}

/**
 * The themes in the order the picker shows them. Each preview lists the
 * theme's main colors, copied from globals.css: the Halloween theme is set on
 * the page root, so a preview can't read it live. Keep them in step.
 */
export const THEME_OPTIONS: {
  value: Theme;
  label: string;
  icon: LucideIcon;
  preview: ThemePreview;
}[] = [
  {
    value: "hatsune-miku",
    label: "Hatsune Miku",
    icon: Mic,
    preview: {
      page: "#1b1e20",
      card: "#232729",
      text: "#ffffff",
      muted: "#bec8d1",
      button: "#137a7f",
      link: "#86cecb",
    },
  },
  {
    value: "catppuccin-latte",
    label: "Catppuccin Latte",
    icon: Cat,
    preview: {
      page: "#eff1f5",
      card: "#e6e9ef",
      text: "#4c4f69",
      muted: "#5c5f77",
      button: "#8839ef",
      link: "color-mix(in srgb, #8839ef 98%, black)",
    },
  },
  {
    value: "halloween",
    label: "Halloween",
    icon: Ghost,
    preview: {
      page: "#140f10",
      card: "#1d1517",
      text: "#ffffff",
      muted: "hsl(214 16% 64%)",
      button: "#bb0d00",
      link: "#ff877d",
    },
  },
  {
    value: "catppuccin",
    label: "Catppuccin Mocha",
    icon: Cat,
    preview: {
      page: "#1e1e2e",
      card: "#181825",
      text: "#cdd6f4",
      muted: "#bac2de",
      button: "#cba6f7",
      link: "#cba6f7",
    },
  },
  {
    value: "amoled",
    label: "AMOLED",
    icon: MoonStar,
    preview: {
      page: "#000000",
      card: "#0a0a0a",
      text: "#ffffff",
      muted: "hsl(214 16% 64%)",
      button: "hsl(210 80% 32%)",
      link: "hsl(210 100% 70%)",
    },
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    preview: {
      page: "#121317",
      card: "#17181d",
      text: "#ffffff",
      muted: "hsl(214 16% 64%)",
      button: "hsl(210 99% 35%)",
      link: "hsl(210 100% 70%)",
    },
  },
  {
    value: "light",
    label: "Light",
    icon: Sun,
    preview: {
      page: "#ffffff",
      card: "hsl(240 5% 94%)",
      text: "hsl(240 8% 9%)",
      muted: "hsl(214 16% 36%)",
      button: "hsl(210 99% 35%)",
      link: "hsl(210 99% 40%)",
    },
  },
];

export const themeOption = (theme: Theme) =>
  THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[1];

const SHORTCUT_HIDDEN_KEY = "theme-shortcut-hidden";
const SHORTCUT_EVENT = "themeShortcutChanged";

/** Whether the header's theme button is turned off on this browser. */
export function getThemeShortcutHidden(): boolean {
  return safeLocalStorage.getItem(SHORTCUT_HIDDEN_KEY) === "true";
}

export function setThemeShortcutHidden(hidden: boolean) {
  safeLocalStorage.setItem(SHORTCUT_HIDDEN_KEY, String(hidden));
  window.dispatchEvent(new Event(SHORTCUT_EVENT));
}

export function subscribeThemeShortcut(onChange: () => void) {
  window.addEventListener(SHORTCUT_EVENT, onChange);
  return () => window.removeEventListener(SHORTCUT_EVENT, onChange);
}
