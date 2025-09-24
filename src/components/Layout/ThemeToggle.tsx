"use client";

import { useTheme } from "@/contexts/ThemeContext";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"));

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light" as const, label: "Light", icon: SunIcon },
    { value: "dark" as const, label: "Dark", icon: MoonIcon },
    { value: "system" as const, label: "System", icon: ComputerDesktopIcon },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || MoonIcon;

  const cycleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  return (
    <div className="relative">
      {/* Compact toggle button */}
      <Tooltip
        title={`Current: ${currentTheme?.label}. Click to cycle themes`}
        arrow
        placement="bottom"
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "var(--color-secondary-bg)",
              color: "var(--color-primary-text)",
              "& .MuiTooltip-arrow": {
                color: "var(--color-secondary-bg)",
              },
            },
          },
        }}
      >
        <button
          onClick={cycleTheme}
          className="border-border-primary bg-secondary-bg text-secondary-text hover:text-primary-text hover:bg-quaternary-bg flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <CurrentIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
