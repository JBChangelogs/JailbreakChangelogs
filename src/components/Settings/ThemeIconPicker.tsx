"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Custom themes without an icon show this one. */
export const DEFAULT_THEME_ICON = "lucide:palette";

// Written out in full so the icon bundle picks them up.
const ICONS = [
  "lucide:palette",
  "lucide:moon",
  "lucide:sun",
  "lucide:star",
  "lucide:heart",
  "lucide:flame",
  "lucide:leaf",
  "lucide:snowflake",
  "lucide:ghost",
  "lucide:cat",
  "lucide:zap",
  "lucide:sparkles",
  "lucide:gem",
  "lucide:crown",
  "lucide:rocket",
  "lucide:music",
  "lucide:coffee",
  "lucide:cloud",
  "lucide:droplet",
  "lucide:flower-2",
  "lucide:skull",
  "lucide:gamepad-2",
  "lucide:car",
  "lucide:shield",
  "boxicons:bomb",
  "emojione-monotone:biohazard",
  "la:radiation",
];

/** Picks a custom theme's icon; null means the default palette. */
export default function ThemeIconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const pick = (icon: string | null) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            aria-label="Theme icon"
            className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus-visible:ring-border-focus flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon
              icon={value ?? DEFAULT_THEME_ICON}
              aria-hidden="true"
              className="size-5"
            />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Choose an icon</TooltipContent>
      </Tooltip>
      {/* Above dialogs and sheets (z-10000), like the color picker. */}
      <PopoverContent align="start" className="z-[10001] w-auto p-2">
        <div
          role="listbox"
          aria-label="Icons"
          className="grid grid-cols-8 gap-1"
        >
          {ICONS.map((icon) => {
            const selected = (value ?? DEFAULT_THEME_ICON) === icon;
            return (
              <button
                key={icon}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={icon.split(":")[1].replace(/-\d+$/, "")}
                onClick={() => pick(icon === DEFAULT_THEME_ICON ? null : icon)}
                className={cn(
                  "focus-visible:ring-border-focus flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  selected
                    ? "bg-button-info text-form-button-text"
                    : "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text",
                )}
              >
                <Icon icon={icon} aria-hidden="true" className="size-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
