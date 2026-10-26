"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_THEME_ICON } from "@/components/Settings/ThemeIconPicker";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getThemeShortcutHidden,
  subscribeThemeShortcut,
} from "@/utils/ui/themeOptions";

// The Themes card in settings.
const THEME_SETTINGS_HREF = "/settings?highlight=themes#themes";

interface ThemeShortcutProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * The header's theme button: shows the current theme and opens the theme
 * settings. Users can turn it off in those settings.
 */
export const ThemeShortcut = ({
  className,
  size = "md",
}: ThemeShortcutProps) => {
  const { theme, themes, customTheme } = useTheme();
  const hidden = useSyncExternalStore(
    subscribeThemeShortcut,
    getThemeShortcutHidden,
    () => false,
  );
  if (hidden) return null;

  // A custom theme in use shows its own icon and name.
  const site = themes.find((option) => option.value === theme) ?? themes[0];
  const { icon, label } = customTheme
    ? {
        icon: customTheme.icon ?? DEFAULT_THEME_ICON,
        label: customTheme.label,
      }
    : site;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={THEME_SETTINGS_HREF}
          aria-label={`Change theme (current: ${label})`}
          className={cn(
            "text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex items-center justify-center rounded-lg transition-colors duration-200",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className,
          )}
        >
          <Icon
            icon={icon}
            aria-hidden="true"
            className={size === "sm" ? "size-4" : "size-5"}
          />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">Change theme · {label}</TooltipContent>
    </Tooltip>
  );
};
