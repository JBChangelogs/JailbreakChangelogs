"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  size?: "sm" | "md";
}

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
  >
    <g fill="currentColor">
      <path d="M184 128a56 56 0 1 1-56-56a56 56 0 0 1 56 56" opacity=".2" />
      <path d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0m72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64m-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48M58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32M192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72m5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8m80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8m112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16" />
    </g>
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
  >
    <g fill="currentColor">
      <path
        d="M227.89 147.89A96 96 0 1 1 108.11 28.11a96.09 96.09 0 0 0 119.78 119.78"
        opacity=".2"
      />
      <path d="M233.54 142.23a8 8 0 0 0-8-2a88.08 88.08 0 0 1-109.8-109.8a8 8 0 0 0-10-10a104.84 104.84 0 0 0-52.91 37A104 104 0 0 0 136 224a103.1 103.1 0 0 0 62.52-20.88a104.84 104.84 0 0 0 37-52.91a8 8 0 0 0-1.98-7.98m-44.64 48.11A88 88 0 0 1 65.66 67.11a89 89 0 0 1 31.4-26A106 106 0 0 0 96 56a104.11 104.11 0 0 0 104 104a106 106 0 0 0 14.92-1.06a89 89 0 0 1-26.02 31.4" />
    </g>
  </svg>
);

const MoonStarsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
  >
    <g fill="currentColor">
      <path
        d="M210.69 158.18A88 88 0 1 1 97.82 45.31A96.08 96.08 0 0 0 192 160a97 97 0 0 0 18.69-1.82"
        opacity=".2"
      />
      <path d="M240 96a8 8 0 0 1-8 8h-16v16a8 8 0 0 1-16 0v-16h-16a8 8 0 0 1 0-16h16V72a8 8 0 0 1 16 0v16h16a8 8 0 0 1 8 8m-96-40h8v8a8 8 0 0 0 16 0v-8h8a8 8 0 0 0 0-16h-8v-8a8 8 0 0 0-16 0v8h-8a8 8 0 0 0 0 16m72.77 97a8 8 0 0 1 1.43 8A96 96 0 1 1 95.07 37.8a8 8 0 0 1 10.6 9.06a88.07 88.07 0 0 0 103.47 103.47a8 8 0 0 1 7.63 2.67m-19.39 14.88c-1.79.09-3.59.14-5.38.14A104.11 104.11 0 0 1 88 64c0-1.79 0-3.59.14-5.38a80 80 0 1 0 109.24 109.24Z" />
    </g>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
  >
    <path
      fill="currentColor"
      d="M229.66 77.66l-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69L218.34 66.34a8 8 0 0 1 11.32 11.32"
    />
  </svg>
);

const THEMES = [
  { value: "light" as const, label: "Light", Icon: SunIcon },
  { value: "dark" as const, label: "Dark", Icon: MoonIcon },
  { value: "amoled" as const, label: "AMOLED", Icon: MoonStarsIcon },
];

export const AnimatedThemeToggler = ({
  className,
  size = "md",
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const selectTheme = (newTheme: "light" | "dark" | "amoled") => {
    setTheme(newTheme);
    setOpen(false);
  };

  const CurrentIcon =
    theme === "light" ? SunIcon : theme === "dark" ? MoonIcon : MoonStarsIcon;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "border-border-card bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex cursor-pointer items-center justify-center rounded-lg border transition-all duration-200",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className,
          )}
          aria-label="Change theme"
          {...props}
        >
          <CurrentIcon className={cn("text-primary-text", iconSize)} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-44 p-1">
        {THEMES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => selectTheme(value)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              theme === value
                ? "text-status-info"
                : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {theme === value && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
