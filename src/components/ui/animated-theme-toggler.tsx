"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getThemeShortcutHidden,
  subscribeThemeShortcut,
  themeOption,
} from "@/utils/ui/themeOptions";

// The Display card, where the theme picker sits first.
const THEME_SETTINGS_HREF = "/settings?highlight=display#display";

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
  const { theme } = useTheme();
  const hidden = useSyncExternalStore(
    subscribeThemeShortcut,
    getThemeShortcutHidden,
    () => false,
  );
  if (hidden) return null;

  const { icon: ThemeIcon, label } = themeOption(theme);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={THEME_SETTINGS_HREF}
          aria-label={`Change theme (current: ${label})`}
          className={cn(
            "text-primary-text hover:bg-quaternary-bg flex items-center justify-center rounded-lg transition-colors duration-200",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className,
          )}
        >
          <ThemeIcon
            aria-hidden="true"
            className={size === "sm" ? "size-4" : "size-5"}
          />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Change theme · {label}</TooltipContent>
    </Tooltip>
  );
};
